/**
 * Folders Service
 *
 * Handles folder CRUD operations for the unified records system.
 * Folders are stored as directories with a folder.json metadata file.
 *
 * Storage structure:
 * _tables/records/
 * ├── [folderId]/
 * │   ├── folder.json          # Folder metadata
 * │   ├── tables/
 * │   │   └── [tableId]/       # Tables in this folder
 * │   └── documents/
 * │       └── [docId]/         # Documents in this folder
 * └── _root/                   # Virtual root (no folder.json needed)
 *     ├── tables/
 *     └── documents/
 */

import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type {
  FolderMetadata,
  FolderTreeNode,
  BreadcrumbItem,
  CreateFolderRequest,
  UpdateFolderRequest,
} from "../types";

const BASE_DIR = path.join(process.cwd(), "_tables", "records");

// =============================================================================
// Path Helpers
// =============================================================================

/**
 * Get the directory path for a folder
 * @param folderId - Folder ID, or null for root
 */
function getFolderDir(folderId: string | null): string {
  if (folderId === null || folderId === "_root") {
    return path.join(BASE_DIR, "_root");
  }
  return path.join(BASE_DIR, folderId);
}

/**
 * Get the path to a folder's metadata file
 */
function getFolderMetadataPath(folderId: string): string {
  return path.join(BASE_DIR, folderId, "folder.json");
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Ensure the records directory structure exists
 */
export async function ensureRecordsDir(): Promise<void> {
  const rootDir = getFolderDir(null);
  await fs.mkdir(path.join(rootDir, "tables"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "documents"), { recursive: true });
}

// =============================================================================
// Folder CRUD Operations
// =============================================================================

/**
 * Create a new folder
 */
export async function createFolder(
  request: CreateFolderRequest
): Promise<FolderMetadata> {
  await ensureRecordsDir();

  const folderId = `fld_${nanoid(12)}`;
  const now = new Date().toISOString();

  const folder: FolderMetadata = {
    id: folderId,
    name: request.name,
    type: "folder",
    createdAt: now,
    updatedAt: now,
    folderId: request.parentId ?? null,
    itemCount: 0,
    color: request.color,
  };

  // Create folder directory structure
  const folderDir = getFolderDir(folderId);
  await fs.mkdir(path.join(folderDir, "tables"), { recursive: true });
  await fs.mkdir(path.join(folderDir, "documents"), { recursive: true });

  // Write folder metadata
  await fs.writeFile(
    getFolderMetadataPath(folderId),
    JSON.stringify(folder, null, 2)
  );

  console.log(`[FoldersService] Created folder: ${folder.name} (${folderId})`);

  return folder;
}

/**
 * Get folder metadata by ID
 */
export async function getFolder(
  folderId: string
): Promise<FolderMetadata | null> {
  try {
    const content = await fs.readFile(getFolderMetadataPath(folderId), "utf-8");
    return JSON.parse(content) as FolderMetadata;
  } catch {
    return null;
  }
}

/**
 * Update folder metadata
 */
export async function updateFolder(
  folderId: string,
  updates: UpdateFolderRequest
): Promise<FolderMetadata | null> {
  const folder = await getFolder(folderId);
  if (!folder) return null;

  const updatedFolder: FolderMetadata = {
    ...folder,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    getFolderMetadataPath(folderId),
    JSON.stringify(updatedFolder, null, 2)
  );

  console.log(`[FoldersService] Updated folder: ${updatedFolder.name}`);

  return updatedFolder;
}

/**
 * Delete a folder and all its contents
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
  const folder = await getFolder(folderId);
  if (!folder) return false;

  try {
    const folderDir = getFolderDir(folderId);
    await fs.rm(folderDir, { recursive: true });
    console.log(`[FoldersService] Deleted folder: ${folder.name}`);
    return true;
  } catch (e) {
    console.error(`[FoldersService] Failed to delete folder: ${folderId}`, e);
    return false;
  }
}

/**
 * List all folders (flat list)
 */
export async function listAllFolders(): Promise<FolderMetadata[]> {
  await ensureRecordsDir();

  const folders: FolderMetadata[] = [];

  try {
    const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "_root") continue; // Skip root pseudo-folder
      if (!entry.name.startsWith("fld_")) continue; // Only process folder directories

      const folder = await getFolder(entry.name);
      if (folder) {
        // Update item count
        folder.itemCount = await countItemsInFolder(entry.name);
        folders.push(folder);
      }
    }
  } catch (e) {
    console.error("[FoldersService] Error listing folders:", e);
  }

  return folders;
}

/**
 * List folders in a specific parent folder
 */
