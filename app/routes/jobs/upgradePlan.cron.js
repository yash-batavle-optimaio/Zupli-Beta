import cron from "node-cron";
import prisma from "../../db.server";
import { ensureRedisConnected } from "../utils/redis.server";
import { callShopAdminGraphQL } from "../utils/shopifyGraphql.server";
import crypto from "node:crypto";
import {
  resolvePlanByOrders,
  getPlanPrice,
  PLAN_RANK,
} from "../config/billingPlans";

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

/* ---------------- Shopify Mutation ---------------- */

const CHARGE_MUTATION = `
  mutation AppUsageRecordCreate(
    $subscriptionLineItemId: ID!
    $price: MoneyInput!
    $description: String!
    $idempotencyKey: String!
  ) {
    appUsageRecordCreate(
      subscriptionLineItemId: $subscriptionLineItemId
      price: $price
      description: $description
      idempotencyKey: $idempotencyKey
    ) {
      appUsageRecord { id }
      userErrors { message }
    }
  }
`;

/* ---------------- Main Job ---------------- */

async function orderBasedBilling() {
  const redis = await ensureRedisConnected();
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

      /* ---------- DISTRIBUTED LOCK ---------- */

      const lockKey = `order_billing_lock:${storeId}`;
      const lockValue = crypto.randomUUID();

      const lock = await redis.set(lockKey, lockValue, { NX: true, EX: 300 });
      if (!lock) continue;

      try {
        /* ---------- DISCOUNT LOOKUP DEBUG ---------- */

        const discount = await prisma.storeDiscount.findFirst({
          where: {
            storeId,
            isActive: true,
            cycleStart: { lte: cycleEnd },
            cycleEnd: { gte: cycleStart },
          },
        });

        debug("Discount lookup", {
          storeId,
          billingCycle: {
            start: cycleStart,
            end: cycleEnd,
          },
          discountFound: !!discount,
          discount,
        });

        /* ---------- ORDER COUNT ---------- */

        const rawCount = await redis.get(`order_count:${storeId}`);
        const orderCount = Number(rawCount || 0);

        debug("Order count", { storeId, orderCount });

        if (orderCount === 0) {
          debug("Skipping billing – zero orders", { storeId });
          continue;
        }

        const eligibleTier = resolvePlanByOrders(orderCount);
        const currentTier = appliedTier || "STANDARD";

        debug("Tier evaluation", {
          storeId,
          orderCount,
          currentTier,
          eligibleTier,
        });

        if (eligibleTier === "STANDARD") continue;
        if (PLAN_RANK[eligibleTier] <= PLAN_RANK[currentTier]) continue;

        const previousTotal = getPlanPrice(currentTier);
        const newTotal = getPlanPrice(eligibleTier);
        let chargeAmount = newTotal - previousTotal;

        debug("Charge BEFORE discount", {
          storeId,
          previousTotal,
          newTotal,
          chargeAmount,
        });

        /* ---------- APPLY DISCOUNT ---------- */

        if (discount) {
          if (discount.discountType === "FLAT") {
            debug("Applying FLAT discount", {
              storeId,
              discountValue: discount.discountValue,
            });
            chargeAmount -= discount.discountValue;
          }

          if (discount.discountType === "PERCENT") {
            const discountValue = Number(
              ((chargeAmount * discount.discountValue) / 100).toFixed(2),
            );

            debug("Applying PERCENT discount", {
              storeId,
              percent: discount.discountValue,
              calculatedDiscount: discountValue,
            });

            chargeAmount -= discountValue;
          }
        } else {
          debug("No discount applied", { storeId });
        }

        debug("Charge AFTER discount", {
          storeId,
          finalCharge: chargeAmount,
        });

        if (chargeAmount <= 0) {
          debug("Skipping billing – charge <= 0 after discount", {
            storeId,
            chargeAmount,
          });
          continue;
        }

        /* ---------- IDENTITY DEBUG ---------- */

        const idempotencyKey = [
          "plan-upgrade",
          storeId,
          cycleStart.toISOString(),
          cycleEnd.toISOString(),
          eligibleTier,
        ].join(":");

        debug("Prepared Shopify charge", {
          storeId,
          chargeAmount,
          idempotencyKey,
        });

        /* ---------- SHOPIFY CALL ---------- */

        const offlineSession = await prisma.session.findFirst({
          where: { shop: storeId, isOnline: false },
        });

        if (!offlineSession || !subscriptionLineItemId) {
          debug("Missing Shopify prerequisites", {
            storeId,
            hasSession: !!offlineSession,
            subscriptionLineItemId,
          });
          continue;
        }

        const result = await callShopAdminGraphQL({
          shopDomain: storeId,
          accessToken: offlineSession.accessToken,
          query: CHARGE_MUTATION,
          variables: {
            subscriptionLineItemId,
            price: { amount: chargeAmount, currencyCode: "USD" },
            description: `Upgrade to ${eligibleTier} plan`,
            idempotencyKey,
          },
        });

        if (result?.appUsageRecordCreate?.userErrors?.length) {
          throw new Error(result.appUsageRecordCreate.userErrors[0].message);
        }

        /* ---------- DB TRANSACTION ---------- */

        await prisma.$transaction(async (tx) => {
          await tx.storeUsage.update({
            where: { id: openCycleId },
            data: { status: "CLOSED" },
          });

          await tx.storeUsage.create({
            data: {
              storeId,
              subscriptionId,
              subscriptionLineItemId,
              cycleStart,
              cycleEnd,
              usageAmount: chargeAmount,
              ordersCount: orderCount,
              status: "OPEN",
              appliedTier: eligibleTier,
            },
          });
        });

        if (discount && discount.usageType === "ONE_TIME") {
          await prisma.storeDiscount.update({
            where: { id: discount.id },
            data: { usedAt: new Date(), usageCount: discount.usageCount + 1 },
          });

          debug("Discount marked as used", {
            storeId,
            discountId: discount.id,
          });
        }

        /* ✅ PUT REDIS WRITE HERE */

        const ttl = Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

        await redis.set(`applied_tier:${storeId}`, eligibleTier, { EX: ttl });

        debug("Redis tier updated", {
          storeId,
          eligibleTier,
          ttl,
        });

        console.log("✅ Billing cycle rolled", {
          storeId,
          eligibleTier,
          orderCount,
        });
      } finally {
        const current = await redis.get(lockKey);
        if (current === lockValue) await redis.del(lockKey);
      }
    }
  } catch (err) {
    console.error("❌ Order billing cron error:", err);
  }
}

/* ---------------- Cron ---------------- */

cron.schedule("*/60 * * * *", async () => {
  console.log("📊 Running order-based billing cron...");
  await orderBasedBilling();
});

export async function runUpgradePlan() {
  console.log("⏰ Manually Running order-based billing cron...");
  await orderBasedBilling();
}
