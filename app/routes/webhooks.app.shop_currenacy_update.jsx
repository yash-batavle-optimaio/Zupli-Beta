import { authenticate } from "../shopify.server";

/**
 * Handles shop/update webhook — merges Shopify default currency into app metafield
 */
export const action = async ({ request }) => {
  const { topic, admin, shop, session } = await authenticate.webhook(request);

  if (!session) {
    console.warn("⚠️ No active session found — possibly uninstalled shop:", shop);
    throw new Response("No session", { status: 401 });
  }

  try {
    // 🧩 Step 1: Get shop currency info
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
    const data = await res.json();
    const shopData = data?.data?.shop;

    if (!shopData) throw new Error("❌ Failed to load shop data");

    // 🧠 Step 2: Parse existing app metafield (if it exists)
    let existing = { currencies: [], defaultCurrency: null };
    if (shopData.metafield?.value) {
      try {
        existing = JSON.parse(shopData.metafield.value);
      } catch (err) {
        console.warn("⚠️ Could not parse existing metafield JSON:", err);
      }
    }

    // 🧩 Step 3: Merge Shopify shop default info
    const mergedValue = {
      ...existing,
      shopDefault: {
        code: shopData.currencyCode,
        formats: shopData.currencyFormats,
        updatedAt: new Date().toISOString(),
      },
    };

    // 🧱 Step 4: Save merged metafield back
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
          key: "currencies", // ✅ same key as app
          type: "json",
          ownerId: shopData.id,
          value: JSON.stringify(mergedValue),
        },
      ],
    };

    const saveRes = await admin.graphql(mutation, { variables });
    const saveData = await saveRes.json();

    const errors = saveData?.data?.metafieldsSet?.userErrors;
    if (errors?.length) {
      console.error("⚠️ Metafield save errors:", errors);
    } else {
      console.log(`✅ Updated currencies metafield with shop default for ${shop}`);
    }
  } catch (err) {
    console.error("🚨 Error updating currencies metafield:", err);
  }

  return new Response("ok");
};
