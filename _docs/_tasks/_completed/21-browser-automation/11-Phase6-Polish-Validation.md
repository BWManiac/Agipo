# Phase 6: Polish & Validation

**Status:** Planned
**Depends On:** Phase 1-5 (All previous phases)

**Note:** Assumes Phase 0 (Technical Spike) has validated all core assumptions. If Phase 0 revealed issues, review all phases before execution.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Polish the user experience, handle edge cases, implement error recovery, and validate all acceptance criteria from previous phases. This phase ensures the feature is production-ready with graceful degradation.

After this phase, the browser automation playground handles all error conditions gracefully, provides clear feedback to users, and passes all acceptance criteria.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error recovery | Automatic retry + manual option | Balance between convenience and control |
| Session polling | 10-second interval | Balance between freshness and API usage |
| Timeout handling | Clear UI with reconnect option | User stays informed and in control |
| Keyboard shortcuts | Standard patterns (Cmd+K, Enter) | Familiar to users |

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `BrowserView/ErrorState.tsx` | Enhance | Better error messages, reconnect UI |
| `ChatPanel/ChatInput.tsx` | Enhance | Keyboard shortcuts, better loading |
| `SessionsSidebar/SessionCard.tsx` | Enhance | Status polling, error states |

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/slices/sessionsSlice.ts` | Enhance | Status polling, retry logic |
| `store/slices/chatSlice.ts` | Enhance | Reconnection, error recovery |

#### Frontend / Page

| File | Action | Purpose |
|------|--------|---------|
| `page.tsx` | Enhance | Keyboard shortcuts, global error handling |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.1 | Session timeout shows reconnect option | Wait for timeout |
| AC-6.2 | Connection error shows troubleshooting | Disconnect network |
| AC-6.3 | Network errors don't crash app | Simulate network failure |
| AC-6.4 | All async operations have loading states | Slow network, verify spinners |
| AC-6.5 | Keyboard: Cmd+K opens new session | Press Cmd+K |
| AC-6.6 | Keyboard: Enter sends message | Type message, press Enter |
| AC-6.7 | Keyboard: Shift+Enter adds newline | Press Shift+Enter |
| AC-6.8 | Sessions auto-refresh status | Wait 10s, verify update |
| AC-6.9 | Expired session shows clear message | Let session expire |
| AC-6.10 | All Phase 1-5 acceptance criteria pass | Full regression test |

### User Flows

#### Flow 1: Session Timeout

```
1. User creates session
2. User leaves session idle for 5 minutes
3. Session times out (Anchor terminates)
4. Browser view shows error state:
   - "Session Timed Out"
   - "This session was closed due to inactivity"
   - [Reconnect] [New Session] buttons
5. User clicks "Reconnect"
6. New session created with same profile
7. User continues working
```

#### Flow 2: Network Error During Chat

```
1. User sends message
2. Network disconnects mid-stream
3. Chat shows error: "Connection lost. Retrying..."
4. System attempts 3 retries
5. If still failing:
   - Error message: "Could not connect to browser"
   - [Retry] button appears
6. User clicks Retry after network restores
7. Message resent successfully
```

#### Flow 3: Anchor Browser Service Down

```
1. User clicks "New Session"
2. API returns 503 (Anchor unavailable)
3. Dialog shows error:
   - "Browser service temporarily unavailable"
   - "Please try again in a few minutes"
   - [Try Again] button
4. User waits, tries again
5. Service restored, session created
```

#### Flow 4: Keyboard Navigation

```
1. User presses Cmd+K anywhere on page
2. New Session dialog opens
3. User selects profile with arrow keys
4. User presses Enter to confirm
5. Session created
6. User types message
7. User presses Enter to send
8. For multiline: Shift+Enter adds newline
9. Enter sends complete message
```

---

## Implementation Details

### Enhanced Error State

```typescript
// components/BrowserView/ErrorState.tsx

interface ErrorStateProps {
  error: {
    type: "timeout" | "disconnected" | "service_error" | "unknown";
    message: string;
    code?: string;
  };
  sessionId?: string;
  profileName?: string;
  onReconnect: () => void;
  onNewSession: () => void;
}

