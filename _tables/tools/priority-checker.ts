import { tool } from "ai";
import { z } from "zod";

import type { ToolDefinition } from "../types";

const inputSchema = z.object({
  item: z.string().describe("The item or task to prioritize."),
  impact: z.enum(["low", "medium", "high", "critical"]).describe("Expected impact level."),
  urgency: z.enum(["low", "medium", "high", "critical"]).describe("How urgent this item is."),
  effort: z.enum(["low", "medium", "high"]).optional().describe("Estimated effort required. Optional."),
});

export const priorityCheckerTool: ToolDefinition = {
  id: "priority_checker",
  name: "Priority Checker",
  description: "Evaluates the priority level of items based on impact, urgency, and effort.",
  runtime: "internal",
  run: tool({
    description: "Assess priority of an item using impact, urgency, and effort criteria. Returns priority level and reasoning.",
    inputSchema,
    execute: async ({ item, impact, urgency, effort }) => {
      const impactScore = { low: 1, medium: 2, high: 3, critical: 4 }[impact];
      const urgencyScore = { low: 1, medium: 2, high: 3, critical: 4 }[urgency];
      const effortScore = effort ? { low: 3, medium: 2, high: 1 }[effort] : 2;
      
      const priorityScore = (impactScore + urgencyScore) / effortScore;
      let priority: "low" | "medium" | "high" | "critical";
      
      if (priorityScore >= 3) priority = "critical";
      else if (priorityScore >= 2) priority = "high";
      else if (priorityScore >= 1.5) priority = "medium";
      else priority = "low";
      
      return {
        message: `Assessed priority for: ${item}`,
        item,
        priority,
        reasoning: `${impact} impact + ${urgency} urgency = ${priority} priority`,
        score: priorityScore.toFixed(2),
      };
    },
  }),
};

