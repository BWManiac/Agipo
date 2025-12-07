/**
 * Code Generator for Workflows C
 * 
 * Transforms visual workflow definitions into Mastra-native TypeScript code.
 * This generates production-ready code that uses @mastra/core primitives.
 */

import {
  WorkflowDefinition,
  WorkflowStep,
  DataMapping,
  RuntimeInputConfig,
  JSONSchema,
} from "@/app/api/workflows/services/types";

// Convert a step ID to a valid TypeScript variable name
function toVariableName(id: string): string {
  return id.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}

// Convert a string to PascalCase for workflow names
function toPascalCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

// Generate Zod schema from JSON Schema
function generateZodSchema(schema: JSONSchema | undefined, indent = 2): string {
  if (!schema) return "z.object({})";

  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 2);

  if (schema.type === "object" && schema.properties) {
    const fields = Object.entries(schema.properties).map(([key, value]) => {
      const fieldSchema = value as JSONSchema & { description?: string };
      let zodType = generateZodType(fieldSchema);
      
      // Add optional if not required
      const isRequired = schema.required?.includes(key);
      if (!isRequired) {
        zodType += ".optional()";
      }
      
      // Add description
      if (fieldSchema.description) {
        zodType += `.describe("${fieldSchema.description.replace(/"/g, '\\"')}")`;
      }
      
      return `${innerSpaces}${key}: ${zodType}`;
    });
    
    return `z.object({\n${fields.join(",\n")}\n${spaces}})`;
  }
  
  return generateZodType(schema);
}

// Generate Zod type for a single field
function generateZodType(schema: JSONSchema & { description?: string }): string {
  switch (schema.type) {
    case "string":
      if (schema.format === "email") return "z.string().email()";
      if (schema.format === "url") return "z.string().url()";
      if (schema.format === "date") return "z.string().datetime()";
      if (schema.enum) return `z.enum([${schema.enum.map((v) => `"${v}"`).join(", ")}])`;
      return "z.string()";
    case "number":
    case "integer":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      if (schema.items) {
        return `z.array(${generateZodType(schema.items as JSONSchema)})`;
      }
      return "z.array(z.any())";
    case "object":
      if (schema.properties) {
        return generateZodSchema(schema);
      }
      return "z.record(z.any())";
    default:
      return "z.any()";
  }
}

// Generate the workflow input schema from runtime inputs
function generateInputSchema(inputs: RuntimeInputConfig[]): string {
  if (inputs.length === 0) {
    return "z.object({})";
  }

  const fields = inputs.map((input) => {
    let zodType: string;
    switch (input.type) {
      case "string":
        zodType = "z.string()";
        break;
      case "number":
        zodType = "z.number()";
        break;
      case "boolean":
        zodType = "z.boolean()";
        break;
      case "array":
        zodType = "z.array(z.any())";
        break;
      case "object":
        zodType = "z.record(z.any())";
        break;
      default:
        zodType = "z.any()";
    }
    
    if (!input.required) {
      zodType += ".optional()";
    }
    if (input.description) {
      zodType += `.describe("${input.description.replace(/"/g, '\\"')}")`;
    }
    
    return `  ${input.key}: ${zodType}`;
  });

  return `z.object({\n${fields.join(",\n")}\n})`;
}

// Generate step definition code
function generateStep(step: WorkflowStep): string {
  const varName = `${toVariableName(step.id)}Step`;
  const lines: string[] = [];

  lines.push(`const ${varName} = createStep({`);
  lines.push(`  id: "${step.id}",`);
  
  if (step.description) {
    lines.push(`  description: "${step.description.replace(/"/g, '\\"')}",`);
  }
  
  // Input schema
  lines.push(`  inputSchema: ${generateZodSchema(step.inputSchema, 2)},`);
  
  // Output schema
  lines.push(`  outputSchema: ${generateZodSchema(step.outputSchema, 2)},`);
  
  // Execute function
  lines.push(`  execute: async ({ inputData }) => {`);
  
  if (step.type === "composio" && step.toolId) {
    lines.push(`    // Execute Composio tool: ${step.toolId}`);
    lines.push(`    const result = await composioClient.executeAction({`);
    lines.push(`      action: "${step.toolId}",`);
    lines.push(`      params: inputData,`);
    lines.push(`    });`);
    lines.push(`    return result;`);
  } else if (step.type === "custom" && step.code) {
    lines.push(`    // Custom code`);
    step.code.split("\n").forEach((line) => {
      lines.push(`    ${line}`);
    });
  } else {
    lines.push(`    // TODO: Implement step logic`);
    lines.push(`    return inputData;`);
  }
  
  lines.push(`  },`);
  lines.push(`});`);

  return lines.join("\n");
}

