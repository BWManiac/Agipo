import {
  WorkflowDefinition,
  WorkflowStep,
  DataMapping,
  RuntimeInputConfig,
  WorkflowConfig,
  TableRequirement,
  TableBinding,
} from "@/app/api/workflows/services/types";

export interface WorkflowEditorState {
  // Workflow identity
  workflow: WorkflowDefinition | null;
  
  // Steps
  steps: WorkflowStep[];
  selectedStepId: string | null;
  
  // Data mappings
  mappings: DataMapping[];
  
  // Runtime configuration
  runtimeInputs: RuntimeInputConfig[];
  configs: WorkflowConfig[];
  
  // Connection requirements (auto-detected from steps)
  connections: Record<string, string | null>;
  
  // Table requirements
  tableRequirements: TableRequirement[];
  tables: Record<string, TableBinding | null>;
  
  // UI state
  isDirty: boolean;
  activeTab: "palette" | "inputs" | "config" | "connections" | "test";
  isCodePreviewOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  // Actions
  setWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflowMeta: (updates: Partial<Pick<WorkflowDefinition, "name" | "description">>) => void;
  
  // Step actions
  addStep: (step: WorkflowStep) => void;
  updateStep: (id: string, updates: Partial<WorkflowStep>) => void;
  removeStep: (id: string) => void;
  reorderSteps: (stepIds: string[]) => void;
  selectStep: (id: string | null) => void;
  
  // Mapping actions
  addMapping: (mapping: DataMapping) => void;
  updateMapping: (id: string, updates: Partial<DataMapping>) => void;
  removeMapping: (id: string) => void;
  
  // Runtime input actions
  addRuntimeInput: (input: RuntimeInputConfig) => void;
  updateRuntimeInput: (key: string, updates: Partial<RuntimeInputConfig>) => void;
  removeRuntimeInput: (key: string) => void;
  
  // Config actions
  addConfig: (config: WorkflowConfig) => void;
  updateConfig: (key: string, updates: Partial<WorkflowConfig>) => void;
  removeConfig: (key: string) => void;
  
  // Connection actions
  setConnection: (toolkit: string, connectionId: string | null) => void;
  
  // UI actions
  setActiveTab: (tab: WorkflowEditorState["activeTab"]) => void;
  toggleCodePreview: () => void;
  toggleCommandPalette: () => void;
  
  // Persistence
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
}




