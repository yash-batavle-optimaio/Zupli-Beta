import { authenticate } from "../shopify.server";
import { Box, InlineGrid, Page } from "@shopify/polaris";
import SettingsLeftCard from "./components/SettingsLeftCard";
import SettingsRightCard from "./components/SettingsRightCard";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppSettingsPage() {
  return (
    <Page padding="400">
      <Box padding="400">
        <InlineGrid columns={{ xs: 1, md: "1fr 2fr" }} gap="400">
          {/* Plan */}
          {/* Left Section */}
          <SettingsLeftCard
            title="Account settings"
            description="Manage your account settings."
          />

          {/* Right section */}
          <SettingsRightCard
            title="Your current plan"
            description="Upgrade or downgrade to any plan we offer using the settings given below."
          ></SettingsRightCard>
        </InlineGrid>
      </Box>
    </Page>
  );
}
