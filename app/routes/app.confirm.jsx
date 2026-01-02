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
     2️⃣ TRIAL MODE
  ---------------------------------- */
  if (subscription.trialDays > 0) {
    const trialStart = new Date(subscription.createdAt);
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + subscription.trialDays);

    const existingTrial = await prisma.storeUsage.findFirst({
      where: {
        storeId: shop,
        usageAmount: 0,
        cycleEnd: { gt: now },
        status: "OPEN",
      },
    });

    if (!existingTrial) {
      await prisma.storeUsage.create({
        data: {
          storeId: shop,
          subscriptionId: subscription.id,
          cycleStart: trialStart,
          cycleEnd: trialEnd,
          usageAmount: 0,
          status: "OPEN",
        },
      });
    }

    await prisma.storeInfo.upsert({
      where: { storeId: shop },
      update: {
        trialUsed: true,
        trialEndsAt: trialEnd,
        lastInstalledAt: now,
        updatedAt: now,
      },
      create: {
        storeId: shop,
        firstInstalledAt: now,
        lastInstalledAt: now,
        trialUsed: true,
        trialEndsAt: trialEnd,
      },
    });

    // 🔥 Store store + expiry (trial)
    await redis.zAdd("store_expiry_queue", {
      score: trialEnd.getTime(),
      value: shop,
    });

    return redirectToApp();
  }

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
     4️⃣ Billing cycle resolution
  ---------------------------------- */
  const lastUsage = await prisma.storeUsage.findFirst({
    where: { storeId: shop },
    orderBy: { cycleEnd: "desc" },
  });

  let cycleStart;
  let cycleEnd;

  if (!lastUsage) {
    cycleStart = new Date(subscription.createdAt);
  } else if (now > lastUsage.cycleEnd) {
    cycleStart = new Date(lastUsage.cycleEnd);
  } else {
    // 🔥 No charge needed, still enqueue expiry
    await redis.zAdd("store_expiry_queue", {
      score: lastUsage.cycleEnd.getTime(),
      value: shop,
    });

    return redirectToApp();
  }

  cycleEnd = new Date(cycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + BILLING_CYCLE_DAYS);

  /* ----------------------------------
     5️⃣ Charge + create new cycle
  ---------------------------------- */
  await prisma.$transaction(async (tx) => {
    if (lastUsage?.status === "OPEN") {
      await tx.storeUsage.update({
        where: { id: lastUsage.id },
        data: { status: "CLOSED" },
      });
    }

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
        cycleStart,
        cycleEnd,
        usageAmount: BASE_USAGE_AMOUNT,
        status: "OPEN",
      },
    });
  });

  // 🔥 Store store + expiry (paid)
  await redis.zAdd("store_expiry_queue", {
    score: cycleEnd.getTime(),
    value: shop,
  });

  return redirectToApp();
};