// Generate .map() call for data mapping
function generateMapCall(
  mapping: DataMapping,
  steps: WorkflowStep[],
  indent = 2
): string {
  const spaces = " ".repeat(indent);
  const innerSpaces = " ".repeat(indent + 2);
  
  if (mapping.fieldMappings.length === 0) {
    return "";
  }

  const mappingLines: string[] = [];
  
  for (const fm of mapping.fieldMappings) {
    if (mapping.sourceStepId === "__input__") {
      // Map from workflow input
      mappingLines.push(
        `${innerSpaces}${fm.targetField}: ({ inputData }) => inputData.${fm.sourcePath},`
      );
    } else {
      // Map from previous step
      const sourceStep = steps.find((s) => s.id === mapping.sourceStepId);
      const stepVar = sourceStep ? `${toVariableName(sourceStep.id)}Step` : "prevStep";
      mappingLines.push(
        `${innerSpaces}${fm.targetField}: { step: ${stepVar}, path: "${fm.sourcePath}" },`
      );
    }
  }

  return `${spaces}.map({\n${mappingLines.join("\n")}\n${spaces}})`;
}

// Main code generation function
export function generateWorkflowCode(workflow: WorkflowDefinition): string {
  const lines: string[] = [];
  const workflowName = toPascalCase(workflow.name || workflow.id);

  // Header comment
  lines.push(`/**`);
  lines.push(` * ${workflow.name || "Workflow"}`);
  if (workflow.description) {
    lines.push(` * `);
    lines.push(` * ${workflow.description}`);
  }
  lines.push(` * `);
  lines.push(` * Generated by Workflows C Editor`);
  lines.push(` * Generated at: ${new Date().toISOString()}`);
  lines.push(` */`);
  lines.push(``);

  // Imports
  lines.push(`import { createWorkflow, createStep } from "@mastra/core";`);
  lines.push(`import { z } from "zod";`);
  
  // Add Composio import if needed
  const hasComposioSteps = workflow.steps.some((s) => s.type === "composio");
  if (hasComposioSteps) {
    lines.push(`import { composioClient } from "@/lib/composio";`);
  }
  
  lines.push(``);

  // Generate input schema
  if (workflow.runtimeInputs.length > 0) {
    lines.push(`// Workflow Input Schema`);
    lines.push(`const inputSchema = ${generateInputSchema(workflow.runtimeInputs)};`);
    lines.push(``);
  }

  // Sort steps by list index
  const sortedSteps = [...workflow.steps].sort((a, b) => a.listIndex - b.listIndex);

  // Generate step definitions
  lines.push(`// Step Definitions`);
  for (const step of sortedSteps) {
    lines.push(generateStep(step));
    lines.push(``);
  }

  // Generate workflow composition
  lines.push(`// Workflow Composition`);
  lines.push(`export const ${workflowName}Workflow = createWorkflow({`);
  lines.push(`  id: "${workflow.id}",`);
  lines.push(`  name: "${workflow.name || workflowName}",`);
  if (workflow.description) {
    lines.push(`  description: "${workflow.description.replace(/"/g, '\\"')}",`);
  }
  if (workflow.runtimeInputs.length > 0) {
    lines.push(`  inputSchema,`);
  } else {
    lines.push(`  inputSchema: z.object({}),`);
  }
  lines.push(`  outputSchema: ${generateZodSchema(workflow.outputSchema, 2)},`);
  lines.push(`})`);

  // Chain steps with .then() and .map()
  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const stepVar = `${toVariableName(step.id)}Step`;
    
    lines.push(`  .then(${stepVar})`);
    
    // Find mapping for next step
    if (i < sortedSteps.length - 1) {
      const nextStep = sortedSteps[i + 1];
      const mapping = workflow.mappings.find(
        (m) => m.sourceStepId === step.id && m.targetStepId === nextStep.id
      );
      if (mapping) {
        const mapCode = generateMapCall(mapping, sortedSteps);
        if (mapCode) {
          lines.push(mapCode);
        }
      }
    }
  }

  // Check for workflow input mapping to first step
  if (sortedSteps.length > 0) {
    const firstStep = sortedSteps[0];
    const inputMapping = workflow.mappings.find(
      (m) => m.sourceStepId === "__input__" && m.targetStepId === firstStep.id
    );
    if (inputMapping && inputMapping.fieldMappings.length > 0) {
      // Insert input mapping before first .then()
      const insertIndex = lines.findIndex((l) => l.includes(".then("));
      if (insertIndex !== -1) {
        const mapLines: string[] = [];
        mapLines.push(`  .map({`);
        for (const fm of inputMapping.fieldMappings) {
          mapLines.push(`    ${fm.targetField}: ({ inputData }) => inputData.${fm.sourcePath},`);
        }
        mapLines.push(`  })`);
        lines.splice(insertIndex, 0, ...mapLines);
      }
    }
  }

  lines.push(`  .commit();`);
  lines.push(``);

  // Export type for workflow input
  if (workflow.runtimeInputs.length > 0) {
    lines.push(`// Type exports`);
    lines.push(`export type ${workflowName}Input = z.infer<typeof inputSchema>;`);
  }

  return lines.join("\n");
}

