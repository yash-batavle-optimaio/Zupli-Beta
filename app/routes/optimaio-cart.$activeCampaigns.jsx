// app/routes/optimaio-cart.jsx
import { authenticate } from "../shopify.server";
import { createClient } from "redis";

// -------------------------------
// Redis (NO TOP-LEVEL AWAIT)
// -------------------------------
const redis = createClient({
  username: "default",
  password: "TAqxfnXDpLQv9QG64FZNRsdk6Daq0xrL",
  socket: {
    host: "redis-16663.crce179.ap-south-1-1.ec2.cloud.redislabs.com",
    port: 16663,
  },
});

redis.on("error", (err) => console.error("Redis Error:", err));

let redisReady = null;

// FIX: no top-level await, lazy connect
function connectRedis() {
  if (!redisReady) {
    redisReady = redis.connect().catch((err) => {
      redisReady = null;
      throw err;
    });
  }
  return redisReady;
}

async function getRedis() {
  await connectRedis();
  return redis;
}

// -------------------------------
// Safe JSON parser
// -------------------------------
function safeJsonParse(str, fallback = {}) {
  if (!str || typeof str !== "string") return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const loader = async ({ request }) => {
  try {
    // Authenticate
    const auth = await authenticate.public.appProxy(request);
    const { admin } = auth;
    let { shop } = auth;

    // Fallback shop
    const url = new URL(request.url);
    const shopFromQuery = url.searchParams.get("shop");
    if (!shop && shopFromQuery) shop = shopFromQuery;

    if (!shop) {
      console.error("❌ SHOP IS STILL UNDEFINED.");
      return new Response(JSON.stringify({ error: "Missing shop" }), {
        status: 400,
      });
    }

    if (!admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const redisKey = `campaigns:${shop}`;

    // GET Redis
    const client = await getRedis();
    const fromRedis = await client.get(redisKey);

    if (fromRedis) {
      const redisObj = safeJsonParse(fromRedis, { data: {} });
      const result = redisObj.data || {};
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback to Shopify metafield
    const gql = await admin.graphql(`
      query {
        shop {
          metafield(namespace: "optimaio_cart", key: "campaigns") {
            value
          }
        }
      }
    `);

    const json = await gql.json();
    let metafieldValue = json?.data?.shop?.metafield?.value;

    const bad = [undefined, null, "null", "undefined", ""];
    if (bad.includes(metafieldValue)) metafieldValue = "{}";

    const parsed = safeJsonParse(metafieldValue, {});

    // Save to Redis
    await client.set(
      redisKey,
      JSON.stringify({
        data: parsed,
        updatedAt: new Date().toISOString(),
      })
    );

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Loader failed:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500 }
    );
  }
};
