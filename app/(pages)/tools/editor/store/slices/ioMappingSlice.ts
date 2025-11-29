/**
 * IO Mapping slice
 * ----------------
 * Keeps track of edge-level bindings between outputs and inputs.  The slice is
 * deliberately small—pure data manipulation with no React/DOM knowledge—so it
 * can be reused by both the sidebar editor and the future execution wrapper.
 *
 * Responsibilities:
 *  - Track which edge is currently selected (`activeEdgeId`).
 *  - Add/remove/update bindings for a given edge.
 *  - Provide lightweight validation (`MatchResult`) that callers can surface as warnings.
 */

import type { StateCreator } from "zustand";

import type {
  EdgeFieldRef,
  EdgeLink,
  EdgeMapping,
  MatchResult,
} from "../../types/domain";
import type {
  WorkflowGeneratorStore,
} from "../types";

// 1. State Interface
export interface IoMappingSliceState {
  /** A record of all edge mappings, keyed by edge ID. */
  mappings: Record<string, EdgeMapping>;
  /** The ID of the edge currently selected by the user. */
  activeEdgeId: string | null;
}

// 2. Actions Interface
export interface IoMappingSliceActions {
  /** Tracks which edge the user has selected. */
  setActiveEdge: (edgeId: string | null) => void;
  /** Links an output field from a source node to an input field on a target node. */
  linkFields: (
    edgeId: string,
    from: EdgeFieldRef | undefined,
    to: EdgeFieldRef
  ) => MatchResult;
  /** Removes an existing binding for a target input. */
  unlinkField: (edgeId: string, to: EdgeFieldRef) => void;
  /** Stores a static default value for a target input. */
  setStaticValue: (edgeId: string, to: EdgeFieldRef, value: string) => void;
  /** Cleans up the mapping for a given edge when it is deleted. */
  removeEdgeMapping: (edgeId: string) => void;
}

// 3. Combined Slice Type
export type IoMappingSlice = IoMappingSliceState & IoMappingSliceActions;

// Helper functions (kept co-located as they are specific to this slice's logic)
const createFieldRef = ({
  nodeId,
  fieldName,
  type,
  itemType,
}: EdgeFieldRef): EdgeFieldRef => ({
  nodeId,
  fieldName,
  type,
  itemType,
});

const typesCompatible = (
  from?: EdgeFieldRef,
  to?: EdgeFieldRef
): MatchResult => {
  if (!to) return { status: "warning", reason: "missing-downstream" };
  if (!from) return { status: "warning", reason: "missing-upstream" };
  if (from.type !== to.type) return { status: "warning", reason: "type-mismatch" };
  if (from.type === "list" && from.itemType !== to.itemType) {
    return { status: "warning", reason: "list-item-mismatch" };
  }
  return { status: "ok" };
};

// 4. Initial State
const initialState: IoMappingSliceState = {
  mappings: {},
  activeEdgeId: null,
};

// 5. Slice Creator
export const createIoMappingSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  IoMappingSlice
> = (set) => ({
  ...initialState,

  setActiveEdge: (edgeId) => {
    set(() => ({
      activeEdgeId: edgeId,
    }));
  },

  linkFields: (edgeId, from, to) => {
    // Compute validation result prior to mutating state so callers can surface warnings.
    const result = typesCompatible(from, to);
    set((state) => {
      const current = state.mappings[edgeId] ?? {
        edgeId,
        links: [],
      };

      const linkIndex = current.links.findIndex(
        (link) => link.to.nodeId === to.nodeId && link.to.fieldName === to.fieldName
      );

      const updatedLink: EdgeLink = {
        ...current.links[linkIndex],
        from: from && createFieldRef(from),
        to: createFieldRef(to),
        staticValue:
          from === undefined ? current.links[linkIndex]?.staticValue ?? "" : undefined,
      };

      const nextLinks =
        linkIndex >= 0
          ? current.links.map((link, idx) =>
              idx === linkIndex ? updatedLink : link
            )
          : current.links.concat(updatedLink);

      return {
        mappings: {
          ...state.mappings,
          [edgeId]: {
            ...current,
            // attach new/updated link
            links: nextLinks,
          },
        },
      };
    });
    return result;
  },

  unlinkField: (edgeId, to) => {
    set((state) => {
      const current = state.mappings[edgeId];
      if (!current) return state;

      return {
        mappings: {
          ...state.mappings,
          [edgeId]: {
            ...current,
            links: current.links.filter(
              (link) =>
                !(
                  link.to.nodeId === to.nodeId && link.to.fieldName === to.fieldName
                )
            ),
          },
        },
      };
    });
  },

  setStaticValue: (edgeId, to, value) => {
    set((state) => {
      const current = state.mappings[edgeId] ?? {
        edgeId,
        links: [],
      };

      const linkIndex = current.links.findIndex(
        (link) => link.to.nodeId === to.nodeId && link.to.fieldName === to.fieldName
      );

      const updatedLink: EdgeLink = {
        ...current.links[linkIndex],
        from: undefined,
        to: createFieldRef(to),
        staticValue: value,
      };

      const nextLinks =
        linkIndex >= 0
          ? current.links.map((link, idx) =>
              idx === linkIndex ? updatedLink : link
            )
          : current.links.concat(updatedLink);

      return {
        mappings: {
          ...state.mappings,
          [edgeId]: {
            ...current,
            // we store static defaults as links with `from` undefined
            links: nextLinks,
          },
        },
      };
    });
  },

  removeEdgeMapping: (edgeId) => {
    set((state) => {
      if (!state.mappings[edgeId]) return state;
      const next = { ...state.mappings };
      delete next[edgeId];
      // No need to reset activeEdgeId; UI handles deselection when appropriate.
      return { mappings: next };
    });
  },
});


