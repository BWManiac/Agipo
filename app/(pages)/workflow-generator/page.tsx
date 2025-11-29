"use client";

/**
 * WorkflowGeneratorPage
 * ---------------------
 * This component has been refactored to act as a pure orchestrator. It uses
 * custom hooks to fetch state and logic, and then passes that data down to
 * the presentation components. All complex logic now resides in the `hooks/`
 * directory, keeping this component lean and focused on layout.
 */
import "@xyflow/react/dist/style.css";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Background, Controls, ReactFlow } from "@xyflow/react";

import { ControlPanel } from "./components/ControlPanel";
import { Sidebar } from "./components/Sidebar";
import { ChatPanel } from "./components/ChatPanel";

// Import our new, domain-focused custom hooks
import { useCanvasState } from "./hooks/useCanvasState";
import { useEditorState } from "./hooks/useEditorState";
import { useExecution } from "./hooks/useExecution";
import { useWebContainer } from "./hooks/useWebContainer";
import { useWorkflowCanvasLogic } from "./hooks/useWorkflowCanvasLogic";
import { usePersistence } from "./hooks/usePersistence";

function WorkflowEditor() {
  useWebContainer();

  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  // Pull in all state and actions from our custom hooks
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useCanvasState();

  const {
    loadCompleteWorkflow,
    resetWorkflowState,
    workflowName,
    isSaving,
    saveCurrentWorkflow,
    setWorkflowName,
  } = usePersistence();

  useEffect(() => {
    if (!workflowId) {
      resetWorkflowState();
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (!response.ok) throw new Error("Workflow not found");
        const data = await response.json();
        if (!cancelled) {
          loadCompleteWorkflow(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load workflow", error);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [workflowId, loadCompleteWorkflow, resetWorkflowState]);

  const {
    output,
    packageName,
    isBooting,
    isInstalling,
    installDependency,
    runWorkflow,
    setPackageName,
  } = useExecution();

  const {
          activeLayer,
    setActiveLayer,
    activeSidebarTab,
    setSidebarTab,
  } = useEditorState();

  const {
    nodeTypes,
    augmentedNodes,
    contracts,
    editingNode,
    activeEdge,
    edgeSourceNode,
    edgeTargetNode,
    edgeMapping,
    handleEdgeClick,
    handleLinkEdge,
    handleUnlinkEdge,
    handleStaticValue,
    handleCanvasClick,
  } = useWorkflowCanvasLogic();

  return (
    // Layout: chat docked left, canvas centre, sidebar right.
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      <ChatPanel />
      <div style={{ flexGrow: 1, position: "relative" }}>
        <ControlPanel
          onAdd={addNode}
          onRun={runWorkflow}
          onInstall={installDependency}
          onSave={saveCurrentWorkflow}
          isBooting={isBooting}
          isInstalling={isInstalling}
          isSaving={isSaving}
          packageName={packageName}
          setPackageName={setPackageName}
          workflowName={workflowName}
          setWorkflowName={setWorkflowName}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
        />
        <ReactFlow
          nodes={augmentedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handleCanvasClick}
          nodeTypes={nodeTypes}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <Sidebar
        nodes={nodes}
        edges={edges}
        output={output}
        activeLayer={activeLayer}
        contracts={contracts}
        activeTab={activeSidebarTab}
        onTabChange={setSidebarTab}
        editingNode={editingNode}
        activeEdgeId={activeEdge?.id ?? null}
        edgeSourceNode={edgeSourceNode}
        edgeTargetNode={edgeTargetNode}
        edgeMapping={edgeMapping}
        onLinkEdge={handleLinkEdge}
        onUnlinkEdge={handleUnlinkEdge}
        onSetStaticValue={handleStaticValue}
      />
    </div>
  );
}

export default function WorkflowGeneratorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WorkflowEditor />
        </Suspense>
    )
}

