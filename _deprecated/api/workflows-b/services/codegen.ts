/**
 * Code Generation Service
 * 
 * Deterministically transpiles editor.json (EditorState) into workflow.ts (Mastra code).
 * This is a pure function that takes the workflow definition and produces TypeScript code.
 * 
 * The generated code follows Mastra workflow patterns:
 * - createWorkflow for the workflow definition
 * - createStep for each step
 * - .then() for sequential execution
 * - .map() for data transformations between steps
 */

import type { 
  WorkflowDefinition, 
  WorkflowStep, 
  InputSource,
  SchemaField 
} from "@/_tables/workflows-b/types";

/**
 * Generate Mastra workflow code from a workflow definition.
 */
export function generateWorkflowCode(workflow: WorkflowDefinition): string {
  const lines: string[] = [];
  
  // Header comment
  lines.push(`/**`);
  lines.push(` * ${workflow.name}`);
  if (workflow.description) {
    lines.push(` * `);
    lines.push(` * ${workflow.description}`);
  }
  lines.push(` * `);
  lines.push(` * Generated from editor.json - DO NOT EDIT DIRECTLY`);
  lines.push(` * Last generated: ${new Date().toISOString()}`);
  lines.push(` */`);
  lines.push(``);
  
  // Imports
  lines.push(`import { createWorkflow, createStep } from "@mastra/core/workflow";`);
  lines.push(`import { z } from "zod";`);
  
  // Add Composio import if we have Composio steps
  const hasComposioSteps = workflow.steps.some(s => s.type === "composio");
  if (hasComposioSteps) {
    lines.push(`import { Composio } from "@composio/core";`);
    lines.push(``);
    lines.push(`// Initialize Composio client`);
    lines.push(`const composio = new Composio();`);
  }
  
  lines.push(``);
  
  // Generate input schema
  if (workflow.inputs.length > 0) {
    lines.push(`// Input schema for workflow trigger`);
    lines.push(`const workflowInputSchema = z.object({`);
    for (const input of workflow.inputs) {
      const zodType = schemaFieldToZod(input);
      const optional = input.required ? "" : ".optional()";
      lines.push(`  ${input.name}: ${zodType}${optional},`);
    }
    lines.push(`});`);
    lines.push(``);
  }
  
  // Generate step definitions
  lines.push(`// Step definitions`);
  for (const step of workflow.steps) {
    lines.push(generateStepCode(step, workflow));
    lines.push(``);
  }
  
  // Generate workflow composition
  lines.push(`// Workflow definition`);
  lines.push(`export const ${sanitizeIdentifier(workflow.name)}Workflow = createWorkflow({`);
  lines.push(`  id: "${workflow.id}",`);
  lines.push(`  name: "${workflow.name}",`);
  if (workflow.description) {
    lines.push(`  description: "${escapeString(workflow.description)}",`);
  }
  if (workflow.inputs.length > 0) {
    lines.push(`  inputSchema: workflowInputSchema,`);
  }
  lines.push(`})`);
  
  // Chain steps with .then() and .map()
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepVarName = `${sanitizeIdentifier(step.label)}Step`;
    
    if (i === 0) {
      lines.push(`  .then(${stepVarName})`);
    } else {
      // Check if we need a map for data transformation
      const stepMappings = step.inputMappings.filter(
        (m): m is typeof m & { source: { type: "step"; stepId: string; fieldName: string } } => 
          m.source.type === "step"
      );
      if (stepMappings.length > 0) {
        lines.push(`  .map(({ results }) => ({`);
        for (const mapping of stepMappings) {
          const sourceStep = workflow.steps.find(s => s.id === mapping.source.stepId);
          if (sourceStep) {
            const sourceVarName = sanitizeIdentifier(sourceStep.label);
            lines.push(`    ${mapping.inputName}: results.${sourceVarName}Step?.${mapping.source.fieldName},`);
          }
        }
        lines.push(`  }))`);
      }
      lines.push(`  .then(${stepVarName})`);
    }
  }
  
  lines.push(`  .commit();`);
  lines.push(``);
  
  // Export type helpers
  lines.push(`// Type exports for external use`);
  if (workflow.inputs.length > 0) {
    lines.push(`export type WorkflowInput = z.infer<typeof workflowInputSchema>;`);
  }
  lines.push(``);
  
  // Default export
  lines.push(`export default ${sanitizeIdentifier(workflow.name)}Workflow;`);
  
  return lines.join("\n");
}

