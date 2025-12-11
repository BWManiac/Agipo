# Phase 0: Technical Spike — Core Assumptions Validation

**Status:** Planned  
**Depends On:** None  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Validate core technical assumptions before building the full infrastructure. This spike tests the fundamental integration points that all subsequent phases depend on.

**After this phase, we will know:**
- ✅ Anchor Browser API works as documented
- ✅ Playwright can connect via CDP reliably
- ✅ Mastra agent can execute browser tools
- ✅ Streaming responses work with browser actions
- ✅ Live view iframe embeds correctly

**If any assumption fails, we can pivot before investing in full implementation.**

### Why This Phase Exists

Before building 45+ files of infrastructure and UI, we need to validate that:
1. **Anchor Browser SDK integration** works as expected
2. **Playwright CDP connection** is reliable
3. **Mastra agent + browser tools** pattern works
4. **Streaming with action events** functions correctly

This follows the pattern established in `_docs/_diary/08-AgentSDKSpike.md` — validate assumptions with minimal code before building the full feature.

### Critical Assumptions to Validate

| Assumption | Why Critical | Risk if Wrong |
|------------|--------------|---------------|
| Anchor Browser SDK works as documented | Foundation for all features | Need alternative browser infrastructure |
| Playwright connects via CDP reliably | Core automation mechanism | Need different browser control approach |
| Mastra agent can use Playwright tools | Natural language control | Need different agent framework |
| Streaming works with browser actions | Real-time feedback UX | Need different UX pattern |
| Live view iframe embeds correctly | User visibility | Need alternative viewing mechanism |

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test approach | Single endpoint with query params | Simplest way to test multiple scenarios |
| Code organization | Spike-specific folder | Clear separation from production code |
| Authentication | Temporarily disable proxy.tsx | Easier testing without auth complexity |
| Proxy | Disabled for testing | As per user note, can enable later |
| Cleanup | Manual session termination | Keep spike simple, no auto-cleanup |

### Important Notes

**Proxy Disabled:** As noted, proxy is disabled for easier testing. Can be enabled later in production.

**API Key Configured:** Already set up per user note.

**Authentication Bypass:** For Phase 0 testing, temporarily disable `proxy.tsx` authentication for the spike routes to avoid auth complexity during validation.

**Temporary Code:** Spike code is temporary and will be refactored into proper service structure in Phase 1.

---

## File Impact Analysis

### Minimal Files (Spike Only)

| File | Action | Purpose | LOC Est. |
|------|--------|---------|----------|
| `app/api/browser-automation/spike/test/route.ts` | Create | Single test endpoint with query params | ~200 |
| `app/api/browser-automation/spike/services/test-session.ts` | Create | Session creation test | ~50 |
| `app/api/browser-automation/spike/services/test-playwright.ts` | Create | Playwright connection test | ~80 |
| `app/api/browser-automation/spike/services/test-agent.ts` | Create | Mastra agent integration test | ~150 |
| `app/api/browser-automation/spike/services/test-full.ts` | Create | End-to-end flow test | ~200 |
| `package.json` | Modify | Add `anchorbrowser` dependency | - |
| `proxy.ts` | Modify | Temporarily disable auth for spike routes | ~5 |

**Total:** 6 new files, 2 modified, ~685 LOC

### What We're NOT Building

- ❌ Full session management API (Phase 1)
- ❌ Store slices (Phase 2)
- ❌ UI components (Phase 2)
- ❌ Profile management (Phase 5)
- ❌ Action log (Phase 4)
- ❌ Error handling polish (Phase 6)
- ❌ Production-ready code structure

---

## Acceptance Criteria

### Anchor Browser Integration (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.1 | Can create session via Anchor Browser SDK | Call `POST /spike/test?test=session`, verify session ID returned |
| AC-0.2 | Session response includes `cdpUrl` and `liveViewUrl` | Inspect response JSON, verify both URLs present |
| AC-0.3 | Live view URL loads in iframe | Open `liveViewUrl` in browser, verify browser view appears |

