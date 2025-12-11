# Phase 2: Editor Core

**Phase:** 2 of 8
**Estimated LOC:** ~1,200
**Prerequisites:** Phase 1 (Foundation & Navigation)
**Focus:** Basic Lexical editor setup, Markdown import/export, auto-save

---

## Overview

This phase establishes the core document editing experience using Lexical. Users will be able to:

1. Open a document and see its Markdown content rendered in Lexical
2. Edit content with basic rich-text capabilities
3. Have changes auto-saved with visual feedback
4. Navigate between documents seamlessly

---

## Acceptance Criteria

### AC-2.1: Lexical Editor Initialization
- [ ] Editor mounts without errors on document page
- [ ] Editor is focused automatically when document loads
- [ ] Editor respects system color scheme (light/dark mode)
- [ ] Editor theme matches ShadCN design tokens

### AC-2.2: Markdown Import
- [ ] Document content is loaded from file system
- [ ] YAML frontmatter is parsed and stored separately
- [ ] Markdown is converted to Lexical editor state
- [ ] All GFM elements render correctly:
  - [ ] Headings (H1-H6)
  - [ ] Bold, italic, strikethrough
  - [ ] Inline code and code blocks
  - [ ] Ordered and unordered lists
  - [ ] Blockquotes
  - [ ] Links
  - [ ] Horizontal rules

### AC-2.3: Markdown Export
- [ ] Editor state can be serialized to Markdown
- [ ] Exported Markdown is valid GFM
- [ ] Round-trip (import → edit → export) preserves formatting
- [ ] Frontmatter is preserved when saving

### AC-2.4: Auto-Save System
- [ ] Changes trigger debounced save (1500ms delay)
- [ ] Save indicator shows "Saving..." during save
- [ ] Save indicator shows "Saved" with timestamp after success
- [ ] Save indicator shows "Error" with retry option on failure
- [ ] Dirty state tracked accurately

### AC-2.5: Editor Store Integration
- [ ] Zustand store manages editor state
- [ ] Document content syncs between store and editor
- [ ] Multiple tabs/components can read editor state
- [ ] Store persists selection and cursor position

### AC-2.6: Document Page Layout
- [ ] Document page renders at `/docs/[docId]`
- [ ] Header shows document title (from frontmatter)
- [ ] Editor fills available vertical space
- [ ] Responsive layout works on all screen sizes

### AC-2.7: Error Handling
- [ ] 404 page shown for non-existent documents
- [ ] Parse errors display user-friendly message
- [ ] Network errors handled gracefully
- [ ] Recovery options provided for all error states

---

## File Structure

```
app/
├── (pages)/
│   └── docs/
│       ├── [docId]/
│       │   ├── page.tsx                 # Document editor page
│       │   └── loading.tsx              # Loading skeleton
│       ├── components/
│       │   └── editor/
│       │       ├── index.ts             # Barrel export
│       │       ├── DocumentEditor.tsx   # Main editor wrapper
│       │       ├── EditorContainer.tsx  # Lexical provider setup
│       │       ├── EditorContent.tsx    # The actual editable area
│       │       ├── SaveIndicator.tsx    # Auto-save status display
│       │       ├── DocumentHeader.tsx   # Title and metadata
│       │       ├── plugins/
│       │       │   ├── index.ts         # Plugin barrel export
│       │       │   ├── AutoSavePlugin.tsx
│       │       │   ├── MarkdownPlugin.tsx
│       │       │   └── OnChangePlugin.tsx
│       │       ├── nodes/
│       │       │   └── index.ts         # Custom node registrations
│       │       └── themes/
│       │           ├── index.ts
│       │           └── editorTheme.ts
│       └── store/
│           ├── index.ts                 # Store composition
│           ├── types.ts                 # Store types
│           └── slices/
│               ├── catalogSlice.ts      # From Phase 1
│               └── editorSlice.ts       # Editor state slice
```

---

## Implementation Details

### 1. Document Editor Page

