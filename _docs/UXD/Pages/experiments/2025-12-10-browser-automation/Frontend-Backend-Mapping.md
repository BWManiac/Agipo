# Browser Automation Feature - Frontend-Backend Mapping

**Date:** December 10, 2025
**Status:** Implementation Planning
**Purpose:** Map frontend UI components to backend API requirements

---

## Overview

This document maps each mockup to the APIs needed to implement the browser automation playground.

---

## Mockup Index

| File | Purpose | APIs Needed |
|------|---------|-------------|
| `01-playground-main.html` | Primary layout with browser view, chat, sessions | All APIs |
| `02-session-management/02-session-empty.html` | Empty state, no sessions | - (UI only) |
| `02-session-management/02-session-active.html` | Single active session | Sessions API |
| `02-session-management/02-session-list.html` | Multiple sessions sidebar | Sessions API |
| `03-browser-view/03-browser-loading.html` | Session starting state | Sessions API |
| `03-browser-view/03-browser-active.html` | Live browser iframe | Sessions API (live_view_url) |
| `03-browser-view/03-browser-error.html` | Connection error state | - (UI only) |
| `04-chat-interface/04-chat-empty.html` | Empty chat state | - (UI only) |
| `04-chat-interface/04-chat-conversation.html` | Active conversation | Chat/Actions API |
| `04-chat-interface/04-chat-streaming.html` | Agent responding | Chat/Actions API (streaming) |
| `05-action-log/05-action-log-empty.html` | No actions yet | - (UI only) |
| `05-action-log/05-action-log-active.html` | Actions in progress | Actions API |
| `06-profile-management/06-profiles-list.html` | Profile selector dropdown | Profiles API |
| `06-profile-management/06-profile-create.html` | Create profile modal | Profiles API |
| `06-profile-management/06-profile-empty.html` | No profiles state | - (UI only) |

---

## API Requirements by Component

### 1. Session Management

**New APIs Needed:**

#### `POST /api/browser-automation/sessions`
Create a new browser session.

```typescript
// Request
{
  profileName?: string;        // Optional: Use saved profile
  initialUrl?: string;         // Optional: Navigate on start
  config?: {
    timeout?: {
      maxDuration?: number;    // Minutes (default: 20)
      idleTimeout?: number;    // Minutes (default: 5)
    };
    recording?: boolean;       // Enable recording (default: true)
  };
}

// Response
{
  success: boolean;
  session: {
    id: string;                // Session ID (e.g., "sess_abc123")
    cdpUrl: string;            // WebSocket URL for Playwright
    liveViewUrl: string;       // URL for iframe embedding
    status: "starting" | "running" | "idle" | "stopped";
    profileName?: string;      // Profile used (if any)
    createdAt: string;         // ISO timestamp
  };
}
```

#### `GET /api/browser-automation/sessions`
List all active sessions.

```typescript
// Response
{
  sessions: Array<{
    id: string;
    status: "running" | "idle" | "stopped";
    currentUrl?: string;
    profileName?: string;
    createdAt: string;
    actionCount: number;
  }>;
  count: number;
}
```

#### `GET /api/browser-automation/sessions/[sessionId]`
Get session details.

```typescript
// Response
{
  session: {
    id: string;
    cdpUrl: string;
    liveViewUrl: string;
    status: "running" | "idle" | "stopped";
    currentUrl?: string;
    profileName?: string;
    createdAt: string;
    duration: number;          // Seconds
    actionCount: number;
  };
}
```

#### `DELETE /api/browser-automation/sessions/[sessionId]`
Terminate a session.

```typescript
// Response
{
  success: boolean;
  message: string;
}
```

---

### 2. Browser Actions (Chat Interface)

**New APIs Needed:**

#### `POST /api/browser-automation/sessions/[sessionId]/chat`
Send natural language command to browser agent (streaming).

```typescript
// Request
{
  message: string;             // User's natural language instruction
  threadId?: string;           // For conversation context
}

// Response (Server-Sent Events stream)
// Event types:
// - "message": Agent text response
// - "action_start": Action beginning { type, target }
// - "action_complete": Action finished { type, target, duration, success }
// - "action_error": Action failed { type, error }
// - "screenshot": Screenshot taken { base64 }
// - "extraction": Data extracted { data }
// - "done": Stream complete
```

