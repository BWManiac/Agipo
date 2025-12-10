# Task 21: Browser Automation — Technical Architecture

**Status:** Planning
**Date:** December 10, 2025
**Purpose:** Define the technologies, file structure, and implementation patterns for the Browser Automation Playground feature.

---

## 1. Technology Stack

### Frontend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **React 19** | UI framework | Core app |
| **Zustand** | Complex UI state (sessions, chat, actions) | New: `useBrowserStore` |
| **@ai-sdk/react** | Chat streaming, message handling | Reuse from Workforce ChatTab |
| **Radix UI** | Accessible primitives (Dialog, Popover, Tabs) | Already in use |
| **Tailwind CSS** | Styling | Core app |

### Backend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **Next.js API Routes** | REST endpoints | Core app |
| **Anchor Browser SDK** | Cloud browser sessions, live view | New: `anchorbrowser` |
| **Playwright** | Browser automation via CDP | New: `playwright` |
| **Mastra (@mastra/core)** | Agent runtime, tool execution | Reuse from Workforce |
| **Mastra Memory (@mastra/memory)** | Thread persistence, conversation history | Reuse from Workforce |
| **Zod** | Schema validation | Already in use |

### External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Anchor Browser** | Cloud browser infrastructure | SDK + REST API |
| **Anthropic Claude** | LLM for browser agent | Via Mastra gateway |

### Data Storage

| Storage | Purpose | Location |
|---------|---------|----------|
| **File System (TS)** | Browser profile configurations | `_tables/browser-profiles/[name]/` |
| **LibSQL (SQLite)** | Chat thread history (via Mastra Memory) | `.mastra/memory.db` |
| **Anchor Browser Cloud** | Session state, cookies, browser data | Remote (Anchor managed) |

---

## 2. File Architecture

### Frontend Structure

```
app/(pages)/experiments/browser-automation/
├── page.tsx                              # Main playground page
├── components/
│   ├── SessionsSidebar/                  # Left sidebar - session management
│   │   ├── index.tsx                     # Main sidebar container
│   │   ├── SessionCard.tsx               # Individual session card
│   │   ├── NewSessionButton.tsx          # Create session button + dialog
│   │   └── ProfilePicker.tsx             # Profile selection dropdown
│   ├── BrowserView/                      # Center - browser iframe
│   │   ├── index.tsx                     # Main browser container
│   │   ├── BrowserChrome.tsx             # URL bar, controls
│   │   ├── LoadingState.tsx              # Session starting state
│   │   ├── ErrorState.tsx                # Connection error state
│   │   └── EmptyState.tsx                # No session selected
│   ├── ChatPanel/                        # Right sidebar - chat + actions
│   │   ├── index.tsx                     # Main panel container
│   │   ├── TabSwitcher.tsx               # Chat / Action Log tabs
│   │   ├── ChatArea.tsx                  # Messages + input
│   │   ├── ChatEmpty.tsx                 # Empty chat state
│   │   └── ChatInput.tsx                 # Message input with streaming state
│   ├── ActionLog/                        # Action log tab content
│   │   ├── index.tsx                     # Action log container
│   │   ├── ActionEntry.tsx               # Single action entry
│   │   ├── ActionFilters.tsx             # Filter by action type
│   │   └── ActionEmpty.tsx               # No actions state
│   └── ProfileDialog/                    # Profile management modal
│       ├── index.tsx                     # Modal container
│       ├── ProfileForm.tsx               # Create/edit form
│       └── CredentialsList.tsx           # Credentials management
└── store/
    ├── index.ts                          # Store composition
    ├── types.ts                          # Combined store type
    └── slices/
        ├── sessionsSlice.ts              # Session management state
        ├── browserSlice.ts               # Active browser state
        ├── chatSlice.ts                  # Chat messages & streaming
        ├── actionsSlice.ts               # Action log state
        ├── profilesSlice.ts              # Profile management
        └── uiSlice.ts                    # UI state (panels, tabs)
```

### Backend Structure

```
app/api/browser-automation/
├── sessions/
│   ├── route.ts                          # GET list, POST create
│   └── [sessionId]/
│       ├── route.ts                      # GET details, DELETE terminate
│       └── chat/
│           ├── route.ts                  # POST streaming chat
│           └── services/
│               ├── browser-agent.ts      # Mastra agent with browser tools
│               └── browser-tools.ts      # Playwright tool definitions
├── profiles/
│   ├── route.ts                          # GET list, POST create
│   └── [profileName]/
│       └── route.ts                      # GET details, PUT update, DELETE
└── services/
    ├── anchor-client.ts                  # Anchor Browser SDK wrapper
    ├── profile-storage.ts                # Profile file operations
    └── session-manager.ts                # Session lifecycle management
```

### Profile Storage Structure

