import { useState, useEffect } from "react";
import type { AgentConfig, WorkflowSummary, ConnectionToolBinding, WorkflowBinding } from "@/_tables/types";
import { MOCK_TASKS, MOCK_JOBS, MOCK_TRIGGERS, MOCK_RECORDS } from "../data/mocks";

/**
 * Normalizes tool ID by removing the "workflow-" prefix if present.
 */
export const normalizeToolId = (id: string): string => {
  return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
};

export function useAgentDetails(agent: AgentConfig | null) {
  const [tools, setTools] = useState<WorkflowSummary[]>([]);
  const [connectionBindings, setConnectionBindings] = useState<ConnectionToolBinding[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowBinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agent) {
      setTools([]);
      setConnectionBindings([]);
      setWorkflows([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch custom tools, connection bindings, and workflow bindings in parallel
        const [toolsResponse, bindingsResponse, workflowsResponse] = await Promise.all([
          fetch("/api/tools/list"),
          fetch(`/api/workforce/${agent.id}/tools/connection`),
          fetch(`/api/workforce/${agent.id}/workflows`),
        ]);

        // Process custom tools
        if (toolsResponse.ok) {
          const allTools = (await toolsResponse.json()) as WorkflowSummary[];
        const assignedTools = agent.toolIds
          .map(normalizeToolId)
          .map(id => allTools.find(t => t.id === id))
          .filter((t): t is WorkflowSummary => t !== undefined);
        setTools(assignedTools);
        } else {
          console.error("[useAgentDetails] Failed to fetch tools");
          setTools([]);
        }

        // Process connection bindings
        if (bindingsResponse.ok) {
          const bindingsData = await bindingsResponse.json();
          setConnectionBindings(bindingsData.bindings || []);
        } else {
          setConnectionBindings([]);
        }

        // Process workflow bindings
        if (workflowsResponse.ok) {
          const workflowsData = await workflowsResponse.json();
          setWorkflows(workflowsData.bindings || []);
        } else {
          setWorkflows([]);
        }
      } catch (error) {
        console.error("[useAgentDetails] Error loading data:", error);
        setTools([]);
        setConnectionBindings([]);
        setWorkflows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [agent]);

  return {
    tools,
    connectionBindings,
    workflows,
    tasks: MOCK_TASKS,
    jobs: MOCK_JOBS,
    triggers: MOCK_TRIGGERS,
    records: MOCK_RECORDS,
    isLoading,
  };
}

