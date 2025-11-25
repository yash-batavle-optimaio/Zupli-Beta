import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
console.log("App installed for shop Before");
  await authenticate.admin(request);
console.log("App installed for shop After");
  return null;
};
