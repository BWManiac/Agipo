# Phase 3: Chat & Browser Agent

**Status:** Planned
**Depends On:** Phase 2 (Basic Playground UI)

**Note:** Assumes Phase 0 (Technical Spike) has validated Mastra agent + browser tools integration. If Phase 0 revealed issues, review this phase before execution.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Enable natural language browser control through a Mastra agent with Playwright tools. This is the core feature that transforms the playground from a session viewer into an interactive browser automation tool.

After this phase, users can type natural language commands like "Go to google.com and search for cats", and the agent will execute the appropriate browser actions, streaming responses and action updates in real-time.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | Mastra | Consistent with workforce agents |
| Browser control | Playwright via CDP | Rich API, well-documented |
| Streaming | Server-Sent Events | Simple, unidirectional, browser-native |
| Action events | Inline with message stream | Real-time feedback without separate channel |

### Pertinent Research

- **Research Log Section 3**: Playwright CDP integration
- **Research Log Section 5**: Browser agent tools design
- **Mockup 04**: `04-chat-interface/` - Chat states (empty, conversation, streaming)

*Source: `_docs/_tasks/21-browser-automation/02-Research-Log.md`, `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`*

### Overall File Impact

#### Backend / Routes

| File | Action | Purpose |
|------|--------|---------|
| `sessions/[sessionId]/chat/route.ts` | Create | Streaming chat endpoint |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `sessions/[sessionId]/chat/services/browser-agent.ts` | Create | Mastra agent configuration |
| `sessions/[sessionId]/chat/services/browser-tools.ts` | Create | Playwright tool definitions |

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/slices/chatSlice.ts` | Create | Chat messages & streaming state |
| `store/slices/actionsSlice.ts` | Create | Action log state (for SSE events) |
| `store/index.ts` | Modify | Add chat and actions slices |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `components/ChatPanel/index.tsx` | Create | Chat panel container |
| `components/ChatPanel/TabSwitcher.tsx` | Create | Chat / Action Log tabs |
| `components/ChatPanel/ChatArea.tsx` | Create | Messages display |
| `components/ChatPanel/ChatEmpty.tsx` | Create | Empty state with suggestions |
| `components/ChatPanel/ChatInput.tsx` | Create | Message input with streaming state |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.1 | Chat panel renders on right side | Verify layout |
| AC-3.2 | Empty state shows suggestion chips | Initial load |
| AC-3.3 | Clicking suggestion populates input | Click chip |
| AC-3.4 | Sending message initiates stream | Type, send, verify loading |
| AC-3.5 | Agent response streams in real-time | Watch text appear progressively |
| AC-3.6 | Navigate tool works | "Go to google.com", verify iframe |
| AC-3.7 | Click tool works | "Click the search button", verify action |
| AC-3.8 | Type tool works | "Type 'hello world'", verify text |
| AC-3.9 | Screenshot tool works | "Take a screenshot", verify image |
| AC-3.10 | Extract tool works | "Get the page title", verify data |
| AC-3.11 | Action events appear inline | See action badges in chat |
| AC-3.12 | Input disabled during streaming | Verify disabled state |
| AC-3.13 | Stop button cancels stream | Click stop, verify cancellation |
| AC-3.14 | Errors display in chat | Trigger error, verify message |

### User Flows

#### Flow 1: First Message

```
1. User selects a session (from Phase 2)
2. Chat panel shows empty state with suggestions
3. User clicks "Navigate to google.com"
4. Input populates with text
5. User presses Enter or clicks Send
6. Input disables, shows "Agent is working..."
7. Agent message appears: "I'll navigate to Google for you."
8. Action badge appears: [Navigating to google.com...]
9. Browser iframe updates to show Google
10. Action badge updates: [Navigated to google.com ✓ 1.2s]
11. Agent message completes: "Done! I've navigated to Google."
12. Input re-enables
```

#### Flow 2: Multi-Action Command

```
1. User types: "Search for 'cute cats' on Google"
2. Agent responds: "I'll search for 'cute cats' on Google."
3. Sequential action badges:
   - [Navigating to google.com...] → [✓ 1.2s]
   - [Clicking search input...] → [✓ 0.3s]
   - [Typing 'cute cats'...] → [✓ 0.5s]
   - [Clicking search button...] → [✓ 0.4s]
