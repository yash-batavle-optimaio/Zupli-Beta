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
// Webhook logic
// -------------------------------
export const action = async ({ request }) => {
  const { topic, admin, shop, session } = await authenticate.webhook(request);

  if (!session) {
    console.warn("⚠️ No active session found — possibly uninstalled shop:", shop);
    throw new Response("No session", { status: 401 });
  }

  console.log(`📥 Received webhook: ${topic} for ${shop}`);

  try {
    const query = `
      {
        shop {
          id
          currencyCode
          currencyFormats {
            moneyFormat
            moneyInEmailsFormat
            moneyWithCurrencyFormat
            moneyWithCurrencyInEmailsFormat
          }
          metafield(namespace: "optimaio_cart", key: "currencies") {
            id
            value
          }
        }
      }
    `;

    const res = await admin.graphql(query);
    const json = await res.json();
    const shopData = json?.data?.shop;

    if (!shopData) throw new Error("❌ Failed to load shop data");

    const newValue = {
      code: shopData.currencyCode,
      formats: shopData.currencyFormats,
    };

    let existing = {};
    if (shopData.metafield?.value) {
      try {
        existing = JSON.parse(shopData.metafield.value);
      } catch (err) {
        console.warn("⚠️ Failed to parse existing metafield JSON", err);
      }
    }

    const oldValue = existing.shopDefault || null;

    const isSame =
      oldValue &&
      oldValue.code === newValue.code &&
      JSON.stringify(oldValue.formats) === JSON.stringify(newValue.formats);

    if (isSame) {
      console.log("⏸ No currency/moneyFormat change — skipping metafield update");
      return new Response("no-change");
    }

    console.log("🔄 Money format or currency changed — updating metafield…");

    const mergedValue = {
      ...existing,
      shopDefault: {
        ...newValue,
        updatedAt: new Date().toISOString(),
      },
    };

    const mutation = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key type value updatedAt }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      metafields: [
        {
          namespace: "optimaio_cart",
          key: "currencies",
          type: "json",
          ownerId: shopData.id,
          value: JSON.stringify(mergedValue),
        },
      ],
    };

    const saveRes = await admin.graphql(mutation, { variables });
    const saveJson = await saveRes.json();

    const errors = saveJson?.data?.metafieldsSet?.userErrors;
    if (errors?.length) {
      console.error("⚠️ Metafield save errors:", errors);
    } else {
      console.log(`✅ Saved updated shop moneyFormat for ${shop}`);
    }

    // -----------------------------------------
    // 🟢 NEW: Save updated currency to Redis
    // -----------------------------------------
    try {
      const client = await getRedis();
      const redisKey = `currencies:${shop}`;

      await client.set(
        redisKey,
        JSON.stringify({
          data: mergedValue,
          updatedAt: new Date().toISOString(),
        })
      );

      console.log(`🟢 Redis updated for ${shop} → ${redisKey}`);
    } catch (redisErr) {
      console.error("🚨 Failed to update Redis:", redisErr);
    }

  } catch (err) {
    console.error("🚨 Error in shop/update handler:", err);
  }

  return new Response("ok");
};
