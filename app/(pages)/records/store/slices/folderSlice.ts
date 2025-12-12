/**
 * Folder Slice
 *
 * Manages folder navigation state for the unified records system.
 * Handles folder tree, current folder, breadcrumbs, and item listing.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";
import type {
  AnyItemMetadata,
  FolderTreeNode,
  BreadcrumbItem,
  FolderMetadata,
  ItemType,
} from "@/app/api/records/types";

// 1. State Interface
export interface FolderSliceState {
  /** Currently selected folder ID (null = root) */
  currentFolderId: string | null;

  /** Folder tree for sidebar */
  folderTree: FolderTreeNode[];

  /** Breadcrumb path for current folder */
  breadcrumbs: BreadcrumbItem[];

  /** Items in current folder */
  items: AnyItemMetadata[];

  /** Current folder metadata (null for root) */
  currentFolder: FolderMetadata | null;

  /** Loading state for folder operations */
  isFolderLoading: boolean;

  /** Loading state for items */
  isItemsLoading: boolean;

  /** Error state */
  folderError: string | null;

  /** Type filter for items */
  itemTypeFilter: ItemType | null;

  /** Search query */
  searchQuery: string;
}

// 2. Actions Interface
export interface FolderSliceActions {
  /** Navigate to a folder */
  navigateToFolder: (folderId: string | null) => Promise<void>;

  /** Fetch folder tree for sidebar */
  fetchFolderTree: () => Promise<void>;

  /** Fetch items in current folder */
  fetchItems: () => Promise<void>;

  /** Create a new folder */
  createFolder: (name: string, parentId?: string | null) => Promise<string | null>;

  /** Rename a folder */
  renameFolder: (folderId: string, name: string) => Promise<boolean>;

  /** Delete a folder */
  deleteFolder: (folderId: string) => Promise<boolean>;

  /** Create a new document */
  createDocument: (title?: string) => Promise<string | null>;

  /** Create a new table */
  createTable: (name: string, description?: string) => Promise<string | null>;

  /** Delete an item (table or document) */
  deleteItem: (itemId: string, itemType: ItemType) => Promise<boolean>;

  /** Move an item to a different folder */
  moveItem: (
    itemId: string,
    itemType: "table" | "document",
    targetFolderId: string | null
  ) => Promise<boolean>;

  /** Set item type filter */
  setItemTypeFilter: (type: ItemType | null) => void;

  /** Set search query */
  setSearchQuery: (query: string) => void;

  /** Clear search and filters */
  clearFilters: () => void;

  /** Reset folder state */
  resetFolderState: () => void;
}

// 3. Combined Slice Type
export type FolderSlice = FolderSliceState & FolderSliceActions;

// 4. Initial State
const initialState: FolderSliceState = {
  currentFolderId: null,
  folderTree: [],
  breadcrumbs: [{ id: null, name: "All Records" }],
  items: [],
  currentFolder: null,
  isFolderLoading: false,
  isItemsLoading: false,
  folderError: null,
  itemTypeFilter: null,
  searchQuery: "",
};

// 5. Slice Creator
export const createFolderSlice: StateCreator<
  RecordsStore,
  [],
  [],
  FolderSlice
