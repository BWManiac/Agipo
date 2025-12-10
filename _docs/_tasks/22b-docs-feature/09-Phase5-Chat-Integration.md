# Phase 5: Chat Integration

**Phase:** 5 of 8
**Estimated LOC:** ~1,400
**Prerequisites:** Phase 4 (Block System)
**Focus:** Chat sidebar, agent document tools, real-time updates, conversation persistence

---

## Overview

This phase integrates the AI chat functionality with the document editor. Users will be able to:

1. Open a chat sidebar within the document view
2. Converse with an AI agent about the document
3. Have the agent read, insert, and modify document content
4. See real-time updates as the agent edits
5. Persist chat history with the document

---

## Acceptance Criteria

### AC-5.1: Chat Sidebar
- [ ] Chat icon in document header opens sidebar
- [ ] Sidebar slides in from right side
- [ ] Sidebar is resizable (drag edge)
- [ ] Sidebar can be collapsed/expanded
- [ ] Sidebar state persists per document

### AC-5.2: Chat Interface
- [ ] Message input at bottom of sidebar
- [ ] Send button and Enter to submit
- [ ] User messages styled distinctly from agent
- [ ] Agent responses render Markdown
- [ ] Loading indicator while agent is responding
- [ ] Error states with retry option

### AC-5.3: Document Context
- [ ] Agent automatically receives document content
- [ ] Agent knows document title and metadata
- [ ] Agent can reference document sections
- [ ] Context updates when document changes

### AC-5.4: Agent Document Tools
- [ ] `sys_doc_read` - Read current document content
- [ ] `sys_doc_insert` - Insert content at position
- [ ] `sys_doc_replace` - Replace text/section
- [ ] `sys_doc_append` - Append to document
- [ ] `sys_doc_delete` - Delete section
- [ ] Tool execution shows in UI

### AC-5.5: Real-Time Updates
- [ ] Editor updates when agent makes changes
- [ ] Changes highlighted briefly for visibility
- [ ] User can undo agent changes
- [ ] Conflict resolution if user also editing

### AC-5.6: Chat History
- [ ] Messages stored with document
- [ ] History loads when reopening document
- [ ] History can be cleared
- [ ] History shows timestamps

### AC-5.7: Agent Streaming
- [ ] Agent responses stream word-by-word
- [ ] Tool calls show as expandable sections
- [ ] Cancel button to stop generation
- [ ] Partial responses saved if cancelled

---

## File Structure

```
components/
└── docs/
    └── chat/
        ├── index.ts                     # Barrel export
        ├── ChatSidebar.tsx              # Main sidebar container
        ├── ChatHeader.tsx               # Sidebar header with controls
        ├── ChatMessages.tsx             # Message list
        ├── ChatMessage.tsx              # Individual message
        ├── ChatInput.tsx                # Input area
        ├── ToolCallDisplay.tsx          # Agent tool execution UI
        └── ResizeHandle.tsx             # Drag to resize
lib/
└── docs/
    ├── store/
    │   └── chat-slice.ts               # Chat Zustand slice
    └── agents/
        ├── doc-agent.ts                 # Document agent definition
        └── doc-tools.ts                 # Document tool definitions
app/
└── api/
    └── docs/
        └── [docId]/
            └── chat/
                └── route.ts             # Chat API endpoint
```

---

## Implementation Details

### 1. Chat Sidebar Component

**File:** `components/docs/chat/index.ts`

```ts
export { ChatSidebar } from "./ChatSidebar";
export { ChatHeader } from "./ChatHeader";
export { ChatMessages } from "./ChatMessages";
export { ChatMessage } from "./ChatMessage";
export { ChatInput } from "./ChatInput";
export { ToolCallDisplay } from "./ToolCallDisplay";
export { ResizeHandle } from "./ResizeHandle";
```

**File:** `components/docs/chat/ChatSidebar.tsx`

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ResizeHandle } from "./ResizeHandle";
import { useChatStore } from "@/lib/docs/store/chat-slice";
import { useEditorStore } from "@/lib/docs/store/editor-slice";
import { cn } from "@/lib/utils";

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

