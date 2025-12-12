// Document I/O Service - File system operations for documents

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import type {
  Document,
  DocumentFrontmatter,
  DocumentListItem,
  UpdateDocumentRequest,
} from "./types";

const DOCS_DIR = path.join(process.cwd(), "_tables", "documents");
const RECORDS_DIR = path.join(process.cwd(), "_tables", "records");

// Ensure documents directory exists
async function ensureDocsDir(): Promise<void> {
  await fs.mkdir(DOCS_DIR, { recursive: true });
}

// Get document directory path
function getDocDir(docId: string): string {
  return path.join(DOCS_DIR, docId);
}

// Get document file path
function getDocPath(docId: string): string {
  return path.join(getDocDir(docId), "content.md");
}

// Find document in the new records structure (searches all folders)
async function findDocInRecords(docId: string): Promise<string | null> {
  // Check root folder first
  const rootPath = path.join(RECORDS_DIR, "_root", "documents", docId, "content.md");
  try {
    await fs.access(rootPath);
    return rootPath;
  } catch {
    // Not in root
  }

  // Check all folders
  try {
    const entries = await fs.readdir(RECORDS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "_root") continue;
      if (!entry.name.startsWith("fld_")) continue;

      const folderDocPath = path.join(RECORDS_DIR, entry.name, "documents", docId, "content.md");
      try {
        await fs.access(folderDocPath);
        return folderDocPath;
      } catch {
        // Not in this folder
      }
    }
  } catch {
    // Error reading directory
  }

  return null;
}

// Get versions directory path
function getVersionsDir(docId: string): string {
  return path.join(getDocDir(docId), "_versions");
}

// Count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// List all documents
export async function listDocuments(): Promise<DocumentListItem[]> {
  await ensureDocsDir();

  let entries;
  try {
    entries = await fs.readdir(DOCS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const documents: DocumentListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;

    const docPath = getDocPath(entry.name);
    try {
      const fileContent = await fs.readFile(docPath, "utf-8");
      const { data, content } = matter(fileContent);
      const frontmatter = data as DocumentFrontmatter;

      documents.push({
        id: frontmatter.id || entry.name,
        title: frontmatter.title || "Untitled",
        description: frontmatter.description,
        updated: frontmatter.updated || new Date().toISOString(),
        wordCount: countWords(content),
        tags: frontmatter.tags || [],
      });
    } catch {
      // Skip invalid documents
      continue;
    }
  }

  // Sort by updated date, newest first
  documents.sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
  );

  return documents;
}

// Get single document
export async function getDocument(docId: string): Promise<Document | null> {
  // Try the legacy location first
  const docPath = getDocPath(docId);

  try {
    const fileContent = await fs.readFile(docPath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      frontmatter: data as DocumentFrontmatter,
      content,
    };
  } catch {
    // Not found in legacy location, try new records structure
  }

  // Try finding in the new records structure
  const recordsPath = await findDocInRecords(docId);
  if (recordsPath) {
    try {
      const fileContent = await fs.readFile(recordsPath, "utf-8");
      const { data, content } = matter(fileContent);

      return {
        frontmatter: data as DocumentFrontmatter,
        content,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// Create new document
export async function createDocument(title?: string): Promise<Document> {
  await ensureDocsDir();

  const docId = `doc_${nanoid(12)}`;
  const now = new Date().toISOString();

  const frontmatter: DocumentFrontmatter = {
    id: docId,
    title: title || "Untitled",
    created: now,
    updated: now,
    author: "user",
    tags: [],
    agents_with_access: [],
  };

  const content = "";
  const fileContent = matter.stringify(content, frontmatter);

  const docDir = getDocDir(docId);
  await fs.mkdir(docDir, { recursive: true });
  await fs.mkdir(getVersionsDir(docId), { recursive: true });
  await fs.writeFile(getDocPath(docId), fileContent, "utf-8");

  return { frontmatter, content };
}

// Find actual document path (checks both legacy and new locations)
async function findDocPath(docId: string): Promise<string | null> {
  const legacyPath = getDocPath(docId);
  try {
    await fs.access(legacyPath);
    return legacyPath;
  } catch {
    // Not in legacy location
  }

  return await findDocInRecords(docId);
}

// Update document
export async function updateDocument(
  docId: string,
  updates: UpdateDocumentRequest
): Promise<{ document: Document } | null> {
  const existing = await getDocument(docId);
  if (!existing) return null;

  const now = new Date().toISOString();

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
      // Preserve certain frontmatter fields from the update
      if (data.title) updatedFrontmatter.title = data.title;
      if (data.tags) updatedFrontmatter.tags = data.tags;
      if (data.description) updatedFrontmatter.description = data.description;
      updatedContent = content;
    } else {
      updatedContent = updates.content;
    }
  }

  // Find actual document path and write file
  const docPath = await findDocPath(docId);
  if (!docPath) return null;

  const fileContent = matter.stringify(updatedContent, updatedFrontmatter);
  await fs.writeFile(docPath, fileContent, "utf-8");

  return {
    document: {
      frontmatter: updatedFrontmatter,
      content: updatedContent,
    },
  };
}

// Delete document
export async function deleteDocument(docId: string): Promise<boolean> {
  // Try legacy location first
  const legacyDir = getDocDir(docId);
  try {
    await fs.rm(legacyDir, { recursive: true });
    return true;
  } catch {
    // Not in legacy location
  }

  // Try new records location
  const recordsPath = await findDocInRecords(docId);
  if (recordsPath) {
    try {
      // Remove the document directory (parent of content.md)
      const docDir = path.dirname(recordsPath);
      await fs.rm(docDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

// Check if document exists
export async function documentExists(docId: string): Promise<boolean> {
  // Check legacy location
  try {
    await fs.access(getDocPath(docId));
    return true;
  } catch {
    // Not in legacy location
  }

  // Check new records location
  const recordsPath = await findDocInRecords(docId);
  return recordsPath !== null;
}
