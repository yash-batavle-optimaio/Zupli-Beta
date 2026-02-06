import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import { XIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppIndexPage() {
  const feedbackConfig = {
    title: "How do you like the app so far?",
    description:
      "Did the app meet your expectations? Was it easy to setup? Was the support team helpful?",
    illustration: {
      src: "home-page/home-review.svg",
      alt: "Feedback illustration",
      height: 90,
    },
    actions: [
      {
        id: "positive",
        label: "Yes, it’s great!",
        variant: "primary",
        url: "https://apps.shopify.com/your-app-name#reviews",
      },
      {
        id: "negative",
        label: "No, I have suggestions",
        variant: "tertiary",
        url: "https://optimaio.com/pages/feedback",
      },
    ],
  };

  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [showFeedbackCard, setShowFeedbackCard] = useState(true);

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <Page>
      <Box paddingBlockEnd="600">
        <Layout>
          <Layout.Section>
            <Card padding="600">
              <Box
                background="bg-surface-secondary"
                borderRadius="300"
                padding="300"
              >
                <InlineStack align="center" wrap>
                  {/* Image */}

                  <InlineStack align="center">
                    <img
                      src="home-page/home-campaign-banner-cart-goal.svg"
                      alt="Cart goal illustration"
                      style={{ height: "150px" }}
                    />
                  </InlineStack>

                  {/* Right content (UNCHANGED STRUCTURE) */}
                  <Layout.Section variant="oneThird">
                    <BlockStack gap="400" inlineAlign="center">
                      <Text variant="headingMd" as="h2">
                        Offer gifts based on purchase milestones
                      </Text>

                      <Text variant="bodyMd" tone="subdued">
                        Create a campaign that offers gifts to customers based
                        on their purchase milestones. For example, offer a free
                        gift when a customer spends $100.
                      </Text>

                      <InlineStack>
                        <Box maxWidth="240px" width="100%">
                          <Button
                            variant="primary"
                            fullWidth
                            size="slim"
                            onClick={() => navigate("/app/create-campaign")}
                          >
                            Create a Cart goal campaign
                          </Button>
                        </Box>
                      </InlineStack>
                    </BlockStack>
                  </Layout.Section>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <InlineStack gap="400" align="stretch" wrap={false}>
              {/* Card 1 */}
              <Box width="100%" style={{ flex: 1 }}>
                <Card padding="400">
                  <BlockStack gap="300" inlineAlign="center">
                    <img
                      src="home-page/home-call.svg"
                      alt="Help"
                      style={{ height: 48 }}
                    />

                    <Text variant="headingSm" as="h3">
                      Need help?
                    </Text>

                    <Text tone="subdued" alignment="center">
                      Need help with setup? Have questions? Ping us in chat and
                      we’ll be happy to help.
                    </Text>
                    <Button
                      size="slim"
                      fullWidth
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          "support@optimaio.com",
                        );
                        setShowToast(true);
                      }}
                    >
                      Copy support email
                    </Button>

                    {showToast && (
                      <Banner
                        tone="success"
                        onDismiss={() => setShowToast(false)}
                      >
                        Support email copied to clipboard
                      </Banner>
                    )}
                  </BlockStack>
                </Card>
              </Box>

              {/* Card 2 */}
              <Box width="100%" style={{ flex: 1 }}>
                <Card padding="400">
                  <BlockStack gap="300" inlineAlign="center">
                    <img
                      src="home-page/home-chat.svg"
                      alt="Schedule demo"
                      style={{ height: 48 }}
                    />

                    <Text variant="headingSm" as="h3">
                      Schedule a demo
                    </Text>

                    <Text tone="subdued" alignment="center">
                      Learn best practices to boost your average order value
                      using Zupli.
                    </Text>

                    <Button
                      size="slim"
                      fullWidth
                      url="https://optimaio.com/pages/contact"
                      target="_blank"
                    >
                      Schedule a call
                    </Button>
                  </BlockStack>
                </Card>
              </Box>

              {/* Card 3 */}
              {/* <Box width="100%" style={{ flex: 1 }}>
                <Card padding="400">
                  <BlockStack gap="300" inlineAlign="center">
                    <img
                      src="index-page/home-slack.svg"
                      alt="Slack"
                      style={{ height: 48 }}
                    />

                    <Text variant="headingSm" as="h3">
                      Join our Slack channel
                    </Text>

                    <Text tone="subdued" alignment="center">
                      Get direct access to our development team by joining our
                      dedicated Slack channel.
                    </Text>

                    <Button size="slim" fullWidth>
                      Join us on Slack
                    </Button>
                  </BlockStack>
                </Card>
              </Box> */}
            </InlineStack>
          </Layout.Section>

          {showFeedbackCard && (
            <Layout.Section>
              <Card padding="600">
                <Box borderRadius="300">
                  <InlineStack align="space-between" gap="600" wrap={false}>
                    {/* Left content */}
                    <BlockStack gap="300" inlineAlign="start">
                      <Text variant="headingMd" as="h2">
                        {feedbackConfig.title}
                      </Text>

                      <Text tone="subdued">{feedbackConfig.description}</Text>

                      <InlineStack gap="200">
                        {feedbackConfig.actions.map((action) => (
                          <Button
                            key={action.id}
                            variant={action.variant}
                            size="slim"
                            url={action.url}
                            target="_blank"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </InlineStack>
                    </BlockStack>

                    {/* Right illustration */}
                    <InlineStack gap="200" inlineAlign="end" wrap={false}>
                      <img
                        src={feedbackConfig.illustration.src}
                        alt={feedbackConfig.illustration.alt}
                        style={{ height: feedbackConfig.illustration.height }}
                      />
                      {/* <Box>
                        <Button
                          variant="tertiary"
                          icon={XIcon}
                          accessibilityLabel="Dismiss feedback"
                          onClick={() => setShowFeedbackCard(false)}
                        />
                      </Box> */}
                    </InlineStack>
                  </InlineStack>
                </Box>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </Box>
    </Page>
  );
}
