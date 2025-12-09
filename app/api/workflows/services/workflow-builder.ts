/**
 * Workflow Builder
 * 
 * Constructs Mastra workflows from JSON definitions at runtime.
 * This is the core of Phase 12 - we build workflows as JavaScript objects
 * instead of loading transpiled files, solving the Turbopack dynamic import issue.
 */

import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import type { StepBindings, FieldBinding } from "@/app/api/workflows/types/bindings";
import type { WorkflowStep } from "@/app/api/workflows/types/workflow-step";
import type { JSONSchema } from "@/app/api/workflows/types/schemas";
import { getComposioClient } from "@/app/api/connections/services/composio";
import { generateInputSchemaFromRuntimeInputs } from "@/app/api/workflows/[workflowId]/services/input-schema-generator";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets nested value from path like "data.navigatedUrl"
 * Parses dot-notation paths and traverses object properties safely.
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Converts JSON Schema to Zod schema objects at runtime.
 * Returns actual Zod objects (not code strings) for use in createWorkflow/createStep.
 */
function jsonSchemaToZod(schema: JSONSchema | undefined): z.ZodTypeAny {
  if (!schema || Object.keys(schema).length === 0) {
    return z.any();
  }

  // Handle enum
  if (schema.enum && schema.enum.length > 0) {
    const enumValues = schema.enum.map((v) => String(v)) as [string, ...string[]];
    return z.enum(enumValues);
  }

  const { type, properties, items, required = [] } = schema;

  switch (type) {
    case "string":
      return z.string();

    case "number":
    case "integer":
      return type === "integer" ? z.number().int() : z.number();

    case "boolean":
      return z.boolean();

    case "array":
      const itemsZod = jsonSchemaToZod(items as JSONSchema | undefined);
      return z.array(itemsZod);

    case "object":
      if (!properties || Object.keys(properties).length === 0) {
        return z.object({});
      }

      const props: Record<string, z.ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        const propZod = jsonSchemaToZod(propSchema as JSONSchema);
        const isRequired = required.includes(key);
        props[key] = isRequired ? propZod : propZod.optional();
      }

      return z.object(props);

    default:
      return z.any();
  }
}

// ============================================================================
// Execute Function Builders
// ============================================================================

/**
 * Builds an execute function for Composio tool steps.
 * Returns an async function that calls Composio client with proper connection handling.
 */
function buildComposioExecuteFunction(step: WorkflowStep): (params: {
  inputData: Record<string, unknown>;
  runtimeContext: { get: (key: string) => unknown };
}) => Promise<unknown> {
  if (!step.toolId || !step.toolkitSlug) {
    throw new Error(
      `Composio step "${step.id}" missing required fields: toolId=${step.toolId}, toolkitSlug=${step.toolkitSlug}`
    );
  }

  const toolId = step.toolId;
  const toolkitSlug = step.toolkitSlug;

  return async ({ inputData, runtimeContext }) => {
    const client = getComposioClient();
    const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.[toolkitSlug];
    const userId = runtimeContext.get("userId") as string | undefined;

    if (!userId) {
      throw new Error(`Step ${step.id} requires userId in runtimeContext for Composio tool execution`);
    }

    const result = await client.tools.execute(toolId, {
      userId,
      arguments: inputData,
      connectedAccountId: connectionId, // undefined for NO_AUTH toolkits
      dangerouslySkipVersionCheck: true,
    });

    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }

    return result.data;
  };
}

/**
 * Builds an execute function for custom code steps.
 * Placeholder for Phase 14+ when custom code execution is implemented.
 */
function buildCustomExecuteFunction(step: WorkflowStep): (params: {
  inputData: Record<string, unknown>;
}) => Promise<unknown> {
  if (!step.code) {
    throw new Error(`Custom step "${step.id}" missing code field`);
  }

  // TODO: Execute custom code (Phase 14+)
  return async ({ inputData }) => {
    return inputData; // Placeholder
  };
}

/**
 * Builds a default execute function for unknown step types.
 * Pass-through function that returns input data unchanged.
 */
function buildDefaultExecuteFunction(_step: WorkflowStep): (params: {
  inputData: Record<string, unknown>;
}) => Promise<unknown> {
  return async ({ inputData }) => {
    return inputData;
  };
}

// ============================================================================
// Mapping Transform Builder
// ============================================================================

/**
 * Builds a mapping transform function for a step's input bindings.
 * Returns an async function that maps workflow inputs and step outputs to step inputs.
 * 
 * Note: In Mastra's .map(), inputData is the previous step's output, not the original workflow input.
 * Use getInitData() to access the original workflow input.
 */
