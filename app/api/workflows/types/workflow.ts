import { z } from "zod";
import { JSONSchemaValidator } from "./schemas";
import { WorkflowStepValidator } from "./workflow-step";
import { DataMappingValidator } from "./step-connections";
import { ControlFlowConfigValidator } from "./execution-flow";
import { RuntimeInputConfigValidator, WorkflowConfigValidator } from "./workflow-settings";
import { TableRequirementValidator, TableBindingValidator } from "./table-requirements";
import { StepBindingsValidator } from "./bindings";

/**
 * Complete workflow definition type representing a saved workflow.
 * Enables users to create, edit, and save workflows with all their steps, mappings, and configurations.
 * Powers the workflow editor where users build workflows step-by-step.
 * This is the core data structure stored in workflow.json files.
 */
export const WorkflowDefinitionValidator = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string(),
  
  // Schemas (JSON Schema format)
  inputSchema: JSONSchemaValidator,
  outputSchema: JSONSchemaValidator,
  
  // Steps
  steps: z.array(WorkflowStepValidator),
  
  // Data Mappings
  mappings: z.array(DataMappingValidator),
  
  // Control Flow
  controlFlow: ControlFlowConfigValidator,
  
  // Connection Requirements
  connections: z.record(z.string(), z.string().nullable()),
  
  // Table Requirements
  tableRequirements: z.array(TableRequirementValidator),
  tables: z.record(z.string(), TableBindingValidator.nullable()),
  
  // Runtime Configuration
  runtimeInputs: z.array(RuntimeInputConfigValidator),
  configs: z.array(WorkflowConfigValidator),
  
  // Data Bindings (editor state - how step inputs are bound to sources)
  bindings: z.record(z.string(), StepBindingsValidator).optional(),
  
  // Metadata
  createdAt: z.string(),
  lastModified: z.string(),
  createdBy: z.string(),
  published: z.boolean(),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionValidator>;

/**
 * Workflow summary type for list views.
 * Enables users to see all their workflows in a compact list view.
 * Powers the workflow list page showing name, description, step count, and last modified.
 * Optimized for quick scanning without loading full workflow definitions.
 */
export const WorkflowSummaryValidator = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  lastModified: z.string(),
  stepCount: z.number(),
  published: z.boolean(),
});

export type WorkflowSummary = z.infer<typeof WorkflowSummaryValidator>;

/**
 * Factory function to create an empty workflow.
 * Enables users to start with a clean slate when creating new workflows.
 * Provides sensible defaults for all required fields.
 */
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


