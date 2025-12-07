import { z } from "zod";
import { JSONSchemaValidator } from "./schemas";
import { BranchConfigValidator, ParallelConfigValidator, LoopConfigValidator } from "./execution-flow";
import { QueryTableConfigValidator, WriteTableConfigValidator } from "./table-requirements";

/**
 * Workflow step types representing individual operations in a workflow.
 * Enables users to add steps (Composio tools, custom code, control flow, table operations) to their workflows.
 * Powers the step timeline/list view and canvas view where users build workflows.
 * Each step has input/output schemas for data mapping and validation.
 */
export const WorkflowStepValidator = z.object({
  // Identity
  id: z.string(),
  type: z.enum(["composio", "custom", "control", "query_table", "write_table"]),
  
  // Position (for both views)
  position: z.object({ x: z.number(), y: z.number() }), // Canvas coordinates
  listIndex: z.number(), // List view order
  
  // Composio Tool (when type === "composio")
  toolId: z.string().optional(), // e.g., "FIRECRAWL_SCRAPE"
  toolkitSlug: z.string().optional(), // e.g., "firecrawl"
  toolkitName: z.string().optional(), // e.g., "Firecrawl"
  toolkitLogo: z.string().optional(), // URL
  
  // Custom Code (when type === "custom")
  code: z.string().optional(), // JavaScript/TypeScript
  
  // Control Flow (when type === "control")
  controlType: z.enum(["branch", "parallel", "loop", "foreach", "wait", "suspend"]).optional(),
  controlConfig: z.union([
    BranchConfigValidator,
    ParallelConfigValidator,
    LoopConfigValidator,
    z.any(),
  ]).optional(),
  
  // Table Operations (when type === "query_table" or "write_table")
  tableRef: z.string().optional(), // Reference to table config: "output_table"
  tableConfig: z.union([
    QueryTableConfigValidator,
    WriteTableConfigValidator,
    z.any(),
  ]).optional(),
  
  // Schemas (cached from Composio or user-defined)
  inputSchema: JSONSchemaValidator,
  outputSchema: JSONSchemaValidator,
  
  // UI State
  name: z.string(), // Display name
  description: z.string().optional(), // Optional description
  collapsed: z.boolean().optional(), // UI state for list view

  // Parent-Child Relationships (for containers like Loop, ForEach, Branch lanes)
  parentId: z.string().nullable().optional(), // ID of parent container step
  childStepIds: z.array(z.string()).optional(), // For containers: ordered child step IDs

  // Branch-specific: which condition lane does this step belong to?
  branchConditionIndex: z.number().optional(), // 0, 1, 2... for which branch condition

  // Parallel-specific: which parallel lane?
  parallelLaneIndex: z.number().optional(), // 0, 1, 2... for which parallel lane
});

export type WorkflowStep = z.infer<typeof WorkflowStepValidator>;


