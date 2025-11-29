import { tool } from "ai";
import { z } from "zod";

import type { ToolDefinition } from "../types";

const inputSchema = z.object({
  completed: z.array(z.string()).optional().describe("List of completed items."),
  inProgress: z.array(z.string()).optional().describe("List of items currently in progress."),
  blockers: z.array(z.string()).optional().describe("List of blockers or risks."),
  context: z.string().optional().describe("Additional context or notes."),
});

export const statusReporterTool: ToolDefinition = {
  id: "status_reporter",
  name: "Status Reporter",
  description: "Generates formatted status updates from key information.",
  runtime: "internal",
  run: tool({
    description: "Create a well-formatted status update with what's done, in progress, and blockers.",
    inputSchema,
    execute: async ({ completed = [], inProgress = [], blockers = [], context }) => {
      const sections = [];
      
      if (completed.length > 0) {
        sections.push(`✅ Completed:\n${completed.map(item => `  • ${item}`).join("\n")}`);
      }
      
      if (inProgress.length > 0) {
        sections.push(`🔄 In Progress:\n${inProgress.map(item => `  • ${item}`).join("\n")}`);
      }
      
      if (blockers.length > 0) {
        sections.push(`⚠️ Blockers:\n${blockers.map(item => `  • ${item}`).join("\n")}`);
      }
      
      if (context) {
        sections.push(`📝 Notes:\n  ${context}`);
      }
      
      return {
        message: "Generated status update.",
        statusUpdate: sections.join("\n\n"),
        summary: `${completed.length} completed, ${inProgress.length} in progress, ${blockers.length} blockers`,
      };
    },
  }),
};

