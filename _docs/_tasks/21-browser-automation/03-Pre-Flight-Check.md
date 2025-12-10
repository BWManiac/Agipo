# Pre-Flight Check: Browser Automation Feature

**Status:** Ready for Review
**Date:** 2025-12-10
**Purpose:** File impact analysis and alignment verification before autonomous execution

---

## Vision Alignment

### What You'll Be Able to Do

After all phases are complete, you will be able to:

1. **Navigate** to `/experiments/browser-automation` from the top navigation
2. **Create browser sessions** - Click "New Session" to start a cloud browser via Anchor Browser
3. **View live browser** - Watch the browser iframe in real-time on the right side
4. **Control with natural language** - Type commands like "Go to google.com and search for cats" in the chat panel on the left
5. **See agent actions** - Watch as Anchor's agent executes steps with real-time streaming
6. **Review action log** - Switch to Action Log tab to see all executed actions with filtering
7. **Manage profiles** - Create browser profiles to persist cookies/credentials across sessions
8. **Terminate sessions** - Clean up sessions when done

### Layout: Cursor-Style

```
+------------------+------------------------------------------+
|                  |                                          |
|   Chat Panel     |          Browser View (iframe)           |
|   (LEFT SIDE)    |          (RIGHT SIDE)                    |
|                  |                                          |
|   - Messages     |          Live browser from Anchor        |
|   - Agent steps  |          Shows current URL, controls     |
|   - Input        |                                          |
|                  |                                          |
+------------------+------------------------------------------+
|   Sessions       |                                          |
|   Sidebar        |          (collapsible sidebar on far     |
|   (collapsible)  |           left for session management)   |
+------------------+------------------------------------------+
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent Framework | Anchor's `agent.task()` | Phase 0 revealed Mastra tool execution issues; Anchor's built-in agent is proven |
| Layout | Chat LEFT, Browser RIGHT | Cursor-style UI per user request |
| Route Location | `/experiments/browser-automation` | Experimental feature, follows established patterns |
| State Management | Zustand with slice architecture | Matches existing records feature pattern |
| Streaming | Server-Sent Events (SSE) | Simple, browser-native, real-time |

---

## Complete File Impact Analysis

### Phase 1: API Foundation

#### New Files

| File Path | Purpose |
|-----------|---------|
| `app/api/browser-automation/services/anchor-client.ts` | Anchor Browser SDK wrapper (create, list, get, terminate sessions) |
| `app/api/browser-automation/sessions/route.ts` | GET list sessions, POST create session |
| `app/api/browser-automation/sessions/[sessionId]/route.ts` | GET session details, DELETE terminate |

#### Modified Files

| File Path | Change |
|-----------|--------|
| `package.json` | Already has `anchorbrowser` dependency (added in Phase 0) |

---

### Phase 2: Basic Playground UI

#### New Files - Store

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/store/index.ts` | Store composition |
| `app/(pages)/experiments/browser-automation/store/types.ts` | Combined store type |
| `app/(pages)/experiments/browser-automation/store/slices/sessionsSlice.ts` | Session CRUD state |
| `app/(pages)/experiments/browser-automation/store/slices/browserSlice.ts` | Active browser state |
| `app/(pages)/experiments/browser-automation/store/slices/uiSlice.ts` | UI state (tabs, dialogs) |

#### New Files - Page

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/page.tsx` | Main playground page |

#### New Files - Components

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/index.tsx` | Sessions list container |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/SessionCard.tsx` | Individual session card |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionButton.tsx` | Create session trigger |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionDialog.tsx` | Create session dialog |
| `app/(pages)/experiments/browser-automation/components/BrowserView/index.tsx` | Browser iframe container |
| `app/(pages)/experiments/browser-automation/components/BrowserView/BrowserChrome.tsx` | URL bar, controls |
| `app/(pages)/experiments/browser-automation/components/BrowserView/LoadingState.tsx` | Session starting state |
| `app/(pages)/experiments/browser-automation/components/BrowserView/ErrorState.tsx` | Connection error state |
| `app/(pages)/experiments/browser-automation/components/BrowserView/EmptyState.tsx` | No session selected |

#### Modified Files

| File Path | Change |
|-----------|--------|
| `components/layout/TopNav.tsx` | Add "Browser" nav item with Globe icon |

---

### Phase 3: Chat & Browser Agent

#### New Files - Backend

| File Path | Purpose |
|-----------|---------|
| `app/api/browser-automation/services/anchor-agent.ts` | Anchor agent.task() wrapper with step callbacks |
| `app/api/browser-automation/sessions/[sessionId]/chat/route.ts` | SSE streaming chat endpoint |

#### New Files - Store

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/store/slices/chatSlice.ts` | Chat messages & streaming state |
| `app/(pages)/experiments/browser-automation/store/slices/actionsSlice.ts` | Action log state |

