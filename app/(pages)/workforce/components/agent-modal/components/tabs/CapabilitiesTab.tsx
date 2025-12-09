"use client";

import { useEffect } from "react";
import type { AgentConfig, ConnectionToolBinding, WorkflowBinding } from "@/_tables/types";
import { useAgentModalStore } from "../../store";
import { ToolCard } from "../shared/ToolCard";
import { WorkflowCard } from "../shared/WorkflowCard";
import { ConnectionToolCard } from "../shared/ConnectionToolCard";
import { ToolEditor } from "../../../ToolEditor";
import { ConnectionToolEditorPanel } from "../../../ConnectionToolEditorPanel";
import { WorkflowEditorPanel } from "../../../WorkflowEditorPanel";
import { Link2 } from "lucide-react";
import Link from "next/link";

interface CapabilitiesTabProps {
  agent: AgentConfig;
}

export function CapabilitiesTab({ agent }: CapabilitiesTabProps) {
  // Store state
  const assignedCustomTools = useAgentModalStore((state) => state.assignedCustomTools);
  const connectionBindings = useAgentModalStore((state) => state.connectionBindings);
  const workflowBindings = useAgentModalStore((state) => state.workflowBindings);
  const availableWorkflows = useAgentModalStore((state) => state.availableWorkflows);
  const isLoadingDetails = useAgentModalStore((state) => state.isLoadingDetails);
  const view = useAgentModalStore((state) => state.view);
  const isCustomEditorOpen = useAgentModalStore((state) => state.isCustomEditorOpen);
  
  // Store actions
  const setView = useAgentModalStore((state) => state.setView);
  const openCustomEditor = useAgentModalStore((state) => state.openCustomEditor);
  const closeCustomEditor = useAgentModalStore((state) => state.closeCustomEditor);
  const saveCustomTools = useAgentModalStore((state) => state.saveCustomTools);
  const saveConnectionTools = useAgentModalStore((state) => state.saveConnectionTools);
  const saveWorkflows = useAgentModalStore((state) => state.saveWorkflows);
  const fetchWorkflows = useAgentModalStore((state) => state.fetchWorkflows);
  const fetchUserConnections = useAgentModalStore((state) => state.fetchUserConnections);

  // Fetch workflows and user connections when component mounts
  useEffect(() => {
    if (agent.id) {
      fetchWorkflows(agent.id);
      fetchUserConnections();
    }
  }, [agent.id, fetchWorkflows, fetchUserConnections]);

  const handleSaveCustomTools = async (toolIds: string[]) => {
    const success = await saveCustomTools(agent.id, toolIds);
    if (success) {
      closeCustomEditor();
    } else {
      throw new Error("Failed to save tools");
    }
  };

  const handleSaveConnectionTools = async (bindings: ConnectionToolBinding[]) => {
    const success = await saveConnectionTools(agent.id, bindings);
    if (success) {
      setView("list");
    } else {
      throw new Error("Failed to save connection tools");
    }
  };

  const handleSaveWorkflows = async (bindings: WorkflowBinding[]) => {
    const success = await saveWorkflows(agent.id, bindings);
    if (success) {
      setView("list");
    } else {
      // Get error from store after save attempt
      const errorWorkflows = useAgentModalStore.getState().errorWorkflows;
      throw new Error(errorWorkflows || "Failed to save workflows");
    }
  };

  if (isLoadingDetails) {
    return <div className="p-8 text-center text-gray-500">Loading capabilities...</div>;
  }

  // Workflow Editor - Full panel view
  if (view === "workflow-editor") {
    return (
      <WorkflowEditorPanel
        agent={agent}
        onBack={() => setView("list")}
        onSave={handleSaveWorkflows}
      />
    );
  }

  // Connection Tool Editor - Full panel view
  if (view === "connection-editor") {
    return (
      <ConnectionToolEditorPanel
        agent={agent}
        onBack={() => setView("list")}
        onSave={handleSaveConnectionTools}
      />
    );
  }

  // Default list view
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
          <div>
            <h2 className="text-lg font-semibold">Assigned Capabilities</h2>
            <p className="text-sm text-gray-500">Manage what this agent can do.</p>
          </div>

        {/* Custom Tools Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Custom Tools
            </h3>
          <button
              onClick={() => openCustomEditor()}
              className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage
          </button>
        </div>
          <div className="grid grid-cols-2 gap-4">
            {assignedCustomTools.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2 italic">No custom tools assigned.</p>
            ) : (
              assignedCustomTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)
            )}
          </div>
        </div>

        {/* Connection Tools Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Connection Tools
            </h3>
            <button
              onClick={() => setView("connection-editor")}
              className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage
            </button>
          </div>
          {connectionBindings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Link2 className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                No connection tools assigned.
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Connect accounts in Settings to enable connection tools.
              </p>
              <Link
                href="/profile"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Go to Connections →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {connectionBindings.map((binding) => (
                <ConnectionToolCard
                  key={`${binding.connectionId}-${binding.toolId}`}
                  binding={binding}
                />
              ))}
            </div>
          )}
        </div>

        {/* Workflows Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Workflows
            </h3>
            <button
              onClick={() => setView("workflow-editor")}
              className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Manage
            </button>
          </div>
          {workflowBindings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500">No workflows assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {workflowBindings.map((binding) => {
                const workflow = availableWorkflows.find((w) => w.id === binding.workflowId);
                return workflow ? (
                  <WorkflowCard key={binding.workflowId} workflow={workflow} binding={binding} />
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom Tools Editor Dialog - keeping as modal for now */}
      <ToolEditor
        agent={agent}
        open={isCustomEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCustomEditor();
          } else {
            openCustomEditor();
          }
        }}
        onSave={handleSaveCustomTools}
      />
    </div>
  );
}

