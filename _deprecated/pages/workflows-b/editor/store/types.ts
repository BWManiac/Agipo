/**
 * Workflows B Store Types
 * 
 * Type definitions for the Zustand store that manages the workflow editor state.
 * The store is composed of multiple slices, each handling a specific domain.
 */

import type { 
  WorkflowDefinition, 
  WorkflowStep, 
  RuntimeInput,
  WorkflowConfig,
  InputSource,
  EditorState,
} from "@/_tables/workflows-b/types";

// =============================================================================
// WORKFLOW SLICE
// =============================================================================

/**
 * State for the workflow data slice.
 * Contains the workflow definition being edited.
 */
export interface WorkflowSliceState {
  /** The workflow being edited */
  workflow: WorkflowDefinition | null;
  /** Whether the workflow has unsaved changes */
  isDirty: boolean;
  /** Whether the workflow is currently being saved */
  isSaving: boolean;
  /** Last save error, if any */
  saveError: string | null;
}

/**
 * Actions for the workflow data slice.
 */
export interface WorkflowSliceActions {
  /** Load a workflow from the API response */
  setWorkflow: (workflow: WorkflowDefinition) => void;
  
  /** Update basic workflow metadata */
  updateWorkflowMeta: (updates: Partial<Pick<WorkflowDefinition, 'name' | 'description' | 'status'>>) => void;
  
  /** Add a new step to the workflow */
  addStep: (step: Omit<WorkflowStep, 'position'>, afterStepId?: string) => void;
  
  /** Remove a step from the workflow */
  removeStep: (stepId: string) => void;
  
  /** Update a step's properties */
  updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  
  /** Update a step's input mapping */
  updateStepMapping: (stepId: string, inputName: string, source: InputSource | null) => void;
  
  /** Reorder steps by providing the new order of step IDs */
  reorderSteps: (stepIds: string[]) => void;
  
  /** Add a runtime input */
  addInput: (input: RuntimeInput) => void;
  
  /** Update a runtime input */
  updateInput: (name: string, updates: Partial<RuntimeInput>) => void;
  
  /** Remove a runtime input */
  removeInput: (name: string) => void;
  
  /** Add a workflow config */
  addConfig: (config: WorkflowConfig) => void;
  
  /** Update a workflow config */
  updateConfig: (name: string, updates: Partial<WorkflowConfig>) => void;
  
  /** Remove a workflow config */
  removeConfig: (name: string) => void;
  
  /** Mark the workflow as dirty (has unsaved changes) */
  markDirty: () => void;
  
  /** Mark the workflow as saved */
  markSaved: () => void;
  
  /** Set save error */
  setSaveError: (error: string | null) => void;
  
  /** Set saving state */
  setIsSaving: (isSaving: boolean) => void;
  
  /** Reset the workflow state */
  resetWorkflow: () => void;
}

/**
 * Combined workflow slice type.
 */
export type WorkflowSlice = WorkflowSliceState & WorkflowSliceActions;

// =============================================================================
// UI SLICE
// =============================================================================

/**
 * Right panel tab options.
 */
export type RightPanelTab = 'tools' | 'inputs' | 'config' | 'connect' | 'test';

/**
 * State for the UI slice.
 * Contains transient UI state that doesn't need to be persisted.
 */
export interface UISliceState {
  /** Currently selected step ID */
  selectedStepId: string | null;
  /** Set of expanded step IDs in the timeline */
  expandedStepIds: Set<string>;
  /** Currently active tab in the right panel */
  rightPanelTab: RightPanelTab;
  /** Whether the add step modal is open */
  isAddStepModalOpen: boolean;
  /** Whether the mapping modal is open */
  isMappingModalOpen: boolean;
  /** Step ID for which the mapping modal is open */
  mappingModalStepId: string | null;
  /** Whether the left panel (chat) is collapsed */
  isLeftPanelCollapsed: boolean;
}

