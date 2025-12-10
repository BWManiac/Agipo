# Browser Automation Initiative — Developer Onboarding Guide

**Last Updated:** December 2025  
**Status:** Planning Phase  
**Purpose:** Comprehensive guide to get developers up to speed on browser automation feature development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context & Motivation](#context--motivation)
3. [What We're Building](#what-were-building)
4. [Technical Architecture](#technical-architecture)
5. [Anchor Browser Integration](#anchor-browser-integration)
6. [Competitor Analysis Insights](#competitor-analysis-insights)
7. [Product Requirements](#product-requirements)
8. [Implementation Approach](#implementation-approach)
9. [File Structure & Patterns](#file-structure--patterns)
10. [Key Decisions Made](#key-decisions-made)
11. [Next Steps](#next-steps)
12. [References & Resources](#references--resources)

---

## Executive Summary

**The Initiative:** We're building browser automation capabilities into Agipo, starting with an isolated experimental playground to validate patterns before workflow integration.

**The Goal:** Enable users to automate browser-based tasks (like signing into Slack, downloading files from location lookup tools, extracting data) through natural language instructions, with full visibility into what's happening.

**The Approach:** 
1. **Phase 1:** Build isolated playground (`/experiments/browser-automation`) to test Anchor Browser integration
2. **Phase 2:** Integrate browser automation as first-class workflow node type (like Composio steps)
3. **Phase 3:** Add advanced features (profiles, session recording, stealth)

**Current Status:** Product Spec complete, ready to begin implementation.

---

## Context & Motivation

### Why Browser Automation?

**The Problem:** Agipo currently handles API integrations (Gmail, Slack, GitHub via Composio) and custom code workflows, but **cannot interact with web browsers**. This limits automation capabilities:

- **Can't automate bespoke web tools:** Many companies have custom internal tools (location lookup tools, ERPs, dashboards) that don't have APIs
- **Can't handle complex web workflows:** Tasks like "sign into Slack and check unread messages" or "download files from location tool and transform into presentation" require browser interaction
- **Missing a key automation primitive:** Browser automation is fundamental to modern workflow automation

**The Opportunity:** By adding browser automation as a first-class capability, we enable:
- **Bespoke tool automation:** Users can automate any web-based tool, not just those with APIs
- **Complex multi-step workflows:** Combine browser actions with API calls and custom code
- **Natural language control:** Users describe what they want, AI figures out how to do it

### Strategic Context

**Competitive Landscape:** 
- **Asteroid.ai** has built a successful browser automation platform using Playwright + Anchor Browser
- They use **hybrid DOM + vision** approach (DOM-first, vision fallback)
- Key features: Browser profiles, session recording, credential management, live viewing
- **Our differentiation:** Better integration with workflows, natural language control, composability

**User Needs:**
- **Example 1:** "Sign into my Slack and tell me how many unread messages I have"
- **Example 2:** "Go to my location lookup tool, download the latest file, and transform it into a presentation"
- **Example 3:** "Automate my bespoke ERP workflow for this specific user"

All of these require browser automation.

---

## What We're Building

### Phase 1: Browser Automation Playground (Current Focus)

**Location:** `/experiments/browser-automation`

**What It Does:**
- Create browser sessions via Anchor Browser API
- Control browsers with natural language (Mastra Agent)
- View live browser actions in real-time (Anchor Browser iframe)
- Create reusable browser profiles (credentials, cookies, settings)
- See step-by-step action logs

**Why Isolated First:**
- Validate integration patterns before workflow integration
- Test Anchor Browser API capabilities
- Build abstractions that will work for workflow nodes
- Learn what users actually need

### Phase 2: Workflow Integration (Future)

**Goal:** Browser automation becomes a first-class workflow node type, just like Composio steps.

**How It Works:**
- Users add "Browser" nodes to workflows
- Browser nodes can be mixed with Composio nodes and custom code
- Data flows between browser actions and other steps
- Profiles can be assigned to browser nodes

**Example Workflow:**
```
1. Browser Node: Navigate to location lookup tool
2. Browser Node: Sign in with profile
3. Browser Node: Download latest file
4. Custom Code Node: Transform CSV to JSON
5. Composio Node: Gmail: Send transformed data
```

### Phase 3: Advanced Features (Future)

- Session recording and replay (like Asteroid)
- Browser profiles with advanced settings (proxy, stealth, CAPTCHA)
- Hybrid DOM + vision approach
- Enterprise features (proxy management, anti-detection)

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  /experiments/browser-automation (Playground Page)          │
│  - Browser View (iframe)                                    │
│  - Chat Interface                                           │
│  - Action Log                                               │
│  - Session Manager                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  /api/browser-automation/                                    │
│  ├── sessions/          # Create, list, terminate           │
│  ├── sessions/[id]/actions/  # Execute browser actions      │
│  └── profiles/          # Profile CRUD                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  /api/browser-automation/services/                           │
│  ├── anchor-client.ts    # Anchor Browser API wrapper       │
│  ├── browser-agent.ts    # Mastra agent for browser control │
│  └── profile-storage.ts  # Profile file system operations   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATION                            │
│  Anchor Browser API                                          │
│  - Sessions API (create, manage)                             │
│  - Live View (iframe embedding)                              │
│  - Tasks API (reusable automation code)                      │
│  - CDP URL (for Playwright connection)                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**1. Browser Session Management**
- Create sessions via Anchor Browser API
- Track active sessions
- Provide CDP URL for browser control
- Provide live view URL for iframe embedding

**2. Mastra Agent for Browser Control**
- Natural language instruction → browser actions
- Uses Mastra Agent framework (consistent with workforce agents)
- Tools: navigate, click, type, screenshot, extract, download

**3. Browser Profiles**
- Store credentials (username/password)
- Store cookies for session persistence
- Store browser settings (OS, proxy, stealth options)
- File system storage (`_tables/browser-profiles/`) following agent pattern

**4. Live Browser Viewing**
- Embed Anchor Browser iframe
- Real-time updates as agent executes actions
- No screenshots needed (Anchor handles streaming)

---

## Anchor Browser Integration

### Why Anchor Browser?

**Decision:** Use Anchor Browser as our browser infrastructure provider.

**Reasons:**
1. **Managed Infrastructure:** No need to run browsers ourselves
2. **Live Viewing:** Built-in iframe embedding for real-time viewing
3. **CDP Access:** Provides CDP URL for Playwright connection
4. **Tasks API:** Supports reusable automation code (TypeScript)
5. **Proven:** Used by Asteroid.ai (competitor validation)

### Anchor Browser API Overview

**Documentation:**
- [Browser-use Integration](https://docs.anchorbrowser.io/integrations/browseruse-deployment)
- [Automation Tasks API](https://docs.anchorbrowser.io/advanced/tasks)

**Key APIs We'll Use:**

#### 1. Session Creation
```typescript
import Anchorbrowser from 'anchorbrowser';

const client = new Anchorbrowser({
  apiKey: process.env.ANCHOR_API_KEY,
});

// Create session
const session = await client.sessions.create();
const cdpUrl = session.data.cdp_url;  // For Playwright connection
const liveViewUrl = `https://live.anchorbrowser.io?sessionId=${sessionId}`;
```

#### 2. Live View Embedding
```html
<iframe 
  src="https://live.anchorbrowser.io?sessionId={sessionId}" 
  sandbox="allow-same-origin allow-same-origin allow-scripts" 
  allow="clipboard-read; clipboard-write"
/>
```

#### 3. Tasks API (For Reusable Automation)
```typescript
// Create task with TypeScript code
const task = await client.task.create({
  name: 'extract-location-data',
  language: 'typescript',
  code: base64EncodedCode,
  description: 'Extract data from location lookup tool'
});

// Run task
const execution = await client.task.run({
  taskId: taskId,
  version: 'draft',
  inputs: {
    ANCHOR_TARGET_URL: 'https://location-tool.com',
    ANCHOR_MAX_PAGES: '10'
  }
});
```

**Important:** All task inputs must be prefixed with `ANCHOR_` per Anchor Browser requirements.

### Integration Strategy

**Approach:** Use Anchor Browser API as much as possible.

**What This Means:**
- **Sessions:** Use Anchor Browser Sessions API (not self-hosted)
- **Live View:** Use Anchor Browser iframe (not custom streaming)
- **Browser Control:** Connect Playwright to Anchor's CDP URL
- **Tasks:** Use Anchor Tasks API for reusable automation code

**Why:** Leverage Anchor's infrastructure instead of building our own. Focus on the intelligence layer (natural language → actions), not browser infrastructure.

---

## Competitor Analysis Insights

### Asteroid.ai: What We Learned

**Key Technologies (Confirmed):**
- ✅ **Playwright** - Browser automation engine
- ✅ **Anchor Browser** - Browser infrastructure (VNC for live viewing)
- ✅ **rrweb** - Session recording/replay
- ✅ **Hybrid DOM + Vision** - DOM-first, vision fallback

**Key Features:**
1. **Browser Profiles:** Reusable configurations with credentials, cookies, settings
2. **Session Recording:** Full replay of browser sessions
3. **Live Viewing:** Real-time browser viewing during execution
4. **Credential Management:** Secure vault with encryption
5. **Stealth Features:** Proxy, CAPTCHA solving, anti-detection

**What We're Copying:**
- ✅ Browser profiles pattern (credentials, cookies, settings)
- ✅ Live browser viewing (Anchor Browser iframe)
- ✅ Session management approach
- ✅ Profile-based organization

**What We're Doing Differently:**
- **Better Workflow Integration:** Browser nodes as first-class workflow steps
- **Natural Language Control:** Mastra Agent instead of script-based
- **Composability:** Mix browser actions with API calls and custom code
- **File System Storage:** Profiles stored like agents (inspectable, versionable)

### Key Learnings

1. **Don't Reinvent Browser Automation:** Use Playwright + Anchor Browser (proven stack)
2. **Profiles Are Critical:** Users need reusable configurations
3. **Visibility Matters:** Live viewing builds trust
4. **Hybrid Approach Works:** DOM-first with vision fallback is optimal
5. **Session Recording Is Valuable:** But can come later (Phase 3)

---

## Product Requirements

### Core Features (Phase 1)

**1. Browser Session Management**
- Create, list, terminate sessions
- Session status tracking
- Profile assignment to sessions

**2. Live Browser Viewing**
- Real-time browser view via Anchor Browser iframe
- Updates as agent executes actions
- Responsive layout

**3. Natural Language Control**
- Chat interface for instructions
- Mastra Agent executes browser actions
- Sequential instruction execution
- Action explanations

**4. Action Log**
- Step-by-step execution log
- Timestamps, durations, status
- Error highlighting
- Real-time updates

**5. Browser Profiles**
- Create/edit profiles
- Store credentials (username/password)
- Store cookies for persistence
- Profile selection when creating sessions

**6. Basic Browser Actions**
- Navigate to URL
- Take screenshot
- Extract page content
- Click elements
- Type text
- Download files

### Acceptance Criteria Summary

**34 total acceptance criteria** across 6 categories:
- Session Management: 5 criteria
- Live Browser Viewing: 5 criteria
- Natural Language Control: 5 criteria
- Action Log: 5 criteria
- Browser Profiles: 7 criteria
- Basic Actions: 7 criteria

See `00-Product-Spec.md` for complete details.

### Critical User Flows

**Flow 1: Simple Navigation**
User creates session → Types "go to example.com" → Sees browser navigate → Action log shows success

**Flow 2 Sign-In with Profile**
User creates profile → Adds credentials → Creates session with profile → Types "sign into Slack" → Agent auto-fills credentials → User is logged in

**Flow 3 Complex Task (CRITICAL)**
User types: "Go to location lookup tool, download latest file, show me what's in it"
- Agent navigates to tool
- Agent downloads file
- Agent extracts file contents
- Agent displays data in chat

This flow validates that complex multi-step automation works.

**Flow 4 Error Recovery**
User sends invalid instruction → Agent shows clear error → Session remains active → User can continue

**Flow 5 Profile Reuse**
User creates session with profile → Signs in → Closes session → Creates new session with same profile → Already logged in (cookies persisted)

---

## Implementation Approach

### Phase 1: API Foundation

**Goal:** Build API abstraction layer for Anchor Browser integration.

**Files to Create:**
```
app/api/browser-automation/
├── README.md                    # Domain overview
├── sessions/
│   ├── README.md
│   ├── route.ts                 # POST /api/browser-automation/sessions
│   └── [sessionId]/
│       ├── README.md
│       ├── route.ts             # GET, DELETE /api/browser-automation/sessions/[sessionId]
│       └── actions/
│           ├── README.md
│           └── route.ts         # POST /api/browser-automation/sessions/[sessionId]/actions
└── services/
    ├── README.md
    ├── anchor-client.ts          # Anchor Browser API wrapper
    ├── browser-agent.ts          # Mastra agent for browser control
    └── profile-storage.ts        # Profile file system operations
```

**Key Abstraction:** `anchor-client.ts` wraps Anchor Browser API, providing:
- Session creation/management
- CDP URL access
- Live view URL generation
- Task creation/execution (future)

### Phase 2: Experimental Page

**Goal:** Build playground UI to test browser automation.

**Files to Create:**
```
app/(pages)/experiments/browser-automation/
├── page.tsx                      # Main playground page
├── components/
│   ├── BrowserView.tsx          # Live browser iframe
│   ├── ChatPanel.tsx            # Natural language chat interface
│   ├── ActionLog.tsx            # Step-by-step action log
│   └── SessionManager.tsx       # Create/terminate sessions
├── hooks/
│   ├── useBrowserSession.ts     # Session management hook
│   └── useBrowserAgent.ts       # Agent interaction hook
└── README.md                    # Page documentation
```

**Key Patterns:**
- Follow existing page structure (like `workforce/`, `tools/editor/`)
- Use Zustand for state management (if needed)
- Use TanStack Query for API calls
- Use shadcn/ui components for UI

### Phase 3: Profile Management

**Goal:** Build browser profile system following agent pattern.

**Files to Create:**
```
_tables/browser-profiles/
├── index.ts                      # Profile registry (like agents/index.ts)
└── [profileId]/
    ├── config.ts                 # Profile configuration
    └── cookies.json              # Saved cookies (optional)

app/api/browser-automation/
└── profiles/
    ├── README.md
    ├── route.ts                  # GET, POST /api/browser-automation/profiles
    └── [profileId]/
        ├── README.md
        └── route.ts              # GET, PUT, DELETE /api/browser-automation/profiles/[profileId]
```

**Storage Pattern:** Follow agent storage pattern:
- Profiles stored in `_tables/browser-profiles/[profileId]/config.ts`
- TypeScript files (inspectable, versionable)
- Registry in `index.ts` for discovery

---

## File Structure & Patterns

### Domain-Driven Design

**Principle:** Browser automation is a **new domain**, separate from existing domains.

**Existing Domains:**
- `workforce/` - Agent management
- `tools/` - Custom tools and workflows
- `connections/` - Composio integrations
- `records/` - Data tables

**New Domain:**
- `browser-automation/` - Browser automation capabilities

**Why Separate:**
- Clear boundaries
- Independent evolution
- Easy to understand
- Follows existing patterns

### API Route Patterns

**Follow Domain Principles** (`app/api/DOMAIN_PRINCIPLES.md`):

**Collection Operations:**
- `POST /api/browser-automation/sessions` → Create session
- `GET /api/browser-automation/sessions` → List sessions

**Instance Operations:**
- `GET /api/browser-automation/sessions/[sessionId]` → Get session
- `DELETE /api/browser-automation/sessions/[sessionId]` → Terminate session

**Nested Resources:**
- `POST /api/browser-automation/sessions/[sessionId]/actions` → Execute action

**Service Co-location:**
- Route-specific services: `sessions/[sessionId]/services/`
- Domain-shared services: `services/`

### Component Patterns

**Follow Existing Patterns:**

**Page Structure:**
```
app/(pages)/experiments/browser-automation/
├── page.tsx                      # Main page component
├── components/                   # Page-specific components
├── hooks/                        # Page-specific hooks
└── README.md                     # Page documentation
```

**Component Organization:**
- Co-locate components with pages
- Use shadcn/ui for primitives
- Follow existing naming conventions

**State Management:**
- Use Zustand slices if complex state needed
- Use TanStack Query for server state
- Keep state local when possible

### Storage Patterns

**Profile Storage (Following Agent Pattern):**

**Agent Pattern:**
```
_tables/agents/
├── index.ts                      # Registry
└── [name-slug]-[uuid]/
    └── config.ts                 # Agent config
```

**Browser Profile Pattern:**
```
_tables/browser-profiles/
├── index.ts                      # Registry
└── [profileId]/
    ├── config.ts                 # Profile config
    └── cookies.json              # Saved cookies (optional)
```

**Why This Pattern:**
- Inspectable (can read files directly)
- Versionable (Git-friendly)
- Consistent with existing codebase
- Easy to understand

---

## Key Decisions Made

### 1. Browser Automation Library

**Decision:** Use Anchor Browser API as much as possible, with Playwright for browser control.

**Rationale:**
- Anchor Browser provides managed infrastructure
- Playwright connects to Anchor's CDP URL
- No need to run browsers ourselves
- Focus on intelligence layer, not infrastructure

**Implementation:**
- Use Anchor Browser Sessions API for session management
- Use Anchor Browser live view iframe for viewing
- Connect Playwright to Anchor's CDP URL for control
- Use Anchor Tasks API for reusable automation (future)

### 2. Agent Framework

**Decision:** Use Mastra Agent for browser control.

**Rationale:**
- Consistent with workforce agents
- Natural language → actions pattern
- Tool-based architecture fits browser actions
- Already integrated in codebase

**Implementation:**
```typescript
const browserAgent = new Agent({
  name: "browser-control",
  instructions: "You control a browser. Execute user instructions.",
  tools: {
    navigate: tool({ ... }),
    click: tool({ ... }),
    type: tool({ ... }),
    // etc.
  },
});
```

### 3. Page Layout

**Decision:** Split view (browser left, chat right).

**Rationale:**
- Best balance of visibility and usability
- Browser view always visible
- Chat accessible but not intrusive
- Action log below for transparency

### 4. Profile Storage

**Decision:** File system storage (`_tables/browser-profiles/`) following agent pattern.

**Rationale:**
- Consistent with existing codebase
- Inspectable and versionable
- No database needed
- Easy to understand and debug

**Implementation:**
- Profiles stored as TypeScript files
- Registry in `index.ts`
- Cookies stored as JSON (optional)

### 5. Session Persistence

**Decision:** Sessions reset on page reload (experimental phase).

**Rationale:**
- This is experimental, not production
- Simpler implementation
- Can add persistence later if needed
- Focus on core functionality first

### 6. Integration Approach

**Decision:** Use Anchor Browser API as much as possible.

**Rationale:**
- Leverage their infrastructure
- Focus on our value-add (intelligence layer)
- Proven by competitors (Asteroid uses Anchor)
- Faster to market

---

## Next Steps

### Immediate (Week 1)

1. **Set Up Anchor Browser Account**
   - Get API key
   - Test session creation
   - Verify live view works

2. **Create API Foundation**
   - Create `app/api/browser-automation/` domain
   - Build `anchor-client.ts` service
   - Create session routes (create, list, terminate)

3. **Build Basic Playground Page**
   - Create `/experiments/browser-automation` page
   - Add session creation UI
   - Embed live browser view iframe

### Short-Term (Weeks 2-3)

4. **Add Browser Control**
   - Build Mastra agent with browser tools
   - Connect Playwright to Anchor CDP URL
   - Implement basic actions (navigate, click, type)

5. **Add Chat Interface**
   - Natural language input
   - Agent response display
   - Action log component

6. **Add Profile Management**
   - Create profile storage structure
   - Build profile CRUD API
   - Add profile UI

### Medium-Term (Weeks 4-6)

7. **Polish & Validation**
   - Test all user flows
   - Validate acceptance criteria
   - Document learnings

8. **Plan Workflow Integration**
   - Design browser node type
   - Plan transpilation changes
   - Design data flow patterns

---

## References & Resources

### Documentation

**Product Spec:**
- `_docs/_tasks/21-browser-automation/00-Product-Spec.md` - Complete product requirements

**Competitor Analysis:**
- `_docs/Product/Competitors/Asteroid/` - Full Asteroid.ai analysis
  - `01-Technology-Stack.md` - Confirmed technologies
  - `02-Browser-Automation-Architecture.md` - Architecture patterns
  - `03-Credential-Management.md` - Profile system insights
  - `04-Session-Recording-Replay.md` - Recording patterns
  - `06-Product-Features-UI.md` - UI patterns

**Architecture:**
- `app/api/DOMAIN_PRINCIPLES.md` - API organization principles
- `_docs/Architecture/ARCHITECTURE_AUDIT_2025-12-06.md` - Current architecture state
- `_docs/Engineering/Architecture/Store-Slice-Architecture.md` - Zustand patterns

**Existing Patterns:**
- `_tables/agents/` - Agent storage pattern (follow for profiles)
- `app/api/workforce/` - Agent API patterns
- `app/(pages)/workforce/` - Page structure patterns

### External Resources

**Anchor Browser:**
- [Browser-use Integration Guide](https://docs.anchorbrowser.io/integrations/browseruse-deployment)
- [Automation Tasks API](https://docs.anchorbrowser.io/advanced/tasks)
- [API Reference](https://docs.anchorbrowser.io/api-reference)

**Mastra:**
- [Mastra Documentation](https://mastra.dev/docs)
- [Agent Framework](https://mastra.dev/docs/agents)

**Playwright:**
- [Playwright Documentation](https://playwright.dev/)
- [CDP Connection](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)

### Key Files to Study

**For API Patterns:**
- `app/api/workforce/[agentId]/chat/route.ts` - Agent chat pattern
- `app/api/workforce/services/agent-config.ts` - Agent config service
- `app/api/connections/services/composio.ts` - External API integration pattern

**For Page Patterns:**
- `app/(pages)/workforce/page.tsx` - Workforce page structure
- `app/(pages)/tools/editor/page.tsx` - Editor page structure

**For Storage Patterns:**
- `_tables/agents/index.ts` - Agent registry pattern
- `_tables/agents/[agentId]/config.ts` - Agent config structure

---

## Questions & Answers

### Q: Why not use Composio's browser_tool?

**A:** We tried it, but it has limitations:
- Basic functionality only
- Context leak issues with Mastra
- Not suitable for complex automation
- We need first-class browser automation, not a basic tool

### Q: Why Anchor Browser instead of self-hosted?

**A:** 
- Managed infrastructure (no ops burden)
- Built-in live viewing
- Proven by competitors
- Focus on intelligence layer, not infrastructure

### Q: Why experimental page first?

**A:**
- Validate integration patterns before workflow integration
- Test Anchor Browser API capabilities
- Build abstractions that will work for workflow nodes
- Learn what users actually need

### Q: How does this relate to workflows?

**A:** 
- Phase 1: Experimental playground (current)
- Phase 2: Browser becomes workflow node type (like Composio steps)
- Phase 3: Advanced features (profiles, recording, stealth)

### Q: What about browser profiles vs agent profiles?

**A:**
- **Agent profiles:** Agent configuration (name, role, system prompt, tools)
- **Browser profiles:** Browser configuration (credentials, cookies, browser settings)
- Different purposes, similar storage pattern

---

## Getting Started Checklist

For a new developer joining this initiative:

- [ ] Read this onboarding document completely
- [ ] Read `00-Product-Spec.md` for detailed requirements
- [ ] Review Asteroid competitor analysis (`_docs/Product/Competitors/Asteroid/`)
- [ ] Study Anchor Browser documentation (links above)
- [ ] Review existing API patterns (`app/api/DOMAIN_PRINCIPLES.md`)
- [ ] Review agent storage pattern (`_tables/agents/`)
- [ ] Set up Anchor Browser account and get API key
- [ ] Test Anchor Browser session creation locally
- [ ] Review Mastra Agent patterns (`app/api/workforce/[agentId]/chat/`)
- [ ] Familiarize with Playwright CDP connection

**Ready to Code?**
1. Start with API foundation (`app/api/browser-automation/services/anchor-client.ts`)
2. Create session routes
3. Build experimental page
4. Iterate based on learnings

---

## Summary

**What We're Building:** Browser automation capabilities for Agipo, starting with an experimental playground to validate patterns.

**Why:** Enable users to automate browser-based tasks through natural language, with full visibility.

**How:** Use Anchor Browser API + Playwright + Mastra Agent, following existing codebase patterns.

**Current Status:** Product Spec complete, ready to begin implementation.

**Next Step:** Build API abstraction layer and experimental playground page.

---

**Questions?** Refer to `00-Product-Spec.md` for detailed requirements, or check the references section above.