**File:** `app/(pages)/docs/[docId]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { DocumentEditor } from "../components/editor";
import { getDocument } from "@/app/api/docs/services";

interface DocumentPageProps {
  params: Promise<{ docId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { docId } = await params;

  try {
    const document = await getDocument(docId);

    if (!document) {
      notFound();
    }

    return (
      <div className="h-full flex flex-col">
        <DocumentEditor document={document} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
```

**File:** `app/(pages)/docs/[docId]/loading.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentLoading() {
  return (
    <div className="h-full flex flex-col p-6">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Editor skeleton */}
      <div className="flex-1 space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}
```

---

### 2. Main Editor Components

**File:** `app/(pages)/docs/components/editor/index.ts`

```ts
export { DocumentEditor } from "./DocumentEditor";
export { EditorContainer } from "./EditorContainer";
export { EditorContent } from "./EditorContent";
export { SaveIndicator } from "./SaveIndicator";
export { DocumentHeader } from "./DocumentHeader";
```

**File:** `app/(pages)/docs/components/editor/DocumentEditor.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { useDocsStore } from "../../store";
import type { Document } from "@/app/api/docs/services/types";

interface DocumentEditorProps {
  document: Document;
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const { setDocument, setContent, reset } = useEditorStore();

  // Initialize store with document data
  useEffect(() => {
    setDocument(document);
    setContent(document.content);

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [document, setDocument, setContent, reset]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with title and save indicator */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <DocumentHeader />
        <SaveIndicator />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <EditorContainer initialContent={document.content} />
      </div>
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/editor/DocumentHeader.tsx`

```tsx
"use client";

import { useDocsStore } from "../../store";
import { FileText } from "lucide-react";

export function DocumentHeader() {
  const { document } = useEditorStore();

  if (!document) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">{document.frontmatter.title}</h1>
        <p className="text-sm text-muted-foreground">
          Last edited {new Date(document.frontmatter.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/editor/SaveIndicator.tsx`

```tsx
"use client";

import { useDocsStore } from "../../store";
import { Check, AlertCircle, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SaveIndicator() {
  const { saveStatus, lastSavedAt, isDirty, save } = useEditorStore();

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );

      case "saved":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">
              Saved {lastSavedAt ? formatTime(lastSavedAt) : ""}
            </span>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Save failed</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={save}
              className="h-6 px-2 text-xs"
            >
              Retry
            </Button>
          </div>
        );

      case "idle":
      default:
        return (
          <div className={cn(
            "flex items-center gap-2",
            isDirty ? "text-amber-600" : "text-muted-foreground"
          )}>
            <Cloud className="h-4 w-4" />
            <span className="text-sm">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center">
      {getStatusDisplay()}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "just now";
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
```

---

### 3. Lexical Editor Setup

**File:** `app/(pages)/docs/components/editor/EditorContainer.tsx`

```tsx
"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { editorTheme } from "./themes/editorTheme";
import { editorNodes } from "./nodes";
import { EditorContent } from "./EditorContent";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { MarkdownPlugin } from "./plugins/MarkdownPlugin";
import { OnChangePlugin } from "./plugins/OnChangePlugin";

interface EditorContainerProps {
  initialContent: string;
}

export function EditorContainer({ initialContent }: EditorContainerProps) {
  const initialConfig = {
    namespace: "AgipoDocs",
    theme: editorTheme,
    nodes: editorNodes,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto">
          <RichTextPlugin
            contentEditable={<EditorContent />}
            placeholder={<EditorPlaceholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Plugins */}
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownPlugin initialContent={initialContent} />
        <OnChangePlugin />
        <AutoSavePlugin debounceMs={1500} />
      </div>
    </LexicalComposer>
  );
}

function EditorPlaceholder() {
  return (
    <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground px-16 py-12">
      Start writing, or press / for commands...
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/editor/EditorContent.tsx`

```tsx
"use client";

import { ContentEditable } from "@lexical/react/LexicalContentEditable";

export function EditorContent() {
  return (
    <ContentEditable
      className="outline-none min-h-full px-16 py-12 prose prose-slate dark:prose-invert max-w-none"
      aria-label="Document editor"
    />
  );
}
```

