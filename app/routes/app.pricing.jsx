import {
  Page,
  Card,
  Box,
  BlockStack,
  InlineGrid,
  InlineStack,
  Text,
  Button,
  Icon,
} from "@shopify/polaris";
import { CheckCircleIcon, StoreIcon } from "@shopify/polaris-icons";
import { useNavigate } from "@remix-run/react";


/* ---------------- Feature Row ---------------- */
function FeatureItem({ label }) {



  return (
    <InlineStack gap="200" align="start">
      <Box minWidth="20px">
        <Icon source={CheckCircleIcon} tone="success" />
      </Box>
      <Text as="span">{label}</Text>
    </InlineStack>
  );
}

/* ---------------- Pricing Page ---------------- */
export default function Pricing() {
  const navigate = useNavigate();
  return (
    <Page title="Pricing"   backAction={{
    content: "Back",
    onAction: () => navigate(-1),
  }}>
      <Card>
        <BlockStack gap="600">
          {/* ---------------- Header ---------------- */}
          <InlineGrid
            columns="auto 1fr"   // 👈 ALWAYS side-by-side
            gap="400"
            alignItems="center"
          >
            <Box width="64px" height="64px">
              <img
                src="/optimaio-pricing.svg"
                alt="Optimaio pricing"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>

            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Select a plan
              </Text>
              <Text tone="subdued">
                Our pricing is flexible for merchants while ensuring world-class
                service without compromise.
              </Text>
            </BlockStack>
          </InlineGrid>

          {/* ---------------- Pricing Cards ---------------- */}
         <Box maxWidth="900px"  paddingInline="400" marginInline="auto">
  <InlineGrid columns="1fr 1fr" gap="400" >
            {/* -------- Free Plan -------- */}
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                               <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" align="center">
                  <Icon source={StoreIcon} />
                  <Text as="h1" variant="headingXl">
                    Free
                  </Text>
                </InlineStack>
</InlineStack>

                <Text tone="subdued">Free forever</Text>
</BlockStack>
                <Text as="h2" variant="headingLg">
                  $0{" "}
                  <Text as="span" tone="subdued" variant="bodyMd">
                    /Month
                  </Text>
                </Text>

                {/* Features */}
                <BlockStack gap="200">
                  <FeatureItem label="Cart theming" />
                  <FeatureItem label="Floating cart button" />
                  <FeatureItem label="In-cart discount box" />
                  <FeatureItem label="Sticky bar ATC widget" />
                  <FeatureItem label="Multi-language support" />
                  <FeatureItem label="In-cart terms check box" />
                  <FeatureItem label="Custom CSS & JS support" />
                  <FeatureItem label="Customisable cart drawer" />
                </BlockStack>

                <Button fullWidth disabled>
                  Current plan
                </Button>
              </BlockStack>
            </Card>

            {/* -------- Standard Plan -------- */}
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" align="center">
                  <Icon source={StoreIcon} />
                  <Text as="h3" variant="headingXl">
                    Standard
                  </Text>
                </InlineStack>
</InlineStack>
                <Text tone="subdued">
                  Fixed pricing based on Shopify plan
                </Text>
                </BlockStack>

                <Text as="h2" variant="headingLg">
                  $15{" "}
                  <Text as="span" tone="subdued" variant="bodyMd">
                    /Month
                  </Text>
                </Text>

                {/* Features */}
                <BlockStack gap="200">
                  <FeatureItem label="Everything in Free plan" />
                  <FeatureItem label="In-cart upsell" />
                  <FeatureItem label="Cart progress bar" />
                  <FeatureItem label="One-click upsell" />
                  <FeatureItem label="Free gift campaigns" />
                  <FeatureItem label="Cart announcement bar" />
                  <FeatureItem label="Cart countdown timer" />
                  <FeatureItem label="Priority chat support" />
                  <FeatureItem label="Volume discount campaign" />
                  <FeatureItem label="Buy X Get Y campaigns" />
                </BlockStack>

                <Button fullWidth primary>
                  Upgrade
                </Button>
              </BlockStack>
            </Card>
     </InlineGrid>
</Box>
        </BlockStack>
      </Card>
    </Page>
  );
}
