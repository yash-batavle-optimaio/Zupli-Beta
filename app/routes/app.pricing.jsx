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
  Divider,
  ButtonGroup,
  Badge,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  StoreIcon,
  ArrowLeftIcon,
  RewardIcon,
  OrganizationIcon,
  ChartHistogramGrowthIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { PRICING_PLANS } from "./config/pricingPlans";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const query = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          status
        }
      }
    }
  `;

  const res = await admin.graphql(query);
  const data = await res.json();

  const hasActiveSubscription =
    data.data.currentAppInstallation.activeSubscriptions.some(
      (sub) => sub.status === "ACTIVE",
    );

  return json({ hasActiveSubscription });
};
/* ---------------- Plans Config ---------------- */
const PLANS = PRICING_PLANS;
/* ---------------- Feature Row ---------------- */
function FeatureItem({ label }) {
  return (
    <InlineStack gap="200" align="start" wrap={false}>
      <Box minWidth="20px" flexShrink={0}>
        <Icon source={CheckCircleIcon} tone="success" />
      </Box>
      <Box>
        <Text as="span">{label}</Text>
      </Box>
    </InlineStack>
  );
}
/* ---------------- Pricing Card ---------------- */
function PricingCard({ plan, billingCycle }) {
  const price =
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const yearlySavings = plan.monthlyPrice * 12 - plan.yearlyPrice;
  const offPercent =
    plan.monthlyPrice > 0
      ? Math.round((yearlySavings / (plan.monthlyPrice * 12)) * 100)
      : 0;
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}

        <BlockStack gap="100">
          <InlineStack gap="200" align="start" wrap={false}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline", // 🔥 key for correct alignment
                gap: "2px",
              }}
            >
              <Icon source={plan.icon} />
              <Text as="span" variant="headingXl" fontWeight="bold">
                {plan.title}
              </Text>
            </div>
          </InlineStack>
          <Text tone="subdued">{plan.subtitle}</Text>
        </BlockStack>

        {/* Price */}
        <BlockStack gap="100">
          <Text as="h2" variant="headingLg">
            ${price}{" "}
            <Text as="span" tone="subdued" variant="bodyMd">
              {billingCycle === "yearly" ? "/Year" : "/Month"}
            </Text>
          </Text>
          {/* 🔥 OFF PRICE (GREEN, BELOW PRICE) */}
          {billingCycle === "yearly" && yearlySavings > 0 && (
            <InlineStack gap="200" align="start">
              <Badge tone="success">{offPercent}% OFF</Badge>
              <Text tone="success" variant="bodySm">
                Save ${yearlySavings} yearly
              </Text>
            </InlineStack>
          )}
        </BlockStack>
        {/* Button */}
        <Button fullWidth variant="primary" disabled={plan.disabled}>
          {plan.disabled ? "Current plan" : "Upgrade"}
        </Button>
        {/* Divider */}
        <Box>
          <Divider />
        </Box>
        {/* Features */}
        <BlockStack gap="200">
          {plan.features.map((feature) => (
            <FeatureItem key={feature} label={feature} />
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
/* ---------------- Pricing Page ---------------- */
export default function Pricing() {
  const { hasActiveSubscription } = useLoaderData();
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <Page
      title={
        <InlineStack gap="500" blockAlign="center">
          <Button
            icon={ArrowLeftIcon}
            plain
            onClick={() => window.history.back()}
          />
          <Text variant="headingLg" as="h2">
            Pricing
          </Text>
        </InlineStack>
      }
    >
      <Box paddingBlockEnd="600">
        <Card>
          <BlockStack gap="600">
            {/* Header */}
            <InlineGrid columns="auto 1fr" gap="400" alignItems="center">
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
                  Our pricing is flexible for merchants while ensuring
                  world-class service without compromise.
                </Text>

                {/* 🔥 Action Buttons */}
                <InlineStack gap="300" align="center">
                  <Button
                    variant="primary"
                    onClick={() => {
                      window.location.href = "/app/billing";
                    }}
                  >
                    Subscribe
                  </Button>

                  <Button
                    variant="secondary"
                    tone="critical"
                    disabled={!hasActiveSubscription}
                  >
                    Cancel plan
                  </Button>
                </InlineStack>
              </BlockStack>
            </InlineGrid>
            {/* Toggle (NO layout change) */}
            <InlineStack align="center">
              <ButtonGroup segmented>
                <Button
                  pressed={billingCycle === "monthly"}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  pressed={billingCycle === "yearly"}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Annually
                </Button>
              </ButtonGroup>
            </InlineStack>
            {/* Pricing Cards (GRID UNCHANGED) */}
            <Box maxWidth="900px" paddingInline="400" marginInline="auto">
              <InlineGrid
                alignItems="stretch"
                columns={{
                  xs: "1fr 1fr",
                  md: "1fr 1fr",
                  lg: "1fr 1fr",
                  xl: "1fr 1fr ",
                }}
                gap="400"
              >
                {PLANS.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                  />
                ))}
              </InlineGrid>
            </Box>
          </BlockStack>
        </Card>
      </Box>
    </Page>
  );
}
