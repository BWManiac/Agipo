"use client";

/**
 * Sidebar
 * -------
 * Shell component that renders the primary workflow tabs (console, state,
 * context, editor).  The editor tab now routes through the new edge mapping
 * stack when an edge is active, otherwise it falls back to the node editor.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Edge } from "@xyflow/react";

import type {
  WorkflowNode,
} from "../store/types";
import type {
  SidebarTab,
  WorkflowLayer,
} from "../store/slices/editorSlice";
import type { EdgeFieldRef, EdgeMapping, MatchResult } from "../types/domain";
import { ConsolePanel } from "./sidebar/ConsolePanel";
import { ContextPanel } from "./sidebar/ContextPanel";
import { EditorPanel } from "./sidebar/EditorPanel";
import { StatePanel } from "./sidebar/StatePanel";

type SidebarProps = {
  nodes: WorkflowNode[];
  edges: Edge[];
  output: string;
  activeLayer: WorkflowLayer;
  contracts: {
    id: string;
    title: string;
    flow: WorkflowNode["data"]["flow"];
    spec: WorkflowNode["data"]["spec"];
  }[];
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  editingNode: WorkflowNode | null;
  activeEdgeId: string | null;
  edgeSourceNode: WorkflowNode | null;
  edgeTargetNode: WorkflowNode | null;
  edgeMapping?: EdgeMapping;
  onLinkEdge: (from: EdgeFieldRef | undefined, to: EdgeFieldRef) => MatchResult;
  onUnlinkEdge: (to: EdgeFieldRef) => void;
  onSetStaticValue: (to: EdgeFieldRef, value: string) => void;
};

export function Sidebar({
  nodes,
  edges,
  output,
  activeLayer,
  contracts,
  activeTab,
  onTabChange,
  editingNode,
  activeEdgeId,
  edgeSourceNode,
  edgeTargetNode,
  edgeMapping,
  onLinkEdge,
  onUnlinkEdge,
  onSetStaticValue,
}: SidebarProps) {
  return (
    <div className="w-[400px] border-l bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as SidebarTab)}
        className="flex h-full flex-col"
      >
        <TabsList className="m-2">
          <TabsTrigger value="console">Console</TabsTrigger>
          <TabsTrigger value="state">State</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="console" className="flex-grow">
          <ConsolePanel output={output} />
        </TabsContent>
        <TabsContent value="state" className="flex-grow">
          <StatePanel nodes={nodes} edges={edges} />
        </TabsContent>
        <TabsContent value="context" className="flex-grow">
          <ContextPanel activeLayer={activeLayer} contracts={contracts} />
        </TabsContent>
        <TabsContent value="editor" className="flex-grow">
          <EditorPanel
            node={editingNode}
            edgeId={activeEdgeId}
            sourceNode={edgeSourceNode}
            targetNode={edgeTargetNode}
            mapping={edgeMapping}
            onLink={onLinkEdge}
            onUnlink={onUnlinkEdge}
            onStaticValue={onSetStaticValue}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