#### New Files - Components

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/components/ChatPanel/index.tsx` | Chat panel container (LEFT side) |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ChatArea.tsx` | Messages display |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ChatEmpty.tsx` | Empty state with suggestions |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ChatInput.tsx` | Message input |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ActionBadge.tsx` | Inline action status badge |

#### Modified Files

| File Path | Change |
|-----------|--------|
| `app/(pages)/experiments/browser-automation/store/index.ts` | Add chat and actions slices |
| `app/(pages)/experiments/browser-automation/page.tsx` | Replace chat placeholder with ChatPanel |

---

### Phase 4: Action Log

#### New Files - Components

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/components/ActionLog/index.tsx` | Action log container |
| `app/(pages)/experiments/browser-automation/components/ActionLog/ActionEntry.tsx` | Single action entry |
| `app/(pages)/experiments/browser-automation/components/ActionLog/ActionFilters.tsx` | Filter buttons |
| `app/(pages)/experiments/browser-automation/components/ActionLog/ActionEmpty.tsx` | Empty state |

#### Modified Files

| File Path | Change |
|-----------|--------|
| `app/(pages)/experiments/browser-automation/store/slices/actionsSlice.ts` | Enhance with filtering logic |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/index.tsx` | Add tabs for Chat/Actions |

---

### Phase 5: Profile Management

#### New Files - Backend

| File Path | Purpose |
|-----------|---------|
| `app/api/browser-automation/profiles/route.ts` | GET list, POST create profiles |
| `app/api/browser-automation/profiles/[profileId]/route.ts` | GET, DELETE profile |
| `app/api/browser-automation/services/profile-manager.ts` | Profile CRUD service |

#### New Files - Store

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/store/slices/profilesSlice.ts` | Profile management state |

#### New Files - Components

| File Path | Purpose |
|-----------|---------|
| `app/(pages)/experiments/browser-automation/components/ProfileManager/index.tsx` | Profile manager dialog |
| `app/(pages)/experiments/browser-automation/components/ProfileManager/ProfileCard.tsx` | Individual profile |
| `app/(pages)/experiments/browser-automation/components/ProfileManager/CreateProfileForm.tsx` | Create profile form |
| `app/(pages)/experiments/browser-automation/components/ProfileManager/ProfilePicker.tsx` | Profile picker for new session |

#### Modified Files

| File Path | Change |
|-----------|--------|
| `app/(pages)/experiments/browser-automation/store/index.ts` | Add profiles slice |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionDialog.tsx` | Enable profile picker |

---

### Phase 6: Polish & Validation

#### Modified Files (Enhancements)

| File Path | Change |
|-----------|--------|
| `app/(pages)/experiments/browser-automation/components/BrowserView/ErrorState.tsx` | Add reconnect UI, troubleshooting tips |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ChatInput.tsx` | Keyboard shortcuts (Enter, Shift+Enter) |
| `app/(pages)/experiments/browser-automation/store/slices/sessionsSlice.ts` | Status polling, retry logic |
| `app/(pages)/experiments/browser-automation/store/slices/chatSlice.ts` | Error recovery, reconnection |
| `app/(pages)/experiments/browser-automation/page.tsx` | Global keyboard shortcuts (Cmd+K), polling lifecycle |

---

## File Tree Summary

After all phases, the browser automation feature will have this structure:

