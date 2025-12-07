# Phase 6: Schema Discovery

**Status:** 📋 Planned  
**Depends On:** Phase 5 (Control Flow Visualization)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build a **Schema Discovery API** that fetches and caches all Composio tool schemas locally. This enables the workflow editor to know what inputs each tool requires and what outputs it produces—essential for data mapping in Phase 7.

After this phase:
- All Composio tool schemas are cached in `_tables/composio-schemas/`
- The workflow editor can look up any tool's input/output schema instantly
- We have concrete knowledge of what Gmail, Slack, Firecrawl tools actually return

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage location | `_tables/composio-schemas/` | File-based, version-controllable, no DB needed |
| File structure | One JSON per toolkit | Manageable file sizes, easy to inspect individual toolkits |
| Sync trigger | Manual API call | Start simple; can add cron later |
| Cache format | Raw Composio schema + normalized fields | Preserve original, add convenience fields |

### Pertinent Research

- **Gmail schemas are rich**: `GMAIL_FETCH_EMAILS` output includes typed fields like `messages[].subject`, `messages[].sender`, `messages[].messageText` (verified via live query)
- **Most tools have `data` wrapper**: Output follows `{ data: {...}, error: string, successful: boolean }` pattern
- **Some tools have detailed `data`**: Firecrawl has 11 typed output fields; Gmail has nested message objects
- **JSON Schema format**: Composio uses JSON Schema for `inputParameters` and `outputParameters`

*Source: Live Composio API query, `15.2-workflow-research.md`*

### Overall File Impact

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/composio-schemas/_meta.json` | Create | Tracks sync metadata (lastSyncedAt, toolkitCount) | A |
| `_tables/composio-schemas/{toolkit}.json` | Create | Cached schemas for each toolkit's tools | A |
| `app/api/workflows-f/schemas/sync/route.ts` | Create | POST endpoint to trigger schema sync from Composio | A |
| `app/api/workflows-f/schemas/route.ts` | Create | GET endpoint to list all cached toolkits (summary) | B |
| `app/api/workflows-f/schemas/all/route.ts` | Create | GET endpoint to get ALL toolkits with ALL tools (for Tools Panel) | B |
| `app/api/workflows-f/schemas/[toolkit]/route.ts` | Create | GET endpoint to get tools for a specific toolkit | B |
| `app/api/workflows-f/schemas/[toolkit]/[tool]/route.ts` | Create | GET endpoint to get schema for a specific tool | B |
| `app/api/workflows-f/services/schema-cache.ts` | Create | Service for reading/writing schema cache files | A |
| `app/api/workflows-f/types/schemas.ts` | Create | Types for cached schema data structures | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-6.1 | Sync creates `_meta.json` with timestamp | POST sync → check file exists with `lastSyncedAt` | A |
| AC-6.2 | Sync creates toolkit JSON files | POST sync → `gmail.json`, `slack.json` etc. exist | A |
| AC-6.3 | Each toolkit file contains tools with schemas | Read `gmail.json` → has `GMAIL_SEND_EMAIL` with `inputParameters` | A |
| AC-6.4 | GET `/schemas` returns toolkit summary list | Call endpoint → array of toolkit slugs with counts | B |
| AC-6.5 | GET `/schemas/all` returns ALL toolkits with ALL tools | Call endpoint → complete data for Tools Panel | B |
| AC-6.6 | GET `/schemas/gmail` returns Gmail tools | Call endpoint → tools array with schemas | B |
| AC-6.7 | GET `/schemas/gmail/GMAIL_SEND_EMAIL` returns single tool | Call endpoint → input/output schemas | B |
| AC-6.8 | Cached schemas match Composio source | Compare cached vs live query → identical | A |

### User Flows (Phase Level)

#### Flow 1: Admin Syncs Schemas

```
1. Admin calls POST /api/workflows-f/schemas/sync
2. System fetches all toolkits from Composio
3. For each toolkit, fetches all tools with schemas
4. Writes {toolkit}.json files to _tables/composio-schemas/
5. Updates _meta.json with sync timestamp
6. Returns { success: true, toolkits: 45, tools: 1200, duration: "12s" }
```

#### Flow 2: Tools Panel Bulk Load

```
1. User opens workflow editor
2. Tools Panel calls GET /api/workflows-f/schemas/all
3. API reads all cached toolkit files
4. Returns all toolkits with tool names (no full schemas)
5. Tools Panel displays searchable, grouped tool list
```

#### Flow 3: Step Configuration

```
1. User drags "Gmail: Send Email" tool to workflow
2. User clicks step to configure it
3. Config panel calls GET /api/workflows-f/schemas/gmail/GMAIL_SEND_EMAIL
4. API returns full schema with inputParameters/outputParameters
5. Config panel renders form with input fields
```

---

## Part A: Schema Sync Infrastructure

### Goal

Build the sync mechanism that fetches all Composio schemas and caches them locally. This runs manually for now (admin triggers it), but provides the foundation for automatic syncing later.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows-f/types/schemas.ts` | Create | Type definitions for cached schema structures | ~60 |
| `app/api/workflows-f/services/schema-cache.ts` | Create | Read/write operations for schema cache files | ~150 |
| `app/api/workflows-f/schemas/sync/route.ts` | Create | POST endpoint that triggers full schema sync | ~120 |
| `_tables/composio-schemas/_meta.json` | Create | Metadata file tracking sync state | ~10 |

