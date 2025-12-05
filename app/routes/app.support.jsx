import { authenticate } from "../shopify.server";
import { Page, Layout, Card, TextField, Text } from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppSupportPage() {
  const [title, setTitle] = useState("Scarcity Timer");
  const [timerText, setTimerText] = useState("Hurry! Offer ends soon!");

  return (
    <Page title="Cart Settings">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Title Label */}
              <Text variant="headingMd" as="h6">
                Cart Scarcity Timer Settings
              </Text>

              {/* Title Input */}
              <TextField
                label="Title"
                value={title}
                onChange={(val) => setTitle(val)}
                autoComplete="off"
                placeholder="Enter scarcity timer title"
              />

              {/* Text Field for timer message */}
              <TextField
                label="Timer Text"
                value={timerText}
                onChange={(val) => setTimerText(val)}
                autoComplete="off"
                placeholder="Write the text shown in the cart"
                multiline={2}
              />
            </div>
          </Card>
          <div
      style={{
        height: "100vh",
        overflow: "auto",
        background: "#f7f7f7",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Corner Cart Preview</h2>

      <iframe
        src="/preview/corner-cart"
        style={{
          width: "100%",
          height: "800px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      ></iframe>
    </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
