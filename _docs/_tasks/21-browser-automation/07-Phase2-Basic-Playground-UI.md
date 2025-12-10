# Phase 2: Basic Playground UI

**Status:** Planned
**Depends On:** Phase 1 (API Foundation)

**Note:** Assumes Phase 0 (Technical Spike) has validated core assumptions. If Phase 0 revealed issues, review this phase before execution.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Create the main playground page with session management sidebar, browser iframe view, and foundational store architecture. This phase establishes the visual structure and state management that all UI features build upon.

After this phase, users can navigate to `/experiments/browser-automation`, create browser sessions, see them in a sidebar, select a session to view its live browser iframe, and terminate sessions.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Three-column (sidebar, browser, chat) | Matches mockup, optimal for workflow |
| Session sidebar | Left side, collapsible | Sessions are secondary to browser view |
| Browser iframe | Center, expandable | Primary focus of the feature |
| State management | Zustand store slices | Follows established patterns |

### Pertinent Research

- **Mockup 01**: `01-playground-main.html` - Full layout reference
- **Mockup 02**: `02-session-management/` - Session states (empty, active, list)
- **Mockup 03**: `03-browser-view/` - Browser states (loading, active, error)

*Source: `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/index.ts` | Create | Store composition |
| `store/types.ts` | Create | Combined store type |
| `store/slices/sessionsSlice.ts` | Create | Session CRUD state |
| `store/slices/browserSlice.ts` | Create | Active browser state |
| `store/slices/uiSlice.ts` | Create | UI state |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/experiments/browser-automation/page.tsx` | Create | Main playground page |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `components/SessionsSidebar/index.tsx` | Create | Sessions list container |
| `components/SessionsSidebar/SessionCard.tsx` | Create | Individual session card |
| `components/SessionsSidebar/NewSessionButton.tsx` | Create | Create session button |
| `components/BrowserView/index.tsx` | Create | Browser iframe container |
| `components/BrowserView/BrowserChrome.tsx` | Create | URL bar, controls |
| `components/BrowserView/LoadingState.tsx` | Create | Session starting state |
| `components/BrowserView/ErrorState.tsx` | Create | Connection error state |
| `components/BrowserView/EmptyState.tsx` | Create | No session selected |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-2.1 | Page loads at /experiments/browser-automation | Navigate to URL |
| AC-2.2 | Three-column layout renders | Verify sidebar, browser, chat areas |
| AC-2.3 | Sessions sidebar shows session list | Create session, verify in list |
| AC-2.4 | New Session button opens dialog | Click button |
| AC-2.5 | Creating session calls API | Monitor network, verify POST |
| AC-2.6 | New session appears in sidebar | Create, verify list updates |
| AC-2.7 | Clicking session selects it | Click card, verify highlight |
| AC-2.8 | Selected session shows in browser view | Select, verify iframe loads |
| AC-2.9 | Browser iframe displays live_view_url | Inspect iframe src |
| AC-2.10 | Loading state shows while starting | Create session, see spinner |
| AC-2.11 | Empty state shows no session selected | Initial load state |
| AC-2.12 | Terminate removes session from list | Click X, verify removal |
| AC-2.13 | Session card shows status indicator | Verify running/idle colors |

### User Flows

#### Flow 1: First Visit (Empty State)

```
1. User navigates to /experiments/browser-automation
2. Page loads with three-column layout
3. Sessions sidebar shows empty state
4. Browser view shows empty state with "Create a session" CTA
5. Chat panel shows empty state (Phase 3 placeholder)
```

#### Flow 2: Create Session

```
1. User clicks "New Session" button
2. Dialog opens with:
   - Optional initial URL input
   - Optional profile picker (disabled until Phase 5)
   - "Start Session" button
3. User clicks "Start Session"
4. Dialog closes
5. Session appears in sidebar with "Starting..." status
6. Browser view shows loading state
7. After ~2-5 seconds, iframe loads with live browser
8. Session card updates to "Running" status
```

#### Flow 3: Switch Sessions

```
1. User has multiple sessions in sidebar
2. User clicks different session card
3. Browser view updates to show selected session's iframe
4. Previous session continues running in background
```

#### Flow 4: Terminate Session

```
1. User hovers session card
2. Terminate (X) button appears
3. User clicks terminate
4. Confirmation: "End this session?"
5. User confirms
6. Session removed from sidebar
7. If was selected, browser view shows empty state
```

---

## Out of Scope

- Chat functionality (Phase 3)
- Action log (Phase 4)
- Profile management (Phase 5)
- Error reconnection (Phase 6)

---

## Implementation Details

### Store Setup

#### store/index.ts

```typescript
import { create } from "zustand";
import { createSessionsSlice, SessionsSlice } from "./slices/sessionsSlice";
import { createBrowserSlice, BrowserSlice } from "./slices/browserSlice";
import { createUiSlice, UiSlice } from "./slices/uiSlice";

export type BrowserStore = SessionsSlice & BrowserSlice & UiSlice;

export const useBrowserStore = create<BrowserStore>()((...args) => ({
  ...createSessionsSlice(...args),
  ...createBrowserSlice(...args),
  ...createUiSlice(...args),
}));
```

#### store/slices/sessionsSlice.ts

```typescript
import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

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

