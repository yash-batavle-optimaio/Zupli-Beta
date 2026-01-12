import { authenticate } from "../shopify.server";

export const loader = () =>
  new Response("Webhook endpoint. POST only.", { status: 405 });

export const action = async ({ request }) => {
  // 🔐 Authenticate & parse webhook
  const { topic, admin, payload, session, shop } =
    await authenticate.webhook(request);

  console.log(`🧭 Webhook received: ${topic} for ${shop}`);

  // Webhooks may fire after uninstall
  if (!session) {
    console.warn("⚠️ No active session. Shop likely uninstalled.");
    return new Response();
  }

  // 🔥 Handle APP_SUBSCRIPTIONS_UPDATE
  if (topic === "APP_SUBSCRIPTIONS_UPDATE") {
    /**
     * payload example fields you care about:
     * - payload.app_subscription.id
     * - payload.app_subscription.status
     * - payload.app_subscription.created_at
     * - payload.app_subscription.updated_at
     */

    const subscription = payload.app_subscription;

    console.log("📦 Subscription update:", {
      id: subscription.id,
      status: subscription.status,
      name: subscription.name,
    });

    // ✅ Example: update your DB
    // await db.subscription.upsert({
    //   shop,
    //   subscriptionId: subscription.id,
    //   status: subscription.status,
    // });

    // ✅ Optional: react to status
    if (subscription.status === "ACTIVE") {
      console.log("✅ Subscription is active");
    }

    if (subscription.status === "CANCELLED") {
      console.log("❌ Subscription cancelled");
    }
  }

  return new Response();
};
