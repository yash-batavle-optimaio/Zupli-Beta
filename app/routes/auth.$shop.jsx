import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  console.log("⭐ OAuth Start for:", params.shop);

  return authenticate.admin(request);
};