export function ChatSidebar() {
  const { isOpen, messages, isLoading, sendMessage, clearHistory } = useChatStore();
  const { document, content } = useEditorStore();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((delta: number) => {
    setWidth((prev) => {
      const newWidth = prev - delta;
      return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    });
  }, []);

  const handleSend = useCallback(
    async (message: string) => {
      if (!document) return;

      await sendMessage({
        message,
        documentId: document.id,
        documentContent: content,
        documentTitle: document.frontmatter.title,
      });
    },
    [document, content, sendMessage]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Resize Handle */}
      <ResizeHandle onResize={handleResize} />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="flex flex-col h-full border-l bg-background"
        style={{ width: `${width}px` }}
      >
        <ChatHeader onClearHistory={clearHistory} />

        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatMessages messages={messages} isLoading={isLoading} />
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
}
```

**File:** `components/docs/chat/ChatHeader.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/lib/docs/store/chat-slice";
import { X, MoreHorizontal, Trash2, Download } from "lucide-react";

interface ChatHeaderProps {
  onClearHistory: () => void;
}

export function ChatHeader({ onClearHistory }: ChatHeaderProps) {
  const { setIsOpen } = useChatStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <h3 className="font-semibold">Document Chat</h3>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear history
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**File:** `components/docs/chat/ResizeHandle.tsx`

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onResize: (delta: number) => void;
}