4. Browser shows search results
5. Agent: "Here are the search results for 'cute cats'!"
```

#### Flow 3: Error Handling

```
1. User types: "Click the nonexistent button"
2. Agent: "I'll try to find that button..."
3. Action badge: [Clicking 'nonexistent button'...] → [✗ Element not found]
4. Agent: "I couldn't find a button matching that description. Could you be more specific?"
```

---

## Out of Scope

- Action log tab (Phase 4)
- Profile-based credentials (Phase 5)
- Thread persistence (Future)
- Agent selection (uses single browser-control agent)

---

## Implementation Details

### Browser Tools

```typescript
// sessions/[sessionId]/chat/services/browser-tools.ts

import { createTool } from "@mastra/core";
import { z } from "zod";
import type { Page } from "playwright";

export function createBrowserTools(page: Page) {
  return {
    browser_navigate: createTool({
      id: "browser_navigate",
      description: "Navigate the browser to a URL",
      inputSchema: z.object({
        url: z.string().describe("The URL to navigate to"),
        waitFor: z.enum(["load", "domcontentloaded", "networkidle"]).default("load"),
      }),
      execute: async ({ url, waitFor }) => {
        await page.goto(url, { waitUntil: waitFor });
        return {
          success: true,
          url: page.url(),
          title: await page.title(),
        };
      },
    }),

    browser_click: createTool({
      id: "browser_click",
      description: "Click an element on the page. Use descriptive text or CSS selectors.",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector or text content to click"),
        button: z.enum(["left", "right", "middle"]).default("left"),
      }),
      execute: async ({ selector, button }) => {
        // Try text-based selection first, then CSS selector
        try {
          await page.getByText(selector).click({ button });
        } catch {
          await page.click(selector, { button });
        }
        return { success: true, selector };
      },
    }),

    browser_type: createTool({
      id: "browser_type",
      description: "Type text into an input field",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for the input field"),
        text: z.string().describe("Text to type"),
        clear: z.boolean().default(false).describe("Clear existing text first"),
        pressEnter: z.boolean().default(false).describe("Press Enter after typing"),
      }),
      execute: async ({ selector, text, clear, pressEnter }) => {
        const element = page.locator(selector);
        if (clear) {
          await element.fill("");
        }
        await element.type(text);
        if (pressEnter) {
          await element.press("Enter");
        }
        return { success: true, selector, textLength: text.length };
      },
    }),

    browser_screenshot: createTool({
      id: "browser_screenshot",
      description: "Take a screenshot of the current page or a specific element",
      inputSchema: z.object({
        fullPage: z.boolean().default(false),
        selector: z.string().optional().describe("Screenshot specific element"),
      }),
      execute: async ({ fullPage, selector }) => {
        let buffer: Buffer;
        if (selector) {
          const element = await page.$(selector);
          if (!element) throw new Error(`Element not found: ${selector}`);
          buffer = await element.screenshot();
        } else {
          buffer = await page.screenshot({ fullPage });
        }
        return {
          success: true,
          base64: buffer.toString("base64"),
          mimeType: "image/png",
        };
      },
    }),

    browser_extract: createTool({
      id: "browser_extract",
      description: "Extract text content from elements on the page",
      inputSchema: z.object({
        selector: z.string().describe("CSS selector for elements to extract"),
        attribute: z.string().optional().describe("Extract attribute instead of text"),
        multiple: z.boolean().default(false).describe("Extract from all matching elements"),
      }),
      execute: async ({ selector, attribute, multiple }) => {
        if (multiple) {
          const elements = await page.$$(selector);
          const results = await Promise.all(
            elements.map(async (el) =>
              attribute ? await el.getAttribute(attribute) : await el.textContent()
            )
          );
          return { success: true, data: results.filter(Boolean) };
        } else {
          const element = await page.$(selector);
          if (!element) throw new Error(`Element not found: ${selector}`);
          const value = attribute
            ? await element.getAttribute(attribute)
            : await element.textContent();
          return { success: true, data: value };
        }
      },
    }),

    browser_wait: createTool({
      id: "browser_wait",
      description: "Wait for an element, navigation, or fixed time",
      inputSchema: z.object({
        type: z.enum(["selector", "navigation", "time"]),
        value: z.string().describe("Selector, URL pattern, or milliseconds"),
        timeout: z.number().default(30000),
      }),
      execute: async ({ type, value, timeout }) => {
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
    }),
  };
}
```

### Browser Agent

```typescript
// sessions/[sessionId]/chat/services/browser-agent.ts

