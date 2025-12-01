import { useState, useEffect } from "react";
import type { AgentConfig, WorkflowSummary } from "@/_tables/types";
import { MOCK_TASKS, MOCK_JOBS, MOCK_TRIGGERS, MOCK_RECORDS, MOCK_WORKFLOWS } from "../data/mocks";

/**
 * Normalizes tool ID by removing the "workflow-" prefix if present.
 */
export const normalizeToolId = (id: string): string => {
  return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
};

export function useAgentDetails(agent: AgentConfig | null) {
  const [tools, setTools] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agent) {
      setTools([]);
      setIsLoading(false);
      return;
    }

    const fetchTools = async () => {
      setIsLoading(true);
      try {
        // Fetch all available tools
        const response = await fetch("/api/tools/list");
        if (!response.ok) throw new Error("Failed to fetch tools");
        
        const allTools = (await response.json()) as WorkflowSummary[];
        
        // Filter to only tools assigned to this agent
        const assignedTools = agent.toolIds
          .map(normalizeToolId)
          .map(id => allTools.find(t => t.id === id))
          .filter((t): t is WorkflowSummary => t !== undefined);

        setTools(assignedTools);
      } catch (error) {
        console.error("[useAgentDetails] Error loading tools:", error);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [agent]);

  return {
    tools,
    workflows: MOCK_WORKFLOWS,
    tasks: MOCK_TASKS,
    jobs: MOCK_JOBS,
    triggers: MOCK_TRIGGERS,
    records: MOCK_RECORDS,
    isLoading,
  };
}

