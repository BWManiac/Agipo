/**
 * Document Storage Service
 * 
 * File I/O operations for reading and writing documents.
 * 
 * Pattern: Following Records io.ts pattern
 */

import fs from "fs/promises";
import path from "path";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter";
import { nanoid } from "nanoid";

const BASE_DIR = path.join(process.cwd(), "_tables", "dox");
const INDEX_FILE = path.join(BASE_DIR, "index.ts");

export interface DocumentData {
  id: string;
  title: string;
  content: string; // Markdown content
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ensure the DOX base directory exists.
 */
async function ensureBaseDir(): Promise<void> {
  await fs.mkdir(BASE_DIR, { recursive: true });
}

/**
 * Read the document registry.
 */
async function readRegistry(): Promise<string[]> {
  try {
    await ensureBaseDir();
    const content = await fs.readFile(INDEX_FILE, "utf-8");
    // Extract array from: export const documentIds: string[] = [...];
    const match = content.match(/export const documentIds: string\[\] = \[([\s\S]*?)\];/);
    if (!match) return [];
    
    const idsStr = match[1].trim();
    if (!idsStr) return [];
    
    // Parse IDs (handling comments and strings)
    const ids = idsStr
      .split(",")
      .map((id) => id.trim().replace(/["']/g, ""))
      .filter((id) => id && !id.startsWith("//"));
    
    return ids;
  } catch {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Write the document registry.
 */
async function writeRegistry(docIds: string[]): Promise<void> {
  await ensureBaseDir();
  const content = `/**
 * DOX Document Registry
 * 
 * Central registry of all document IDs. This enables fast catalog listing
 * without scanning directories.
 * 
 * Pattern: Following Records catalog pattern but using index file for simplicity.
 */

export const documentIds: string[] = [
${docIds.map((id) => `  "${id}",`).join("\n")}
];
`;
  await fs.writeFile(INDEX_FILE, content, "utf-8");
}

/**
 * Read a document from storage.
 * 
 * @param docId - Document ID
 * @returns Document data or null if not found
 */
export async function readDocument(docId: string): Promise<DocumentData | null> {
  try {
    const filePath = path.join(BASE_DIR, docId, "content.md");
    const markdown = await fs.readFile(filePath, "utf-8");
    
    const { frontmatter, content } = parseFrontmatter(markdown);
    
    return {
      id: docId,
      title: (frontmatter.title as string) || "Untitled Document",
      content,
      properties: frontmatter,
      createdAt: (frontmatter.created as string) || new Date().toISOString(),
      updatedAt: (frontmatter.updated as string) || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Write a document to storage.
 * 
 * @param docId - Document ID
 * @param data - Document data
 */
export async function writeDocument(
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  await ensureBaseDir();
  
  // Read existing document to preserve properties
  const existing = await readDocument(docId);
  
  const now = new Date().toISOString();
  const frontmatter: Record<string, unknown> = {
    ...existing?.properties,
    ...data.properties,
    title: data.title ?? existing?.title ?? "Untitled Document",
    updated: now,
    ...(existing ? {} : { created: now }),
  };
  
  const content = data.content ?? existing?.content ?? "";
  const markdown = serializeFrontmatter(frontmatter, content);
  
  const docDir = path.join(BASE_DIR, docId);
  await fs.mkdir(docDir, { recursive: true });
  
  const filePath = path.join(docDir, "content.md");
  await fs.writeFile(filePath, markdown, "utf-8");
  
  // Update registry
  const registry = await readRegistry();
  if (!registry.includes(docId)) {
    registry.push(docId);
    await writeRegistry(registry);
  }
}

/**
 * Delete a document from storage.
 * 
 * @param docId - Document ID
 */
export async function deleteDocument(docId: string): Promise<void> {
  try {
    const docDir = path.join(BASE_DIR, docId);
    await fs.rm(docDir, { recursive: true, force: true });
    
    // Update registry
    const registry = await readRegistry();
    const updated = registry.filter((id) => id !== docId);
    await writeRegistry(updated);
  } catch {
    // Ignore errors (file might not exist)
  }
}

/**
 * List all document IDs.
 * 
 * @returns Array of document IDs
 */
export async function listDocuments(): Promise<string[]> {
  return readRegistry();
}

/**
 * Generate a new document ID.
 * 
 * @returns New document ID
 */
export function generateDocId(): string {
  return `doc-${nanoid()}`;
}
