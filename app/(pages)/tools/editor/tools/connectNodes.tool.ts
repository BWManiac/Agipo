/**
 * connectNodesTool
 *
 * Creates directed edges between nodes. By keeping the schema small the
 * assistant can chain calls (e.g. add node → connect nodes) without worrying
 * about extra metadata.
 */
import { tool } from "ai";
import { z } from "zod";

import type { ConnectNodesIntent, ToolResult } from "./toolIntents";

export const connectNodesTool = tool({
  description:
    "Create a directed edge between two workflow nodes to define execution order.",
  inputSchema: z.object({
    sourceId: z
      .string()
      .min(1)
      .describe("The upstream node ID (edge source)."),
    targetId: z
      .string()
      .min(1)
      .describe("The downstream node ID (edge target)."),
    rationale: z
      .string()
      .optional()
      .describe("Optional explanation of why these nodes should be connected."),
    summary: z
      .string()
      .optional()
      .describe("Optional UI summary describing the connection."),
  }),
  async execute(input): Promise<ToolResult> {
    const intent: ConnectNodesIntent = {
      type: "connectNodes",
      sourceId: input.sourceId,
      targetId: input.targetId,
      rationale: input.rationale,
    };

    return {
      intent,
      summary:
        input.summary ??
        `Connected ${input.sourceId} -> ${input.targetId} to update data flow.`,
    };
  },
});