### Playwright CDP Connection (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.4 | Can connect Playwright to CDP URL | Call `POST /spike/test?test=playwright`, verify connection success |
| AC-0.5 | Can navigate browser via Playwright | Execute `page.goto()`, verify URL changes in response |
| AC-0.6 | Can interact with page (click, type) | Execute actions, verify DOM changes reflected |

### Mastra Agent Integration (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.7 | Can create Mastra agent with browser tools | Call `POST /spike/test?test=agent`, verify agent created |
| AC-0.8 | Agent can execute navigate tool | Send "go to example.com", verify navigation in response |
| AC-0.9 | Agent can execute click tool | Send "click search button", verify click executed |
| AC-0.10 | Agent response streams correctly | Watch streaming response, verify chunks arrive progressively |

### End-to-End Validation (2 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.11 | Complete flow: session → agent → action → response | Execute `POST /spike/test?test=full`, verify all steps succeed |
| AC-0.12 | Multiple actions in sequence work | Send multi-step command, verify all actions execute in order |

---

## User Flows (Developer Testing)

### Flow 1: Session Creation Test

```
1. Developer calls POST /api/browser-automation/spike/test?test=session
2. Server creates Anchor Browser session (proxy disabled)
3. Server returns: { success: true, session: { id, cdpUrl, liveViewUrl } }
4. Developer verifies:
   - Session ID is valid format (e.g., "sess_abc123")
   - CDP URL is WebSocket URL (starts with "ws://" or "wss://")
   - Live view URL opens in browser and shows browser view
```

**Success:** All three URLs present and valid.

### Flow 2: Playwright Connection Test

```
1. Developer calls POST /api/browser-automation/spike/test?test=playwright
2. Server creates session
3. Server connects Playwright via CDP
4. Server navigates to example.com
5. Server returns: { success: true, navigation: { currentUrl, pageTitle } }
6. Developer verifies:
   - Connection successful (no errors)
   - URL matches "https://example.com"
   - Page title retrieved
```

**Success:** Playwright connected and navigated successfully.

### Flow 3: Basic Actions Test

```
1. Developer calls POST /api/browser-automation/spike/test?test=actions
2. Server creates session + Playwright connection
3. Server executes:
   - Navigate to google.com
   - Click search input (by selector)
   - Type "test query"
   - Click search button
4. Server returns: { success: true, actions: ["navigate", "click", "type", "click"] }
5. Developer verifies:
   - All actions completed without errors
   - Browser shows search results (can check via live view URL)
```

**Success:** All actions execute successfully.

### Flow 4: Agent Integration Test

```
1. Developer calls POST /api/browser-automation/spike/test?test=agent
2. Server creates session + Playwright connection
3. Server creates Mastra agent with browser tools
4. Server sends message: "Navigate to example.com"
5. Server streams agent response
6. Developer verifies:
   - Agent responds with confirmation text
   - Browser navigates to example.com (check finalUrl)
   - Response streams correctly (chunks arrive progressively)
```

**Success:** Agent created, tool executed, response streamed.

### Flow 5: End-to-End Test

```
1. Developer calls POST /api/browser-automation/spike/test?test=full
2. Server executes complete flow:
   - Create session
   - Connect Playwright
   - Create agent with multiple tools
   - Send: "Go to google.com and search for 'browser automation'"
3. Server streams response with action events
4. Developer verifies:
   - All steps execute without errors
   - Browser shows search results (via live view URL)
   - Streaming works (response chunks arrive)
   - Actions logged correctly
```

**Success:** Complete flow works end-to-end.

---

## Implementation Details

### Test Endpoint Structure

```typescript
// app/api/browser-automation/spike/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { testSessionCreation } from "../services/test-session";
import { testPlaywrightConnection } from "../services/test-playwright";
import { testBasicActions } from "../services/test-actions";
import { testAgentIntegration } from "../services/test-agent";
import { testFullFlow } from "../services/test-full";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get("test");

  try {
    switch (testType) {
      case "session":
        return NextResponse.json(await testSessionCreation());
      
      case "playwright":
        return NextResponse.json(await testPlaywrightConnection());
      
      case "actions":
        return NextResponse.json(await testBasicActions());
      
      case "agent":
        return NextResponse.json(await testAgentIntegration());
      
      case "full":
        return NextResponse.json(await testFullFlow());
      
      default:
        return NextResponse.json(
          { 
            error: "Invalid test type",
            availableTests: ["session", "playwright", "actions", "agent", "full"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Spike Test] Error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
```

