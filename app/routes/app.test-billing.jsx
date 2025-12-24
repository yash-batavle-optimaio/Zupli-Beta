import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createUsageCharge } from "./utils/createUsageCharge.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const orders = Number(url.searchParams.get("orders") || 0);

  if (!orders) {
    return json({
      message: "Pass ?orders=NUMBER to simulate usage",
    });
  }

  // 🔹 Get active subscription
  const subQuery = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          createdAt
          trialDays
          lineItems {
            id
            plan {
              pricingDetails {
                __typename
              }
            }
          }
        }
      }
    }
  `;

  const subRes = await admin.graphql(subQuery);
  const subData = await subRes.json();

  const subscription =
    subData.data.currentAppInstallation.activeSubscriptions[0];

  if (!subscription) {
    throw new Error("No active subscription");
  }

  // 🔹 Detect usage line item
  const usageLineItem = subscription.lineItems.find(
    (li) => li.plan.pricingDetails.__typename === "AppUsagePricing"
  );

  if (!usageLineItem) {
    throw new Error("Usage pricing line item not found");
  }

  // 🔹 Simulated charged tiers (reset every test)
  const charged = {
    tier1: false,
    tier2: false,
    tier3: false,
    tier4: false,
  };

  // 🔹 Pricing logic
  const charges = [];

  if (orders >= 2000 && !charged.tier1) {
    charges.push({
      amount: 19.99,
      desc: "0–2000 orders tier reached",
    });
    charged.tier1 = true;
  }

  if (orders >= 5000 && !charged.tier2) {
    charges.push({
      amount: 15.0,
      desc: "2001–5000 orders tier reached",
    });
    charged.tier2 = true;
  }

  if (orders >= 10000 && !charged.tier3) {
    charges.push({
      amount: 15.0,
      desc: "5001–10000 orders tier reached",
    });
    charged.tier3 = true;
  }

  if (orders > 10000 && !charged.tier4) {
    charges.push({
      amount: 25.0,
      desc: "10000+ orders tier reached",
    });
    charged.tier4 = true;
  }

  // 🔹 Create usage charges
  const created = [];

  for (const charge of charges) {
    const record = await createUsageCharge({
      admin,
      subscriptionLineItemId: usageLineItem.id,
      amount: charge.amount,
      description: charge.desc,
    });

    created.push(record);
  }

  return json({
    simulatedOrders: orders,
    usageChargesCreated: created,
  });
};
