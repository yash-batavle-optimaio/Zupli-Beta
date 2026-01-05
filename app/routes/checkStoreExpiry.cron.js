import cron from "node-cron";
import { redis } from "./utils/redis.server";

async function checkStoreExpiry() {
  const now = Date.now();

  try {
    // 🔥 Get ONLY the earliest expiry (queue head)
    const entries = await redis.zRangeWithScores(
      "store_expiry_queue",
      0,
      0, // top element only
    );

    if (!Array.isArray(entries) || entries.length === 0) {
      console.log("⏳ Queue empty. now(ms):", now);
      return;
    }

    const { value: storeId, score } = entries[0];
    const expiryMs = Number(score);

    // 🚨 Hard guard
    if (!storeId || !Number.isFinite(expiryMs)) {
      console.error("❌ Corrupted queue entry:", entries[0]);

      // Remove corrupted entry to unblock queue
      await redis.zRem("store_expiry_queue", storeId);
      return;
    }

    // ⏱️ Not expired yet → stop
    if (expiryMs > now) {
      console.log("⏳ Earliest store not expired yet:", {
        storeId,
        expiryMs,
        now,
      });
      return;
    }

    // 🛑 EXPIRED — process it
    console.log("🛑 Store expired:", {
      storeId,
      expiryMs,
      expiryUTC: new Date(expiryMs).toISOString(),
    });

    // 🔥 Remove ONLY this store from queue
    // await redis.zRem("store_expiry_queue", storeId);

    console.log("✅ Removed expired store:", storeId);

    // 🔁 (Optional future logic)
    // - Flush Redis orders → Postgres
    // - Close StoreUsage cycle
    // - Create usage charge
    // - Notify merchant
  } catch (err) {
    console.error("❌ Cron error (checkStoreExpiry):", err);
  }
}

/* ----------------------------------
   Run every 1 minute
---------------------------------- */
cron.schedule("* * * * *", () => {
  console.log("⏰ Running store expiry cron...");
  checkStoreExpiry();
});
