import cron from "node-cron";
import { redis } from "./utils/redis.server";

async function checkStoreExpiry() {
  const now = Date.now();

  try {
    const expiredStores = await redis.zRangeByScore(
      "store_expiry_queue",
      0,
      now,
      { WITHSCORES: true },
    );

    if (!Array.isArray(expiredStores) || expiredStores.length === 0) {
      console.log("⏳ No expired stores. now(ms):", now);
      return;
    }

    console.log("⚠️ Expired stores found (raw):", expiredStores);

    const storesToRemove = [];

    for (let i = 0; i < expiredStores.length; i += 2) {
      const storeId = expiredStores[i];
      const rawScore = expiredStores[i + 1];

      const expiryMs = Number(rawScore);

      // HARD GUARD — NOTHING UNSAFE BELOW THIS
      if (!storeId || !Number.isFinite(expiryMs)) {
        console.error("❌ Corrupted Redis entry skipped:", {
          storeId,
          rawScore,
        });
        continue;
      }

      console.log("🛑 Store expired:", {
        storeId,
        expiryMs,
      });

      storesToRemove.push(storeId);
    }

    if (storesToRemove.length > 0) {
      await redis.zRem("store_expiry_queue", ...storesToRemove);
      console.log("✅ Removed expired stores:", storesToRemove);
    }
  } catch (err) {
    console.error("❌ Cron error (checkStoreExpiry):", err);
  }
}

cron.schedule("*/1 * * * *", () => {
  console.log("⏰ Running store expiry cron...");
  checkStoreExpiry();
});
