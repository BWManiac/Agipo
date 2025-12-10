/**
 * Grid Slice
 * Manages sorting, filtering, selection, and pagination state.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export type FilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";

export interface FilterValue {
  operator: FilterOperator;
  value: string | number | boolean;
}

// 1. State Interface
export interface GridSliceState {
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filters: Record<string, FilterValue>;
  selectedRowIds: Set<string>;
  page: number;
  pageSize: number;
  totalRows: number;
}

// 2. Actions Interface
export interface GridSliceActions {
  setSort: (column: string | null, direction?: "asc" | "desc") => void;
  toggleSort: (column: string) => void;
  clearSort: () => void;
  setFilter: (column: string, value: FilterValue) => void;
  removeFilter: (column: string) => void;
  clearAllFilters: () => void;
  selectRow: (rowId: string) => void;
  deselectRow: (rowId: string) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAllRows: (rowIds: string[]) => void;
  clearSelection: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalRows: (total: number) => void;
  getQueryParams: () => { sort?: { col: string; desc: boolean }; filters?: Array<{ col: string; op: string; val: unknown }>; limit: number; offset: number };
  resetGridState: () => void;
}

// 3. Combined Slice Type
export type GridSlice = GridSliceState & GridSliceActions;

// 4. Initial State
const initialState: GridSliceState = {
  sortColumn: null,
  sortDirection: "asc",
  filters: {},
  selectedRowIds: new Set(),
  page: 1,
  pageSize: 100,
  totalRows: 0,
};

// 5. Slice Creator
export const createGridSlice: StateCreator<
  RecordsStore,
  [],
  [],
  GridSlice
> = (set, get) => ({
  ...initialState,

  setSort: (column, direction = "asc") => set({ sortColumn: column, sortDirection: direction }),

  toggleSort: (column) => {
    const state = get();
    if (state.sortColumn !== column) {
      set({ sortColumn: column, sortDirection: "asc" });
    } else if (state.sortDirection === "asc") {
      set({ sortDirection: "desc" });
    } else {
      set({ sortColumn: null, sortDirection: "asc" });
    }
  },

  clearSort: () => set({ sortColumn: null, sortDirection: "asc" }),

  setFilter: (column, value) => set((state) => ({
    filters: { ...state.filters, [column]: value },
    page: 1, // Reset to page 1 when filtering
  })),

  removeFilter: (column) => set((state) => {
    const newFilters = { ...state.filters };
    delete newFilters[column];
    return { filters: newFilters, page: 1 };
  }),

  clearAllFilters: () => set({ filters: {}, page: 1 }),

  selectRow: (rowId) => set((state) => {
    const newSet = new Set(state.selectedRowIds);
    newSet.add(rowId);
    return { selectedRowIds: newSet };
  }),

  deselectRow: (rowId) => set((state) => {
    const newSet = new Set(state.selectedRowIds);
    newSet.delete(rowId);
    return { selectedRowIds: newSet };
  }),

  toggleRowSelection: (rowId) => set((state) => {
    const newSet = new Set(state.selectedRowIds);
    if (newSet.has(rowId)) {
      newSet.delete(rowId);
    } else {
      newSet.add(rowId);
    }
    return { selectedRowIds: newSet };
  }),

  selectAllRows: (rowIds) => set({ selectedRowIds: new Set(rowIds) }),

  clearSelection: () => set({ selectedRowIds: new Set() }),

  setPage: (page) => set({ page }),

  setPageSize: (size) => set({ pageSize: size, page: 1 }),

  setTotalRows: (total) => set({ totalRows: total }),

  getQueryParams: () => {
    const state = get();
    const params: ReturnType<GridSliceActions["getQueryParams"]> = {
      limit: state.pageSize,
      offset: (state.page - 1) * state.pageSize,
    };

    if (state.sortColumn) {
      params.sort = { col: state.sortColumn, desc: state.sortDirection === "desc" };
    }

    const filterArray = Object.entries(state.filters).map(([col, f]) => ({
      col,
      op: f.operator,
      val: f.value,
    }));
    if (filterArray.length > 0) {
      params.filters = filterArray;
    }

    return params;
  },

  resetGridState: () => set({ ...initialState, selectedRowIds: new Set() }),
});
