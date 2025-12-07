import { z } from "zod";

// ============================================================================
// JSON Schema (subset we support)
// ============================================================================

export interface JSONSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "integer";
  properties?: {
    [key: string]: JSONSchema & {
      description?: string;
    };
  };
  items?: JSONSchema;
  required?: string[];
  format?: string;
  enum?: unknown[];
}

// ============================================================================
// Table Requirements
// ============================================================================

export interface ColumnRequirement {
  key: string;                       // How workflow references it: "job_title"
  suggestedName: string;             // Suggested column name: "Job Title"
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
}

export interface TableRequirement {
  key: string;                       // Internal reference: "output_table"
  purpose: "read" | "write" | "readwrite";
  description: string;               // "Table to store scraped job listings"
  requiredColumns: ColumnRequirement[];
  optionalColumns?: ColumnRequirement[];
  canAutoCreate: boolean;            // Show "Create new table" option
  autoCreateName?: string;           // Suggested name for new table
}

export interface TableBinding {
  tableId: string;                   // ID of the bound table
  columnMapping: {
    [workflowColumn: string]: string; // workflow column → table column
  };
}

// ============================================================================
// Control Flow
// ============================================================================

export interface BranchConfig {
  conditionExpression: string;       // JS expression: "inputData.priority === 'high'"
  stepId: string;                    // Step to execute if condition is true
}

export interface ParallelConfig {
  stepIds: string[];                 // Steps to run in parallel
  mergeStrategy?: "all" | "first";   // How to combine results
}

export interface LoopConfig {
  type: "while" | "until" | "foreach";
  conditionExpression?: string;      // For while/until
  iterableField?: string;            // For foreach
  concurrency?: number;              // For foreach
}

export interface ControlFlowConfig {
  type: "sequential" | "parallel" | "branched" | "mixed";
  order?: string[];                  // Step IDs in execution order
  parallelGroups?: string[][];       // Groups of step IDs that run in parallel
  branches?: BranchConfig[];
}

// ============================================================================
// Query/Write Table Configs
// ============================================================================

export interface QueryTableConfig {
  filter?: {
    column: string;
    operator: "eq" | "neq" | "gt" | "lt" | "contains";
    value: string | number | boolean;
  };
  sort?: {
    column: string;
    descending?: boolean;
  };
  limit?: number;
}

export interface WriteTableConfig {
  mode: "insert" | "upsert";
  upsertKey?: string;
}

// ============================================================================
// Workflow Steps
// ============================================================================

export type WorkflowStepType = "composio" | "custom" | "control" | "query_table" | "write_table";

export interface WorkflowStep {
  // Identity
  id: string;
  type: WorkflowStepType;
  
  // Position (for both views)
  position: { x: number; y: number }; // Canvas coordinates
  listIndex: number;                  // List view order
  
  // Composio Tool (when type === "composio")
  toolId?: string;                   // e.g., "FIRECRAWL_SCRAPE"
  toolkitSlug?: string;              // e.g., "firecrawl"
  toolkitName?: string;              // e.g., "Firecrawl"
  toolkitLogo?: string;              // URL
  
  // Custom Code (when type === "custom")
  code?: string;                     // JavaScript/TypeScript
  
  // Control Flow (when type === "control")
  controlType?: "branch" | "parallel" | "loop" | "wait";
  controlConfig?: BranchConfig | ParallelConfig | LoopConfig;
  
  // Table Operations (when type === "query_table" or "write_table")
  tableRef?: string;                 // Reference to table config: "output_table"
  tableConfig?: QueryTableConfig | WriteTableConfig;
  
  // Schemas (cached from Composio or user-defined)
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  
  // UI State
  name: string;                      // Display name
  description?: string;              // Optional description
  collapsed?: boolean;               // UI state for list view
}

// ============================================================================
// Data Mappings
// ============================================================================

export interface FieldMapping {
  sourcePath: string;                // e.g., "data.title" or "result.user.email"
  targetField: string;               // e.g., "jobTitle"
  sourceType?: string;               // e.g., "string", "number"
  targetType?: string;               // e.g., "string", "number"
  typeMatch?: "exact" | "coercible" | "incompatible";
}

export interface DataMapping {
  id: string;
  sourceStepId: string;              // Step providing data, or "__input__"
  targetStepId: string;              // Step receiving data, or "__output__"
  fieldMappings: FieldMapping[];
}

// ============================================================================
// Runtime Configuration
// ============================================================================