**Data Flow:**
```
User types message
    → POST /api/browser-automation/sessions/[sessionId]/chat
    → Agent receives message + session context
    → Agent calls browser tools (navigate, click, type, etc.)
    → Each tool call emits action_start/action_complete events
    → Agent response streams back
    → UI updates chat + action log in real-time
```

---

### 3. Action Log

The action log is populated from the chat streaming events. No separate API needed - actions are derived from the `action_start`, `action_complete`, and `action_error` events.

**Frontend State:**
```typescript
interface ActionLogEntry {
  id: string;
  type: "navigate" | "click" | "type" | "extract" | "screenshot" | "download" | "wait";
  target: string;              // URL, selector, or description
  status: "pending" | "running" | "success" | "error";
  timestamp: string;
  duration?: number;           // Milliseconds
  error?: string;
  details?: Record<string, any>;
}
```

---

### 4. Profile Management

**New APIs Needed:**

#### `GET /api/browser-automation/profiles`
List all browser profiles.

```typescript
// Response
{
  profiles: Array<{
    name: string;              // Profile identifier
    icon: string;              // Emoji or icon
    credentialCount: number;
    hasCookies: boolean;
    createdAt: string;
    lastUsed?: string;
  }>;
}
```

#### `POST /api/browser-automation/profiles`
Create a new profile.

```typescript
// Request
{
  name: string;                // Required: Profile name
  icon?: string;               // Optional: Emoji (default: 💼)
  credentials?: Array<{
    label: string;             // e.g., "Slack Login"
    username: string;
    password: string;
    domain?: string;           // e.g., "slack.com"
  }>;
  config?: {
    viewport?: {
      width: number;
      height: number;
    };
    proxy?: {
      active: boolean;
      type?: string;
      countryCode?: string;
    };
  };
}

// Response
{
  success: boolean;
  profile: {
    name: string;
    icon: string;
    credentialCount: number;
    createdAt: string;
  };
}
```

#### `GET /api/browser-automation/profiles/[profileName]`
Get profile details (credentials masked).

```typescript
// Response
{
  profile: {
    name: string;
    icon: string;
    credentials: Array<{
      label: string;
      username: string;
      password: "••••••••";    // Always masked
      domain?: string;
    }>;
    config: {
      viewport?: { width: number; height: number };
      proxy?: { active: boolean; type?: string };
    };
    hasCookies: boolean;
    createdAt: string;
    lastUsed?: string;
  };
}
```

#### `PUT /api/browser-automation/profiles/[profileName]`
Update a profile.

```typescript
// Request - same shape as POST, all fields optional
// Response - same shape as POST
```

#### `DELETE /api/browser-automation/profiles/[profileName]`
Delete a profile.

```typescript
// Response
{
  success: boolean;
  message: string;
}
```

---

### 5. Anchor Browser Service Integration

**Service Layer (`/api/browser-automation/services/`):**

#### `anchor-client.ts`
Wrapper for Anchor Browser API.

```typescript
import AnchorClient from "anchorbrowser";

const anchorClient = new AnchorClient({
  apiKey: process.env.ANCHOR_API_KEY,
});

export async function createSession(config?: SessionConfig) {
  const session = await anchorClient.sessions.create({
    browser: {
      profile: config?.profileName ? { name: config.profileName } : undefined,
    },
    session: {
      initial_url: config?.initialUrl,
      timeout: {
        max_duration: config?.timeout?.maxDuration || 20,
        idle_timeout: config?.timeout?.idleTimeout || 5,
      },
      recording: { active: config?.recording ?? true },
    },
  });

  return {
    id: session.data.id,
    cdpUrl: session.data.cdp_url,
    liveViewUrl: session.data.live_view_url,
  };
}

export async function terminateSession(sessionId: string) {
  await anchorClient.sessions.delete(sessionId);
}

export async function listSessions() {
  const response = await fetch("https://api.anchorbrowser.io/v1/sessions/all/status", {
    headers: { "anchor-api-key": process.env.ANCHOR_API_KEY! },
  });
  return response.json();
}
```

#### `browser-agent.ts`
Mastra agent for browser control.

