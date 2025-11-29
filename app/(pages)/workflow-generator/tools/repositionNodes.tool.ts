/**
 * repositionNodesTool
 *
 * Gives the agent layout control. It supports two strategies:
 * 1. Explicit coordinates per node.
 * 2. Lightweight auto-layout hints (horizontal/vertical/grid) that the client
 *    interprets into deterministic positions.
 */
import { tool } from "ai";
import { z } from "zod";

import type { RepositionNodesIntent, ToolResult } from "./toolIntents";

const positionSchema = z.object({
  nodeId: z.string().min(1).describe("ID of the node to move."),
  x: z.number().describe("Target X coordinate."),
  y: z.number().describe("Target Y coordinate."),
});

export const repositionNodesTool = tool({
  description:
    "Adjust workflow layout by either providing explicit node coordinates or by requesting an automatic layout (horizontal, vertical, or grid).",
  inputSchema: z.object({
    positions: z
      .array(positionSchema)
      .optional()
      .describe(
        "Explicit node coordinates to apply. If provided, layout will be ignored for those nodes."
      ),
    layout: z
      .enum(["horizontal", "vertical", "grid"])
      .optional()
      .describe(
        "Optional automatic layout strategy. If positions are omitted, all nodes will be placed according to this strategy."
      ),
    rationale: z
      .string()
      .optional()
      .describe("Brief explanation of why the layout needs to be adjusted."),
    summary: z
      .string()
      .optional()
      .describe("Optional UI-friendly summary of the repositioning."),
  }),
  async execute(input): Promise<ToolResult> {
    const intent: RepositionNodesIntent = {
      type: "repositionNodes",
      positions: input.positions
        ? input.positions.map(({ nodeId, x, y }) => ({
            nodeId,
            position: { x, y },
          }))
        : undefined,
      layout: input.layout,
      rationale: input.rationale,
      summary: input.summary,
    };

    return {
      intent,
      summary:
        input.summary ??
        (input.positions
          ? "Applied explicit node positions."
          : `Applied ${input.layout ?? "manual"} layout instructions.`),
    };
  },
});


