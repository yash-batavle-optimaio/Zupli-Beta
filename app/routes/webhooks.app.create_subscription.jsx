import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { callShopAdminGraphQL } from "./utils/shopifyGraphql.server";
import { ensureRedisConnected } from "./utils/redis.server";
import { BILLING_PLANS, BILLING_DAYS } from "./config/billingPlans";

const BASE_USAGE_AMOUNT = BILLING_PLANS.STANDARD.basePrice;
const BILLING_CYCLE_DAYS = BILLING_DAYS;

export const loader = () =>
  new Response("Webhook endpoint. Use POST.", { status: 200 });

export const action = async ({ request }) => {
  let webhook;

  try {
    webhook = await authenticate.webhook(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, payload, shop } = webhook;

  if (topic !== "APP_SUBSCRIPTIONS_UPDATE") {
    return new Response("OK", { status: 200 });
  }

  const subscriptionId = payload?.app_subscription?.admin_graphql_api_id;

  if (!shop || !subscriptionId) {
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     0️⃣ Redis (connect once)
  ---------------------------------- */
  const redis = await ensureRedisConnected();

  /* ----------------------------------
     1️⃣ Offline session
  ---------------------------------- */
  const offlineSession = await prisma.session.findFirst({
    where: { shop, isOnline: false },
  });

  if (!offlineSession) {
    console.error("No offline session for", shop);
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     2️⃣ Fetch subscription
  ---------------------------------- */
  const GET_SUBSCRIPTION = `
    query GetSubscription($id: ID!) {
      node(id: $id) {
        ... on AppSubscription {
          id
          status
          createdAt
          trialDays
          lineItems {
            id
            plan {
              pricingDetails {
                __typename
              }
            }
          }
        }
      }
    }
  `;

  const result = await callShopAdminGraphQL({
    shopDomain: shop,
    accessToken: offlineSession.accessToken,
    query: GET_SUBSCRIPTION,
    variables: { id: subscriptionId },
  });

  const subscription = result?.node;

  if (!subscription || subscription.status !== "ACTIVE") {
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     3️⃣ Trial logic (same as confirm.jsx)
  ---------------------------------- */
  const storeInfo = await prisma.storeInfo.findUnique({
    where: { storeId: shop },
  });

  const now = new Date();
  let trialEnd = storeInfo?.trialEndsAt;

  if (!trialEnd && subscription.trialDays) {
    const trialStart = new Date(subscription.createdAt);
    trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + subscription.trialDays);
  }

  if (trialEnd && trialEnd > now) {
    // Redis: TRIAL tier
    const ttl = Math.ceil((trialEnd.getTime() - Date.now()) / 1000) + 3600;

    await redis.set(`applied_tier:${shop}`, "TRIAL", { EX: ttl });

    await redis.zAdd("store_expiry_queue", {
      score: trialEnd.getTime(),
      value: shop,
    });

    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
   🔒 3️⃣.5 ACTIVE CYCLE GUARD (CRITICAL)
---------------------------------- */
  const existingOpenCycle = await prisma.storeUsage.findFirst({
    where: {
      storeId: shop,
      subscriptionId,
      status: "OPEN",
      appliedTier: "STANDARD",
    },
  });

  if (existingOpenCycle) {
    console.log("ℹ️ Billing skipped: active cycle already exists", {
      shop,
      subscriptionId,
      cycleStart: existingOpenCycle.cycleStart,
    });

    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     4️⃣ Usage pricing line item
  ---------------------------------- */
  const usageLineItem = subscription.lineItems.find(
    (li) => li.plan.pricingDetails.__typename === "AppUsagePricing",
  );

  if (!usageLineItem) {
    console.error("No AppUsagePricing line item");
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     5️⃣ Billing window
  ---------------------------------- */
  const cycleStart = now;
  const cycleEnd = new Date(now);
  cycleEnd.setUTCDate(cycleEnd.getUTCDate() + BILLING_CYCLE_DAYS);

  /* ----------------------------------
     6️⃣ Discount logic (unchanged)
  ---------------------------------- */
  const discount = await prisma.storeDiscount.findFirst({
    where: {
      storeId: shop,
      isActive: true,
      cycleStart: { lte: cycleEnd },
      cycleEnd: { gte: cycleStart },
    },
  });

  let chargeAmount = BASE_USAGE_AMOUNT;

  if (discount) {
    if (discount.discountType === "FLAT") {
      chargeAmount -= discount.discountValue;
    }

    if (discount.discountType === "PERCENT") {
      const discountValue = Number(
        ((chargeAmount * discount.discountValue) / 100).toFixed(2),
      );
      chargeAmount -= discountValue;
    }
  }

  if (chargeAmount <= 0) {
    console.warn("Charge skipped due to discount");
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     7️⃣ Create Shopify usage charge
  ---------------------------------- */
  const CREATE_USAGE_CHARGE = `
    mutation CreateUsage(
      $lineItemId: ID!
      $price: MoneyInput!
      $description: String!
      $idempotencyKey: String!
    ) {
      appUsageRecordCreate(
        subscriptionLineItemId: $lineItemId
        price: $price
        description: $description
        idempotencyKey: $idempotencyKey
      ) {
        appUsageRecord { id }
        userErrors { message }
      }
    }
  `;

  const idempotencyKey = [
    "NEW_USAGE_CHARGE",
    shop,
    subscriptionId,
    "STANDARD",
  ].join(":");

  const chargeResult = await callShopAdminGraphQL({
    shopDomain: shop,
    accessToken: offlineSession.accessToken,
    query: CREATE_USAGE_CHARGE,
    variables: {
      lineItemId: usageLineItem.id,
      price: {
        amount: chargeAmount,
        currencyCode: "USD",
      },
      description: discount
        ? "Base usage fee (discount applied)"
        : "Base usage fee (webhook billing)",
      idempotencyKey,
    },
  });

  const errors = chargeResult?.appUsageRecordCreate?.userErrors;
  if (errors?.length) {
    console.error("Billing failed:", errors[0].message);
    return new Response("OK", { status: 200 });
  }

  /* ----------------------------------
     8️⃣ DB + Redis (ATOMIC INTENT)
  ---------------------------------- */
  await prisma.$transaction(async (tx) => {
    await tx.storeUsage.updateMany({
      where: { storeId: shop, status: "OPEN" },
      data: { status: "CLOSED" },
    });

    await tx.storeUsage.create({
      data: {
        storeId: shop,
        subscriptionId,
        subscriptionLineItemId: usageLineItem.id,
        cycleStart,
        cycleEnd,
        usageAmount: chargeAmount,
        status: "OPEN",
        appliedTier: "STANDARD",
      },
    });

    if (discount) {
      await tx.storeDiscount.update({
        where: { id: discount.id },
        data: {
          usageCount: { increment: 1 },
          ...(discount.usageType === "ONE_TIME"
            ? { usedAt: new Date(), isActive: false }
            : {}),
        },
      });
    }
  });

  /* ----------------------------------
     9️⃣ Redis FINAL STATE (CRITICAL)
  ---------------------------------- */
  const ttl = Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

  await redis.set(`applied_tier:${shop}`, "STANDARD", { EX: ttl });

  await redis.zAdd("store_expiry_queue", {
    score: cycleEnd.getTime(),
    value: shop,
  });

  // Optional but recommended
  await redis.set(`order_count:${shop}`, 0);

  console.log("✅ Webhook billing + Redis sync complete", {
    shop,
    chargeAmount,
  });

  return new Response("OK", { status: 200 });
};