### Pseudocode

#### `app/api/workflows-f/types/schemas.ts`

```
CachedToolSchema
├── slug: string (e.g., "GMAIL_SEND_EMAIL")
├── name: string (e.g., "Send Email")
├── description: string
├── inputParameters: JSONSchema
├── outputParameters: JSONSchema
└── toolkitSlug: string

CachedToolkit
├── slug: string (e.g., "gmail")
├── name: string (e.g., "Gmail")
├── logo: string | null
├── tools: CachedToolSchema[]
└── toolCount: number

SchemaCacheMeta
├── lastSyncedAt: string (ISO date)
├── toolkitCount: number
├── totalToolCount: number
└── syncDurationMs: number
```

#### `app/api/workflows-f/services/schema-cache.ts`

```
getSchemaCachePath(): string
└── Return path.join(process.cwd(), "_tables/composio-schemas")

readCacheMeta(): SchemaCacheMeta | null
├── Build path to _meta.json
├── If file exists: Read and parse JSON
└── If not exists: Return null

writeCacheMeta(meta: SchemaCacheMeta): void
├── Ensure directory exists
└── Write JSON to _meta.json

readToolkitCache(toolkitSlug: string): CachedToolkit | null
├── Build path to {toolkit}.json
├── If file exists: Read and parse JSON
└── If not exists: Return null

writeToolkitCache(toolkit: CachedToolkit): void
├── Ensure directory exists
└── Write JSON to {toolkit}.json

listCachedToolkits(): string[]
├── Read directory listing
├── Filter for .json files (exclude _meta.json)
└── Return slugs (filenames without .json)
```

#### `app/api/workflows-f/schemas/sync/route.ts`

