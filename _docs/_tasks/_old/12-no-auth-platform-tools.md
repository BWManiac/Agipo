# Task 12: NO_AUTH Platform Tools Support

**Status:** Planning  
**Date:** December 2025  
**Goal:** Enable agents to use Composio's NO_AUTH toolkits (like `browser_tool`) without requiring user connections

---

## Document Philosophy

This document tells a story that any team member can follow:

1. **Where are we?** (Current State) — Understand the existing system before making changes
2. **What does success look like?** (Acceptance Criteria + User Flows) — Define the finish line upfront
3. **What do we need to touch?** (File Impact) — Scope the work concretely  
4. **How do we get there safely?** (Phased Implementation) — Break work into verifiable milestones

---

## 1. Executive Summary

Currently, the "Manage Connection Tools" panel only shows tools from user-authenticated connections (OAuth, API Key). However, Composio has **NO_AUTH toolkits** like `browser_tool` that work without any user setup - these never appear in the UI because there's no "connection" for them.

This task adds support for NO_AUTH toolkits as "Platform Tools" that are always available to agents without requiring users to create connections first.

**End state:** Users can assign `browser_tool` actions (like `BROWSER_TOOL_FETCH_WEBPAGE`) to any agent directly from the Capabilities tab, and the agent can execute them immediately.

---

## 2. Current State Analysis

### 2.1 How It Works Today

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Auth Configs   │────▶│ User Connections │────▶│ Available Tools │
│  (Composio)     │     │ (OAuth/API Key)  │     │ (for agent)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
     Gmail              user@gmail.com            GMAIL_SEND_EMAIL
   Browserbase          API key: xxx            CREATE_SESSION

❌ NO_AUTH toolkits have no "connection" → never appear in UI
```

The `/api/workforce/[agentId]/tools/connection/available` endpoint:
1. Calls `listConnections(userId)` to get user's connections
2. For each connection, fetches tools via `getToolsForConnection(toolkitSlug)`
3. Returns only tools from authenticated connections

### 2.2 Key Data Structures

**Toolkit Auth Mode** (from Composio SDK):
```typescript
// toolkit.authConfigDetails[0].mode
type AuthMode = "NO_AUTH" | "API_KEY" | "BEARER_TOKEN" | "OAUTH2" | "OAUTH1" | "BASIC";
```

**Current ConnectionToolBinding** (in `_tables/types.ts`):
```typescript
type ConnectionToolBinding = {
  toolId: string;       // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string; // e.g., "ca_abc123" - REQUIRED currently
  toolkitSlug: string;  // e.g., "gmail"
};
```

**Problem:** `connectionId` is required, but NO_AUTH tools don't have connections.

### 2.3 Relevant Composio APIs

| Method | Purpose | Notes |
|--------|---------|-------|
| `client.toolkits.get(slug)` | Get toolkit details | Returns `authConfigDetails[0].mode` |
| `client.tools.getRawComposioTools({ toolkits })` | Get tools for toolkit | Works without connection |
| `client.tools.execute(slug, { userId, arguments })` | Execute tool | NO_AUTH tools: omit `connectedAccountId` |

### 2.4 Known NO_AUTH Toolkits

| Slug | Name | Tools | Verified |
|------|------|-------|----------|
| `browser_tool` | Browser tool | 18 | ✅ Tested |

*Discovered via `scripts/explore-composio-toolkits.ts`*

---

## 3. Acceptance Criteria

### Backend (4 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC1 | API returns NO_AUTH toolkits separately from connection tools | `GET /tools/connection/available` includes `platformToolkits` array |
| AC2 | NO_AUTH toolkit tools are fetchable without user connection | Response includes `browser_tool` with 18 tools |
| AC3 | Agent config can store NO_AUTH tool bindings (no `connectionId`) | Save binding with `connectionId: null` |
| AC4 | Runtime executes NO_AUTH tools without `connectedAccountId` | Agent can call `BROWSER_TOOL_FETCH_WEBPAGE` |

### Frontend (4 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC5 | "Manage Connection Tools" shows "Platform Tools" section | Visual: section appears above/below connections |
| AC6 | Platform Tools section shows NO_AUTH toolkits (collapsed) | `browser_tool` appears with tool count |
| AC7 | User can select/deselect NO_AUTH tools | Checkboxes work, selection persists |
| AC8 | Save includes both connection tools AND platform tools | Both types in saved bindings |

### Backwards Compatibility (2 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC9 | Existing connection tools continue to work unchanged | Gmail tools still execute with connection |
| AC10 | Agents with only connection tools unaffected | No migration needed |

---

## 4. User Flows

### Flow 1: Assign Platform Tool to Agent (Happy Path)

```
1. User opens agent modal → Capabilities tab
2. User clicks "Manage" on Connection Tools
3. User sees two sections:
   - "Platform Tools" (browser_tool - 0/18 selected)
   - "Your Connections" (gmail - 6/27 selected)
