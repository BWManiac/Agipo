/**
 * Catalog Service
 *
 * Provides unified listing of items (folders, tables, documents) in the records system.
 * Supports folder-based navigation and filtering by type.
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { readSchema } from "./io";
import { getFolder, listFoldersInParent } from "./folders";
import type {
  AnyItemMetadata,
  TableMetadata,
  DocumentMetadata,
  FolderMetadata,
  ItemType,
} from "../types";

const BASE_DIR = path.join(process.cwd(), "_tables", "records");

// =============================================================================
// Path Helpers
// =============================================================================

function getFolderDir(folderId: string | null): string {
  if (folderId === null) {
    return path.join(BASE_DIR, "_root");
  }
  return path.join(BASE_DIR, folderId);
}

// =============================================================================
// Legacy Export (for backwards compatibility)
// =============================================================================

export type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  recordCount: number;
  lastModified?: string;
};

/**
 * Legacy function - lists all tables (flat, no folder support)
 * @deprecated Use listItemsInFolder instead
 */
export async function listTables(): Promise<CatalogItem[]> {
  // For backwards compatibility, list tables from root folder
  const items = await listItemsInFolder(null, "table");
  return items
    .filter((item): item is TableMetadata => item.type === "table")
    .map((table) => ({
      id: table.id,
      name: table.name,
      description: table.description,
      recordCount: table.recordCount,
      lastModified: table.updatedAt,
    }));
}

// =============================================================================
// Unified Item Listing
// =============================================================================

/**
 * List all items in a folder
 *
 * @param folderId - Folder ID to list items from (null for root)
 * @param typeFilter - Optional filter by item type
 * @returns Array of items sorted by type (folders first) then by name
 */
export async function listItemsInFolder(
  folderId: string | null,
  typeFilter?: ItemType | null
): Promise<AnyItemMetadata[]> {
  const items: AnyItemMetadata[] = [];

  try {
    // 1. List subfolders (if not filtering or filtering for folders)
    if (!typeFilter || typeFilter === "folder") {
      const folders = await listFoldersInParent(folderId);
      items.push(...folders);
    }

    // 2. List tables (if not filtering or filtering for tables)
    if (!typeFilter || typeFilter === "table") {
      const tables = await listTablesInFolder(folderId);
      items.push(...tables);
    }

    // 3. List documents (if not filtering or filtering for documents)
    if (!typeFilter || typeFilter === "document") {
      const documents = await listDocumentsInFolder(folderId);
      items.push(...documents);
    }
  } catch (e) {
    console.error("[CatalogService] Error listing items:", e);
  }

  // Sort: folders first, then by name
  items.sort((a, b) => {
    // Folders come first
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    // Then sort by name
    return a.name.localeCompare(b.name);
  });

  return items;
}

/**
 * List tables in a specific folder
 */
async function listTablesInFolder(
  folderId: string | null
): Promise<TableMetadata[]> {
  const tables: TableMetadata[] = [];

  // Check the new folder-based location
  const tablesDir = path.join(getFolderDir(folderId), "tables");
  await collectTablesFromDir(tablesDir, folderId, tables);

  // For root folder, also check the legacy flat location
  if (folderId === null) {
    await collectLegacyTables(tables);
  }

  return tables;
}

/**
 * Collect tables from a directory
 */
async function collectTablesFromDir(
  tablesDir: string,
  folderId: string | null,
  tables: TableMetadata[]
): Promise<void> {
  try {
    const entries = await fs.readdir(tablesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const tableId = entry.name;
      const schemaPath = path.join(tablesDir, tableId, "schema.json");

      try {
        const schemaContent = await fs.readFile(schemaPath, "utf-8");
        const schema = JSON.parse(schemaContent);

        // Count records
        let recordCount = 0;
        try {
          const recordsPath = path.join(tablesDir, tableId, "records.json");
          const stats = await fs.stat(recordsPath);
          if (stats.size < 1024 * 1024) {
            const recordsContent = await fs.readFile(recordsPath, "utf-8");
            const records = JSON.parse(recordsContent);
            recordCount = Array.isArray(records) ? records.length : 0;
          }
        } catch {
          // Records file might not exist
        }

        tables.push({
          id: schema.id || tableId,
          name: schema.name || tableId,
          type: "table",
          description: schema.description,
          createdAt: schema.createdAt || schema.lastModified || new Date().toISOString(),
          updatedAt: schema.updatedAt || schema.lastModified || new Date().toISOString(),
          folderId,
          recordCount,
          columnCount: schema.columns?.length || 0,
        });
      } catch {
        // Skip invalid tables
        continue;
      }
    }
  } catch {
    // Tables directory doesn't exist
  }
}