```
_tables/browser-profiles/
├── index.ts                              # Profile registry
└── [profile-name]/
    └── config.ts                         # Profile configuration
```

---

## 3. State Management Architecture

### Zustand Store: `useBrowserStore`

Following the established slice pattern from `Store-Slice-Architecture.md`:

```typescript
// store/index.ts

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
// store/types.ts

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
| `browserSlice` | Active session state | `activeSessionId`, `liveViewUrl`, `status` |
| `chatSlice` | Messages, streaming, sending | `messages`, `isStreaming`, `threadId` |
| `actionsSlice` | Action log entries | `actions`, `filter`, `isExpanded` |
| `profilesSlice` | Profile management | `profiles`, `selectedProfile`, `isCreating` |
| `uiSlice` | Layout, views, modals | `chatPanelTab`, `profileDialogOpen`, `sessionsSidebarCollapsed` |

---

## 4. Data Flow Architecture

### Session Creation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks "New Session" button                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ NewSessionButton opens dialog with profile picker                   │
│ User selects profile (optional), clicks "Start Session"             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ sessionsSlice.createSession(profileName)                            │
│ → POST /api/browser-automation/sessions                             │
│ → anchor-client.ts calls Anchor Browser API                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Anchor Browser returns: { id, cdp_url, live_view_url }              │
│ → Session added to sessionsSlice.sessions                           │
│ → browserSlice.activeSessionId set to new session                   │
│ → browserSlice.liveViewUrl set for iframe                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BrowserView iframe loads live_view_url                              │
│ User sees live browser in viewport                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Chat & Browser Control Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User types message in ChatInput: "Go to slack.com and sign in"      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ chatSlice.sendMessage(sessionId, message)                           │
│ → POST /api/browser-automation/sessions/[sessionId]/chat            │
│ → Server-Sent Events stream begins                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ chat/route.ts                                                       │
│ 1. Load session from Anchor Browser (get cdp_url)                   │
│ 2. Connect Playwright via CDP: chromium.connectOverCDP(cdp_url)     │
│ 3. Build browser-agent.ts with tools                                │
│ 4. Stream agent response                                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Agent executes browser tools                                        │
│ → navigate({ url: "https://slack.com" })                            │
│   → Emits: action_start, action_complete                            │
│ → click({ selector: "button.sign-in" })                             │
│   → Emits: action_start, action_complete                            │
│ → type({ selector: "input[email]", text: "user@company.com" })      │
│   → Emits: action_start, action_complete                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Client receives SSE events:                                         │
│ → "message" events → chatSlice.addMessage()                         │
│ → "action_*" events → actionsSlice.addAction()                      │
│ → "done" event → chatSlice.setIsStreaming(false)                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Browser iframe shows live updates (user sees navigation happen)     │
│ Chat shows agent message                                            │
│ Action log shows completed actions with timing                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Profile Management Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks "Create Profile" button                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ProfileDialog opens with form                                       │
│ User enters: name, icon, credentials                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ profilesSlice.createProfile(profileData)                            │
│ → POST /api/browser-automation/profiles                             │
│ → profile-storage.ts saves to _tables/browser-profiles/             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ When creating session with profile:                                 │
│ → anchor-client.ts passes profile name to Anchor Browser            │
│ → Anchor Browser loads persisted cookies/state                      │
│ → Credentials available for agent to use                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Contracts

### Sessions API

```typescript
// POST /api/browser-automation/sessions
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

```typescript
// GET /api/browser-automation/sessions
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

```typescript
// DELETE /api/browser-automation/sessions/[sessionId]
// Response
{
  success: boolean;
  message: string;
}
```

### Chat API

```typescript
// POST /api/browser-automation/sessions/[sessionId]/chat
// Request
{
  message: string;             // User's natural language instruction
  threadId?: string;           // For conversation context
}

// Response (Server-Sent Events stream)
// Event types:
// - "message": Agent text response { content: string }
// - "action_start": Action beginning { id, type, target }
// - "action_complete": Action finished { id, type, target, duration, success }
// - "action_error": Action failed { id, type, error }
// - "screenshot": Screenshot taken { base64 }
// - "extraction": Data extracted { data }
// - "done": Stream complete
```

### Profiles API

```typescript
// GET /api/browser-automation/profiles
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

