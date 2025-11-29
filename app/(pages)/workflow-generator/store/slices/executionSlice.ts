import { type StateCreator } from "zustand";

import {
  installDependency as installDependencyService,
  runWorkflow as runWorkflowService,
} from "../../services/workflowExecutionService";
import type { WorkflowGeneratorStore } from "../types";

// 1. State Interface
export interface ExecutionSliceState {
  /** The full, raw output from the WebContainer shell process. */
  output: string;
  /** The name of the npm package to be installed. */
  packageName: string;
  /** A flag to indicate if a dependency is currently being installed. */
  isInstalling: boolean;
  /** A flag to indicate if a workflow is currently running. */
  isRunning: boolean;
}

// 2. Actions Interface
export interface ExecutionSliceActions {
  /** Sets the name of the package to be installed. */
  setPackageName: (pkg: string) => void;
  /** Clears the shell output. */
  resetOutput: () => void;
  /** Appends a new chunk of data to the shell output. */
  appendOutput: (chunk: string) => void;
  /** Triggers the installation of the specified npm package. */
  installDependency: () => Promise<void>;
  /** Triggers the execution of the current workflow in the WebContainer. */
  runWorkflow: () => Promise<void>;
}

// 3. Combined Slice Type
export type ExecutionSlice = ExecutionSliceState & ExecutionSliceActions;

// 4. Initial State
const initialState: ExecutionSliceState = {
  output: "",
  packageName: "cowsay",
  isInstalling: false,
  isRunning: false,
};

// 5. Slice Creator
export const createExecutionSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  ExecutionSlice
> = (set, get) => ({
  ...initialState,

  setPackageName: (pkg: string) =>
    set(() => ({
      packageName: pkg,
    })),

  resetOutput: () =>
    set(() => ({
      output: "",
    })),

  appendOutput: (chunk: string) =>
    set((state) => ({
      output: state.output + chunk,
    })),

  installDependency: async () => {
    const { packageName, appendOutput } = get();
    if (!packageName) return;

    set(() => ({ isInstalling: true, output: `Installing ${packageName}...\n` }));

    try {
      await installDependencyService(packageName, appendOutput);
      appendOutput("\n✅ Installation complete.\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown install failure.";
      appendOutput(`\n❌ Installation failed: ${message}\n`);
    } finally {
      set(() => ({ isInstalling: false }));
    }
  },

  runWorkflow: async () => {
    const { nodes, edges, markNodesRunning, resetOutput, appendOutput } = get();

    resetOutput();
    set(() => ({ isRunning: true }));

    try {
      await runWorkflowService(
        { nodes, edges },
        appendOutput,
        {
          onChainStart: (chain) => markNodesRunning(chain.map((node) => node.id), true),
          onChainComplete: (chain) => markNodesRunning(chain.map((node) => node.id), false),
        }
      );
      appendOutput("\n✅ Workflow completed successfully.\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown execution failure.";
      appendOutput(`\n❌ Execution failed: ${message}\n`);
    } finally {
      set(() => ({ isRunning: false }));
      markNodesRunning(nodes.map((node) => node.id), false);
    }
  },
});

