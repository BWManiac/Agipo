/**
 * Workflow Tools Service
 * 
 * Handles wrapping assigned workflows as executable tools for agent chat.
 * Follows the same pattern as connection tools - wraps workflow execution
 * in Vercel AI SDK's tool() function so agents can invoke workflows.
 */

import { tool, type Tool } from "ai";
import type { ToolDefinition, WorkflowBinding } from "@/_tables/types";
import type { ZodObject, ZodRawShape } from "zod";
import { getWorkflowExecutable, getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";

// ============================================================================
// Tool Conversion
// ============================================================================

/**
 * Gets an executable tool for a workflow binding.
 * Wraps the workflow execution in a Vercel AI SDK tool so agents can invoke it.
 * 
 * @param userId - The authenticated user's ID (for workflow run resourceId)
 * @param binding - The workflow binding with workflowId and connectionBindings
 * @returns ToolDefinition with wrapped workflow tool, or undefined if workflow not found
 */
export async function getWorkflowToolExecutable(
  userId: string,
  binding: WorkflowBinding
): Promise<ToolDefinition | undefined> {
  try {
    console.log(`[WorkflowTools] Loading workflow: ${binding.workflowId}`);

    // 1. Load the workflow executable (transpiled TypeScript file)
    console.log(`[WorkflowTools] Step 1: Calling getWorkflowExecutable...`);
    let workflow: unknown;
    try {
      const result = await getWorkflowExecutable(binding.workflowId);
      console.log(`[WorkflowTools] Step 1a: getWorkflowExecutable resolved`);
      // Unwrap the wrapper object (used to prevent Promise thenable unwrapping)
      workflow = result && typeof result === 'object' && '__workflow' in result
        ? (result as { __workflow: unknown }).__workflow
        : result;
    } catch (e) {
      console.error(`[WorkflowTools] Step 1a: getWorkflowExecutable threw:`, e);
      throw e;
    }
    console.log(`[WorkflowTools] Step 1 done: workflow=${workflow ? 'loaded' : 'null'}`);
    if (!workflow) {
      console.warn(`[WorkflowTools] Workflow not found: ${binding.workflowId}`);
      return undefined;
    }

    // 2. Load workflow metadata (name, description, etc.)
    console.log(`[WorkflowTools] Step 2: Calling getWorkflowMetadata...`);
    const metadata = await getWorkflowMetadata(binding.workflowId);
    console.log(`[WorkflowTools] Step 2 done: metadata=${metadata ? 'loaded' : 'null'}`);
    if (!metadata) {
      console.warn(`[WorkflowTools] Metadata not found: ${binding.workflowId}`);
      return undefined;
    }

    // 3. Verify workflow has required properties
    console.log(`[WorkflowTools] Step 3: Checking workflow properties...`);
    console.log(`[WorkflowTools] Workflow type: ${typeof workflow}`);
    console.log(`[WorkflowTools] Workflow keys: ${Object.keys(workflow as object).join(', ')}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workflowObj = workflow as any;

    if (!workflowObj.inputSchema) {
      console.warn(`[WorkflowTools] Workflow ${binding.workflowId} missing inputSchema`);
      return undefined;
    }

    if (!workflowObj.createRunAsync) {
      console.warn(`[WorkflowTools] Workflow ${binding.workflowId} missing createRunAsync`);
      return undefined;
    }

    // 4. Create the Vercel AI SDK tool that wraps workflow execution
    const toolDescription = metadata.description || `Workflow: ${metadata.name}`;
    
    console.log(`[WorkflowTools] Creating tool with inputSchema`);

    const vercelTool = tool({
      description: toolDescription,
      // Use workflow's inputSchema directly (already Zod, no conversion needed)
      inputSchema: workflowObj.inputSchema,
      execute: async (input: Record<string, unknown>) => {
        console.log(`[WorkflowTools] Executing workflow: ${binding.workflowId}`);
        console.log(`[WorkflowTools] Raw input:`, JSON.stringify(input, null, 2));

        try {
          // CRITICAL: Mastra Agent injects extra context into tool arguments.
          // We need to extract only the workflow's expected input fields.
          // Mastra injects: threadId, resourceId, memory, runId, runtimeContext, writer, tracingContext, context
          const mastraInjectedKeys = new Set([
            'threadId', 'resourceId', 'memory', 'runId', 'runtimeContext',
            'writer', 'tracingContext', 'context', 'mastra'
          ]);

          // Extract actual workflow input (may be nested in 'context' or at top level)
          let workflowInput: Record<string, unknown>;
          if (input.context && typeof input.context === 'object') {
            // Input is nested in context object
            workflowInput = input.context as Record<string, unknown>;
          } else {
            // Filter out Mastra-injected keys
            workflowInput = Object.fromEntries(
              Object.entries(input).filter(([key]) => !mastraInjectedKeys.has(key))
            );
          }

          console.log(`[WorkflowTools] Filtered input:`, JSON.stringify(workflowInput, null, 2));

          // CRITICAL: RuntimeContext must be a Map, not a plain object.
          // Mastra's execution engine calls runtimeContext.forEach() internally.
          // This is NOT documented but required for workflow execution.
          const runtimeContext = new Map<string, unknown>();
          runtimeContext.set("connections", binding.connectionBindings);
          // Composio SDK requires userId for tools.execute() calls
          runtimeContext.set("userId", userId);

          // Create workflow run instance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const workflowExec = workflow as any;
          const run = await workflowExec.createRunAsync({
            resourceId: userId,
          });

          // Execute workflow with filtered inputs and Map-based runtimeContext
          const result = await run.start({
            inputData: workflowInput,  // Filtered workflow arguments
            runtimeContext,            // Map with connections
          });
          
          // Handle execution result
          if (result.status === "success") {
            // Return workflow output to agent
            console.log(`[WorkflowTools] Workflow ${binding.workflowId} completed successfully`);
            return result.result;
          } else if (result.status === "failed") {
            // Extract error details from failed steps
            const failedSteps = Object.entries(result.steps || {})
              .filter(([_, step]) => (step as { status: string }).status === "failed")
              .map(([id, step]) => ({ stepId: id, error: (step as { error?: unknown }).error }));
            
            const errorMessage = failedSteps.length > 0
              ? `Workflow execution failed at step(s): ${JSON.stringify(failedSteps)}`
              : "Workflow execution failed";
            
            console.error(`[WorkflowTools] Workflow ${binding.workflowId} failed:`, errorMessage);
            throw new Error(errorMessage);
          }
          
          // For suspended or other statuses, return result with status info
          console.log(`[WorkflowTools] Workflow ${binding.workflowId} status: ${result.status}`);
          return { status: result.status, result: result.result };
        } catch (error) {
          console.error(`[WorkflowTools] Execution failed for ${binding.workflowId}:`, error);
          throw error;
        }
      },
    });

    console.log(`[WorkflowTools] Successfully loaded: ${binding.workflowId}`);
    
    // 5. Return ToolDefinition (same structure as connection tools)
    return {
      id: `workflow-${binding.workflowId}`,
      name: metadata.name,
      description: toolDescription,
      runtime: "workflow",
      run: vercelTool as Tool<unknown, unknown>,  // Extract .run for toolMap
    };
  } catch (error) {
    console.error(`[WorkflowTools] Failed to load ${binding.workflowId}:`, error);
    return undefined;
  }
}

