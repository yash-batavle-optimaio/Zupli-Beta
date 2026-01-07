import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

/* ---------------- LOADER ---------------- */
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
  query {
  customers(first: 5) {
    edges {
      node {
        id
        email
        tags
        createdAt
      }
    }
  }
}

  `);

  const result = await response.json();

  const customers = result.data.customers.edges.map((edge) => edge.node);

  return json(customers);
};

/* ---------------- UI ---------------- */
export default function Customers() {
  const customers = useLoaderData();

  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify(customers, null, 2)}
    </pre>
  );
}
