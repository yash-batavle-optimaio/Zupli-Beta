import { authenticate } from "../shopify.server";

/**
 * GET → helpful message (Shopify never calls GET)
 */
export const loader = () =>
  new Response("Webhook endpoint. Use POST.", { status: 200 });

/**
 * POST → Shopify webhook handler
 */
export const action = async ({ request }) => {
  let webhook;

  try {
    webhook = await authenticate.webhook(request);
  } catch (err) {
    console.error("❌ Webhook verification failed", err);
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, payload, shop } = webhook;

  console.log("🔔 Webhook received");
  console.log("Topic:", topic);
  console.log("Shop:", shop);
  console.log("Payload:", payload);

  // ---- Only handle subscription updates ----
  if (topic !== "APP_SUBSCRIPTIONS_UPDATE") {
    console.log("ℹ️ Ignored topic:", topic);
    return new Response("Ignored", { status: 200 });
  }

  /**
   * payload structure (important fields)
   * https://shopify.dev/docs/api/webhooks/topics/app_subscriptions_update
   */
  const {
    id: subscriptionId,
    status,
    name,
    admin_graphql_api_id,
    created_at,
    current_period_end,
    canceled_at,
    trial_days,
  } = payload;

  console.log("📦 Subscription Update");
  console.log({
    subscriptionId,
    name,
    status,
    trial_days,
    created_at,
    current_period_end,
    canceled_at,
  });

  /**
   * DEMO logic only (no DB)
   */
  switch (status) {
    case "ACTIVE":
      console.log("✅ Subscription is ACTIVE");
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

  // IMPORTANT: Always return 200 so Shopify stops retrying
  return new Response("OK", { status: 200 });
};
