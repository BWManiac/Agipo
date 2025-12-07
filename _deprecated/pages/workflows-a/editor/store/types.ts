/**
 * Types for the Workflow Editor Zustand store.
 * This file contains shared types used across multiple slices.
 */

import type { 
  WorkflowDefinition, 
  WorkflowStep, 
  DataMapping,
  RuntimeInputConfig,
  WorkflowConfig,
  TableRequirement
} from "@/app/api/workflows/services/types";

// ============================================================================
// UI State Types
// ============================================================================

export type ViewMode = "list" | "canvas";

export type ActivePanel = 
  | "palette" 
  | "inputs" 
  | "config" 
  | "connections" 
  | "test" 
  | "tables";

export type ExecutionStatus = "idle" | "running" | "success" | "error";

export interface StepExecutionResult {
  stepId: string;
  status: ExecutionStatus;
  output?: unknown;
  error?: string;
  duration?: number;
}

// ============================================================================
// Slice Types
// ============================================================================

export interface WorkflowSlice {
  // State
  workflow: WorkflowDefinition | null;
  workflowId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadWorkflow: (workflow: WorkflowDefinition) => void;
  setWorkflowId: (id: string | null) => void;
  updateWorkflowMetadata: (updates: Partial<Pick<WorkflowDefinition, 'name' | 'description'>>) => void;
  markDirty: () => void;
  markClean: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetWorkflow: () => void;
}

export interface StepsSlice {
  // State
  steps: WorkflowStep[];
  
  // Actions
  setSteps: (steps: WorkflowStep[]) => void;
  addStep: (step: WorkflowStep) => void;
  updateStep: (id: string, updates: Partial<WorkflowStep>) => void;
  removeStep: (id: string) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;
  getStepById: (id: string) => WorkflowStep | undefined;
}

export interface MappingsSlice {
  // State
  mappings: DataMapping[];
  
  // Actions
  setMappings: (mappings: DataMapping[]) => void;
  addMapping: (mapping: DataMapping) => void;
  updateMapping: (id: string, updates: Partial<DataMapping>) => void;
  removeMapping: (id: string) => void;
  getMappingsForStep: (stepId: string) => DataMapping[];
}

export interface UISlice {
  // State
  selectedStepId: string | null;
  activePanel: ActivePanel;
  viewMode: ViewMode;
  isSidebarCollapsed: boolean;
  isInspectorCollapsed: boolean;
  
  // Actions
  setSelectedStep: (id: string | null) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
}

export interface InputsSlice {
  // State
  runtimeInputs: RuntimeInputConfig[];
  configs: WorkflowConfig[];
  
  // Actions
  setRuntimeInputs: (inputs: RuntimeInputConfig[]) => void;
  addRuntimeInput: (input: RuntimeInputConfig) => void;
  updateRuntimeInput: (key: string, updates: Partial<RuntimeInputConfig>) => void;
  removeRuntimeInput: (key: string) => void;
  
  setConfigs: (configs: WorkflowConfig[]) => void;
  addConfig: (config: WorkflowConfig) => void;
  updateConfig: (key: string, updates: Partial<WorkflowConfig>) => void;
  removeConfig: (key: string) => void;
}

export interface ConnectionsSlice {
  // State
  connections: Record<string, string | null>;
  
  // Actions
  setConnections: (connections: Record<string, string | null>) => void;
  setConnection: (toolkitSlug: string, connectionId: string | null) => void;
  getRequiredToolkits: () => string[];
}

export interface TablesSlice {
  // State
  tableRequirements: TableRequirement[];
  tables: Record<string, { tableId: string; columnMapping: Record<string, string> } | null>;
  
  // Actions
  setTableRequirements: (requirements: TableRequirement[]) => void;
  addTableRequirement: (requirement: TableRequirement) => void;
  updateTableRequirement: (key: string, updates: Partial<TableRequirement>) => void;
  removeTableRequirement: (key: string) => void;
  setTableBinding: (key: string, binding: { tableId: string; columnMapping: Record<string, string> } | null) => void;
}

export interface TestingSlice {
  // State
  executionStatus: ExecutionStatus;
  stepResults: StepExecutionResult[];
  testInputValues: Record<string, unknown>;
  
  // Actions
  setExecutionStatus: (status: ExecutionStatus) => void;
  setStepResult: (result: StepExecutionResult) => void;
  clearResults: () => void;
  setTestInputValue: (key: string, value: unknown) => void;
  resetTestInputs: () => void;
}

// ============================================================================
// Combined Store Type
// ============================================================================

export type WorkflowEditorStore = 
  & WorkflowSlice 
  & StepsSlice 
  & MappingsSlice 
  & UISlice 
  & InputsSlice 
  & ConnectionsSlice
  & TablesSlice
  & TestingSlice;




