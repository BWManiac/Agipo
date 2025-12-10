# Phase 3: Chat & Browser Agent

**Status:** Planned
**Depends On:** Phase 2 (Basic Playground UI)

**Note:** Based on Phase 0 spike findings, this phase uses Anchor Browser's built-in `agent.task()` instead of Mastra agent. This allows us to focus on understanding Anchor's capabilities without the complexity of custom tool integration.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Enable natural language browser control through Anchor Browser's built-in agent task API. This is the core feature that transforms the playground from a session viewer into an interactive browser automation tool.

After this phase, users can type natural language commands like "Go to google.com and search for cats", and Anchor's agent will execute the appropriate browser actions, streaming step updates in real-time.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | **Anchor `agent.task()`** | Phase 0 revealed Mastra tool execution issues; Anchor's built-in agent is proven and simpler |
| Browser control | Anchor's internal Playwright | Managed by Anchor, no CDP connection needed |
| Streaming | Server-Sent Events | Simple, unidirectional, browser-native |
| Action events | Via `onAgentStep` callback | Real-time feedback from Anchor's agent |

### Why Anchor's agent.task() Instead of Mastra?

**Phase 0 Spike Finding:** Mastra agent creation works, streaming works, but tool execution fails silently. Direct Playwright actions work perfectly, but the same actions via Mastra agent tools don't execute.

**Benefits of Anchor's agent.task():**
1. Built-in natural language understanding
2. Automatic action planning and execution
3. Step-by-step callbacks for UI updates
4. Structured output support with Zod schemas
5. No need to manage Playwright connection ourselves

**Trade-off:** Less control over individual browser actions, but this spike is about understanding Anchor's capabilities, not Mastra's.

### Pertinent Research

- **Research Log RQ-7**: Natural language browser control options
- **Research Log RQ-8**: Tasks API for reusable automation
- **Mockup 04**: `04-chat-interface/` - Chat states (empty, conversation, streaming)

*Source: `_docs/_tasks/21-browser-automation/02-Research-Log.md`*

### Overall File Impact

#### Backend / Routes

| File | Action | Purpose |
|------|--------|---------|
| `sessions/[sessionId]/chat/route.ts` | Create | Streaming chat endpoint using Anchor agent |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `services/anchor-agent.ts` | Create | Anchor agent.task() wrapper with step callbacks |

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/slices/chatSlice.ts` | Create | Chat messages & streaming state |
| `store/slices/actionsSlice.ts` | Create | Action log state (for step events) |
| `store/index.ts` | Modify | Add chat and actions slices |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `components/ChatPanel/index.tsx` | Create | Chat panel container (left side) |
| `components/ChatPanel/ChatArea.tsx` | Create | Messages display |
| `components/ChatPanel/ChatEmpty.tsx` | Create | Empty state with suggestions |
| `components/ChatPanel/ChatInput.tsx` | Create | Message input with streaming state |
| `components/ChatPanel/ActionBadge.tsx` | Create | Inline action status badge |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.1 | Chat panel renders on left side (cursor-style layout) | Verify layout |
| AC-3.2 | Empty state shows suggestion chips | Initial load |
| AC-3.3 | Clicking suggestion populates input | Click chip |
| AC-3.4 | Sending message initiates Anchor agent task | Type, send, verify loading |
| AC-3.5 | Agent steps stream via onAgentStep callback | Watch steps appear |
| AC-3.6 | Navigate action works | "Go to google.com", verify iframe |
| AC-3.7 | Click action works | "Click the search button", verify action |
| AC-3.8 | Type action works | "Type 'hello world'", verify text |
| AC-3.9 | Extract action works | "Get the page title", verify data |
| AC-3.10 | Action steps appear inline as badges | See step badges in chat |
| AC-3.11 | Input disabled during task execution | Verify disabled state |
| AC-3.12 | Final result displayed | Task completes, shows result |
| AC-3.13 | Errors display in chat | Trigger error, verify message |

### User Flows

#### Flow 1: First Message

```
1. User selects a session (from Phase 2)
2. Chat panel (left side) shows empty state with suggestions
3. User clicks "Navigate to google.com"
4. Input populates with text
5. User presses Enter or clicks Send
6. Input disables, shows "Working..."
7. Step appears: [Navigating to google.com...]
8. Browser iframe (right side) updates to show Google
9. Step updates: [Navigated to google.com ✓]
10. Result message: "Successfully navigated to google.com"
11. Input re-enables
```

#### Flow 2: Multi-Step Command

```
1. User types: "Search for 'cute cats' on Google"
2. Anchor agent plans and executes steps:
   - [Step 1: Navigating to google.com] → [✓]
   - [Step 2: Typing 'cute cats' in search box] → [✓]
   - [Step 3: Clicking search button] → [✓]
3. Browser shows search results
4. Result: "Search completed. Found results for 'cute cats'."
```

#### Flow 3: Structured Output

```
1. User types: "Get the title and first 3 headlines from this page"
2. Agent extracts structured data
3. Result displays as formatted JSON or table
```

#### Flow 4: Error Handling

```
1. User types: "Click the nonexistent button"
2. Agent attempts action
3. Step shows: [Clicking button...] → [✗ Failed]
4. Error message: "Could not find element matching 'nonexistent button'"
```

---

## Out of Scope

- Action log tab (Phase 4)
- Profile-based credentials (Phase 5)
- Thread persistence (Future)
- Custom Mastra agent integration (Future - pending tool execution fix)

---

## Implementation Details

### Anchor Agent Service

```typescript
// app/api/browser-automation/services/anchor-agent.ts

