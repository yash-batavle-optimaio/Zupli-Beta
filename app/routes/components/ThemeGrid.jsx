import { useState, useEffect } from "react";
import { Box, InlineGrid, Text, Modal } from "@shopify/polaris";

const ColorThemes = [
  {
    id: "theme1",
    name: "Vibrant Neon",
    src: "/theme-icons/VibrantNeon.svg",
  },

  {
    id: "theme2",
    name: "Ocean Breeze",
    src: "/theme-icons/OceanBreeze.svg",
  },

  {
    id: "theme3",
    name: "Sunset Heat",
    src: "/theme-icons/SunsetHeat.svg",
  },

  {
    id: "theme4",
    name: "Cotton Candy",
    src: "/theme-icons/CottonCandy.svg",
  },

  {
    id: "theme5",
    name: "Forest Calm",
    src: "/theme-icons/ForestCalm.svg",
  },

  {
    id: "theme6",
    name: "Royal Luxe",
    src: "/theme-icons/RoyalLuxe.svg",
  },

  {
    id: "theme7",
    name: "Solar Burst",
    src: "/theme-icons/SolarBurst.svg",
  },

  {
    id: "theme8",
    name: "Galaxy Pulse",
    src: "/theme-icons/GalaxyPulse.svg",
  },
];

export default function ThemeGrid({ onSelect, selectedTheme }) {
  const [previewTheme, setPreviewTheme] = useState(null);
  const [open, setOpen] = useState(false);

  // The theme currently applied
  const appliedTheme = ColorThemes.find((t) => t.id === selectedTheme);

  const handleSelect = (theme) => {
    setPreviewTheme(theme);
    setOpen(true);
  };

  return (
    <>
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="300">
        {ColorThemes.map((theme) => {
          const isSelected = appliedTheme?.id === theme.id;

          return (
            <Box
              key={theme.id}
              onClick={() => handleSelect(theme)}
              padding="400" // ⬅ add more padding so SVG does not touch border
              background={isSelected ? "bg-fill-tertiary" : "bg-surface"}
              borderWidth="1"
              borderRadius="300"
              borderColor="border"
              style={{
                cursor: "pointer",
                transition: "0.2s",
                display: "flex",
                alignItems: "center",
                gap: "16px", // optional: more space between icon and text
                boxShadow: isSelected
                  ? "0 0 0 2px #18181a inset, 0 0 0 4px rgba(133, 134, 141, 0.15)"
                  : "none",
              }}
            >
              <Box padding="100">
                {/* shrink from 70px */}
                <img
                  src={theme.src}
                  alt={theme.name}
                  width={70}
                  height={70}
                  style={{ display: "block" }}
                />
              </Box>
              <Text variant="headingMd">{theme.name}</Text>
            </Box>
          );
        })}
      </InlineGrid>

      {previewTheme && (
        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
            setPreviewTheme(null);
          }}
          title={previewTheme.name}
          primaryAction={{
            content: "Apply Theme",
            onAction: () => {
              onSelect(previewTheme.id);
              setOpen(false);
              setPreviewTheme(null);
            },
          }}
        >
          <Modal.Section>
            <Box
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <img
                src={previewTheme.src}
                alt={previewTheme.name}
                width={140}
                height={140}
                style={{ display: "block" }}
              />
            </Box>
            <Text alignment="center" color="subdued">
              Preview of the selected theme.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </>
  );
}
