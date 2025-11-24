import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = () =>
  Response.json({ message: "👋 Webhook endpoint: POST only." });

export const action = async ({ request }) => {
  const { topic, payload, session } = await authenticate.webhook(request);

  if (!session) {
    console.warn("⚠️ No active session found. Shop may have uninstalled.");
    return new Response();
  }

  if (topic === "CARTS_UPDATE") {
    console.log("🛒 Full Cart Webhook Data:");
    console.log(JSON.stringify(payload, null, 2));

    try {
      await prisma.cartEvent.create({
        data: {
          cartId: payload.id,
          eventType: "CARTS_UPDATE",
          payload: payload,
        },
      });

      console.log("✅ Saved to DB!");
    } catch (err) {
      console.error("❌ DB Save Error:", err);
    }
  }

  return new Response("ok");
};