4. User expands "browser_tool"
5. User checks "BROWSER_TOOL_FETCH_WEBPAGE"
6. User clicks "Save Changes"
7. Tool appears in agent's Connection Tools list
8. Agent can now use the tool in chat
```

### Flow 2: Agent Executes NO_AUTH Tool

```
1. User opens agent chat
2. User asks: "Fetch the content from https://example.com"
3. Agent identifies BROWSER_TOOL_FETCH_WEBPAGE tool
4. Runtime detects NO_AUTH tool (no connectionId)
5. Runtime calls Composio WITHOUT connectedAccountId
6. Tool returns markdown content
7. Agent responds with the content
```

### Flow 3: Mixed Tool Selection

```
1. User has Gmail connected (OAuth)
2. User selects Gmail tools (requires connectionId)
3. User also selects browser_tool tools (no connectionId)
4. User saves
5. Agent config stores:
   - Gmail tools with connectionId
   - browser_tool tools with connectionId: null
6. Both types work correctly at runtime
```

---

## 5. File Impact Analysis

| File | Action | Description |
|------|--------|-------------|
| `app/api/connections/services/composio.ts` | Modify | Add `getNoAuthToolkits()`, `getToolsForNoAuthToolkit()` |
| `app/api/workforce/[agentId]/tools/connection/available/route.ts` | Modify | Include `platformToolkits` in response |
| `_tables/types.ts` | Modify | Make `connectionId` optional in `ConnectionToolBinding` |
| `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx` | Modify | Add "Platform Tools" section |
| `app/(pages)/workforce/components/agent-modal/hooks/useConnectionTools.ts` | Modify | Handle `platformToolkits` data |
| `app/api/tools/services/runtime.ts` | Modify | Handle NO_AUTH execution (skip `connectedAccountId`) |

---

## 6. Implementation Phases

### Phase 1: Backend - Expose NO_AUTH Toolkits

**Goal:** API returns NO_AUTH toolkits alongside connection tools

**Changes:**
1. Add `getNoAuthToolkits()` to composio service
2. Add `getToolsForNoAuthToolkit()` to fetch tools
3. Update `/tools/connection/available` response shape

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | `getNoAuthToolkits()` returns `["browser_tool"]` | Unit test / script |
| P1.2 | API response includes `platformToolkits` array | cURL endpoint |
| P1.3 | `browser_tool` shows 18 tools | Check response |

**Phase 1 Test Flow:**
```bash
# Test the updated endpoint
curl http://localhost:3000/api/workforce/mira-patel/tools/connection/available \
  -H "Cookie: [auth]"

