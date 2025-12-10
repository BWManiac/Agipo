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
    const workflow = await getWorkflowExecutable(binding.workflowId);
    if (!workflow) {
      console.warn(`[WorkflowTools] Workflow not found: ${binding.workflowId}`);
      return undefined;
    }

    // 2. Load workflow metadata (name, description, etc.)
    const metadata = await getWorkflowMetadata(binding.workflowId);
    if (!metadata) {
      console.warn(`[WorkflowTools] Metadata not found: ${binding.workflowId}`);
      return undefined;
    }

    // 3. Verify workflow has inputSchema (required for tool)
    if (!workflow || typeof workflow !== 'object' || !('inputSchema' in workflow)) {
      console.warn(`[WorkflowTools] Workflow ${binding.workflowId} missing inputSchema`);
      return undefined;
    }

    // 4. Create the Vercel AI SDK tool that wraps workflow execution
    const toolDescription = metadata.description || `Workflow: ${metadata.name}`;
    
    const vercelTool = tool({
      description: toolDescription,
      // Use workflow's inputSchema directly (already Zod, no conversion needed)
      inputSchema: (workflow as { inputSchema: ZodObject<ZodRawShape> }).inputSchema,
      execute: async (input: Record<string, unknown>) => {
        console.log(`[WorkflowTools] Executing workflow: ${binding.workflowId}`);
        console.log(`[WorkflowTools] Input:`, JSON.stringify(input, null, 2));
        
        try {
          // Create runtimeContext object with connection bindings
          // This is where bound connections (from Phase 10) get passed to workflow steps
          // The transpiled workflow code expects runtimeContext.get("connections")
          const runtimeContext = {
            get: (key: string) => {
              if (key === "connections") {
                return binding.connectionBindings;
              }
              return undefined;
            },
            // Also store as plain object for compatibility
            connections: binding.connectionBindings
          };
          
          // Create workflow run instance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const workflowExec = workflow as any;
          const run = await workflowExec.createRunAsync({
            resourceId: userId,
          });
          
          // Execute workflow with user-provided inputs and runtimeContext
          // The 'input' parameter comes from the agent's tool call
          // It matches the workflow's inputSchema (e.g., { URL: "...", "Email Address": "..." })
          const result = await run.start({
            inputData: input,  // Agent's tool call arguments
            runtimeContext,    // Connections available to all steps
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

