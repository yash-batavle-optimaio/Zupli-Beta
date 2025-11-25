import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  // Create Storefront API token
  const CREATE_STOREFRONT_TOKEN = `
    mutation {
      storefrontAccessTokenCreate(input: { title: "App Storefront Token" }) {
        storefrontAccessToken {
          id
          accessToken
          createdAt
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(CREATE_STOREFRONT_TOKEN);
  const data = await response.json();

  console.log("Storefront Token Create Result:", data);

  const token =
    data?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;

  if (token) {
    await prisma.storefrontToken.upsert({
      where: { shop: session.shop },
      update: { token },
      create: { shop: session.shop, token },
    });
  }

  return admin.session.redirectToShopifyOrAppRoot();
};
