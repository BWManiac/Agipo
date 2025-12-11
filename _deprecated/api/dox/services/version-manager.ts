/**
 * Version Manager Service
 * 
 * Handles version tracking, comparison, and restoration.
 */

import fs from "fs/promises";
import path from "path";
import { readDocument, writeDocument } from "./document-storage";
import diff_match_patch from "diff-match-patch";

const BASE_DIR = path.join(process.cwd(), "_tables", "dox");

export interface DocumentVersion {
  id: string;
  docId: string;
  content: string;
  properties: Record<string, unknown>;
  wordCount: number;
  wordsDelta: number;
  summary: string;
  createdAt: string;
  createdBy: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Create a new version of a document.
 */
export async function createVersion(
  docId: string,
  content: string,
  properties: Record<string, unknown>,
  createdBy: { type: "user" | "agent"; id: string; name: string; avatar?: string }
): Promise<DocumentVersion> {
  const versionId = `v-${Date.now()}`;
  const versionsDir = path.join(BASE_DIR, docId, "versions");
  await fs.mkdir(versionsDir, { recursive: true });

  // Calculate word count
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

  // Get previous version for delta
  const previousVersions = await listVersions(docId);
  const previousWordCount = previousVersions[0]?.wordCount || 0;
  const wordsDelta = wordCount - previousWordCount;

  const version: DocumentVersion = {
    id: versionId,
    docId,
    content,
    properties,
    wordCount,
    wordsDelta,
    summary: `Version ${previousVersions.length + 1}`,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  const versionFile = path.join(versionsDir, `${versionId}.json`);
  await fs.writeFile(versionFile, JSON.stringify(version, null, 2));

  return version;
}

/**
 * List all versions for a document.
 */
export async function listVersions(docId: string): Promise<DocumentVersion[]> {
  const versionsDir = path.join(BASE_DIR, docId, "versions");
  
  try {
    const files = await fs.readdir(versionsDir);
    const versionFiles = files.filter((f) => f.endsWith(".json"));
    
    const versions = await Promise.all(
      versionFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(versionsDir, file),
          "utf-8"
        );
        return JSON.parse(content) as DocumentVersion;
      })
    );

    // Sort by createdAt descending
    return versions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Get a specific version.
 */
export async function getVersion(
  docId: string,
  versionId: string
): Promise<DocumentVersion | null> {
  try {
    const versionFile = path.join(BASE_DIR, docId, "versions", `${versionId}.json`);
    const content = await fs.readFile(versionFile, "utf-8");
    return JSON.parse(content) as DocumentVersion;
  } catch {
    return null;
  }
}

/**
 * Compare two versions.
 */
export async function compareVersions(
  docId: string,
  versionId1: string,
  versionId2: string
): Promise<{
  from: DocumentVersion;
  to: DocumentVersion;
  diff: {
    unified: string;
    stats: {
      additions: number;
      deletions: number;
    };
  };
} | null> {
  const version1 = await getVersion(docId, versionId1);
  const version2 = await getVersion(docId, versionId2);

  if (!version1 || !version2) {
    return null;
  }

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(version1.content, version2.content);
  dmp.diff_cleanupSemantic(diffs);

  const unified = dmp.diff_prettyHtml(diffs);
  const stats = {
    additions: diffs.filter((d) => d[0] === 1).reduce((sum, d) => sum + d[1].length, 0),
    deletions: diffs.filter((d) => d[0] === -1).reduce((sum, d) => sum + d[1].length, 0),
  };

  return {
    from: version1,
    to: version2,
    diff: {
      unified,
      stats,
    },
  };
}

/**
 * Restore a version (creates a new version from old content).
 */
export async function restoreVersion(
  docId: string,
  versionId: string,
  createdBy: { type: "user" | "agent"; id: string; name: string; avatar?: string }
): Promise<DocumentVersion> {
  const version = await getVersion(docId, versionId);
  if (!version) {
    throw new Error("Version not found");
  }

  // Create new version from old content
  const newVersion = await createVersion(
    docId,
    version.content,
    version.properties,
    createdBy
  );

  // Update document
  await writeDocument(docId, {
    content: version.content,
    properties: version.properties,
  });

  return newVersion;
}
