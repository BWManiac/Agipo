# Task 21: Browser Automation Playground — Product Spec

**Status:** Planning  
**Date:** December 2025  
**Goal:** Build an isolated experimental playground to validate browser automation capabilities before workflow integration

---

## How to Use This Document

This document defines **what to build** for the browser automation playground. It covers requirements, acceptance criteria, user flows, and design decisions for an experimental page that validates browser automation patterns.

**Informed by:**
- Anchor Browser API documentation: [Browser-use integration](https://docs.anchorbrowser.io/integrations/browseruse-deployment), [Automation Tasks](https://docs.anchorbrowser.io/advanced/tasks)
- Competitor analysis: Asteroid.ai browser automation patterns
- Existing agent storage patterns (`_tables/agents/`)

**This document informs:**
- API abstraction layer design
- Experimental page implementation
- Integration patterns for future workflow nodes

---

## 1. Executive Summary

**The Problem:** We need to validate browser automation patterns before integrating into workflows. Users need a way to test browser automation features in isolation, understand how profiles work, and see what agents are doing in real-time.

**The Solution:** A standalone playground page where users can create browser sessions, control browsers with natural language, manage browser profiles, and see what's happening in real-time.

**Who Benefits:** 
- **Engineering team**: Validate integration patterns and abstractions before workflow integration
- **Future users**: Better browser automation experience in workflows

**End State:** Users can open `/experiments/browser-automation`, create a browser session, give it instructions like "sign into Slack and tell me my unread messages," and watch it execute step-by-step with full visibility. They can create reusable browser profiles with saved credentials and cookies, enabling complex multi-step automations like "download files from location lookup tool and transform into presentation."

---

## 2. Product Requirements

### 2.1 Browser Session Management

**Definition:** Create, view, and terminate browser sessions

**Why it matters:** Foundation for all browser automation. Users need isolated browser instances they can control.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Click "New Session" creates a fresh browser instance via Anchor Browser API | P0 |
| PR-1.2 | See active session ID, CDP URL, and status (running/stopped) | P0 |
| PR-1.3 | List all active sessions in sidebar with creation time | P1 |
| PR-1.4 | Terminate session closes browser and frees resources | P1 |
| PR-1.5 | Session creation completes in <3 seconds | P0 |

**User Value:** Start experimenting immediately without setup. Sessions are isolated and manageable.

---

### 2.2 Live Browser Viewing

**Definition:** Watch the browser execute actions in real-time using Anchor Browser's live view

**Why it matters:** Visibility builds trust. Users can see what the agent is doing and catch issues early.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Live browser view embedded in page using Anchor Browser iframe | P0 |
| PR-2.2 | Browser view updates as agent navigates/clicks/types | P0 |
| PR-2.3 | Browser view is responsive and fills available space | P1 |
| PR-2.4 | Can see page content, forms, buttons in real-time | P0 |
| PR-2.5 | Live view URL provided by Anchor Browser session API | P0 |

**User Value:** See exactly what the browser is doing, not just logs. Real-time feedback builds confidence.

---

### 2.3 Natural Language Browser Control

**Definition:** Give instructions in plain English and watch the browser execute them

**Why it matters:** This is how users will interact with browser automation. Test the core interaction pattern.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Chat input accepts natural language instructions | P0 |
| PR-3.2 | Agent responds with confirmation and executes actions | P0 |
| PR-3.3 | Can send multiple instructions sequentially | P0 |
| PR-3.4 | Agent explains what it's doing ("Navigating to...", "Clicking button...") | P1 |
| PR-3.5 | Agent responds within 5 seconds of instruction | P0 |

**User Value:** Control browsers naturally, like talking to a colleague. No need to learn complex APIs.

---

### 2.4 Action Log & Transparency

**Definition:** See a step-by-step log of what the browser did

**Why it matters:** Debugging and understanding. Users need to know what happened and why.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Action log shows each step with timestamp | P0 |
| PR-4.2 | Log entries show: action type, target, result, duration | P0 |
| PR-4.3 | Can scroll through full execution history | P1 |
| PR-4.4 | Errors highlighted in log with clear messages | P1 |
| PR-4.5 | Log updates in real-time as actions execute | P0 |

**User Value:** Understand what happened and troubleshoot issues. Full transparency builds trust.

---

### 2.5 Browser Profiles (MVP)

**Definition:** Create reusable browser profiles with saved credentials and settings

**Why it matters:** Users shouldn't re-enter credentials every time. Profiles enable reusable configurations.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Create profile with name and basic settings (OS, proxy options) | P0 |
| PR-5.2 | Save credentials (username/password) to profile | P0 |
| PR-5.3 | Save cookies to profile for session persistence | P1 |
| PR-5.4 | Select profile when creating new session | P0 |
| PR-5.5 | Profile credentials auto-inject when agent needs them | P1 |
| PR-5.6 | Profiles stored in file system following agent pattern (`_tables/browser-profiles/`) | P0 |
| PR-5.7 | Profile list shows: name, creation date, credential count | P1 |

**User Value:** Sign in once, reuse forever. No repeated credential entry. Profiles are reusable across sessions.

---

### 2.6 Basic Browser Actions

**Definition:** Execute core browser actions through natural language

**Why it matters:** Validate that basic automation works before building complex workflows.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-6.1 | Navigate to any URL | P0 |
| PR-6.2 | Take screenshot of current page | P0 |
| PR-6.3 | Extract text/content from page | P1 |
| PR-6.4 | Click elements (by description or selector) | P1 |
| PR-6.5 | Fill form fields with text | P1 |
| PR-6.6 | Wait for elements to appear | P1 |
| PR-6.7 | Download files from page | P1 |

**User Value:** Core actions work reliably for common automation tasks. Foundation for complex workflows.

---

## 3. Acceptance Criteria

### Session Management (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | User clicks "New Session" → Browser session created in <3 seconds | Click button, verify session appears |
| AC-2 | Session card shows: session ID, status badge, creation time, CDP URL | Visual inspection |
| AC-3 | Active sessions sidebar lists all running sessions | Verify list updates |
| AC-4 | Click "Terminate" → Session closes, browser view disappears | Click terminate, verify cleanup |
| AC-5 | Session ID and CDP URL are valid Anchor Browser session identifiers | Verify API response format |

### Live Browser Viewing (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-6 | Browser iframe loads using Anchor Browser live_view_url | Verify iframe src matches Anchor API |
| AC-7 | Navigate to URL → Browser view updates within 2 seconds | Send "go to google.com", watch view |
| AC-8 | Click action → See click happen in browser view | Send "click search button", verify |
| AC-9 | Browser view is responsive and doesn't break layout | Resize window, verify layout |
| AC-10 | Live view shows real-time browser state (not screenshots) | Verify smooth updates, not static images |

### Natural Language Control (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-11 | Type instruction → Agent responds within 5 seconds | Type "navigate to example.com" |
| AC-12 | Agent confirms action before executing | Verify response: "I'll navigate to..." |
| AC-13 | Multiple instructions execute sequentially | Send 3 instructions, verify order |
| AC-14 | Agent explains what it's doing | Verify log shows explanations |
| AC-15 | Invalid instruction shows helpful error | Type "do something impossible", verify error |

### Action Log (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-16 | Each action appears in log with timestamp | Verify log entries appear |
| AC-17 | Log shows: action type, target, status, duration | Verify log format |
| AC-18 | Can scroll through full history | Scroll log, verify all entries visible |
| AC-19 | Errors highlighted with red badge | Trigger error, verify highlighting |
| AC-20 | Log updates in real-time as actions execute | Verify entries appear during execution |

### Browser Profiles (7 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-21 | Create profile → Profile appears in dropdown | Create profile, verify dropdown |
| AC-22 | Save credentials → Credentials masked in UI | Add credential, verify masking |
| AC-23 | Select profile → Session uses profile settings | Create session with profile, verify |
| AC-24 | Agent uses saved credentials automatically | Send "sign in", verify auto-fill |
| AC-25 | Cookies persist across sessions with same profile | Sign in, close session, reopen, verify logged in |
| AC-26 | Profile stored in `_tables/browser-profiles/[profileId]/config.ts` | Verify file structure matches agent pattern |
| AC-27 | Profile list shows: name, creation date, credential count | Verify profile list displays correctly |

### Basic Actions (7 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-28 | Navigate action changes browser URL | Send "go to google.com", verify URL |
| AC-29 | Screenshot action captures current page | Send "take screenshot", verify image |
| AC-30 | Extract action returns page text | Send "extract all text", verify text |
| AC-31 | Click action triggers element click | Send "click search", verify click |
| AC-32 | Type action fills input fields | Send "type hello in search box", verify |
| AC-33 | Wait action pauses until element appears | Send "wait for button", verify pause |
| AC-34 | Download action saves file from page | Send "download the file", verify download |

---

## 4. User Flows

### Flow 1: First-Time User — Simple Navigation

**Goal:** Validate basic browser automation works

```
1. User opens /experiments/browser-automation
2. User sees empty state: "Create your first browser session"
3. User clicks "New Session" button
4. System creates Anchor Browser session via API
5. Browser session created, live view appears in iframe
6. User types in chat: "Navigate to https://example.com"
7. Agent responds: "I'll navigate to example.com"
8. Browser view updates to show example.com
9. Action log shows: "✅ Navigated to https://example.com (1.2s)"
10. User thinks: "This works! I can control a browser with text."
```

**Success Metric:** User completes navigation in <30 seconds

---

### Flow 2: Sign-In with Profile

**Goal:** Validate credential management and session persistence

```
1. User has active browser session
2. User clicks "Create Profile" → Profile modal opens
3. User enters profile name: "My Work Account"
4. User adds credential: username="john@company.com", password="••••"
5. User saves profile (stored in _tables/browser-profiles/)
6. User types: "Sign into Slack using my work account"
7. Agent navigates to slack.com/login
8. Agent fills username/password from profile automatically
9. Agent clicks "Sign In"
10. Browser shows Slack dashboard (logged in)
11. User thinks: "I signed in once, now I can reuse this profile."
```

**Success Metric:** Sign-in completes without manual credential entry

---

### Flow 3: Complex Task — Extract Data and Download Files

**Goal:** Validate multi-step automation works (CRITICAL FLOW)

```
1. User has active session with profile "My Work Account"
2. User types: "Go to my location lookup tool, download the latest file, and show me what's in it"
3. Agent responds: "I'll navigate to the tool, download the file, and extract its contents"
4. Action log shows:
   - "✅ Navigating to https://location-tool.com (2.1s)"
   - "✅ Clicking download button (0.8s)"
   - "✅ File downloaded: locations-2025-12.csv (3.4s)"
   - "✅ Extracting file contents... (1.2s)"
5. Agent displays extracted data in chat:
   - "Found 247 location records:
      - New York: 45 entries
      - Los Angeles: 32 entries
      - Chicago: 28 entries
      ..."
6. User thinks: "I can automate complex workflows with natural language. This is powerful."
7. User types: "Now transform this into a presentation"
8. Agent creates presentation with location data
9. User thinks: "This is exactly what I need for my workflow."
```

**Success Metric:** Multi-step task completes successfully. User can download files and extract data.

---

### Flow 4: Error Recovery

**Goal:** Validate error handling and user feedback

```
1. User has active session
2. User types: "Click the button that doesn't exist"
3. Agent responds: "I couldn't find a button matching that description"
4. Action log shows: "❌ Error: Element not found - 'button that doesn't exist'"
5. Browser session remains active (not crashed)
6. User types: "Okay, click the search button instead"
7. Agent successfully clicks search button
8. Action log shows: "✅ Clicked search button (0.5s)"
9. User thinks: "Errors are clear and recoverable. I can iterate quickly."
```

**Success Metric:** Errors don't crash session, user can continue

---

### Flow 5: Profile Reuse Across Sessions

**Goal:** Validate profile persistence and cookie management

```
1. User creates profile "My Work Account" with Slack credentials
2. User creates session with profile, signs into Slack
3. User closes session
4. User creates new session with same profile
5. User types: "Go to Slack"
6. Agent navigates to Slack
7. Browser shows user is already logged in (cookies persisted)
8. User types: "How many unread messages do I have?"
9. Agent extracts unread count from Slack UI
10. Agent responds: "You have 12 unread messages"
11. User thinks: "Profiles work! I don't need to sign in every time."
```

**Success Metric:** Cookies persist across sessions, profile credentials work automatically

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Browser automation approach | A: Anchor Browser Tasks API, B: Playwright + CDP, C: browser-use library | A: Anchor Browser Tasks API | ✅ |
| DD-2 | Agent framework | A: Mastra Agent, B: Simple function calls, C: Vercel AI SDK | A: Mastra Agent | ✅ |
| DD-3 | Page layout | A: Split view (browser left, chat right), B: Browser fullscreen with chat overlay, C: Tabbed interface | A: Split view | ✅ |
| DD-4 | Profile storage | A: Database, B: File system (like agents), C: In-memory only | B: File system (`_tables/browser-profiles/`) | ✅ |
| DD-5 | Session persistence | A: Sessions persist across page reloads, B: Sessions reset on reload | B: Reset on reload (experimental) | ✅ |
| DD-6 | Anchor Browser integration | A: Use Tasks API exclusively, B: Use Sessions API + Playwright, C: Hybrid approach | A: Use Anchor Browser API as much as possible | ✅ |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2025-12 | Browser automation approach | Anchor Browser Tasks API | Use Anchor Browser's native API as much as possible for better integration |
| 2025-12 | Profile storage | File system (`_tables/browser-profiles/`) | Follows existing agent pattern, keeps data inspectable and versionable |
| 2025-12 | Page layout | Split view | Best balance of visibility and usability |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Browser Playground Layout | Overall page structure | Split view with browser on left, chat on right, action log below, session manager sidebar |
| Session Management Panel | How to create/manage sessions | "New Session" button, session list, terminate button, profile selector |
| Live Browser View | Browser iframe integration | Embedded browser view, responsive sizing, loading state |
| Chat Interface | Natural language input | Input field, send button, message history, agent responses |
| Action Log | Step-by-step browser actions | List of actions with timestamps, status badges, error highlighting |
| Profile Management | Create/edit browser profiles | Profile form (name, credentials, cookies), profile list, profile selector |

### Mockup Location

```
_docs/UXD/Pages/experiments/browser-automation/
├── index.html          # Main playground layout
├── variation-1/         # Split view (browser left, chat right)
└── variation-2/        # Alternative layout (optional)
```

### Exit Criteria for UXD Phase

- [ ] All required mockups complete
- [ ] Each mockup shows all P0 requirements
- [ ] Stakeholder review complete
- [ ] Preferred direction chosen

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Can create session and see live browser | Create session, verify iframe loads | P0 |
| Can control browser with natural language | Type instruction, verify execution | P0 |
| Can see what browser is doing in real-time | Watch browser view update | P0 |
| Can create profile and reuse credentials | Create profile, use in session | P0 |
| Action log shows clear execution history | Verify log entries appear | P0 |
| Multi-step tasks work reliably | Complete 3-step automation (Flow 3) | P0 |
| Can download files and extract data | Complete file download + extraction | P0 |
| Errors are clear and recoverable | Trigger error, verify message | P1 |
| Profiles persist across sessions | Close/reopen session, verify cookies | P1 |

**North Star:** Users can automate complex browser tasks (like downloading files from location lookup tool and transforming into presentation) with natural language and see exactly what's happening, building confidence before workflow integration.

---

## 8. Out of Scope

- **Workflow integration** — This is experimental, not integrated into workflows yet
- **Session recording/replay** — Recording features come later (Task 20.4)
- **Advanced stealth features** — Proxy, CAPTCHA solving come later (Task 22.2)
- **Multiple concurrent sessions** — Focus on single session for MVP
- **Team sharing** — Profiles are user-specific for now
- **Anchor Browser Tasks API deployment** — Focus on draft tasks for experimentation

---

## 9. Technical Architecture

### Anchor Browser Integration

Based on [Anchor Browser documentation](https://docs.anchorbrowser.io/integrations/browseruse-deployment) and [Automation Tasks API](https://docs.anchorbrowser.io/advanced/tasks):

**Session Creation:**
```typescript
// Create session via Anchor Browser API
const session = await anchorClient.sessions.create();
const cdpUrl = session.data.cdp_url;
const liveViewUrl = `https://live.anchorbrowser.io?sessionId=${sessionId}`;
```

**Live View:**
```html
<!-- Embed live browser view -->
<iframe 
  src="https://live.anchorbrowser.io?sessionId={sessionId}" 
  sandbox="allow-same-origin allow-scripts" 
  allow="clipboard-read; clipboard-write"
/>
```

**Tasks API (for reusable automation):**
```typescript
// Create task with TypeScript code
const task = await anchorClient.task.create({
  name: 'extract-location-data',
  language: 'typescript',
  code: base64EncodedCode,
  inputs: {
    ANCHOR_TARGET_URL: 'https://location-tool.com',
    ANCHOR_MAX_PAGES: '10'
  }
});

// Run task
const execution = await anchorClient.task.run({
  taskId: taskId,
  version: 'draft',
  inputs: { ANCHOR_TARGET_URL: 'https://example.com' }
});
```

### Profile Storage Pattern

Following agent storage pattern:
```
_tables/browser-profiles/
├── [profileId]/
│   ├── config.ts          # Profile configuration (name, settings, credentials)
│   └── cookies.json       # Saved cookies (optional)
```

### Mastra Agent Integration

```typescript
// Browser control agent
const browserAgent = new Agent({
  name: "browser-control",
  instructions: "You control a browser. Execute user instructions by calling browser tools.",
  tools: {
    navigate: tool({ ... }),
    screenshot: tool({ ... }),
    extract: tool({ ... }),
    click: tool({ ... }),
    type: tool({ ... }),
    download: tool({ ... }),
  },
});
```

---

## 10. Related Documents

- **Research Log:** `21.1-anchor-browser-research/01-Research-Log.md` (to be created)
- **Implementation Plan:** `21.2-browser-playground-implementation.md` (to be created)
- **Next Task:** Task 21.3 - Browser Node Type (workflow integration)
- **Competitor Analysis:** `_docs/Product/Competitors/Asteroid/`
- **Anchor Browser Docs:** 
  - [Browser-use integration](https://docs.anchorbrowser.io/integrations/browseruse-deployment)
  - [Automation Tasks](https://docs.anchorbrowser.io/advanced/tasks)

---

## Notes

- This is an **experimental playground** — focus on proving concepts, not polish
- Use Anchor Browser API as much as possible — leverage their infrastructure
- Profile storage follows agent pattern — keeps data inspectable and versionable
- Use this to validate integration patterns before building workflow nodes
- Consider this a **spike/prototype** that informs the real implementation
- Keep it isolated from production features until validated
- Flow 3 (extract data + download files) is critical — this validates complex automation


