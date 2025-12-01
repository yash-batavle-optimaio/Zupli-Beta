import { authenticate } from "../shopify.server";

/**
 * Handles shop/update webhook — updates default money formats ONLY if changed
 */
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
  } catch (err) {
    console.error("🚨 Error in shop/update handler:", err);
  }

  return new Response("ok");
};
