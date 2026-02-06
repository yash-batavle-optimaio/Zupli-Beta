import {
  Box,
  TextField,
  BlockStack,
  InlineStack,
  Button,
  Popover,
  Text,
} from "@shopify/polaris";
import { useState } from "react";
import HelpHeader from "./HelpHeader";

export default function TimerMessageField({
  title = "Message",
  helpText = "",
  value,
  onChange,
  enableVariables = false, // 👈 NEW
}) {
  const [variablePopoverOpen, setVariablePopoverOpen] = useState(false);

  const insertVariable = (variable) => {
    onChange(`${value}${variable}`);
    setVariablePopoverOpen(false);
  };

  return (
    <Box paddingBlockStart="100">
      <BlockStack gap="100">
        {/* HEADER + OPTIONAL {} BUTTON */}
        <InlineStack align="space-between" blockAlign="center">
          <HelpHeader title={title} helpText={helpText} />

          {enableVariables && (
            <Popover
              active={variablePopoverOpen}
              activator={
                <Button
                  size="micro"
                  variant="secondary"
                  onClick={() => setVariablePopoverOpen((open) => !open)}
                >
                  {"{}"}
                </Button>
              }
              onClose={() => setVariablePopoverOpen(false)}
            >
              <Popover.Section>
                <BlockStack gap="150" inlineAlignment="start">
                  <Box
                    as="button"
                    onClick={() => insertVariable("{{timeRemaining}}")}
                    width="100%"
                  >
                    <BlockStack gap="50" inlineAlignment="start">
                      <Text fontWeight="semibold" alignment="start">
                        {"{{timeRemaining}}"}
                      </Text>
                      <Text tone="subdued" alignment="start">
                        Remaining timer value
                      </Text>
                    </BlockStack>
                  </Box>

                  {/* <Box
                    as="button"
                    onClick={() => insertVariable("{{cart_total}}")}
                    width="100%"
                  >
                    <BlockStack gap="50">
                      <Text fontWeight="semibold">{"{{cart_total}}"}</Text>
                      <Text tone="subdued">Customer cart total</Text>
                    </BlockStack>
                  </Box> */}
                </BlockStack>
              </Popover.Section>
            </Popover>
          )}
        </InlineStack>

        <TextField
          value={value}
          onChange={onChange}
          autoComplete="off"
          multiline={2}
        />
      </BlockStack>
    </Box>
  );
}
