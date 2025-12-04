"use client";

import { useState } from "react";
import type { AgentConfig, ConnectionToolBinding } from "@/_tables/types";
import { useAgentDetails } from "../../hooks/useAgentDetails";
import { ToolCard } from "../shared/ToolCard";
import { WorkflowCard } from "../shared/WorkflowCard";
import { ConnectionToolCard } from "../shared/ConnectionToolCard";
import { ToolEditor } from "../../../ToolEditor";
import { ConnectionToolEditor } from "../../../ConnectionToolEditor";
import { Link2 } from "lucide-react";
import Link from "next/link";

interface CapabilitiesTabProps {
  agent: AgentConfig;
}

export function CapabilitiesTab({ agent }: CapabilitiesTabProps) {
  const { tools, connectionBindings, workflows, isLoading } = useAgentDetails(agent);
  const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(false);
  const [isConnectionEditorOpen, setIsConnectionEditorOpen] = useState(false);

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

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading capabilities...</div>;
  }

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
              onClick={() => setIsConnectionEditorOpen(true)}
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
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workflows</h3>
          <div className="grid grid-cols-2 gap-4">
            {workflows.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2 italic">No workflows assigned.</p>
            ) : (
              workflows.map((wf) => <WorkflowCard key={wf.id} workflow={wf} />)
            )}
          </div>
        </div>
      </div>

      {/* Custom Tools Editor Dialog */}
      <ToolEditor
        agent={agent}
        open={isCustomEditorOpen}
        onOpenChange={setIsCustomEditorOpen}
        onSave={handleSaveCustomTools}
      />

      {/* Connection Tools Editor Dialog */}
      <ConnectionToolEditor
        agent={agent}
        open={isConnectionEditorOpen}
        onOpenChange={setIsConnectionEditorOpen}
        onSave={handleSaveConnectionTools}
      />
    </div>
  );
}

