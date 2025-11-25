import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = () =>
  Response.json({ message: "👋 Webhook endpoint: POST only." });

export const action = async ({ request }) => {
  const { topic, payload, session, shop } = await authenticate.webhook(request);

  if (!session) {
    console.warn("⚠️ No active session — shop may be uninstalled.");
    return new Response();
  }

  /* ---------------------------------------------------------------
   * 🛒 CART CREATED (CARTS_CREATE)
   * REST-style payload:
   * { id, token, line_items, updated_at, created_at }
   * --------------------------------------------------------------- */
  if (topic === "CARTS_CREATE") {
    try {
      console.log("🛒 New cart created!");

      const cartId = payload.id;
      const token = payload.token;
      const lineItems = payload.line_items ?? [];

      console.log("🆔 Cart ID:", cartId);
      console.log("🔑 Token:", token);
      console.log("🛍️ Cart Items:", JSON.stringify(lineItems, null, 2));

      // ✅ Save the event to Prisma
      await prisma.cartEvent.create({
        data: {
          cartId,
          eventType: "CARTS_CREATE",
          payload,
        },
      });

      console.log("✅ CARTS_CREATE saved to DB");

    } catch (err) {
      console.error("🚨 CARTS_CREATE Error:", err);
    }
  }

  /* ---------------------------------------------------------------
   * 🛒 CART UPDATED (CARTS_UPDATE)
   * Contains same REST-style format.
   * --------------------------------------------------------------- */
  if (topic === "CARTS_CREATE") {
    try {
      console.log("🛒 Cart updated!");
      console.log("📦 Full Cart Payload:", JSON.stringify(payload, null, 2));

      await prisma.cartEvent.create({
        data: {
          cartId: payload.id,
          eventType: "CARTS_CREATE",
          payload,
        },
      });

      console.log("✅ CARTS_UPDATE saved to DB");

    } catch (err) {
      console.error("🚨 CARTS_UPDATE Error:", err);
    }
  }

  return new Response("ok");
};
