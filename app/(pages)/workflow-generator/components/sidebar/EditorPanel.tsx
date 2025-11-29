"use client";

/**
 * EditorPanel
 * -----------
 * Smart wrapper that decides whether to render the node spec editor or the edge
 * mapping table based on the current selection.  Keeps the sidebar component
 * lean by hiding the branching logic here.
 */
import { NodeEditor } from "../editor/NodeEditor";
import { EdgeEditorTable } from "../editor/data-mapping";
import type { EdgeFieldRef, EdgeMapping } from "../../types/domain";
import type { WorkflowNode } from "../../store/types";
import type { MatchResult } from "../../types/domain";

type EditorPanelProps = {
  node: WorkflowNode | null;
  edgeId: string | null;
  sourceNode: WorkflowNode | null;
  targetNode: WorkflowNode | null;
  mapping?: EdgeMapping;
  onLink: (from: EdgeFieldRef | undefined, to: EdgeFieldRef) => MatchResult;
  onUnlink: (to: EdgeFieldRef) => void;
  onStaticValue: (to: EdgeFieldRef, value: string) => void;
};

export function EditorPanel({
  node,
  edgeId,
  sourceNode,
  targetNode,
  mapping,
  onLink,
  onUnlink,
  onStaticValue,
}: EditorPanelProps) {
  // Priority: edge editor beats node editor when both an edge and node are selected.
  if (edgeId && targetNode) {
    return (
      <div className="h-full overflow-auto p-4">
        <EdgeEditorTable
          edgeId={edgeId}
          sourceNode={sourceNode}
          targetNode={targetNode}
          mapping={mapping}
          onLink={onLink}
          onUnlink={onUnlink}
          onStaticValue={onStaticValue}
        />
      </div>
    );
  }

  if (node) {
    return <NodeEditor node={node} />;
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">
      Select a node or an edge to edit its details.
    </div>
  );
}

