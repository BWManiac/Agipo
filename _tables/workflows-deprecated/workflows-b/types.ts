/**
 * Workflows B Domain Types
 * 
 * These types define the core data structures for the Workflows B editor.
 * The workflow editor allows users to compose Composio tools and custom code
 * into multi-step automated workflows that Mastra can execute server-side.
 */

// =============================================================================
// STEP TYPES
// =============================================================================

/**
 * The type of step in a workflow.
 * - composio: A tool from a connected integration (Gmail, Slack, GitHub, etc.)
 * - code: Custom JavaScript/TypeScript code
 */
export type StepType = "composio" | "code";

/**
 * Schema field definition for step inputs/outputs.
 * Maps to Zod types for runtime validation.
 */
export type SchemaField = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  required?: boolean;
  itemType?: "string" | "number" | "boolean" | "object"; // For arrays
};

/**
 * Input/Output schema for a workflow step.
 */
export type StepSchema = {
  fields: SchemaField[];
};

/**
 * Defines where a step input gets its value from.
 * - step: Output from a previous step
 * - runtime: Runtime input provided when workflow executes
 * - config: Configuration value set at deployment time
 * - static: Hardcoded value
 */
export type InputSource = 
  | { type: "step"; stepId: string; fieldName: string }
  | { type: "runtime"; inputName: string }
  | { type: "config"; configName: string }
  | { type: "static"; value: string };

/**
 * Maps a step input to its data source.
 */
export type StepInputMapping = {
  inputName: string;
  source: InputSource;
};

/**
 * A single step in the workflow.
 * Each step represents either a Composio tool or custom code.
 */
export type WorkflowStep = {
  id: string;
  type: StepType;
  label: string;
  
  // For Composio tools
  toolId?: string;           // e.g., "FIRECRAWL_SCRAPE"
  platform?: string;         // e.g., "firecrawl", "gmail", "openai"
  
  // For custom code
  code?: string;
  
  // Schema information (derived from Composio or user-defined)
  inputSchema: StepSchema;
  outputSchema: StepSchema;
  
  // Data mappings - how inputs are populated
  inputMappings: StepInputMapping[];
  
  // Visual position in timeline (order index)
  position: number;
  
  // Step-specific configuration (e.g., API model selection)
  config?: Record<string, unknown>;
};

// =============================================================================
// RUNTIME INPUTS & CONFIGS
// =============================================================================

/**
 * Runtime input - provided by the agent when the workflow executes.
 * Example: "url" for a job scraping workflow
 */
export type RuntimeInput = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  defaultValue?: unknown;
};

/**
 * Workflow configuration - set once when workflow is deployed/hired.
 * Example: "outputFormat" with options ["pdf", "docx", "markdown"]
 */
export type WorkflowConfig = {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  description?: string;
  options?: string[];        // For enum type
  defaultValue?: unknown;
};

// =============================================================================
// CONNECTIONS
// =============================================================================

/**
 * Required integration for the workflow.
 * Derived from the tools used in steps.
 */
export type ConnectionRequirement = {
  platform: string;          // e.g., "gmail", "firecrawl"
  displayName: string;       // e.g., "Gmail", "Firecrawl"
  toolIds: string[];         // Which tools from this platform are used
  required: boolean;
};

// =============================================================================
// WORKFLOW DEFINITION
// =============================================================================

/**
 * Status of a workflow in the editor.
 */
export type WorkflowStatus = "draft" | "ready" | "published";

/**
 * The complete workflow definition.
 * This is the core data structure that represents a user's workflow.
 */
export type WorkflowDefinition = {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  
  // The steps that make up the workflow
  steps: WorkflowStep[];
  
  // Runtime inputs required to execute the workflow
  inputs: RuntimeInput[];
  
  // Configuration options for deployment
  configs: WorkflowConfig[];
  
  // Required connections (derived from steps)
  connections: ConnectionRequirement[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
};

// =============================================================================
// EDITOR STATE
// =============================================================================

/**
 * The complete editor state saved to editor.json.
 * Contains the workflow definition plus UI state.
 */
export type EditorState = {
  workflow: WorkflowDefinition;
  
  // UI state (persisted for user convenience)
  selectedStepId?: string;
  expandedStepIds: string[];
  
  // Version for future migrations
  version: number;
};

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Platform icon mappings for visual display.
 */
export const PLATFORM_ICONS: Record<string, string> = {
  firecrawl: "🔥",
  openai: "🤖",
  gmail: "📧",
  github: "🐙",
  slack: "💬",
  browser: "🌐",
  code: "💻",
};

/**
 * Platform gradient colors for step cards.
 */
export const PLATFORM_GRADIENTS: Record<string, string> = {
  firecrawl: "from-orange-400 to-red-500",
  openai: "from-emerald-400 to-teal-500",
  gmail: "from-red-400 to-pink-500",
  github: "from-gray-600 to-gray-800",
  slack: "from-purple-400 to-indigo-500",
  browser: "from-blue-400 to-cyan-500",
  code: "from-violet-400 to-purple-500",
};

/**
 * Create an empty workflow definition.
 */
export function createEmptyWorkflow(id: string, name: string): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: "",
    status: "draft",
    steps: [],
    inputs: [],
    configs: [],
    connections: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create an empty editor state.
 */
export function createEmptyEditorState(id: string, name: string): EditorState {
  return {
    workflow: createEmptyWorkflow(id, name),
    expandedStepIds: [],
    version: 1,
  };
}
