import type { 
  WorkflowDefinition, 
  WorkflowStep, 
  DataMapping,
  JSONSchema 
} from "@/app/api/workflows-d/services/types";

/**
 * Generate Mastra workflow TypeScript code from a WorkflowDefinition
 */
export function generateWorkflowCode(workflow: WorkflowDefinition): string {
  const imports = generateImports(workflow);
  const stepDefinitions = workflow.steps.map(generateStepDefinition).join("\n\n");
  const workflowDefinition = generateWorkflowDefinition(workflow);

  return `${imports}

// ============================================================================
// Step Definitions
// ============================================================================

${stepDefinitions}

// ============================================================================
// Workflow Definition
// ============================================================================

${workflowDefinition}
`;
}

function generateImports(workflow: WorkflowDefinition): string {
  const imports: string[] = [
    'import { createWorkflow, createStep } from "@mastra/core";',
    'import { z } from "zod";',
  ];

  // Add Composio imports if needed
  const hasComposioSteps = workflow.steps.some((s) => s.type === "composio");
  if (hasComposioSteps) {
    imports.push('import { composio } from "@/lib/composio";');
  }

  return imports.join("\n");
}

function generateStepDefinition(step: WorkflowStep): string {
  const inputSchema = jsonSchemaToZod(step.inputSchema);
  const outputSchema = jsonSchemaToZod(step.outputSchema);

  if (step.type === "composio") {
    return `const ${sanitizeStepId(step.id)} = createStep({
  id: "${step.id}",
  description: "${escapeString(step.description || step.name)}",
  inputSchema: ${inputSchema},
  outputSchema: ${outputSchema},
  execute: async ({ inputData }) => {
    const tool = composio.getTools("${step.toolId}");
    const result = await tool.execute(inputData);
    return result;
  },
});`;
  }

  if (step.type === "custom") {
    return `const ${sanitizeStepId(step.id)} = createStep({
  id: "${step.id}",
  description: "${escapeString(step.description || step.name)}",
  inputSchema: ${inputSchema},
  outputSchema: ${outputSchema},
  execute: async ({ inputData }) => {
    ${step.code || "// Custom code here\n    return inputData;"}
  },
});`;
  }

  if (step.type === "query_table") {
    return `const ${sanitizeStepId(step.id)} = createStep({
  id: "${step.id}",
  description: "${escapeString(step.description || "Query table")}",
  inputSchema: ${inputSchema},
  outputSchema: z.object({
    rows: z.array(z.record(z.any())),
    count: z.number(),
  }),
  execute: async ({ inputData, context }) => {
    // Query table implementation
    const rows = await context.tables.query("${step.tableRef || ""}");
    return { rows, count: rows.length };
  },
});`;
  }

  if (step.type === "write_table") {
    return `const ${sanitizeStepId(step.id)} = createStep({
  id: "${step.id}",
  description: "${escapeString(step.description || "Write to table")}",
  inputSchema: ${inputSchema},
  outputSchema: z.object({
    success: z.boolean(),
    rowId: z.string().optional(),
  }),
  execute: async ({ inputData, context }) => {
    // Write table implementation
    const rowId = await context.tables.insert("${step.tableRef || ""}", inputData.data);
    return { success: true, rowId };
  },
});`;
  }

  // Default step
  return `const ${sanitizeStepId(step.id)} = createStep({
  id: "${step.id}",
  description: "${escapeString(step.description || step.name)}",
  inputSchema: ${inputSchema},
  outputSchema: ${outputSchema},
  execute: async ({ inputData }) => {
    return inputData;
  },
});`;
}

function generateWorkflowDefinition(workflow: WorkflowDefinition): string {
  const inputSchema = jsonSchemaToZod(workflow.inputSchema);
  const stepChain = generateStepChain(workflow);

  return `export const ${sanitizeWorkflowId(workflow.id)} = createWorkflow({
  id: "${workflow.id}",
  description: "${escapeString(workflow.description || workflow.name)}",
  inputSchema: ${inputSchema},
})
${stepChain}
  .commit();`;
}

function generateStepChain(workflow: WorkflowDefinition): string {
  const steps = workflow.steps;
  const mappings = workflow.mappings;

  if (steps.length === 0) {
    return "";
  }

  const chainParts: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const mapping = mappings.find((m) => m.targetStepId === step.id);
    
    if (i === 0) {
      // First step
      if (mapping && mapping.fieldMappings.length > 0) {
        chainParts.push(`  .then(${sanitizeStepId(step.id)}, {
    inputMapping: ${generateInputMapping(mapping)},
  })`);
      } else {
        chainParts.push(`  .then(${sanitizeStepId(step.id)})`);
      }
    } else {
      // Subsequent steps with mapping
      if (mapping && mapping.fieldMappings.length > 0) {
        chainParts.push(`  .then(${sanitizeStepId(step.id)}, {
    inputMapping: ${generateInputMapping(mapping)},
  })`);
      } else {
        chainParts.push(`  .then(${sanitizeStepId(step.id)})`);
      }
    }
  }

  return chainParts.join("\n");
}

function generateInputMapping(mapping: DataMapping): string {
  if (mapping.fieldMappings.length === 0) {
    return "{}";
  }

  const mappingEntries = mapping.fieldMappings
    .map((fm) => {
      if (mapping.sourceStepId === "__input__") {
        return `    ${fm.targetField}: ({ triggerData }) => triggerData.${fm.sourcePath}`;
      }
      return `    ${fm.targetField}: ({ getStepResult }) => getStepResult("${mapping.sourceStepId}")?.${fm.sourcePath}`;
    })
    .join(",\n");

  return `{
${mappingEntries},
  }`;
}

function jsonSchemaToZod(schema: JSONSchema): string {
  if (!schema || !schema.type) {
    return "z.any()";
  }

  switch (schema.type) {
    case "string":
      let s = "z.string()";
      if (schema.format === "email") s += ".email()";
      if (schema.format === "url") s += ".url()";
      return s;

    case "number":
    case "integer":
      return "z.number()";

    case "boolean":
      return "z.boolean()";

    case "array":
      if (schema.items) {
        return `z.array(${jsonSchemaToZod(schema.items)})`;
      }
      return "z.array(z.any())";

    case "object":
      if (!schema.properties || Object.keys(schema.properties).length === 0) {
        return "z.record(z.string(), z.any())";
      }
      
      const required = schema.required || [];
      const props = Object.entries(schema.properties)
        .map(([key, value]) => {
          const zodType = jsonSchemaToZod(value as JSONSchema);
          const isRequired = required.includes(key);
          return `  ${key}: ${zodType}${isRequired ? "" : ".optional()"}`;
        })
        .join(",\n");
      
      return `z.object({\n${props}\n})`;

    default:
      return "z.any()";
  }
}

function sanitizeStepId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function sanitizeWorkflowId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_") + "Workflow";
}

function escapeString(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}


