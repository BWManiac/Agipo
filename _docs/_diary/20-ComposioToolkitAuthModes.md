# Diary Entry 20: Composio Toolkit Authentication Modes

**Date:** December 5, 2025  
**Focus:** Understanding Composio's undocumented authentication patterns for toolkits

---

## Executive Summary

Composio toolkits have different **authentication modes** that determine whether users need to create a connection before using tools. This is poorly documented but critical for building a good UX. We discovered this through SDK exploration and testing.

---

## The Four Authentication Modes

| Mode | Description | User Action Required | Example Toolkits |
|------|-------------|---------------------|------------------|
| `NO_AUTH` | Tools work without any authentication | None - just use them | `browser_tool` |
| `API_KEY` | Requires user's API key | Enter API key once | `browserbase_tool`, `hyperbrowser` |
| `BEARER_TOKEN` | Requires bearer token | Enter token once | `browserless` |
| `OAUTH2` | OAuth flow with redirect | Complete OAuth flow | `gmail`, `github`, `slack` |

### How to Check a Toolkit's Auth Mode

```typescript
const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Get toolkit details
const toolkit = await client.toolkits.get("browser_tool");

// Auth mode is in authConfigDetails[0].mode
const authMode = toolkit.authConfigDetails?.[0]?.mode;
// Returns: "NO_AUTH" | "API_KEY" | "BEARER_TOKEN" | "OAUTH2" | etc.
```

### Example Response Structure

```json
{
  "name": "Browser tool",
  "slug": "browser_tool",
  "authConfigDetails": [
    {
      "name": "Browser Tool",
      "mode": "NO_AUTH",
      "fields": {
        "authConfigCreation": { "optional": [], "required": [] },
        "connectedAccountInitiation": { "optional": [], "required": [] }
      }
    }
  ]
}
```

---

## NO_AUTH Toolkits: The Hidden Gem

### What Are They?

NO_AUTH toolkits are **platform-provided tools** that work without any user authentication. Composio hosts the infrastructure and makes it available to all users.

### The `browser_tool` Toolkit

This is the most useful NO_AUTH toolkit we found:

| Tool | Description |
|------|-------------|
| `BROWSER_TOOL_FETCH_WEBPAGE` | Fetch and parse webpage content (returns markdown) |
| `BROWSER_TOOL_COPY_SELECTED_TEXT` | Copy text from page to clipboard |
| `BROWSER_TOOL_DRAG_AND_DROP` | Drag and drop operations |
| `BROWSER_TOOL_KEYBOARD_SHORTCUT` | Execute keyboard shortcuts |
| `BROWSER_TOOL_GET_CLIPBOARD` | Read clipboard content |
| + 13 more tools | See full list via SDK |

### Executing NO_AUTH Tools

```typescript
// NO_AUTH tools don't need connectedAccountId!
const result = await client.tools.execute("BROWSER_TOOL_FETCH_WEBPAGE", {
  userId: "any_user_id",
  arguments: { url: "https://example.com" },
  dangerouslySkipVersionCheck: true,
  // Note: NO connectedAccountId parameter
});

// Result:
// {
//   "data": {
//     "content": "# Example Domain\n\nThis domain is for use in...",
//     "format": "markdown",
//     "title": "Example Domain",
//     "url": "https://example.com"
//   },
//   "successful": true
// }
```

---

## Fetching Tools for a Toolkit

### Method 1: getRawComposioTools (Recommended)

```typescript
const tools = await client.tools.getRawComposioTools({ 
  toolkits: ["browser_tool"],
  limit: 100 
});

// Returns array of tool definitions with:
// - slug: "BROWSER_TOOL_FETCH_WEBPAGE" (use this for execution)
// - name: "Fetch Webpage"
// - displayName: "Fetch Webpage" 
// - description: "Fetches and parses webpage content..."
// - parameters: { ... } // JSON Schema
```

### Method 2: tools.get (For User Context)

```typescript
const tools = await client.tools.get(userId, { 
  toolkits: ["browser_tool"] 
});
// Same result but scoped to a user context
```

---

## Architecture Implications

### Current Architecture (Before This Discovery)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Auth Configs   │────▶│ User Connections │────▶│ Available Tools │
│  (from Composio)│     │ (OAuth/API Key)  │     │ (for agent)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
     Gmail              user@gmail.com            GMAIL_SEND_EMAIL
   Browserbase          API key: xxx            CREATE_SESSION
```

**Problem:** NO_AUTH tools never appear because there's no "connection" for them.

### Required Architecture (After This Discovery)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Available Tools for Agent                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   Platform Tools    │    │      Connection Tools           │ │
│  │   (NO_AUTH)         │    │      (Requires Connection)      │ │
│  │                     │    │                                 │ │
│  │  browser_tool       │    │  Gmail (OAuth)                  │ │
│  │  - FETCH_WEBPAGE    │    │  - SEND_EMAIL                   │ │
│  │  - SCREENSHOT       │    │  - LIST_MESSAGES                │ │
│  │                     │    │                                 │ │
│  │  No setup needed!   │    │  Browserbase (API Key)          │ │
│  │                     │    │  - CREATE_SESSION               │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## SDK Reference: Key Methods

### Toolkits Service

```typescript
// Get single toolkit with auth details
const toolkit = await client.toolkits.get(slug: string);

// List all toolkits (paginated)
const allToolkits = await client.toolkits.get({
  category?: string,      // Filter by category
  isLocal?: boolean,      // Local vs remote
  managedBy?: "all" | "composio" | "project",
  sortBy?: "usage" | "alphabetically"
});