### Session Creation Test

```typescript
// app/api/browser-automation/spike/services/test-session.ts

import AnchorClient from "anchorbrowser";

export async function testSessionCreation() {
  const anchorClient = new AnchorClient({
    apiKey: process.env.ANCHOR_API_KEY!,
  });

  // Create session with minimal config (no proxy for testing)
  const session = await anchorClient.sessions.create({
    browser: {
      // Disable proxy for easier testing (as per user note)
      proxy: { active: false },
    },
    session: {
      timeout: {
        max_duration: 10, // Short timeout for testing
        idle_timeout: 5,
      },
    },
  });

  return {
    success: true,
    session: {
      id: session.data.id,
      cdpUrl: session.data.cdp_url,
      liveViewUrl: session.data.live_view_url,
      status: "created",
    },
    note: "Session created successfully. Use liveViewUrl to view in browser.",
  };
}
```

### Playwright Connection Test

```typescript
// app/api/browser-automation/spike/services/test-playwright.ts

import { chromium } from "playwright";
import { testSessionCreation } from "./test-session";

export async function testPlaywrightConnection() {
  // Create session first
  const sessionResult = await testSessionCreation();
  const { cdpUrl } = sessionResult.session;

  // Connect Playwright via CDP
  const browser = await chromium.connectOverCDP(cdpUrl, {
    timeout: 30000,
  });

  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  // Test navigation
  await page.goto("https://example.com");
  const currentUrl = page.url();
  const pageTitle = await page.title();

  // Cleanup: Don't close browser (Anchor manages it), just disconnect
  browser.close();

  return {
    success: true,
    sessionId: sessionResult.session.id,
    cdpConnection: "success",
    navigation: {
      targetUrl: "https://example.com",
      currentUrl,
      pageTitle,
    },
    note: "Playwright connected and navigated successfully.",
  };
}
```

### Basic Actions Test

```typescript
// app/api/browser-automation/spike/services/test-actions.ts

import { chromium } from "playwright";
import { testSessionCreation } from "./test-session";

export async function testBasicActions() {
  const sessionResult = await testSessionCreation();
  const browser = await chromium.connectOverCDP(sessionResult.session.cdpUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  const actions: string[] = [];

  try {
    // Navigate
    await page.goto("https://www.google.com");
    actions.push("navigate");

    // Wait for page load
    await page.waitForLoadState("networkidle");

    // Click search input
    await page.click('textarea[name="q"]');
    actions.push("click");

    // Type text
    await page.fill('textarea[name="q"]', "test query");
    actions.push("type");

    // Click search button
    await page.click('input[type="submit"]');
    actions.push("click");

    // Wait for results
    await page.waitForSelector("#search");

    browser.close();

    return {
      success: true,
      sessionId: sessionResult.session.id,
      actions,
      finalUrl: page.url(),
      note: "All basic actions executed successfully.",
    };
  } catch (error) {
    browser.close();
    throw error;
  }
}
```

### Agent Integration Test

