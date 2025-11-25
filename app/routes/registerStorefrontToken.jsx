// /app/utils/api.registerStorefrontToken.jsx

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function registerStorefrontToken(admin, shop) {
  console.log("🔑 Creating storefront access token for:", shop);

  const mutation = `
    mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        userErrors {
          field
          message
        }
        storefrontAccessToken {
          accessToken
          title
        }
      }
    }
  `;

  // Call Shopify Admin API
  const response = await admin.graphql(mutation, {
    variables: {
      input: { title: "Optima Storefront Token" },
    },
  });

  const json = await response.json();

  const token =
    json?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;

  if (!token) {
    console.error(
      "❌ Failed to create storefront token:",
      json?.data?.storefrontAccessTokenCreate?.userErrors
    );
    return null;
  }

  // Save token in DB (upsert)
  await prisma.shop.upsert({
    where: { shopDomain: shop },
    update: { storefrontAccessToken: token },
    create: {
      shopDomain: shop,
      storefrontAccessToken: token,
    },
  });

  console.log("✅ Storefront token saved for:", shop);
  return token;
}
