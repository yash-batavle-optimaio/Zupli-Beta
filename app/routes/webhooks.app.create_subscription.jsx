import { authenticate } from "../shopify.server";

/**
 * GET → Shopify never calls GET for webhooks
 */
export const loader = () => {
  return new Response("Webhook endpoint. Use POST.", { status: 200 });
};

/**
 * POST → Shopify webhook handler
 */
export const action = async ({ request }) => {
  let webhook;

  try {
    webhook = await authenticate.webhook(request);
  } catch (err) {
    console.error("❌ Webhook verification failed");
    console.error(err);
    return new Response("Unauthorized", { status: 401 });
  }

  // 🔥 LOG EVERYTHING SHOPIFY SENDS
  console.log("=================================================");
  console.log("🔔 FULL WEBHOOK OBJECT");
  console.log(JSON.stringify(webhook, null, 2));
  console.log("=================================================");

  const { topic, shop, payload } = webhook;

  console.log("🔔 Webhook received");
  console.log("Topic:", topic);
  console.log("Shop:", shop);

  // Log raw payload separately
  console.log("📦 RAW PAYLOAD");
  console.log(JSON.stringify(payload, null, 2));

  // ---- Only handle subscription updates ----
  if (topic !== "APP_SUBSCRIPTIONS_UPDATE") {
    console.log("ℹ️ Ignored topic:", topic);
    return new Response("Ignored", { status: 200 });
  }

  /**
   * Shopify sends:
   * payload.app_subscription.{...}
   */
  const subscription = payload?.app_subscription;

  if (!subscription) {
    console.warn("⚠️ app_subscription missing from payload");
    return new Response("OK", { status: 200 });
  }

  // Destructure safely
  const {
    id: subscriptionId,
    admin_graphql_api_id,
    name,
    status,
    trial_days,
    created_at,
    current_period_end,
    canceled_at,
  } = subscription;

  console.log("📦 SUBSCRIPTION DATA");
  console.log({
    subscriptionId,
    admin_graphql_api_id,
    name,
    status,
    trial_days,
    created_at,
    current_period_end,
    canceled_at,
  });

  // ---- Example logic (no DB) ----
  switch (status) {
    case "ACTIVE":
      console.log("✅ Subscription ACTIVE");
      break;

    case "CANCELLED":
      console.log("🛑 Subscription CANCELLED");
      break;

    case "FROZEN":
      console.log("❄️ Subscription FROZEN");
      break;

    case "EXPIRED":
      console.log("⌛ Subscription EXPIRED");
      break;

    default:
      console.log("ℹ️ Subscription status:", status);
  }

  // IMPORTANT: Always return 200 to stop retries
  return new Response("OK", { status: 200 });
};
