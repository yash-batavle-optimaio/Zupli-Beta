import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  console.log("App installed for shop: YAShopifyTestStore.myshopify.com");
  await authenticate.admin(request);

  return null;
};