export function ErrorState({
  error,
  sessionId,
  profileName,
  onReconnect,
  onNewSession,
}: ErrorStateProps) {
  const errorConfig = {
    timeout: {
      icon: "⏰",
      title: "Session Timed Out",
      description: "This session was closed due to inactivity.",
      showReconnect: true,
      tips: [
        "Increase idle timeout in session settings",
        "Keep the browser active to prevent timeout",
      ],
    },
    disconnected: {
      icon: "📡",
      title: "Connection Lost",
      description: "The connection to the browser was interrupted.",
      showReconnect: true,
      tips: [
        "Check your internet connection",
        "The browser session may still be running",
      ],
    },
    service_error: {
      icon: "🔧",
      title: "Service Unavailable",
      description: "The browser service is temporarily unavailable.",
      showReconnect: false,
      tips: [
        "Wait a few minutes and try again",
        "Check status.anchorbrowser.io for updates",
      ],
    },
    unknown: {
      icon: "❓",
      title: "Something Went Wrong",
      description: error.message || "An unexpected error occurred.",
      showReconnect: true,
      tips: [
        "Try creating a new session",
        "Refresh the page if the problem persists",
      ],
    },
  };

  const config = errorConfig[error.type];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">{config.icon}</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
        <p className="text-muted-foreground mb-6">{config.description}</p>

        {/* Error Details */}
        {error.code && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-700">{error.code}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-8">
          {config.showReconnect && (
            <button
              onClick={onReconnect}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Reconnect
              {profileName && (
                <span className="ml-1 opacity-75">({profileName})</span>
              )}
            </button>
          )}
          <button
            onClick={onNewSession}
            className="px-6 py-2 border rounded-lg hover:bg-secondary"
          >
            New Session
          </button>
        </div>

        {/* Troubleshooting Tips */}
        <div className="text-left">
          <p className="text-sm font-medium mb-2">Troubleshooting</p>
          <ul className="space-y-2">
            {config.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### Session Status Polling

```typescript
// Add to sessionsSlice.ts

export interface SessionsSliceActions {
  // ... existing actions
  startStatusPolling: () => void;
  stopStatusPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const createSessionsSlice: StateCreator<BrowserStore, [], [], SessionsSlice> = (
  set,
  get
) => ({
  // ... existing state and actions

  startStatusPolling: () => {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
      const { sessions } = get();
      if (sessions.length === 0) return;

      try {
        const response = await fetch("/api/browser-automation/sessions");
        const data = await response.json();

        // Update session statuses
        const updatedSessions = sessions.map((session) => {
          const updated = data.sessions.find((s: any) => s.id === session.id);
          if (updated) {
            return { ...session, status: updated.status };
          }
          // Session no longer exists in Anchor
          return { ...session, status: "stopped" as const };
        });

        set({ sessions: updatedSessions });

        // Check if active session was terminated
        const { activeSessionId, setStatus } = get();
        if (activeSessionId) {
          const activeSession = updatedSessions.find((s) => s.id === activeSessionId);
          if (activeSession?.status === "stopped") {
            setStatus("error");
          }
        }
      } catch (error) {
        console.error("Failed to poll session status:", error);
      }
    }, 10000); // Poll every 10 seconds
  },

  stopStatusPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },
});
```

### Keyboard Shortcuts

```typescript
// Add to page.tsx

"use client";

import { useEffect } from "react";
import { useBrowserStore } from "./store";

export default function BrowserAutomationPage() {
  const openNewSessionDialog = useBrowserStore((s) => s.openNewSessionDialog);
  const startStatusPolling = useBrowserStore((s) => s.startStatusPolling);
  const stopStatusPolling = useBrowserStore((s) => s.stopStatusPolling);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open new session dialog
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openNewSessionDialog();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openNewSessionDialog]);

  // Start polling on mount
  useEffect(() => {
    startStatusPolling();
    return () => stopStatusPolling();
  }, [startStatusPolling, stopStatusPolling]);

  // ... rest of component
}
```

### Chat Input Keyboard Handling

```typescript
// components/ChatPanel/ChatInput.tsx

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift: Send message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isStreaming) {
        onSend(value.trim());
        setValue("");
      }
    }
    // Shift+Enter: New line (default behavior)
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "Agent is working..." : "Type a command..."}
          disabled={disabled || isStreaming}
          className="flex-1 min-h-[44px] max-h-32 px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-gray-50 disabled:cursor-not-allowed"
          rows={1}
        />
        <button
          onClick={() => {
            if (value.trim()) {
              onSend(value.trim());
              setValue("");
            }
          }}
          disabled={!value.trim() || disabled || isStreaming}
          className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
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
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
```

### Retry Logic for Chat

```typescript
// Enhance chatSlice.ts sendMessage

sendMessage: async (sessionId, text) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // ... existing send logic
      return; // Success, exit retry loop
    } catch (error) {
      attempt++;

      if (attempt < maxRetries && (error as Error).message.includes("network")) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Max retries reached or non-network error
      set({
        error: `Failed to send message after ${attempt} attempts. ${(error as Error).message}`,
        isStreaming: false,
      });
      throw error;
    }
  }
},
```

---

## Validation Checklist

### Phase 1: API Foundation
- [ ] Session creation works
- [ ] Session listing works
- [ ] Session termination works
- [ ] Error responses are structured

### Phase 2: Basic Playground UI
- [ ] Page loads correctly
- [ ] Sessions appear in sidebar
- [ ] Session selection works
- [ ] Browser iframe loads
- [ ] Session termination works

### Phase 3: Chat & Browser Agent
- [ ] Chat sends messages
- [ ] Agent responds with streaming
- [ ] Navigate tool works
- [ ] Click tool works
- [ ] Type tool works
- [ ] Screenshot tool works
- [ ] Extract tool works
- [ ] Actions appear inline

### Phase 4: Action Log
- [ ] Actions appear in log
- [ ] Filtering works
- [ ] Details expand
- [ ] Real-time updates work

### Phase 5: Profile Management
- [ ] Profile creation works
- [ ] Profile appears in picker
- [ ] Session uses profile
- [ ] Profile deletion works

### Phase 6: Polish
- [ ] Error states render correctly
- [ ] Keyboard shortcuts work
- [ ] Status polling works
- [ ] Retry logic works

---

## References

- **All Previous Phase Documents**
- **UXD Mockups**: `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`
- **Implementation Plan**: `04-Implementation-Plan.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

