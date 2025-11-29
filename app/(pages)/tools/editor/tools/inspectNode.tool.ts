import { tool } from "ai";
import { z } from "zod";

/**
 * Read-only tool that lets the agent request the full details of a workflow node.
 * Execution happens on the client (via `onToolCall`) because the browser owns the
 * latest Zustand store. The tool definition is still needed so the agent knows
 * the expected input/output structure.
 */
export const inspectNodeTool = tool({
  description:
    "Inspect a node (code, flow summary, spec, position, connected edges) without modifying the workflow.",
  inputSchema: z.object({
    nodeId: z
      .string()
      .min(1)
      .describe("ID of the node to inspect (use node.data.id)."),
    includeConnections: z
      .boolean()
      .optional()
      .describe("If true, include incoming and outgoing edge IDs."),
  }),
  // No execute handler – result is provided on the client via `addToolResult`.
});