```
app/
├── api/
│   └── browser-automation/
│       ├── services/
│       │   ├── anchor-client.ts      # SDK wrapper
│       │   ├── anchor-agent.ts       # agent.task() wrapper
│       │   └── profile-manager.ts    # Profile CRUD
│       ├── sessions/
│       │   ├── route.ts              # List/Create sessions
│       │   └── [sessionId]/
│       │       ├── route.ts          # Get/Delete session
│       │       └── chat/
│       │           └── route.ts      # SSE chat endpoint
│       ├── profiles/
│       │   ├── route.ts              # List/Create profiles
│       │   └── [profileId]/
│       │       └── route.ts          # Get/Delete profile
│       └── spike/                    # Phase 0 spike (already exists)
│           ├── test/route.ts
│           └── services/...
│
└── (pages)/
    └── experiments/
        └── browser-automation/
            ├── page.tsx              # Main page
            ├── store/
            │   ├── index.ts          # Store composition
            │   ├── types.ts          # Combined type
            │   └── slices/
            │       ├── sessionsSlice.ts
            │       ├── browserSlice.ts
            │       ├── uiSlice.ts
            │       ├── chatSlice.ts
            │       ├── actionsSlice.ts
            │       └── profilesSlice.ts
            └── components/
                ├── SessionsSidebar/
                │   ├── index.tsx
                │   ├── SessionCard.tsx
                │   ├── NewSessionButton.tsx
                │   └── NewSessionDialog.tsx
                ├── BrowserView/
                │   ├── index.tsx
                │   ├── BrowserChrome.tsx
                │   ├── LoadingState.tsx
                │   ├── ErrorState.tsx
                │   └── EmptyState.tsx
                ├── ChatPanel/
                │   ├── index.tsx
                │   ├── ChatArea.tsx
                │   ├── ChatEmpty.tsx
                │   ├── ChatInput.tsx
                │   └── ActionBadge.tsx
                ├── ActionLog/
                │   ├── index.tsx
                │   ├── ActionEntry.tsx
                │   ├── ActionFilters.tsx
                │   └── ActionEmpty.tsx
                └── ProfileManager/
                    ├── index.tsx
                    ├── ProfileCard.tsx
                    ├── CreateProfileForm.tsx
                    └── ProfilePicker.tsx
```

---

## TopNav Update

Add to `NAV_ITEMS` in `components/layout/TopNav.tsx`:

```typescript
import { Globe } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: null },
  { href: "/workforce", label: "Workforce", icon: Users },
  { href: "/records", label: "Records", icon: Database },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/experiments/browser-automation", label: "Browser", icon: Globe }, // NEW
  { href: "/marketplace", label: "Marketplace", icon: LayoutGrid },
];
```

---

## Environment Variables Required

```env
# Already in .env.local from Phase 0
ANCHOR_API_KEY=your_anchor_api_key_here
```

---

## Document Updates Required

### Phase 2 Layout Correction

The Phase 2 document (`07-Phase2-Basic-Playground-UI.md`) currently shows:
- Sessions sidebar LEFT
- Browser view CENTER
- Chat panel RIGHT

**Needs update to cursor-style layout:**
- Sessions sidebar (collapsible, LEFT)
- Chat panel LEFT
- Browser view RIGHT

This correction will be made before implementation begins.

---

## Execution Order

1. **Phase 1**: API Foundation (backend only)
2. **Phase 2**: Basic Playground UI (store + page + basic components)
3. **Phase 3**: Chat & Browser Agent (chat SSE + Anchor agent.task())
4. **Phase 4**: Action Log (action tracking UI)
5. **Phase 5**: Profile Management (optional enhancement)
6. **Phase 6**: Polish & Validation (error handling, keyboard shortcuts)

Each phase builds on the previous. After each phase, the feature will be incrementally usable.

---

## Phase 3 Update Confirmation

The Phase 3 document has been updated to use **Anchor's `agent.task()`** instead of Mastra agent, per user request. Key changes:

- Agent framework: Anchor `agent.task()` (not Mastra)
- Browser control: Anchor's internal Playwright (no CDP connection needed from us)
- Action events: Via `onAgentStep` callback
- Rationale: Phase 0 revealed Mastra tool execution issues; Anchor's built-in agent is proven and simpler

---

## Ready for Execution

All documentation is aligned. The file structure follows established patterns from the records feature. The layout will be cursor-style (chat LEFT, browser RIGHT) as requested.

**Awaiting approval to proceed with autonomous execution of Phases 1-6.**

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
