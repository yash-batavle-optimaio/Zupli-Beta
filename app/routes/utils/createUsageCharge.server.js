export async function createUsageCharge({
  admin,
  subscriptionLineItemId,
  amount,
  description,
}) {
  const mutation = `
    mutation AppUsageRecordCreate(
      $subscriptionLineItemId: ID!
      $price: MoneyInput!
      $description: String!
    ) {
      appUsageRecordCreate(
        subscriptionLineItemId: $subscriptionLineItemId
        price: $price
        description: $description
      ) {
        appUsageRecord {
          id
          price {
            amount
            currencyCode
          }
          createdAt
        }
        userErrors {
          message
        }
      }
    }
  `;

  const variables = {
    subscriptionLineItemId,
    price: { amount, currencyCode: "USD" },
    description,
  };

  const res = await admin.graphql(mutation, { variables });
  const data = await res.json();

  const result = data.data.appUsageRecordCreate;

  if (result.userErrors.length) {
    throw new Error(result.userErrors[0].message);
  }

  return result.appUsageRecord;
}
