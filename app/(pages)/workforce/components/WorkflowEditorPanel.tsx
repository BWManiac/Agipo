"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAgentModalStore } from "./agent-modal/store";
import { WorkflowConnectionSelector } from "./WorkflowConnectionSelector";
import type { AgentConfig, WorkflowBinding } from "@/_tables/types";
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

type WorkflowEditorPanelProps = {
  agent: AgentConfig;
  onBack: () => void;
  onSave: (bindings: WorkflowBinding[]) => Promise<void>;
};

export function WorkflowEditorPanel({
  agent,
  onBack,
  onSave,
}: WorkflowEditorPanelProps) {
  // Store state
  const availableWorkflows = useAgentModalStore((state) => state.availableWorkflows);
  const userConnections = useAgentModalStore((state) => state.userConnections);
  const assignedWorkflowBindings = useAgentModalStore((state) => state.assignedWorkflowBindings);
  const isLoadingWorkflows = useAgentModalStore((state) => state.isLoadingWorkflows);
  const selectedWorkflowBindings = useAgentModalStore((state) => state.selectedWorkflowBindings);
  const expandedWorkflows = useAgentModalStore((state) => state.expandedWorkflows);
  const workflowSearchQuery = useAgentModalStore((state) => state.workflowSearchQuery);
  const isSavingWorkflows = useAgentModalStore((state) => state.isSavingWorkflows);

  // Store actions
  const fetchWorkflows = useAgentModalStore((state) => state.fetchWorkflows);
  const fetchUserConnections = useAgentModalStore((state) => state.fetchUserConnections);
  const groupConnectionsByToolkit = useAgentModalStore((state) => state.groupConnectionsByToolkit);
  const toggleWorkflow = useAgentModalStore((state) => state.toggleWorkflow);
  const toggleExpandedWorkflow = useAgentModalStore((state) => state.toggleExpandedWorkflow);
  const setWorkflowConnection = useAgentModalStore((state) => state.setWorkflowConnection);
  const setWorkflowSearchQuery = useAgentModalStore((state) => state.setWorkflowSearchQuery);

  // Load data on mount
  useEffect(() => {
    fetchWorkflows(agent.id);
    fetchUserConnections();
  }, [agent.id, fetchWorkflows, fetchUserConnections]);

  // Initialize selectedWorkflowBindings from assignedWorkflowBindings
  useEffect(() => {
    if (assignedWorkflowBindings.length > 0 && selectedWorkflowBindings.size === 0) {
      // Initialize store state with assigned bindings (only if store is empty)
      // Use store actions to initialize instead of direct setState
      assignedWorkflowBindings.forEach((binding) => {
        // Toggle workflow to add it (this will also expand it)
        toggleWorkflow(binding.workflowId);
        // Set connections for each binding
        Object.entries(binding.connectionBindings).forEach(([toolkitSlug, connectionId]) => {
          setWorkflowConnection(binding.workflowId, toolkitSlug, connectionId);
        });
      });
    }
    // Only run when assignedWorkflowBindings changes, not when selectedWorkflowBindings changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedWorkflowBindings.length]);

  const groupedConnections = useMemo(() => groupConnectionsByToolkit(), [groupConnectionsByToolkit]);

  const getWorkflowStatus = (workflowId: string): "ready" | "needs-setup" => {
    const binding = selectedWorkflowBindings.get(workflowId);
    const workflow = availableWorkflows.find((w) => w.id === workflowId);

    if (!binding || !workflow) return "needs-setup";

    for (const toolkitSlug of workflow.requiredConnections) {
      if (!binding.connectionBindings[toolkitSlug]) {
        return "needs-setup";
      }
    }

    return "ready";
  };

  const handleSave = async () => {
    try {
      const bindingsArray = Array.from(selectedWorkflowBindings.values());
      await onSave(bindingsArray);
    } catch (error) {
      console.error("Failed to save workflows:", error);
      
      // Try to extract detailed error message from response
      let errorMessage = "Failed to save workflows. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        const errorObj = error as { details?: string[]; error?: string };
        if (errorObj.details && Array.isArray(errorObj.details)) {
          errorMessage = errorObj.details.join("\n");
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        }
      }
      
      alert(errorMessage);
    }
  };

  const filteredWorkflows = useMemo(() => {
    if (!workflowSearchQuery) return availableWorkflows;
    const query = workflowSearchQuery.toLowerCase();
    return availableWorkflows.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query) ||
        w.id.toLowerCase().includes(query)
    );
  }, [availableWorkflows, workflowSearchQuery]);

  const hasNoWorkflows = availableWorkflows.length === 0 && !isLoadingWorkflows;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Manage Workflows</h2>
            <p className="text-sm text-gray-500">
              Select which workflows {agent.name} can use.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      {!hasNoWorkflows && (
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <Input
            placeholder="Search workflows..."
            value={workflowSearchQuery}
            onChange={(e) => setWorkflowSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoadingWorkflows ? (
          <div className="text-center text-gray-500 py-12">
            Loading workflows...
          </div>
        ) : hasNoWorkflows ? (
          <div className="text-center py-12 max-w-sm mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workflows available
            </h3>
            <p className="text-sm text-gray-500">
              Create and transpile workflows in the workflow editor to assign them to agents.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkflows.map((workflow) => {
              const isSelected = selectedWorkflowBindings.has(workflow.id);
              const isExpanded = expandedWorkflows.has(workflow.id);
              const status = getWorkflowStatus(workflow.id);
              const binding = selectedWorkflowBindings.get(workflow.id);

              return (
                <div
                  key={workflow.id}
                  className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                >
                  {/* Workflow Header */}
                  <div className="flex items-center gap-3 p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleWorkflow(workflow.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{workflow.name}</h3>
                        {isSelected && (
                          <Badge
                            variant={status === "ready" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {status === "ready" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ready
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Needs Setup
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {workflow.description || "No description"}
                      </p>
                    </div>
                    {isSelected && (
                      <button
                        onClick={() => toggleExpandedWorkflow(workflow.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Connection Selectors */}
                  {isSelected && isExpanded && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">
                      {workflow.requiredConnections.map((toolkitSlug) => {
                        const connections = groupedConnections.get(toolkitSlug) || [];
                        const selectedConnectionId = binding?.connectionBindings[toolkitSlug];

                        return (
                          <WorkflowConnectionSelector
                            key={toolkitSlug}
                            toolkitSlug={toolkitSlug}
                            selectedId={selectedConnectionId}
                            connections={connections}
                            onChange={(connectionId) =>
                              setWorkflowConnection(workflow.id, toolkitSlug, connectionId)
                            }
                          />
                        );
                      })}
                      {workflow.requiredConnections.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No connections required
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!hasNoWorkflows && (
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onBack} disabled={isSavingWorkflows}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSavingWorkflows}>
            {isSavingWorkflows ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

