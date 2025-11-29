import { tool } from "ai";
import { z } from "zod";

import type { ToolDefinition } from "../types";

const inputSchema = z.object({
  text: z.string().describe("The text or context to summarize."),
  maxLength: z.number().optional().describe("Maximum length of summary in words. Defaults to 50."),
});

export const quickSummaryTool: ToolDefinition = {
  id: "quick_summary",
  name: "Quick Summary",
  description: "Generates a concise summary of provided text or context.",
  runtime: "internal",
  run: tool({
    description: "Summarize text or context into a brief, actionable summary.",
    inputSchema,
    execute: async ({ text, maxLength = 50 }) => {
      const words = text.split(/\s+/);
      const summary = words.slice(0, maxLength).join(" ");
      return {
        message: `Generated ${words.length > maxLength ? "truncated" : "full"} summary.`,
        summary: summary + (words.length > maxLength ? "..." : ""),
        originalLength: words.length,
        summaryLength: Math.min(words.length, maxLength),
      };
    },
  }),
};

