import { useState, useEffect } from "react";
import type { AgentConfig, WorkflowSummary } from "@/_tables/types";

/**
 * Normalizes tool ID by removing the "workflow-" prefix if present.
 * Used for comparing agent toolIds (which may have prefix) with list API IDs (which don't).
 */
export const normalizeToolId = (id: string): string => {
  return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
};

/**
 * Adds the "workflow-" prefix to a tool ID if it's missing.
 * Used for converting list API IDs to the format stored in agent config.
 */
export const toAgentToolId = (id: string): string => {
  return id.startsWith("workflow-") ? id : `workflow-${id}`;
};

export function useAgentTools(agent: AgentConfig | null) {
  const [allTools, setAllTools] = useState<WorkflowSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tools when agent changes or on mount
  useEffect(() => {
    if (!agent) {
      setAllTools([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    const fetchTools = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/tools/list");
        
        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: Failed to fetch tools`;
          console.error("[useAgentTools] API error:", errorMsg);
          throw new Error(errorMsg);
        }
        
        const tools = await response.json();
        const toolList = Array.isArray(tools) ? tools : [];
        setAllTools(toolList);
        setError(null);
        
        // Debug logging
        console.log(`[useAgentTools] Loaded ${toolList.length} tool definitions`);
        
        // Normalize agent toolIds and match against list
        const normalizedAgentToolIds = agent.toolIds.map(normalizeToolId);
        const matched = normalizedAgentToolIds
          .map((normalizedId) => toolList.find((t) => t.id === normalizedId))
          .filter((t): t is WorkflowSummary => t !== undefined);
        console.log(`[useAgentTools] Matched ${matched.length} tools for agent ${agent.id}`);
      } catch (err) {
        console.error("[useAgentTools] Error fetching tools:", err);
        setError(err instanceof Error ? err.message : "Failed to load tools");
        setAllTools([]); // Clear tools on error so we don't stay in loading state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTools();
  }, [agent]); // Reload when agent changes

  // Match agent toolIds with tool definitions (normalize IDs for comparison)
  const agentTools = agent
    ? agent.toolIds
        .map(normalizeToolId)
        .map((normalizedId) => allTools.find((t) => t.id === normalizedId))
        .filter((t): t is WorkflowSummary => t !== undefined)
    : [];

  return {
    allTools,
    agentTools,
    isLoading,
    error,
    // Helper to find a tool by ID (handles normalization)
    getToolById: (id: string) => {
      const normalizedId = normalizeToolId(id);
      return allTools.find((t) => t.id === normalizedId);
    }
  };
}

