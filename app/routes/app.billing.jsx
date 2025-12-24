import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

/* =========================
   LOADER (SERVER)
========================= */
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  const RETURN_URL = `${process.env.APP_URL}/app/confirm?shop=${shop}&host=${host}`;

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
    returnUrl: RETURN_URL,
    trialDays: 7,
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
            terms:
              "Monthly pricing based on order volume: $19.99 (0–2000), $34.99 (2001–5000), $49.99 (5001–10000), $74.99 (10000+).",
          },
        },
      },
    ],
  };

  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

  const result = data.data.appSubscriptionCreate;

  if (result.userErrors.length) {
    throw new Error(result.userErrors[0].message);
  }

  return json({
    confirmationUrl: result.confirmationUrl,
  });
};

/* =========================
   UI (CLIENT)
========================= */
export default function Subscribe() {
  const { confirmationUrl } = useLoaderData();

  const handleClick = () => {
    window.open(confirmationUrl, "_top");
  };

  return (
    <Page title="Subscription">
      <Card sectioned>
        <Button primary onClick={handleClick}>
          Confirm Subscription
        </Button>
      </Card>
    </Page>
  );
}