import { Agent } from "@mastra/core/agent";
import { chromium } from "playwright";
import { gateway } from "@ai-sdk/gateway";
import { createBrowserTools } from "./browser-tools";

export interface BrowserAgentContext {
  page: any; // Playwright Page
  sessionId: string;
}

export async function createBrowserAgent(cdpUrl: string, sessionId: string) {
  // Connect to browser via CDP
  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  // Create tools with page reference
  const tools = createBrowserTools(page);

  // Create Mastra agent
  const agent = new Agent({
    name: "browser-control",
    instructions: `You are a browser automation assistant. You control a live browser session.

Your capabilities:
- Navigate to URLs
- Click elements (buttons, links, etc.)
- Type text into input fields
- Take screenshots
- Extract text from the page
- Wait for elements or navigation

Guidelines:
1. Always explain what you're about to do before taking action
2. After completing actions, describe what happened
3. If an action fails, explain the error and suggest alternatives
4. For forms, fill fields one at a time
5. Use descriptive text selectors when possible (e.g., "Sign In" button)
6. If you need to find an element, describe what you're looking for

Current page: ${await page.url()}`,
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    tools,
  });

  return {
    agent,
    page,
    browser,
    cleanup: async () => {
      // Don't close browser - it's managed by Anchor
      // Just disconnect Playwright
      browser.close();
    },
  };
}
```

### Chat Route (Streaming)

```typescript
// sessions/[sessionId]/chat/route.ts

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "../../services/anchor-client";
import { createBrowserAgent } from "./services/browser-agent";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  threadId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Validate request
  const body = await request.json();
  const validated = ChatRequestSchema.safeParse(body);
  if (!validated.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get session details
  const session = await getSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create browser agent
  const { agent, cleanup } = await createBrowserAgent(session.cdpUrl, sessionId);

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: any) => {
    await writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Handle agent response in background
  (async () => {
    try {
      // Stream agent response
      const response = await agent.stream(validated.data.message, {
        onToolCallStart: async (toolCall) => {
          await sendEvent("action_start", {
            id: toolCall.id,
            type: toolCall.name.replace("browser_", ""),
            target: JSON.stringify(toolCall.args),
            timestamp: new Date().toISOString(),
          });
        },
        onToolCallEnd: async (toolCall, result) => {
          await sendEvent("action_complete", {
            id: toolCall.id,
            type: toolCall.name.replace("browser_", ""),
            target: JSON.stringify(toolCall.args),
            success: result.success !== false,
            duration: toolCall.duration,
            timestamp: new Date().toISOString(),
          });

          // Send screenshot if available
          if (result.base64) {
            await sendEvent("screenshot", {
              base64: result.base64,
              mimeType: result.mimeType,
            });
          }
        },
        onToolCallError: async (toolCall, error) => {
          await sendEvent("action_error", {
            id: toolCall.id,
            type: toolCall.name.replace("browser_", ""),
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        },
      });

      // Stream text chunks
      for await (const chunk of response) {
        if (chunk.text) {
          await sendEvent("message", { content: chunk.text });
        }
      }

      await sendEvent("done", {});
    } catch (error) {
      await sendEvent("error", { message: (error as Error).message });
    } finally {
      await cleanup();
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Chat Slice

```typescript
// store/slices/chatSlice.ts

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: ActionInMessage[];
}

export interface ActionInMessage {
  id: string;
  type: string;
  target: string;
  status: "running" | "success" | "error";
  duration?: number;
  error?: string;
}

export interface ChatSliceState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamingContent: string;
  error: string | null;
  abortController: AbortController | null;
}

export interface ChatSliceActions {
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  appendToStream: (content: string) => void;
  finalizeStream: () => void;
  updateAction: (messageId: string, actionId: string, updates: Partial<ActionInMessage>) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

export type ChatSlice = ChatSliceState & ChatSliceActions;

export const createChatSlice: StateCreator<BrowserStore, [], [], ChatSlice> = (
  set,
  get
) => ({
  messages: [],
  isStreaming: false,
  currentStreamingContent: "",
  error: null,
  abortController: null,

  sendMessage: async (sessionId, text) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      currentStreamingContent: "",
      error: null,
    }));

    // Create assistant message placeholder
    const assistantMessageId = `msg_${Date.now() + 1}`;
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          actions: [],
        },
      ],
    }));

    // Create abort controller
    const abortController = new AbortController();
    set({ abortController });

    try {
      const response = await fetch(
        `/api/browser-automation/sessions/${sessionId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: abortController.signal,
        }
      );

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith("data: ")) {
              const data = JSON.parse(dataLine.slice(6));
              handleSSEEvent(eventType, data, assistantMessageId, set, get);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        set({ error: (error as Error).message });
      }
    } finally {
      set({ isStreaming: false, abortController: null });
    }
  },

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToStream: (content) =>
    set((state) => ({
      currentStreamingContent: state.currentStreamingContent + content,
      messages: state.messages.map((m, i) =>
        i === state.messages.length - 1
          ? { ...m, content: state.currentStreamingContent + content }
          : m
      ),
    })),

  finalizeStream: () =>
    set({ currentStreamingContent: "", isStreaming: false }),

  updateAction: (messageId, actionId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              actions: m.actions?.map((a) =>
                a.id === actionId ? { ...a, ...updates } : a
              ),
            }
          : m
      ),
    })),

  stopStreaming: () => {
    const { abortController } = get();
    abortController?.abort();
    set({ isStreaming: false, abortController: null });
  },

  clearMessages: () => set({ messages: [], currentStreamingContent: "" }),

  setError: (error) => set({ error }),
});