```
POST /api/workflows-f/schemas/sync
├── Record start time
├── Get Composio client
│
├── Fetch all toolkits
│   └── client.toolkits.list() or similar
│
├── For each toolkit:
│   ├── Fetch toolkit details (name, logo)
│   ├── Fetch tools: client.tools.getRawComposioTools({ toolkits: [slug] })
│   ├── Map to CachedToolSchema[]:
│   │   ├── slug: tool.slug
│   │   ├── name: tool.displayName
│   │   ├── description: tool.description
│   │   ├── inputParameters: tool.inputParameters
│   │   └── outputParameters: tool.outputParameters
│   ├── Create CachedToolkit object
│   └── writeToolkitCache(toolkit)
│
├── Calculate totals
├── Write _meta.json with stats
│
└── Return {
      success: true,
      toolkits: count,
      tools: totalCount,
      durationMs: elapsed
    }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.1 | Sync creates `_meta.json` with timestamp | POST sync → file exists with `lastSyncedAt` |
| AC-6.2 | Sync creates toolkit JSON files | POST sync → `gmail.json`, `slack.json` exist |
| AC-6.3 | Each toolkit file contains tools with schemas | Read `gmail.json` → has tools with `inputParameters` |
| AC-6.7 | Cached schemas match Composio source | Compare cached vs live → identical |

### User Flows

#### Flow A.1: First-Time Schema Sync

```
1. Developer runs: curl -X POST /api/workflows-f/schemas/sync
2. System logs: "Fetching toolkits from Composio..."
3. System fetches ~45 toolkits
4. For each toolkit:
   - Logs: "Syncing gmail (27 tools)..."
   - Fetches all tools with schemas
   - Writes gmail.json
5. System writes _meta.json:
   {
     "lastSyncedAt": "2025-12-07T...",
     "toolkitCount": 45,
     "totalToolCount": 1247,
     "syncDurationMs": 15000
   }
6. Returns success response
```

---

## Part B: Schema Query API

### Goal

Build the read API that the workflow editor uses to look up tool schemas. These endpoints read from the local cache (populated by Part A), providing fast, reliable schema access.

**Key insight**: The Tools Panel needs ALL tools from ALL toolkits in one request to avoid 45+ API calls. We provide a `/schemas/all` endpoint for this bulk load.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows-f/schemas/route.ts` | Create | GET - List toolkit summaries (no tools, just counts) | ~40 |
| `app/api/workflows-f/schemas/all/route.ts` | Create | GET - Bulk load ALL toolkits with ALL tools (for Tools Panel) | ~60 |
| `app/api/workflows-f/schemas/[toolkit]/route.ts` | Create | GET - Get all tools for a specific toolkit | ~50 |
| `app/api/workflows-f/schemas/[toolkit]/[tool]/route.ts` | Create | GET - Get single tool with full schema (for step config) | ~50 |

### Pseudocode

#### `app/api/workflows-f/schemas/route.ts`

```
GET /api/workflows-f/schemas
├── Read _meta.json for sync info
├── List cached toolkit files
├── For each toolkit file:
│   ├── Read toolkit JSON (lightweight - just header info)
│   └── Extract: slug, name, logo, toolCount
├── Return {
│     lastSyncedAt: meta.lastSyncedAt,
│     toolkits: [
│       { slug: "gmail", name: "Gmail", logo: "...", toolCount: 27 },
│       { slug: "slack", name: "Slack", logo: "...", toolCount: 42 },
│       ...
│     ]
│   }
└── If no cache: Return { toolkits: [], lastSyncedAt: null }
```

#### `app/api/workflows-f/schemas/all/route.ts`

```
GET /api/workflows-f/schemas/all
├── Read _meta.json for sync info
├── List cached toolkit files
├── For each toolkit file:
│   ├── Read full toolkit JSON
│   └── Include tools array (with name, slug, description - NOT full schemas)
├── Return {
│     lastSyncedAt: meta.lastSyncedAt,
│     toolkits: [
│       {
│         slug: "gmail",
│         name: "Gmail",
│         logo: "...",
│         tools: [
│           { slug: "GMAIL_SEND_EMAIL", name: "Send Email", description: "..." },
│           { slug: "GMAIL_FETCH_EMAILS", name: "Fetch Emails", description: "..." },
│           ...
│         ]
│       },
│       ...
│     ]
│   }
└── If no cache: Return { toolkits: [], lastSyncedAt: null }

NOTE: This endpoint omits inputParameters/outputParameters to keep response size small.
      Full schemas are fetched via /schemas/[toolkit]/[tool] when configuring a step.
```