> = (set, get) => ({
  ...initialState,

  navigateToFolder: async (folderId) => {
    console.log("[FolderSlice] Navigating to folder:", folderId ?? "root");

    set({ currentFolderId: folderId, isItemsLoading: true, folderError: null });

    try {
      // Fetch folder contents (items + breadcrumbs)
      const url = folderId
        ? `/api/records/folders/${folderId}/items`
        : `/api/records/folders/_root/items`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch folder contents");

      const data = await response.json();

      set({
        currentFolder: data.folder,
        items: data.items,
        breadcrumbs: data.breadcrumbs,
        isItemsLoading: false,
      });

      console.log("[FolderSlice] Navigation complete");
    } catch (error) {
      console.error("[FolderSlice] Navigation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to navigate";
      set({ folderError: errorMessage, isItemsLoading: false });
    }
  },

  fetchFolderTree: async () => {
    console.log("[FolderSlice] Fetching folder tree");

    set({ isFolderLoading: true });

    try {
      const response = await fetch("/api/records/folders?tree=true");
      if (!response.ok) throw new Error("Failed to fetch folder tree");

      const data = await response.json();
      set({ folderTree: data.tree ?? [], isFolderLoading: false });

      console.log("[FolderSlice] Folder tree fetched");
    } catch (error) {
      console.error("[FolderSlice] Folder tree error:", error);
      set({ isFolderLoading: false });
    }
  },

  fetchItems: async () => {
    const { currentFolderId, itemTypeFilter } = get();
    console.log("[FolderSlice] Fetching items for folder:", currentFolderId ?? "root");

    set({ isItemsLoading: true, folderError: null });

    try {
      let url = currentFolderId
        ? `/api/records/folders/${currentFolderId}/items`
        : `/api/records/folders/_root/items`;

      if (itemTypeFilter) {
        url += `?type=${itemTypeFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();

      set({
        items: data.items,
        breadcrumbs: data.breadcrumbs,
        currentFolder: data.folder,
        isItemsLoading: false,
      });
    } catch (error) {
      console.error("[FolderSlice] Fetch items error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch items";
      set({ folderError: errorMessage, isItemsLoading: false });
    }
  },

  createFolder: async (name, parentId) => {
    const targetParentId = parentId !== undefined ? parentId : get().currentFolderId;
    console.log("[FolderSlice] Creating folder:", name);

    try {
      const response = await fetch("/api/records/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: targetParentId }),
      });

      if (!response.ok) throw new Error("Failed to create folder");

      const data = await response.json();
      const folderId = data.folder.id;

      // Refresh tree and items
      await Promise.all([get().fetchFolderTree(), get().fetchItems()]);

      console.log("[FolderSlice] Folder created:", folderId);
      return folderId;
    } catch (error) {
      console.error("[FolderSlice] Create folder error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create folder";
      set({ folderError: errorMessage });
      return null;
    }
  },

  renameFolder: async (folderId, name) => {
    console.log("[FolderSlice] Renaming folder:", folderId);

    try {
      const response = await fetch(`/api/records/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to rename folder");

      // Refresh tree and items
      await Promise.all([get().fetchFolderTree(), get().fetchItems()]);

      return true;
    } catch (error) {
      console.error("[FolderSlice] Rename folder error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to rename folder";
      set({ folderError: errorMessage });
      return false;
    }
  },

  deleteFolder: async (folderId) => {
    console.log("[FolderSlice] Deleting folder:", folderId);

    try {
      const response = await fetch(`/api/records/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete folder");

      // If we're in the deleted folder, navigate to parent or root
      if (get().currentFolderId === folderId) {
        await get().navigateToFolder(null);
      }

      // Refresh tree and items
      await Promise.all([get().fetchFolderTree(), get().fetchItems()]);

      return true;
    } catch (error) {
      console.error("[FolderSlice] Delete folder error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete folder";
      set({ folderError: errorMessage });
      return false;
    }
  },

  createDocument: async (title) => {
    const folderId = get().currentFolderId;
    console.log("[FolderSlice] Creating document:", title);

    try {
      const response = await fetch("/api/records/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, folderId }),
      });

      if (!response.ok) throw new Error("Failed to create document");

      const data = await response.json();
      const docId = data.document.frontmatter.id;

      // Refresh items
      await get().fetchItems();

      console.log("[FolderSlice] Document created:", docId);
      return docId;
    } catch (error) {
      console.error("[FolderSlice] Create document error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create document";
      set({ folderError: errorMessage });
      return null;
    }
  },

  createTable: async (name, description) => {
    const folderId = get().currentFolderId;
    console.log("[FolderSlice] Creating table:", name);

    try {
      const response = await fetch("/api/records/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, folderId }),
      });

      if (!response.ok) throw new Error("Failed to create table");

      const data = await response.json();
      const tableId = data.id; // Schema response returns { id, name, ... }

      // Refresh items
      await get().fetchItems();

      console.log("[FolderSlice] Table created:", tableId);
      return tableId;
    } catch (error) {
      console.error("[FolderSlice] Create table error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create table";
      set({ folderError: errorMessage });
      return null;
    }
  },

  deleteItem: async (itemId, itemType) => {
    console.log("[FolderSlice] Deleting item:", itemId, itemType);

    try {
      let url: string;
      if (itemType === "table") {
        url = `/api/records/${itemId}`;
      } else if (itemType === "document") {
        url = `/api/records/documents/${itemId}`;
      } else if (itemType === "folder") {
        return await get().deleteFolder(itemId);
      } else {
        throw new Error("Unknown item type");
      }

      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete ${itemType}`);

      // Refresh items
      await get().fetchItems();

      return true;
    } catch (error) {
      console.error("[FolderSlice] Delete item error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete item";
      set({ folderError: errorMessage });
      return false;
    }
  },

  moveItem: async (itemId, itemType, targetFolderId) => {
    console.log("[FolderSlice] Moving item:", itemId, "to", targetFolderId ?? "root");

    try {
      const response = await fetch(
        `/api/records/items/${itemId}/move?type=${itemType}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetFolderId }),
        }
      );

      if (!response.ok) throw new Error(`Failed to move ${itemType}`);

      // Refresh tree and items
      await Promise.all([get().fetchFolderTree(), get().fetchItems()]);

      return true;
    } catch (error) {
      console.error("[FolderSlice] Move item error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to move item";
      set({ folderError: errorMessage });
      return false;
    }
  },

  setItemTypeFilter: (type) => {
    set({ itemTypeFilter: type });
    get().fetchItems();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearFilters: () => {
    set({ itemTypeFilter: null, searchQuery: "" });
    get().fetchItems();
  },

  resetFolderState: () => set(initialState),
});