import AnchorBrowser from "anchorbrowser";
import { z } from "zod";

const client = new AnchorBrowser({
  apiKey: process.env.ANCHOR_API_KEY!,
});

export interface AgentStep {
  id: string;
  type: string;
  description: string;
  status: "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface TaskOptions {
  onStep?: (step: AgentStep) => void;
  outputSchema?: z.ZodSchema;
  timeout?: number;
}

export async function executeAgentTask(
  sessionId: string,
  task: string,
  options?: TaskOptions
): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const result = await client.agent.task(task, {
      sessionId,
      taskOptions: {
        onAgentStep: (step) => {
          if (options?.onStep) {
            options.onStep({
              id: `step_${Date.now()}`,
              type: step.type || "action",
              description: step.description || step.action || task,
              status: step.status === "completed" ? "success" :
                     step.status === "failed" ? "error" : "running",
              timestamp: new Date().toISOString(),
              duration: step.duration,
              error: step.error,
            });
          }
        },
        outputSchema: options?.outputSchema
          ? z.toJSONSchema(options.outputSchema)
          : undefined,
        timeout: options?.timeout || 60000,
      },
    });

    return {
      success: true,
      result: result.data || result,
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: (error as Error).message,
    };
  }
}
```

### Chat Route (Streaming)

```typescript
// app/api/browser-automation/sessions/[sessionId]/chat/route.ts

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "../../../services/anchor-client";
import { executeAgentTask } from "../../../services/anchor-agent";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
});

export const runtime = "nodejs";
export const maxDuration = 120;

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

  // Verify session exists
  const session = await getSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: any) => {
    await writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Execute agent task in background
  (async () => {
    try {
      // Send initial acknowledgment
      await sendEvent("message", {
        content: `Working on: "${validated.data.message}"`
      });

      const result = await executeAgentTask(sessionId, validated.data.message, {
        onStep: async (step) => {
          if (step.status === "running") {
            await sendEvent("step_start", step);
          } else if (step.status === "success") {
            await sendEvent("step_complete", step);
          } else if (step.status === "error") {
            await sendEvent("step_error", step);
          }
        },
      });

      if (result.success) {
        await sendEvent("result", {
          success: true,
          data: result.result,
        });
      } else {
        await sendEvent("error", {
          message: result.error || "Task failed"
        });
      }

      await sendEvent("done", {});
    } catch (error) {
      await sendEvent("error", { message: (error as Error).message });
    } finally {
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
// app/(pages)/experiments/browser-automation/store/slices/chatSlice.ts

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface AgentStep {
  id: string;
  type: string;
  description: string;
  status: "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  steps?: AgentStep[];
  result?: any;
}

export interface ChatSliceState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  abortController: AbortController | null;
}

export interface ChatSliceActions {
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  addStep: (messageId: string, step: AgentStep) => void;
  updateStep: (messageId: string, stepId: string, updates: Partial<AgentStep>) => void;
  setResult: (messageId: string, result: any) => void;
  stopTask: () => void;
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
  error: null,
  abortController: null,

  sendMessage: async (sessionId, text) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMessageId = `msg_${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      steps: [],
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      error: null,
    }));

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
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const eventMatch = block.match(/event: (\w+)/);
          const dataMatch = block.match(/data: (.+)/);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            handleSSEEvent(eventType, data, assistantMessageId, set, get);
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

  addStep: (messageId, step) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, steps: [...(m.steps || []), step] }
          : m
      ),
    })),

  updateStep: (messageId, stepId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              steps: m.steps?.map((s) =>
                s.id === stepId ? { ...s, ...updates } : s
              ),
            }
          : m
      ),
    })),

  setResult: (messageId, result) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, result, content: formatResult(result) }
          : m
      ),
    })),

  stopTask: () => {
    const { abortController } = get();
    abortController?.abort();
    set({ isStreaming: false, abortController: null });
  },

  clearMessages: () => set({ messages: [] }),

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
      set((state: any) => ({
        messages: state.messages.map((m: ChatMessage) =>
          m.id === messageId ? { ...m, content: data.content } : m
        ),
      }));
      break;
    case "step_start":
      get().addStep(messageId, data);
      // Also add to actions slice for action log
      get().addAction?.({ ...data, sessionId: "" });
      break;
    case "step_complete":
      get().updateStep(messageId, data.id, { status: "success", duration: data.duration });
      get().updateActionStatus?.(data.id, "success", data.duration);
      break;
    case "step_error":
      get().updateStep(messageId, data.id, { status: "error", error: data.error });
      get().updateActionStatus?.(data.id, "error", undefined, data.error);
      break;
    case "result":
      get().setResult(messageId, data.data);
      break;
    case "done":
      set({ isStreaming: false });
      break;
    case "error":
      set({ error: data.message, isStreaming: false });
      break;
  }
}

function formatResult(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    return `Task completed.\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }
  return String(result);
}
```

---

## References

- **Mockup**: `04-chat-interface/`
- **Research Log**: `02-Research-Log.md` (RQ-7, RQ-8)
- **Anchor Browser Tasks API**: https://docs.anchorbrowser.io/advanced/tasks
- **Phase 0 Findings**: Tool execution issues with Mastra → use Anchor agent

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
| 2025-12-10 | **Revised to use Anchor agent.task()** instead of Mastra based on Phase 0 findings | Claude |

---

**Last Updated:** 2025-12-10