/**
 * Collect tables from the legacy flat structure (_tables/records/[tableId]/)
 * This is for backwards compatibility with tables created before the folder system
 */
async function collectLegacyTables(tables: TableMetadata[]): Promise<void> {
  try {
    const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });
    const existingIds = new Set(tables.map((t) => t.id));

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;
      if (entry.name.startsWith("_")) continue; // Skip _root and other special dirs
      if (entry.name.startsWith("fld_")) continue; // Skip folder directories

      const tableId = entry.name;

      // Skip if already found in new location
      if (existingIds.has(tableId)) continue;

      const schemaPath = path.join(BASE_DIR, tableId, "schema.json");

      try {
        const schemaContent = await fs.readFile(schemaPath, "utf-8");
        const schema = JSON.parse(schemaContent);

        // Count records
        let recordCount = 0;
        try {
          const recordsPath = path.join(BASE_DIR, tableId, "records.json");
          const stats = await fs.stat(recordsPath);
          if (stats.size < 1024 * 1024) {
            const recordsContent = await fs.readFile(recordsPath, "utf-8");
            const records = JSON.parse(recordsContent);
            recordCount = Array.isArray(records) ? records.length : 0;
          }
        } catch {
          // Records file might not exist
        }

        tables.push({
          id: schema.id || tableId,
          name: schema.name || tableId,
          type: "table",
          description: schema.description,
          createdAt: schema.createdAt || schema.lastModified || new Date().toISOString(),
          updatedAt: schema.updatedAt || schema.lastModified || new Date().toISOString(),
          folderId: null, // Legacy tables are at root
          recordCount,
          columnCount: schema.columns?.length || 0,
        });
      } catch {
        // Not a valid table directory
        continue;
      }
    }
  } catch {
    // Error reading directory
  }
}

/**
 * List documents in a specific folder
 */
async function listDocumentsInFolder(
  folderId: string | null
): Promise<DocumentMetadata[]> {
  const docsDir = path.join(getFolderDir(folderId), "documents");
  const documents: DocumentMetadata[] = [];

  try {
    const entries = await fs.readdir(docsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const docId = entry.name;
      const contentPath = path.join(docsDir, docId, "content.md");

      try {
        const fileContent = await fs.readFile(contentPath, "utf-8");
        const { data, content } = matter(fileContent);

        // Count words
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        documents.push({
          id: data.id || docId,
          name: data.title || "Untitled",
          type: "document",
          description: data.description,
          createdAt: data.created || new Date().toISOString(),
          updatedAt: data.updated || new Date().toISOString(),
          folderId,
          wordCount,
          tags: data.tags || [],
        });
      } catch {
        // Skip invalid documents
        continue;
      }
    }
  } catch {
    // Documents directory doesn't exist in this folder
  }

  return documents;
}

// =============================================================================
// Search
// =============================================================================

/**
 * Search for items across all folders
 *
 * @param query - Search query
 * @param typeFilter - Optional filter by item type
 */
export async function searchItems(
  query: string,
  typeFilter?: ItemType | null
): Promise<AnyItemMetadata[]> {
  const results: AnyItemMetadata[] = [];
  const lowerQuery = query.toLowerCase();

  // Search root folder
  const rootItems = await listItemsInFolder(null, typeFilter);
  results.push(
    ...rootItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
    )
  );

  // Search all subfolders
  const allFolders = await listFoldersInParent(null);
  const folderQueue = [...allFolders];

  while (folderQueue.length > 0) {
    const folder = folderQueue.shift()!;

    // Search items in this folder
    const folderItems = await listItemsInFolder(folder.id, typeFilter);
    results.push(
      ...folderItems.filter(
        (item) =>
          item.type !== "folder" && // Don't include nested folders in search results
          (item.name.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery))
      )
    );

    // Add subfolders to queue
    const subfolders = await listFoldersInParent(folder.id);
    folderQueue.push(...subfolders);
  }

  return results;
}
