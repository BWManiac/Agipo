import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { composio } from "@/lib/composio";

// Step definitions
const bulkRunTasks = createStep({
  id: "kGJqeLnyllYOO0M82-92B",
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ inputData, runtimeContext }) => {
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["browseai"];
    const result = await composio.executeAction(
      "BROWSEAI_BULK_RUN_TASKS",
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
export const testWorkflow = createWorkflow({
  id: "wf-jG1tgkcezZDi",
  inputSchema: z.object({}),
  outputSchema: z.any()
})
  .then(bulkRunTasks)
  .commit();

// Metadata for runtime
export const workflowMetadata = {
  "requiredConnections": [
    "browseai"
  ],
  "stepCount": 1
};