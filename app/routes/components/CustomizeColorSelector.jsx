import {
  Box,
  Text,
  TextField,
  InlineStack,
  Icon,
  BlockStack,
} from "@shopify/polaris";
import { ColorIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import HelpHeader from "./HelpHeader";

export default function CustomizeColorSelector() {
  const [tab, setTab] = useState("button");

  // Button
  const [buttonColor, setButtonColor] = useState("#ff0000");

  // Text
  const [primaryColor, setPrimaryColor] = useState("#ff0000");
  const [secondaryColor, setSecondaryColor] = useState("#0000ff");

  // Progress bar
  const [progressStart, setProgressStart] = useState("#ff0000");
  const [progressEnd, setProgressEnd] = useState("#0000ff");

  return (
    <Box paddingTop="200" paddingBottom="300">
      
      <HelpHeader
        title="Cart banner"
        helpText="Customize colors for buttons, text, and progress bar"
      />

      {/* --------- NEW TABS --------- */}
      <InlineStack align="center" gap="600" wrap={false}>
        {["button", "text", "progress"].map((type) => (
          <Box
            key={type}
            onClick={() => setTab(type)}
            style={{ cursor: "pointer", textAlign: "center" }}
          >
            <Text
              variant="bodyLg"
              fontWeight={tab === type ? "bold" : "regular"}
              color={tab === type ? "text" : "subdued"}
            >
              {type === "button" && "Button"}
              {type === "text" && "Text"}
              {type === "progress" && "Progress Bar"}
            </Text>

            {tab === type && (
              <Box
                style={{
                  height: "2px",
                  width: "100%",
                  marginTop: "4px",
                  backgroundColor: "#000",
                }}
              />
            )}
          </Box>
        ))}
      </InlineStack>

      {/* ---------------- BUTTON TAB ---------------- */}
      {tab === "button" && (
        <Box paddingY="400">
          <Text variant="headingSm" fontWeight="semibold">
            Button Color
          </Text>

          <Box
            onClick={() =>
              document.getElementById("buttonColorInput")?.click()
            }
            padding="200"
            borderWidth="2"
            borderColor="border"
            borderRadius="300"
            background="bg-surface-secondary"
            marginTop="300"
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "48px",
              gap: "12px",
            }}
          >
            <Box
              style={{
                width: "34px",
                height: "34px",
                background: buttonColor,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon source={ColorIcon} tone="inverse" />
            </Box>

            <Text variant="bodyMd" tone="subdued">Button color</Text>

            <input
              type="color"
              id="buttonColorInput"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              style={{ display: "none" }}
            />
          </Box>
        </Box>
      )}

      {/* ---------------- TEXT TAB ---------------- */}
    {/* ---------------- TEXT TAB ---------------- */}
{tab === "text" && (
  <Box paddingY="400">
    <Text variant="headingSm" fontWeight="semibold">
      Text Colors
    </Text>

    <InlineStack gap="0" marginTop="300" align="center">

      {/* PRIMARY (left box) */}
      <Box
        onClick={() =>
          document.getElementById("primaryColorInput")?.click()
        }
        padding="200"
        borderWidth="2"
        borderColor="border"
        borderRadius="300 0 0 300"
        background="bg-surface-secondary"
        style={{
          cursor: "pointer",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "48px",
          gap: "12px",
        }}
      >
        <Box
          style={{
            width: "34px",
            height: "34px",
            background: primaryColor,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon source={ColorIcon} tone="inverse" />
        </Box>

        <Text variant="bodyMd" tone="subdued">Primary</Text>

        <input
          type="color"
          id="primaryColorInput"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          style={{ display: "none" }}
        />
      </Box>

      {/* Divider */}
      <Box
        style={{
          width: "1px",
          height: "48px",
          background: "#d9d9d9",
        }}
      />

      {/* SECONDARY (right box) */}
      <Box
        onClick={() =>
          document.getElementById("secondaryColorInput")?.click()
        }
        padding="200"
        borderWidth="2"
        borderColor="border"
        borderRadius="0 300 300 0"
        background="bg-surface-secondary"
        style={{
          cursor: "pointer",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "48px",
          gap: "12px",
        }}
      >
        <Box
          style={{
            width: "34px",
            height: "34px",
            background: secondaryColor,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon source={ColorIcon} tone="inverse" />
        </Box>

        <Text variant="bodyMd" tone="subdued">Secondary</Text>

        <input
          type="color"
          id="secondaryColorInput"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          style={{ display: "none" }}
        />
      </Box>

    </InlineStack>
  </Box>
)}

      {/* ---------------- PROGRESS BAR TAB ---------------- */}
      {tab === "progress" && (
        <Box paddingY="400">
          <Text variant="headingSm" fontWeight="semibold">
            Progress Bar Colors
          </Text>

          <InlineStack gap="0" marginTop="300" align="center">

            {/* START COLOR */}
            <Box
              onClick={() =>
                document.getElementById("progressStartColorInput")?.click()
              }
              padding="200"
              borderWidth="2"
              borderColor="border"
              borderRadius="300 0 0 300"
              background="bg-surface-secondary"
              style={{
                cursor: "pointer",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "48px",
                gap: "12px",
              }}
            >
              <Box
                style={{
                  width: "34px",
                  height: "34px",
                  background: progressStart,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon source={ColorIcon} tone="inverse" />
              </Box>

              <Text variant="bodyMd" tone="subdued">Start color</Text>

              <input
                type="color"
                id="progressStartColorInput"
                value={progressStart}
                onChange={(e) => setProgressStart(e.target.value)}
                style={{ display: "none" }}
              />
            </Box>

            {/* Divider */}
            <Box
              style={{
                width: "1px",
                height: "48px",
                background: "#d9d9d9",
              }}
            />

            {/* END COLOR */}
            <Box
              onClick={() =>
                document.getElementById("progressEndColorInput")?.click()
              }
              padding="200"
              borderWidth="2"
              borderColor="border"
              borderRadius="0 300 300 0"
              background="bg-surface-secondary"
              style={{
                cursor: "pointer",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "48px",
                gap: "12px",
              }}
            >
              <Box
                style={{
                  width: "34px",
                  height: "34px",
                  background: progressEnd,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon source={ColorIcon} tone="inverse" />
              </Box>

              <Text variant="bodyMd" tone="subdued">End color</Text>

              <input
                type="color"
                id="progressEndColorInput"
                value={progressEnd}
                onChange={(e) => setProgressEnd(e.target.value)}
                style={{ display: "none" }}
              />
            </Box>

          </InlineStack>
        </Box>
      )}

    </Box>
  );
}
