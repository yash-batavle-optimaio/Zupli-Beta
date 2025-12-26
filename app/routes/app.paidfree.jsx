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
import { CheckCircleIcon, ArrowLeftIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { PRICING_PLANS } from "./config/pricingPlans";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  createAppSubscription,
  cancelAppSubscription,
} from "./utils/subscription.server";
import { getActiveSubscription } from "./utils/getActiveSubscription.server";
import { Toast } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const activeSub = await getActiveSubscription(admin);

  return json({
    hasActiveSubscription: Boolean(activeSub),
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // 🔥 CANCEL FLOW
  if (intent === "cancel") {
    const activeSub = await getActiveSubscription(admin);

    if (!activeSub) {
      return json({ error: "No active subscription" }, { status: 400 });
    }

    await cancelAppSubscription({
      admin,
      subscriptionId: activeSub.id,
    });

    return json({ cancelled: true });
  }

  // 🔥 SUBSCRIBE FLOW
  if (intent === "subscribe") {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const host = url.searchParams.get("host");

    const returnUrl = `${process.env.APP_URL}/app/billing?shop=${shop}&host=${host}`;

    const confirmationUrl = await createAppSubscription({
      admin,
      returnUrl,
    });

    return json({ confirmationUrl });
  }

  return json({ error: "Invalid action" }, { status: 400 });
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
function PricingCard({ plan, billingCycle, hasActiveSubscription }) {
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
          <InlineStack gap="200" align="Left">
            <Text as="h2" variant="headingLg">
              ${price}{" "}
              <Text as="span" tone="subdued" variant="bodyMd">
                {billingCycle === "yearly" ? "/Year" : "/Month"}
              </Text>
            </Text>
            {hasActiveSubscription && <Badge tone="success">Active</Badge>}
          </InlineStack>

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
  const fetcher = useFetcher();
  const { hasActiveSubscription } = useLoaderData();

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const toggleToast = () => setToastActive(false);

  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      window.open(fetcher.data.confirmationUrl, "_top");
    }

    if (fetcher.data?.cancelled) {
      setToastMessage("✅ Subscription cancelled successfully");
      setToastActive(true);
    }
  }, [fetcher.data]);

  const handleSubscribe = () => {
    fetcher.submit({ intent: "subscribe" }, { method: "post" });
  };

  const handleCancel = () => {
    fetcher.submit({ intent: "cancel" }, { method: "post" });
  };

  return (
    <>
      <Page>
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
                    Would you like to continue with the paid plan or switch to
                    the free plan?
                  </Text>
                </BlockStack>
              </InlineGrid>

              <InlineStack align="center" gap="300">
                <Button
                  variant="primary"
                  onClick={handleSubscribe}
                  disabled={hasActiveSubscription}
                >
                  {hasActiveSubscription ? "Subscribed" : "Subscribe"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    const shop = url.searchParams.get("shop");
                    const host = url.searchParams.get("host");

                    window.top.location.href = `/app/my-campaigns?shop=${shop}&host=${host}`;
                  }}
                >
                  No, continue
                </Button>
              </InlineStack>

              {/* Toggle (NO layout change) Monthly and Annually */}
              {/* <InlineStack align="center">
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
              </InlineStack> */}

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
                      hasActiveSubscription={hasActiveSubscription}
                    />
                  ))}
                </InlineGrid>
              </Box>
            </BlockStack>
          </Card>
        </Box>
      </Page>
      {toastActive && <Toast content={toastMessage} onDismiss={toggleToast} />}
    </>
  );
}