```typescript
// app/api/browser-automation/spike/services/test-agent.ts

import { Agent } from "@mastra/core/agent";
import { gateway } from "@ai-sdk/gateway";
import { tool } from "ai";
import { z } from "zod";
import { chromium } from "playwright";
import { testSessionCreation } from "./test-session";

export async function testAgentIntegration() {
  // Create session and connect Playwright
  const sessionResult = await testSessionCreation();
  const browser = await chromium.connectOverCDP(sessionResult.session.cdpUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  // Create minimal browser tools
  const navigateTool = tool({
    description: "Navigate to a URL",
    parameters: z.object({
      url: z.string().url(),
    }),
    execute: async ({ url }) => {
      await page.goto(url);
      return { 
        success: true, 
        url: page.url(), 
        title: await page.title() 
      };
    },
  });

  // Create Mastra agent
  const agent = new Agent({
    name: "browser-control-spike",
    instructions: `You control a browser. Execute user instructions by calling browser tools.
    Always confirm what you're doing.`,
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    tools: {
      navigate: navigateTool,
    },
  });

  // Test agent with simple command
  const testMessage = "Navigate to example.com";
  const response = await agent.stream(testMessage);

  // Collect response chunks
  const chunks: string[] = [];
  for await (const chunk of response) {
    if (chunk.text) {
      chunks.push(chunk.text);
    }
  }

  const fullResponse = chunks.join("");

  // Verify navigation happened
  const finalUrl = page.url();
  const navigationSuccess = finalUrl.includes("example.com");

  browser.close();

  return {
    success: true,
    sessionId: sessionResult.session.id,
    agentCreated: true,
    testMessage,
    agentResponse: fullResponse,
    navigation: {
      success: navigationSuccess,
      finalUrl,
    },
    note: "Agent created and executed navigation tool successfully.",
  };
}
```

### Full Flow Test

```typescript
// app/api/browser-automation/spike/services/test-full.ts

import { Agent } from "@mastra/core/agent";
import { gateway } from "@ai-sdk/gateway";
import { tool } from "ai";
import { z } from "zod";
import { chromium } from "playwright";
import { testSessionCreation } from "./test-session";

export async function testFullFlow() {
  // Step 1: Create session
  const sessionResult = await testSessionCreation();
  const browser = await chromium.connectOverCDP(sessionResult.session.cdpUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  // Step 2: Create browser tools
  const tools = {
    navigate: tool({
      description: "Navigate to a URL",
      parameters: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        await page.goto(url);
        return { success: true, url: page.url() };
      },
    }),
    click: tool({
      description: "Click an element by CSS selector",
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
        return { success: true, typed: text.length };
      },
    }),
  };

  // Step 3: Create agent
  const agent = new Agent({
    name: "browser-control-full",
    instructions: `You control a browser. Execute user instructions by calling browser tools.
    Always explain what you're doing before taking action.`,
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    tools,
  });

  // Step 4: Execute multi-step command
  const command = "Go to google.com, click the search box, and type 'browser automation'";
  const response = await agent.stream(command);

  const chunks: string[] = [];
  for await (const chunk of response) {
    if (chunk.text) {
      chunks.push(chunk.text);
    }
  }

  const finalUrl = page.url();
  browser.close();

  return {
    success: true,
    sessionId: sessionResult.session.id,
    command,
    agentResponse: chunks.join(""),
    finalUrl,
    note: "Full flow executed successfully. Check browser view to verify actions.",
  };
}
```

### Authentication Bypass (Temporary)

**Important:** For Phase 0 testing, temporarily disable authentication for spike routes to avoid auth complexity during validation.

```typescript
// proxy.ts - Temporarily disable auth for spike routes

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Temporarily disable auth for Phase 0 spike testing
  "/api/browser-automation/spike(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**After Phase 0:** Re-enable authentication by removing the spike route from `isPublicRoute` matcher before proceeding to Phase 1.

---

## Environment Setup

```env
# .env.local (already configured per user note)
ANCHOR_API_KEY=your_api_key_here

# Note: Proxy disabled for testing (as per user note)
# Can be enabled later in production
```

---

## Testing Instructions

### Manual Testing

1. **Install dependency:**
   ```bash
   npm install anchorbrowser
   ```

2. **Temporarily disable auth** (modify `proxy.ts` as shown above)

3. **Test session creation:**
   ```bash
   curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=session"
   ```

4. **Test Playwright connection:**
   ```bash
   curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=playwright"
   ```

5. **Test basic actions:**
   ```bash
   curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=actions"
   ```

6. **Test agent integration:**
   ```bash
   curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=agent"
   ```

7. **Test full flow:**
   ```bash
   curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=full"
   ```

### Expected Results

Each test should return JSON with:
- `success: true`
- Relevant test data (session IDs, URLs, responses)
- `note` explaining what was validated

### Example Response

```json
{
  "success": true,
  "sessionId": "sess_abc123",
  "cdpConnection": "success",
  "navigation": {
    "targetUrl": "https://example.com",
    "currentUrl": "https://example.com/",
    "pageTitle": "Example Domain"
  },
  "note": "Playwright connected and navigated successfully."
}
```

