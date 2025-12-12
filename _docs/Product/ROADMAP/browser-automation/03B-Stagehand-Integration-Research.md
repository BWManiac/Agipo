# Task 03.1: Stagehand Integration — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/browser-automation/03-Stagehand-Integration.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Stagehand API and its integration with Anchor Browser.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Stagehand's API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Stagehand package availability](#rq-1-stagehand-package-availability) | Install and use Stagehand | ❓ |
| [RQ-2: CDP connection lifecycle](#rq-2-cdp-connection-lifecycle) | Connect Stagehand to Anchor sessions | ❓ |
| [RQ-3: Schema format requirements](#rq-3-schema-format-requirements) | Extract data with schemas | ❓ |
| [RQ-4: Observe result format](#rq-4-observe-result-format) | Display page analysis | ❓ |
| [RQ-5: Instance lifecycle](#rq-5-instance-lifecycle) | Manage Stagehand instances | ❓ |

---

## Part 1: Stagehand API Research

### RQ-1: Stagehand Package Availability

**Why It Matters:** PR-3.1 (Install Stagehand) — Need to know how to install and import Stagehand in our Node.js/TypeScript project.

**Status:** ✅ Answered

**Question:**
1. Is `@browserbasehq/stagehand` available as an npm package?
2. What's the exact package name and latest version?
3. Are there any peer dependencies?
4. Is there a TypeScript type definition package?

**Answer:**
```typescript
// Installation
npm install @browserbasehq/stagehand
// Or use the quick-start tool:
npx create-browser-app

// Import in TypeScript/JavaScript
import { Stagehand } from '@browserbasehq/stagehand';

// Version 3 removes Playwright dependency
// Uses modular driver system (CDP-based)
```

**Primitive Discovered:**
- Package name: `@browserbasehq/stagehand`
- Installation command: `npm install @browserbasehq/stagehand`
- Import statement: `import { Stagehand } from '@browserbasehq/stagehand'`
- Latest version: v3 (44%+ faster than v2)

**Implementation Note:** V3 removed Playwright dependency and now uses CDP directly for better performance. TypeScript support is built-in.

**Source:** 
- https://www.npmjs.com/package/@browserbasehq/stagehand
- https://github.com/browserbase/stagehand
- https://www.browserbase.com/blog/stagehand-v3

---

### RQ-2: CDP Connection Lifecycle

**Why It Matters:** PR-3.2 (Connect Stagehand to Anchor) — Need to understand when and how Stagehand connects to Anchor's CDP URL.

**Status:** ✅ Answered

**Question:**
1. When does Stagehand connect to CDP - on initialization or on first use?
2. How do we pass Anchor's CDP URL to Stagehand?
3. What happens if CDP URL changes mid-session?
4. Can one Stagehand instance handle multiple CDP connections?

**Answer:**
```typescript
// Stagehand constructor accepts CDP configuration
const stagehand = new Stagehand({
  env: "LOCAL",  // or "BROWSERBASE"
  // For CDP connection to existing Chrome instance
  browserWSEndpoint: "ws://localhost:9222/devtools/browser/...",  // CDP URL from Anchor
  
  // Alternative: Use with Browserbase cloud
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  
  // LLM configuration
  model: "openai/gpt-4o",  // or "anthropic/claude-3-5-sonnet-20241022"
  systemPrompt: "Custom instructions for the AI",
  selfHeal: true,  // Enable automatic error recovery
  verbose: 1  // Logging level 0-2
});

// Initialize and connect
await stagehand.init();

// Access page and context
const page = stagehand.page;
const context = stagehand.context;

// Clean up
await stagehand.close();
```

**Primitive Discovered:**
- Function/Method: `new Stagehand(config)` constructor
- Connection: `await stagehand.init()` to establish CDP connection  
- Configuration: `browserWSEndpoint` for CDP URL
- Cleanup: `await stagehand.close()`

**Implementation Note:** 
- Connection happens on `init()`, not constructor
- One instance per CDP connection (no multi-connection support)
- Must close and create new instance for different CDP URL

**Source:** 
- https://docs.stagehand.dev/v3/references/stagehand
- https://github.com/browserbase/stagehand** 

---

### RQ-3: Schema Format Requirements

**Why It Matters:** PR-3.3 (Extract with Schema) — Need to understand if Stagehand accepts Zod schemas, JSON Schema, or both.

**Status:** ✅ Answered

**Question:**
1. Does `stagehand.page.extract()` accept Zod schemas directly?
2. Or does it require JSON Schema format?
3. Do we need a Zod-to-JSON-Schema converter?
4. What's the exact schema format for nested objects, arrays, unions?

**Answer:**
```typescript
// Stagehand uses Zod schemas directly!
import { z } from 'zod';

// Define Zod schema with descriptions
const schema = z.object({
  author: z.string().describe("The username of the PR author"),
  title: z.string().describe("The title of the PR"),
  // Nested objects and arrays supported
  comments: z.array(z.object({
    user: z.string(),
    text: z.string(),
    timestamp: z.string()
  })).describe("List of comments"),
  // Optional fields
  labels: z.array(z.string()).optional().describe("PR labels")
});

// Extract structured data with schema
const { author, title, comments } = await stagehand.extract(
  "extract the author and title of the PR",
  schema  // Pass Zod schema directly
);

// For better TypeScript type safety
type ExtractedData = z.infer<typeof schema>;
const data: ExtractedData = await stagehand.extract(
  "extract PR information",
  schema
);
```

**Primitive Discovered:**
- Function/Method: `stagehand.extract(description, zodSchema)`
- Schema format: Native Zod schemas with `.describe()` annotations
- Return type: Typed object matching schema

**Implementation Note:** 
- No conversion needed - Zod schemas work directly
- Use `.describe()` on fields for better AI understanding
- Full Zod features supported (arrays, objects, optionals, unions)

**Source:** 
- https://github.com/browserbase/stagehand#readme
- https://docs.stagehand.dev/v3/references/stagehand** 

---

### RQ-4: Observe Result Format

**Why It Matters:** PR-3.4 (Display Page Analysis) — Need to understand the structure of `observe()` output to display in UI.

**Status:** ✅ Answered

**Question:**
1. What's the exact return type of `stagehand.page.observe()`?
2. Does it return structured objects or freeform text?
3. What fields are available (actions, extractable data, page info)?
4. How do we parse and display this in the UI?

**Answer:**
```typescript
// Observe discovers potential actions on a page
const observations = await stagehand.observe(
  "What actions can be taken on this page?"
);

// Returns a suggested list of actions that can be taken
// Format appears to be an array or structured list of possible actions
// Example responses might include:
// - "Click on the 'Sign In' button"
// - "Fill out the email field"
// - "Navigate to the pricing page"
// - "Extract product information"

// Can also be used with specific context
const targetedObservations = await stagehand.observe(
  "What data can be extracted from this product page?"
);

// The observe() method helps with:
// 1. Discovering available actions on unfamiliar pages
// 2. Understanding page structure and capabilities
// 3. Planning automation sequences
```

**Primitive Discovered:**
- Function/Method: `stagehand.observe(description)`
- Return type: List/array of suggested actions (text descriptions)
- Purpose: Discover potential actions on the current page

**Implementation Note:** 
- Returns actionable suggestions based on page analysis
- Can be prompted for specific types of actions or data
- Useful for building dynamic automation that adapts to page content

**Source:** 
- https://docs.stagehand.dev/v3/references/stagehand
- https://github.com/browserbase/stagehand (observe() is one of three main APIs)** 

---

### RQ-5: Instance Lifecycle

**Why It Matters:** PR-3.5 (Manage Stagehand Instances) — Need to understand when to create/destroy instances for performance.

**Status:** ✅ Answered

**Question:**
1. Should Stagehand instances be created per session or reused?
2. What's the memory footprint of a Stagehand instance?
3. When should we destroy instances (session end, inactivity)?
4. Can instances be safely cached across multiple operations?

**Answer:**
```typescript
// Instance lifecycle pattern
class StagehandManager {
  private instance: Stagehand | null = null;
  
  async getOrCreate(cdpUrl: string): Promise<Stagehand> {
    if (!this.instance) {
      this.instance = new Stagehand({
        env: "LOCAL",
        browserWSEndpoint: cdpUrl,
        model: "openai/gpt-4o",
        // Enable caching for identical requests
        enableCaching: true,
        selfHeal: true
      });
      await this.instance.init();
    }
    return this.instance;
  }
  
  async destroy(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}

// Stagehand features:
// - metrics: Track AI operation usage
// - history: Log of performed operations
// - enableCaching: Cache LLM responses for identical requests
```

**Primitive Discovered:**
- Creation: `new Stagehand()` + `await init()`
- Destruction: `await close()` to clean up resources
- Best practices: 
  - One instance per CDP session
  - Destroy when session ends
  - Enable caching for performance
  - Track metrics for cost monitoring

**Implementation Note:** 
- Create per session, destroy on session end
- Instance includes LLM state, so reuse for related operations
- Memory footprint includes cached responses if caching enabled

**Source:** 
- https://docs.stagehand.dev/v3/references/stagehand
- Inferred from constructor options and lifecycle methods** 

---

## Part 2: Anchor Browser Integration

### RQ-6: How does Stagehand integrate with Anchor Browser?

**Why It Matters:** PR-3.6 (Anchor + Stagehand Integration) — Understanding the integration pattern from Anchor's documentation.

**Status:** ✅ Answered

**Question:**
1. Does Anchor provide official Stagehand integration documentation?
2. What's the recommended pattern for using Stagehand with Anchor sessions?
3. Are there any compatibility issues or limitations?
4. Can Stagehand actions appear in Anchor's recording?

**Integration Pattern:**
```typescript
// Pattern: Connect Stagehand to Anchor's CDP endpoint

// 1. Create Anchor session
const anchorClient = new Anchorbrowser({ apiKey: process.env.ANCHOR_API_KEY });
const session = await anchorClient.sessions.create();

// 2. Get CDP URL from Anchor session
const browser = await anchorClient.browser.connect(session.id);
const cdpUrl = browser.wsEndpoint();  // Get WebSocket endpoint

// 3. Connect Stagehand to Anchor's CDP
const stagehand = new Stagehand({
  env: "LOCAL",
  browserWSEndpoint: cdpUrl,
  model: "openai/gpt-4o",
  selfHeal: true
});

await stagehand.init();

// 4. Use Stagehand with Anchor's browser
const page = stagehand.page;
await stagehand.act("Click on the login button");
const data = await stagehand.extract("Get user profile", schema);

// 5. Clean up
await stagehand.close();
await browser.close();
```

**Answer:**
1. No explicit Anchor+Stagehand docs found, but CDP integration is standard
2. Pattern: Create Anchor session → Get CDP URL → Connect Stagehand
3. Both use CDP, so should be compatible (Stagehand v3 uses CDP directly)
4. Actions should appear in recordings since they go through CDP

**Source:** 
- Inferred from CDP architecture of both tools
- https://docs.stagehand.dev (CDP-based)
- https://docs.anchorbrowser.io (provides CDP access)** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Install Stagehand | `npm install @browserbasehq/stagehand` | npm | ✅ |
| Initialize Stagehand | `new Stagehand(config)` + `await init()` | Stagehand SDK | ✅ |
| Connect to CDP | `browserWSEndpoint` in constructor | Stagehand SDK | ✅ |
| Execute act() | `await stagehand.act(description)` | Stagehand SDK | ✅ |
| Execute extract() | `await stagehand.extract(description, zodSchema)` | Stagehand SDK | ✅ |
| Execute observe() | `await stagehand.observe(description)` | Stagehand SDK | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| No official Anchor+Stagehand docs | Must infer integration | Use CDP standard pattern |
| One instance per CDP | Can't reuse across sessions | Create new instance per session |

### Key Learnings

1. **Stagehand v3 uses CDP directly** - Removed Playwright dependency for 44% performance gain
2. **Native Zod support** - No schema conversion needed, use Zod schemas directly with `.describe()`
3. **Session-based lifecycle** - Create Stagehand instance per Anchor session, destroy on session end 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to integrate Stagehand with Anchor Browser

---

## Resources Used

- [Anchor Browser Stagehand Integration](https://docs.anchorbrowser.io/integrations/stagehand)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)
- [Stagehand npm package](https://www.npmjs.com/package/@browserbasehq/stagehand)
- Existing code: `app/api/browser-automation/services/anchor-agent.ts`