/**
 * Actions for the UI slice.
 */
export interface UISliceActions {
  /** Select a step */
  setSelectedStep: (stepId: string | null) => void;
  
  /** Toggle a step's expansion state */
  toggleStepExpanded: (stepId: string) => void;
  
  /** Expand a step */
  expandStep: (stepId: string) => void;
  
  /** Collapse a step */
  collapseStep: (stepId: string) => void;
  
  /** Collapse all steps */
  collapseAllSteps: () => void;
  
  /** Set the active right panel tab */
  setRightPanelTab: (tab: RightPanelTab) => void;
  
  /** Open the add step modal */
  openAddStepModal: () => void;
  
  /** Close the add step modal */
  closeAddStepModal: () => void;
  
  /** Open the mapping modal for a step */
  openMappingModal: (stepId: string) => void;
  
  /** Close the mapping modal */
  closeMappingModal: () => void;
  
  /** Toggle the left panel collapsed state */
  toggleLeftPanel: () => void;
  
  /** Reset UI state */
  resetUI: () => void;
}

/**
 * Combined UI slice type.
 */
export type UISlice = UISliceState & UISliceActions;

// =============================================================================
// EXECUTION SLICE
// =============================================================================

/**
 * Status of workflow execution.
 */
export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Status of a single step during execution.
 */
export type StepExecutionState = {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  output?: unknown;
  error?: string;
};

/**
 * State for the execution slice.
 */
export interface ExecutionSliceState {
  /** Overall execution status */
  executionStatus: ExecutionStatus;
  /** Current run ID */
  runId: string | null;
  /** Status of each step during execution */
  stepStatuses: Record<string, StepExecutionState>;
  /** Currently executing step ID */
  currentStepId: string | null;
  /** Final workflow output */
  workflowOutput: unknown;
  /** Final workflow error */
  workflowError: string | null;
  /** Total execution duration in ms */
  totalDuration: number | null;
  /** Test inputs for execution */
  testInputs: Record<string, unknown>;
}

/**
 * Actions for the execution slice.
 */
export interface ExecutionSliceActions {
  /** Start workflow execution */
  startExecution: (runId: string) => void;
  
  /** Update a step's execution status */
  updateStepStatus: (stepId: string, status: StepExecutionState) => void;
  
  /** Mark execution as completed */
  completeExecution: (output: unknown, duration: number) => void;
  
  /** Mark execution as failed */
  failExecution: (error: string) => void;
  
  /** Cancel execution */
  cancelExecution: () => void;
  
  /** Reset execution state */
  resetExecution: () => void;
  
  /** Set test inputs */
  setTestInputs: (inputs: Record<string, unknown>) => void;
  
  /** Update a single test input */
  updateTestInput: (name: string, value: unknown) => void;
}

/**
 * Combined execution slice type.
 */
export type ExecutionSlice = ExecutionSliceState & ExecutionSliceActions;

// =============================================================================
// COMBINED STORE
// =============================================================================

/**
 * The complete Workflows B store type.
 * Combines all slices into a single interface.
 */
export type WorkflowsBStore = WorkflowSlice & UISlice & ExecutionSlice;

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Convert EditorState to store state.
 */
export function editorStateToStore(editorState: EditorState): {
  workflow: WorkflowDefinition;
  selectedStepId: string | undefined;
  expandedStepIds: string[];
} {
  return {
    workflow: editorState.workflow,
    selectedStepId: editorState.selectedStepId,
    expandedStepIds: editorState.expandedStepIds,
  };
}

/**
 * Convert store state to EditorState for saving.
 */
export function storeToEditorState(
  workflow: WorkflowDefinition,
  selectedStepId: string | null,
  expandedStepIds: Set<string>
): EditorState {
  return {
    workflow,
    selectedStepId: selectedStepId ?? undefined,
    expandedStepIds: Array.from(expandedStepIds),
    version: 1,
  };
}