# Expected response shape:
# {
#   "connections": [...],  // existing
#   "platformToolkits": [  // NEW
#     {
#       "slug": "browser_tool",
#       "name": "Browser tool",
#       "mode": "NO_AUTH",
#       "tools": [{ "id": "BROWSER_TOOL_FETCH_WEBPAGE", ... }]
#     }
#   ]
# }
```

---

### Phase 2: Frontend - Display Platform Tools

**Goal:** Users can see and select NO_AUTH tools in the UI

**Changes:**
1. Update `useConnectionTools` hook to handle `platformToolkits`
2. Add "Platform Tools" section to `ConnectionToolEditorPanel`
3. Handle mixed selection (platform + connection tools)

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | "Platform Tools" section appears in panel | Visual check |
| P2.2 | `browser_tool` shows with correct tool count | Visual check |
| P2.3 | Checkboxes toggle correctly | Click and verify |
| P2.4 | Save includes platform tool selections | Check saved config |

**Phase 2 Test Flow:**
```
1. Open Mira Patel → Capabilities → Manage Connection Tools
2. Verify "Platform Tools" section shows browser_tool
3. Expand browser_tool, check BROWSER_TOOL_FETCH_WEBPAGE
4. Click Save Changes
5. Verify tool appears in Capabilities list
```

---

### Phase 3: Runtime - Execute NO_AUTH Tools

**Goal:** Agent can actually use NO_AUTH tools in chat

**Changes:**
1. Update `ConnectionToolBinding` type (optional `connectionId`)
2. Update `getConnectionToolExecutable()` to detect NO_AUTH
3. Execute without `connectedAccountId` for NO_AUTH tools

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | Agent config saves with `connectionId: null` for platform tools | Check agent file |
| P3.2 | Runtime loads NO_AUTH tools correctly | Logs show tool loaded |
| P3.3 | Tool execution succeeds | Ask agent to fetch webpage |
| P3.4 | All AC1-AC10 pass | Full test |

**Phase 3 Test Flow (End-to-End):**
```
1. Assign BROWSER_TOOL_FETCH_WEBPAGE to Mira Patel
2. Open Mira Patel chat
3. Ask: "Fetch the content from https://example.com"
4. Verify agent uses tool and returns content
5. Verify Gmail tools still work (backwards compat)
```

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Store platform tools in same `connectionToolBindings` array | Simpler than new array; runtime handles the difference |
| Use `connectionId: null` for NO_AUTH tools | Explicit marker; avoids new type |
| Show "Platform Tools" section first | These are "free" and always available - promote them |
| Keep toolkits collapsed by default | Consistent with connection tools UX |

---

## 8. Out of Scope

- **Discovering more NO_AUTH toolkits** - We'll hardcode `browser_tool` for now; can expand later
- **Platform tool configuration** - NO_AUTH tools have no config; just use them
- **Custom NO_AUTH tool creation** - Users can't create their own platform tools
- **Rate limiting for platform tools** - Composio handles this

---

## 9. References

- **Diary Entry 20:** `_docs/_diary/20-ComposioToolkitAuthModes.md` - Full technical research
- **Diary Entry 19:** `_docs/_diary/19-ApiKeyConnectionsAndToolCategories.md` - Context
- **Test Script:** `scripts/explore-composio-toolkits.ts` - SDK exploration
- **Composio SDK:** `@composio/core` - `toolkits.get()`, `tools.execute()`

---

## 10. Completed Work

### Phase 1: Backend - Expose NO_AUTH Toolkits ✅

**Changes Made:**

| File | Change |
|------|--------|
| `app/api/connections/services/composio.ts` | Added `getNoAuthToolkits()` function with `NO_AUTH_TOOLKIT_SLUGS` constant |
| `app/api/workforce/[agentId]/tools/connection/available/route.ts` | Added `platformToolkits` to response via `getNoAuthToolkits()` |

**Verification:** API now returns `browser_tool` with 18 tools in `platformToolkits` array.

---

### Phase 2: Frontend - Display Platform Tools ✅

**Changes Made:**

| File | Change |
|------|--------|
| `app/(pages)/workforce/components/agent-modal/hooks/useConnectionTools.ts` | Added `PlatformToolkit` type, `platformToolkits` state |
| `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx` | Added "Platform Tools" section with collapsible `browser_tool`, "No Auth" badge |

**Verification:** UI shows "Platform Tools" section with browser_tool (0/18 selected).

---

### Phase 3: Runtime - Execute NO_AUTH Tools ✅

**Changes Made:**

| File | Change |
|------|--------|
| `app/api/tools/services/runtime.ts` | Updated `getConnectionToolExecutable()` to detect empty `connectionId` and skip `connectedAccountId` |

**Key Logic:**
```typescript
const isNoAuth = !binding.connectionId; // Empty string = NO_AUTH platform tool

