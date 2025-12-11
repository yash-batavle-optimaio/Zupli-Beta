import {
  Page,
  Card,
  Box,
  BlockStack,
  InlineGrid,
  Select,
  TextField,
} from "@shopify/polaris";
import TimerMessageField from "./components/TimerMessageField";
import Colabssiblecom from "./components/Colabssiblecom";
import { CircleLeftIcon, CircleRightIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import ScarcityTimer from "./components/ScarcityTimer";
import AfterTimerActions from "./components/AfterTimerActions";
import TimerDateAndTime from "./components/TimerDateAndTime";

export default function ResourceDetailsLayout() {
  const [timerText, setTimerText] = useState("Hurry! Offer ends soon!");
  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Paused", value: "paused" },
    { label: "Draft", value: "draft" },
  ];

  const [status, setStatus] = useState("draft");

  const [afterAction, setAfterAction] = useState("refresh");
  return (
    <Page title="Cart Settings">
      <Box paddingBlockEnd="600">
        <InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="400">
          {/* LEFT SECTION */}
          <BlockStack gap="400">
            <ScarcityTimer
              onChange={(data) => {
                console.log("Timer Updated", data);
              }}
              title="Timer Type"
              helpText="Configure the scarcity timer settings below."
            />

            {/* Before timer expires */}
            <Colabssiblecom
              title="Before timer expires"
              description="Choose how the timer behaves."
              icon={CircleLeftIcon}
            >
              <TimerMessageField
                title="Timer Message"
                helpText="This message will appear while the timer is running."
                value={timerText}
                onChange={setTimerText}
              />
            </Colabssiblecom>

            <Colabssiblecom
              title="After timer expires"
              description="Choose how the timer behaves."
              icon={CircleRightIcon}
            >
              <TimerMessageField
                title="Expired Message"
                helpText="This message appears after the countdown reaches 0."
                value={timerText}
                onChange={setTimerText}
              />
              <AfterTimerActions
                value={afterAction}
                onChange={setAfterAction}
                title="Action options"
                helpText="Select what happens when the timer expires."
              />
            </Colabssiblecom>

            <Colabssiblecom
              title="Activation time"
              description="Choose the date & time when the timer becomes active."
              icon={CircleRightIcon}
            >
              <TimerDateAndTime
                value={{
                  start: { date: null, time: "09:00 AM" },
                  end: { date: null, time: "11:00 PM" },
                  hasEndDate: false,
                }}
                onChange={(updated) => {
                  console.log("Activation Time Updated →", updated);
                }}
              />
            </Colabssiblecom>
          </BlockStack>

          {/* RIGHT SIDE */}
          <BlockStack>
            <Card>
              <Select
                label="Status"
                options={statusOptions}
                onChange={setStatus}
                value={status}
              />
            </Card>
          </BlockStack>
        </InlineGrid>
      </Box>
    </Page>
  );
}
