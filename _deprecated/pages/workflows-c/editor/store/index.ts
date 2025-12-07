import { create } from "zustand";
import { WorkflowEditorState } from "./types";
import {
  WorkflowDefinition,
  WorkflowStep,
  DataMapping,
  RuntimeInputConfig,
  WorkflowConfig,
} from "@/app/api/workflows/services/types";

const initialState = {
  workflow: null,
  steps: [],
  selectedStepId: null,
  mappings: [],
  runtimeInputs: [],
  configs: [],
  connections: {},
  tableRequirements: [],
  tables: {},
  isDirty: false,
  activeTab: "palette" as const,
  isCodePreviewOpen: false,
  isCommandPaletteOpen: false,
};

export const useWorkflowEditorStore = create<WorkflowEditorState>((set, get) => ({
  ...initialState,

  setWorkflow: (workflow: WorkflowDefinition) => {
    set({
      workflow,
      steps: workflow.steps,
      mappings: workflow.mappings,
      runtimeInputs: workflow.runtimeInputs,
      configs: workflow.configs,
      connections: workflow.connections,
      tableRequirements: workflow.tableRequirements,
      tables: workflow.tables,
      isDirty: false,
    });
  },

  updateWorkflowMeta: (updates) => {
    const { workflow } = get();
    if (!workflow) return;
    set({
      workflow: { ...workflow, ...updates },
      isDirty: true,
    });
  },

  addStep: (step: WorkflowStep) => {
    const { steps, connections } = get();
    const newStep = { ...step, listIndex: steps.length };

    const newConnections = { ...connections };
    if (step.type === "composio" && step.toolkitSlug && !(step.toolkitSlug in connections)) {
      newConnections[step.toolkitSlug] = null;
    }

    set({
      steps: [...steps, newStep],
      selectedStepId: newStep.id,
      connections: newConnections,
      isDirty: true,
    });
  },

  updateStep: (id: string, updates: Partial<WorkflowStep>) => {
    set({
      steps: get().steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      isDirty: true,
    });
  },

  removeStep: (id: string) => {
    const { steps, mappings, selectedStepId } = get();
    const newSteps = steps.filter((s) => s.id !== id);
    newSteps.forEach((s, i) => {
      s.listIndex = i;
    });

    set({
      steps: newSteps,
      mappings: mappings.filter((m) => m.sourceStepId !== id && m.targetStepId !== id),
      selectedStepId: selectedStepId === id ? null : selectedStepId,
      isDirty: true,
    });
  },

  reorderSteps: (stepIds: string[]) => {
    const { steps } = get();
    const newSteps = stepIds
      .map((id, index) => {
        const step = steps.find((s) => s.id === id);
        return step ? { ...step, listIndex: index } : null;
      })
      .filter(Boolean) as WorkflowStep[];

    set({ steps: newSteps, isDirty: true });
  },

  selectStep: (id: string | null) => set({ selectedStepId: id }),

  addMapping: (mapping: DataMapping) => {
    set({ mappings: [...get().mappings, mapping], isDirty: true });
  },

  updateMapping: (id: string, updates: Partial<DataMapping>) => {
    set({
      mappings: get().mappings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      isDirty: true,
    });
  },

  removeMapping: (id: string) => {
    set({ mappings: get().mappings.filter((m) => m.id !== id), isDirty: true });
  },

  addRuntimeInput: (input: RuntimeInputConfig) => {
    set({ runtimeInputs: [...get().runtimeInputs, input], isDirty: true });
  },

  updateRuntimeInput: (key: string, updates: Partial<RuntimeInputConfig>) => {
    set({
      runtimeInputs: get().runtimeInputs.map((i) => (i.key === key ? { ...i, ...updates } : i)),
      isDirty: true,
    });
  },

  removeRuntimeInput: (key: string) => {
    set({ runtimeInputs: get().runtimeInputs.filter((i) => i.key !== key), isDirty: true });
  },

  addConfig: (config: WorkflowConfig) => {
    set({ configs: [...get().configs, config], isDirty: true });
  },

  updateConfig: (key: string, updates: Partial<WorkflowConfig>) => {
    set({
      configs: get().configs.map((c) => (c.key === key ? { ...c, ...updates } : c)),
      isDirty: true,
    });
  },

  removeConfig: (key: string) => {
    set({ configs: get().configs.filter((c) => c.key !== key), isDirty: true });
  },

  setConnection: (toolkit: string, connectionId: string | null) => {
    set({ connections: { ...get().connections, [toolkit]: connectionId }, isDirty: true });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleCodePreview: () => set({ isCodePreviewOpen: !get().isCodePreviewOpen }),
  toggleCommandPalette: () => set({ isCommandPaletteOpen: !get().isCommandPaletteOpen }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  reset: () => set(initialState),
}));



