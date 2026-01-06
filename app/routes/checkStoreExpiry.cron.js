import cron from "node-cron";
import prisma from "../db.server";
import { redis } from "./utils/redis.server";
import { callShopAdminGraphQL } from "./utils/shopifyGraphql.server";

const BILLING_CYCLE_DAYS = 30;
const BASE_USAGE_AMOUNT = 5;

async function checkStoreExpiry() {
  const now = Date.now();

  try {
    // 1️⃣ Get earliest expiry
    const entries = await redis.zRangeWithScores("store_expiry_queue", 0, 0);
    if (!entries.length) return;

    const { value: shop, score } = entries[0];
    const expiryMs = Number(score);

    if (!shop || !Number.isFinite(expiryMs)) {
      await redis.zRem("store_expiry_queue", shop);
      return;
    }

    if (expiryMs > now) return;

    console.log("🔁 Rolling billing cycle for:", shop);

    // ✅ 2️⃣ REMOVE expiry FIRST (idempotent)
    await redis.zRem("store_expiry_queue", shop);

    // 3️⃣ Load OPEN cycle
    const openCycle = await prisma.storeUsage.findFirst({
      where: {
        storeId: shop,
        status: "OPEN",
      },
      orderBy: { cycleEnd: "desc" },
    });

    console.log("Open cycle:", openCycle);

    if (!openCycle) return;

    // 🚨 SAFETY CHECK
    if (!openCycle.subscriptionLineItemId) {
      console.warn(
        "⚠️ Missing subscriptionLineItemId, skipping billing for",
        shop,
      );
      return;
    }

    // 4️⃣ Close existing cycle
    await prisma.storeUsage.update({
      where: { id: openCycle.id },
      data: { status: "CLOSED" },
    });

    // 5️⃣ Load OFFLINE session
    const offlineSession = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
    });

    if (!offlineSession) {
      throw new Error(`No offline session found for ${shop}`);
    }

    // 6️⃣ Create usage charge (GraphQL)
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

    await callShopAdminGraphQL({
      shopDomain: shop,
      accessToken: offlineSession.accessToken,
      query: CREATE_USAGE_CHARGE,
      variables: {
        subscriptionLineItemId: openCycle.subscriptionLineItemId, // ✅ FIX
        price: {
          amount: BASE_USAGE_AMOUNT,
          currencyCode: "USD",
        },
        description: "Base usage fee (auto renewal)",
      },
    });

    // 7️⃣ Create next billing cycle
    const cycleStart = new Date(expiryMs);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCDate(cycleEnd.getUTCDate() + BILLING_CYCLE_DAYS);

    await prisma.storeUsage.create({
      data: {
        storeId: shop,
        subscriptionId: openCycle.subscriptionId,
        subscriptionLineItemId: openCycle.subscriptionLineItemId, // ✅ FIX
        cycleStart,
        cycleEnd,
        usageAmount: BASE_USAGE_AMOUNT,
        status: "OPEN",
        appliedTier: "STANDARD",
      },
    });

    // 8️⃣ Update Redis
    const redisTierKey = `applied_tier:${shop}`;
    const ttl = Math.ceil((cycleEnd.getTime() - Date.now()) / 1000) + 3600;

    await redis.set(redisTierKey, "STANDARD", { EX: ttl });

    // 9️⃣ Push next expiry
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
