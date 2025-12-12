/**
 * Document I/O Service
 *
 * Handles document CRUD operations for the unified records system.
 * Documents are stored as markdown files with frontmatter.
 *
 * Storage structure:
 * _tables/records/[folderId]/documents/[docId]/
 * ├── content.md        # Document content with frontmatter
 * └── _versions/        # Version history
 */

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import type {
  Document,
  DocumentFrontmatter,
  DocumentVersion,
  CreateDocumentRequest,
  UpdateDocumentRequest,
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

function getDocDir(docId: string, folderId: string | null): string {
  return path.join(getFolderDir(folderId), "documents", docId);
}

function getDocPath(docId: string, folderId: string | null): string {
  return path.join(getDocDir(docId, folderId), "content.md");
}

function getVersionsDir(docId: string, folderId: string | null): string {
  return path.join(getDocDir(docId, folderId), "_versions");
}

// =============================================================================
// Initialization
// =============================================================================

async function ensureDocsDir(folderId: string | null): Promise<void> {
  const docsDir = path.join(getFolderDir(folderId), "documents");
  await fs.mkdir(docsDir, { recursive: true });
}

// =============================================================================
// Document CRUD Operations
// =============================================================================

/**
 * Create a new document
 */
export async function createDocument(
  request: CreateDocumentRequest
): Promise<Document> {
  const folderId = request.folderId ?? null;
  await ensureDocsDir(folderId);

  const docId = `doc_${nanoid(12)}`;
  const now = new Date().toISOString();

  const frontmatter: DocumentFrontmatter = {
    id: docId,
    title: request.title || "Untitled",
    created: now,
    updated: now,
    author: "user",
    tags: [],
    agentsWithAccess: [],
    folderId,
  };

  const content = "";
  const fileContent = matter.stringify(content, frontmatter);

  const docDir = getDocDir(docId, folderId);
  await fs.mkdir(docDir, { recursive: true });
  await fs.mkdir(getVersionsDir(docId, folderId), { recursive: true });
  await fs.writeFile(getDocPath(docId, folderId), fileContent, "utf-8");

  console.log(`[DocumentIO] Created document: ${frontmatter.title} (${docId})`);

  return { frontmatter, content };
}

/**
 * Get a document by ID
 *
 * @param docId - Document ID
 * @param folderId - Folder to look in (null for root, undefined to search all folders)
 */
export async function getDocument(
  docId: string,
  folderId?: string | null
): Promise<Document | null> {
  // If folderId is specified, look only in that folder
  if (folderId !== undefined) {
    return getDocumentFromFolder(docId, folderId);
  }

  // Otherwise, search all folders
  const location = await findDocumentLocation(docId);
  if (!location.found) return null;

  return getDocumentFromFolder(docId, location.folderId);
}

async function getDocumentFromFolder(
  docId: string,
  folderId: string | null
): Promise<Document | null> {
  const docPath = getDocPath(docId, folderId);

  try {
    const fileContent = await fs.readFile(docPath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      frontmatter: {
        ...data,
        folderId,
      } as DocumentFrontmatter,
      content,
    };
  } catch {
    return null;
  }
}

/**
 * Update a document
 */
export async function updateDocument(
  docId: string,
  updates: UpdateDocumentRequest,
  folderId?: string | null
): Promise<{ document: Document; version?: DocumentVersion } | null> {
  // Find document location if not specified
  let actualFolderId = folderId;
  if (actualFolderId === undefined) {
    const location = await findDocumentLocation(docId);
    if (!location.found) return null;
    actualFolderId = location.folderId;
  }

  const existing = await getDocumentFromFolder(docId, actualFolderId!);
  if (!existing) return null;

  const now = new Date().toISOString();

  // Save version before updating (if content changed)
  let version: DocumentVersion | undefined;
  if (updates.content !== undefined) {
    version = await saveVersion(docId, actualFolderId!, existing);
  }

  // Update frontmatter
  const updatedFrontmatter: DocumentFrontmatter = {
    ...existing.frontmatter,
    updated: now,
  };

  if (updates.title !== undefined) {
    updatedFrontmatter.title = updates.title;
  }

  if (updates.description !== undefined) {
    updatedFrontmatter.description = updates.description;
  }

  if (updates.tags !== undefined) {
    updatedFrontmatter.tags = updates.tags;
  }

  // Update content
  let updatedContent = existing.content;
  if (updates.content !== undefined) {
    // If full content with frontmatter provided, parse it
    if (updates.content.startsWith("---")) {
      const { data, content } = matter(updates.content);
      if (data.title) updatedFrontmatter.title = data.title;
      if (data.tags) updatedFrontmatter.tags = data.tags;
      if (data.description) updatedFrontmatter.description = data.description;
      updatedContent = content;
    } else {
      updatedContent = updates.content;
    }
  }

  // Write file
  const fileContent = matter.stringify(updatedContent, updatedFrontmatter);
  await fs.writeFile(getDocPath(docId, actualFolderId!), fileContent, "utf-8");

  console.log(`[DocumentIO] Updated document: ${updatedFrontmatter.title}`);

  return {
    document: {
      frontmatter: updatedFrontmatter,
      content: updatedContent,
    },
    version,
  };
}

/**
 * Delete a document
 */
export async function deleteDocument(
  docId: string,
  folderId?: string | null
): Promise<boolean> {
  // Find document location if not specified
  let actualFolderId = folderId;
  if (actualFolderId === undefined) {
    const location = await findDocumentLocation(docId);
    if (!location.found) return false;
    actualFolderId = location.folderId;
  }

  const docDir = getDocDir(docId, actualFolderId!);

  try {
    await fs.rm(docDir, { recursive: true });
    console.log(`[DocumentIO] Deleted document: ${docId}`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Version Management
// =============================================================================

async function saveVersion(
  docId: string,
  folderId: string | null,
  document: Document
): Promise<DocumentVersion> {
  const versionsDir = getVersionsDir(docId, folderId);
  await fs.mkdir(versionsDir, { recursive: true });

  const versionId = `v_${Date.now()}`;
  const versionPath = path.join(versionsDir, `${versionId}.md`);

  // Save current content as version
  const fileContent = matter.stringify(document.content, document.frontmatter);
  await fs.writeFile(versionPath, fileContent, "utf-8");

  const wordCount = document.content.trim().split(/\s+/).filter(Boolean).length;

  return {
    id: versionId,
    timestamp: new Date().toISOString(),
    author: {
      type: "user",
      id: "user",
      name: "User",
    },
    wordCount,
  };
}

/**
 * List versions of a document
 */
export async function listVersions(
  docId: string,
  folderId?: string | null
): Promise<DocumentVersion[]> {
  // Find document location if not specified
  let actualFolderId = folderId;
  if (actualFolderId === undefined) {
    const location = await findDocumentLocation(docId);
    if (!location.found) return [];
    actualFolderId = location.folderId;
  }

  const versionsDir = getVersionsDir(docId, actualFolderId!);
  const versions: DocumentVersion[] = [];

  try {
    const files = await fs.readdir(versionsDir);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const versionId = file.replace(".md", "");
      const versionPath = path.join(versionsDir, file);

      try {
        const fileContent = await fs.readFile(versionPath, "utf-8");
        const { content } = matter(fileContent);
        const stats = await fs.stat(versionPath);
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        versions.push({
          id: versionId,
          timestamp: stats.mtime.toISOString(),
          author: { type: "user", id: "user", name: "User" },
          wordCount,
        });
      } catch {
        continue;
      }
    }
  } catch {
    // Versions directory doesn't exist
  }

  // Sort by timestamp, newest first
  versions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return versions;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Find which folder a document is in
 */
async function findDocumentLocation(
  docId: string
): Promise<{ found: boolean; folderId: string | null }> {
  // Check root folder
  const rootPath = getDocPath(docId, null);
  try {
    await fs.access(rootPath);
    return { found: true, folderId: null };
  } catch {
    // Not in root
  }

  // Check all folders
  try {
    const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "_root") continue;
      if (!entry.name.startsWith("fld_")) continue;

      const folderDocPath = getDocPath(docId, entry.name);
      try {
        await fs.access(folderDocPath);
        return { found: true, folderId: entry.name };
      } catch {
        // Not in this folder
      }
    }
  } catch {
    // Error reading directory
  }

  return { found: false, folderId: null };
}

/**
 * Check if a document exists
 */
export async function documentExists(docId: string): Promise<boolean> {
  const location = await findDocumentLocation(docId);
  return location.found;
}
