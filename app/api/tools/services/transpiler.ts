/**
 * Workflow Transpiler
 * 
 * Converts workflow data (nodes, edges) into a TypeScript tool file that can be
 * used by AI agents. The transpiler generates Zod schemas, typed execution functions,
 * and a ToolDefinition export that matches the _tables/types.ts interface.
 */

import type { WorkflowData } from "@/_tables/types";
import type { Node } from "@xyflow/react";

/**
 * Maps business-friendly field types to Zod schema builders
 */
function fieldTypeToZod(
  fieldType: string,
  itemType?: string
): { zodCode: string; description?: string } {
  switch (fieldType) {
    case "text":
      return { zodCode: "z.string()" };
    case "number":
      return { zodCode: "z.number()" };
    case "flag":
      return { zodCode: "z.boolean()" };
    case "list":
      if (!itemType) {
        return { zodCode: "z.array(z.unknown())" };
      }
      const itemZod = fieldTypeToZod(itemType).zodCode;
      return { zodCode: `z.array(${itemZod})` };
    case "record":
      return { zodCode: "z.record(z.string(), z.unknown())" };
    case "file":
      // For now, treat file as record/object
      return { zodCode: "z.record(z.string(), z.unknown())" };
    default:
      return { zodCode: "z.unknown()" };
  }
}

/**
 * Generates a Zod schema object from node inputs/outputs
 */
function generateSchema(
  fields: Array<{
    name: string;
    type: string;
    itemType?: string;
    description?: string;
    optional?: boolean;
  }>,
  schemaName: string
): string {
  if (fields.length === 0) {
    return `const ${schemaName} = z.object({});`;
  }

  const properties = fields
    .map((field) => {
      const { zodCode } = fieldTypeToZod(field.type, field.itemType);
      const optional = field.optional ? ".optional()" : "";
      const description = field.description
        ? `.describe("${field.description.replace(/"/g, '\\"')}")`
        : "";
      return `  ${field.name}: ${zodCode}${optional}${description}`;
    })
    .join(",\n");

  return `const ${schemaName} = z.object({\n${properties}\n});`;
}

/**
 * Finds entry nodes (nodes with no incoming edges)
 */
// function findEntryNodes(nodes: Node[], edges: Edge[]): Node[] {
//   const hasIncomingEdge = new Set(edges.map((e) => e.target));
//   return nodes.filter((node) => !hasIncomingEdge.has(node.id));
// }

/**
 * Performs a topological sort to determine execution order
 */
// function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
//   const nodeMap = new Map(nodes.map((n) => [n.id, n]));
//   const incoming = new Map<string, Set<string>>();
//   const outgoing = new Map<string, Set<string>>();
//
//   nodes.forEach((node) => {
//     incoming.set(node.id, new Set());
//     outgoing.set(node.id, new Set());
//   });
//
//   edges.forEach((edge) => {
//     incoming.get(edge.target)?.add(edge.source);
//     outgoing.get(edge.source)?.add(edge.target);
//   });
//
//   const queue: Node[] = [];
//   const result: Node[] = [];
//
//   nodes.forEach((node) => {
//     if (incoming.get(node.id)?.size === 0) {
//       queue.push(node);
//     }
//   });
//
//   while (queue.length > 0) {
//     const node = queue.shift()!;
//     result.push(node);
//
//     outgoing.get(node.id)?.forEach((targetId) => {
//       const targetIncoming = incoming.get(targetId);
//       targetIncoming?.delete(node.id);
//       if (targetIncoming?.size === 0) {
//         const targetNode = nodeMap.get(targetId);
//         if (targetNode) {
//           queue.push(targetNode);
//         }
//       }
//     });
//   }
//
//   return result;
// }

/**
 * Transpiles a workflow into a TypeScript tool file
 */