export interface RuntimeInputConfig {
  key: string;                       // e.g., "jobUrl"
  type: "string" | "number" | "boolean" | "array" | "object";
  label: string;                     // Display label
  description?: string;
  required: boolean;
  default?: unknown;
  validation?: {
    format?: "email" | "url" | "date";
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface WorkflowConfig {
  key: string;                       // e.g., "resumeTemplate"
  type: "text" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
  options?: string[];                // For select type
}

// ============================================================================
// Complete Workflow Definition
// ============================================================================

export interface WorkflowDefinition {
  // Identity
  id: string;
  name: string;
  description: string;
  
  // Schemas (JSON Schema format)
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  
  // Steps
  steps: WorkflowStep[];
  
  // Data Mappings
  mappings: DataMapping[];
  
  // Control Flow
  controlFlow: ControlFlowConfig;
  
  // Connection Requirements
  connections: {
    [toolkitSlug: string]: string | null;
  };
  
  // Table Requirements
  tableRequirements: TableRequirement[];
  tables: {
    [tableKey: string]: TableBinding | null;
  };
  
  // Runtime Configuration
  runtimeInputs: RuntimeInputConfig[];
  configs: WorkflowConfig[];
  
  // Metadata
  createdAt: string;
  lastModified: string;
  createdBy: string;
  published: boolean;
}

// ============================================================================
// Summary type for list views
// ============================================================================

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  stepCount: number;
  published: boolean;
}

// ============================================================================
// Zod Validators
// ============================================================================

export const JSONSchemaValidator = z.object({
  type: z.enum(["object", "array", "string", "number", "boolean", "integer"]),
  properties: z.record(z.string(), z.any()).optional(),
  items: z.any().optional(),
  required: z.array(z.string()).optional(),
  format: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
});

export const WorkflowStepValidator = z.object({
  id: z.string(),
  type: z.enum(["composio", "custom", "control", "query_table", "write_table"]),
  position: z.object({ x: z.number(), y: z.number() }),
  listIndex: z.number(),
  toolId: z.string().optional(),
  toolkitSlug: z.string().optional(),
  toolkitName: z.string().optional(),
  toolkitLogo: z.string().optional(),
  code: z.string().optional(),
  controlType: z.enum(["branch", "parallel", "loop", "wait"]).optional(),
  controlConfig: z.any().optional(),
  tableRef: z.string().optional(),
  tableConfig: z.any().optional(),
  inputSchema: JSONSchemaValidator,
  outputSchema: JSONSchemaValidator,
  name: z.string(),
  description: z.string().optional(),
  collapsed: z.boolean().optional(),
});

export const DataMappingValidator = z.object({
  id: z.string(),
  sourceStepId: z.string(),
  targetStepId: z.string(),
  fieldMappings: z.array(z.object({
    sourcePath: z.string(),
    targetField: z.string(),
    sourceType: z.string().optional(),
    targetType: z.string().optional(),
    typeMatch: z.enum(["exact", "coercible", "incompatible"]).optional(),
  })),
});

export const WorkflowDefinitionValidator = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  inputSchema: JSONSchemaValidator,
  outputSchema: JSONSchemaValidator,
  steps: z.array(WorkflowStepValidator),
  mappings: z.array(DataMappingValidator),
  controlFlow: z.object({
    type: z.enum(["sequential", "parallel", "branched", "mixed"]),
    order: z.array(z.string()).optional(),
    parallelGroups: z.array(z.array(z.string())).optional(),
    branches: z.array(z.any()).optional(),
  }),
  connections: z.record(z.string(), z.string().nullable()),
  tableRequirements: z.array(z.any()),
  tables: z.record(z.string(), z.any().nullable()),
  runtimeInputs: z.array(z.any()),
  configs: z.array(z.any()),
  createdAt: z.string(),
  lastModified: z.string(),
  createdBy: z.string(),
  published: z.boolean(),
});

// ============================================================================
// Factory functions
// ============================================================================

export function createEmptyWorkflow(id: string, name: string): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: "",
    inputSchema: { type: "object", properties: {}, required: [] },
    outputSchema: { type: "object", properties: {}, required: [] },
    steps: [],
    mappings: [],
    controlFlow: { type: "sequential", order: [] },
    connections: {},
    tableRequirements: [],
    tables: {},
    runtimeInputs: [],
    configs: [],
    createdAt: now,
    lastModified: now,
    createdBy: "user",
    published: false,
  };
}




