import cron from "node-cron";
import prisma from "../../db.server";
import { redis } from "../utils/redis.server";

/**
 * Flush Redis order queues → DB (BillingOrder)
 * Runs every hour
 */
async function flushOrdersToDBHourly() {
  console.log("🧹 Starting hourly order flush...");

  try {
    // 1️⃣ Find all store queues
    const keys = await redis.keys("order_queue:*");

    if (!keys.length) {
      console.log("ℹ️ No order queues found");
      return;
    }

    for (const key of keys) {
      const storeId = key.replace("order_queue:", "");

      // 🔒 Per-store lock (prevents concurrent flush)
      const lockKey = `flush_lock:${storeId}`;
      const lock = await redis.set(lockKey, "1", {
        NX: true,
        EX: 60 * 5, // 5 minutes
      });
      if (!lock) continue;

      try {
        // 2️⃣ Read all queued orders
        const rawOrders = await redis.lRange(key, 0, -1);
        if (!rawOrders.length) continue;

        const orders = rawOrders.map((o) => JSON.parse(o));

        // 3️⃣ Bulk insert (DB is source of truth)
        await prisma.billingOrder.createMany({
          data: orders.map((o) => ({
            storeId: o.storeId,
            orderId: o.orderId,
            orderNumber: String(o.orderNumber),
            currency: o.currency,
            totalItems: o.totalItems,
            createdAt: new Date(o.createdAt),
          })),
          skipDuplicates: true, // 🔥 idempotent
        });

        // 4️⃣ Clear Redis queue AFTER DB success
        await redis.del(key);

        console.log("✅ Hourly orders flushed", {
          storeId,
          count: orders.length,
        });
      } finally {
        // 🔓 Always release lock
        await redis.del(lockKey);
      }
    }
  } catch (err) {
    console.error("❌ Hourly order flush failed:", err);
  }
}

/* ----------------------------------
   Run every hour (minute 0)
---------------------------------- */
cron.schedule("*/60 * * * *", async () => {
  console.log("⏰ Running hourly order flush cron...");
  await flushOrdersToDBHourly();
});

// For manual triggering
// ✅ Correct named export
export async function flushOrdersToDBHourlyManual() {
  console.log("⏰ Manually Running order flush cron...");
  await flushOrdersToDBHourly();
}