---

### 4. Lexical Theme

**File:** `app/(pages)/docs/components/editor/themes/index.ts`

```ts
export { editorTheme } from "./editorTheme";
```

**File:** `app/(pages)/docs/components/editor/themes/editorTheme.ts`

```ts
import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  // Root
  root: "relative",

  // Text formatting
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400",
  },

  // Headings
  heading: {
    h1: "text-4xl font-bold mt-8 mb-4",
    h2: "text-3xl font-semibold mt-6 mb-3",
    h3: "text-2xl font-semibold mt-5 mb-2",
    h4: "text-xl font-semibold mt-4 mb-2",
    h5: "text-lg font-semibold mt-3 mb-1",
    h6: "text-base font-semibold mt-3 mb-1",
  },

  // Paragraphs
  paragraph: "mb-4 leading-relaxed",

  // Lists
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-6 mb-4",
    ul: "list-disc ml-6 mb-4",
    listitem: "mb-1",
    listitemChecked: "line-through text-muted-foreground",
    listitemUnchecked: "",
  },

  // Quotes
  quote: "border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4",

  // Code
  code: "block bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto my-4",
  codeHighlight: {
    atrule: "text-purple-600 dark:text-purple-400",
    attr: "text-yellow-600 dark:text-yellow-400",
    boolean: "text-red-600 dark:text-red-400",
    builtin: "text-cyan-600 dark:text-cyan-400",
    cdata: "text-gray-600 dark:text-gray-400",
    char: "text-green-600 dark:text-green-400",
    class: "text-yellow-600 dark:text-yellow-400",
    "class-name": "text-yellow-600 dark:text-yellow-400",
    comment: "text-gray-500 italic",
    constant: "text-red-600 dark:text-red-400",
    deleted: "text-red-600 dark:text-red-400",
    doctype: "text-gray-600 dark:text-gray-400",
    entity: "text-red-600 dark:text-red-400",
    function: "text-blue-600 dark:text-blue-400",
    important: "text-red-600 dark:text-red-400 font-bold",
    inserted: "text-green-600 dark:text-green-400",
    keyword: "text-purple-600 dark:text-purple-400",
    namespace: "text-gray-600 dark:text-gray-400",
    number: "text-orange-600 dark:text-orange-400",
    operator: "text-gray-600 dark:text-gray-400",
    prolog: "text-gray-600 dark:text-gray-400",
    property: "text-blue-600 dark:text-blue-400",
    punctuation: "text-gray-600 dark:text-gray-400",
    regex: "text-red-600 dark:text-red-400",
    selector: "text-green-600 dark:text-green-400",
    string: "text-green-600 dark:text-green-400",
    symbol: "text-red-600 dark:text-red-400",
    tag: "text-red-600 dark:text-red-400",
    url: "text-cyan-600 dark:text-cyan-400",
    variable: "text-orange-600 dark:text-orange-400",
  },

  // Links
  link: "text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer",

  // Horizontal rule
  hr: "border-t border-border my-8",

  // Images
  image: "max-w-full rounded-lg my-4",

  // Tables (for future use)
  table: "border-collapse w-full my-4",
  tableCell: "border border-border px-4 py-2",
  tableCellHeader: "border border-border px-4 py-2 bg-muted font-semibold",
  tableRow: "",
};
```

---

### 5. Node Registration

**File:** `app/(pages)/docs/components/editor/nodes/index.ts`

```ts
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import type { Klass, LexicalNode } from "lexical";

export const editorNodes: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
];
```

---

### 6. Editor Plugins

**File:** `app/(pages)/docs/components/editor/plugins/index.ts`

```ts
export { AutoSavePlugin } from "./AutoSavePlugin";
export { MarkdownPlugin } from "./MarkdownPlugin";
export { OnChangePlugin } from "./OnChangePlugin";
```

