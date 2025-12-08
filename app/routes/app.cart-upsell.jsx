import {
  Page,
  Card,
  Box,
  BlockStack,
  InlineGrid,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

import Colabssiblecom from "./components/Colabssiblecom";
import { PaintBrushFlatIcon } from "@shopify/polaris-icons";

import ThemeGrid from "./components/ThemeGrid";
import BannerStyleSelector from "./components/BannerStyleSelector";
import CustomizeColorSelector from "./components/CustomizeColorSelector";
import CodeEditor from "./components/CodeEditor";
import ZIndexEditor from "./components/ZIndexEditor";

import { useState } from "react";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function ResourceDetailsLayout() {
  const shopify = useAppBridge();

  // Local states
  const [selectedTheme, setSelectedTheme] = useState("theme1");
  const [bannerStyle, setBannerStyle] = useState({});
  const [colors, setColors] = useState({});
  const [customCSS, setCustomCSS] = useState("");
  const [customJS, setCustomJS] = useState("");
  const [zIndex, setZIndex] = useState("auto");

  // SaveBar state
  const [saveBarOpen, setSaveBarOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Snapshot (first load)
  if (!isInitialized) {
    const snap = {
      theme: selectedTheme,
      bannerStyle,
      colors,
      customCSS,
      customJS,
      zIndex,
    };
    setInitialSnapshot(snap);
    setIsInitialized(true);
  }

  // Detect changes (like in my-campaign)
  const currentSnapshot = {
    theme: selectedTheme,
    bannerStyle,
    colors,
    customCSS,
    customJS,
    zIndex,
  };

  const changed =
    JSON.stringify(currentSnapshot) !== JSON.stringify(initialSnapshot);

  if (changed !== saveBarOpen) {
    setSaveBarOpen(changed);
  }

  // Save settings
  const handleSave = async () => {
    const payload = {
      selectedTheme,
      bannerStyle,
      colors,
      customCSS,
      customJS,
      zIndex,
    };

    const res = await fetch("/api/cart-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.ok) {
      setInitialSnapshot(currentSnapshot);
      setSaveBarOpen(false);
      shopify?.saveBar?.hide("cart-settings-save-bar");
    } else {
      alert("❌ Failed to save cart settings");
    }
  };

  // Discard does not need API
  const handleDiscard = () => {
    if (!window.confirm("Discard changes?")) return;
    window.location.reload();
  };

  return (
    <>
      <Page title="Cart Settings">

        <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
          
          {/* LEFT SECTION */}
          <BlockStack gap="400">

            {/* Select Theme */}
            <Colabssiblecom
              title="Select Theme"
              description="Customize the cart widget appearance."
              icon={PaintBrushFlatIcon}
            >
              <ThemeGrid
                onSelect={(id) => {
                  setSelectedTheme(id);
                }}
              />
            </Colabssiblecom>

            {/* Banner + Colors */}
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">

              <Colabssiblecom
                title="Cart banner"
                description="Choose between solid, gradient, or image banners."
                icon={PaintBrushFlatIcon}
              >
                <BannerStyleSelector
                  onChange={(v) => setBannerStyle(v)}
                />
              </Colabssiblecom>

              <Colabssiblecom
                title="Customize colors"
                description="Buttons, text, and progress bar colors."
                icon={PaintBrushFlatIcon}
              >
                <CustomizeColorSelector
                  onChange={(v) => setColors(v)}
                />
              </Colabssiblecom>

            </InlineGrid>

            {/* Z-index + Custom Code */}
            <Colabssiblecom
              title="Advanced"
              description="Custom CSS & JS overrides"
              icon={PaintBrushFlatIcon}
            >
              <ZIndexEditor onChange={setZIndex} />

              <CodeEditor
                title="CSS overrides"
                helpText="Modify styling of the widget."
                language="css"
                  value={customCSS}
                onChange={setCustomCSS}
              />

              <CodeEditor
                title="JavaScript overrides"
                helpText="Executed inside the cart widget. No <script> tags needed."
                language="js"
                  value={customJS}
                onChange={setCustomJS}
              />
            </Colabssiblecom>

          </BlockStack>

          {/* RIGHT SECTION */}
          <BlockStack>
            <Card>
              <Box padding="400">Preview or widget info here.</Box>
            </Card>
          </BlockStack>

        </InlineGrid>

      </Page>

      {/* SAVE BAR */}
      <SaveBar id="cart-settings-save-bar" open={saveBarOpen} discardConfirmation>
        <button variant="primary" onClick={handleSave} disabled={!saveBarOpen}>
          Save
        </button>
        <button onClick={handleDiscard}>Discard</button>
      </SaveBar>
    </>
  );
}
