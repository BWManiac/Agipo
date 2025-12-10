// Version management service for document history

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { Document, DocumentVersion, DocumentFrontmatter } from "./types";

const DOCS_DIR = path.join(process.cwd(), "_tables", "documents");
const MAX_VERSIONS = 50;

function getVersionsDir(docId: string): string {
  return path.join(DOCS_DIR, docId, "_versions");
}

function getVersionPath(docId: string, versionId: string): string {
  return path.join(getVersionsDir(docId), `${versionId}.md`);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function createVersion(
  docId: string,
  document: Document,
  author: { type: "user" | "agent"; id: string; name: string },
  summary?: string
): Promise<DocumentVersion> {
  const versionsDir = getVersionsDir(docId);
  await fs.mkdir(versionsDir, { recursive: true });

  const versionId = `v_${Date.now()}`;
  const versionPath = getVersionPath(docId, versionId);

  // Create version content with frontmatter
  const versionContent = matter.stringify(document.content, {
    ...document.frontmatter,
    version_id: versionId,
    version_author: author,
    version_summary: summary,
  });

  await fs.writeFile(versionPath, versionContent, "utf-8");

  // Prune old versions if needed
  await pruneOldVersions(docId);

  return {
    id: versionId,
    timestamp: new Date().toISOString(),
    author,
    wordCount: countWords(document.content),
    summary,
  };
}

export async function listVersions(docId: string): Promise<DocumentVersion[]> {
  const versionsDir = getVersionsDir(docId);

  try {
    const files = await fs.readdir(versionsDir);
    const versions: DocumentVersion[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const versionPath = path.join(versionsDir, file);
      const content = await fs.readFile(versionPath, "utf-8");
      const { data } = matter(content);

      versions.push({
        id: file.replace(".md", ""),
        timestamp: data.updated || data.created || new Date().toISOString(),
        author: data.version_author || { type: "user", id: "unknown", name: "Unknown" },
        wordCount: countWords(content),
        summary: data.version_summary,
      });
    }

    // Sort by timestamp, newest first
    versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return versions;
  } catch {
    return [];
  }
}

export async function getVersion(
  docId: string,
  versionId: string
): Promise<Document | null> {
  const versionPath = getVersionPath(docId, versionId);

  try {
    const content = await fs.readFile(versionPath, "utf-8");
    const { data, content: bodyContent } = matter(content);

    return {
      frontmatter: data as DocumentFrontmatter,
      content: bodyContent,
    };
  } catch {
    return null;
  }
}

export async function restoreVersion(
  docId: string,
  versionId: string
): Promise<Document | null> {
  const version = await getVersion(docId, versionId);
  if (!version) return null;

  // The actual restoration is handled by the route
  // This just returns the version content
  return version;
}

async function pruneOldVersions(docId: string): Promise<void> {
  const versions = await listVersions(docId);

  if (versions.length > MAX_VERSIONS) {
    const toDelete = versions.slice(MAX_VERSIONS);
    for (const version of toDelete) {
      const versionPath = getVersionPath(docId, version.id);
      try {
        await fs.unlink(versionPath);
      } catch {
        // Ignore errors
      }
    }
  }
}
