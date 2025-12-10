# Phase 4: Action Log

**Status:** Planned
**Depends On:** Phase 3 (Chat & Browser Agent)

**Note:** Assumes Phase 0 (Technical Spike) has validated streaming with action events. If Phase 0 revealed issues, review this phase before execution.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Display real-time action execution in a dedicated Action Log tab. This provides users with detailed visibility into what browser actions the agent is taking, including timing, status, and expandable details.

After this phase, users can switch to the "Action Log" tab to see a chronological list of all browser actions with filtering, status indicators, and expandable details for each action.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tab vs inline | Separate tab | Avoids cluttering chat, allows filtering |
| Action grouping | Chronological list | Simple, matches execution order |
| Filtering | Type-based | Most useful for debugging |
| Details | Expandable | Keep UI clean, details on demand |

### Pertinent Research

- **Mockup 05**: `05-action-log/` - Action log states (empty, active)

*Source: `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/slices/actionsSlice.ts` | Already created in Phase 3 | Enhance with filtering |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `components/ActionLog/index.tsx` | Create | Action log container |
| `components/ActionLog/ActionEntry.tsx` | Create | Single action entry |
| `components/ActionLog/ActionFilters.tsx` | Create | Filter buttons |
| `components/ActionLog/ActionEmpty.tsx` | Create | Empty state |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | Action Log tab accessible from chat panel | Click tab |
| AC-4.2 | Actions list shows all executed actions | Verify count matches chat |
| AC-4.3 | Actions appear in real-time during streaming | Watch during chat |
| AC-4.4 | Running action shows spinner | Verify spinner |
| AC-4.5 | Completed action shows checkmark + duration | Verify after completion |
| AC-4.6 | Failed action shows error icon | Trigger error, verify |
| AC-4.7 | Filter by action type works | Click navigate filter |
| AC-4.8 | "All" filter shows all actions | Click All |
| AC-4.9 | Clicking action expands details | Click entry |
| AC-4.10 | Details show target, timestamp, error | Verify content |
| AC-4.11 | Empty state shows when no actions | Initial load |
| AC-4.12 | Clear actions button works | Click clear, verify empty |

### User Flows

#### Flow 1: View Action Log

```
1. User is on Chat tab after executing some commands
2. User clicks "Action Log" tab
3. Tab switches to show action log
4. Actions displayed in chronological order
5. Most recent action at top
6. Each action shows: icon, description, status, timing
```

#### Flow 2: Filter Actions

```
1. User clicks "Navigate" filter button
2. List updates to show only navigate actions
3. Other filter buttons show counts (e.g., "Click (5)")
4. User clicks "All" to reset filter
5. Full list appears again
```

#### Flow 3: Expand Action Details

```
1. User clicks on an action entry
2. Entry expands to show details:
   - Full target/selector
   - Timestamp
   - Duration
   - Error message (if failed)
   - Any extracted data
3. User clicks again to collapse
```

#### Flow 4: Real-Time Updates

```
1. User switches to Action Log tab
2. User sends chat message from different tab
3. Actions appear in log in real-time
4. Running action shows spinner
5. When complete, spinner becomes checkmark
```

---

## Out of Scope

- Export action log
- Action replay
- Action grouping by chat message
- Persistent action history across sessions

---

## Implementation Details

### Actions Slice Enhancement

```typescript
// store/slices/actionsSlice.ts (enhance from Phase 3)

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

export interface ActionsSliceState {
  actions: ActionLogEntry[];
  filter: ActionType | "all";
  expandedActionId: string | null;
}

export interface ActionsSliceActions {
  addAction: (action: ActionLogEntry) => void;
  updateAction: (actionId: string, updates: Partial<ActionLogEntry>) => void;
  clearActions: () => void;
  clearSessionActions: (sessionId: string) => void;
  setFilter: (filter: ActionType | "all") => void;
  setExpandedActionId: (actionId: string | null) => void;
  toggleActionExpanded: (actionId: string) => void;
  getFilteredActions: () => ActionLogEntry[];
}
```

### ActionLog/index.tsx

