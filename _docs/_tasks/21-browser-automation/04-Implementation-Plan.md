# Task 21: Browser Automation — Implementation Plan

**Status:** Planning
**Date:** December 10, 2025
**Purpose:** Detailed implementation plan with file impact analysis, using the established store slice pattern.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decision: Store Slices](#2-architecture-decision-store-slices)
3. [Store Architecture](#3-store-architecture)
4. [File Impact Analysis](#4-file-impact-analysis)
5. [Phase Breakdown](#5-phase-breakdown)
6. [Detailed Slice Specifications](#6-detailed-slice-specifications)
7. [Dependency Graph](#7-dependency-graph)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Executive Summary

### Scope

Build a browser automation playground that enables users to:
- Create and manage cloud browser sessions (via Anchor Browser)
- Control browsers through natural language chat
- View live browser activity in an embedded iframe
- Track action execution in real-time
- Save and reuse browser profiles with credentials

### Effort Estimate

| Phase | Focus | New Files | Modified Files | Complexity |
|-------|-------|-----------|----------------|------------|
| Phase 0 | Technical Spike | 6 | 2 | Low |
| Phase 1 | API Foundation | 6 | 1 | Medium |
| Phase 2 | Basic Playground UI | 18 | 0 | High |
| Phase 3 | Chat & Browser Agent | 8 | 1 | High |
| Phase 4 | Action Log | 4 | 0 | Medium |
| Phase 5 | Profile Management | 7 | 1 | Medium |
| Phase 6 | Polish & Validation | 2 | 5 | Low |
| **Total** | | **51** | **10** | |

**Note:** Phase 0 is a technical spike to validate assumptions. After Phase 0, all later phases should be reviewed and updated if assumptions changed.

---

## 2. Architecture Decision: Store Slices

### Decision

**Use Zustand store slices for all state management in the browser automation playground.**

### Rationale

Following established patterns in:
- `app/(pages)/workflows/editor/store/` (10 slices)
- `app/(pages)/workforce/components/agent-modal/store/` (3 slices)
- `app/(pages)/records/store/` (6 slices - planned)

### Why Store Slices?

The browser automation playground has complex, interconnected state:

| Concern | Without Store | With Store Slices |
|---------|---------------|-------------------|
| Session list | useState in SessionsSidebar | `sessionsSlice.sessions` |
| Active session | Props drilling through BrowserView | `browserSlice.activeSessionId` |
| Chat messages | Local state in ChatPanel | `chatSlice.messages` |
| Action log entries | SSE event aggregation | `actionsSlice.actions` |
| Profile selection | Modal state + selection | `profilesSlice.selectedProfile` |
| Cross-component updates | Context/callbacks | Direct store access via `get()` |

### Data Flow Pattern

```
User Action → Store Action → API Call → Store Update → Component Re-render
                                              ↓
                                     SSE Events → Store Update → Component Re-render
```

This enables:
- **Real-time updates**: SSE events directly update store
- **Cross-component coordination**: Chat can trigger action log updates
- **Persistence**: Store can persist session selection across navigation
- **Testability**: Store actions are pure functions

---

## 3. Store Architecture

### Store Composition

```typescript
// app/(pages)/experiments/browser-automation/store/index.ts

import { create } from "zustand";
import { createSessionsSlice } from "./slices/sessionsSlice";
import { createBrowserSlice } from "./slices/browserSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createActionsSlice } from "./slices/actionsSlice";
import { createProfilesSlice } from "./slices/profilesSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { BrowserStore } from "./types";

export const useBrowserStore = create<BrowserStore>()(
  (...args) => ({
    ...createSessionsSlice(...args),
    ...createBrowserSlice(...args),
    ...createChatSlice(...args),
    ...createActionsSlice(...args),
    ...createProfilesSlice(...args),
    ...createUiSlice(...args),
  })
);
```

### Type Composition

```typescript
// app/(pages)/experiments/browser-automation/store/types.ts

import type { SessionsSlice } from "./slices/sessionsSlice";
import type { BrowserSlice } from "./slices/browserSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { ActionsSlice } from "./slices/actionsSlice";
import type { ProfilesSlice } from "./slices/profilesSlice";
import type { UiSlice } from "./slices/uiSlice";

export type BrowserStore = SessionsSlice &
  BrowserSlice &
  ChatSlice &
  ActionsSlice &
  ProfilesSlice &
  UiSlice;
```

### Slice Responsibilities

| Slice | Responsibility | State Examples |
|-------|----------------|----------------|
| `sessionsSlice` | Session CRUD, list management | `sessions`, `isCreating`, `isLoading` |
| `browserSlice` | Active browser state | `activeSessionId`, `liveViewUrl`, `status`, `currentUrl` |
| `chatSlice` | Messages, streaming, thread | `messages`, `isStreaming`, `threadId`, `error` |
| `actionsSlice` | Action log entries, filtering | `actions`, `filter`, `expandedActionId` |
| `profilesSlice` | Profile CRUD, selection | `profiles`, `selectedProfileName`, `isCreating` |
| `uiSlice` | Layout, panels, dialogs | `chatPanelTab`, `profileDialogOpen`, `sidebarCollapsed` |

---

## 4. File Impact Analysis

### Legend

| Symbol | Meaning |
|--------|---------|
| 🆕 | New file to create |
| ✏️ | Existing file to modify |
| 📋 | Pattern to follow from existing code |

---

### 4.1 Store Files (NEW)

```
app/(pages)/experiments/browser-automation/store/
├── index.ts                           # 🆕 Store composition
├── types.ts                           # 🆕 Combined store type
└── slices/
    ├── sessionsSlice.ts               # 🆕 Session management
    ├── browserSlice.ts                # 🆕 Active browser state
    ├── chatSlice.ts                   # 🆕 Chat messages & streaming
    ├── actionsSlice.ts                # 🆕 Action log entries
    ├── profilesSlice.ts               # 🆕 Profile management
    └── uiSlice.ts                     # 🆕 UI state
```

**Pattern Source:** `workforce/components/agent-modal/store/`

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `index.ts` | 30 | Low | All slices |
| `types.ts` | 40 | Low | All slice types |
| `sessionsSlice.ts` | 150 | High | Sessions API |
| `browserSlice.ts` | 80 | Medium | Sessions slice |
| `chatSlice.ts` | 180 | High | Chat API, Actions slice |
| `actionsSlice.ts` | 100 | Medium | None |
| `profilesSlice.ts` | 120 | Medium | Profiles API |
| `uiSlice.ts` | 60 | Low | None |

---

### 4.2 Frontend Components

#### Pages

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/(pages)/experiments/browser-automation/page.tsx` | 🆕 | High | Main playground page |

#### Components — Sessions Sidebar

```
app/(pages)/experiments/browser-automation/components/SessionsSidebar/
├── index.tsx                          # 🆕 Main sidebar container
├── SessionCard.tsx                    # 🆕 Individual session card
├── NewSessionButton.tsx               # 🆕 Create session button + dialog
└── ProfilePicker.tsx                  # 🆕 Profile selection dropdown
```

**Pattern Source:** `records/components/ChatSidebar/`

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `sessionsSlice`, `browserSlice`, `uiSlice` |
| `SessionCard.tsx` | 80 | Low | `sessionsSlice`, `browserSlice` |
| `NewSessionButton.tsx` | 120 | Medium | `sessionsSlice`, `profilesSlice` |
| `ProfilePicker.tsx` | 80 | Low | `profilesSlice` |

#### Components — Browser View

```
app/(pages)/experiments/browser-automation/components/BrowserView/
├── index.tsx                          # 🆕 Main browser container
├── BrowserChrome.tsx                  # 🆕 URL bar, controls
├── LoadingState.tsx                   # 🆕 Session starting state
├── ErrorState.tsx                     # 🆕 Connection error state
└── EmptyState.tsx                     # 🆕 No session selected
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 120 | High | `browserSlice`, `sessionsSlice` |
| `BrowserChrome.tsx` | 80 | Medium | `browserSlice` |
| `LoadingState.tsx` | 60 | Low | None |
| `ErrorState.tsx` | 80 | Low | `browserSlice`, `sessionsSlice` |
| `EmptyState.tsx` | 50 | Low | `sessionsSlice` |

#### Components — Chat Panel

```
app/(pages)/experiments/browser-automation/components/ChatPanel/
├── index.tsx                          # 🆕 Main panel container
├── TabSwitcher.tsx                    # 🆕 Chat / Action Log tabs
├── ChatArea.tsx                       # 🆕 Messages display
├── ChatEmpty.tsx                      # 🆕 Empty chat state
└── ChatInput.tsx                      # 🆕 Message input
```

**Pattern Source:** `workforce/.../ChatTab/components/`

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `uiSlice`, `chatSlice` |
| `TabSwitcher.tsx` | 40 | Low | `uiSlice` |
| `ChatArea.tsx` | 150 | High | `chatSlice` |
| `ChatEmpty.tsx` | 60 | Low | None |
| `ChatInput.tsx` | 100 | Medium | `chatSlice`, `browserSlice` |

#### Components — Action Log

```
app/(pages)/experiments/browser-automation/components/ActionLog/
├── index.tsx                          # 🆕 Action log container
├── ActionEntry.tsx                    # 🆕 Single action entry
├── ActionFilters.tsx                  # 🆕 Filter by action type
└── ActionEmpty.tsx                    # 🆕 No actions state
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 80 | Medium | `actionsSlice` |
| `ActionEntry.tsx` | 100 | Medium | `actionsSlice` |
| `ActionFilters.tsx` | 60 | Low | `actionsSlice` |
| `ActionEmpty.tsx` | 40 | Low | None |

#### Components — Profile Dialog

```
app/(pages)/experiments/browser-automation/components/ProfileDialog/
├── index.tsx                          # 🆕 Modal container
├── ProfileForm.tsx                    # 🆕 Create/edit form
└── CredentialsList.tsx                # 🆕 Credentials management
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 80 | Medium | `uiSlice`, `profilesSlice` |
| `ProfileForm.tsx` | 150 | High | `profilesSlice` |
| `CredentialsList.tsx` | 120 | Medium | `profilesSlice` |

---

### 4.3 Backend API Routes

#### Sessions Routes

```
app/api/browser-automation/
├── sessions/
│   ├── route.ts                       # 🆕 GET list, POST create
│   └── [sessionId]/
│       ├── route.ts                   # 🆕 GET details, DELETE terminate
│       └── chat/
│           ├── route.ts               # 🆕 POST streaming chat
│           └── services/
│               ├── browser-agent.ts   # 🆕 Mastra agent with browser tools
│               └── browser-tools.ts   # 🆕 Playwright tool definitions
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `sessions/route.ts` | 100 | Medium | anchor-client |
| `sessions/[sessionId]/route.ts` | 80 | Medium | anchor-client |
| `chat/route.ts` | 150 | High | browser-agent, Mastra |
| `chat/services/browser-agent.ts` | 120 | High | Mastra, browser-tools |
| `chat/services/browser-tools.ts` | 250 | High | Playwright |

#### Profiles Routes

```
app/api/browser-automation/
├── profiles/
│   ├── route.ts                       # 🆕 GET list, POST create
│   └── [profileName]/
│       └── route.ts                   # 🆕 GET, PUT, DELETE
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `profiles/route.ts` | 80 | Medium | profile-storage |
| `profiles/[profileName]/route.ts` | 100 | Medium | profile-storage |

---

### 4.4 Backend Services

```
app/api/browser-automation/services/
├── anchor-client.ts                   # 🆕 Anchor Browser SDK wrapper
├── session-manager.ts                 # 🆕 Session lifecycle management
└── profile-storage.ts                 # 🆕 Profile file operations
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `anchor-client.ts` | 150 | Medium | anchorbrowser SDK |
| `session-manager.ts` | 100 | Medium | anchor-client |
| `profile-storage.ts` | 120 | Medium | File I/O |

---

### 4.5 Profile Storage

```
_tables/browser-profiles/
├── index.ts                           # 🆕 Profile registry
└── [profile-name]/
    └── config.ts                      # 🆕 Profile configuration
```

---

### 4.6 File Count Summary

| Category | New | Modified | Total |
|----------|-----|----------|-------|
| Store | 8 | 0 | 8 |
| Frontend Page | 1 | 0 | 1 |
| Frontend Components | 22 | 0 | 22 |
| Backend Routes | 6 | 0 | 6 |
| Backend Services | 3 | 0 | 3 |
| Chat Services | 2 | 0 | 2 |
| Profile Storage | 2 | 0 | 2 |
| Dependencies | 0 | 1 | 1 |
| **Total** | **44** | **1** | **45** |

---

## 5. Phase Breakdown

### Phase 0: Technical Spike

**Goal:** Validate core technical assumptions before building full infrastructure.

**Why first:** Before investing in 45+ files, we need to confirm that Anchor Browser API, Playwright CDP connection, Mastra agent integration, and streaming all work as expected.

**Status:** See `00-Phase0-Technical-Spike.md` for complete details.

**Key Validations:**
- Anchor Browser SDK integration
- Playwright CDP connection
- Basic browser actions (navigate, click, type)
- Mastra agent with browser tools
- Streaming responses

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them. If Phase 0 reveals any issues or learnings that change our assumptions, update the technical architecture and phase plans accordingly.

---

### Phase 1: API Foundation

**Goal:** Create backend infrastructure for session management.

**Why second:** Can't build UI without backend. Sessions API is the foundation.

**Depends On:** Phase 0 (Technical Spike) - Assumes all core assumptions validated.

#### Files to Create

| File | Description |
|------|-------------|
| `app/api/browser-automation/sessions/route.ts` | List and create sessions |
| `app/api/browser-automation/sessions/[sessionId]/route.ts` | Get and terminate session |
| `app/api/browser-automation/services/anchor-client.ts` | Anchor Browser SDK wrapper |
| `app/api/browser-automation/services/session-manager.ts` | Session lifecycle |

#### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `anchorbrowser` dependency |

#### Acceptance Criteria

- [ ] `POST /api/browser-automation/sessions` creates session via Anchor Browser
- [ ] Response includes `id`, `cdpUrl`, `liveViewUrl`, `status`
- [ ] `GET /api/browser-automation/sessions` lists active sessions
- [ ] `DELETE /api/browser-automation/sessions/[id]` terminates session
- [ ] `GET /api/browser-automation/sessions/[id]` returns session details
- [ ] Error handling for Anchor Browser API failures

#### Test Plan

1. Create session via curl/Postman
2. Verify session appears in Anchor Browser dashboard
3. List sessions via API
4. Terminate session
5. Verify session removed from Anchor Browser

---

### Phase 2: Basic Playground UI

**Goal:** Create page layout with session management and browser iframe.

**Why second:** Core UI structure that everything else builds on.

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/index.ts` | Store composition |
| `store/types.ts` | Combined store type |
| `store/slices/sessionsSlice.ts` | Session CRUD state |
| `store/slices/browserSlice.ts` | Active browser state |
| `store/slices/uiSlice.ts` | UI state |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `page.tsx` | Main playground page |
| `components/SessionsSidebar/index.tsx` | Sessions list |
| `components/SessionsSidebar/SessionCard.tsx` | Session card |
| `components/SessionsSidebar/NewSessionButton.tsx` | Create session |
| `components/BrowserView/index.tsx` | Browser iframe container |
| `components/BrowserView/BrowserChrome.tsx` | URL bar |
| `components/BrowserView/LoadingState.tsx` | Loading state |
| `components/BrowserView/EmptyState.tsx` | No session |

#### Acceptance Criteria

- [ ] Page at `/experiments/browser-automation` loads
- [ ] Sessions sidebar shows list of sessions
- [ ] "New Session" button opens creation dialog
- [ ] Creating session calls API, adds to list
- [ ] Clicking session selects it (`browserSlice.activeSessionId`)
- [ ] Browser view shows iframe with `liveViewUrl`
- [ ] Loading state shows while session is starting
- [ ] Empty state shows when no session selected
- [ ] Terminate button removes session

---

### Phase 3: Chat & Browser Agent

**Goal:** Enable natural language browser control.

**Why third:** Core feature that makes this a "playground."

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `sessions/[sessionId]/chat/route.ts` | Streaming chat endpoint |
| `sessions/[sessionId]/chat/services/browser-agent.ts` | Mastra agent |
| `sessions/[sessionId]/chat/services/browser-tools.ts` | Playwright tools |

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/chatSlice.ts` | Chat messages, streaming |
| `store/slices/actionsSlice.ts` | Action log (for SSE events) |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/ChatPanel/index.tsx` | Chat panel container |
| `components/ChatPanel/TabSwitcher.tsx` | Chat/Action Log tabs |
| `components/ChatPanel/ChatArea.tsx` | Messages display |
| `components/ChatPanel/ChatEmpty.tsx` | Empty state |
| `components/ChatPanel/ChatInput.tsx` | Message input |

#### Acceptance Criteria

- [ ] Chat panel appears on right side of page
- [ ] Tab switcher between "Chat" and "Action Log"
- [ ] Empty state with suggestions shown initially
- [ ] Sending message calls streaming API
- [ ] Agent response streams in real-time
- [ ] Agent can navigate to URLs
- [ ] Agent can click elements
- [ ] Agent can type text
- [ ] Agent can take screenshots
- [ ] Agent can extract data
- [ ] Browser iframe updates as agent acts
- [ ] Input disabled while agent is streaming
- [ ] Error messages shown on failure

---

### Phase 4: Action Log

**Goal:** Display real-time action execution.

**Why fourth:** Actions are derived from chat stream, needs Phase 3.

#### Files to Create

| File | Description |
|------|-------------|
| `components/ActionLog/index.tsx` | Action log container |
| `components/ActionLog/ActionEntry.tsx` | Single action entry |
| `components/ActionLog/ActionFilters.tsx` | Filter buttons |
| `components/ActionLog/ActionEmpty.tsx` | Empty state |

#### Acceptance Criteria

- [ ] Action log tab shows list of actions
- [ ] Actions appear in real-time during chat
- [ ] Each action shows: type icon, target, status, timing
- [ ] Running action shows spinner
- [ ] Completed action shows checkmark + duration
- [ ] Failed action shows error icon + message
- [ ] Filter by action type (navigate, click, type, etc.)
- [ ] Expandable details for each action
- [ ] Empty state when no actions yet

---

### Phase 5: Profile Management

**Goal:** Save and reuse browser profiles.

**Why fifth:** Enhancement to session creation flow.

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `profiles/route.ts` | List and create profiles |
| `profiles/[profileName]/route.ts` | Profile CRUD |
| `services/profile-storage.ts` | Profile file operations |
| `_tables/browser-profiles/index.ts` | Profile registry |

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/profilesSlice.ts` | Profile management |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/SessionsSidebar/ProfilePicker.tsx` | Profile dropdown |
| `components/ProfileDialog/index.tsx` | Modal container |
| `components/ProfileDialog/ProfileForm.tsx` | Create/edit form |
| `components/ProfileDialog/CredentialsList.tsx` | Credentials management |

#### Acceptance Criteria

- [ ] Profile picker shows in New Session dialog
- [ ] "Create Profile" opens profile dialog
- [ ] Profile form has: name, icon, credentials, viewport config
- [ ] Can add multiple credentials per profile
- [ ] Credentials have: label, username, password, domain
- [ ] Passwords masked in UI
- [ ] Creating profile saves to `_tables/browser-profiles/`
- [ ] Profile list refreshes after creation
- [ ] Selecting profile passes to session creation
- [ ] Session uses profile for persistent cookies
- [ ] Can edit existing profile
- [ ] Can delete profile

---

### Phase 6: Polish & Validation

**Goal:** Error handling, edge cases, UX polish.

**Why last:** Polish builds on complete functionality.

#### Files to Modify

| File | Changes |
|------|---------|
| `BrowserView/ErrorState.tsx` | Enhanced error handling |
| `chatSlice.ts` | Reconnection logic |
| `sessionsSlice.ts` | Polling for session status |
| `page.tsx` | Keyboard shortcuts |
| Various components | Loading states |

#### Acceptance Criteria

- [ ] Session timeout shows reconnect option
- [ ] Connection errors show troubleshooting tips
- [ ] Network errors don't crash app
- [ ] All async operations have loading states
- [ ] Keyboard shortcuts: Cmd+K new session, Cmd+Enter send
- [ ] Sessions auto-refresh status periodically
- [ ] Graceful handling of expired sessions
- [ ] All acceptance criteria from previous phases still pass

---

## 6. Detailed Slice Specifications

### 6.1 sessionsSlice

```typescript
// store/slices/sessionsSlice.ts

export interface BrowserSession {
  id: string;
  cdpUrl: string;
  liveViewUrl: string;
  status: "starting" | "running" | "idle" | "stopped" | "error";
  currentUrl?: string;
  profileName?: string;
  createdAt: string;
  actionCount: number;
  error?: string;
}

// 1. State Interface
export interface SessionsSliceState {
  sessions: BrowserSession[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface SessionsSliceActions {
  // CRUD
  fetchSessions: () => Promise<void>;
  createSession: (profileName?: string, initialUrl?: string) => Promise<BrowserSession>;
  terminateSession: (sessionId: string) => Promise<void>;

  // Updates
  updateSessionStatus: (sessionId: string, status: BrowserSession["status"]) => void;
  updateSessionUrl: (sessionId: string, url: string) => void;
  incrementActionCount: (sessionId: string) => void;

  // Error handling
  setError: (error: string | null) => void;
}

// 3. Combined Slice Type
export type SessionsSlice = SessionsSliceState & SessionsSliceActions;

// 4. Initial State
const initialState: SessionsSliceState = {
  sessions: [],
  isLoading: false,
  isCreating: false,
  error: null,
};
```

---

### 6.2 browserSlice

```typescript
// store/slices/browserSlice.ts

// 1. State Interface
export interface BrowserSliceState {
  activeSessionId: string | null;
  liveViewUrl: string | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  currentUrl: string | null;
  pageTitle: string | null;
}

// 2. Actions Interface
export interface BrowserSliceActions {
  // Selection
  selectSession: (sessionId: string | null) => void;

  // Status updates
  setStatus: (status: BrowserSliceState["status"]) => void;
  setCurrentUrl: (url: string | null) => void;
  setPageTitle: (title: string | null) => void;

  // Helpers
  getActiveSession: () => BrowserSession | null;

  // Reset
  clearBrowserState: () => void;
}

// 3. Combined Slice Type
export type BrowserSlice = BrowserSliceState & BrowserSliceActions;

// 4. Initial State
const initialState: BrowserSliceState = {
  activeSessionId: null,
  liveViewUrl: null,
  status: "disconnected",
  currentUrl: null,
  pageTitle: null,
};
```

---

### 6.3 chatSlice

```typescript
// store/slices/chatSlice.ts

import type { UIMessage } from "ai";

// 1. State Interface
export interface ChatSliceState {
  messages: UIMessage[];
  threadId: string | null;
  isStreaming: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface ChatSliceActions {
  // Messages
  setMessages: (messages: UIMessage[]) => void;
  addMessage: (message: UIMessage) => void;
  appendToLastMessage: (content: string) => void;
  clearMessages: () => void;

  // Thread
  setThreadId: (threadId: string | null) => void;

  // Streaming
  setIsStreaming: (streaming: boolean) => void;

  // Loading
  setIsLoadingMessages: (loading: boolean) => void;

  // Error
  setError: (error: string | null) => void;

  // High-level actions
  sendMessage: (sessionId: string, text: string) => Promise<void>;
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [],
  threadId: null,
  isStreaming: false,
  isLoadingMessages: false,
  error: null,
};
```

**Implementation Notes:**
- `sendMessage` initiates SSE connection to `/api/browser-automation/sessions/[sessionId]/chat`
- SSE events update both `chatSlice` (messages) and `actionsSlice` (action entries)
- `appendToLastMessage` enables streaming text updates

---

### 6.4 actionsSlice

```typescript
// store/slices/actionsSlice.ts

export type ActionType = "navigate" | "click" | "type" | "extract" | "screenshot" | "download" | "wait";

export interface ActionLogEntry {
  id: string;
  sessionId: string;
  type: ActionType;
  target: string;
  status: "pending" | "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
  details?: Record<string, any>;
}

// 1. State Interface
export interface ActionsSliceState {
  actions: ActionLogEntry[];
  filter: ActionType | "all";
  expandedActionId: string | null;
}

// 2. Actions Interface
export interface ActionsSliceActions {
  // CRUD
  addAction: (action: ActionLogEntry) => void;
  updateAction: (actionId: string, updates: Partial<ActionLogEntry>) => void;
  clearActions: () => void;
  clearSessionActions: (sessionId: string) => void;

  // Filtering
  setFilter: (filter: ActionType | "all") => void;

  // Expansion
  setExpandedActionId: (actionId: string | null) => void;
  toggleActionExpanded: (actionId: string) => void;

  // Helpers
  getFilteredActions: () => ActionLogEntry[];
  getSessionActions: (sessionId: string) => ActionLogEntry[];
}

// 3. Combined Slice Type
export type ActionsSlice = ActionsSliceState & ActionsSliceActions;

// 4. Initial State
const initialState: ActionsSliceState = {
  actions: [],
  filter: "all",
  expandedActionId: null,
};
```

---

### 6.5 profilesSlice

```typescript
// store/slices/profilesSlice.ts

export interface ProfileCredential {
  id: string;
  label: string;
  username: string;
  password: string;  // Masked in UI
  domain?: string;
}

export interface BrowserProfile {
  name: string;
  displayName: string;
  icon: string;
  credentials: ProfileCredential[];
  config: {
    viewport?: { width: number; height: number };
    proxy?: { active: boolean; type?: string };
  };
  createdAt: string;
  lastUsed?: string;
}

// 1. State Interface
export interface ProfilesSliceState {
  profiles: BrowserProfile[];
  selectedProfileName: string | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface ProfilesSliceActions {
  // CRUD
  fetchProfiles: () => Promise<void>;
  createProfile: (profile: Omit<BrowserProfile, "createdAt">) => Promise<BrowserProfile>;
  updateProfile: (name: string, updates: Partial<BrowserProfile>) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;

  // Selection
  selectProfile: (name: string | null) => void;

  // Helpers
  getSelectedProfile: () => BrowserProfile | null;

  // Error handling
  setError: (error: string | null) => void;
}

// 3. Combined Slice Type
export type ProfilesSlice = ProfilesSliceState & ProfilesSliceActions;

// 4. Initial State
const initialState: ProfilesSliceState = {
  profiles: [],
  selectedProfileName: null,
  isLoading: false,
  isCreating: false,
  error: null,
};
```

---

### 6.6 uiSlice

```typescript
// store/slices/uiSlice.ts

// 1. State Interface
export interface UiSliceState {
  // Panels
  sidebarCollapsed: boolean;
  chatPanelTab: "chat" | "actions";

  // Dialogs
  profileDialogOpen: boolean;
  profileDialogMode: "create" | "edit";
  editingProfileName: string | null;

  newSessionDialogOpen: boolean;
}

// 2. Actions Interface
export interface UiSliceActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Chat Panel
  setChatPanelTab: (tab: "chat" | "actions") => void;

  // Profile Dialog
  openProfileDialog: (mode: "create" | "edit", profileName?: string) => void;
  closeProfileDialog: () => void;

  // New Session Dialog
  openNewSessionDialog: () => void;
  closeNewSessionDialog: () => void;

  // Reset
  resetUiState: () => void;
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  sidebarCollapsed: false,
  chatPanelTab: "chat",
  profileDialogOpen: false,
  profileDialogMode: "create",
  editingProfileName: null,
  newSessionDialogOpen: false,
};
```

---

## 7. Dependency Graph

```
                    ┌─────────────────┐
                    │   Phase 0       │
                    │ Technical Spike │
                    │ (Validation)   │
                    └────────┬────────┘
                             │
                             │ validates assumptions for
                             ▼
                    ┌─────────────────┐
                    │   Phase 1       │
                    │ API Foundation  │
                    │ (Backend Only)  │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
                    ┌─────────────────┐
                    │   Phase 2       │
                    │ Basic Playground│
                    │  (UI + Store)   │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
                    ┌─────────────────┐
                    │   Phase 3       │
                    │  Chat & Agent   │
                    │ (Core Feature)  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │   Phase 4       │               │   Phase 5       │
   │  Action Log     │               │    Profiles     │
   │ (Chat Events)   │               │  (Enhancement)  │
   └────────┬────────┘               └────────┬────────┘
            │                                 │
            └─────────────┬───────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Phase 6       │
                 │ Polish & QA     │
                 │ (All Features)  │
                 └─────────────────┘
```

**⚠️ Important:** After Phase 0 completes, review all phases (1-6) before execution. Phase 0 may reveal issues that require updates to later phases.

### Cross-Slice Dependencies

```
sessionsSlice ───────────────────────┐
                                     ▼
browserSlice ──► (reads activeSessionId from sessions)
                                     │
chatSlice ──────────────────────────►├──► (sends messages for session)
                 │                   │
                 ▼                   │
actionsSlice ◄──┘ (receives action events from chat)

profilesSlice ───► sessionsSlice (provides profile for session creation)

uiSlice ──────► (standalone, read by components)
```

---

## 8. Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| **Core assumptions invalid** | **Phase 0 spike validates all assumptions before Phase 1** |
| Anchor Browser API instability | Implement retry logic, circuit breaker pattern |
| Playwright CDP connection issues | Graceful reconnection, clear error messages |
| Streaming complexity | Follow existing chat patterns exactly |
| Session timeout handling | Proactive status polling, clear UI feedback |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Credential encryption | Use established encryption patterns, never log secrets |
| Cross-browser compatibility | Test iframe embedding in Chrome, Firefox, Safari |
| Large action log performance | Virtualized list, limit to last 100 actions |
| Profile storage race conditions | File locking, optimistic updates |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Store complexity | Follow existing slice patterns exactly |
| UI component styling | Copy from mockups, use Tailwind tokens |
| Route organization | Follow established API patterns |

---

## Related Documents

- **Phase 0:** `00-Phase0-Technical-Spike.md` - Core assumptions validation (MUST complete first)
- **Product Spec:** `00-Product-Spec.md`
- **Technical Architecture:** `03-Technical-Architecture.md` (may need updates after Phase 0)
- **Research Log:** `02-Research-Log.md`
- **UXD Mockups:** `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/Frontend-Backend-Mapping.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Pattern Sources:**
  - `app/(pages)/workflows/editor/store/` (10 slices)
  - `app/(pages)/workforce/components/agent-modal/store/` (3 slices)
  - `app/(pages)/records/store/` (6 slices - planned)

