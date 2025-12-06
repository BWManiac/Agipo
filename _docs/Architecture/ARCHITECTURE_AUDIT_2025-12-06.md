# Architecture Audit Report

**Date:** December 6, 2025  
**Purpose:** Comprehensive codebase analysis for planned refactoring  
**Status:** Research Complete - Awaiting Alignment

---

## Executive Summary

Agipo has evolved rapidly from a prototype to a platform. The current architecture reflects this growth—strong in some areas, fragmented in others. This audit identifies:

1. **2 major domains** with clear boundaries (Tools, Workforce)
2. **3 orphaned/legacy components** ready for removal
3. **5 monolithic files** requiring decomposition
4. **Multiple architectural patterns** coexisting (some intentional, some accidental)

The recommended refactoring would **delete ~1,000 lines**, **restructure ~2,500 lines**, and establish clearer domain boundaries.

---

## 1. Project Philosophy (Observed)

Based on the codebase and documentation, I've identified these implicit principles:

### 1.1 Domain-Driven Design (DDD) - Partially Implemented

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTENDED DOMAIN MODEL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   TOOLS DOMAIN                           WORKFORCE DOMAIN                    │
│   (The Builder)                          (The Runtime)                       │
│   ┌─────────────────────┐               ┌─────────────────────┐             │
│   │ Editor              │               │ Agents              │             │
│   │ Transpiler          │               │ Chat                │             │
│   │ Storage             │               │ Memory              │             │
│   └─────────────────────┘               │ Connections         │             │
│                                         └─────────────────────┘             │
│                                                                              │
│   SHARED KERNEL                                                              │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │ _tables/types.ts   │ components/ui/ │ lib/utils.ts         │           │
│   └─────────────────────────────────────────────────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Reality Check:**
- ✅ Clear domain separation in folder structure
- ⚠️ Cross-domain imports blurring boundaries
- ❌ "Connections" domain is half in `profile/`, half in `api/connections/`

### 1.2 Service Layer Pattern - Emerging

Good: Services colocated with routes (`app/api/*/services/`)
```
app/api/
├── connections/services/composio.ts    ✅ Good
├── records/services/*.ts               ✅ Good (detailed decomposition)
├── tools/services/*.ts                 ✅ Good
└── workforce/services/*.ts             ⚠️ Minimal (only agent-config.ts)
```

Bad: Business logic still in some route files
```
app/api/workforce/[agentId]/chat/route.ts  ← 166 lines, should be ~50
```

### 1.3 State Management - Zustand Slice Architecture

**Workflow Editor:** Exemplary implementation
```
store/
├── index.ts              # Root store composition
├── types.ts              # Shared types
└── slices/
    ├── canvasSlice.ts    # React Flow state
    ├── editorSlice.ts    # Active node editing
    ├── executionSlice.ts # Run state
    ├── ioMappingSlice.ts # Data flow
    └── ...8 slices total
```

**Agent Modal:** No centralized state management
- State scattered across 5+ hooks
- No clear data flow pattern
- Missing: `useAgentStore` or similar

### 1.4 File Organization Conventions

| Convention | Status | Notes |
|------------|--------|-------|
| `components/` adjacent to pages | ✅ | Followed consistently |
| `hooks/` adjacent to pages | ✅ | Good isolation |
| `services/` in API routes | ✅ | Emerging pattern |
| `README.md` per route | ⚠️ | Present but outdated |
| Cursor rules per domain | ⚠️ | Only `_tables/agents/` has one |

---

## 2. Folder Structure Analysis

### 2.1 Top-Level Structure

```
agipo/
├── _docs/                 # Documentation (well-organized)
│   ├── _diary/           # Development journal (21 entries!)
│   ├── _tasks/           # Task planning (13 tasks)
│   ├── Architecture/     # ⚠️ EMPTY - should contain ADRs
│   ├── Engineering/      # Architecture docs (misplaced?)
│   ├── Product/          # Product strategy
│   └── UXD/              # UI mockups
├── _tables/              # Data layer (agents, records, tools)
├── app/                  # Next.js App Router
│   ├── (pages)/          # Route groups
│   └── api/              # API routes
├── components/           # Shared components
│   ├── ai-elements/      # Chat components
│   ├── layout/           # Only TopNav
│   └── ui/               # shadcn primitives (53 files)
├── hooks/                # ⚠️ Only 1 file (use-mobile.ts)
├── lib/                  # ⚠️ Only utils.ts
├── public/               # Static assets
├── scripts/              # ⚠️ EMPTY
└── UXD/                  # Duplicate of _docs/UXD? (Records only)
```

