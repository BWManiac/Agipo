import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { composio } from "@/lib/composio";

// Step definitions
const navigateToUrl = createStep({
  id: "11IU9f9Xc4knMtwwJrnHi",
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

// Workflow composition
export const summarizeSiteEmailWorkflow = createWorkflow({
  id: "wf-MSKSYrCZ-Tfc",
  inputSchema: z.object({
  URL: z.string()
}),
  outputSchema: z.any()
})
  .map(async ({ inputData, getStepResult }) => {
    return {
      url: inputData.URL
    };
  })
  .then(navigateToUrl)
  .commit();

// Metadata for runtime
export const workflowMetadata = {
  "requiredConnections": [
    "browser_tool"
  ],
  "stepCount": 1
};