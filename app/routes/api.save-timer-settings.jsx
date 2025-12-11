import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

/* ------------------ Helper: Save metafield ------------------ */
async function setMetafield(admin, shopId, key, valueObj) {
  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key type value }
        userErrors { field message }
      }
    }
  `;

  const variables = {
    metafields: [
      {
        namespace: "optimaio_cart",
        key,
        type: "json",
        ownerId: shopId,
        value: JSON.stringify(valueObj),
      },
    ],
  };

  return await admin.graphql(mutation, { variables });
}

/* ------------------------------------------------------------ */
/*                     MAIN ACTION HANDLER                       */
/* ------------------------------------------------------------ */
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const body = await request.json();

  const {
    status,
    name,
    timerMode,
    duration,
    activeDates,
    afterAction,
    timerText,
  } = body;

  // Step 1 — Get Shop ID
  const shopRes = await admin.graphql(`{ shop { id } }`);
  const shopData = await shopRes.json();
  const shopId = shopData.data.shop.id;

  // Build metafield payload
  const timerSettings = {
    status: status || "draft",
    campaignName: name || "Untitled Timer",
    timerMode: timerMode || "duration",
    duration: duration || { hours: "0", minutes: "5", seconds: "0" },
    activeDates: activeDates || {
      end: { date: null, time: "11:00 PM" },
    },
    afterAction: afterAction || "refresh",
    timerText: timerText || "",
    updatedAt: new Date().toISOString(),
  };

  // Step 2 — Save metafield
  await setMetafield(admin, shopId, "cart_timer_settings", timerSettings);

  return json({
    ok: true,
    saved: timerSettings,
  });
};
