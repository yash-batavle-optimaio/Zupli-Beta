import cron from "node-cron";
import prisma from "../db.server";
import { redis } from "./utils/redis.server";
import { callShopAdminGraphQL } from "./utils/shopifyGraphql.server";
import crypto from "node:crypto";
import { BILLING_PLANS, BILLING_DAYS } from "./config/billingPlans";

const BILLING_CYCLE_DAYS = BILLING_DAYS;
const BASE_USAGE_AMOUNT = BILLING_PLANS.STANDARD.basePrice;
const RENEWAL_PLAN = BILLING_PLANS.STANDARD.key;

async function checkStoreExpiry() {
  const now = Date.now();
  // 1️⃣ Get earliest expiry
  const entries = await redis.zRangeWithScores("store_expiry_queue", 0, 0);
  if (!entries.length) return;

  const { value: shop, score } = entries[0];
  const expiryMs = Number(score);

  if (!shop || !Number.isFinite(expiryMs)) return;
  if (expiryMs > now) return;

  // 🔒 Redis lock (prevents duplicate billing)
  const lockKey = `billing_lock:${shop}`;
  const lockValue = crypto.randomUUID();

  try {
    const lock = await redis.set(lockKey, lockValue, { NX: true, EX: 60 });
    if (!lock) return;

    console.log("🔁 Rolling billing cycle for:", shop);

    // 2️⃣ Load OPEN cycle (DB is source of truth)
    const openCycle = await prisma.storeUsage.findFirst({
      where: {
        storeId: shop,
        status: "OPEN",
      },
      orderBy: { cycleEnd: "desc" },
    });

    if (!openCycle) return;

    if (!openCycle.subscriptionLineItemId) {
      console.warn(
        "⚠️ Missing subscriptionLineItemId, skipping billing for",
        shop,
      );
      return;
    }

    console.log("📦 Billing rollover", {
      shop,
      cycleId: openCycle.id,
      cycleEnd: openCycle.cycleEnd,
    });

    const discount = await prisma.storeDiscount.findFirst({
      where: {
        storeId: shop,
        isActive: true,
        cycleStart: { lte: openCycle.cycleEnd },
        cycleEnd: { gte: openCycle.cycleStart },
      },
    });

    // 3️⃣ Load OFFLINE session
    const offlineSession = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
    });

    if (!offlineSession) {
      throw new Error(`No offline session found for ${shop}`);
    }

    // 4️⃣ Create Shopify usage charge
    const CREATE_USAGE_CHARGE = `
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

    // Hard guard
    if (chargeAmount <= 0) {
      console.log("⚠️ Renewal skipped due to discount", {
        shop,
        BASE_USAGE_AMOUNT,
        finalCharge: chargeAmount,
      });
      return;
    }

    const idempotencyKey = [
      "newCycle",
      shop,
      openCycle.cycleStart.toISOString(),
      openCycle.cycleEnd.toISOString(),
      RENEWAL_PLAN,
    ].join(":");

    const result = await callShopAdminGraphQL({
      shopDomain: shop,
      accessToken: offlineSession.accessToken,
      query: CREATE_USAGE_CHARGE,
      variables: {
        subscriptionLineItemId: openCycle.subscriptionLineItemId,
        price: {
          amount: chargeAmount,
          currencyCode: "USD",
        },
        description: discount
          ? "Base usage fee (discount applied)"
          : "Base usage fee (auto renewal)",
        idempotencyKey,
      },
    });

    const errors = result?.appUsageRecordCreate?.userErrors;
    if (errors?.length) {
      throw new Error(`Shopify billing error: ${errors[0].message}`);
    }

    // 5️⃣ Compute next cycle from LAST cycle end (correct)
    const cycleStart = new Date(openCycle.cycleEnd);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCDate(cycleEnd.getUTCDate() + BILLING_CYCLE_DAYS);

    // 6️⃣ Close + create cycle atomically
    await prisma.$transaction(async (tx) => {
      await tx.storeUsage.update({
        where: { id: openCycle.id },
        data: { status: "CLOSED" },
      });

      await tx.storeUsage.create({
        data: {
          storeId: shop,
          subscriptionId: openCycle.subscriptionId,
          subscriptionLineItemId: openCycle.subscriptionLineItemId,
          cycleStart,
          cycleEnd,
          usageAmount: chargeAmount,
          status: "OPEN",
          appliedTier: "STANDARD",
        },
      });

      if (
        discount &&
        discount.usageType === "ONE_TIME" &&
        !discount.isActive.usageCount >= 1
      ) {
        await prisma.storeDiscount.update({
          where: { id: discount.id },
          data: {
            usedAt: new Date(),
            isActive: false,
            // usageCount: discount.usageCount + 1,
          },
        });
      }
    });

    // 6️⃣.5️⃣ RESET Redis order counter (CRITICAL)
    await redis.set(`order_count:${shop}`, 0);

    // 7️⃣ Update Redis tier
    const ttl = Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

    await redis.set(`applied_tier:${shop}`, "STANDARD", {
      EX: ttl,
    });

    // 8️⃣ UPDATE expiry using ZADD overwrite (NO REMOVE)
    await redis.zAdd("store_expiry_queue", {
      score: cycleEnd.getTime(),
      value: shop,
    });

    console.log("✅ Billing cycle renewed for:", shop);
  } catch (err) {
    console.error("❌ Cron error:", err);
  } finally {
    // 🔓 SAFE UNLOCK (OWNERSHIP CHECK)
    const current = await redis.get(lockKey);
    if (current === lockValue) {
      await redis.del(lockKey);
    }
  }
}

/* ----------------------------------
   Run every minute
---------------------------------- */
cron.schedule("*/60 * * * *", async () => {
  console.log("⏰ Running store expiry cron...");
  await checkStoreExpiry();
});

// For manual triggering
export async function runRenewExpieredPlan() {
  console.log("⏰ Manually Running store expiry cron...");
  await checkStoreExpiry();
}
