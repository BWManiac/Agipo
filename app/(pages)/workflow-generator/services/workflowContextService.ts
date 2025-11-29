/**
 * Workflow context serializer
 *
 * The agent only receives the chat transcript, so we need to embed the
 * current canvas state (nodes, edges, positions, contracts) into the
 * prompt before sending requests.  Centralising the serializer keeps the
 * logic consistent between components/tests and lets us tweak the shape
 * later without touching the UI.
 */

import type { WorkflowGeneratorStore } from "../store/types";

type SerializableNode = {
  id: string;
  title: string;
  position: { x: number; y: number };
  flowSummary: string;
  codePreview: string;
  spec: {
    inputs: { name: string; type: string }[];
    outputs: { name: string; type: string }[];
  };
};

type SerializableEdge = {
  id: string;
  source: string;
  target: string;
};

// Keep code snippets short so prompts stay within context limits.
const CODE_PREVIEW_LIMIT = 280;

const trimCode = (code: string) => {
  if (code.length <= CODE_PREVIEW_LIMIT) {
    return code;
  }
  return `${code.slice(0, CODE_PREVIEW_LIMIT)} …`;
};

const serializeNode = (node: WorkflowGeneratorStore["nodes"][number]): SerializableNode => ({
  id: node.id,
  title: node.data.title,
  position: {
    // Round to two decimals to avoid meaningless float noise in the prompt.
    x: Math.round(node.position.x * 100) / 100,
    y: Math.round(node.position.y * 100) / 100,
  },
  flowSummary: node.data.flow.summary,
  codePreview: trimCode(node.data.code),
  spec: {
    inputs: node.data.spec.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })),
    outputs: node.data.spec.outputs.map((output) => ({
      name: output.name,
      type: output.type,
    })),
  },
});

const serializeEdge = (edge: WorkflowGeneratorStore["edges"][number]): SerializableEdge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
});

export const serializeWorkflowContext = (state: WorkflowGeneratorStore): string => {
  const context = {
    nodes: state.nodes.map(serializeNode),
    edges: state.edges.map(serializeEdge),
  };

  return JSON.stringify(context, null, 2);
};


