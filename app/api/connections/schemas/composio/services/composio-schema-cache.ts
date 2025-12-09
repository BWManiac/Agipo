/**
 * Composio Schema Cache Service
 * 
 * Handles reading and writing cached Composio tool schemas to disk.
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  CachedToolkit,
  SchemaCacheMeta,
} from "../../types/composio-schemas";

/**
 * Get the path to the schema cache directory
 */
export function getSchemaCachePath(): string {
  return path.join(process.cwd(), "_tables", "composio-schemas");
}

/**
 * Read the cache metadata file
 */
export async function readCacheMeta(): Promise<SchemaCacheMeta | null> {
  try {
    const cachePath = getSchemaCachePath();
    const metaPath = path.join(cachePath, "_meta.json");
    const content = await fs.readFile(metaPath, "utf-8");
    // Data is validated on write, skip validation on read for performance
    return JSON.parse(content) as SchemaCacheMeta;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Write the cache metadata file
 */
export async function writeCacheMeta(meta: SchemaCacheMeta): Promise<void> {
  const cachePath = getSchemaCachePath();
  await fs.mkdir(cachePath, { recursive: true });
  const metaPath = path.join(cachePath, "_meta.json");
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
}

/**
 * Read a cached toolkit file
 */
export async function readToolkitCache(
  toolkitSlug: string
): Promise<CachedToolkit | null> {
  try {
    const cachePath = getSchemaCachePath();
    const toolkitPath = path.join(cachePath, `${toolkitSlug}.json`);
    const content = await fs.readFile(toolkitPath, "utf-8");
    // Data is validated on write, skip validation on read for performance
    return JSON.parse(content) as CachedToolkit;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Write a cached toolkit file
 */
export async function writeToolkitCache(
  toolkit: CachedToolkit
): Promise<void> {
  const cachePath = getSchemaCachePath();
  await fs.mkdir(cachePath, { recursive: true });
  const toolkitPath = path.join(cachePath, `${toolkit.slug}.json`);
  await fs.writeFile(
    toolkitPath,
    JSON.stringify(toolkit, null, 2),
    "utf-8"
  );
}

/**
 * List all cached toolkit slugs
 */
export async function listCachedToolkits(): Promise<string[]> {
  try {
    const cachePath = getSchemaCachePath();
    const entries = await fs.readdir(cachePath);
    return entries
      .filter((entry) => entry.endsWith(".json") && entry !== "_meta.json")
      .map((entry) => entry.replace(".json", ""));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