function handleSSEEvent(
  type: string,
  data: any,
  messageId: string,
  set: any,
  get: any
) {
  switch (type) {
    case "message":
      get().appendToStream(data.content);
      break;
    case "action_start":
      set((state: any) => ({
        messages: state.messages.map((m: ChatMessage) =>
          m.id === messageId
            ? {
                ...m,
                actions: [
                  ...(m.actions || []),
                  { ...data, status: "running" },
                ],
              }
            : m
        ),
      }));
      // Also add to actions slice for action log
      get().addAction({ ...data, status: "running", sessionId: "" });
      break;
    case "action_complete":
      get().updateAction(messageId, data.id, {
        status: "success",
        duration: data.duration,
      });
      get().updateAction2(data.id, { status: "success", duration: data.duration });
      break;
    case "action_error":
      get().updateAction(messageId, data.id, {
        status: "error",
        error: data.error,
      });
      get().updateAction2(data.id, { status: "error", error: data.error });
      break;
    case "done":
      get().finalizeStream();
      break;
    case "error":
      set({ error: data.message, isStreaming: false });
      break;
  }
}
```

---

## References

- **Mockup**: `04-chat-interface/`
- **Research Log**: `02-Research-Log.md`
- **Implementation Plan**: `04-Implementation-Plan.md`
- **Pattern Source**: `workforce/.../ChatTab/`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