export async function transpileWorkflowToTool(
  workflow: WorkflowData
): Promise<string> {
  const { id, name, description, nodes } = workflow;

  if (!nodes || nodes.length === 0) {
    throw new Error("Workflow must have at least one node to transpile");
  }

  // Get node data with specs
  const workflowNodes = nodes.filter((n) => n.type === "code") as Array<
    Node & {
      data: {
        id: string;
        title: string;
        code: string;
        spec?: {
          inputs?: Array<{
            name: string;
            type: string;
            itemType?: string;
            description?: string;
          }>;
          outputs?: Array<{
            name: string;
            type: string;
            itemType?: string;
            description?: string;
          }>;
        };
      };
    }
  >;

  if (workflowNodes.length === 0) {
    throw new Error("Workflow must have at least one code node");
  }

  // For MVP: handle single-node workflows first
  // Multi-node will be handled in a later iteration
  const firstNode = workflowNodes[0];
  const nodeData = firstNode.data;

  // Extract inputs/outputs from node spec, or create defaults
  const inputs =
    nodeData.spec?.inputs || [
      {
        name: "input",
        type: "text",
        description: "Input data for the workflow",
      },
    ];

  const outputs =
    nodeData.spec?.outputs || [
      {
        name: "output",
        type: "text",
        description: "Output from the workflow",
      },
    ];

  // Generate schema names
  const inputSchemaName = `${toPascalCase(id)}_InputSchema`;
  const outputSchemaName = `${toPascalCase(id)}_OutputSchema`;
  const nodeFunctionName = `${toCamelCase(id)}Node`;

  // Generate tool ID following convention: workflow-{id}
  const toolId = `workflow-${id}`;

  // Build the TypeScript file
  const lines: string[] = [];

  // Header comment
  lines.push("/**");
  lines.push(` * Generated tool file for workflow: ${name}`);
  lines.push(` * Auto-generated from workflow: ${id}`);
  lines.push(` * Do not edit manually - this file will be regenerated on workflow save.`);
  lines.push(" */");
  lines.push("");

  // Imports
  lines.push('import { z } from "zod";');
  lines.push('import { tool } from "ai";');
  lines.push('import type { ToolDefinition } from "@/_tables/types";');
  lines.push("");

  // Input schema
  lines.push("// ============================================================================");
  lines.push("// SCHEMA GENERATION");
  lines.push("// ============================================================================");
  lines.push("");
  lines.push(generateSchema(inputs, inputSchemaName));
  lines.push("");
  lines.push(generateSchema(outputs, outputSchemaName));
  lines.push("");

  // Type inference
  lines.push(`type ${toPascalCase(id)}_Input = z.infer<typeof ${inputSchemaName}>;`);
  lines.push(
    `type ${toPascalCase(id)}_Output = z.infer<typeof ${outputSchemaName}>;`
  );
  lines.push("");

  // Node function wrapper
  lines.push("// ============================================================================");
  lines.push("// USER CODE WRAPPER");
  lines.push("// ============================================================================");
  lines.push("");
  lines.push(`async function ${nodeFunctionName}(`);
  lines.push(`  input: ${toPascalCase(id)}_Input`);
  lines.push(`): Promise<${toPascalCase(id)}_Output> {`);
  lines.push(`  const validatedInput = ${inputSchemaName}.parse(input);`);
  lines.push("  ");
  lines.push("  // Extract typed inputs");
  const inputVars = inputs.map((i) => i.name).join(", ");
  lines.push(`  const { ${inputVars} } = validatedInput;`);
  lines.push("  ");
  lines.push("  // ========================================================================");
  lines.push("  // USER'S CODE (from node.data.code) - injected here");
  lines.push("  // ========================================================================");
  lines.push("  // User code should return an object matching the output schema");
  lines.push("  ");

  // Inject user code with proper indentation
  const userCode = nodeData.code || "return {};";
  const indentedCode = userCode
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
  lines.push(indentedCode);
  lines.push("  ");
  lines.push("  // ========================================================================");
  lines.push("  // END USER CODE");
  lines.push("  // ========================================================================");
  lines.push("  ");
  lines.push("  // Validate output against schema");
  lines.push("  // Note: User code should return the expected output shape");
  lines.push("  // User code execution result (may be undefined if code doesn't return)");
  lines.push("  // eslint-disable-next-line @typescript-eslint/no-explicit-any");
  lines.push("  const userResult: any = typeof result !== 'undefined' ? result : {};");
  lines.push(`  const output: ${toPascalCase(id)}_Output = {`);
  
  // Map outputs with defaults based on type
  outputs.forEach((output) => {
    const defaultValue =
      output.type === "text"
        ? '""'
        : output.type === "number"
        ? "0"
        : output.type === "flag"
        ? "false"
        : output.type === "list"
        ? "[]"
        : "{}";
    lines.push(
      `    ${output.name}: userResult?.${output.name} ?? ${defaultValue},`
    );
  });
  lines.push("  };");
  lines.push("  ");
  lines.push(`  return ${outputSchemaName}.parse(output);`);
  lines.push("}");
  lines.push("");

  // Tool instance
  lines.push("// ============================================================================");
  lines.push("// AGENT TOOL EXPORT (Vercel AI SDK Compatible)");
  lines.push("// ============================================================================");
  lines.push("");
  const toolDescription =
    description ||
    `${name} workflow tool. Executes the workflow logic defined in the workflow editor.`;
  lines.push(`export const ${toCamelCase(toolId)}Tool = tool({`);
  lines.push(`  description: ${JSON.stringify(toolDescription)},`);
  lines.push(`  inputSchema: ${inputSchemaName},`);
  lines.push(`  execute: async (input: ${toPascalCase(id)}_Input): Promise<Record<string, unknown>> => {`);
  lines.push(`    const result = await ${nodeFunctionName}(input);`);
  lines.push("    return result as Record<string, unknown>;");
  lines.push("  },");
  lines.push("});");
  lines.push("");

  // ToolDefinition export
  lines.push("// ============================================================================");
  lines.push("// TOOL DEFINITION FOR REGISTRY");
  lines.push("// ============================================================================");
  lines.push("");
  lines.push(`export const ${toCamelCase(toolId)}ToolDefinition: ToolDefinition = {`);
  lines.push(`  id: ${JSON.stringify(toolId)},`);
  lines.push(`  name: ${JSON.stringify(name)},`);
  lines.push(`  description: ${JSON.stringify(toolDescription)},`);
  lines.push(`  runtime: "internal" as const,`);
  lines.push(`  // eslint-disable-next-line @typescript-eslint/no-explicit-any`);
  lines.push(`  run: ${toCamelCase(toolId)}Tool as any,`);
  lines.push("};");
  lines.push("");

  return lines.join("\n");
}

/**
 * Helper: Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
    .replace(/^[0-9]/, (match) => `N${match}`); // Ensure doesn't start with number
}

/**
 * Helper: Convert string to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

