"use client";

import { useState } from "react";
import type { AgentConfig } from "@/_tables/types";
import { useAgentDetails } from "../../hooks/useAgentDetails";
import { ToolCard } from "../shared/ToolCard";
import { WorkflowCard } from "../shared/WorkflowCard";
import { ToolEditor } from "../../../ToolEditor";

interface CapabilitiesTabProps {
  agent: AgentConfig;
}

export function CapabilitiesTab({ agent }: CapabilitiesTabProps) {
  const { tools, workflows, isLoading } = useAgentDetails(agent);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleSaveTools = async (toolIds: string[]) => {
    const response = await fetch(`/api/workforce/${agent.id}/tools`, {
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

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading capabilities...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Assigned Capabilities</h2>
            <p className="text-sm text-gray-500">Manage what this agent can do.</p>
          </div>
          <button
            onClick={() => setIsEditorOpen(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage
          </button>
        </div>

        {/* Tools Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tools</h3>
          <div className="grid grid-cols-2 gap-4">
            {tools.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2 italic">No tools assigned.</p>
            ) : (
              tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)
            )}
          </div>
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

      <ToolEditor
        agent={agent}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handleSaveTools}
      />
    </div>
  );
}

