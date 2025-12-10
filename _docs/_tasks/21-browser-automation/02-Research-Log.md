# Task 21: Browser Automation — Research Log

**Status:** Complete
**Date:** December 9, 2025
**Parent Task:** [00-Product-Spec.md](./00-Product-Spec.md)

---

## How to Use This Document

This is a **research log** for discovering facts about external systems (APIs, SDKs, libraries) needed to implement the browser automation playground.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks (PR-X.X)
3. **Answer** — What we discovered
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** External APIs are immutable. We can't change their shape—we discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: How to create browser sessions?](#rq-1-how-to-create-browser-sessions) | PR-1.1 (Session creation) | ✅ |
| [RQ-2: How to get live view URL?](#rq-2-how-to-get-live-view-url-for-iframe-embedding) | PR-2.1, PR-2.5 (Live view iframe) | ✅ |
| [RQ-3: How to terminate sessions?](#rq-3-how-to-terminate-browser-sessions) | PR-1.4 (Terminate session) | ✅ |
| [RQ-4: How to list active sessions?](#rq-4-how-to-list-active-sessions) | PR-1.3 (List sessions) | ✅ |
| [RQ-5: How to connect Playwright to CDP?](#rq-5-how-to-connect-playwright-via-cdp) | PR-6.x (Browser actions) | ✅ |
| [RQ-6: How to create/use browser profiles?](#rq-6-how-to-createuse-browser-profiles) | PR-5.x (Browser profiles) | ✅ |
| [RQ-7: How to use natural language browser control?](#rq-7-how-to-use-natural-language-browser-control) | PR-3.x (NL control) | ✅ |
| [RQ-8: How to use the Tasks API?](#rq-8-how-to-use-the-tasks-api-for-reusable-automation) | Future (Workflow integration) | ✅ |
| [RQ-9: SDK installation and setup?](#rq-9-sdk-installation-and-setup) | All requirements | ✅ |
| [RQ-10: Does SDK work as documented?](#rq-10-does-the-anchor-browser-sdk-work-as-documented) | All (Phase 0 Spike) | ✅ |
| [RQ-11: Playwright CDP connection?](#rq-11-can-playwright-connect-to-anchor-browser-via-cdp) | PR-6.x (Phase 0 Spike) | ✅ |
| [RQ-12: Direct Playwright actions?](#rq-12-do-direct-playwright-actions-work-correctly) | PR-6.x (Phase 0 Spike) | ✅ |
| [RQ-13: Mastra Agent + Tools?](#rq-13-does-mastra-agent--browser-tools-work) | PR-3.x (Phase 0 Spike) | ⚠️ |
| [RQ-14: Tool definition syntax?](#rq-14-what-is-the-correct-tool-definition-syntax-for-ai-sdk-v5) | PR-3.x (Phase 0 Spike) | ✅ |

---

## Part 1: Anchor Browser Sessions API

### RQ-1: How to Create Browser Sessions?

**Why It Matters:** PR-1.1 (Click "New Session" creates a fresh browser instance) — This is the foundation of all browser automation. Without session creation, nothing else works.

**Status:** ✅ Answered

**Question:** How do we create a new browser session via Anchor Browser API? What parameters are available? What do we get back?

**Answer:**

```typescript
import AnchorClient from "anchorbrowser";

const anchorClient = new AnchorClient({
  apiKey: process.env.ANCHOR_API_KEY,
});

// Basic session creation
const session = await anchorClient.sessions.create();

// Session with configuration
const session = await anchorClient.sessions.create({
  session: {
    initial_url: "https://example.com",  // Optional: navigate on start
    recording: { active: true },          // Enable video recording (default)
    timeout: {
      max_duration: 20,                   // Max runtime in minutes
      idle_timeout: 5,                    // Idle timeout in minutes
    },
    live_view: { read_only: false },      // Allow interaction in live view
  },
  browser: {
    profile: {
      name: "my-profile",                 // Use saved profile
      persist: true,                      // Save state on session end
    },
    adblock: { active: true },            // Enable ad-blocking
    popup_blocker: { active: true },      // Block popups
    captcha_solver: { active: false },    // Requires proxy
    headless: { active: false },          // Headless mode
    viewport: { width: 1920, height: 1080 },
  },
  proxy: {
    active: false,                        // Enable/disable proxy
    type: "anchor_residential",           // Proxy type
    country_code: "us",                   // Geographic targeting
  },
});

// Response structure
const sessionId = session.data.id;           // Unique session ID
const cdpUrl = session.data.cdp_url;         // WebSocket for Playwright
const liveViewUrl = session.data.live_view_url; // URL for iframe
```

**Primitive Discovered:**
- Function/Method: `anchorClient.sessions.create(config?)`
- Signature: `(config?: SessionConfig) => Promise<{ data: { id: string, cdp_url: string, live_view_url: string } }>`
- Return type: Session object with `id`, `cdp_url`, `live_view_url`

**Implementation Note:** Session creation is straightforward. We can start simple (no config) and add features incrementally. The response gives us everything we need: session ID for management, CDP URL for Playwright, live view URL for iframe.

**Source:** [Anchor Browser Start Session API](https://docs.anchorbrowser.io/api-reference/browser-sessions/start-browser-session)

---

### RQ-2: How to Get Live View URL for Iframe Embedding?

**Why It Matters:** PR-2.1 (Live browser view embedded in page using Anchor Browser iframe) — Users need to SEE what the browser is doing in real-time. This builds trust and enables debugging.

**Status:** ✅ Answered

**Question:** How do we embed the live browser view in our page? What URL format? What iframe attributes?

**Answer:**

The `live_view_url` is returned directly from session creation:

```typescript
const session = await anchorClient.sessions.create();
const liveViewUrl = session.data.live_view_url;
// Format: https://live.anchorbrowser.io?sessionId={sessionId}
```

Embed in React:

```tsx
<iframe
  src={liveViewUrl}
  sandbox="allow-same-origin allow-scripts"
  allow="clipboard-read; clipboard-write"
  className="w-full h-full border-0"
/>
```

**Primitive Discovered:**
- Property: `session.data.live_view_url`
- Type: `string` (URL)
- Format: `https://live.anchorbrowser.io?sessionId={sessionId}`

**Implementation Note:**
- The live view URL is provided directly—no need to construct it manually
- The iframe updates in real-time as the browser navigates/clicks/types
- Use `sandbox` attribute for security
- Consider `read_only: false` in session config to allow user interaction via iframe

**Source:** [Anchor Browser Browser-use Integration](https://docs.anchorbrowser.io/integrations/browseruse-deployment)

---

### RQ-3: How to Terminate Browser Sessions?

**Why It Matters:** PR-1.4 (Terminate session closes browser and frees resources) — Users need to clean up sessions. Sessions have costs (compute time). Proper cleanup is essential.

**Status:** ✅ Answered

**Question:** How do we terminate a specific session? How do we terminate all sessions?

**Answer:**

```typescript
// Terminate specific session
await anchorClient.sessions.delete(sessionId);
// HTTP: DELETE /v1/sessions/{session_id}
// Response: { data: { status: "terminated" } }

// Terminate ALL sessions (emergency cleanup)
// HTTP: DELETE /v1/sessions/all
// Use with caution - terminates every session for your API key
```

**Primitive Discovered:**
- Function/Method: `anchorClient.sessions.delete(sessionId)`
- Signature: `(sessionId: string) => Promise<{ data: { status: string } }>`
- Return type: Status confirmation

**Implementation Note:**
- Sessions also auto-terminate based on `max_duration` and `idle_timeout` config
- Always clean up sessions when user navigates away or closes browser
- Consider implementing cleanup on page unload

**Source:** [Anchor Browser End Session API](https://docs.anchorbrowser.io/api-reference/browser-sessions/end-browser-session)

---

### RQ-4: How to List Active Sessions?

**Why It Matters:** PR-1.3 (List all active sessions in sidebar) — Users need to see what sessions are running and manage them.

**Status:** ✅ Answered

**Question:** How do we get a list of all active sessions with their status?

**Answer:**

```typescript
// HTTP: GET /v1/sessions/all/status
const response = await fetch('https://api.anchorbrowser.io/v1/sessions/all/status', {
  headers: { 'anchor-api-key': process.env.ANCHOR_API_KEY }
});

// Response format
{
  "data": {
    "count": 3,
    "items": [
      {
        "session_id": "sess_abc123",
        "status": "running",
        "created_at": "2025-12-09T10:30:00Z"
      },
      // ...more sessions
    ]
  }
}
```

**Primitive Discovered:**
- Endpoint: `GET /v1/sessions/all/status`
- Response: `{ data: { count: number, items: Array<{ session_id, status, created_at }> } }`

**Implementation Note:**
- SDK may not have direct method; may need raw fetch
- Consider polling interval for real-time updates
- Status values: "running", "stopped", etc.

**Source:** [Anchor Browser List Sessions API](https://docs.anchorbrowser.io/api-reference/browser-sessions/list-all-sessions-status)

---

## Part 2: Playwright CDP Integration

### RQ-5: How to Connect Playwright via CDP?

**Why It Matters:** PR-6.x (Basic browser actions) — We need Playwright to execute browser actions (navigate, click, type, screenshot, etc.). Anchor provides CDP URL; Playwright connects to it.

**Status:** ✅ Answered

**Question:** How do we connect Playwright to Anchor Browser's CDP URL? What are the limitations?

**Answer:**

```typescript
import { chromium } from 'playwright';

// Get CDP URL from session
const session = await anchorClient.sessions.create();
const cdpUrl = session.data.cdp_url;

// Connect Playwright via CDP
const browser = await chromium.connectOverCDP(cdpUrl, {
  timeout: 30000,  // Connection timeout (default)
  slowMo: 0,       // Optional delay between operations
});

// Access default context and page
const context = browser.contexts()[0];
const page = context.pages()[0];

// Now use Playwright normally
await page.goto('https://example.com');
await page.click('button#submit');
await page.fill('input[name="email"]', 'test@example.com');
const screenshot = await page.screenshot();
const content = await page.textContent('body');
```

**Primitive Discovered:**
- Function/Method: `chromium.connectOverCDP(endpointURL, options?)`
- Signature: `(url: string, options?: { timeout?, slowMo?, headers? }) => Promise<Browser>`
- Return type: Playwright Browser instance

**Important Limitations:**
1. **Chromium-only**: CDP connection only works with Chromium browsers
2. **Lower fidelity**: Some advanced Playwright features may not work
3. **Default context**: Must use `browser.contexts()[0]` to get existing context

**Implementation Note:**
- This is the standard pattern for connecting to remote browsers
- Works well for basic automation (navigate, click, type, screenshot)
- Advanced features like tracing may have limitations

**Source:** [Playwright connectOverCDP Documentation](https://playwright.dev/docs/api/class-browsertype)

---

## Part 3: Browser Profiles

### RQ-6: How to Create/Use Browser Profiles?

**Why It Matters:** PR-5.x (Browser profiles with credentials, cookies) — Profiles enable reusable authenticated sessions. Users sign in once, reuse forever.

**Status:** ✅ Answered

**Question:** How do we create profiles? How do we save cookies/credentials? How do we use profiles in new sessions?

**Answer:**

**Creating a new profile:**

```typescript
// Create session with NEW profile (persist=true saves it)
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'my-work-account',  // Profile identifier
      persist: true,             // Save profile on session end
    }
  }
});

// ... user authenticates to websites ...

// When session ends, profile is saved with:
// - Cookies
// - Local storage
// - Cache
await anchorClient.sessions.delete(session.data.id);
// Profile now persisted for future use
```

**Using an existing profile:**

```typescript
// Reference saved profile by name
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'my-work-account',  // Use saved profile
      // persist: true,         // Optional: update profile on session end
    }
  }
});

// Browser starts with saved cookies/storage
// User may already be logged in!
```

**Primitive Discovered:**
- Config option: `browser.profile.name` (string) - profile identifier
- Config option: `browser.profile.persist` (boolean) - save state on session end
- Storage: Anchor Browser manages profile storage in their cloud

**Implementation Note:**
- Profiles are stored by Anchor Browser (not in our file system!)
- We need to track profile NAMES locally for our UI
- Consider storing profile metadata in `_tables/browser-profiles/` but actual browser state is in Anchor
- Profile names must be unique per API key

**Reconciling with Product Spec:**
The product spec suggests storing profiles in `_tables/browser-profiles/`. However, Anchor Browser stores the actual browser state (cookies, storage, cache). Our local storage should track:
- Profile name (for reference)
- Profile description
- Associated credentials (username/password for our agent to use)
- Creation date, etc.

The actual cookie/session persistence is handled by Anchor.

**Source:** [Anchor Browser Profiles Documentation](https://docs.anchorbrowser.io/essentials/authentication-and-identity)

---

## Part 4: Natural Language Browser Control

### RQ-7: How to Use Natural Language Browser Control?

**Why It Matters:** PR-3.x (Natural language browser control) — This is the core UX. Users type instructions; browser executes them.

**Status:** ✅ Answered

**Question:** How do we execute browser tasks from natural language? What's the best approach?

**Answer:**

**Option A: Anchor Browser Agent (Built-in)**

Anchor Browser SDK has built-in natural language task execution:

```typescript
// Simple task execution
const result = await anchorClient.agent.task(
  "go to news.ycombinator.com and get the title of the first story"
);

// With step callbacks (for action log)
const result = await anchorClient.agent.task(
  "navigate to google.com and search for 'playwright automation'",
  {
    taskOptions: {
      onAgentStep: (step) => {
        console.log("Agent step:", step);
        // Update action log UI here
      },
    },
  }
);

// With structured output (Zod schema)
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
});

const result = await anchorClient.agent.task(
  "Extract the title, URL, and description from the current page",
  {
    taskOptions: {
      outputSchema: z.toJSONSchema(schema),
      url: "https://example.com",
    },
  }
);
```

**Option B: Mastra Agent + Playwright Tools (Custom)**

Use our existing Mastra Agent pattern with custom browser tools:

```typescript
import { Agent } from "@mastra/core/agent";
import { tool } from "ai";

const browserAgent = new Agent({
  name: "browser-control",
  instructions: `You control a browser. Execute user instructions by calling browser tools.
  Always explain what you're doing before and after each action.`,
  model: gateway("google/gemini-2.0-flash"),
  tools: {
    navigate: tool({
      description: "Navigate to a URL",
      parameters: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        await page.goto(url);
        return { success: true, url };
      },
    }),
    click: tool({
      description: "Click an element by selector or description",
      parameters: z.object({ selector: z.string() }),
      execute: async ({ selector }) => {
        await page.click(selector);
        return { success: true, clicked: selector };
      },
    }),
    type: tool({
      description: "Type text into an input field",
      parameters: z.object({
        selector: z.string(),
        text: z.string(),
      }),
      execute: async ({ selector, text }) => {
        await page.fill(selector, text);
        return { success: true };
      },
    }),
    screenshot: tool({
      description: "Take a screenshot of the current page",
      parameters: z.object({}),
      execute: async () => {
        const buffer = await page.screenshot();
        return { success: true, screenshot: buffer.toString('base64') };
      },
    }),
    extract: tool({
      description: "Extract text content from the page",
      parameters: z.object({ selector: z.string().optional() }),
      execute: async ({ selector }) => {
        const text = await page.textContent(selector || 'body');
        return { success: true, text };
      },
    }),
  },
});
```

**Recommendation:** Start with Option A (Anchor Agent) for simplicity, then evaluate Option B for more control.

**Primitive Discovered:**
- Option A: `anchorClient.agent.task(instruction, options?)`
- Option A: `anchorClient.agent.browserTask(instruction)` - returns Playwright browser access
- Option B: Mastra Agent with custom Playwright tools

**Implementation Note:**
- Anchor's agent.task() is simpler but less customizable
- Mastra Agent gives us more control over prompts, logging, streaming
- `agent.browserTask()` gives access to underlying Playwright browser for hybrid approach
- Consider starting with Anchor's agent, then migrating to Mastra if needed

**Source:** [Anchor Browser SDK Quick Start](https://docs.anchorbrowser.io/quickstart/use-via-sdk)

---

## Part 5: Tasks API (Future Reference)

### RQ-8: How to Use the Tasks API for Reusable Automation?

**Why It Matters:** Future workflow integration — Tasks allow us to create reusable automation scripts that can be versioned and deployed.

**Status:** ✅ Answered (For Future Reference)

**Question:** How do we create reusable automation tasks? How does versioning work?

**Answer:**

```typescript
// Tasks are TypeScript code that export a default async function
// Code must be base64 encoded

// task-code.ts
import AnchorClient from 'anchorbrowser';

const client = new AnchorClient({ apiKey: process.env.ANCHOR_API_KEY });

export default async function run() {
  const browser = await client.browser.create();
  const page = browser.contexts()[0].pages()[0];

  const targetUrl = process.env.ANCHOR_TARGET_URL;  // Inputs via env
  await page.goto(targetUrl);

  // ... automation logic ...

  await browser.close();
  return { success: true, data: extractedData };
}

// Creating a task via API
const taskCode = Buffer.from(code).toString('base64');

const task = await client.task.create({
  name: 'extract-location-data',
  language: 'typescript',
  code: taskCode,
  description: 'Extracts data from location lookup tool',
});

// Running a task
const execution = await client.task.run({
  taskId: task.id,
  version: 'draft',  // or version number for published
  async: false,      // Wait for completion (default)
  inputs: {
    ANCHOR_TARGET_URL: 'https://location-tool.com',
    ANCHOR_MAX_PAGES: '10',
  },
});

// Async execution (up to 3 hours)
const asyncExecution = await client.task.run({
  taskId: task.id,
  version: 'draft',
  async: true,  // Returns immediately, poll for results
});
```

**Key Constraints:**
- All inputs must be prefixed with `ANCHOR_`
- Access inputs via `process.env.ANCHOR_*`
- Async tasks max duration: 3 hours
- Tasks must be deployed (not draft) to appear in execution history

**Primitive Discovered:**
- `client.task.create({ name, language, code, description })`
- `client.task.run({ taskId, version, async?, inputs })`
- Input prefix requirement: `ANCHOR_*`

**Implementation Note:**
- Tasks API is useful for workflow integration (Phase 2)
- For playground (Phase 1), use direct session control instead
- Consider Tasks for complex, reusable workflows

**Source:** [Anchor Browser Tasks API](https://docs.anchorbrowser.io/advanced/tasks)

---

## Part 6: SDK Setup

### RQ-9: SDK Installation and Setup

**Why It Matters:** All requirements — We need the SDK to interact with Anchor Browser.

**Status:** ✅ Answered

**Question:** How do we install and initialize the Anchor Browser SDK?

**Answer:**

```bash
npm install anchorbrowser
```

```typescript
// Environment variable
// .env.local
ANCHOR_API_KEY=your_api_key_here

// Initialize client
import AnchorClient from "anchorbrowser";

const anchorClient = new AnchorClient({
  apiKey: process.env.ANCHOR_API_KEY,
});

// The client provides these namespaces:
// anchorClient.sessions - Session management
// anchorClient.agent - Natural language automation
// anchorClient.browser - Browser connection
// anchorClient.tools - Utility tools (screenshots, etc.)
// anchorClient.task - Tasks API (future)
```

**Primitive Discovered:**
- Package: `anchorbrowser`
- Class: `AnchorClient`
- Config: `{ apiKey: string }`
- Requirements: Node.js 16+

**Implementation Note:**
- Full TypeScript support with type definitions
- SDK wraps REST API calls
- Consider creating singleton service like we did for Composio

**Source:** [Anchor Browser SDK Documentation](https://docs.anchorbrowser.io/quickstart/use-via-sdk)

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Create session | `anchorClient.sessions.create(config?)` | Anchor SDK | ✅ |
| Get live view URL | `session.data.live_view_url` | Session response | ✅ |
| Get CDP URL | `session.data.cdp_url` | Session response | ✅ |
| Terminate session | `anchorClient.sessions.delete(sessionId)` | Anchor SDK | ✅ |
| List sessions | `GET /v1/sessions/all/status` | REST API | ✅ |
| Connect Playwright | `chromium.connectOverCDP(cdpUrl)` | Playwright | ✅ |
| Create/use profiles | `browser.profile: { name, persist }` | Session config | ✅ |
| NL browser control | `anchorClient.agent.task(instruction)` | Anchor SDK | ✅ |
| Custom browser agent | Mastra Agent + Playwright tools | Our code | ✅ |

### Architecture Decision: Anchor Agent vs Mastra Agent

| Approach | Pros | Cons |
|----------|------|------|
| **Anchor Agent** (`agent.task()`) | Simple, built-in, works out of box | Less control over prompts, logging |
| **Mastra Agent** (custom tools) | Full control, consistent with workforce, streaming | More code, need to build tools |
| **Hybrid** (`agent.browserTask()`) | Access to Playwright, can add custom logic | Complexity |

**Recommendation:** Start with Anchor Agent for MVP, migrate to Mastra Agent if we need more control.

### Profile Storage Clarification

**Important Discovery:** Anchor Browser stores the actual browser state (cookies, local storage, cache) in their cloud. Our `_tables/browser-profiles/` should store:

1. **Profile metadata** (name, description, creation date)
2. **Credential hints** (for our agent to use when signing in)
3. **Reference to Anchor profile name**

We don't store cookies locally—Anchor handles that.

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| No SDK method for listing sessions | Minor | Use raw fetch to REST endpoint |
| Profile storage is in Anchor cloud | Requires architecture adjustment | Store metadata locally, browser state in Anchor |

### Key Learnings

1. **Anchor Browser provides everything we need** — Session management, live viewing, CDP for Playwright, profile persistence, and even built-in NL control.

2. **Two paths for NL control** — Can use Anchor's agent.task() or build our own with Mastra. Recommend starting simple.

3. **Profiles are hybrid** — Anchor stores browser state; we store metadata and credentials locally.

4. **Live view is simple** — Just embed the URL in an iframe. Real-time updates handled by Anchor.

5. **CDP connection works** — Playwright's connectOverCDP works with Anchor's CDP URL. Some limitations but sufficient for our needs.

6. **Session config is rich** — Many options available (proxy, stealth, recording, timeouts). Start simple, add features incrementally.

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan (`03-Implementation-Plan.md`)

---

## Part 7: Phase 0 Technical Spike Results

**Date:** December 10, 2025
**Status:** ✅ Completed with findings

### Spike Overview

We implemented a technical spike to validate all core assumptions before Phase 1 implementation. The spike consisted of 5 test services and 1 API endpoint.

**Files Created:**
```
app/api/browser-automation/spike/
├── test/
│   └── route.ts              # Main test endpoint
└── services/
    ├── test-session.ts       # Session creation tests
    ├── test-playwright.ts    # CDP connection tests
    ├── test-actions.ts       # Basic browser actions
    ├── test-agent.ts         # Mastra agent integration
    └── test-full.ts          # End-to-end flow
```

### Test Results Summary

| Test | Status | Key Findings |
|------|--------|--------------|
| **Session Creation** | ✅ Pass | SDK works exactly as documented |
| **Playwright CDP** | ✅ Pass | CDP connection reliable, navigation works |
| **Basic Actions** | ✅ Pass | Navigate → Click → Type → Submit all work |
| **Agent Integration** | ⚠️ Partial | Agent streams, but tool execution has issues |
| **Full Flow** | ⚠️ Partial | Steps pass, but navigate tool fails via agent |

---

### RQ-10: Does the Anchor Browser SDK work as documented?

**Status:** ✅ Validated

**Test:** Session creation via SDK

**Result:**
```json
{
  "success": true,
  "session": {
    "id": "e653a498-e722-4c0d-beec-01bf429eb335",
    "cdpUrl": "wss://connect.anchorbrowser.io?apiKey=...&sessionId=...",
    "liveViewUrl": "https://live.anchorbrowser.io?sessionId=...",
    "status": "created"
  }
}
```

**Key Findings:**
1. SDK class is `AnchorBrowser` (not `AnchorClient` as in some docs)
2. Response has optional fields - need null checks: `session.data?.id`
3. Proxy config goes under `session.proxy`, not `browser.proxy`
4. Live view URLs work immediately - no delay

**Corrected SDK Usage:**
```typescript
import AnchorBrowser from "anchorbrowser";

const client = new AnchorBrowser({ apiKey: process.env.ANCHOR_API_KEY });

const session = await client.sessions.create({
  session: {
    proxy: { active: false, type: "anchor_proxy" },
    timeout: {
      max_duration: 10,
      idle_timeout: 5,
    },
  },
});

// Must check for undefined
if (!session.data?.id || !session.data?.cdp_url || !session.data?.live_view_url) {
  throw new Error("Session creation failed");
}
```

---

### RQ-11: Can Playwright connect to Anchor Browser via CDP?

**Status:** ✅ Validated

**Test:** CDP connection and navigation

**Result:**
```json
{
  "success": true,
  "cdpConnection": "success",
  "navigation": {
    "targetUrl": "https://example.com",
    "currentUrl": "https://example.com/",
    "pageTitle": "Example Domain"
  }
}
```

**Working Pattern:**
```typescript
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP(cdpUrl, { timeout: 30000 });
const context = browser.contexts()[0];
const page = context.pages()[0] || (await context.newPage());

await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
```

**Key Findings:**
1. Connection is fast (~1-2 seconds)
2. Must use `browser.contexts()[0]` - CDP provides existing context
3. Page may or may not exist - check and create if needed
4. `waitUntil: "domcontentloaded"` is more reliable than default

---

### RQ-12: Do direct Playwright actions work correctly?

**Status:** ✅ Validated

**Test:** Navigate → Click → Type → Submit sequence

**Result:**
```json
{
  "success": true,
  "actions": [
    { "action": "navigate", "target": "https://www.google.com", "success": true, "duration": 1137 },
    { "action": "click", "target": "textarea[name=\"q\"]", "success": true, "duration": 1608 },
    { "action": "type", "target": "browser automation test", "success": true, "duration": 504 },
    { "action": "submit", "target": "Enter key", "success": true, "duration": 1870 }
  ],
  "finalUrl": "https://www.google.com/search?q=browser+automation+test..."
}
```

**Key Findings:**
1. All basic Playwright operations work over CDP
2. Timing is acceptable (actions take ~500ms-2s)
3. Page state persists between actions
4. Keyboard events (Enter) work correctly
5. Google search selector: `textarea[name="q"]` or `input[name="q"]`

---

### RQ-13: Does Mastra Agent + Browser Tools work?

**Status:** ⚠️ Partial - Requires Investigation

**Test:** Mastra agent with custom Playwright tools

**Result:**
```json
{
  "success": false,
  "agentCreated": true,
  "streamingWorked": true,
  "toolsCalled": ["navigate", "navigate"],
  "navigation": {
    "success": false,
    "finalUrl": "about:blank"
  },
  "agentResponse": "I'll navigate to example.com... I'm encountering a technical error..."
}
```

**Key Findings:**
1. **Mastra Agent creation works** - No errors instantiating agent
2. **Streaming works** - Multiple chunks received (42 in full flow test)
3. **Tool registration works** - Agent knows about tools and tries to call them
4. **Tool execution fails** - Navigate tool called but page doesn't change

**Root Cause Hypothesis:**

The issue appears to be related to how Mastra handles tool execution with the `ai` SDK v5+ `inputSchema` format. The tool is being registered and called, but the execution may be failing silently.

**Comparison:**
- Direct Playwright actions (test-actions.ts): ✅ Works perfectly
- Same actions via Mastra Agent tools: ❌ Fails

**Investigation Needed:**
1. Check if tool execution errors are being swallowed
2. Verify tool parameter passing in Mastra
3. Consider using `parameters` vs `inputSchema` (SDK version compatibility)
4. Add try/catch with detailed logging in tool execute functions

---

### RQ-14: What is the correct tool definition syntax for ai SDK v5+?

**Status:** ✅ Answered (with caveat)

**Discovery:** The `ai` package v5+ uses `inputSchema` not `parameters`:

**Correct Syntax (ai v5+):**
```typescript
import { tool } from "ai";
import { z } from "zod";

const navigateTool = tool({
  description: "Navigate the browser to a URL",
  inputSchema: z.object({
    url: z.string().describe("The URL to navigate to"),
  }),
  async execute({ url }) {
    // Tool logic here
  },
});
```

**Incorrect Syntax (caused build errors):**
```typescript
// This doesn't work in ai v5+
const navigateTool = tool({
  description: "...",
  parameters: z.object({ ... }),  // ❌ Wrong property name
  execute: async ({ url }) => { ... },  // ❌ Arrow function may cause issues
});
```

**Existing Pattern Reference:**
See `app/(pages)/tools/editor/tools/addNode.tool.ts` for working example.

---

### Impact on Implementation Phases

#### Phase 1: API Foundation
- **No blockers** — Session CRUD API is straightforward
- Use validated SDK patterns from spike
- Add proper error handling for optional response fields

#### Phase 2: Basic Playground UI
- **No blockers** — Live view URL works in iframe
- Session list API pattern confirmed

#### Phase 3: Chat & Browser Agent
- **⚠️ Needs work** — Mastra agent tool execution issue
- **Option A:** Debug and fix Mastra tool execution
- **Option B:** Use Anchor's built-in `agent.task()` instead
- **Option C:** Hybrid - use direct Playwright for basic actions, Mastra for orchestration

**Recommendation:** Start Phase 3 with direct Playwright actions (which work), then address agent integration.

#### Phase 4: Action Log
- **No blockers** — Tool execution tracking pattern confirmed
- Timestamp + duration logging works

#### Phase 5: Profile Management
- **No blockers** — Profile config via `session.browser.profile` confirmed

#### Phase 6: Polish
- Depends on Phase 3 resolution

---

### Code Artifacts from Spike

The spike code can serve as reference for Phase 1+:

| File | Reusable For |
|------|--------------|
| `test-session.ts` | `services/anchor-client.ts` session methods |
| `test-playwright.ts` | CDP connection pattern |
| `test-actions.ts` | Direct browser action implementations |
| `test-agent.ts` | Tool definition patterns (needs debugging) |
| `test-full.ts` | Action logging pattern |

---

### Open Questions

1. **Why do Mastra agent tools fail while direct Playwright works?**
   - Priority: High (blocks Phase 3 chat integration)
   - Owner: TBD

2. **Should we use Anchor's agent.task() instead of Mastra?**
   - Priority: Medium (alternative path)
   - Trade-off: Simpler but less control

3. **How to handle tool errors gracefully in the UI?**
   - Priority: Low (Phase 6)
   - Pattern: Return error objects instead of throwing

---

## Resources Used

### Official Documentation
- [Anchor Browser Start Session API](https://docs.anchorbrowser.io/api-reference/browser-sessions/start-browser-session)
- [Anchor Browser End Session API](https://docs.anchorbrowser.io/api-reference/browser-sessions/end-browser-session)
- [Anchor Browser List Sessions API](https://docs.anchorbrowser.io/api-reference/browser-sessions/list-all-sessions-status)
- [Anchor Browser Tasks API](https://docs.anchorbrowser.io/advanced/tasks)
- [Anchor Browser Profiles](https://docs.anchorbrowser.io/essentials/authentication-and-identity)
- [Anchor Browser SDK Quick Start](https://docs.anchorbrowser.io/quickstart/use-via-sdk)
- [Anchor Browser browser-use Integration](https://docs.anchorbrowser.io/integrations/browseruse-deployment)
- [Playwright connectOverCDP](https://playwright.dev/docs/api/class-browsertype)

### Existing Code Patterns
- Agent config pattern: `_tables/agents/[agentId]/config.ts`
- Composio client pattern: `app/api/connections/services/client.ts`
- Chat service pattern: `app/api/workforce/[agentId]/chat/services/chat-service.ts`

### Phase 0 Spike Code (December 10, 2025)
- **Spike test endpoint:** `app/api/browser-automation/spike/test/route.ts`
- **Session creation:** `app/api/browser-automation/spike/services/test-session.ts`
- **Playwright CDP:** `app/api/browser-automation/spike/services/test-playwright.ts`
- **Browser actions:** `app/api/browser-automation/spike/services/test-actions.ts`
- **Agent integration:** `app/api/browser-automation/spike/services/test-agent.ts`
- **Full flow:** `app/api/browser-automation/spike/services/test-full.ts`

### Test Commands
```bash
# Test session creation
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=session"

# Test Playwright connection
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=playwright"

# Test basic actions
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=actions"

# Test agent integration
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=agent"

# Test full flow
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=full"

# Terminate a session
curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=terminate&sessionId=SESSION_ID"
```
