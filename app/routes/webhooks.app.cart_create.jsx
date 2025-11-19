import { authenticate } from "../shopify.server";

export const loader = () =>
  Response.json({ message: "👋 Webhook endpoint: POST only." });

export const action = async ({ request }) => {
  // Authenticate webhook (gives topic, payload, admin API, shop, session)
  const { topic, admin, payload, session, shop } =
    await authenticate.webhook(request);

  // console.log(`🧭 Webhook received: ${topic} for shop ${shop}`);
  // console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  // ❗ Webhooks fire even if the app is uninstalled → check session!
  if (!session) {
    console.warn("⚠️ No active session found. Shop may have uninstalled.");
    throw new Response();
  }

  /** ---------------------------------------------------------------
   * 🛒 CART CREATED (CARTS_CREATE)
   * This fires only for ONLINE STORE carts — not custom storefronts.
   * --------------------------------------------------------------- */
  if (topic === "CARTS_CREATE") {
    try {
      console.log("🛒 New cart created!");

      // Payload contains full CartNext data
      // Example: access cart details
      const cartId = payload.id;
      const buyerIdentity = payload.buyerIdentity;
      const lineItems = payload.lines?.edges ?? [];

      console.log("🆔 Cart ID:", cartId);
      console.log("👤 Buyer:", JSON.stringify(buyerIdentity, null, 2));
      console.log("🛍️ Items:", JSON.stringify(lineItems, null, 2));

      // Example: Save cart to DB, trigger workflows, etc.
      // await saveCartToDatabase(payload);
    } catch (err) {
      console.error("🚨 Error handling CARTS_CREATE webhook:", err);
    }
  }

  // You can extend more topics here if needed  
  // if (topic === "CARTS_UPDATE") { ... }

  return new Response();
};