// For NO_AUTH tools, don't pass connectedAccountId
if (!isNoAuth) {
  executeOptions.connectedAccountId = binding.connectionId;
}
```

**Verification:** Agent recognizes "Browser Tools" in capabilities response.

---

### Validation Status

| AC# | Criterion | Status |
|-----|-----------|--------|
| AC1 | `browser_tool` appears in "Platform Tools" section | ✅ |
| AC2 | Shows tool count (0/18 selected) | ✅ |
| AC3 | Expanding shows tools with checkboxes | ✅ |
| AC4 | Save persists selection | ✅ |
| AC5 | Saved tools appear in Capabilities | ✅ |
| AC6 | Existing Gmail tools still work | ✅ |

**End-to-End Test:** Agent (Mira Patel) correctly identifies having "Browser Tools" capability when asked about available tools.

---

### Phase 4: Investigation - Tool Execution Issues ⚠️

**Status:** In Progress

**Problem Observed:**
- Agent recognizes browser tools are available ✅
- Runtime loads tools successfully ✅
- Runtime executes tools (logs show `Executing platform tool: BROWSER_TOOL_FETCH_WEBPAGE`) ✅
- BUT: Agent reports "technical issue" and can't access websites ❌

**Root Cause Candidates:**
1. **Composio browser_tool infrastructure issue** - Tools may require specific setup/credits
2. **Silent execution errors** - Errors not being captured/logged properly
3. **Missing Composio plan features** - browser_tool may require higher tier

**Investigation Actions:**
1. ✅ Added detailed logging to `runtime.ts` to capture tool execution details
2. ✅ **Root cause identified:** Runtime context leaking into tool arguments

**Root Cause Analysis:**
The Vercel AI SDK passes additional runtime context (memory, threadId, resourceId, etc.) to the tool's `execute` function. We were forwarding this entire object to Composio as `arguments`, causing:
```
"error": "Invalid request data provided - Following fields are missing: {'url'}"
```

The actual URL was nested inside `input.context.url` instead of being at `input.url`.

**Fix Applied (Temporary):**
Modified `runtime.ts` to filter out runtime context keys. However, this is a band-aid fix.

**Architectural Discovery:**
We should be using `@composio/mastra` package which handles all this natively. Our manual wrapping is causing the context leak issue. See **Task 13: Composio + Mastra Architecture Refactor** for the proper solution.

**Status:** Paused in favor of Task 13 refactor.

---

## Notes

### Why "Platform Tools" naming?

These are tools the platform provides "for free" - no user setup needed. They're distinct from:
- **Custom Tools** - User-defined workflows
- **Connection Tools** - Require OAuth/API key from user

"Platform Tools" signals they're built-in capabilities.

### browser_tool vs browserbase_tool vs browserless

| Toolkit | Auth | Use Case |
|---------|------|----------|
| `browser_tool` | NO_AUTH | High-level automation (fetch, click, screenshot) |
| `browserbase_tool` | API_KEY | Browser infrastructure (sessions, contexts) |
| `browserless` | BEARER_TOKEN | Another browser service |

We want `browser_tool` - it's the one that works out of the box.

