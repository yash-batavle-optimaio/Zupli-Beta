/**
 * Shopify Subscription Mutations
 * Server-only helpers
 */

export async function createAppSubscription({
  admin,
  returnUrl,
  trialDays = 7,
}) {
  const mutation = `
    mutation AppSubscriptionCreate(
      $name: String!
      $returnUrl: URL!
      $trialDays: Int
      $lineItems: [AppSubscriptionLineItemInput!]!
    ) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        lineItems: $lineItems
        test: true
      ) {
        confirmationUrl
        userErrors {
          message
        }
      }
    }
  `;

  const variables = {
    name: "Order-Based Pricing",
    returnUrl,
    trialDays,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: 0, currencyCode: "USD" },
            interval: "EVERY_30_DAYS",
          },
        },
      },
      {
        plan: {
          appUsagePricingDetails: {
            cappedAmount: { amount: 74.99, currencyCode: "USD" },
            terms: "Monthly pricing based on order volume.",
          },
        },
      },
    ],
  };

  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

  const result = data.data.appSubscriptionCreate;

  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result.confirmationUrl;
}

/* ----------------------------------
   Cancel Active Subscription
---------------------------------- */
export async function cancelAppSubscription({ admin, subscriptionId }) {
  const mutation = `
    mutation AppSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: { id: subscriptionId },
  });

  const data = await response.json();
  const result = data.data.appSubscriptionCancel;

  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result.appSubscription;
}