**File:** `app/(pages)/docs/components/editor/plugins/MarkdownPlugin.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $getRoot } from "lexical";

interface MarkdownPluginProps {
  initialContent: string;
}

export function MarkdownPlugin({ initialContent }: MarkdownPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Import initial Markdown content
  useEffect(() => {
    if (!initialContent) return;

    editor.update(() => {
      $convertFromMarkdownString(initialContent, TRANSFORMERS);
    });
  }, [editor, initialContent]);

  return null;
}

/**
 * Export editor content as Markdown
 * Call this from outside the component when saving
 */
export function exportToMarkdown(editor: ReturnType<typeof useLexicalComposerContext>[0]): string {
  let markdown = "";

  editor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(TRANSFORMERS);
  });

  return markdown;
}
```

**File:** `app/(pages)/docs/components/editor/plugins/OnChangePlugin.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useDocsStore } from "../../store";

export function OnChangePlugin() {
  const [editor] = useLexicalComposerContext();
  const { setContent, setIsDirty, setEditor } = useEditorStore();

  // Store editor reference
  useEffect(() => {
    setEditor(editor);

    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  // Listen for content changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      // Skip if no actual changes
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }

      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        setContent(markdown);
        setIsDirty(true);
      });
    });
  }, [editor, setContent, setIsDirty]);

  return null;
}
```

**File:** `app/(pages)/docs/components/editor/plugins/AutoSavePlugin.tsx`

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useDocsStore } from "../../store";

interface AutoSavePluginProps {
  debounceMs?: number;
}