function buildMappingTransform(
  stepId: string,
  bindings: Record<string, StepBindings>
): ((params: {
  inputData: Record<string, unknown>;
  getStepResult: (stepId: string) => unknown;
  getInitData: () => Record<string, unknown>;
}) => Promise<Record<string, unknown>>) | null {
  const stepBindings = bindings[stepId];
  if (!stepBindings || Object.keys(stepBindings.inputBindings).length === 0) {
    return null; // No bindings, no mapping needed
  }

  return async ({ inputData, getStepResult, getInitData }) => {
    const mappedInput: Record<string, unknown> = {};
    // Get original workflow input once
    const initData = getInitData();

    for (const [fieldName, fieldBinding] of Object.entries(stepBindings.inputBindings)) {
      switch (fieldBinding.sourceType) {
        case "workflow-input":
          if (fieldBinding.workflowInputName) {
            // Use bracket notation for workflow input names with spaces/special chars
            // Access original workflow input via getInitData(), not inputData
            mappedInput[fieldBinding.targetField] = initData[fieldBinding.workflowInputName];
          }
          break;

        case "step-output":
          if (fieldBinding.sourceStepId && fieldBinding.sourcePath) {
            const stepResult = getStepResult(fieldBinding.sourceStepId);
            mappedInput[fieldBinding.targetField] = getNestedValue(stepResult, fieldBinding.sourcePath);
          }
          break;

        case "literal":
          mappedInput[fieldBinding.targetField] = fieldBinding.literalValue;
          break;

        default:
          // Unknown source type, skip
          break;
      }
    }

    return mappedInput;
  };
}

// ============================================================================
// Main Builder Function
// ============================================================================

/**
 * Builds a Mastra workflow from a workflow definition and bindings.
 * This is the main orchestrator that constructs workflows at runtime.
 * 
 * @param definition - The workflow definition from workflow.json
 * @param bindings - Step input bindings keyed by step ID
 * @returns A fully executable Mastra workflow object
 */
export function buildWorkflowFromDefinition(
  definition: WorkflowDefinition,
  bindings: Record<string, StepBindings>
): ReturnType<typeof createWorkflow> {
  // Convert runtimeInputs to inputSchema (JSON Schema → Zod)
  const inputSchemaJson = generateInputSchemaFromRuntimeInputs(definition.runtimeInputs || []);
  const inputZod = jsonSchemaToZod(inputSchemaJson);

  // Create workflow base
  let workflow = createWorkflow({
    id: definition.id,
    inputSchema: inputZod,
    outputSchema: z.any(), // Workflows can return any output
  });

  // Sort steps by listIndex (sequential order)
  const sortedSteps = [...definition.steps]
    .filter((step) => step.type !== "control") // Skip control flow for now (Phase 13)
    .sort((a, b) => a.listIndex - b.listIndex);

  // Build and add each step
  for (const step of sortedSteps) {
    // Convert step schemas
    const stepInputZod = jsonSchemaToZod(step.inputSchema);
    const stepOutputZod = jsonSchemaToZod(step.outputSchema);

    // Build execute function based on step type
    let execute: (params: {
      inputData: Record<string, unknown>;
      runtimeContext?: { get: (key: string) => unknown };
    }) => Promise<unknown>;

    if (step.type === "composio") {
      // Composio steps require runtimeContext, but we'll handle undefined case
      const composioExecute = buildComposioExecuteFunction(step);
      execute = async (params) => {
        if (!params.runtimeContext) {
          throw new Error(`Step ${step.id} requires runtimeContext for Composio tool execution`);
        }
        return composioExecute({
          inputData: params.inputData,
          runtimeContext: params.runtimeContext,
        });
      };
    } else if (step.type === "custom") {
      execute = buildCustomExecuteFunction(step);
    } else {
      execute = buildDefaultExecuteFunction(step);
    }

    // Create step object
    const stepObj = createStep({
      id: step.id,
      inputSchema: stepInputZod,
      outputSchema: stepOutputZod,
      execute: execute as any, // Type assertion needed due to Mastra's execute signature
    });

    // Add mapping if step has bindings
    const mappingTransform = buildMappingTransform(step.id, bindings);
    if (mappingTransform) {
      workflow = workflow.map(mappingTransform as any);
    }

    // Add step to workflow
    workflow = workflow.then(stepObj);
  }

  // Commit and return workflow
  return workflow.commit();
}
