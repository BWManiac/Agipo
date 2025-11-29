/**
 * Tool Intents
 *
 * Each server tool returns a `ToolResult` that contains an intent describing
 * what should happen to the workflow. Keeping these TypeScript types in one
 * place means:
 * - Tools, agent route, and client dispatcher all agree on the payload shape.
 * - Adding a new capability is as simple as defining the intent and wiring it
 *   into `applyToolResult`.
 * - We avoid circular imports between tools by centralising shared contracts.
 */
import type { ContractField } from "../store/types";

export type UpdateNodeLayerIntent = {
  type: "updateNodeLayer";
  nodeId: string;
  changes: {
    title?: string;
    code?: string;
    flowSummary?: string;
    spec?: {
      inputs?: ContractField[];
      outputs?: ContractField[];
      process?: string[];
    };
  };
  rationale?: string;
};

export type AddNodeIntent = {
  type: "addNode";
  node: {
    title?: string;
    code?: string;
    flowSummary?: string;
    spec?: {
      inputs?: ContractField[];
      outputs?: ContractField[];
      process?: string[];
    };
    position?: { x: number; y: number };
  };
  connections?: {
    from?: string | null;
    to?: string | null;
  };
  rationale?: string;
};

export type DeleteNodeIntent = {
  type: "deleteNode";
  nodeId: string;
  rationale?: string;
};

export type ConnectNodesIntent = {
  type: "connectNodes";
  sourceId: string;
  targetId: string;
  rationale?: string;
};

export type RepositionNodesIntent = {
  type: "repositionNodes";
  positions?: Array<{
    nodeId: string;
    position: { x: number; y: number };
  }>;
  layout?:
    | "horizontal"
    | "vertical"
    | "grid";
  rationale?: string;
  summary?: string;
};

export type ToolIntent =
  | UpdateNodeLayerIntent
  | AddNodeIntent
  | DeleteNodeIntent
  | ConnectNodesIntent
  | RepositionNodesIntent;

export type ToolResult = {
  intent: ToolIntent;
  summary?: string;
};