export function ResizeHandle({ onResize }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [onResize]);

  return (
    <div
      className={cn(
        "w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors",
        isDragging && "bg-blue-500"
      )}
      onMouseDown={handleMouseDown}
    />
  );
}
```

---

### 2. Chat Messages Component

**File:** `components/docs/chat/ChatMessages.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/lib/docs/store/chat-slice";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">
            Ask the assistant to help you edit or improve your document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  );
}
```

**File:** `components/docs/chat/ChatMessage.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ToolCallDisplay } from "./ToolCallDisplay";
import type { Message } from "@/lib/docs/store/chat-slice";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.timestamp]);

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-100 dark:bg-blue-900" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-lg px-4 py-2 max-w-[85%]",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((toolCall, index) => (
              <ToolCallDisplay key={index} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">{formattedTime}</p>
      </div>
    </div>
  );
}
```

**File:** `components/docs/chat/ToolCallDisplay.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Check, X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/lib/docs/store/chat-slice";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusIcon = {
    pending: <Wrench className="h-3 w-3 animate-spin" />,
    success: <Check className="h-3 w-3 text-green-500" />,
    error: <X className="h-3 w-3 text-red-500" />,
  }[toolCall.status];

  const toolLabels: Record<string, string> = {
    sys_doc_read: "Reading document",
    sys_doc_insert: "Inserting content",
    sys_doc_replace: "Replacing content",
    sys_doc_append: "Appending content",
    sys_doc_delete: "Deleting content",
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs gap-1.5 font-normal",
            toolCall.status === "error" && "text-red-500"
          )}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {statusIcon}
          <span>{toolLabels[toolCall.name] || toolCall.name}</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="rounded-md bg-muted/50 p-3 text-xs font-mono">
          <div className="mb-2">
            <span className="font-semibold">Input:</span>
            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {toolCall.result && (
            <div>
              <span className="font-semibold">
                {toolCall.status === "error" ? "Error:" : "Result:"}
              </span>
              <pre
                className={cn(
                  "mt-1 whitespace-pre-wrap",
                  toolCall.status === "error"
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              >
                {typeof toolCall.result === "string"
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### 3. Chat Input Component

**File:** `components/docs/chat/ChatInput.tsx`

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
}

export function ChatInput({ onSend, isLoading, onCancel }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setValue("");
    await onSend(trimmed);

    // Refocus textarea
    textareaRef.current?.focus();
  }, [value, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="p-4 border-t">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your document..."
          className="min-h-[80px] pr-12 resize-none"
          disabled={isLoading}
        />

        <div className="absolute bottom-2 right-2">
          {isLoading ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCancel}
            >
              <StopCircle className="h-4 w-4 text-red-500" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSubmit}
              disabled={!value.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
```

---

### 4. Chat Store Slice

**File:** `lib/docs/store/chat-slice.ts`

```ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "success" | "error";
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ChatState {
  // UI state
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  // Messages
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (params: {
    message: string;
    documentId: string;
    documentContent: string;
    documentTitle: string;
  }) => Promise<void>;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateLastMessage: (updates: Partial<Message>) => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  messages: [] as Message[],
  isLoading: false,
  error: null as string | null,
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setIsOpen: (isOpen) => set({ isOpen }),

        addMessage: (message) =>
          set((state) => ({
            messages: [
              ...state.messages,
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          })),

        updateLastMessage: (updates) =>
          set((state) => {
            const messages = [...state.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex >= 0) {
              messages[lastIndex] = { ...messages[lastIndex], ...updates };
            }
            return { messages };
          }),

        sendMessage: async ({ message, documentId, documentContent, documentTitle }) => {
          const { addMessage, updateLastMessage } = get();

          // Add user message
          addMessage({ role: "user", content: message });

          // Set loading
          set({ isLoading: true, error: null });

          // Add placeholder for assistant message
          addMessage({ role: "assistant", content: "", toolCalls: [] });

          try {
            const response = await fetch(`/api/docs/${documentId}/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message,
                documentContent,
                documentTitle,
                history: get().messages.slice(0, -1), // Exclude placeholder
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to send message");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let content = "";
            let toolCalls: ToolCall[] = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

              for (const line of lines) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "text") {
                    content += parsed.content;
                    updateLastMessage({ content });
                  } else if (parsed.type === "tool_call_start") {
                    toolCalls.push({
                      name: parsed.name,
                      args: parsed.args,
                      status: "pending",
                    });
                    updateLastMessage({ toolCalls: [...toolCalls] });
                  } else if (parsed.type === "tool_call_end") {
                    const lastTool = toolCalls[toolCalls.length - 1];
                    if (lastTool) {
                      lastTool.result = parsed.result;
                      lastTool.status = parsed.error ? "error" : "success";
                      updateLastMessage({ toolCalls: [...toolCalls] });
                    }
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          } catch (error) {
            console.error("Chat error:", error);
            set({ error: error instanceof Error ? error.message : "Unknown error" });
            updateLastMessage({
              content: "Sorry, something went wrong. Please try again.",
            });
          } finally {
            set({ isLoading: false });
          }
        },

        clearHistory: () => set({ messages: [] }),

        reset: () => set(initialState),
      }),
      {
        name: "doc-chat-store",
        partialize: (state) => ({
          messages: state.messages,
          isOpen: state.isOpen,
        }),
      }
    ),
    { name: "chat-store" }
  )
);
```

---

### 5. Document Agent Tools

**File:** `lib/docs/agents/doc-tools.ts`

```ts
import { z } from "zod";
import { tool } from "ai";

/**
 * Document tools for AI agent to read and modify documents
 */
export function createDocumentTools(
  documentContent: string,
  onContentUpdate: (newContent: string) => void
) {
  let currentContent = documentContent;

  return {
    sys_doc_read: tool({
      description: "Read the current document content",
      parameters: z.object({
        section: z
          .string()
          .optional()
          .describe("Optional heading to read specific section"),
      }),
      execute: async ({ section }) => {
        if (section) {
          // Find section by heading
          const lines = currentContent.split("\n");
          const startIndex = lines.findIndex((line) =>
            line.toLowerCase().includes(section.toLowerCase())
          );

          if (startIndex === -1) {
            return { error: `Section "${section}" not found` };
          }

          // Find end of section (next heading of same or higher level)
          const headingMatch = lines[startIndex].match(/^(#+)/);
          const headingLevel = headingMatch ? headingMatch[1].length : 1;

          let endIndex = lines.length;
          for (let i = startIndex + 1; i < lines.length; i++) {
            const match = lines[i].match(/^(#+)/);
            if (match && match[1].length <= headingLevel) {
              endIndex = i;
              break;
            }
          }

          return {
            content: lines.slice(startIndex, endIndex).join("\n"),
          };
        }

        return { content: currentContent };
      },
    }),

    sys_doc_insert: tool({
      description: "Insert content at a specific position in the document",
      parameters: z.object({
        position: z
          .enum(["start", "end", "after_heading"])
          .describe("Where to insert the content"),
        heading: z
          .string()
          .optional()
          .describe("Heading to insert after (when position is after_heading)"),
        content: z.string().describe("Content to insert"),
      }),
      execute: async ({ position, heading, content }) => {
        const lines = currentContent.split("\n");

        switch (position) {
          case "start":
            currentContent = content + "\n\n" + currentContent;
            break;

          case "end":
            currentContent = currentContent + "\n\n" + content;
            break;

          case "after_heading":
            if (!heading) {
              return { error: "heading is required when position is after_heading" };
            }

            const headingIndex = lines.findIndex((line) =>
              line.toLowerCase().includes(heading.toLowerCase())
            );

            if (headingIndex === -1) {
              return { error: `Heading "${heading}" not found` };
            }

            lines.splice(headingIndex + 1, 0, "", content);
            currentContent = lines.join("\n");
            break;
        }

        onContentUpdate(currentContent);
        return { success: true, position };
      },
    }),

    sys_doc_replace: tool({
      description: "Replace text or a section in the document",
      parameters: z.object({
        search: z.string().describe("Text or heading to find"),
        replace: z.string().describe("Replacement content"),
        replaceSection: z
          .boolean()
          .optional()
          .describe("If true, replace entire section under the heading"),
      }),
      execute: async ({ search, replace, replaceSection }) => {
        if (replaceSection) {
          // Replace entire section
          const lines = currentContent.split("\n");
          const startIndex = lines.findIndex((line) =>
            line.toLowerCase().includes(search.toLowerCase())
          );

          if (startIndex === -1) {
            return { error: `Section "${search}" not found` };
          }

          const headingMatch = lines[startIndex].match(/^(#+)/);
          const headingLevel = headingMatch ? headingMatch[1].length : 1;

          let endIndex = lines.length;
          for (let i = startIndex + 1; i < lines.length; i++) {
            const match = lines[i].match(/^(#+)/);
            if (match && match[1].length <= headingLevel) {
              endIndex = i;
              break;
            }
          }

          const heading = lines[startIndex];
          lines.splice(startIndex, endIndex - startIndex, heading, "", replace);
          currentContent = lines.join("\n");
        } else {
          // Simple text replacement
          if (!currentContent.includes(search)) {
            return { error: `Text "${search}" not found` };
          }

          currentContent = currentContent.replace(search, replace);
        }

        onContentUpdate(currentContent);
        return { success: true };
      },
    }),

    sys_doc_append: tool({
      description: "Append content to a specific section or the end of document",
      parameters: z.object({
        heading: z
          .string()
          .optional()
          .describe("Heading of section to append to (appends to end if not provided)"),
        content: z.string().describe("Content to append"),
      }),
      execute: async ({ heading, content }) => {
        if (!heading) {
          currentContent = currentContent + "\n\n" + content;
          onContentUpdate(currentContent);
          return { success: true, location: "end" };
        }

        const lines = currentContent.split("\n");
        const startIndex = lines.findIndex((line) =>
          line.toLowerCase().includes(heading.toLowerCase())
        );

        if (startIndex === -1) {
          return { error: `Section "${heading}" not found` };
        }

        // Find end of section
        const headingMatch = lines[startIndex].match(/^(#+)/);
        const headingLevel = headingMatch ? headingMatch[1].length : 1;

        let endIndex = lines.length;
        for (let i = startIndex + 1; i < lines.length; i++) {
          const match = lines[i].match(/^(#+)/);
          if (match && match[1].length <= headingLevel) {
            endIndex = i;
            break;
          }
        }

        lines.splice(endIndex, 0, content, "");
        currentContent = lines.join("\n");

        onContentUpdate(currentContent);
        return { success: true, location: `after ${heading}` };
      },
    }),

    sys_doc_delete: tool({
      description: "Delete a section from the document",
      parameters: z.object({
        heading: z.string().describe("Heading of section to delete"),
        keepHeading: z
          .boolean()
          .optional()
          .describe("If true, keep the heading but delete content"),
      }),
      execute: async ({ heading, keepHeading }) => {
        const lines = currentContent.split("\n");
        const startIndex = lines.findIndex((line) =>
          line.toLowerCase().includes(heading.toLowerCase())
        );

        if (startIndex === -1) {
          return { error: `Section "${heading}" not found` };
        }

        const headingMatch = lines[startIndex].match(/^(#+)/);
        const headingLevel = headingMatch ? headingMatch[1].length : 1;

        let endIndex = lines.length;
        for (let i = startIndex + 1; i < lines.length; i++) {
          const match = lines[i].match(/^(#+)/);
          if (match && match[1].length <= headingLevel) {
            endIndex = i;
            break;
          }
        }

        if (keepHeading) {
          lines.splice(startIndex + 1, endIndex - startIndex - 1);
        } else {
          lines.splice(startIndex, endIndex - startIndex);
        }

        currentContent = lines.join("\n");
        onContentUpdate(currentContent);
        return { success: true, deleted: heading };
      },
    }),
  };
}

export type DocumentTools = ReturnType<typeof createDocumentTools>;
```

---

### 6. Document Agent Definition

**File:** `lib/docs/agents/doc-agent.ts`

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { CoreMessage } from "ai";
import { createDocumentTools, DocumentTools } from "./doc-tools";

export interface DocAgentConfig {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  onContentUpdate: (newContent: string) => void;
}

export function createDocAgent(config: DocAgentConfig) {
  const { documentTitle, documentContent, onContentUpdate } = config;

  const tools = createDocumentTools(documentContent, onContentUpdate);

  const systemPrompt = `You are a helpful document assistant for a document titled "${documentTitle}".

Your capabilities:
- Read the document content using sys_doc_read
- Insert new content using sys_doc_insert
- Replace existing content using sys_doc_replace
- Append to sections using sys_doc_append
- Delete sections using sys_doc_delete

Guidelines:
1. Always read the relevant section before making changes
2. Preserve existing formatting and structure
3. Be precise with your edits - don't make unnecessary changes
4. Explain what changes you're making
5. If unsure, ask the user for clarification

Current document structure:
${extractOutline(documentContent)}`;

  return {
    systemPrompt,
    tools,
    model: anthropic("claude-sonnet-4-20250514"),
  };
}

function extractOutline(content: string): string {
  const lines = content.split("\n");
  const headings = lines
    .filter((line) => line.startsWith("#"))
    .map((line) => {
      const match = line.match(/^(#+)\s+(.+)/);
      if (!match) return null;
      const level = match[1].length;
      const text = match[2];
      const indent = "  ".repeat(level - 1);
      return `${indent}- ${text}`;
    })
    .filter(Boolean);

  return headings.length > 0 ? headings.join("\n") : "No headings found";
}
```

---

### 7. Chat API Route

**File:** `app/api/docs/[docId]/chat/route.ts`

```ts
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createDocumentTools } from "@/lib/docs/agents/doc-tools";
import { updateDocument } from "../../services";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { docId } = await context.params;

  try {
    const body = await request.json();
    const { message, documentContent, documentTitle, history } = body;

    let currentContent = documentContent;

    // Create tools with content update callback
    const tools = createDocumentTools(documentContent, async (newContent) => {
      currentContent = newContent;
      // Persist to file system
      await updateDocument(docId, { content: newContent });
    });

    // Build system prompt
    const systemPrompt = `You are a helpful document assistant for a document titled "${documentTitle}".

Your capabilities:
- Read the document content using sys_doc_read
- Insert new content using sys_doc_insert
- Replace existing content using sys_doc_replace
- Append to sections using sys_doc_append
- Delete sections using sys_doc_delete

Guidelines:
1. Always read the relevant section before making changes
2. Preserve existing formatting and structure
3. Be precise with your edits - don't make unnecessary changes
4. Explain what changes you're making
5. If unsure, ask the user for clarification

The user can see the document being edited in real-time, so you don't need to show them the full content unless they ask.`;

    // Build messages from history
    const messages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Create streaming response
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10, // Allow multiple tool calls
    });

    // Convert to SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            let data: string | null = null;

            switch (part.type) {
              case "text-delta":
                data = JSON.stringify({
                  type: "text",
                  content: part.textDelta,
                });
                break;

              case "tool-call":
                data = JSON.stringify({
                  type: "tool_call_start",
                  name: part.toolName,
                  args: part.args,
                });
                break;

              case "tool-result":
                data = JSON.stringify({
                  type: "tool_call_end",
                  result: part.result,
                  error: null,
                });
                break;

              case "error":
                data = JSON.stringify({
                  type: "error",
                  error: String(part.error),
                });
                break;
            }

            if (data) {
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat message" }),
      { status: 500 }
    );
  }
}
```

---

### 8. Update Document Editor to Include Chat

**File:** `components/docs/editor/DocumentEditor.tsx` (Updated)

```tsx
"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatToggle } from "./ChatToggle";
import { useEditorStore } from "@/lib/docs/store/editor-slice";
import { useChatStore } from "@/lib/docs/store/chat-slice";
import type { Document } from "@/app/api/docs/services/types";

interface DocumentEditorProps {
  document: Document;
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const { setDocument, setContent, reset } = useEditorStore();
  const { isOpen: isChatOpen, reset: resetChat } = useChatStore();

  // Initialize store with document data
  useEffect(() => {
    setDocument(document);
    setContent(document.content);

    // Cleanup on unmount
    return () => {
      reset();
      resetChat();
    };
  }, [document, setDocument, setContent, reset, resetChat]);

  return (
    <div className="h-full flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with title and save indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DocumentHeader />
          <div className="flex items-center gap-4">
            <SaveIndicator />
            <ChatToggle />
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-hidden">
          <EditorContainer initialContent={document.content} />
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && <ChatSidebar />}
    </div>
  );
}
```

**File:** `components/docs/editor/ChatToggle.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/lib/docs/store/chat-slice";
import { cn } from "@/lib/utils";

export function ChatToggle() {
  const { isOpen, setIsOpen, messages } = useChatStore();
  const hasMessages = messages.length > 0;

  return (
    <Button
      variant={isOpen ? "secondary" : "ghost"}
      size="sm"
      onClick={() => setIsOpen(!isOpen)}
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="hidden sm:inline">Chat</span>
      {hasMessages && !isOpen && (
        <span className="w-2 h-2 rounded-full bg-blue-500" />
      )}
    </Button>
  );
}
```

---

### 9. Sync Editor with Agent Changes

**File:** `components/docs/editor/plugins/AgentSyncPlugin.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useChatStore } from "@/lib/docs/store/chat-slice";
import { useEditorStore } from "@/lib/docs/store/editor-slice";

export function AgentSyncPlugin() {
  const [editor] = useLexicalComposerContext();
  const { messages } = useChatStore();
  const { content, setContent } = useEditorStore();
  const lastSyncedContentRef = useRef(content);

  // Listen for content updates from agent tool calls
  useEffect(() => {
    // Check if content changed externally (from agent)
    if (content !== lastSyncedContentRef.current) {
      // Update editor with new content
      editor.update(() => {
        $convertFromMarkdownString(content, TRANSFORMERS);
      });

      lastSyncedContentRef.current = content;
    }
  }, [content, editor]);

  return null;
}
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Chat Sidebar**
   - Open a document
   - Click Chat button in header
   - Verify sidebar slides in from right
   - Test resize by dragging edge
   - Click X to close sidebar

2. **Test Message Sending**
   - Type a message and press Enter
   - Verify message appears in chat
   - Verify loading state shows while waiting
   - Verify assistant response streams in

3. **Test Document Context**
   - Ask "What is this document about?"
   - Verify agent knows the document content
   - Ask to summarize a specific section

4. **Test Agent Tools**
   - Ask agent to "Add a new section about X"
   - Verify tool call shows in chat
   - Verify document updates in editor
   - Ask agent to "Replace the introduction with..."
   - Verify replacement happens

5. **Test Chat Persistence**
   - Send some messages
   - Navigate away and back
   - Verify messages are still there
   - Click "Clear history"
   - Verify messages are removed

6. **Test Streaming**
   - Ask a question that requires long response
   - Verify text streams word-by-word
   - Verify tool calls show as expandable

---

## Dependencies

### New npm Packages
```bash
npm install react-markdown
```

### AI SDK Already Installed
- `ai` - Vercel AI SDK
- `@ai-sdk/anthropic` - Anthropic provider

---

## Next Phase

**Phase 6: Outline & Properties** will add:
- Document outline sidebar
- Jump-to-heading navigation
- Document properties panel
- Tags and metadata editing

---

## Notes

- Chat history is persisted in localStorage via Zustand persist
- Agent tools operate on Markdown content directly
- Content updates from agent trigger editor re-render via AgentSyncPlugin
- Streaming uses SSE (Server-Sent Events) for real-time updates
- Tool calls are expandable to show input/output for transparency
