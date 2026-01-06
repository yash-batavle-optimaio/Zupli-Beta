import { json } from "@remix-run/node";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createUsageCharge } from "./utils/createUsageCharge.server";
import { useLoaderData } from "@remix-run/react";
import { redis } from "./utils/redis.server";

const BILLING_CYCLE_DAYS = 30;
const BASE_USAGE_AMOUNT = 15;

/* ---------------- UI ---------------- */
export default function BillingComplete() {
  const data = useLoaderData();

  useEffect(() => {
    if (data?.redirectTo) {
      // 🔥 REQUIRED: escape Shopify iframe
      window.open(data.redirectTo, "_top");
    }
  }, [data]);

  return null;
}

/* ---------------- Loader ---------------- */
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const now = new Date();

  const TIER_PRIORITY = {
    TRIAL: 0,
    STANDARD: 1,
    GROW: 2,
    ENTERPRISE: 3,
  };

  const storeInfo = await prisma.storeInfo.findUnique({
    where: { storeId: shop },
  });

  const isTrialActive = storeInfo?.trialEndsAt && storeInfo.trialEndsAt > now;

  const redirectToApp = () => {
    const storeHandle = shop.replace(".myshopify.com", "");
    return json({
      redirectTo: `https://admin.shopify.com/store/${storeHandle}/apps/zupli/app`,
    });
  };

  /* ----------------------------------
     1️⃣ Get subscription
  ---------------------------------- */
  const response = await admin.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
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
  `);

  const data = await response.json();
  const subscription =
    data?.data?.currentAppInstallation?.activeSubscriptions?.[0];

  if (!subscription) {
    throw new Error("No subscription found");
  }

  /* ----------------------------------
   2️⃣ TRIAL MODE (IMMUTABLE)
---------------------------------- */

  // 🔒 Trial end comes ONLY from DB if exists
  let trialEnd = storeInfo?.trialEndsAt;

  // 🟢 First-time trial → calculate once
  if (!trialEnd) {
    const trialStart = new Date(subscription.createdAt);
    trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + subscription.trialDays);
  }

  // 🛑 If trial is active, stop billing
  if (trialEnd && trialEnd > now) {
    const trialStart =
      storeInfo?.firstInstalledAt ?? new Date(subscription.createdAt);

    // 🔁 Ensure trial usage exists
    const existingTrial = await prisma.storeUsage.findFirst({
      where: {
        storeId: shop,
        usageAmount: 0,
        cycleEnd: trialEnd,
        status: "OPEN",
      },
    });

    if (!existingTrial) {
      await prisma.storeUsage.create({
        data: {
          storeId: shop,
          subscriptionId: subscription.id,
          subscriptionLineItemId: usageLineItem.id,
          cycleStart: trialStart,
          cycleEnd: trialEnd,
          usageAmount: 0,
          status: "OPEN",
          appliedTier: "TRIAL",
        },
      });
    }

    // 🧠 StoreInfo: set trial ONLY ONCE
    if (!storeInfo) {
      await prisma.storeInfo.create({
        data: {
          storeId: shop,
          // firstInstalledAt: now,
          // lastInstalledAt: now,
          trialUsed: true,
          trialEndsAt: trialEnd,
        },
      });
    } else {
      await prisma.storeInfo.update({
        where: { storeId: shop },
        data: {
          trialUsed: true,
          // lastInstalledAt: now,
          // updatedAt: now,
          // ⛔ DO NOT update trialEndsAt
        },
      });
    }

    // Single source of truth key
    const redisTierKey = `applied_tier:${shop}`;

    // TTL = trial end (+ 1 hour buffer)
    const ttlSeconds =
      Math.ceil((trialEnd.getTime() - Date.now()) / 1000) + 3600;

    // Always set (safe overwrite)
    await redis.set(redisTierKey, "TRIAL", {
      EX: ttlSeconds,
    });

    // ⏳ Expiry queue
    await redis.zAdd("store_expiry_queue", {
      score: trialEnd.getTime(),
      value: shop,
    });

    return redirectToApp();
  }

  // Trial over — proceed to normal billing

  /* ----------------------------------
     3️⃣ Usage pricing line item
  ---------------------------------- */
  const usageLineItem = subscription.lineItems.find(
    (li) => li.plan.pricingDetails.__typename === "AppUsagePricing",
  );

  if (!usageLineItem) {
    throw new Error("No usage pricing line item found");
  }

  /* ----------------------------------
   4️⃣ Billing cycle (SIMPLE + SAFE)
---------------------------------- */

  // ✅ ALWAYS start from subscription.createdAt
  // const cycleStart = new Date(subscription.createdAt);
  // const cycleEnd = new Date(cycleStart);
  // cycleEnd.setUTCDate(cycleEnd.getUTCDate() + BILLING_CYCLE_DAYS);

  // ✅ ALWAYS start a fresh paid cycle
  const cycleStart = now;
  const cycleEnd = new Date(now);
  cycleEnd.setUTCDate(cycleEnd.getUTCDate() + BILLING_CYCLE_DAYS);

  /* ----------------------------------
     5️⃣ Charge + create new cycle
  ---------------------------------- */
  await prisma.$transaction(async (tx) => {
    await createUsageCharge({
      admin,
      subscriptionLineItemId: usageLineItem.id,
      amount: BASE_USAGE_AMOUNT,
      description: "Base usage fee (billing cycle)",
    });

    await tx.storeUsage.create({
      data: {
        storeId: shop,
        subscriptionId: subscription.id,
        subscriptionLineItemId: usageLineItem?.id ?? null,
        cycleStart,
        cycleEnd,
        usageAmount: BASE_USAGE_AMOUNT,
        status: "OPEN",
        appliedTier: "STANDARD",
      },
    });
  });

  const redisTierKey = `applied_tier:${shop}`;

  // TTL = paid cycle end (+ 1 hour buffer)
  const paidCycleTTL =
    Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

  // Always overwrite with latest paid tier
  await redis.set(redisTierKey, "STANDARD", {
    EX: paidCycleTTL,
  });

  // 🔥 Store store + expiry (paid)
  await redis.zAdd("store_expiry_queue", {
    score: cycleEnd.getTime(),
    value: shop,
  });

  return redirectToApp();
};
