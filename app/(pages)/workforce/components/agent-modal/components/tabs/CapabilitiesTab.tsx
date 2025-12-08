"use client";

import { useState, useEffect } from "react";
import type { AgentConfig, ConnectionToolBinding, WorkflowBinding, WorkflowMetadata } from "@/_tables/types";
import { useAgentDetails } from "../../hooks/useAgentDetails";
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

type ViewState = "list" | "connection-editor" | "workflow-editor";

export function CapabilitiesTab({ agent }: CapabilitiesTabProps) {
  const { tools, connectionBindings, workflows, isLoading } = useAgentDetails(agent);
  const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(false);
  const [view, setView] = useState<ViewState>("list");
  const [workflowBindings, setWorkflowBindings] = useState<WorkflowBinding[]>([]);
  const [workflowMetadata, setWorkflowMetadata] = useState<WorkflowMetadata[]>([]);

  // Fetch workflow bindings and metadata
  useEffect(() => {
    if (!agent.id) return;

    const fetchWorkflowData = async () => {
      try {
        const [bindingsRes, availableRes] = await Promise.all([
          fetch(`/api/workforce/${agent.id}/workflows`),
          fetch(`/api/workforce/${agent.id}/workflows/available`),
        ]);

        if (bindingsRes.ok) {
          const bindingsData = await bindingsRes.json();
          setWorkflowBindings(bindingsData.bindings || []);
        }

        if (availableRes.ok) {
          const availableData = await availableRes.json();
          setWorkflowMetadata(availableData.workflows || []);
        }
      } catch (error) {
        console.error("[CapabilitiesTab] Error fetching workflow data:", error);
      }
    };

    fetchWorkflowData();
  }, [agent.id]);

  const handleSaveCustomTools = async (toolIds: string[]) => {
    const response = await fetch(`/api/workforce/${agent.id}/tools/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to save tools");
    }
    
    // Force a reload to refresh the tools list
    window.location.reload();
  };

  const handleSaveConnectionTools = async (bindings: ConnectionToolBinding[]) => {
    const response = await fetch(`/api/workforce/${agent.id}/tools/connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bindings }),
    });

    if (!response.ok) {
      throw new Error("Failed to save connection tools");
    }
    
    // Force a reload to refresh the tools list
    window.location.reload();
  };

  const handleSaveWorkflows = async (bindings: WorkflowBinding[]) => {
    const response = await fetch(`/api/workforce/${agent.id}/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bindings }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.details 
        ? errorData.details.join("\n")
        : errorData.error || "Failed to save workflows";
      throw new Error(errorMessage);
    }
    
    // Force a reload to refresh the workflows list
    window.location.reload();
  };

  if (isLoading) {
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
              onClick={() => setIsCustomEditorOpen(true)}
              className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage
          </button>
        </div>
          <div className="grid grid-cols-2 gap-4">
            {tools.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2 italic">No custom tools assigned.</p>
            ) : (
              tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)
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
                const workflow = workflowMetadata.find((w) => w.id === binding.workflowId);
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
        onOpenChange={setIsCustomEditorOpen}
        onSave={handleSaveCustomTools}
      />
    </div>
  );
}

