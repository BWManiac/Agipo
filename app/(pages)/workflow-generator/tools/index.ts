/**
 * Tool Registry
 *
 * Consolidates every agent tool so both the API route and validation helpers
 * can work with a single source of truth. New tools only need to be imported
 * and registered here.
 */
import { addNodeTool } from "./addNode.tool";
import { connectNodesTool } from "./connectNodes.tool";
import { deleteNodeTool } from "./deleteNode.tool";
import { updateNodeLayerTool } from "./updateNodeLayer.tool";
import { repositionNodesTool } from "./repositionNodes.tool";
import { inspectNodeTool } from "./inspectNode.tool";

export const workflowTools = {
  update_node_layer: updateNodeLayerTool,
  add_node: addNodeTool,
  delete_node: deleteNodeTool,
  connect_nodes: connectNodesTool,
  reposition_nodes: repositionNodesTool,
  inspect_node: inspectNodeTool,
} as const;

export type WorkflowToolMap = typeof workflowTools;

export * from "./toolIntents";
export * from "./applyToolResult";


