import { authenticate } from "../shopify.server";
import { redis } from "./utils/redis.server";

export const loader = () =>
  Response.json({ message: "👋 Webhook endpoint: POST only." });

export const action = async ({ request }) => {
  const { topic, payload, session, shop } = await authenticate.webhook(request);

  // 🚨 Fast exit (important for Shopify retries)
  if (!session || topic !== "ORDERS_CREATE") {
    return new Response("ok");
  }

  const orderId = String(payload.id);
  const storeId = shop;

  /* ----------------------------------
     1️⃣ Minimal order payload
  ---------------------------------- */
  const orderPayload = JSON.stringify({
    orderId,
    orderNumber: payload.order_number,
    storeId,
    currency: payload.currency,
    totalItems: payload.line_items.length,
    locationId: payload.location_id ?? null,
    createdAt: payload.created_at,
  });

  /* ----------------------------------
     2️⃣ ATOMIC Redis transaction
  ---------------------------------- */
  const tx = redis.multi();

  // 1️⃣ Idempotency guard (24h)
  tx.set(`order_seen:${orderId}`, "1", {
    NX: true,
    EX: 60 * 60 * 24,
  });

  // 2️⃣ Increment store-level order count
  tx.incr(`order_count:${storeId}`);

  // 3️⃣ Push order into FIFO queue
  tx.rPush(`order_queue:${storeId}`, orderPayload);

  // 4️⃣ Safety TTL for queue (48h)
  tx.expire(`order_queue:${storeId}`, 60 * 60 * 48);

  const results = await tx.exec();

  /**
   * redis@4 behavior:
   * SET NX returns "OK" or null
   */
  const setResult = results?.[0];

  if (setResult !== "OK") {
    // Duplicate webhook (Shopify retry or double delivery)
    console.log("⚠️ Duplicate order ignored:", orderId);
    return new Response("ok");
  }

  console.log("✅ Order queued:", {
    orderId,
    storeId,
  });

  return new Response("ok");
};
