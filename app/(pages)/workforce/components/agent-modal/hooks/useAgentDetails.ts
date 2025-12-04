import { useState, useEffect } from "react";
import type { AgentConfig, WorkflowSummary, ConnectionToolBinding } from "@/_tables/types";
import { MOCK_TASKS, MOCK_JOBS, MOCK_TRIGGERS, MOCK_RECORDS, MOCK_WORKFLOWS } from "../data/mocks";

/**
 * Normalizes tool ID by removing the "workflow-" prefix if present.
 */
export const normalizeToolId = (id: string): string => {
  return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
};

export function useAgentDetails(agent: AgentConfig | null) {
  const [tools, setTools] = useState<WorkflowSummary[]>([]);
  const [connectionBindings, setConnectionBindings] = useState<ConnectionToolBinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agent) {
      setTools([]);
      setConnectionBindings([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch custom tools and connection bindings in parallel
        const [toolsResponse, bindingsResponse] = await Promise.all([
          fetch("/api/tools/list"),
          fetch(`/api/workforce/${agent.id}/tools/connection`),
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
      } catch (error) {
        console.error("[useAgentDetails] Error loading data:", error);
        setTools([]);
        setConnectionBindings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [agent]);

  return {
    tools,
    connectionBindings,
    workflows: MOCK_WORKFLOWS,
    tasks: MOCK_TASKS,
    jobs: MOCK_JOBS,
    triggers: MOCK_TRIGGERS,
    records: MOCK_RECORDS,
    isLoading,
  };
}