### 2.2 Empty/Orphaned Directories

| Directory | Status | Recommendation |
|-----------|--------|----------------|
| `_docs/Architecture/` | Empty | Move ADRs from `Engineering/Architecture/` |
| `_docs/UXD/Pages/records/` | Empty | Delete (mockups exist in root `UXD/`) |
| `scripts/` | Empty | Delete or add npm scripts |
| Root `UXD/` | Duplicate | Merge into `_docs/UXD/` |

### 2.3 Duplicate/Redundant Files

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `ConnectionToolEditor.tsx` | 297 | 🔴 UNUSED | Superseded by `ConnectionToolEditorPanel.tsx` |
| `agent-modal-legacy/` | ~600 | 🔴 UNUSED | Old modal implementation |
| `proxy.ts` | 23 | ⚠️ MISNAMED | Actually Clerk middleware, should be `middleware.ts` |

---

## 3. Monolithic Files Analysis

### 3.1 Top 10 Largest Files

| File | Lines | Domain | Issue |
|------|-------|--------|-------|
| `components/ai-elements/prompt-input.tsx` | 1,432 | Shared | God component |
| `components/ui/sidebar.tsx` | 724 | UI | Complex but necessary |
| `app/(pages)/profile/page.tsx` | 506 | Profile | Mixed concerns |
| `components/ai-elements/message.tsx` | 469 | Shared | Complex rendering |
| `app/api/tools/services/runtime.ts` | 462 | Tools | Multiple responsibilities |
| `ConnectionToolEditorPanel.tsx` | 446 | Workforce | Acceptable for now |
| `app/api/connections/services/composio.ts` | 422 | Connections | Too many clients |

### 3.2 Decomposition Recommendations

#### `runtime.ts` (462 lines) → 3 files

Current responsibilities:
1. Custom tool loading from filesystem
2. Composio schema conversion
3. Tool execution with context filtering

Proposed split:
```
app/api/tools/services/
├── index.ts              # Re-exports
├── custom-tools.ts       # getExecutableTools(), getExecutableToolById()
├── composio-tools.ts     # getConnectionToolExecutable(), schema conversion
└── RUNTIME.md            # ✅ Already created
```

#### `composio.ts` (422 lines) → 3 files

Current responsibilities:
1. Three different Composio clients (generic, Mastra, Vercel)
2. Auth config management
3. Connection CRUD
4. Tool fetching

Proposed split:
```
app/api/connections/services/
├── index.ts              # Re-exports
├── client.ts             # Singleton clients (generic, deprecated Mastra, Vercel)
├── auth.ts               # initiateConnection, initiateApiKeyConnection, disconnectAccount
├── connections.ts        # listConnections, listAuthConfigs
└── tools.ts              # getToolsForConnection, getNoAuthToolkits
```

#### `profile/page.tsx` (506 lines) → Multiple components

Current state: Single page handling:
- User profile display
- Connections management (add, view, disconnect)
- Auth config browsing

Proposed split:
```
app/(pages)/profile/
├── page.tsx              # Layout only (~50 lines)
├── components/
│   ├── ProfileHeader.tsx
│   ├── ProfileStats.tsx
│   └── connections/      # Already exists, enhance
│       ├── ConnectionsSection.tsx  # ✅ Exists
│       └── ...
```

#### `prompt-input.tsx` (1,432 lines) - CRITICAL

This is the most complex file in the codebase. It handles:
- Text input with attachments
- Voice input
- File uploads
- Tool suggestion chips
- Streaming state
- Keyboard shortcuts

Proposed split:
```
components/ai-elements/prompt-input/
├── index.tsx             # Main export, orchestrator
├── TextInput.tsx         # Core textarea logic
├── VoiceInput.tsx        # Speech recognition
├── AttachmentPanel.tsx   # File handling
├── ToolSuggestions.tsx   # Chip display
├── hooks/
│   ├── useVoiceInput.ts
│   ├── useFileUpload.ts
│   └── useToolSuggestions.ts
└── types.ts
```

---

## 4. Domain Boundary Issues

### 4.1 Connections Domain (Fragmented)

**Current state:** Split across 3 locations
```
app/(pages)/profile/           # UI for managing connections
app/api/connections/           # API routes
app/api/connections/services/  # Business logic
```

**Problem:** "Connections" is presented to users in the Profile page but is really a platform capability. Agents use connections via `connectionToolBindings`.

**Options:**
1. **Keep as-is:** Profile is where users "manage" connections
2. **Move to Settings:** Create `/settings/connections/` route
3. **Elevate to top-level:** `app/(pages)/connections/` as own domain