export async function listFoldersInParent(
  parentId: string | null
): Promise<FolderMetadata[]> {
  const allFolders = await listAllFolders();
  return allFolders.filter((f) => f.folderId === parentId);
}

// =============================================================================
// Folder Tree Operations
// =============================================================================

/**
 * Build the complete folder tree for sidebar display
 */
export async function buildFolderTree(): Promise<FolderTreeNode[]> {
  const allFolders = await listAllFolders();

  // Create a map for quick lookup
  const folderMap = new Map<string, FolderTreeNode>();

  // Initialize all nodes
  for (const folder of allFolders) {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.folderId,
      children: [],
      itemCount: folder.itemCount,
    });
  }

  // Build tree by linking children to parents
  const rootNodes: FolderTreeNode[] = [];

  for (const folder of allFolders) {
    const node = folderMap.get(folder.id)!;

    if (folder.folderId === null) {
      // Top-level folder
      rootNodes.push(node);
    } else {
      // Child folder
      const parent = folderMap.get(folder.folderId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    }
  }

  // Sort folders alphabetically
  const sortNodes = (nodes: FolderTreeNode[]): void => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };

  sortNodes(rootNodes);

  return rootNodes;
}

/**
 * Get breadcrumb path for a folder
 */
export async function getBreadcrumbs(
  folderId: string | null
): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: "All Records" }];

  if (folderId === null) {
    return breadcrumbs;
  }

  // Walk up the folder tree
  const path: BreadcrumbItem[] = [];
  let currentId: string | null = folderId;

  while (currentId !== null) {
    const folder = await getFolder(currentId);
    if (!folder) break;

    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.folderId;
  }

  return [...breadcrumbs, ...path];
}

// =============================================================================
// Item Management Helpers
// =============================================================================

/**
 * Count items (tables + documents) in a folder
 */
async function countItemsInFolder(folderId: string | null): Promise<number> {
  const folderDir = getFolderDir(folderId);
  let count = 0;

  try {
    // Count tables
    const tablesDir = path.join(folderDir, "tables");
    try {
      const tables = await fs.readdir(tablesDir);
      count += tables.filter((t) => !t.startsWith(".")).length;
    } catch {
      // Tables directory doesn't exist
    }

    // Count documents
    const docsDir = path.join(folderDir, "documents");
    try {
      const docs = await fs.readdir(docsDir);
      count += docs.filter((d) => !d.startsWith(".")).length;
    } catch {
      // Documents directory doesn't exist
    }

    // Count subfolders if this is root
    if (folderId === null) {
      const folders = await listFoldersInParent(null);
      count += folders.length;
    }
  } catch {
    // Folder doesn't exist
  }

  return count;
}

/**
 * Move an item to a different folder
 */
export async function moveItem(
  itemId: string,
  itemType: "table" | "document",
  targetFolderId: string | null
): Promise<boolean> {
  // Find current location
  const currentLocation = await findItemLocation(itemId, itemType);
  if (!currentLocation) {
    console.error(`[FoldersService] Item not found: ${itemId}`);
    return false;
  }

  const sourceDir = getFolderDir(currentLocation);
  const targetDir = getFolderDir(targetFolderId);
  const subdir = itemType === "table" ? "tables" : "documents";

  const sourcePath = path.join(sourceDir, subdir, itemId);
  const targetPath = path.join(targetDir, subdir, itemId);

  try {
    // Ensure target directory exists
    await fs.mkdir(path.join(targetDir, subdir), { recursive: true });

    // Move the item
    await fs.rename(sourcePath, targetPath);

    console.log(
      `[FoldersService] Moved ${itemType} ${itemId} to folder ${targetFolderId ?? "root"}`
    );
    return true;
  } catch (e) {
    console.error(`[FoldersService] Failed to move item: ${itemId}`, e);
    return false;
  }
}

/**
 * Find which folder an item is currently in
 */
async function findItemLocation(
  itemId: string,
  itemType: "table" | "document"
): Promise<string | null> {
  const subdir = itemType === "table" ? "tables" : "documents";

  // Check root folder first
  const rootPath = path.join(getFolderDir(null), subdir, itemId);
  try {
    await fs.access(rootPath);
    return null; // Item is in root
  } catch {
    // Not in root, check other folders
  }

  // Check all folders
  const folders = await listAllFolders();
  for (const folder of folders) {
    const folderPath = path.join(getFolderDir(folder.id), subdir, itemId);
    try {
      await fs.access(folderPath);
      return folder.id;
    } catch {
      // Not in this folder
    }
  }

  return null; // Item not found
}

/**
 * Check if a folder exists
 */
export async function folderExists(folderId: string): Promise<boolean> {
  if (folderId === "_root" || folderId === null) return true;
  const folder = await getFolder(folderId);
  return folder !== null;
}