#### `app/api/workflows-f/schemas/[toolkit]/route.ts`

```
GET /api/workflows-f/schemas/[toolkit]
├── Extract toolkit slug from params
├── Read {toolkit}.json from cache
├── If not found: Return 404
├── Return {
│     slug: "gmail",
│     name: "Gmail",
│     logo: "...",
│     tools: [
│       {
│         slug: "GMAIL_SEND_EMAIL",
│         name: "Send Email",
│         description: "...",
│         inputParameters: {...},
│         outputParameters: {...}
│       },
│       ...
│     ]
│   }
└── Handle errors gracefully
```

#### `app/api/workflows-f/schemas/[toolkit]/[tool]/route.ts`

```
GET /api/workflows-f/schemas/[toolkit]/[tool]
├── Extract toolkit and tool slugs from params
├── Read {toolkit}.json from cache
├── If toolkit not found: Return 404
├── Find tool in toolkit.tools by slug
├── If tool not found: Return 404
├── Return {
│     slug: "GMAIL_SEND_EMAIL",
│     name: "Send Email",
│     description: "Sends an email...",
│     toolkitSlug: "gmail",
│     inputParameters: {
│       type: "object",
│       properties: {
│         recipient_email: { type: "string", ... },
│         subject: { type: "string", ... },
│         body: { type: "string", ... }
│       },
│       required: ["recipient_email"]
│     },
│     outputParameters: {
│       type: "object",
│       properties: {
│         data: { ... },
│         successful: { type: "boolean" },
│         error: { type: "string" }
│       }
│     }
│   }
└── Handle errors gracefully
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.4 | GET `/schemas` returns toolkit summaries | Call → array of toolkits with counts (no tools) |
| AC-6.5 | GET `/schemas/all` returns everything for Tools Panel | Call → all toolkits with all tool names/descriptions |
| AC-6.6 | GET `/schemas/gmail` returns Gmail tools | Call → tools array with full schemas |
| AC-6.7 | GET `/schemas/gmail/GMAIL_SEND_EMAIL` returns single tool | Call → full input/output schemas |

### User Flows

#### Flow B.1: Tools Panel Loads All Tools

```
1. User opens workflow editor
2. Tools Panel mounts and calls: GET /api/workflows-f/schemas/all
3. API reads all toolkit JSON files from cache
4. Returns all toolkits with tool names/descriptions (no full schemas)
5. Tools Panel renders grouped list:
   - gmail (27 tools)
     - Send Email
     - Fetch Emails
     - ...
   - slack (42 tools)
     - Send Message
     - ...
6. User can search, expand groups, drag tools to canvas
```

#### Flow B.2: Step Configuration Loads Full Schema

```
1. User drags "Gmail: Send Email" to workflow
2. Step is added, user clicks to configure it
3. Config panel calls: GET /api/workflows-f/schemas/gmail/GMAIL_SEND_EMAIL
4. API reads gmail.json, finds the specific tool
5. Returns FULL schema with inputParameters:
   - recipient_email (required)
   - subject
   - body
   - cc, bcc (arrays)
6. Config panel renders form with input fields
```

---

## Out of Scope

- Automatic scheduled syncing → Future (cron job)
- Incremental sync (only changed tools) → Future optimization
- Schema versioning → Not needed yet
- UI for triggering sync → Manual/CLI for now
- Schema validation/sanitization → Trust Composio

---

## References

- **Research**: `15.2-workflow-research.md` - Composio schema findings
- **Live Query**: `scripts/check-gmail-schemas.ts` - Verified Gmail has rich schemas
- **Composio Client**: `app/api/connections/services/client.ts`
- **Similar Pattern**: `app/api/workflows-f/available-integrations/route.ts`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Initial creation | Assistant |

---

**Last Updated:** December 2025