**Recommendation:** Option 2 - Move to Settings. Profile should be about the user, not platform configuration.

### 4.2 Agent Chat Route (Too Much Logic)

```typescript
// Current: app/api/workforce/[agentId]/chat/route.ts (166 lines)
// Does:
// 1. Auth
// 2. Payload parsing
// 3. Agent config loading
// 4. Tool building (custom + connection)
// 5. Gateway creation
// 6. Agent instantiation
// 7. Message formatting
// 8. Streaming
// 9. Error handling
```

**Should be:**
```typescript
// route.ts (~50 lines)
export async function POST(request, routeContext) {
  const { userId } = await auth();
  const { messages, threadId } = await parsePayload(request);
  const agentId = await routeContext.params.agentId;
  
  const agent = await createConfiguredAgent(userId, agentId);
  const stream = await agent.stream(messages, { threadId });
  
  return stream.toUIMessageStreamResponse();
}

// services/chat-service.ts
export async function createConfiguredAgent(userId, agentId) { ... }
export async function parsePayload(request) { ... }
```

### 4.3 Type Definitions (Scattered)

| Location | Types Defined | Should Be |
|----------|--------------|-----------|
| `_tables/types.ts` | Core types (AgentConfig, ToolDefinition) | ✅ Keep |
| `app/(pages)/workforce/.../types.ts` | UI-specific types | ✅ Keep |
| `app/api/workforce/.../types/*.ts` | API-specific types | ⚠️ Consolidate |
| Inline in components | Ad-hoc types | ❌ Extract |

---

## 5. Technical Debt Inventory

### 5.1 Known Issues (from code comments)

| File | Issue | Priority |
|------|-------|----------|
| `composio.ts` | `@deprecated` functions for MastraProvider | Low (documented) |
| `tools/page.tsx` | `// TODO: Implement tools list page` | Medium |
| `knowledge-service.ts` | Placeholder implementation | Low |

### 5.2 Architectural Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| `proxy.ts` is misnamed middleware | Confusion | Low | High |
| Empty `scripts/` directory | Clutter | Trivial | High |
| Duplicate `UXD/` folder | Confusion | Low | High |
| `ConnectionToolEditor.tsx` unused | Dead code | Low | High |
| `agent-modal-legacy/` unused | ~600 lines dead | Low | High |
| `_docs/Architecture/` empty | Missing ADRs | Medium | Medium |
| `runtime.ts` monolithic | Maintainability | Medium | Medium |
| `composio.ts` monolithic | Maintainability | Medium | Medium |
| `prompt-input.tsx` monolithic | Maintainability | High | Low |

### 5.3 Package.json Cleanup

```json
// Potentially unused (investigate):
"@composio/mastra": "^0.2.6"  // BLOCKED - can't use with Mastra 0.24.x
"@composio/vercel": "^0.2.18" // Kept as backup, but not actively used
```

---

## 6. Proposed Architecture (Post-Refactor)

### 6.1 Folder Structure

```
agipo/
├── _docs/
│   ├── _diary/
│   ├── _tasks/
│   ├── Architecture/        # ← ADRs moved here
│   │   ├── ADR-001-*.md
│   │   └── Store-Slice-Architecture.md  # ← Moved from Engineering
│   ├── Engineering/
│   │   ├── Integrations/
│   │   └── References/
│   ├── Product/
│   └── UXD/
│       └── Pages/           # ← Merge root UXD/ here
├── _tables/                 # No change
├── app/
│   ├── (pages)/
│   │   ├── home/
│   │   ├── marketplace/
│   │   ├── profile/         # User profile only
│   │   ├── settings/        # ← NEW: connections, preferences
│   │   │   └── connections/
│   │   ├── records/
│   │   ├── tools/
│   │   └── workforce/
│   │       └── components/
│   │           ├── agent-modal/     # Keep
│   │           ├── AgentChat.tsx
│   │           ├── ConnectionToolEditorPanel.tsx  # Keep
│   │           ├── ToolEditor.tsx   # Keep
│   │           ├── ToolInspector.tsx
│   │           └── WorkforceDashboard.tsx
│   │           # DELETE: ConnectionToolEditor.tsx
│   │           # DELETE: agent-modal-legacy/
│   └── api/
│       ├── connections/
│       │   └── services/
│       │       ├── index.ts
│       │       ├── client.ts       # ← NEW
│       │       ├── auth.ts         # ← NEW
│       │       ├── connections.ts  # ← NEW
│       │       └── tools.ts        # ← NEW
│       ├── records/                # No change
│       ├── tools/
│       │   └── services/
│       │       ├── index.ts
│       │       ├── custom-tools.ts  # ← NEW
│       │       ├── composio-tools.ts # ← NEW
│       │       ├── storage.ts
│       │       ├── transpiler.ts
│       │       └── RUNTIME.md      # ✅ Exists
│       └── workforce/
│           └── services/
│               ├── index.ts
│               ├── agent-config.ts
│               └── chat-service.ts  # ← NEW
├── components/
│   ├── ai-elements/
│   │   ├── prompt-input/    # ← NEW: decomposed
│   │   │   ├── index.tsx
│   │   │   ├── TextInput.tsx
│   │   │   └── ...
│   │   ├── code-block.tsx
│   │   ├── conversation.tsx
│   │   ├── message.tsx
│   │   └── tool.tsx
│   ├── layout/
│   └── ui/
├── hooks/
├── lib/
├── middleware.ts            # ← RENAMED from proxy.ts
└── public/
# DELETE: scripts/ (empty)
# DELETE: UXD/ (duplicate)
```