// Generate a preview (simplified) version for the editor
export function generateCodePreview(workflow: WorkflowDefinition): string {
  const sortedSteps = [...workflow.steps].sort((a, b) => a.listIndex - b.listIndex);
  const workflowName = toPascalCase(workflow.name || workflow.id);
  
  const lines: string[] = [
    `// Auto-generated Mastra workflow`,
    `// This preview updates as you build`,
    ``,
    `import { createWorkflow, createStep } from "@mastra/core";`,
    `import { z } from "zod";`,
    ``,
  ];

  // Input schema
  if (workflow.runtimeInputs.length > 0) {
    lines.push(`const inputSchema = ${generateInputSchema(workflow.runtimeInputs)};`);
    lines.push(``);
  }

  // Simplified step definitions
  for (const step of sortedSteps) {
    const varName = `${toVariableName(step.id)}Step`;
    lines.push(`const ${varName} = createStep({`);
    lines.push(`  id: "${step.id}",`);
    lines.push(`  inputSchema: z.object({ /* ${Object.keys(step.inputSchema?.properties || {}).length} fields */ }),`);
    lines.push(`  outputSchema: z.object({ /* ${Object.keys(step.outputSchema?.properties || {}).length} fields */ }),`);
    lines.push(`  execute: async ({ inputData }) => {`);
    if (step.type === "composio" && step.toolId) {
      lines.push(`    return await composio.execute("${step.toolId}", inputData);`);
    } else {
      lines.push(`    // Custom logic`);
      lines.push(`    return inputData;`);
    }
    lines.push(`  },`);
    lines.push(`});`);
    lines.push(``);
  }

  // Workflow composition
  lines.push(`export const ${workflowName}Workflow = createWorkflow({`);
  lines.push(`  id: "${workflow.id}",`);
  if (workflow.runtimeInputs.length > 0) {
    lines.push(`  inputSchema,`);
  }
  lines.push(`  outputSchema: z.object({ /* ... */ }),`);
  lines.push(`})`);

  // Step chain
  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const varName = `${toVariableName(step.id)}Step`;
    lines.push(`  .then(${varName})`);

    // Show mappings
    if (i < sortedSteps.length - 1) {
      const nextStep = sortedSteps[i + 1];
      const mapping = workflow.mappings.find(
        (m) => m.sourceStepId === step.id && m.targetStepId === nextStep.id
      );
      if (mapping && mapping.fieldMappings.length > 0) {
        lines.push(`  .map({`);
        for (const fm of mapping.fieldMappings.slice(0, 3)) {
          lines.push(`    ${fm.targetField}: { step: ${varName}, path: "${fm.sourcePath}" },`);
        }
        if (mapping.fieldMappings.length > 3) {
          lines.push(`    // ... ${mapping.fieldMappings.length - 3} more mappings`);
        }
        lines.push(`  })`);
      }
    }
  }

  lines.push(`  .commit();`);

  return lines.join("\n");
}



