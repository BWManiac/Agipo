"use client";

import { useState, useEffect, useCallback } from "react";
import type { KnowledgeData } from "../types";

export function useKnowledge(agentId: string) {
  const [data, setData] = useState<KnowledgeData>({
    knowledge: null,
    updatedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch knowledge on mount
  useEffect(() => {
    async function fetchKnowledge() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/workforce/${agentId}/knowledge`);

        if (!response.ok) {
          throw new Error("Failed to fetch knowledge");
        }

        const result: KnowledgeData = await response.json();
        setData(result);
      } catch (err) {
        console.error("[useKnowledge] fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchKnowledge();
  }, [agentId]);

  // Clear all knowledge
  const clearKnowledge = useCallback(async () => {
    try {
      const response = await fetch(`/api/workforce/${agentId}/knowledge`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear knowledge");
      }

      // Clear local state
      setData({ knowledge: null, updatedAt: null });
      return true;
    } catch (err) {
      console.error("[useKnowledge] clear error:", err);
      return false;
    }
  }, [agentId]);

  // Refresh knowledge
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workforce/${agentId}/knowledge`);

      if (response.ok) {
        const result: KnowledgeData = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error("[useKnowledge] refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const hasKnowledge =
    data.knowledge &&
    (data.knowledge.communicationPreferences ||
      (data.knowledge.activeProjects && data.knowledge.activeProjects.length > 0) ||
      (data.knowledge.keyContext && data.knowledge.keyContext.length > 0) ||
      (data.knowledge.recentDecisions && data.knowledge.recentDecisions.length > 0));

  return {
    knowledge: data.knowledge,
    updatedAt: data.updatedAt,
    isLoading,
    error,
    hasKnowledge,
    clearKnowledge,
    refresh,
  };
}

