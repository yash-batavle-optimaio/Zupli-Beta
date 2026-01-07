import cron from "node-cron";
import prisma from "../db.server";
import { redis } from "./utils/redis.server";
import { callShopAdminGraphQL } from "./utils/shopifyGraphql.server";

/* ---------------- Debug Helper ---------------- */

const DEBUG = true;

function safeStringify(data) {
  return JSON.stringify(
    data,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
}

function debug(label, data = {}) {
  if (!DEBUG) return;
  console.log(`🐛 [DEBUG] ${label}`);
  console.log(safeStringify(data));
}

/* ---------------- Constants ---------------- */

const GROW_THRESHOLD = 2000;
const ENTERPRISE_THRESHOLD = 5000;

const GROW_CHARGE = 20;
const ENTERPRISE_CHARGE = 30;

const BASE_USAGE_AMOUNT = 0;

/* ---------------- Shopify Mutation ---------------- */

const CHARGE_MUTATION = `
  mutation AppUsageRecordCreate(
    $subscriptionLineItemId: ID!
    $price: MoneyInput!
    $description: String!
  ) {
    appUsageRecordCreate(
      subscriptionLineItemId: $subscriptionLineItemId
      price: $price
      description: $description
    ) {
      appUsageRecord { id }
      userErrors { message }
    }
  }
`;

/* ---------------- Main Job ---------------- */

async function orderBasedBilling() {
  console.log("📊 Running order-based billing cron...");

  try {
    const openCycles = await prisma.storeUsage.findMany({
      where: { status: "OPEN" },
    });

    for (const cycle of openCycles) {
      const {
        id: openCycleId,
        storeId,
        cycleStart,
        cycleEnd,
        appliedTier,
        subscriptionId,
        subscriptionLineItemId,
      } = cycle;

      const lockKey = `order_billing_lock:${storeId}`;
      const lock = await redis.set(lockKey, "1", { NX: true, EX: 180 });
      if (!lock) continue;

      try {
        /* ---------- Order Count (Redis Counter) ---------- */

        const rawCount = await redis.get(`order_count:${storeId}`);
        const orderCount = Number(rawCount || 0);

        let nextTier = null;
        let chargeAmount = 0;

        if (appliedTier === "STANDARD" && orderCount > GROW_THRESHOLD) {
          nextTier = "GROW";
          chargeAmount = GROW_CHARGE;
        } else if (
          appliedTier === "GROW" &&
          orderCount > ENTERPRISE_THRESHOLD
        ) {
          nextTier = "ENTERPRISE";
          chargeAmount = ENTERPRISE_CHARGE;
        } else {
          continue;
        }

        debug("Tier upgrade detected", {
          storeId,
          from: appliedTier,
          to: nextTier,
          orderCount,
        });

        /* ---------- Shopify Usage Charge ---------- */

        const offlineSession = await prisma.session.findFirst({
          where: { shop: storeId, isOnline: false },
        });
        if (!offlineSession) continue;

        const result = await callShopAdminGraphQL({
          shopDomain: storeId,
          accessToken: offlineSession.accessToken,
          query: CHARGE_MUTATION,
          variables: {
            subscriptionLineItemId,
            price: {
              amount: chargeAmount,
              currencyCode: "USD",
            },
            description: `Upgrade to ${nextTier} plan`,
          },
        });

        if (result?.appUsageRecordCreate?.userErrors?.length) {
          throw new Error(result.appUsageRecordCreate.userErrors[0].message);
        }

        /* ---------- DB TRANSACTION ---------- */

        await prisma.$transaction(async (tx) => {
          // 1️⃣ Close old usage + store order count snapshot
          await tx.storeUsage.update({
            where: { id: openCycleId },
            data: {
              status: "CLOSED",
              // orderCount, // ✅ snapshot from Redis
            },
          });

          // 2️⃣ Create new OPEN usage (same cycle, new tier)
          await tx.storeUsage.create({
            data: {
              storeId,
              subscriptionId,
              subscriptionLineItemId,
              cycleStart,
              cycleEnd,
              usageAmount: chargeAmount,
              ordersCount: orderCount, // ✅ carried forward snapshot
              status: "OPEN",
              appliedTier: nextTier,
            },
          });
        });

        /* ---------- Redis Tier Cache ---------- */

        const ttl = Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

        await redis.set(`applied_tier:${storeId}`, nextTier, { EX: ttl });

        console.log("✅ Billing cycle rolled & order count stored", {
          storeId,
          nextTier,
          orderCount,
        });
      } finally {
        await redis.del(lockKey);
      }
    }
  } catch (err) {
    console.error("❌ Order billing cron error:", err);
  }
}

/* ---------------- Cron ---------------- */

cron.schedule("*/60 * * * *", async () => {
  await orderBasedBilling();
});
