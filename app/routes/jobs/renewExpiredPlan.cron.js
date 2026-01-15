import cron from "node-cron";
import { ensureRedisConnected } from "../utils/redis.server";
import { processSingleStoreExpiry } from "./processSingleStore";

async function checkStoreExpiry() {
  const redis = await ensureRedisConnected();

  // 1️⃣ Get earliest expiry
  const MAX_PER_RUN = 10; // safety guard
  let processed = 0;

  while (processed < MAX_PER_RUN) {
    const entries = await redis.zRangeWithScores("store_expiry_queue", 0, 0);

    if (!entries.length) break;

    const { value: shop, score } = entries[0];
    const expiryMs = Number(score);

    if (!shop || !Number.isFinite(expiryMs)) break;
    if (expiryMs > Date.now()) break;

    processed++;

    await processSingleStoreExpiry(shop);
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
