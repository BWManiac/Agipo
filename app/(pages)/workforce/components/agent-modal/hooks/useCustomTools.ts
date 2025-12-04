"use client";

import { useState, useCallback } from "react";
import type { WorkflowSummary } from "@/_tables/types";

/**
 * Hook for managing custom tools for an agent.
 * Fetches available tools and agent's assigned tools.
 */
export function useCustomTools(agentId: string) {
  const [availableTools, setAvailableTools] = useState<WorkflowSummary[]>([]);
  const [assignedToolIds, setAssignedToolIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/tools/custom/available`),
        fetch(`/api/workforce/${agentId}/tools/custom`),
      ]);

      if (!availableRes.ok) {
        throw new Error("Failed to fetch available tools");
      }

      const availableData = await availableRes.json();
      const assignedData = assignedRes.ok ? await assignedRes.json() : { toolIds: [] };

      setAvailableTools(availableData.tools || []);
      setAssignedToolIds(assignedData.toolIds || []);
    } catch (err) {
      console.error("[useCustomTools] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load tools");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const saveTools = useCallback(
    async (toolIds: string[]): Promise<boolean> => {
      try {
        const response = await fetch(`/api/workforce/${agentId}/tools/custom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to save tools");
        }

        setAssignedToolIds(toolIds);
        return true;
      } catch (err) {
        console.error("[useCustomTools] Save error:", err);
        setError(err instanceof Error ? err.message : "Failed to save tools");
        return false;
      }
    },
    [agentId]
  );

  return {
    availableTools,
    assignedToolIds,
    isLoading,
    error,
    fetchData,
    saveTools,
  };
}

