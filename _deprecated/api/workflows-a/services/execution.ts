import type { WorkflowDefinition } from "./types";
import { readWorkflow } from "./storage";

export interface WorkflowExecutionContext {
  workflowId: string;
  inputs: Record<string, unknown>;
  connectionIds: Record<string, string>;
  tableBindings: Record<string, string>;
  resourceId?: string;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

export interface WorkflowExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  stepResults: StepExecutionResult[];
  totalDuration: number;
}

/**
 * Execute a workflow with the given context.
 * This is a runtime executor that interprets the workflow JSON directly.
 */
export async function executeWorkflow(
  context: WorkflowExecutionContext
): Promise<WorkflowExecutionResult> {
  const startTime = Date.now();
  const stepResults: StepExecutionResult[] = [];

  try {
    const workflow = await readWorkflow(context.workflowId);
    if (!workflow) {
      return {
        success: false,
        error: "Workflow not found",
        stepResults: [],
        totalDuration: Date.now() - startTime,
      };
    }

    // Sort steps by listIndex for sequential execution
    const orderedSteps = [...workflow.steps].sort((a, b) => a.listIndex - b.listIndex);
    
    // Execution context to pass data between steps
    let stepOutputs: Record<string, unknown> = {};
    
    for (const step of orderedSteps) {
      const stepStartTime = Date.now();
      
      try {
        // Resolve input data from mappings
        const inputData = resolveInputMappings(
          step,
          workflow,
          context.inputs,
          stepOutputs
        );

        // Execute the step based on its type
        let output: unknown;
        
        switch (step.type) {
          case "composio":
            output = await executeComposioStep(step, inputData, context);
            break;
          case "custom":
            output = await executeCustomStep(step, inputData);
            break;
          case "query_table":
            output = await executeQueryTableStep(step, inputData, context);
            break;
          case "write_table":
            output = await executeWriteTableStep(step, inputData, context);
            break;
          default:
            output = inputData;
        }

        stepOutputs[step.id] = output;
        
        stepResults.push({
          stepId: step.id,
          success: true,
          output,
          duration: Date.now() - stepStartTime,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Step execution failed";
        stepResults.push({
          stepId: step.id,
          success: false,
          error: errorMessage,
          duration: Date.now() - stepStartTime,
        });
        
        return {
          success: false,
          error: `Step "${step.name}" failed: ${errorMessage}`,
          stepResults,
          totalDuration: Date.now() - startTime,
        };
      }
    }

    // Get final output from last step
    const lastStep = orderedSteps[orderedSteps.length - 1];
    const finalOutput = lastStep ? stepOutputs[lastStep.id] : undefined;

    return {
      success: true,
      output: finalOutput,
      stepResults,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Workflow execution failed",
      stepResults,
      totalDuration: Date.now() - startTime,
    };
  }
}

function resolveInputMappings(
  step: WorkflowDefinition["steps"][0],
  workflow: WorkflowDefinition,
  workflowInputs: Record<string, unknown>,
  stepOutputs: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Find mappings targeting this step
  const mappings = workflow.mappings.filter((m) => m.targetStepId === step.id);

  for (const mapping of mappings) {
    for (const fieldMapping of mapping.fieldMappings) {
      let value: unknown;

      if (mapping.sourceStepId === "__input__") {
        // Source is workflow input
        value = getNestedValue(workflowInputs, fieldMapping.sourcePath);
      } else if (mapping.sourceStepId === "__static__") {
        // Static value
        value = fieldMapping.sourcePath;
      } else {
        // Source is another step's output
        const sourceOutput = stepOutputs[mapping.sourceStepId];
        value = getNestedValue(sourceOutput as Record<string, unknown>, fieldMapping.sourcePath);
      }

      result[fieldMapping.targetField] = value;
    }
  }

  return result;
}

function getNestedValue(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined;
  
  const parts = path.split(".");
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

async function executeComposioStep(
  step: WorkflowDefinition["steps"][0],
  inputData: Record<string, unknown>,
  context: WorkflowExecutionContext
): Promise<unknown> {
  const { getComposioClient } = await import("@/app/api/connections/services/composio");
  const client = getComposioClient();

  const connectionId = step.toolkitSlug ? context.connectionIds[step.toolkitSlug] : undefined;
  
  if (!connectionId) {
    throw new Error(`No connection ID provided for toolkit: ${step.toolkitSlug}`);
  }

  const result = await client.tools.execute(step.toolId!, {
    arguments: inputData,
    connectedAccountId: connectionId,
    entityId: context.resourceId,
  });

  if (!result.successful) {
    throw new Error(result.error || "Tool execution failed");
  }

  return result.data;
}

async function executeCustomStep(
  step: WorkflowDefinition["steps"][0],
  inputData: Record<string, unknown>
): Promise<unknown> {
  // Custom code execution would need sandboxing in production
  // For now, just return the input data
  console.log("Custom step execution:", step.name, inputData);
  return inputData;
}

async function executeQueryTableStep(
  step: WorkflowDefinition["steps"][0],
  inputData: Record<string, unknown>,
  context: WorkflowExecutionContext
): Promise<unknown> {
  const tableId = step.tableRef ? context.tableBindings[step.tableRef] : undefined;
  
  if (!tableId) {
    throw new Error(`No table binding for: ${step.tableRef}`);
  }

  // In a real implementation, this would query the records service
  console.log("Query table:", tableId, inputData);
  return { rows: [] };
}

async function executeWriteTableStep(
  step: WorkflowDefinition["steps"][0],
  inputData: Record<string, unknown>,
  context: WorkflowExecutionContext
): Promise<unknown> {
  const tableId = step.tableRef ? context.tableBindings[step.tableRef] : undefined;
  
  if (!tableId) {
    throw new Error(`No table binding for: ${step.tableRef}`);
  }

  // In a real implementation, this would write to the records service
  console.log("Write to table:", tableId, inputData);
  return { inserted: true, id: "new-row-id" };
}


