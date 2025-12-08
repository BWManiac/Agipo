"use client";

import { useState, useCallback } from "react";
import type { WorkflowBinding, WorkflowMetadata } from "@/_tables/types";

export type Connection = {
  id: string;
  toolkitSlug: string;
  accountLabel?: string;
  status: string;
};

/**
 * Hook for managing workflow assignments for an agent.
 * Fetches available workflows, user connections, and agent's assigned bindings.
 */
export function useWorkflowAssignment(agentId: string) {
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowMetadata[]>([]);
  const [userConnections, setUserConnections] = useState<Connection[]>([]);
  const [currentBindings, setCurrentBindings] = useState<WorkflowBinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [workflowsRes, bindingsRes, connectionsRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/workflows/available`),
        fetch(`/api/workforce/${agentId}/workflows`),
        fetch(`/api/connections/list`),
      ]);

      if (!workflowsRes.ok && workflowsRes.status !== 401) {
        throw new Error("Failed to fetch available workflows");
      }

      const workflowsData = workflowsRes.ok ? await workflowsRes.json() : { workflows: [] };
      const bindingsData = bindingsRes.ok ? await bindingsRes.json() : { bindings: [] };
      const connectionsData = connectionsRes.ok ? await connectionsRes.json() : [];

      setAvailableWorkflows(workflowsData.workflows || []);
      setCurrentBindings(bindingsData.bindings || []);
      
      // Format connections for our use
      const formattedConnections: Connection[] = Array.isArray(connectionsData)
        ? connectionsData.map((conn: any) => ({
            id: conn.id,
            toolkitSlug: conn.toolkitSlug,
            accountLabel: conn.accountLabel,
            status: conn.status,
          }))
        : [];

      setUserConnections(formattedConnections);
    } catch (err) {
      console.error("[useWorkflowAssignment] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load workflow data");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  /**
   * Groups connections by toolkit slug
   */
  const groupConnectionsByToolkit = useCallback(
    (): Map<string, Connection[]> => {
      const groups = new Map<string, Connection[]>();
      for (const conn of userConnections) {
        const key = conn.toolkitSlug;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(conn);
      }
      return groups;
    },
    [userConnections]
  );

  return {
    availableWorkflows,
    userConnections,
    currentBindings,
    isLoading,
    error,
    fetchData,
    groupConnectionsByToolkit,
  };
}

