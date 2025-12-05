import { Box } from "@shopify/polaris";
import { useState } from "react";
import HelpHeader from "./HelpHeader";

export default function CodeEditor({
  title = "Code Editor",
  helpText = "",
  language = "text",
  placeholder = "",
}) {
  const [value, setValue] = useState("");

  const lines = value.split("\n");
  const lineCount = Math.min(Math.max(lines.length, 4), 300);

  // Default placeholder based on language
  const defaultPlaceholders = {
    css: `/* Add your custom CSS here */\n`,
    js: `// Add your custom JavaScript here\n// No <script> tags needed\n`,
    text: "",
  };

  return (
    <Box >

<Box marginTop="300">
      <HelpHeader title={title} helpText={helpText} />
</Box>
      <div style={{ display: "flex", marginTop: "8px", marginBottom: "8px", width: "100%" }}>
        
        {/* LINE NUMBERS */}
        <div
          style={{
            background: "#eef4ff",
            padding: "12px 10px",
            border: "1px solid #c4cdd5",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#637381",
            lineHeight: "22px",
            userSelect: "none",
            textAlign: "right",
            minWidth: "32px",
          }}
        >
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* TEXTAREA */}
        <div style={{ flex: 1 }}>
          <div
            className="Polaris-TextField Polaris-TextField--multiline Polaris-TextField--hasValue"
            style={{
              borderRadius: "0 8px 8px 0",
              borderLeft: "none",
            }}
          >
            <textarea
              className="Polaris-TextField__Input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder || defaultPlaceholders[language]}
              style={{
                fontFamily: "monospace",
                fontSize: "14px",
                height: lineCount * 22 + 24,
                padding: "12px 12px",
                resize: "none",
                lineHeight: "22px",
                borderRadius: "0 8px 8px 0",
              }}
            />
            <div
              className="Polaris-TextField__Backdrop"
              style={{ borderRadius: "0 8px 8px 0" }}
            ></div>
          </div>
        </div>

      </div>
    </Box>
  );
}
