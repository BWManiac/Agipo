import { nanoid } from "nanoid";
import type { WorkflowStep, JSONSchema } from "@/app/api/workflows-d/services/types";
import type { ComposioTool } from "../hooks/useComposioTools";

/**
 * Create a new workflow step from a Composio tool
 */
export function createStepFromTool(
  tool: ComposioTool,
  toolkitSlug: string,
  toolkitName: string,
  toolkitLogo: string | undefined,
  listIndex: number
): WorkflowStep {
  return {
    id: `step-${nanoid(8)}`,
    type: "composio",
    position: { x: 100 + listIndex * 250, y: 100 },
    listIndex,
    toolId: tool.id,
    toolkitSlug,
    toolkitName,
    toolkitLogo,
    inputSchema: tool.inputSchema as JSONSchema,
    outputSchema: tool.outputSchema as JSONSchema,
    name: tool.name,
    description: tool.description,
    collapsed: false,
  };
}

/**
 * Create a new custom code step
 */
export function createCustomCodeStep(listIndex: number): WorkflowStep {
  return {
    id: `step-${nanoid(8)}`,
    type: "custom",
    position: { x: 100 + listIndex * 250, y: 100 },
    listIndex,
    code: `// Custom step logic
async function execute(input: { [key: string]: unknown }) {
  // Your code here
  return { result: input };
}`,
    inputSchema: { type: "object", properties: {}, required: [] },
    outputSchema: { type: "object", properties: {}, required: [] },
    name: "Custom Code",
    description: "Execute custom JavaScript/TypeScript code",
    collapsed: false,
  };
}

/**
 * Create a query table step
 */
export function createQueryTableStep(listIndex: number): WorkflowStep {
  return {
    id: `step-${nanoid(8)}`,
    type: "query_table",
    position: { x: 100 + listIndex * 250, y: 100 },
    listIndex,
    tableRef: "",
    tableConfig: {
      filter: undefined,
      sort: undefined,
      limit: 100,
    },
    inputSchema: { type: "object", properties: {}, required: [] },
    outputSchema: { 
      type: "object", 
      properties: {
        rows: { type: "array" },
        count: { type: "number" },
      },
      required: ["rows", "count"],
    },
    name: "Query Table",
    description: "Read data from a table",
    collapsed: false,
  };
}

/**
 * Create a write table step
 */
export function createWriteTableStep(listIndex: number): WorkflowStep {
  return {
    id: `step-${nanoid(8)}`,
    type: "write_table",
    position: { x: 100 + listIndex * 250, y: 100 },
    listIndex,
    tableRef: "",
    tableConfig: {
      mode: "insert",
    },
    inputSchema: { 
      type: "object", 
      properties: {
        data: { type: "object" },
      },
      required: ["data"],
    },
    outputSchema: { 
      type: "object", 
      properties: {
        success: { type: "boolean" },
        rowId: { type: "string" },
      },
      required: ["success"],
    },
    name: "Write Table",
    description: "Write data to a table",
    collapsed: false,
  };
}




