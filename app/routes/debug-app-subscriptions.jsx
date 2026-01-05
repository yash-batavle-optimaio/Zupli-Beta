import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query AppSubscriptionsWithUsage {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          createdAt
          trialDays

          lineItems {
            id  # 🔥 IMPORTANT: used in createUsageCharge

            plan {
              pricingDetails {
                __typename

                # Recurring pricing
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }

                # Usage pricing (NO usageRecords here)
                ... on AppUsagePricing {
                  cappedAmount {
                    amount
                    currencyCode
                  }
                  terms
                }
              }
            }

            # ✅ CORRECT PLACE FOR USAGE RECORDS
            usageRecords(first: 50) {
              edges {
                node {
                  id
                  description
                  createdAt
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const result = await response.json();

  return json({
    shop: session.shop,
    subscriptions:
      result?.data?.currentAppInstallation?.activeSubscriptions ?? [],
  });
};