export function AutoSavePlugin({ debounceMs = 1500 }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const { document, isDirty, setSaveStatus, setLastSavedAt, setIsDirty } = useEditorStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const saveDocument = useCallback(async () => {
    if (!document || !isDirty) return;

    setSaveStatus("saving");

    try {
      let content = "";
      editor.getEditorState().read(() => {
        content = $convertToMarkdownString(TRANSFORMERS);
      });

      const response = await fetch(`/api/docs/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus("saved");
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("error");
    }
  }, [document, isDirty, editor, setSaveStatus, setLastSavedAt, setIsDirty]);

  // Debounced auto-save on content changes
  useEffect(() => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveDocument();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, debounceMs, saveDocument]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty) {
        // Sync save on unmount
        saveDocument();
      }
    };
  }, [isDirty, saveDocument]);

  return null;
}
```

---

### 7. Editor Store Slice

**File:** `app/(pages)/docs/store/slices/editorSlice.ts`

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { LexicalEditor } from "lexical";
import type { Document } from "@/app/api/docs/services/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
  // Document data
  document: Document | null;
  content: string;

  // Editor instance
  editor: LexicalEditor | null;

  // Save state
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;

  // Actions
  setDocument: (document: Document) => void;
  setContent: (content: string) => void;
  setEditor: (editor: LexicalEditor | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (date: Date) => void;
  save: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  document: null,
  content: "",
  editor: null,
  isDirty: false,
  saveStatus: "idle" as SaveStatus,
  lastSavedAt: null,
};

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDocument: (document) => set({ document }),

      setContent: (content) => set({ content }),

      setEditor: (editor) => set({ editor }),

      setIsDirty: (isDirty) => set({ isDirty }),

      setSaveStatus: (saveStatus) => set({ saveStatus }),

      setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),

      save: async () => {
        const { document, content, isDirty } = get();

        if (!document || !isDirty) return;

        set({ saveStatus: "saving" });

        try {
          const response = await fetch(`/api/docs/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });

          if (!response.ok) {
            throw new Error("Failed to save");
          }

          set({
            saveStatus: "saved",
            lastSavedAt: new Date(),
            isDirty: false,
          });
        } catch (error) {
          console.error("Save failed:", error);
          set({ saveStatus: "error" });
        }
      },

      reset: () => set(initialState),
    }),
    { name: "editor-store" }
  )
);
```

---

### 8. API Route Updates

**File:** `app/api/docs/[docId]/route.ts` (Update PATCH handler)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, deleteDocument } from "../services";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

// GET /api/docs/[docId] - Get single document
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH /api/docs/[docId] - Update document content
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const body = await request.json();

    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update content if provided
    if (body.content !== undefined) {
      await updateDocument(docId, { content: body.content });
    }

    // Update frontmatter fields if provided
    if (body.title || body.tags || body.description) {
      await updateDocument(docId, {
        frontmatter: {
          ...document.frontmatter,
          title: body.title ?? document.frontmatter.title,
          tags: body.tags ?? document.frontmatter.tags,
          description: body.description ?? document.frontmatter.description,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const updatedDocument = await getDocument(docId);

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/docs/[docId] - Delete document
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;

    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await deleteDocument(docId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
```

---

### 9. Document Service Updates

**File:** `app/api/docs/services/document-io.ts` (Add updateDocument)

```ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { Document, DocumentFrontmatter } from "./types";

const DOCS_DIR = path.join(process.cwd(), "_tables", "documents");

// ... (keep existing functions: getAllDocuments, getDocument, createDocument, deleteDocument)

/**
 * Update a document's content and/or frontmatter
 */
export async function updateDocument(
  docId: string,
  updates: {
    content?: string;
    frontmatter?: Partial<DocumentFrontmatter>;
  }
): Promise<Document | null> {
  const docPath = path.join(DOCS_DIR, docId, "content.md");

  try {
    // Read existing document
    const fileContent = await fs.readFile(docPath, "utf-8");
    const { data: existingFrontmatter, content: existingContent } = matter(fileContent);

    // Merge updates
    const newFrontmatter = {
      ...existingFrontmatter,
      ...updates.frontmatter,
      updatedAt: new Date().toISOString(),
    };

    const newContent = updates.content ?? existingContent;

    // Reconstruct file with frontmatter
    const newFileContent = matter.stringify(newContent, newFrontmatter);

    // Write back
    await fs.writeFile(docPath, newFileContent, "utf-8");

    // Return updated document
    return {
      id: docId,
      frontmatter: newFrontmatter as DocumentFrontmatter,
      content: newContent,
      path: docPath,
    };
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    return null;
  }
}
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Navigate to Document**
   ```bash
   # Create a test document first (if not exists)
   mkdir -p _tables/documents/test-doc-1
   cat > _tables/documents/test-doc-1/content.md << 'EOF'
   ---
   title: Test Document
   createdAt: 2025-12-10T10:00:00Z
   updatedAt: 2025-12-10T10:00:00Z
   tags: [test]
   ---

   # Hello World

   This is a **test document** with *italic* and `code`.

   ## Second Heading

   - List item 1
   - List item 2
   - List item 3

   > This is a blockquote

   ```javascript
   console.log("Hello!");
   ```
   EOF
   ```

2. **Test Editor Loading**
   - Visit `http://localhost:3000/docs/test-doc-1`
   - Verify Markdown renders correctly in editor
   - Check all formatting elements display properly

3. **Test Editing**
   - Click into editor and make changes
   - Verify "Unsaved changes" appears
   - Wait 1.5 seconds, verify "Saving..." then "Saved"
   - Refresh page, verify changes persisted

4. **Test Error Handling**
   - Visit `http://localhost:3000/docs/non-existent`
   - Verify 404 page appears

5. **Test Auto-Save Debounce**
   - Type continuously for 5 seconds
   - Verify save only triggers after you stop typing

---

## Dependencies

### New npm Packages Required

```bash
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text \
  @lexical/list @lexical/link @lexical/code @lexical/selection @lexical/history
```

### Existing Dependencies Used
- `gray-matter` - YAML frontmatter parsing
- `zustand` - State management
- `lucide-react` - Icons

---

## Next Phase

**Phase 3: Toolbar & Formatting** will add:
- Floating selection toolbar
- Bold/italic/strikethrough buttons
- Link insertion dialog
- Heading level selector
- Code formatting toggle

---

## Notes

- The editor theme uses Tailwind classes that match ShadCN design tokens
- Auto-save uses a debounce pattern to prevent excessive API calls
- The store separates concerns: document data vs. editor instance vs. save state
- Markdown transformers handle round-trip conversion automatically
