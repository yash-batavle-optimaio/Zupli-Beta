import { Box, TextField } from "@shopify/polaris";
import { useState, useCallback } from "react";
import HelpHeader from "./HelpHeader";

export default function ZIndexEditor({
  title = "Z-index",
  helpText = "Set the z-index for the cart widget to control stacking order.",
  onChange,
  defaultValue = "5000",
}) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = useCallback(
    (newValue) => {
      // Allow only numbers
      const cleaned = newValue.replace(/[^0-9]/g, "") || "0";

      setValue(cleaned);

      if (onChange) onChange(cleaned);
    },
    []
  );

  return (
    <Box paddingBottom="200">
      {/* HEADER */}
      <HelpHeader title={title} helpText={helpText} />

      {/* Z INDEX INPUT */}
      <TextField
        type="number"
        value={value}
        onChange={handleChange}
        min={0}
        autoComplete="off"
      />
    </Box>
  );
}
