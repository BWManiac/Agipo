import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import type { StateCreator } from "zustand";

import {
  type WorkflowGeneratorStore,
  type WorkflowNode,
} from "../types";

// 1. State Interface
export interface CanvasSliceState {
  /** The array of nodes for the React Flow canvas. */
  nodes: WorkflowNode[];
  /** The array of edges for the React Flow canvas. */
  edges: Edge[];
}

// 2. Actions Interface
export interface CanvasSliceActions {
  /** Handles changes to nodes (e.g., position, selection) from React Flow. */
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  /** Handles changes to edges (e.g., selection) from React Flow. */
  onEdgesChange: (changes: EdgeChange[]) => void;
  /** Handles the creation of a new connection between nodes. */
  onConnect: (connection: Connection) => void;
  /** Adds a new, blank node to the canvas. */
  addNode: () => void;
  /** Updates the code for a specific node. */
  updateNodeCode: (nodeId: string, code: string) => void;
  /** Updates the flow summary for a specific node. */
  updateNodeFlowSummary: (nodeId: string, summary: string) => void;
  /** Marks a set of nodes as running or not. */
  markNodesRunning: (nodeIds: string[], isRunning: boolean) => void;
  /** Updates the title for a specific node. */
  updateNodeTitle: (nodeId: string, title: string) => void;
  /** Replaces the entire canvas state with a new set of nodes and edges. */
  loadNodesAndEdges: (nodes: WorkflowNode[], edges: Edge[]) => void;
  /** Resets the canvas to its initial default state. */
  resetCanvas: () => void;
}

// 3. Combined Slice Type
export type CanvasSlice = CanvasSliceState & CanvasSliceActions;

// Helper to generate a unique ID for new nodes.
const generateNodeId = () => Math.random().toString(36).slice(2, 6);

// 4. Initial State
const initialNodes: WorkflowNode[] = [
  {
    id: "1",
    type: "code",
    position: { x: -100, y: 200 },
    data: {
      id: "1",
      title: "Collect Input",
      code: `// This node simply outputs a string to be used by the next node.\nprocess.stdout.write("Data flows like a river!");`,
      isRunning: false,
      flow: {
        summary: "Listen for the source message, tidy it up, and pass it downstream.",
      },
      spec: {
        inputs: [{ name: "message", type: "text", description: "Plain text captured from the requester." }],
        process: ["Trim whitespace and normalize spacing.", "Remove unsupported characters.", "Emit a clean string for the next node."],
        outputs: [{ name: "cleanMessage", type: "text", description: "Sanitized text ready for formatting." }],
      },
    },
  },
  {
    id: "2",
    type: "code",
    position: { x: 200, y: 200 },
    data: {
      id: "2",
      title: "Format Message",
      code: `const cowsay = require('cowsay');\nconst readline = require('readline');\n\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on('line', (line) => {\n  console.log(cowsay.say({\n    text: line,\n    e: 'oO',\n    T: 'U '\n  }));\n});`,
      isRunning: false,
      flow: {
        summary: "Apply the cowsay persona to the cleaned message and render ASCII art.",
      },
      spec: {
        inputs: [{ name: "cleanMessage", type: "text", description: "Sanitized text from the upstream node." }],
        process: ["Load cowsay template and tone modifiers.", "Wrap lines to keep width manageable.", "Render final ASCII output."],
        outputs: [{ name: "asciiArt", type: "text", description: "Cowsay-formatted string for display." }],
      },
    },
  },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }] as const;
const cloneInitialNodes = (): WorkflowNode[] => JSON.parse(JSON.stringify(initialNodes));
const cloneInitialEdges = () => initialEdges.map((edge) => ({ ...edge }));

const initialState: CanvasSliceState = {
  nodes: cloneInitialNodes(),
  edges: cloneInitialEdges(),
};

// 5. Slice Creator
export const createCanvasSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  CanvasSlice
> = (set) => ({
  ...initialState,

  onNodesChange: (changes: NodeChange<WorkflowNode>[]) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes: EdgeChange[]) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection: Connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
    })),

  addNode: () =>
    set((state) => {
      const id = generateNodeId();
      const newNode: WorkflowNode = {
        id,
        type: "code",
        position: { x: state.nodes.length * 220 - 100, y: (state.nodes.length % 3) * 120 },
        data: {
          id,
          title: `Node ${id}`,
          code: "// New node — write your transformation here.",
          isRunning: false,
          flow: { summary: "Describe this step to help teammates understand the transformation." },
          spec: { inputs: [], process: ["Document the transformation logic here."], outputs: [] },
        },
      };
      return { nodes: state.nodes.concat(newNode) };
    }),

  updateNodeCode: (nodeId: string, code: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, code } } : node
      ),
    })),

  updateNodeFlowSummary: (nodeId: string, summary: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, flow: { ...node.data.flow, summary } } }
          : node
      ),
    })),

  markNodesRunning: (nodeIds: string[], isRunning: boolean) =>
    set((state) => {
      const idSet = new Set(nodeIds);
      return {
        nodes: state.nodes.map((node) =>
          idSet.has(node.id)
            ? { ...node, data: { ...node.data, isRunning } }
            : node
        ),
      };
    }),

  updateNodeTitle: (nodeId: string, title: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, title: title || node.data.title } }
          : node
      ),
    })),

  loadNodesAndEdges: (nodes, edges) => {
    set({
      nodes: nodes || [],
      edges: edges || [],
    });
  },

  resetCanvas: () => {
    set(initialState);
  },
});
