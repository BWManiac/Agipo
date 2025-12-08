import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// Step definitions

// Workflow composition
export const wokeWorkflow = createWorkflow({
  id: "wf-auUlyla9_YGv",
  inputSchema: z.object({}),
  outputSchema: z.any()
})
  .commit();

// Metadata for runtime
export const workflowMetadata = {
  "requiredConnections": [],
  "stepCount": 0
};