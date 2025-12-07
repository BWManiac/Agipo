/**
 * Workflow Slice
 * 
 * Manages the workflow definition state: steps, inputs, configs, and connections.
 * This is the core data slice that represents what gets saved to editor.json.
 */

import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import type { 
  WorkflowsBStore, 
  WorkflowSlice, 
  WorkflowSliceState 
} from "../types";
import type { 
  WorkflowStep, 
  RuntimeInput, 
  WorkflowConfig,
  InputSource,
  ConnectionRequirement,
} from "@/_tables/workflows-b/types";

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: WorkflowSliceState = {
  workflow: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Derive connection requirements from steps.
 * Scans all steps to find unique platforms being used.
 */
function deriveConnections(steps: WorkflowStep[]): ConnectionRequirement[] {
  const platformMap = new Map<string, ConnectionRequirement>();
  
  for (const step of steps) {
    if (step.type === "composio" && step.platform && step.toolId) {
      const existing = platformMap.get(step.platform);
      if (existing) {
        if (!existing.toolIds.includes(step.toolId)) {
          existing.toolIds.push(step.toolId);
        }
      } else {
        platformMap.set(step.platform, {
          platform: step.platform,
          displayName: step.platform.charAt(0).toUpperCase() + step.platform.slice(1),
          toolIds: [step.toolId],
          required: true,
        });
      }
    }
  }
  
  return Array.from(platformMap.values());
}

/**
 * Update step positions based on array order.
 */
function updatePositions(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, index) => ({
    ...step,
    position: index,
  }));
}

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createWorkflowSlice: StateCreator<
  WorkflowsBStore,
  [],
  [],
  WorkflowSlice
> = (set, get) => ({
  ...initialState,

  setWorkflow: (workflow) => {
    set({
      workflow,
      isDirty: false,
      saveError: null,
    });
  },

  updateWorkflowMeta: (updates) => {
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: {
          ...state.workflow,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  addStep: (step, afterStepId) => {
    set((state) => {
      if (!state.workflow) return state;
      
      const newStep: WorkflowStep = {
        ...step,
        id: step.id || nanoid(8),
        position: 0, // Will be recalculated
      };
      
      let newSteps: WorkflowStep[];
      
      if (afterStepId) {
        // Insert after the specified step
        const index = state.workflow.steps.findIndex(s => s.id === afterStepId);
        if (index >= 0) {
          newSteps = [
            ...state.workflow.steps.slice(0, index + 1),
            newStep,
            ...state.workflow.steps.slice(index + 1),
          ];
        } else {
          newSteps = [...state.workflow.steps, newStep];
        }
      } else {
        // Add to the end
        newSteps = [...state.workflow.steps, newStep];
      }
      
      // Update positions and derive connections
      newSteps = updatePositions(newSteps);
      const connections = deriveConnections(newSteps);
      
      return {
        workflow: {
          ...state.workflow,
          steps: newSteps,
          connections,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  removeStep: (stepId) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Remove the step
      let newSteps = state.workflow.steps.filter(s => s.id !== stepId);
      
      // Remove any mappings that reference this step
      newSteps = newSteps.map(step => ({
        ...step,
        inputMappings: step.inputMappings.filter(
          m => m.source.type !== "step" || m.source.stepId !== stepId
        ),
      }));
      
      // Update positions and derive connections
      newSteps = updatePositions(newSteps);
      const connections = deriveConnections(newSteps);
      
      return {
        workflow: {
          ...state.workflow,
          steps: newSteps,
          connections,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  updateStep: (stepId, updates) => {
    set((state) => {
      if (!state.workflow) return state;
      
      let newSteps = state.workflow.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      );
      
      // If platform changed, update connections
      const connections = deriveConnections(newSteps);
      
      return {
        workflow: {
          ...state.workflow,
          steps: newSteps,
          connections,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  updateStepMapping: (stepId, inputName, source) => {
    set((state) => {
      if (!state.workflow) return state;
      
      const newSteps = state.workflow.steps.map(step => {
        if (step.id !== stepId) return step;
        
        // Remove existing mapping for this input
        const filteredMappings = step.inputMappings.filter(
          m => m.inputName !== inputName
        );
        
        // Add new mapping if source is provided
        const newMappings = source
          ? [...filteredMappings, { inputName, source }]
          : filteredMappings;
        
        return {
          ...step,
          inputMappings: newMappings,
        };
      });
      
      return {
        workflow: {
          ...state.workflow,
          steps: newSteps,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  reorderSteps: (stepIds) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Create a map for quick lookup
      const stepMap = new Map(state.workflow.steps.map(s => [s.id, s]));
      
      // Reorder based on the provided order
      const newSteps = stepIds
        .map(id => stepMap.get(id))
        .filter((s): s is WorkflowStep => s !== undefined);
      
      // Update positions
      const updatedSteps = updatePositions(newSteps);
      
      return {
        workflow: {
          ...state.workflow,
          steps: updatedSteps,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  addInput: (input) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Check if input with same name already exists
      if (state.workflow.inputs.some(i => i.name === input.name)) {
        return state;
      }
      
      return {
        workflow: {
          ...state.workflow,
          inputs: [...state.workflow.inputs, input],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  updateInput: (name, updates) => {
    set((state) => {
      if (!state.workflow) return state;
      
      const newInputs = state.workflow.inputs.map(input =>
        input.name === name ? { ...input, ...updates } : input
      );
      
      return {
        workflow: {
          ...state.workflow,
          inputs: newInputs,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  removeInput: (name) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Remove the input
      const newInputs = state.workflow.inputs.filter(i => i.name !== name);
      
      // Remove any mappings that reference this input
      const newSteps = state.workflow.steps.map(step => ({
        ...step,
        inputMappings: step.inputMappings.filter(
          m => m.source.type !== "runtime" || m.source.inputName !== name
        ),
      }));
      
      return {
        workflow: {
          ...state.workflow,
          inputs: newInputs,
          steps: newSteps,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  addConfig: (config) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Check if config with same name already exists
      if (state.workflow.configs.some(c => c.name === config.name)) {
        return state;
      }
      
      return {
        workflow: {
          ...state.workflow,
          configs: [...state.workflow.configs, config],
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  updateConfig: (name, updates) => {
    set((state) => {
      if (!state.workflow) return state;
      
      const newConfigs = state.workflow.configs.map(config =>
        config.name === name ? { ...config, ...updates } : config
      );
      
      return {
        workflow: {
          ...state.workflow,
          configs: newConfigs,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  removeConfig: (name) => {
    set((state) => {
      if (!state.workflow) return state;
      
      // Remove the config
      const newConfigs = state.workflow.configs.filter(c => c.name !== name);
      
      // Remove any mappings that reference this config
      const newSteps = state.workflow.steps.map(step => ({
        ...step,
        inputMappings: step.inputMappings.filter(
          m => m.source.type !== "config" || m.source.configName !== name
        ),
      }));
      
      return {
        workflow: {
          ...state.workflow,
          configs: newConfigs,
          steps: newSteps,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  markSaved: () => {
    set({ isDirty: false, saveError: null });
  },

  setSaveError: (error) => {
    set({ saveError: error });
  },

  setIsSaving: (isSaving) => {
    set({ isSaving });
  },

  resetWorkflow: () => {
    set(initialState);
  },
});