/**
 * Generate code for a single step.
 */
function generateStepCode(step: WorkflowStep, workflow: WorkflowDefinition): string {
  const lines: string[] = [];
  const stepVarName = `${sanitizeIdentifier(step.label)}Step`;
  
  // Input schema for the step
  lines.push(`const ${stepVarName}InputSchema = z.object({`);
  for (const field of step.inputSchema.fields) {
    const zodType = schemaFieldToZod(field);
    const optional = field.required ? "" : ".optional()";
    lines.push(`  ${field.name}: ${zodType}${optional},`);
  }
  lines.push(`});`);
  lines.push(``);
  
  // Output schema
  lines.push(`const ${stepVarName}OutputSchema = z.object({`);
  for (const field of step.outputSchema.fields) {
    const zodType = schemaFieldToZod(field);
    lines.push(`  ${field.name}: ${zodType},`);
  }
  lines.push(`});`);
  lines.push(``);
  
  // Step definition
  lines.push(`const ${stepVarName} = createStep({`);
  lines.push(`  id: "${step.id}",`);
  lines.push(`  name: "${step.label}",`);
  lines.push(`  inputSchema: ${stepVarName}InputSchema,`);
  lines.push(`  outputSchema: ${stepVarName}OutputSchema,`);
  lines.push(`  execute: async ({ inputData, mapiClient }) => {`);
  
  if (step.type === "composio" && step.toolId) {
    // Composio tool execution
    lines.push(`    // Execute Composio tool: ${step.toolId}`);
    lines.push(`    const result = await composio.tools.execute({`);
    lines.push(`      action: "${step.toolId}",`);
    lines.push(`      params: inputData,`);
    lines.push(`    });`);
    lines.push(``);
    lines.push(`    return result;`);
  } else if (step.type === "code" && step.code) {
    // Custom code execution
    lines.push(`    // Custom code step`);
    const codeLines = step.code.split("\n");
    for (const codeLine of codeLines) {
      lines.push(`    ${codeLine}`);
    }
  } else {
    // Placeholder for unknown step type
    lines.push(`    // TODO: Implement step logic`);
    lines.push(`    return inputData;`);
  }
  
  lines.push(`  },`);
  lines.push(`});`);
  
  return lines.join("\n");
}

/**
 * Convert a SchemaField type to Zod type.
 */
function schemaFieldToZod(field: SchemaField | { name: string; type: string }): string {
  switch (field.type) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      const itemType = (field as SchemaField).itemType || "string";
      return `z.array(${schemaFieldToZod({ name: "", type: itemType })})`;
    case "object":
      return "z.record(z.unknown())";
    default:
      return "z.unknown()";
  }
}

/**
 * Sanitize a string to be a valid JavaScript identifier.
 */
function sanitizeIdentifier(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[0-9]/, "_$&")
    .toLowerCase()
    .replace(/^./, c => c.toLowerCase());
}

/**
 * Escape a string for use in JavaScript string literal.
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Generate code for getting a value from an InputSource.
 */
export function generateInputSourceCode(source: InputSource, workflow: WorkflowDefinition): string {
  switch (source.type) {
    case "step":
      const sourceStep = workflow.steps.find(s => s.id === source.stepId);
      if (sourceStep) {
        const sourceVarName = sanitizeIdentifier(sourceStep.label);
        return `results.${sourceVarName}Step?.${source.fieldName}`;
      }
      return "undefined";
    case "runtime":
      return `triggerData.${source.inputName}`;
    case "config":
      return `config.${source.configName}`;
    case "static":
      return JSON.stringify(source.value);
    default:
      return "undefined";
  }
}


