import { Box, TextField } from "@shopify/polaris";
import { useState, useCallback } from "react";
import HelpHeader from "./HelpHeader";

export default function ZIndexEditor({
  title = "Z-index",
  helpText = "Set stacking order",
  onChange,
  defaultValue = "5000",
}) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue) => {
    const cleaned = newValue.replace(/[^0-9]/g, "") || "0";
    setValue(cleaned);
    onChange?.(cleaned);
  };

  return (
    <Box paddingBottom="200">
      <HelpHeader title={title} helpText={helpText} />

      <TextField type="number" value={value} onChange={handleChange} />

      {/* Hidden metafield input */}
      <input type="hidden" name="zIndex" value={value} />
    </Box>
  );
}