```typescript
"use client";

import { useBrowserStore } from "../../store";
import { ActionEntry } from "./ActionEntry";
import { ActionFilters } from "./ActionFilters";
import { ActionEmpty } from "./ActionEmpty";

export function ActionLog() {
  const actions = useBrowserStore((state) => state.actions);
  const filter = useBrowserStore((state) => state.filter);
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);

  // Filter actions for current session
  const sessionActions = actions.filter(
    (a) => !activeSessionId || a.sessionId === activeSessionId
  );

  // Apply type filter
  const filteredActions =
    filter === "all"
      ? sessionActions
      : sessionActions.filter((a) => a.type === filter);

  // Count by type for filter badges
  const typeCounts = sessionActions.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (sessionActions.length === 0) {
    return <ActionEmpty />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b shrink-0">
        <ActionFilters typeCounts={typeCounts} />
      </div>

      {/* Actions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No {filter} actions yet
          </div>
        ) : (
          <div className="divide-y">
            {filteredActions.map((action) => (
              <ActionEntry key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredActions.length} action{filteredActions.length !== 1 ? "s" : ""}
            {filter !== "all" && ` (${filter})`}
          </span>
          <button
            onClick={() => useBrowserStore.getState().clearActions()}
            className="hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ActionEntry.tsx

```typescript
"use client";

import { useBrowserStore } from "../../store";
import type { ActionLogEntry, ActionType } from "../../store/slices/actionsSlice";

const ACTION_ICONS: Record<ActionType, string> = {
  navigate: "🌐",
  click: "👆",
  type: "⌨️",
  extract: "📄",
  screenshot: "📸",
  download: "⬇️",
  wait: "⏳",
};

const ACTION_COLORS: Record<string, string> = {
  running: "bg-blue-50 border-blue-200",
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  pending: "bg-gray-50 border-gray-200",
};

const STATUS_ICONS = {
  running: (
    <svg className="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  ),
  success: (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  pending: <div className="w-4 h-4 rounded-full border-2 border-gray-300" />,
};

interface ActionEntryProps {
  action: ActionLogEntry;
}

export function ActionEntry({ action }: ActionEntryProps) {
  const expandedActionId = useBrowserStore((state) => state.expandedActionId);
  const toggleActionExpanded = useBrowserStore((state) => state.toggleActionExpanded);

  const isExpanded = expandedActionId === action.id;

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={`border-l-4 ${ACTION_COLORS[action.status]} cursor-pointer transition-colors hover:bg-opacity-80`}
      onClick={() => toggleActionExpanded(action.id)}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <span className="text-lg">{ACTION_ICONS[action.type]}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm capitalize">{action.type}</span>
              <span className="text-xs text-muted-foreground truncate">
                {action.target}
              </span>
            </div>
          </div>

          {/* Status & Duration */}
          <div className="flex items-center gap-2 shrink-0">
            {action.duration && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(action.duration)}
              </span>
            )}
            {STATUS_ICONS[action.status]}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-dashed space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{formatTime(action.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target</span>
              <span className="text-right max-w-[200px] truncate font-mono text-xs">
                {action.target}
              </span>
            </div>
            {action.duration && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{formatDuration(action.duration)}</span>
              </div>
            )}
            {action.error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                {action.error}
              </div>
            )}
            {action.details && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(action.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### ActionFilters.tsx

```typescript
"use client";

import { useBrowserStore } from "../../store";
import type { ActionType } from "../../store/slices/actionsSlice";

const FILTER_OPTIONS: { value: ActionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "navigate", label: "Navigate" },
  { value: "click", label: "Click" },
  { value: "type", label: "Type" },
  { value: "extract", label: "Extract" },
  { value: "screenshot", label: "Screenshot" },
  { value: "wait", label: "Wait" },
];

interface ActionFiltersProps {
  typeCounts: Record<string, number>;
}

export function ActionFilters({ typeCounts }: ActionFiltersProps) {
  const filter = useBrowserStore((state) => state.filter);
  const setFilter = useBrowserStore((state) => state.setFilter);

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
        const count =
          option.value === "all" ? totalCount : typeCounts[option.value] || 0;
        const isActive = filter === option.value;

        // Hide filters with 0 count (except All)
        if (count === 0 && option.value !== "all") return null;

        return (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }
            `}
          >
            {option.label}
            {count > 0 && (
              <span className={`ml-1.5 ${isActive ? "opacity-80" : "opacity-60"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

### ActionEmpty.tsx

```typescript
export function ActionEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No actions yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Browser actions will appear here as the agent executes your commands.
      </p>

      {/* Action type preview */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        {[
          { icon: "🌐", label: "Navigate" },
          { icon: "👆", label: "Click" },
          { icon: "⌨️", label: "Type" },
          { icon: "📄", label: "Extract" },
          { icon: "📸", label: "Screenshot" },
          { icon: "⬇️", label: "Download" },
        ].map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50"
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-muted-foreground">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## References

- **Mockup**: `05-action-log/`
- **Implementation Plan**: `04-Implementation-Plan.md`
- **Phase 3**: Actions slice initial implementation

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