```typescript
import { Agent } from "@mastra/core/agent";
import { chromium } from "playwright";

export async function createBrowserAgent(cdpUrl: string) {
  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  return new Agent({
    name: "browser-control",
    instructions: `You control a browser. Execute user instructions by calling browser tools.
    Always explain what you're doing before and after each action.
    If an action fails, explain the error and suggest alternatives.`,
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    tools: {
      navigate: createNavigateTool(page),
      click: createClickTool(page),
      type: createTypeTool(page),
      screenshot: createScreenshotTool(page),
      extract: createExtractTool(page),
      download: createDownloadTool(page),
      wait: createWaitTool(page),
    },
  });
}
```

#### `profile-storage.ts`
Profile file system operations.

```typescript
// Storage location: _tables/browser-profiles/[profileName]/
// Files:
//   - config.ts: Profile configuration (name, icon, credentials, settings)
//   - Note: Actual cookies/browser state stored by Anchor Browser cloud

export async function saveProfile(profile: ProfileConfig): Promise<void>;
export async function getProfile(name: string): Promise<ProfileConfig | null>;
export async function listProfiles(): Promise<ProfileSummary[]>;
export async function deleteProfile(name: string): Promise<void>;
```

---

## Data Model

### Profile Storage (`_tables/browser-profiles/`)

```
_tables/browser-profiles/
├── index.ts                    # Profile registry
└── [profile-name]/
    └── config.ts               # Profile configuration
```

**Profile Config Shape:**
```typescript
// _tables/browser-profiles/my-work-account/config.ts
export const profileConfig = {
  name: "my-work-account",
  displayName: "My Work Account",
  icon: "💼",
  credentials: [
    {
      id: "cred_001",
      label: "Slack Login",
      username: "john@company.com",
      password: "encrypted:abc123...",  // Encrypted at rest
      domain: "slack.com",
    },
  ],
  config: {
    viewport: { width: 1920, height: 1080 },
    proxy: { active: false },
  },
  createdAt: "2025-12-10T10:00:00Z",
  lastUsed: "2025-12-10T14:30:00Z",
};
```

---

## Implementation Order

### Phase 1: API Foundation
1. Create `/api/browser-automation/` domain
2. Build `anchor-client.ts` service wrapper
3. Create session CRUD routes

### Phase 2: Basic Playground UI
1. Create experimental page `/experiments/browser-automation`
2. Build session management components
3. Embed live browser view iframe

### Phase 3: Chat & Actions
1. Build browser agent with Playwright tools
2. Create streaming chat endpoint
3. Build chat interface component
4. Build action log component

### Phase 4: Profile Management
1. Create profile storage structure
2. Build profile CRUD API
3. Build profile UI components

### Phase 5: Polish & Validation
1. Test all user flows
2. Handle edge cases and errors
3. Validate acceptance criteria

---

## API Summary

### New APIs to Create

| API | Method | Purpose | Priority |
|-----|--------|---------|----------|
| `/api/browser-automation/sessions` | POST | Create session | **P0** |
| `/api/browser-automation/sessions` | GET | List sessions | **P0** |
| `/api/browser-automation/sessions/[id]` | GET | Get session | **P1** |
| `/api/browser-automation/sessions/[id]` | DELETE | Terminate session | **P0** |
| `/api/browser-automation/sessions/[id]/chat` | POST | Send command (streaming) | **P0** |
| `/api/browser-automation/profiles` | GET | List profiles | **P1** |
| `/api/browser-automation/profiles` | POST | Create profile | **P1** |
| `/api/browser-automation/profiles/[name]` | GET | Get profile | **P2** |
| `/api/browser-automation/profiles/[name]` | PUT | Update profile | **P2** |
| `/api/browser-automation/profiles/[name]` | DELETE | Delete profile | **P2** |

### External Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| `anchorbrowser` npm package | Anchor Browser SDK | To install |
| `playwright` | Browser automation | Already installed |
| `@mastra/core` | Agent framework | Already installed |

---

## Notes

- Chat endpoint uses Server-Sent Events for real-time streaming
- Action log is derived from chat stream events (no separate API)
- Profile credentials are encrypted at rest
- Actual browser cookies stored by Anchor Browser (not locally)
- Sessions auto-terminate based on idle/max duration config
