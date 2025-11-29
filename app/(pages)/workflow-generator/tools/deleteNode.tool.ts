/**
 * deleteNodeTool
 *
 * Simplest form of mutation: remove a node (and, via the dispatcher, any edges
 * attached to it). Keeping the rationale/summary optional lets the agent leave
 * breadcrumbs for the UI or audit logs later.
 */
import { tool } from "ai";
import { z } from "zod";

import type { DeleteNodeIntent, ToolResult } from "./toolIntents";

export const deleteNodeTool = tool({
  description:
    "Remove a workflow node (and its connected edges) when it is no longer needed.",
  inputSchema: z.object({
    nodeId: z
      .string()
      .min(1)
      .describe("ID of the node to delete (use node.data.id)."),
    rationale: z
      .string()
      .optional()
      .describe("Brief explanation of why the node should be removed."),
    summary: z
      .string()
      .optional()
      .describe("Optional summary describing the deletion for the UI."),
  }),
  async execute(input): Promise<ToolResult> {
    const intent: DeleteNodeIntent = {
      type: "deleteNode",
      nodeId: input.nodeId,
      rationale: input.rationale,
    };

    return {
      intent,
      summary:
        input.summary ?? `Deleted node ${input.nodeId} and its associated edges.`,
    };
  },
});


