import type { WorkflowDefinition, WorkflowStep, JSONSchema } from "./types";

/**
 * Generates Mastra-compatible TypeScript code from a workflow definition
 */
export function generateWorkflowCode(workflow: WorkflowDefinition): string {
  const lines: string[] = [];

  // Header
  lines.push(`// _tables/workflows/${workflow.id}/workflow.ts`);
  lines.push(`// Auto-generated from workflow.json - DO NOT EDIT DIRECTLY`);
  lines.push(``);
  lines.push(`import { createWorkflow, createStep } from "@mastra/core";`);
  lines.push(`import { z } from "zod";`);
  lines.push(``);

  // Input/Output Schemas
  lines.push(`// ============================================================================`);
  lines.push(`// Input/Output Schemas`);
  lines.push(`// ============================================================================`);
  lines.push(``);
  lines.push(`const inputSchema = ${jsonSchemaToZod(workflow.inputSchema)};`);
  lines.push(``);
  lines.push(`const outputSchema = ${jsonSchemaToZod(workflow.outputSchema)};`);
  lines.push(``);

  // Step Definitions
  lines.push(`// ============================================================================`);
  lines.push(`// Step Definitions`);
  lines.push(`// ============================================================================`);
  lines.push(``);

  for (const step of workflow.steps) {
    lines.push(generateStepCode(step, workflow));
    lines.push(``);
  }

  // Workflow Composition
  lines.push(`// ============================================================================`);
  lines.push(`// Workflow Composition`);
  lines.push(`// ============================================================================`);
  lines.push(``);
  lines.push(generateWorkflowComposition(workflow));
  lines.push(``);

  // Export
  lines.push(`// ============================================================================`);
  lines.push(`// Export for execution`);
  lines.push(`// ============================================================================`);
  lines.push(``);
  lines.push(`export async function executeWorkflow(`);
  lines.push(`  inputs: z.infer<typeof inputSchema>,`);
  lines.push(`  connectionIds: Record<string, string>,`);
  lines.push(`  resourceId?: string`);
  lines.push(`) {`);
  lines.push(`  const run = await ${toCamelCase(workflow.id)}Workflow.createRunAsync({ resourceId });`);
  lines.push(`  return run.start({ inputData: inputs });`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

function generateStepCode(step: WorkflowStep, workflow: WorkflowDefinition): string {
  const stepName = toCamelCase(step.id) + "Step";
  const lines: string[] = [];

  lines.push(`const ${stepName} = createStep({`);
  lines.push(`  id: "${step.id}",`);
  if (step.description) {
    lines.push(`  description: "${escapeString(step.description)}",`);
  }
  lines.push(`  inputSchema: ${jsonSchemaToZod(step.inputSchema)},`);
  lines.push(`  outputSchema: ${jsonSchemaToZod(step.outputSchema)},`);
  lines.push(`  execute: async ({ inputData, resourceId }) => {`);

  if (step.type === "composio") {
    lines.push(`    // Composio tool execution`);
    lines.push(`    const { getComposioClient } = await import("@/app/api/connections/services/composio");`);
    lines.push(`    const client = getComposioClient();`);
    lines.push(`    const result = await client.tools.execute("${step.toolId}", {`);
    lines.push(`      arguments: inputData,`);
    lines.push(`      connected_account_id: "{{connectionId:${step.toolkitSlug}}}",`);
    lines.push(`      user_id: resourceId,`);
    lines.push(`    });`);
    lines.push(`    if (!result.successful) {`);
    lines.push(`      throw new Error(result.error || "Tool execution failed");`);
    lines.push(`    }`);
    lines.push(`    return result.data;`);
  } else if (step.type === "custom" && step.code) {
    lines.push(`    // Custom code execution`);
    lines.push(`    ${step.code.split("\n").join("\n    ")}`);
  } else if (step.type === "query_table") {
    lines.push(`    // Query table execution`);
    lines.push(`    const { queryTable } = await import("@/app/api/records/services/query");`);
    lines.push(`    const tableId = "{{tableId:${step.tableRef}}}";`);
    lines.push(`    const rows = await queryTable(tableId, inputData);`);
    lines.push(`    return { rows };`);
  } else if (step.type === "write_table") {
    lines.push(`    // Write to table execution`);
    lines.push(`    const { insertRow } = await import("@/app/api/records/services/mutation");`);
    lines.push(`    const tableId = "{{tableId:${step.tableRef}}}";`);
    lines.push(`    const inserted = await insertRow(tableId, inputData);`);
    lines.push(`    return { inserted };`);
  } else {
    lines.push(`    // Placeholder execution`);
    lines.push(`    return inputData;`);
  }

  lines.push(`  },`);
  lines.push(`});`);

  return lines.join("\n");
}

function generateWorkflowComposition(workflow: WorkflowDefinition): string {
  const workflowName = toCamelCase(workflow.id) + "Workflow";
  const lines: string[] = [];

  lines.push(`export const ${workflowName} = createWorkflow({`);
  lines.push(`  id: "${workflow.id}",`);
  if (workflow.description) {
    lines.push(`  description: "${escapeString(workflow.description)}",`);
  }
  lines.push(`  inputSchema,`);
  lines.push(`  outputSchema,`);
  lines.push(`})`);

  // Add steps in order
  const stepOrder = workflow.controlFlow.order || workflow.steps.map((s) => s.id);

  for (let i = 0; i < stepOrder.length; i++) {
    const stepId = stepOrder[i];
    const stepName = toCamelCase(stepId) + "Step";
    lines.push(`  .then(${stepName})`);

    // Check for mappings to next step
    if (i < stepOrder.length - 1) {
      const nextStepId = stepOrder[i + 1];
      const mappingsToNext = workflow.mappings.filter((m) => m.targetStepId === nextStepId);

      if (mappingsToNext.length > 0) {
        lines.push(`  .map({`);
        for (const mapping of mappingsToNext) {
          for (const fm of mapping.fieldMappings) {
            if (mapping.sourceStepId === "__input__") {
              lines.push(`    ${fm.targetField}: { initData: ${workflowName}, path: "${fm.sourcePath}" },`);
            } else {
              const sourceStepName = toCamelCase(mapping.sourceStepId) + "Step";
              lines.push(`    ${fm.targetField}: { step: ${sourceStepName}, path: "${fm.sourcePath}" },`);
            }
          }
        }
        lines.push(`  })`);
      }
    }
  }

  lines.push(`  .commit();`);

  return lines.join("\n");
}

function jsonSchemaToZod(schema: JSONSchema): string {
  if (!schema || !schema.type) {
    return "z.unknown()";
  }

  switch (schema.type) {
    case "string":
      let str = "z.string()";
      if (schema.format === "email") str += ".email()";
      if (schema.format === "url") str += ".url()";
      return str;

    case "number":
    case "integer":
      return "z.number()";

    case "boolean":
      return "z.boolean()";

    case "array":
      if (schema.items) {
        return `z.array(${jsonSchemaToZod(schema.items)})`;
      }
      return "z.array(z.unknown())";

    case "object":
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        return "z.record(z.string(), z.unknown())";
      }

      const props = Object.entries(schema.properties)
        .map(([key, value]) => {
          const zodType = jsonSchemaToZod(value as JSONSchema);
          const isRequired = schema.required?.includes(key);
          return `    ${key}: ${zodType}${isRequired ? "" : ".optional()"}`;
        })
        .join(",\n");

      return `z.object({\n${props}\n  })`;

    default:
      return "z.unknown()";
  }
}

function toCamelCase(str: string): string {
  return str
    .split("-")
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

function escapeString(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}




