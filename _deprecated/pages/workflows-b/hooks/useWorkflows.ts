/**
 * Workflows B React Query Hooks
 * 
 * Custom hooks for fetching and mutating workflow data.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { 
  ListWorkflowsResponse, 
  GetWorkflowResponse,
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
  DeleteWorkflowResponse,
  GenerateWorkflowResponse,
} from "@/app/api/workflows-b/types";
import type { EditorState } from "@/_tables/workflows-b/types";

const WORKFLOWS_QUERY_KEY = ["workflows-b"];

/**
 * Fetch all workflows for the list view.
 */
export function useWorkflows() {
  return useQuery({
    queryKey: WORKFLOWS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/workflows-b");
      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }
      const data: ListWorkflowsResponse = await response.json();
      return data.workflows;
    },
  });
}

/**
 * Fetch a single workflow's editor state.
 */
export function useWorkflow(id: string | null) {
  return useQuery({
    queryKey: [...WORKFLOWS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/workflows-b/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch workflow");
      }
      const data: GetWorkflowResponse = await response.json();
      return data.editorState;
    },
    enabled: !!id,
  });
}

/**
 * Create a new workflow.
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (request: CreateWorkflowRequest) => {
      const response = await fetch("/api/workflows-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create workflow");
      }
      const data: CreateWorkflowResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      router.push(`/workflows-b/${data.id}`);
    },
  });
}

/**
 * Update an existing workflow.
 */
export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateWorkflowRequest) => {
      const response = await fetch(`/api/workflows-b/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update workflow");
      }
      const data: UpdateWorkflowResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...WORKFLOWS_QUERY_KEY, id], data.editorState);
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    },
  });
}

/**
 * Save the complete editor state.
 */
export function useSaveWorkflow(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (editorState: EditorState) => {
      const response = await fetch(`/api/workflows-b/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorState }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save workflow");
      }
      const data: UpdateWorkflowResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...WORKFLOWS_QUERY_KEY, id], data.editorState);
    },
  });
}

/**
 * Delete a workflow.
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/workflows-b/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete workflow");
      }
      const data: DeleteWorkflowResponse = await response.json();
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      router.push("/workflows-b");
    },
  });
}

/**
 * Generate workflow code.
 */
export function useGenerateCode(id: string) {
  return useMutation({
    mutationFn: async (force: boolean = false) => {
      const response = await fetch(`/api/workflows-b/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate code");
      }
      const data: GenerateWorkflowResponse = await response.json();
      return data;
    },
  });
}

/**
 * Get generated code.
 */
export function useGeneratedCode(id: string) {
  return useQuery({
    queryKey: [...WORKFLOWS_QUERY_KEY, id, "code"],
    queryFn: async () => {
      const response = await fetch(`/api/workflows-b/${id}/generate`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Code not generated yet
        }
        throw new Error("Failed to fetch generated code");
      }
      const data: GenerateWorkflowResponse = await response.json();
      return data.code;
    },
    retry: false,
  });
}



