import type { StateCreator } from "zustand";

import {
  type ContractField,
  type WorkflowGeneratorStore,
} from "../types";

// 1. State Interface
// This slice is purely action-based and doesn't have its own state properties.
export type NodeSpecSliceState = Record<string, never>;

// 2. Actions Interface
export interface NodeSpecSliceActions {
  /** Adds a new, blank input field to a node's specification. */
  addNodeSpecInput: (nodeId: string) => void;
  /** Updates an existing input field in a node's specification. */
  updateNodeSpecInput: (nodeId: string, index: number, patch: Partial<ContractField>) => void;
  /** Removes an input field from a node's specification by its index. */
  removeNodeSpecInput: (nodeId: string, index: number) => void;
  /** Adds a new, blank output field to a node's specification. */
  addNodeSpecOutput: (nodeId: string) => void;
  /** Updates an existing output field in a node's specification. */
  updateNodeSpecOutput: (nodeId: string, index: number, patch: Partial<ContractField>) => void;
  /** Removes an output field from a node's specification by its index. */
  removeNodeSpecOutput: (nodeId: string, index: number) => void;
  /** Adds a new, blank process step to a node's specification. */
  addNodeProcessStep: (nodeId: string) => void;
  /** Updates an existing process step in a node's specification. */
  updateNodeProcessStep: (nodeId: string, index: number, value: string) => void;
  /** Removes a process step from a node's specification by its index. */
  removeNodeProcessStep: (nodeId: string, index: number) => void;
}

// 3. Combined Slice Type
export type NodeSpecSlice = NodeSpecSliceState & NodeSpecSliceActions;

// 4. Initial State
const initialState: NodeSpecSliceState = {};

// 5. Slice Creator
export const createNodeSpecSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  NodeSpecSlice
> = (set) => ({
  ...initialState,

  addNodeSpecInput: (nodeId: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                spec: {
                  ...node.data.spec,
                  inputs: node.data.spec.inputs.concat({
                    name: "",
                    type: "text",
                    description: "",
                    optional: false,
                  }),
                },
              },
            }
          : node
      ),
    })),
  updateNodeSpecInput: (nodeId: string, index: number, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const inputs = node.data.spec.inputs.map((input, idx) =>
          idx === index ? { ...input, ...patch } : input
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              inputs,
            },
          },
        };
      }),
    })),
  removeNodeSpecInput: (nodeId: string, index: number) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const inputs = node.data.spec.inputs.filter(
          (_, idx) => idx !== index
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              inputs,
            },
          },
        };
      }),
    })),
  addNodeSpecOutput: (nodeId: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                spec: {
                  ...node.data.spec,
                  outputs: node.data.spec.outputs.concat({
                    name: "",
                    type: "text",
                    description: "",
                    optional: false,
                  }),
                },
              },
            }
          : node
      ),
    })),
  updateNodeSpecOutput: (nodeId: string, index: number, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const outputs = node.data.spec.outputs.map((output, idx) =>
          idx === index ? { ...output, ...patch } : output
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              outputs,
            },
          },
        };
      }),
    })),
  removeNodeSpecOutput: (nodeId: string, index: number) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const outputs = node.data.spec.outputs.filter(
          (_, idx) => idx !== index
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              outputs,
            },
          },
        };
      }),
    })),
  addNodeProcessStep: (nodeId: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                spec: {
                  ...node.data.spec,
                  process: node.data.spec.process.concat(""),
                },
              },
            }
          : node
      ),
    })),
  updateNodeProcessStep: (
    nodeId: string,
    index: number,
    value: string
  ) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const process = node.data.spec.process.map((step, idx) =>
          idx === index ? value : step
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              process,
            },
          },
        };
      }),
    })),
  removeNodeProcessStep: (nodeId: string, index: number) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const process = node.data.spec.process.filter(
          (_, idx) => idx !== index
        );
        return {
          ...node,
          data: {
            ...node.data,
            spec: {
              ...node.data.spec,
              process,
            },
          },
        };
      }),
    })),
});
