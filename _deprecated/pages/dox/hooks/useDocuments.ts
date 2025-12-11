/**
 * DOX Hooks
 * 
 * TanStack Query hooks for document catalog operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type DocumentCatalogItem = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

export type DocumentData = {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lexicalState?: string;
  outline?: Array<{ level: number; text: string; id: string }>;
};

/**
 * Hook to fetch all documents (catalog).
 */
export function useDocuments() {
  return useQuery<DocumentCatalogItem[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/dox/list");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      return data.documents || [];
    },
  });
}

/**
 * Hook to create a new document.
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      content?: string;
      properties?: Record<string, unknown>;
    }) => {
      const res = await fetch("/api/dox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create document");
      }
      return res.json() as Promise<DocumentData>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
