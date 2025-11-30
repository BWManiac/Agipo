/**
 * Generated tool file for workflow: hohoho
 * Auto-generated from workflow: hohoho
 * Do not edit manually - this file will be regenerated on workflow save.
 */

import { z } from "zod";
import { tool } from "ai";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

const Hohoho_InputSchema = z.object({
  message: z.string().describe("Plain text captured from the requester.")
});

const Hohoho_OutputSchema = z.object({
  cleanMessage: z.string().describe("Sanitized text ready for formatting.")
});

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

async function hohohoNode(input) {
  const validatedInput = Hohoho_InputSchema.parse(input);
  
  // Extract inputs
  const { message } = validatedInput;
  
  // ========================================================================
  // USER'S CODE (from node.data.code) - injected here
  // ========================================================================
  
  // This node simply outputs a string to be used by the next node.
  process.stdout.write("Data flows like a river!");
  
  // ========================================================================
  // END USER CODE
  // ========================================================================
  
  // Validate output against schema
  const userResult = typeof result !== 'undefined' ? result : {};
  const output = {
    cleanMessage: userResult?.cleanMessage ?? "",
  };
  
  return Hohoho_OutputSchema.parse(output);
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

export const workflowHohohoTool = tool({
  description: "Workflow saved from the editor.",
  inputSchema: Hohoho_InputSchema,
  execute: async (input) => {
    const result = await hohohoNode(input);
    return result;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY
// ============================================================================

export const workflowHohohoToolDefinition = {
  id: "workflow-hohoho",
  name: "hohoho",
  description: "Workflow saved from the editor.",
  runtime: "internal",
  run: workflowHohohoTool,
};