// List categories
const categories = await client.toolkits.listCategories();
```

### Tools Service

```typescript
// Get tools for toolkit(s) - raw definitions
const tools = await client.tools.getRawComposioTools({
  toolkits: string[],
  limit?: number
});

// Get tools scoped to user
const tools = await client.tools.get(userId, {
  toolkits?: string[],
  tools?: string[]  // specific tool slugs
});

// Execute a tool
const result = await client.tools.execute(toolSlug, {
  userId: string,
  arguments: Record<string, unknown>,
  connectedAccountId?: string,  // NOT needed for NO_AUTH
  dangerouslySkipVersionCheck?: boolean
});
```

---

## Identifying NO_AUTH Toolkits Programmatically

```typescript
async function getNoAuthToolkits(): Promise<string[]> {
  const client = getComposioClient();
  
  // Known NO_AUTH toolkits (discovered through exploration)
  // TODO: Find a way to query all toolkits and filter by mode
  const knownNoAuthSlugs = ["browser_tool"];
  
  const noAuthToolkits: string[] = [];
  
  for (const slug of knownNoAuthSlugs) {
    try {
      const toolkit = await client.toolkits.get(slug);
      const mode = toolkit.authConfigDetails?.[0]?.mode;
      if (mode === "NO_AUTH") {
        noAuthToolkits.push(slug);
      }
    } catch (e) {
      // Toolkit not found, skip
    }
  }
  
  return noAuthToolkits;
}
```

### Current Known NO_AUTH Toolkits

| Slug | Name | Tools Count |
|------|------|-------------|
| `browser_tool` | Browser tool | 18 |

*Note: There may be more NO_AUTH toolkits. The `toolkits.get({})` method returns paginated results but we couldn't get it to return items in testing. Consider checking Composio's toolkit directory manually.*

---

## Common Pitfalls

### 1. Assuming All Tools Need Connections

**Wrong:**
```typescript
// Only showing tools from user's connections
const connections = await listConnections(userId);
const tools = connections.flatMap(c => getToolsForConnection(c.toolkitSlug));
```

**Right:**
```typescript
// Include both connected AND no-auth tools
const connectedTools = await getConnectedTools(userId);
const noAuthTools = await getNoAuthTools(); // browser_tool, etc.
const allTools = [...connectedTools, ...noAuthTools];
```

### 2. Passing connectedAccountId for NO_AUTH Tools

**Wrong:**
```typescript
await client.tools.execute("BROWSER_TOOL_FETCH_WEBPAGE", {
  userId,
  arguments: { url },
  connectedAccountId: "some_id" // This will fail!
});
```

**Right:**
```typescript
await client.tools.execute("BROWSER_TOOL_FETCH_WEBPAGE", {
  userId,
  arguments: { url }
  // No connectedAccountId for NO_AUTH tools
});
```

### 3. Confusing Toolkit Names

| Toolkit | Auth Mode | What It Does |
|---------|-----------|--------------|
| `browser_tool` | NO_AUTH | High-level browser automation (fetch, click, type) |
| `browserbase_tool` | API_KEY | Browser infrastructure (sessions, contexts) |
| `browserless` | BEARER_TOKEN | Browser automation service |
| `hyperbrowser` | API_KEY | Another browser service |

**`browser_tool` is the one that works out of the box!**

---

## Test Script

We created a test script to explore Composio toolkits:

**Location:** `scripts/explore-composio-toolkits.ts`

```bash
# Run with:
npx tsx scripts/explore-composio-toolkits.ts
```

This script:
1. Fetches `browser_tool` details
2. Lists tools for the toolkit
3. Compares auth modes across toolkits
4. Executes a test fetch (no connection needed)

---

## Implementation Status

⚠️ **Paused** - Discovered architectural issue requiring refactor.

### What Worked
1. ✅ NO_AUTH tools appear in UI ("Platform Tools" section)
2. ✅ Tools can be assigned to agents
3. ✅ Runtime loads tools successfully

### What's Broken: Context Leak
When testing browser tools, Composio returns:
```json
{
  "error": "Invalid request data provided - Following fields are missing: {'url'}",
  "successful": false
}
```

**Root Cause:** Mastra injects runtime context (`memory`, `threadId`, `resourceId`) into tool execution. Our manual Vercel AI SDK wrapper receives this merged input and forwards it to Composio, breaking tool execution.

### The Real Solution: `@composio/mastra`

**Discovery:** Composio provides an official `@composio/mastra` package that we're NOT using!

```typescript
// What we have (broken)
import { Composio } from "@composio/core";
// Manual schema conversion, manual tool wrapping, context leak

// What we should have (works)
import { Composio } from "@composio/core";
import { MastraProvider } from "@composio/mastra";

const composio = new Composio({
  provider: new MastraProvider(),  // Handles everything!
});

const tools = await composio.tools.get(userId, { toolkits: ["BROWSER_TOOL"] });
```

See **Task 13: Composio + Mastra Architecture Refactor** for the proper solution.

### Files Changed (Task 12 - Temporary)

| File | Change | Status |
|------|--------|--------|
| `composio.ts` | Added `getNoAuthToolkits()` | ✅ Keep |
| `available/route.ts` | Returns `platformToolkits` | ✅ Keep |
| `useConnectionTools.ts` | Added `PlatformToolkit` type | ✅ Keep |
| `ConnectionToolEditorPanel.tsx` | Added "Platform Tools" section | ✅ Keep |
| `runtime.ts` | Context filtering (band-aid) | ⚠️ Replace in Task 13 |

---

## References

- Composio SDK: `@composio/core`
- Composio Dashboard: https://platform.composio.dev
- Test script: `scripts/explore-composio-toolkits.ts`
- Related diary: `19-ApiKeyConnectionsAndToolCategories.md`

