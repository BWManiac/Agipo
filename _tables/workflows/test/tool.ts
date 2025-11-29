/**
 * Generated tool file for workflow: test
 * Auto-generated from workflow: test
 * Do not edit manually - this file will be regenerated on workflow save.
 */

import { z } from "zod";
import { tool } from "ai";
import type { ToolDefinition } from "@/_tables/types";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

const Test_InputSchema = z.object({
  message: z.string().describe("Plain text captured from the requester.")
});

const Test_OutputSchema = z.object({
  cleanMessage: z.string().describe("Sanitized text ready for formatting.")
});

type Test_Input = z.infer<typeof Test_InputSchema>;
type Test_Output = z.infer<typeof Test_OutputSchema>;

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

async function testNode(
  input: Test_Input
): Promise<Test_Output> {
  const validatedInput = Test_InputSchema.parse(input);
  
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
  const output: Test_Output = {
    cleanMessage: userResult?.cleanMessage ?? "",
  };
  
  return Test_OutputSchema.parse(output);
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

export const workflowTestTool = tool({
  description: "Workflow saved from the editor.",
  inputSchema: Test_InputSchema,
  execute: async (input: Test_Input): Promise<Record<string, unknown>> => {
    const result = await testNode(input);
    return result as Record<string, unknown>;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY
// ============================================================================

export const workflowTestToolDefinition: ToolDefinition = {
  id: "workflow-test",
  name: "test",
  description: "Workflow saved from the editor.",
  runtime: "internal" as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: workflowTestTool as any,
};
