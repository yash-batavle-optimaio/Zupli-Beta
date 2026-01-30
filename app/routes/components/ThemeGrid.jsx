import { useState, useEffect } from "react";
import {
  Box,
  InlineGrid,
  BlockStack,
  InlineStack,
  Text,
  Scrollable,
  Card,
  Divider,
} from "@shopify/polaris";

const ColorThemes = [
  {
    id: "theme0",
    name: "Sand Dunes Light green",
    src: "/theme-icons/thumbnail/sand-dunes-light-green.svg",
    previewSrc: "/theme-icons/preview/sand-dunes-light-green.png",
  },
  {
    id: "theme1",
    name: "Oh So Minimal Light",
    src: "/theme-icons/thumbnail/oh-so-minimal-light.svg",
    previewSrc: "/theme-icons/preview/oh-so-minimal-light.png",
  },
  {
    id: "theme2",
    name: "Fresh Gradient light",
    src: "/theme-icons/thumbnail/fresh-gradient-light.svg",
    previewSrc: "/theme-icons/preview/fresh-gradient-light.png",
  },
  {
    id: "theme3",
    name: "Aqua Light",
    src: "/theme-icons/thumbnail/aqua-light.svg",
    previewSrc: "/theme-icons/preview/aqua-light.png",
  },
  {
    id: "theme4",
    name: "Golden Hour Light",
    src: "/theme-icons/thumbnail/golden-hour-light.svg",
    previewSrc: "/theme-icons/preview/golden-hour-light.png",
  },
  {
    id: "theme5",
    name: "Sharp Edge Light",
    src: "/theme-icons/thumbnail/sharp-edge-light.svg",
    previewSrc: "/theme-icons/preview/sharp-edge-light.png",
  },
  {
    id: "theme6",
    name: "Poseidon Dark",
    src: "/theme-icons/thumbnail/poseidon-dark.svg",
    previewSrc: "/theme-icons/preview/poseidon-dark.png",
  },
  {
    id: "theme7",
    name: "Sand Dunes Light",
    src: "/theme-icons/thumbnail/sand-dunes-light.svg",
    previewSrc: "/theme-icons/preview/sand-dunes-light.png",
  },
  {
    id: "theme8",
    name: "Bubblegum Light",
    src: "/theme-icons/thumbnail/bubblegum-light.svg",
    previewSrc: "/theme-icons/preview/bubblegum-light.png",
  },
];

export default function ThemeGrid({ selectedTheme, onPreviewChange }) {
  const [previewTheme, setPreviewTheme] = useState(null);
  // Sync preview when modal opens or selected theme changes
  useEffect(() => {
    const applied = ColorThemes.find((t) => t.id === selectedTheme);
    setPreviewTheme(applied);
    onPreviewChange?.(applied);
  }, [selectedTheme]);
  return (
    <InlineGrid columns="1.75fr 2fr" gap="300">
      {/* LEFT: Theme list */}

      <Card>
        <Scrollable shadow style={{ height: 400 }} focusable>
          <BlockStack gap="200">
            {ColorThemes.map((theme, index) => {
              const isSelected = previewTheme?.id === theme.id;
              return (
                <BlockStack key={theme.id} gap="100">
                  <Box
                    key={theme.id}
                    padding="300"
                    borderWidth="1"
                    borderRadius="200"
                    background={isSelected ? "bg-fill-tertiary" : "bg-surface"}
                    onClick={() => {
                      setPreviewTheme(theme);
                      onPreviewChange(theme);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <InlineStack gap="300" blockAlign="center">
                      <img src={theme.src} width={60} height={60} />
                      <Text fontWeight="medium">{theme.name}</Text>
                    </InlineStack>
                  </Box>
                  {/* Divider between items (not after last one) */}
                  {index !== ColorThemes.length - 1 && <Divider />}
                </BlockStack>
              );
            })}
          </BlockStack>
        </Scrollable>
      </Card>

      {/* RIGHT: Preview */}
      <Card>
        {previewTheme ? (
          <BlockStack gap="300" inlineAlign="center">
            <Text variant="headingMd">{previewTheme.name}</Text>
            <img src={previewTheme.previewSrc} width={250} height={350} />
            <Text tone="subdued" alignment="center">
              Preview only. Click “Apply theme” to confirm.
            </Text>
          </BlockStack>
        ) : (
          <Text tone="subdued">Select a theme to preview</Text>
        )}
      </Card>
    </InlineGrid>
  );
}