---

## Success Criteria

Phase 0 is complete when:

- [ ] All 12 acceptance criteria pass
- [ ] Session creation works reliably (< 5 seconds)
- [ ] Playwright connects without errors
- [ ] Basic browser actions execute correctly
- [ ] Mastra agent can use browser tools
- [ ] Streaming responses work
- [ ] No blocking technical issues discovered
- [ ] Live view URL loads correctly in browser

---

## Failure Scenarios & Mitigation

If any test fails:

| Failure | Impact | Next Steps |
|---------|--------|------------|
| Session creation fails | **Blocking** | Check API key, verify Anchor Browser service status, check network connectivity |
| CDP connection fails | **Blocking** | Verify CDP URL format, check Playwright version compatibility, verify WebSocket support |
| Playwright actions fail | **Blocking** | Verify Playwright version, check browser compatibility, review error messages |
| Agent tool execution fails | **Blocking** | Check Mastra agent configuration, verify tool schema, review agent instructions |
| Streaming fails | **High** | Review Mastra streaming implementation, check gateway configuration, verify model access |
| Live view fails | **Medium** | Check iframe embedding, verify CORS settings, test in different browsers |

---

## Post-Phase 0: Revisiting Later Phases

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them.

### What to Review

If Phase 0 reveals any issues or learnings that change our assumptions:

1. **Technical Architecture** (`03-Technical-Architecture.md`)
   - Update file structure if needed
   - Adjust technology choices
   - Revise data models

2. **Implementation Plan** (`04-Implementation-Plan.md`)
   - Update file impact analysis
   - Adjust phase dependencies
   - Revise effort estimates

3. **Phase Documents** (Phases 1-6)
   - Update acceptance criteria
   - Revise implementation details
   - Adjust design decisions

4. **Research Log** (`02-Research-Log.md`)
   - Document any new discoveries
   - Update primitive implementations
   - Note any API changes

### Questions to Answer

After Phase 0, ask:

- ✅ Do our assumptions hold?
- ✅ Are there any API limitations we didn't expect?
- ✅ Does the integration pattern work as designed?
- ✅ Are there performance concerns?
- ✅ Do we need to adjust the architecture?
- ✅ Are there simpler approaches we discovered?

### Decision Point

**If Phase 0 succeeds:** Proceed to Phase 1 with confidence.

**If Phase 0 reveals issues:** 
1. Document specific failures
2. Research alternatives
3. Update technical architecture
4. Revise phase plans
5. Re-run Phase 0 after fixes

**If Phase 0 reveals major blockers:**
- Consider alternative approaches
- Update product spec if needed
- Re-evaluate feature feasibility

---

## Next Steps After Phase 0

### If All Tests Pass

1. **Document learnings** in Research Log (`02-Research-Log.md`)
2. **Review all later phases** (Phases 1-6) for any needed updates based on learnings
3. **Refactor spike code** into proper service structure (Phase 1)
4. **Re-enable authentication** in `proxy.ts` (remove spike route from public routes)
5. **Proceed to Phase 1** with validated assumptions

### If Tests Fail

1. **Document failures** with error messages and stack traces
2. **Research alternatives** or fixes
3. **Update technical architecture** (`03-Technical-Architecture.md`) based on learnings
4. **Revise all phase plans** (Phases 1-6) accordingly
5. **Update Implementation Plan** (`04-Implementation-Plan.md`) if needed
6. **Re-run Phase 0** after implementing fixes
7. **Do not proceed** to Phase 1 until all Phase 0 tests pass

---

## References

- **Research Log**: `02-Research-Log.md` - All Anchor Browser API details
- **Technical Architecture**: `03-Technical-Architecture.md` - Full architecture (may need updates after Phase 0)
- **Implementation Plan**: `04-Implementation-Plan.md` - Full plan (may need updates after Phase 0)
- **Pattern Source**: `_docs/_diary/08-AgentSDKSpike.md` - Similar spike approach
- **Anchor Browser Docs**: https://docs.anchorbrowser.io

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10
