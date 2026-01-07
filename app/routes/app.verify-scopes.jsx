import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // 🔎 Verify scopes granted to THIS access token
  const response = await admin.graphql(`
    query {
      appInstallation {
        accessScopes {
          handle
        }
      }
    }
  `);

  const result = await response.json();
  console.log("🔐 Granted scopes:", result.data.appInstallation.accessScopes);

  return json({
    shop: session.shop,
    grantedScopes: result.data.appInstallation.accessScopes,
  });
};

export default function VerifyScopes() {
  return null;
}
