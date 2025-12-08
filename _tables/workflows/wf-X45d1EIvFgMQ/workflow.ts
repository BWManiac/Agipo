import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { composio } from "@/lib/composio";

// Step definitions
const navigateToUrl = createStep({
  id: "EXJubH6Boaj7YCKnk8uHS",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const result = await composio.executeAction(
      "BROWSER_TOOL_NAVIGATE",
      inputData,
      { connectedAccountId: connectionId }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});
const fetchWebpageContent = createStep({
  id: "fbHWCoNbW10cfnctji5Vg",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browser_tool"];
    const result = await composio.executeAction(
      "BROWSER_TOOL_FETCH_WEBPAGE",
      inputData,
      { connectedAccountId: connectionId }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});
const sendEmail = createStep({
  id: "Qn0KfCqN5MN15ic4ZsxHT",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["gmail"];
    const result = await composio.executeAction(
      "GMAIL_SEND_EMAIL",
      inputData,
      { connectedAccountId: connectionId }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;
  }
});

// Workflow composition
export const sendSummarizedSiteToEmailWorkflow = createWorkflow({
  id: "wf-X45d1EIvFgMQ",
  inputSchema: z.object({}),
  outputSchema: z.any()
})
  .then(navigateToUrl)
  .then(sendEmail)
  .then(fetchWebpageContent)
  .commit();

// Metadata for runtime
export const workflowMetadata = {
  "requiredConnections": [
    "browser_tool",
    "gmail"
  ],
  "stepCount": 3
};