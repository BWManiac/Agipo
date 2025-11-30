import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  recordCount: number;
  lastModified?: string;
};

export type TableSchema = {
  id: string;
  name: string;
  description?: string;
  columns: Array<{
    id: string;
    name: string;
    type: "text" | "number" | "date" | "boolean" | "select";
    required: boolean;
    options?: string[];
  }>;
  lastModified?: string;
};

// Catalog Hooks

export function useTables() {
  return useQuery<CatalogItem[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await fetch("/api/records/list");
      if (!res.ok) throw new Error("Failed to fetch tables");
      return res.json();
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/records/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create table");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

// Table Specific Hooks

export function useTableSchema(tableId: string) {
  return useQuery<TableSchema>({
    queryKey: ["table", tableId, "schema"],
    queryFn: async () => {
      const res = await fetch(`/api/records/${tableId}/schema`);
      if (!res.ok) throw new Error("Failed to fetch schema");
      return res.json();
    },
  });
}

export function useTableRows(tableId: string) {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ["table", tableId, "rows"],
    queryFn: async () => {
      const res = await fetch(`/api/records/${tableId}/rows/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 1000 }), // Fetch all for now (MVP)
      });
      if (!res.ok) throw new Error("Failed to fetch rows");
      return res.json();
    },
  });
}

export function useAddColumn(tableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (column: { name: string; type: string }) => {
      const res = await fetch(`/api/records/${tableId}/schema`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(column),
      });
      if (!res.ok) throw new Error("Failed to add column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableId, "schema"] });
      // Rows might be updated with nulls, so invalidate them too
      queryClient.invalidateQueries({ queryKey: ["table", tableId, "rows"] }); 
    },
  });
}

export function useAddRow(tableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const res = await fetch(`/api/records/${tableId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || "Failed to add row");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableId, "rows"] });
    },
  });
}

export function useUpdateRow(tableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rowId, updates }: { rowId: string; updates: Record<string, unknown> }) => {
      const res = await fetch(`/api/records/${tableId}/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update row");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableId, "rows"] });
    },
  });
}
