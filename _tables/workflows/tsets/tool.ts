/**
 * Generated tool file for workflow: tsets
 * Auto-generated from workflow: tsets
 * Do not edit manually - this file will be regenerated on workflow save.
 */

import { z } from "zod";
import { tool } from "ai";
import type { ToolDefinition } from "@/_tables/types";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

const Tsets_InputSchema = z.object({
  message: z.string().describe("Plain text captured from the requester.")
});

const Tsets_OutputSchema = z.object({
  cleanMessage: z.string().describe("Sanitized text ready for formatting.")
});

type Tsets_Input = z.infer<typeof Tsets_InputSchema>;
type Tsets_Output = z.infer<typeof Tsets_OutputSchema>;

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

async function tsetsNode(
  input: Tsets_Input
): Promise<Tsets_Output> {
  const validatedInput = Tsets_InputSchema.parse(input);
  
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
  const output: Tsets_Output = {
    cleanMessage: userResult?.cleanMessage ?? "",
  };
  
  return Tsets_OutputSchema.parse(output);
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

export const workflowTsetsTool = tool({
  description: "Workflow saved from the editor.",
  inputSchema: Tsets_InputSchema,
  execute: async (input: Tsets_Input): Promise<Record<string, unknown>> => {
    const result = await tsetsNode(input);
    return result as Record<string, unknown>;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY
// ============================================================================

export const workflowTsetsToolDefinition: ToolDefinition = {
  id: "workflow-tsets",
  name: "tsets",
  description: "Workflow saved from the editor.",
  runtime: "internal" as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: workflowTsetsTool as any,
};
