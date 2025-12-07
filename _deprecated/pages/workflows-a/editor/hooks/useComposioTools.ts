"use client";

import { useState, useEffect, useCallback } from "react";
import type { JSONSchema } from "@/app/api/workflows/services/types";

export interface ComposioTool {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
}

export interface ToolkitGroup {
  slug: string;
  name: string;
  logo?: string;
  tools: ComposioTool[];
}

interface UseComposioToolsReturn {
  toolkits: ToolkitGroup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch available Composio tools grouped by toolkit
 */
export function useComposioTools(): UseComposioToolsReturn {
  const [toolkits, setToolkits] = useState<ToolkitGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workflows/tools");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tools");
      }

      const data = await response.json();
      setToolkits(data.toolkits || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching Composio tools:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return {
    toolkits,
    isLoading,
    error,
    refetch: fetchTools,
  };
}

/**
 * Filter tools by search query
 */
export function filterTools(
  toolkits: ToolkitGroup[],
  query: string
): ToolkitGroup[] {
  if (!query.trim()) {
    return toolkits;
  }

  const lowercaseQuery = query.toLowerCase();

  return toolkits
    .map((toolkit) => ({
      ...toolkit,
      tools: toolkit.tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(lowercaseQuery) ||
          tool.description.toLowerCase().includes(lowercaseQuery) ||
          tool.id.toLowerCase().includes(lowercaseQuery)
      ),
    }))
    .filter((toolkit) => toolkit.tools.length > 0);
}




