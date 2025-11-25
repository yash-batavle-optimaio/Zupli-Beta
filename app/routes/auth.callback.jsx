import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  return authenticate.admin(request, {
    async afterAuth({ session }) {
      console.log("🔥 Installation triggered for:", session.shop);
    }
  });
};
