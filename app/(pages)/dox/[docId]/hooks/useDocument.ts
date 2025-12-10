/**
 * Document Hooks
 * 
 * TanStack Query hooks for single document operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type DocumentData = {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lexicalState?: string;
  outline?: Array<{ level: number; text: string; id: string; position: number }>;
};

/**
 * Hook to fetch a single document by ID.
 */
export function useDocument(docId: string) {
  return useQuery<DocumentData>({
    queryKey: ["document", docId],
    queryFn: async () => {
      const res = await fetch(`/api/dox/${docId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Document not found");
        }
        throw new Error("Failed to fetch document");
      }
      return res.json();
    },
    enabled: !!docId,
  });
}

/**
 * Hook to update a document.
 */
export function useUpdateDocument(docId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      title?: string;
      content?: string;
      properties?: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/dox/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", docId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

/**
 * Hook to delete a document.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(`/api/dox/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