```typescript
// POST /api/browser-automation/profiles
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

---

## 6. Browser Agent Tools Specification

### Tool: `navigate`

```typescript
createTool({
  id: "browser_navigate",
  description: "Navigate the browser to a URL",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to navigate to"),
    waitFor?: z.enum(["load", "domcontentloaded", "networkidle"]).default("load"),
  }),
  execute: async ({ context }, { url, waitFor }) => {
    const page = context.page;
    await page.goto(url, { waitUntil: waitFor });
    return { success: true, url: page.url(), title: await page.title() };
  },
});
```

### Tool: `click`

```typescript
createTool({
  id: "browser_click",
  description: "Click an element on the page",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector or text content to click"),
    button: z.enum(["left", "right", "middle"]).default("left"),
  }),
  execute: async ({ context }, { selector, button }) => {
    const page = context.page;
    await page.click(selector, { button });
    return { success: true, selector };
  },
});
```

### Tool: `type`

```typescript
createTool({
  id: "browser_type",
  description: "Type text into an input field",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector for the input field"),
    text: z.string().describe("Text to type"),
    clear: z.boolean().default(false).describe("Clear existing text first"),
  }),
  execute: async ({ context }, { selector, text, clear }) => {
    const page = context.page;
    if (clear) {
      await page.fill(selector, "");
    }
    await page.type(selector, text);
    return { success: true, selector, textLength: text.length };
  },
});
```

### Tool: `screenshot`

```typescript
createTool({
  id: "browser_screenshot",
  description: "Take a screenshot of the current page",
  inputSchema: z.object({
    fullPage: z.boolean().default(false),
    selector: z.string().optional().describe("Screenshot specific element"),
  }),
  execute: async ({ context }, { fullPage, selector }) => {
    const page = context.page;
    let buffer: Buffer;
    if (selector) {
      const element = await page.$(selector);
      buffer = await element!.screenshot();
    } else {
      buffer = await page.screenshot({ fullPage });
    }
    return {
      success: true,
      base64: buffer.toString("base64"),
      mimeType: "image/png"
    };
  },
});
```

### Tool: `extract`

```typescript
createTool({
  id: "browser_extract",
  description: "Extract text content from elements",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector for elements to extract"),
    attribute: z.string().optional().describe("Extract specific attribute instead of text"),
    multiple: z.boolean().default(false).describe("Extract from all matching elements"),
  }),
  execute: async ({ context }, { selector, attribute, multiple }) => {
    const page = context.page;
    if (multiple) {
      const elements = await page.$$(selector);
      const results = await Promise.all(
        elements.map(async (el) =>
          attribute ? await el.getAttribute(attribute) : await el.textContent()
        )
      );
      return { success: true, data: results };
    } else {
      const element = await page.$(selector);
      const value = attribute
        ? await element?.getAttribute(attribute)
        : await element?.textContent();
      return { success: true, data: value };
    }
  },
});
```

### Tool: `wait`

```typescript
createTool({
  id: "browser_wait",
  description: "Wait for a condition or element",
  inputSchema: z.object({
    type: z.enum(["selector", "navigation", "time"]),
    value: z.string().describe("Selector, URL pattern, or milliseconds"),
    timeout: z.number().default(30000),
  }),
  execute: async ({ context }, { type, value, timeout }) => {
    const page = context.page;
    switch (type) {
      case "selector":
        await page.waitForSelector(value, { timeout });
        break;
      case "navigation":
        await page.waitForURL(value, { timeout });
        break;
      case "time":
        await page.waitForTimeout(parseInt(value));
        break;
    }
    return { success: true, type, value };
  },
});
```

### Tool: `download`

```typescript
createTool({
  id: "browser_download",
  description: "Download a file from the page",
  inputSchema: z.object({
    selector: z.string().describe("Selector for download trigger element"),
    waitForDownload: z.boolean().default(true),
  }),
  execute: async ({ context }, { selector, waitForDownload }) => {
    const page = context.page;
    if (waitForDownload) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click(selector),
      ]);
      const path = await download.path();
      return {
        success: true,
        filename: download.suggestedFilename(),
        path,
      };
    } else {
      await page.click(selector);
      return { success: true, triggered: true };
    }
  },
});
```

---

## 7. Data Models

### Session State

```typescript
interface BrowserSession {
  id: string;                  // Anchor session ID
  cdpUrl: string;              // WebSocket URL for Playwright
  liveViewUrl: string;         // URL for iframe embedding
  status: "starting" | "running" | "idle" | "stopped" | "error";
  currentUrl?: string;         // Current page URL
  profileName?: string;        // Profile used
  createdAt: string;           // ISO timestamp
  duration?: number;           // Seconds active
  actionCount: number;         // Total actions executed
  error?: string;              // Error message if status is "error"
}
```

### Action Log Entry

```typescript
interface ActionLogEntry {
  id: string;                  // Unique action ID
  sessionId: string;           // Parent session
  type: "navigate" | "click" | "type" | "extract" | "screenshot" | "download" | "wait";
  target: string;              // URL, selector, or description
  status: "pending" | "running" | "success" | "error";
  timestamp: string;           // ISO timestamp
  duration?: number;           // Milliseconds
  error?: string;              // Error message if failed
  details?: Record<string, any>; // Action-specific data
}
```

### Profile Configuration

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

## 8. Implementation Phases

### Phase 0: Technical Spike

**Goal:** Validate core technical assumptions before building full infrastructure.

**Status:** See `00-Phase0-Technical-Spike.md` for complete details.

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them. If Phase 0 reveals any issues, update this architecture document accordingly.

---

### Phase 1: API Foundation

**Goal:** Create backend infrastructure for session management.

**Depends On:** Phase 0 (Technical Spike) - Assumes all core assumptions validated.

**Files to create:**
- `app/api/browser-automation/sessions/route.ts`
- `app/api/browser-automation/sessions/[sessionId]/route.ts`
- `app/api/browser-automation/services/anchor-client.ts`
- `app/api/browser-automation/services/session-manager.ts`

**Acceptance criteria:**
- Can create session via API
- Can list active sessions
- Can terminate session
- Session returns live_view_url for embedding

### Phase 2: Basic Playground UI

**Goal:** Create page layout with session management and browser iframe.

**Files to create:**
- `app/(pages)/experiments/browser-automation/page.tsx`
- `app/(pages)/experiments/browser-automation/store/` (all slices)
- `app/(pages)/experiments/browser-automation/components/SessionsSidebar/`
- `app/(pages)/experiments/browser-automation/components/BrowserView/`

**Acceptance criteria:**
- Sessions sidebar shows active sessions
- Can create new session from UI
- Browser iframe displays live session
- Can terminate session from UI

### Phase 3: Chat & Browser Agent

**Goal:** Enable natural language browser control.

**Files to create:**
- `app/api/browser-automation/sessions/[sessionId]/chat/route.ts`
- `app/api/browser-automation/sessions/[sessionId]/chat/services/browser-agent.ts`
- `app/api/browser-automation/sessions/[sessionId]/chat/services/browser-tools.ts`
- `app/(pages)/experiments/browser-automation/components/ChatPanel/`

**Acceptance criteria:**
- Chat panel with streaming responses
- Agent can navigate to URLs
- Agent can click elements
- Agent can type text
- Agent can take screenshots
- Agent can extract data

### Phase 4: Action Log

**Goal:** Display real-time action execution.

**Files to create:**
- `app/(pages)/experiments/browser-automation/components/ActionLog/`

**Acceptance criteria:**
- Actions appear in real-time during execution
- Each action shows type, target, status, timing
- Filter by action type
- Expandable details for each action

### Phase 5: Profile Management

**Goal:** Save and reuse browser profiles.

**Files to create:**
- `app/api/browser-automation/profiles/route.ts`
- `app/api/browser-automation/profiles/[profileName]/route.ts`
- `app/api/browser-automation/services/profile-storage.ts`
- `app/(pages)/experiments/browser-automation/components/ProfileDialog/`

**Acceptance criteria:**
- Can create profile with credentials
- Can select profile when creating session
- Profile persists cookies across sessions
- Can delete profile

### Phase 6: Polish & Validation

**Goal:** Error handling, edge cases, UX polish.

**Acceptance criteria:**
- All acceptance criteria from previous phases
- Error states handled gracefully
- Session timeout handled
- Connection errors shown with retry
- Loading states for all async operations

---

## 9. Testing Strategy

### Unit Tests

- Service functions (anchor-client, profile-storage)
- Tool execution logic
- Store slice actions

### Integration Tests

- API route handlers
- Chat streaming
- Tool → Playwright → Anchor flow

### E2E Tests (Playwright - Ironic!)

- Create session flow
- Chat with agent flow
- Profile management
- Session termination

---

## 10. Security Considerations

### Credential Storage

- Credentials encrypted at rest using AES-256
- Credentials never logged or exposed in API responses
- Passwords masked in UI (`••••••••`)

### Session Security

- Sessions scoped to user (entity ID)
- Session IDs unpredictable (UUIDs)
- CDP URLs not exposed to frontend
- Only live_view_url exposed for iframe

### Input Validation

- All API inputs validated with Zod
- URL validation for navigation
- Selector sanitization

---

## 11. Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | How to handle Anchor Browser rate limits? | Session creation | TBD |
| 2 | Should we support multiple concurrent sessions per user? | Resource usage | TBD |
| 3 | How to handle session timeouts gracefully? | UX | TBD |
| 4 | Should chat threads persist across sessions? | Memory architecture | TBD |
| 5 | How to handle credential rotation? | Security | TBD |

---

## 12. Related Documents

- **Product Spec:** `_docs/_tasks/21-browser-automation/00-Product-Spec.md`
- **Research Log:** `_docs/_tasks/21-browser-automation/02-Research-Log.md`
- **UXD Mockups:** `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/Frontend-Backend-Mapping.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

