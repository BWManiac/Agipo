/**
 * Generated tool file for workflow: isthisworking
 * Auto-generated from workflow: isthisworking
 * Do not edit manually - this file will be regenerated on workflow save.
 */

import { z } from "zod";
import { tool } from "ai";
import type { ToolDefinition } from "@/_tables/types";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

const Isthisworking_InputSchema = z.object({
  message: z.string().describe("Plain text captured from the requester.")
});

const Isthisworking_OutputSchema = z.object({
  cleanMessage: z.string().describe("Sanitized text ready for formatting.")
});

type Isthisworking_Input = z.infer<typeof Isthisworking_InputSchema>;
type Isthisworking_Output = z.infer<typeof Isthisworking_OutputSchema>;

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

async function isthisworkingNode(
  input: Isthisworking_Input
): Promise<Isthisworking_Output> {
  const validatedInput = Isthisworking_InputSchema.parse(input);
  
  // Extract typed inputs
  const { message } = validatedInput;
  
  // ========================================================================
  // USER'S CODE (from node.data.code) - injected here
  // ========================================================================
  // User code should return an object matching the output schema
  
  // This node simply outputs a string to be used by the next node.
  process.stdout.write("Data flows like a river!");
  
  // ========================================================================
  // END USER CODE
  // ========================================================================
  
  // Validate output against schema
  // Note: User code should return the expected output shape
  // User code execution result (may be undefined if code doesn't return)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userResult: any = typeof result !== 'undefined' ? result : {};
  const output: Isthisworking_Output = {
    cleanMessage: userResult?.cleanMessage ?? "",
  };
  
  return Isthisworking_OutputSchema.parse(output);
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

export const workflowIsthisworkingTool = tool({
  description: "Workflow saved from the editor.",
  inputSchema: Isthisworking_InputSchema,
  execute: async (input: Isthisworking_Input): Promise<Record<string, unknown>> => {
    const result = await isthisworkingNode(input);
    return result as Record<string, unknown>;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY
// ============================================================================

export const workflowIsthisworkingToolDefinition: ToolDefinition = {
  id: "workflow-isthisworking",
  name: "isthisworking",
  description: "Workflow saved from the editor.",
  runtime: "internal" as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: workflowIsthisworkingTool as any,
};
