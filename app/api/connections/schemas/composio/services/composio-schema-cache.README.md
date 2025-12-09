# Composio Schema Cache Service

> Handles reading and writing cached Composio tool schemas to disk.

**Service:** `composio-schema-cache.ts`  
**Domain:** Connections → Schemas

---

## Purpose

This service manages the local cache of Composio tool schemas stored in `_tables/composio-schemas/`. It provides operations for reading/writing cache metadata and toolkit cache files. The cache improves performance and reduces API rate limits by storing tool schemas locally instead of fetching from Composio API on every request.

**Product Value:** Makes tool schema discovery fast and reliable. Without caching, every tool list request would hit the Composio API, causing slow responses and potential rate limit issues. The cache provides instant schema access for better user experience.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getSchemaCachePath()` | Returns the path to the schema cache directory. | When you need the cache directory path |
| `readCacheMeta()` | Reads the cache metadata file (_meta.json) with cache timestamp and version info. | When checking cache status or validity |
| `writeCacheMeta()` | Writes the cache metadata file with timestamp and version information. | When updating cache (after sync operations) |
| `readToolkitCache()` | Reads a cached toolkit schema file ({toolkitSlug}.json). | When fetching tool schemas for a specific toolkit |
| `writeToolkitCache()` | Writes a toolkit schema to cache file. | When caching toolkit schemas during sync operations |
| `listCachedToolkits()` | Lists all toolkit slugs that have cached schema files. | When checking what toolkits are cached |

---

## Approach

The service uses a simple file-based cache structure: `_tables/composio-schemas/_meta.json` for metadata and `_tables/composio-schemas/{toolkitSlug}.json` for each toolkit's schema. Files are read/written as JSON with minimal validation (assumes data is validated on write). The service handles missing files gracefully, returning null for reads and creating directories as needed for writes.

---

## Public API

### `getSchemaCachePath(): string`

**What it does:** Returns the absolute path to the schema cache directory.

**Product Impact:** Other services need the cache path to access cached schemas. This function provides a single source of truth for the cache location.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | string | Absolute path to `_tables/composio-schemas/` directory |

---

### `readCacheMeta(): Promise<SchemaCacheMeta | null>`

**What it does:** Reads the cache metadata file (_meta.json) containing cache timestamp and version information.

**Product Impact:** Routes can check cache freshness to determine if a sync is needed. Cache metadata provides information about when the cache was last updated.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<SchemaCacheMeta \| null> | Cache metadata object or null if file doesn't exist |

**Process:**

```
readCacheMeta(): Promise<SchemaCacheMeta | null>
├── Build file path: _tables/composio-schemas/_meta.json
├── **Try to read file**
├── Parse JSON content
└── Return parsed metadata or null if file doesn't exist
```

---

### `writeCacheMeta(meta: SchemaCacheMeta): Promise<void>`

**What it does:** Writes the cache metadata file with timestamp and version information.

**Product Impact:** After sync operations update the cache, this function records when the cache was last updated, enabling cache freshness checks.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `meta` | SchemaCacheMeta | Yes | Cache metadata object with timestamp, version, etc. |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully written |

**Process:**

```
writeCacheMeta(meta): Promise<void>
├── Get cache directory path
├── **Create directory** if it doesn't exist (recursive)
├── Build file path: _meta.json
├── Write metadata with JSON.stringify(meta, null, 2)
└── Return (void)
```

---

### `readToolkitCache(toolkitSlug: string): Promise<CachedToolkit | null>`

**What it does:** Reads a cached toolkit schema file, returning the toolkit data or null if not cached.

**Product Impact:** When fetching tool schemas for a toolkit, this function provides cached data instantly instead of hitting the Composio API. This improves performance and reduces rate limits.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkitSlug` | string | Yes | Toolkit slug (e.g., "gmail", "slack") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<CachedToolkit \| null> | Cached toolkit schema object or null if not cached |

**Process:**

```
readToolkitCache(toolkitSlug): Promise<CachedToolkit | null>
├── Build file path: _tables/composio-schemas/{toolkitSlug}.json
├── **Try to read file**
├── Parse JSON content
└── Return parsed toolkit or null if file doesn't exist
```

---

### `writeToolkitCache(toolkit: CachedToolkit): Promise<void>`

**What it does:** Writes a toolkit schema to cache file for later retrieval.

**Product Impact:** During sync operations, this function caches toolkit schemas so they can be retrieved instantly later. This is the write side of the cache.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkit` | CachedToolkit | Yes | Toolkit schema object with slug, tools, etc. |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully written |

**Process:**

```
writeToolkitCache(toolkit): Promise<void>
├── Get cache directory path
├── **Create directory** if it doesn't exist (recursive)
├── Build file path: {toolkit.slug}.json
├── Write toolkit with JSON.stringify(toolkit, null, 2)
└── Return (void)
```

---

### `listCachedToolkits(): Promise<string[]>`

**What it does:** Lists all toolkit slugs that have cached schema files.

**Product Impact:** Provides a way to see what toolkits are cached, useful for cache management and debugging.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<string[]> | Array of toolkit slugs that have cache files |

**Process:**

```
listCachedToolkits(): Promise<string[]>
├── Get cache directory path
├── **Scan directory** for JSON files
├── Filter out _meta.json
├── Extract toolkit slugs from filenames (remove .json extension)
└── Return slugs array
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations |
| `path` | Path resolution |
| `../../types/composio-schemas` | Type definitions for cache data |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Schema Sync Route | `app/api/connections/schemas/composio/sync/route.ts` | Writes to cache during sync |
| Cached Schema Routes | `app/api/connections/schemas/composio/cached/*/route.ts` | Reads from cache for fast schema access |

---

## Design Decisions

### Why skip validation on read?

**Decision:** Cache files are read without Zod validation, assuming data was validated on write.

**Rationale:** Validation is expensive. Since cache files are only written by our sync operations (which validate), we can trust cached data. This improves read performance.

### Why pretty-printed JSON?

**Decision:** Cache files are written with `JSON.stringify(data, null, 2)` for readability.

**Rationale:** Makes cache files inspectable and git-friendly (meaningful diffs). Performance trade-off is acceptable for cache files which are read more often than written.

---

## Error Handling

- Missing directories: Automatically created with `recursive: true`
- Missing files: Return null gracefully (cache miss is normal)
- File read errors: Return null (handled as cache miss)

---

## Related Docs

- [Schema Sync Route README](../../schemas/composio/sync/README.md) - Writes to cache
- [Composio Schema Types](../../types/composio-schemas.ts) - Type definitions

---

## Future Improvements

- [ ] Add cache invalidation/expiration
- [ ] Add cache compression for large schemas
- [ ] Add cache versioning/migration
- [ ] Add cache statistics/metrics
- [ ] Add cache cleanup utilities

