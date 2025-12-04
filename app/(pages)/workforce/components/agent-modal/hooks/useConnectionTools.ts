"use client";

import { useState, useCallback } from "react";
import type { ConnectionToolBinding } from "@/_tables/types";

/**
 * Represents a connection with its available tools
 */
export type ConnectionWithTools = {
  connectionId: string;
  toolkitSlug: string;
  toolkitName: string;
  toolkitLogo?: string;
  accountLabel: string;
  status: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

/**
 * Hook for managing connection tools for an agent.
 * Fetches available connection tools and agent's assigned bindings.
 */
export function useConnectionTools(agentId: string) {
  const [availableConnections, setAvailableConnections] = useState<ConnectionWithTools[]>([]);
  const [assignedBindings, setAssignedBindings] = useState<ConnectionToolBinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/tools/connection/available`),
        fetch(`/api/workforce/${agentId}/tools/connection`),
      ]);

      if (!availableRes.ok) {
        // 401 is expected if user is not authenticated - not an error
        if (availableRes.status === 401) {
          setAvailableConnections([]);
          setAssignedBindings([]);
          return;
        }
        throw new Error("Failed to fetch available connection tools");
      }

      const availableData = await availableRes.json();
      const assignedData = assignedRes.ok ? await assignedRes.json() : { bindings: [] };

      setAvailableConnections(availableData.connections || []);
      setAssignedBindings(assignedData.bindings || []);
    } catch (err) {
      console.error("[useConnectionTools] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load connection tools");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const saveBindings = useCallback(
    async (bindings: ConnectionToolBinding[]): Promise<boolean> => {
      try {
        const response = await fetch(`/api/workforce/${agentId}/tools/connection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bindings }),
        });

        if (!response.ok) {
          throw new Error("Failed to save connection tools");
        }

        setAssignedBindings(bindings);
        return true;
      } catch (err) {
        console.error("[useConnectionTools] Save error:", err);
        setError(err instanceof Error ? err.message : "Failed to save connection tools");
        return false;
      }
    },
    [agentId]
  );

  /**
   * Check if a specific tool from a specific connection is assigned
   */
  const isToolAssigned = useCallback(
    (connectionId: string, toolId: string): boolean => {
      return assignedBindings.some(
        (b) => b.connectionId === connectionId && b.toolId === toolId
      );
    },
    [assignedBindings]
  );

  return {
    availableConnections,
    assignedBindings,
    isLoading,
    error,
    fetchData,
    saveBindings,
    isToolAssigned,
  };
}

