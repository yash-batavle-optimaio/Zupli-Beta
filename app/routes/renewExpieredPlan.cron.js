import cron from "node-cron";
import prisma from "../db.server";
import { redis } from "./utils/redis.server";
import { callShopAdminGraphQL } from "./utils/shopifyGraphql.server";

const BILLING_CYCLE_DAYS = 30;
const BASE_USAGE_AMOUNT = 15;

async function checkStoreExpiry() {
  const now = Date.now();

  try {
    // 1️⃣ Get earliest expiry
    const entries = await redis.zRangeWithScores("store_expiry_queue", 0, 0);
    if (!entries.length) return;

    const { value: shop, score } = entries[0];
    const expiryMs = Number(score);

    if (!shop || !Number.isFinite(expiryMs)) return;
    if (expiryMs > now) return;

    // 🔒 Redis lock (prevents duplicate billing)
    const lockKey = `billing_lock:${shop}`;
    const lock = await redis.set(lockKey, "1", {
      NX: true,
      EX: 60,
    });
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

    const result = await callShopAdminGraphQL({
      shopDomain: shop,
      accessToken: offlineSession.accessToken,
      query: CREATE_USAGE_CHARGE,
      variables: {
        subscriptionLineItemId: openCycle.subscriptionLineItemId,
        price: {
          amount: BASE_USAGE_AMOUNT,
          currencyCode: "USD",
        },
        description: "Base usage fee (auto renewal)",
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
          usageAmount: BASE_USAGE_AMOUNT,
          status: "OPEN",
          appliedTier: "STANDARD",
        },
      });
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
  }
}

/* ----------------------------------
   Run every minute
---------------------------------- */
cron.schedule("*/1 * * * *", async () => {
  console.log("⏰ Running store expiry cron...");
  await checkStoreExpiry();
});
