import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import type { StepBindings } from "@/app/api/workflows/types/bindings";
import type { TranspilerContext, TranspilerResult, TranspilerMetadata } from "./types";
import { generateStepCode } from "./step-generator";
import { generateWorkflowComposition } from "./workflow-generator";
import { generateInputSchemaFromRuntimeInputs } from "../input-schema-generator";

/**
 * Transpiles a workflow definition into executable Mastra TypeScript code.
 * 
 * @param definition - The workflow definition from workflow.json
 * @param bindings - Step input bindings keyed by step ID
 * @returns TranspilerResult with generated code, metadata, and any errors
 */
export function transpileWorkflow(
  definition: WorkflowDefinition,
  bindings: Record<string, StepBindings>
): TranspilerResult {
  const errors: string[] = [];
  const context: TranspilerContext = {
    stepVarMap: new Map(),
    usedImports: new Set(),
    bindings,
  };

  // Check for unsupported features
  const controlSteps = definition.steps.filter((s) => s.type === "control");
  if (controlSteps.length > 0) {
    errors.push(
      `Control flow steps (${controlSteps.map((s) => s.controlType).join(", ")}) not yet supported. Coming in Phase 10.`
    );
  }

  // Generate step declarations
  const stepDeclarations: string[] = [];
  const sequentialSteps = definition.steps.filter((s) => s.type !== "control");

  for (const step of sequentialSteps) {
    try {
      const { code } = generateStepCode(step, context);
      stepDeclarations.push(code);
    } catch (e) {
      errors.push(`Failed to generate step "${step.name}": ${e}`);
    }
  }

  // Generate inputSchema from runtimeInputs (AC-9.8, AC-9.9, AC-9.10)
  let inputSchema;
  try {
    inputSchema = generateInputSchemaFromRuntimeInputs(definition.runtimeInputs || []);
  } catch (e) {
    errors.push(`Failed to generate input schema: ${e}`);
    // Fallback to empty schema
    inputSchema = { type: "object", properties: {}, required: [] };
  }

  // Create definition with generated inputSchema
  const definitionWithSchema: WorkflowDefinition = {
    ...definition,
    inputSchema,
  };

  // Generate workflow composition using definition with generated schema (AC-9.12)
  let workflowCode = "";
  try {
    workflowCode = generateWorkflowComposition(definitionWithSchema, bindings, context);
  } catch (e) {
    errors.push(`Failed to generate workflow composition: ${e}`);
  }

  // Generate imports
  const imports = generateImports(context);

  // Generate metadata export
  const metadata = extractMetadata(definition);
  const metadataExport = generateMetadataExport(metadata);

  // Assemble final code
  const code = [
    imports,
    "",
    "// Step definitions",
    ...stepDeclarations,
    "",
    "// Workflow composition",
    workflowCode,
    "",
    "// Metadata for runtime",
    metadataExport,
  ].join("\n");

  return { code, metadata, errors };
}

/**
 * Generates import statements based on what the code uses.
 */
function generateImports(context: TranspilerContext): string {
  const lines: string[] = [
    'import { createWorkflow, createStep } from "@mastra/core/workflows";',
    'import { z } from "zod";',
  ];

  if (context.usedImports.has("composio")) {
    lines.push('import { getComposioClient } from "@/app/api/connections/services/composio";');
  }

  return lines.join("\n");
}

/**
 * Extracts metadata from the workflow definition.
 */
function extractMetadata(definition: WorkflowDefinition): TranspilerMetadata {
  const requiredConnections = new Set<string>();

  for (const step of definition.steps) {
    if (step.type === "composio" && step.toolkitSlug) {
      requiredConnections.add(step.toolkitSlug);
    }
  }

  return {
    requiredConnections: Array.from(requiredConnections),
    stepCount: definition.steps.length,
  };
}

/**
 * Generates the metadata export for runtime use.
 */
function generateMetadataExport(metadata: TranspilerMetadata): string {
  return `export const workflowMetadata = ${JSON.stringify(metadata, null, 2)};`;
}