export interface SessionsSliceState {
  sessions: BrowserSession[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

export interface SessionsSliceActions {
  fetchSessions: () => Promise<void>;
  createSession: (profileName?: string, initialUrl?: string) => Promise<BrowserSession>;
  terminateSession: (sessionId: string) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: BrowserSession["status"]) => void;
  setError: (error: string | null) => void;
}

export type SessionsSlice = SessionsSliceState & SessionsSliceActions;

const initialState: SessionsSliceState = {
  sessions: [],
  isLoading: false,
  isCreating: false,
  error: null,
};

export const createSessionsSlice: StateCreator<
  BrowserStore,
  [],
  [],
  SessionsSlice
> = (set, get) => ({
  ...initialState,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/sessions");
      const data = await response.json();
      set({ sessions: data.sessions, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch sessions", isLoading: false });
    }
  },

  createSession: async (profileName, initialUrl) => {
    set({ isCreating: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName, initialUrl }),
      });
      const data = await response.json();
      const newSession: BrowserSession = {
        ...data.session,
        actionCount: 0,
      };
      set((state) => ({
        sessions: [...state.sessions, newSession],
        isCreating: false,
      }));
      // Auto-select new session
      get().selectSession(newSession.id);
      return newSession;
    } catch (error) {
      set({ error: "Failed to create session", isCreating: false });
      throw error;
    }
  },

  terminateSession: async (sessionId) => {
    try {
      await fetch(`/api/browser-automation/sessions/${sessionId}`, {
        method: "DELETE",
      });
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));
      // Clear selection if terminated session was selected
      if (get().activeSessionId === sessionId) {
        get().selectSession(null);
      }
    } catch (error) {
      set({ error: "Failed to terminate session" });
    }
  },

  updateSessionStatus: (sessionId, status) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status } : s
      ),
    }));
  },

  setError: (error) => set({ error }),
});
```

#### store/slices/browserSlice.ts

```typescript
import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface BrowserSliceState {
  activeSessionId: string | null;
  liveViewUrl: string | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  currentUrl: string | null;
}

export interface BrowserSliceActions {
  selectSession: (sessionId: string | null) => void;
  setStatus: (status: BrowserSliceState["status"]) => void;
  setCurrentUrl: (url: string | null) => void;
  clearBrowserState: () => void;
}

export type BrowserSlice = BrowserSliceState & BrowserSliceActions;

const initialState: BrowserSliceState = {
  activeSessionId: null,
  liveViewUrl: null,
  status: "disconnected",
  currentUrl: null,
};

export const createBrowserSlice: StateCreator<
  BrowserStore,
  [],
  [],
  BrowserSlice
> = (set, get) => ({
  ...initialState,

  selectSession: (sessionId) => {
    if (!sessionId) {
      set({ ...initialState });
      return;
    }
    const session = get().sessions.find((s) => s.id === sessionId);
    if (session) {
      set({
        activeSessionId: sessionId,
        liveViewUrl: session.liveViewUrl,
        status: session.status === "running" ? "connected" : "connecting",
        currentUrl: session.currentUrl || null,
      });
    }
  },

  setStatus: (status) => set({ status }),
  setCurrentUrl: (url) => set({ currentUrl: url }),
  clearBrowserState: () => set(initialState),
});
```

#### store/slices/uiSlice.ts

```typescript
import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface UiSliceState {
  sidebarCollapsed: boolean;
  chatPanelTab: "chat" | "actions";
  newSessionDialogOpen: boolean;
}

export interface UiSliceActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setChatPanelTab: (tab: "chat" | "actions") => void;
  openNewSessionDialog: () => void;
  closeNewSessionDialog: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

const initialState: UiSliceState = {
  sidebarCollapsed: false,
  chatPanelTab: "chat",
  newSessionDialogOpen: false,
};

export const createUiSlice: StateCreator<BrowserStore, [], [], UiSlice> = (
  set
) => ({
  ...initialState,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setChatPanelTab: (tab) => set({ chatPanelTab: tab }),
  openNewSessionDialog: () => set({ newSessionDialogOpen: true }),
  closeNewSessionDialog: () => set({ newSessionDialogOpen: false }),
});
```

### Page Component

```typescript
// app/(pages)/experiments/browser-automation/page.tsx

"use client";

import { useEffect } from "react";
import { useBrowserStore } from "./store";
import { SessionsSidebar } from "./components/SessionsSidebar";
import { BrowserView } from "./components/BrowserView";

export default function BrowserAutomationPage() {
  const fetchSessions = useBrowserStore((state) => state.fetchSessions);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sessions Sidebar */}
      <SessionsSidebar />

      {/* Browser View - Center */}
      <div className="flex-1 flex flex-col min-w-0">
        <BrowserView />
      </div>

      {/* Chat Panel - Right (Placeholder for Phase 3) */}
      <div className="w-[400px] border-l bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Chat panel (Phase 3)
        </div>
      </div>
    </div>
  );
}
```

---

## References

- **Mockup**: `01-playground-main.html`, `02-session-management/`, `03-browser-view/`
- **Store Pattern**: `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Implementation Plan**: `04-Implementation-Plan.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

