import {
  Page,
  Card,
  Box,
  BlockStack,
  InlineGrid,
  SkeletonBodyText,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import Colabssiblecom from "./components/Colabssiblecom";
import { PaintBrushFlatIcon } from "@shopify/polaris-icons";
import ThemeGrid from "./components/ThemeGrid";
import { useState } from "react";
import BannerStyleSelector from "./components/BannerStyleSelector";
import CustomizeColorSelector from "./components/CustomizeColorSelector";
import CodeEditor from "./components/CodeEditor";
import ZIndexEditor from "./components/ZIndexEditor";

// ----------------------
// Loader
// ----------------------
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// ----------------------
// Custom SkeletonLabelBox
// ----------------------
const SkeletonLabelBox = (props) => (
  <Box
    background="bg-fill-tertiary"
    minHeight="1rem"
    maxWidth="5rem"
    borderRadius="base"
    {...props}
  />
);

// ----------------------
// ResourceDetailsLayout
// ----------------------
export default function ResourceDetailsLayout() {

    const [selectedTheme, setSelectedTheme] = useState("theme1");

  const [code, setCode] = useState(
`!! HOW IT WORKS !!
This JavaScript code will be executed while Cart Widget is rendering – 
no need for <script> tags.`
  );


  return (
    <form
  method="post"
  data-save-bar
  onSubmit={(e) => {
    e.preventDefault();
    console.log("Saving...", new FormData(e.target));
  }}
>

  
      {/* REQUIRED by Save Bar */}
      <input type="hidden" name="selectedTheme" value={selectedTheme} />
    <Page title="Product">
      <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
        {/* LEFT SECTION */}
        <BlockStack gap="400">
          {/* Card 1 */}
          <BlockStack gap="400">
            <Colabssiblecom
              title="Select Theme"
              description="Customize the colors of your cart to match your brand."
              icon={PaintBrushFlatIcon}
            >
              <ThemeGrid onSelect={(id) => setSelectedTheme(id)} />

            </Colabssiblecom>
          </BlockStack>

          {/* Card 2 */}
          <BlockStack gap="400">
            {/* Grid of 2 cards */}
            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              {/* Grid Card 1 */}
              <Colabssiblecom
                title="Cart banner"
                description="Choose between solid/gradient colors or custom images for the banner"
                icon={PaintBrushFlatIcon}
              >
                <BannerStyleSelector />
              </Colabssiblecom>

              {/* Grid Card 2 */}
              <Colabssiblecom
                title="Customize colors"
                description="Customize the button, text, and progress bar colors used in your cart banner"
                icon={PaintBrushFlatIcon}
              >
                <CustomizeColorSelector />
              </Colabssiblecom>
            </InlineGrid>
          </BlockStack>

          {/* Card 3 */}
          <BlockStack gap="400">
          <Colabssiblecom
            title="Cart 3"
            description="Choose between solid/gradient colors or custom images for the banner"
            icon={PaintBrushFlatIcon}
          >
         
            <ZIndexEditor
  onChange={(val) => console.log("New Z-index:", val)}
/>


       <CodeEditor
  title="CSS overrides"
  helpText="Add custom CSS to modify the appearance of the cart widget."
  language="css"
/>
<CodeEditor
  title="JavaScript overrides"
  helpText="Add custom JavaScript executed inside the cart widget. No <script> tags needed."
  language="js"
/>


          </Colabssiblecom>
          </BlockStack>

           {/* Card 4 */}
          <BlockStack gap="400">
          <Colabssiblecom
            title="Cart 4"
            description="Choose between solid/gradient colors or custom images for the banner"
            icon={PaintBrushFlatIcon}
          >
     

          </Colabssiblecom>
          </BlockStack>
        </BlockStack>

        {/* RIGHT SECTION */}
        <BlockStack gap={{ xs: "400", md: "200" }}>
          {/* Card 3 */}
          <Card roundedAbove="sm">
            <BlockStack gap="400"></BlockStack>
          </Card>

          {/* Card 4 */}
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <SkeletonLabelBox />
              <Box border="divider" borderRadius="base" minHeight="2rem" />
              <SkeletonLabelBox maxWidth="4rem" />
              <Box border="divider" borderRadius="base" minHeight="2rem" />
              <SkeletonLabelBox />
              <SkeletonBodyText />
            </BlockStack>
          </Card>
        </BlockStack>
      </InlineGrid>
        <button type="submit" style={{ display: "none" }}>Submit</button>
    </Page>
    </form>
  );
}
