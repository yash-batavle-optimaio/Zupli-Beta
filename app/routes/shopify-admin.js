// app/shopify-admin.js
import { GraphQLClient } from "graphql-request";

export async function createStorefrontAccessToken({ shop, adminAccessToken, title }) {
  const endpoint = `https://${shop}/admin/api/2024-04/graphql.json`;
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": adminAccessToken,
      "Content-Type": "application/json",
    },
  });

  const mutation = `
    mutation StorefrontAccessTokenCreate {
      storefrontAccessTokenCreate(input: { title: "${title}" }) {
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

  return client.request(mutation);
}