import { useState, useEffect } from "react";
import { Box, InlineGrid, Text, Modal } from "@shopify/polaris";

const ColorThemes = [
  {
    id: "theme1",
    name: "Vibrant Neon",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FF0040" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#00E1FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#00F5FF" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#BD00FF" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#FF00B3" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#A0F7FF" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme2",
    name: "Ocean Breeze",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#0088FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#00FFD5" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#A0E7FF" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#00C8FF" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#0096D1" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#62EFFF" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme3",
    name: "Sunset Heat",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FF5A00" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FFCE00" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#FF9F00" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#FF6A00" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#FF3600" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#FFD34A" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme4",
    name: "Cotton Candy",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FF73C6" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#7EC8FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#FFC3EE" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#FF96DA" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#B4E1FF" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#9DD4FF" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme5",
    name: "Forest Calm",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#3B7D3A" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#74C276" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#C7F9CC" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#34A853" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#207A37" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#A3E4AF" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme6",
    name: "Royal Luxe",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#5A00FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#DDA0FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#C59DFF" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#8B3DFF" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#5A1CBF" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#E3C9FF" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme7",
    name: "Solar Burst",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FFA600" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#FFE100" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#FFD257" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#FFB200" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#FF7F00" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#FFE57F" />
        </g>
      </svg>
    ),
  },

  {
    id: "theme8",
    name: "Galaxy Pulse",
    svg: (
      <svg viewBox="0 0 140 140" style={{ width: "70px", height: "70px" }}>
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#0200FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="204.2" />
        <path d="M70 70 m -65 0 a 65 65 0 0 1 130 0 a 65 65 0 0 1 -130 0"
          fill="none" stroke="#7A00FF" strokeWidth="10"
          strokeDasharray="204.2" strokeDashoffset="0" />
        <g transform="translate(70,70)">
          <path d="M0 0 L0 -60 A60 60 0 0 1 60 0 Z" fill="#4B00FF" />
          <path d="M0 0 L60 0 A60 60 0 0 1 0 60 Z" fill="#2500A3" />
          <path d="M0 0 L0 60 A60 60 0 0 1 -60 0 Z" fill="#5500FF" />
          <path d="M0 0 L-60 0 A60 60 0 0 1 0 -60 Z" fill="#9F00FF" />
        </g>
      </svg>
    ),
  },
];


export default function ThemeGrid({ onSelect, selectedTheme }) {
  const [previewTheme, setPreviewTheme] = useState(null);
  const [open, setOpen] = useState(false);

  // Currently applied theme (parent state)
  const appliedTheme = ColorThemes.find((t) => t.id === selectedTheme);

  const handleSelect = (theme) => {
    setPreviewTheme(theme);
    setOpen(true);
  };

  return (
    <>
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="300">
        {ColorThemes.map((theme) => (
          <Box
            key={theme.id}
            onClick={() => handleSelect(theme)}
            padding="300"
            background={
              appliedTheme?.id === theme.id
                ? "bg-fill-success-secondary"
                : "bg-surface"
            }
            borderWidth="1"
            borderRadius="300"
            borderColor={
              appliedTheme?.id === theme.id ? "border-success" : "border"
            }
            style={{
              cursor: "pointer",
              transition: "0.2s",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Box>{theme.svg}</Box>
            <Text variant="headingMd">{theme.name}</Text>
          </Box>
        ))}
      </InlineGrid>

      {/* Modal Preview */}
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
          secondaryActions={[
            {
              content: "Close",
              onAction: () => {
                setOpen(false);
                setPreviewTheme(null);
              },
            },
          ]}
        >
          <Modal.Section>
            <Box style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              {previewTheme.svg}
            </Box>
            <Text variant="bodyMd" alignment="center" color="subdued">
              Preview of the selected theme.
            </Text>
          </Modal.Section>
        </Modal>
      )}
    </>
  );
}