### 6.2 Estimated Impact

| Category | Files Affected | Lines Changed |
|----------|---------------|---------------|
| Delete unused | 15+ files | -1,000 lines |
| Rename/move | 5 files | Trivial |
| Decompose | 4 major files | ~1,500 lines restructured |
| Create new | 8 service files | +500 lines (moved logic) |

---

## 7. Recommended Phases

### Phase 1: Quick Wins (Low Risk, High Impact)

1. **Delete unused files:**
   - `ConnectionToolEditor.tsx`
   - `agent-modal-legacy/` folder
   - Empty `scripts/` folder
   - Duplicate `UXD/` folder

2. **Rename:**
   - `proxy.ts` → `middleware.ts`

3. **Reorganize docs:**
   - Move `Engineering/Architecture/*.md` → `Architecture/`

**Estimated time:** 30 minutes

### Phase 2: Service Layer Cleanup (Medium Risk)

1. **Split `composio.ts`** into client, auth, connections, tools
2. **Split `runtime.ts`** into custom-tools, composio-tools
3. **Create `chat-service.ts`** from chat route logic

**Estimated time:** 2-3 hours

### Phase 3: Domain Alignment (Higher Risk)

1. **Create `/settings/connections/`** route
2. **Migrate connections UI** from profile
3. **Update navigation**

**Estimated time:** 2-3 hours

### Phase 4: Component Decomposition (Highest Risk)

1. **Decompose `prompt-input.tsx`** into module structure
2. **Add tests** before refactoring
3. **Gradual migration**

**Estimated time:** 4-6 hours (should be done carefully)

---

## 8. Questions for Alignment

Before proceeding, I need clarity on:

1. **Connections domain placement:**
   - Keep in Profile, move to Settings, or elevate to top-level?

2. **Agent data persistence:**
   - Currently agents are TypeScript files modified via regex. Is there a plan to move to a database?

3. **`prompt-input.tsx` priority:**
   - Is this actively being modified? If stable, defer decomposition.

4. **Package cleanup:**
   - Can we remove `@composio/mastra` since it's blocked?
   - Keep `@composio/vercel` as backup or remove?

5. **Testing strategy:**
   - Before major refactors, should we add tests? Current test coverage appears minimal.

---

## 9. Appendices

### A. File Size Distribution

```
Lines   Count   Category
1-50    120+    Trivial (good)
50-100  40+     Small (good)
100-200 30+     Medium (watch)
200-400 15+     Large (concerning)
400+    7       Monolithic (refactor)
```

### B. Import Graph Hotspots

Most-imported files (potential coupling issues):
- `@/_tables/types.ts` - 30+ imports (expected)
- `@/components/ui/*` - Heavy usage (expected)
- `useConnections.ts` - 5+ imports (coupling concern)

### C. Documentation Coverage

| Domain | README | Cursor Rules | Diary Coverage |
|--------|--------|--------------|----------------|
| Tools | ✅ | ❌ | ✅ (entries 1-7, 10-11) |
| Workforce | ✅ | ❌ | ✅ (entries 9, 11, 14) |
| Connections | ✅ | ❌ | ✅ (entries 15-17, 19-21) |
| Records | ⚠️ (minimal) | ❌ | ✅ (entry 13) |
| Profile | ❌ | ❌ | ❌ |

---

**End of Report**

*Next Step:* Review this document and provide feedback on the questions in Section 8. Once aligned, we can proceed with Phase 1 (quick wins) immediately.

