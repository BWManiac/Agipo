/**
 * Generated tool file for workflow: WAZZUP
 * Auto-generated from workflow: wazzup
 * Do not edit manually - this file will be regenerated on workflow save.
 */

import { z } from "zod";
import { tool } from "ai";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

const Wazzup_InputSchema = z.object({
  message: z.string().describe("Plain text captured from the requester.")
});

const Wazzup_OutputSchema = z.object({
  cleanMessage: z.string().describe("Sanitized text ready for formatting.")
});

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

async function wazzupNode(input) {
  const validatedInput = Wazzup_InputSchema.parse(input);
  
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
  
  return Wazzup_OutputSchema.parse(output);
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

export const workflowWazzupTool = tool({
  description: "Workflow saved from the editor.",
  inputSchema: Wazzup_InputSchema,
  execute: async (input) => {
    const result = await wazzupNode(input);
    return result;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY
// ============================================================================

export const workflowWazzupToolDefinition = {
  id: "workflow-wazzup",
  name: "WAZZUP",
  description: "Workflow saved from the editor.",
  runtime: "internal",
  run: workflowWazzupTool,
};
