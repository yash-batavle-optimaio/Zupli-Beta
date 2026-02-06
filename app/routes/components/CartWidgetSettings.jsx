import {
  Box,
  Button,
  InlineStack,
  BlockStack,
  Card,
  Icon,
  Text,
} from "@shopify/polaris";
import HelpHeader from "./HelpHeader";
import { ColorIcon } from "@shopify/polaris-icons";

/* ---------------- Toggle Pill ---------------- */
function TogglePill({ value, onChange, labels = ["Yes", "No"] }) {
  return (
    <Box
      background="bg-surface-secondary"
      borderRadius="200"
      padding="100"
      width="fit-content"
    >
      <InlineStack gap="100">
        <Button
          size="slim"
          variant={value ? "primary" : "tertiary"}
          onClick={() => onChange(true)}
        >
          {labels[0]}
        </Button>
        <Button
          size="slim"
          variant={!value ? "primary" : "tertiary"}
          onClick={() => onChange(false)}
        >
          {labels[1]}
        </Button>
      </InlineStack>
    </Box>
  );
}

/* ---------------- Main Component ---------------- */
export default function CartWidgetSettings({ value, onChange }) {
  const {
    position = "right", // "left" | "right"
    widgetColor = "#000000",
    showFloatingWidget = true,
  } = value || {};

  const update = (patch) => {
    onChange({
      ...value,
      ...patch,
    });
  };

  return (
    <BlockStack gap="400">
      {/* Floating widget */}
      <Box>
        <HelpHeader
          title="Show floating cart widget"
          helpText="Show a floating cart button that stays visible while customers browse."
        />

        <InlineStack paddingBlockStart="200">
          <TogglePill
            value={showFloatingWidget}
            onChange={(v) => update({ showFloatingWidget: v })}
          />
        </InlineStack>
      </Box>

      {/* Cart position */}
      <Box>
        <HelpHeader
          title="Widget position"
          helpText="Choose which side of the screen the cart widget opens from."
        />

        <InlineStack gap="100" paddingBlockStart="200">
          <Box
            background="bg-surface-secondary"
            borderRadius="200"
            padding="100"
            width="fit-content"
          >
            <InlineStack gap="100">
              <Button
                size="slim"
                variant={position === "left" ? "primary" : "tertiary"}
                onClick={() => update({ position: "left" })}
              >
                Left
              </Button>
              <Button
                size="slim"
                variant={position === "right" ? "primary" : "tertiary"}
                onClick={() => update({ position: "right" })}
              >
                Right
              </Button>
            </InlineStack>
          </Box>
        </InlineStack>
      </Box>

      {/* Widget color */}
      <Box>
        <HelpHeader
          title="Widget color"
          helpText="Choose the primary color for the cart widget."
        />

        <InlineStack paddingBlockStart="200">
          <Card padding="200">
            <Box
              onClick={() =>
                document.getElementById("widgetColorInput")?.click()
              }
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
            >
              {/* Color swatch */}
              <Box
                style={{
                  width: "34px",
                  height: "34px",
                  background: widgetColor,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon source={ColorIcon} tone="inverse" />
              </Box>

              {/* Label */}
              <Text variant="bodyMd" tone="subdued">
                Select color
              </Text>

              {/* Hidden color input */}
              <input
                type="color"
                id="widgetColorInput"
                value={widgetColor}
                onChange={(e) => update({ widgetColor: e.target.value })}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "1px",
                  height: "1px",
                  pointerEvents: "none",
                }}
              />
            </Box>
          </Card>
        </InlineStack>
      </Box>
    </BlockStack>
  );
}
