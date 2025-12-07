/**
 * Types for cached Composio tool schemas
 * 
 * Defines the structure of cached Composio tool schemas stored locally.
 */

import { z } from "zod";

// JSON Schema type (simplified - Composio uses JSON Schema format)
export type JSONSchema = Record<string, unknown>;

/**
 * Cached schema for a single tool
 */
export const CachedToolSchemaSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  inputParameters: z.record(z.string(), z.unknown()).optional(),
  outputParameters: z.record(z.string(), z.unknown()).optional(),
  toolkitSlug: z.string(),
});

export type CachedToolSchema = z.infer<typeof CachedToolSchemaSchema>;

/**
 * Cached data for a toolkit (all its tools)
 */
export const CachedToolkitSchema = z.object({
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullable().optional(),
  tools: z.array(CachedToolSchemaSchema),
  toolCount: z.number(),
});

export type CachedToolkit = z.infer<typeof CachedToolkitSchema>;

/**
 * Metadata about the schema cache sync
 */
export const SchemaCacheMetaSchema = z.object({
  lastSyncedAt: z.string(),
  toolkitCount: z.number(),
  totalToolCount: z.number(),
  syncDurationMs: z.number(),
});

export type SchemaCacheMeta = z.infer<typeof SchemaCacheMetaSchema>;
