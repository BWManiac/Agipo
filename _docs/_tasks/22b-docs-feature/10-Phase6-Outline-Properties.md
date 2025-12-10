# Phase 6: Outline & Properties

**Phase:** 6 of 8
**Estimated LOC:** ~700
**Prerequisites:** Phase 5 (Chat Integration)
**Focus:** Document outline navigation, properties panel, metadata editing

---

## Overview

This phase adds organizational features to help users navigate and manage documents. Users will be able to:

1. View a document outline based on headings
2. Click to jump to any heading
3. View and edit document properties (title, tags, description)
4. See document metadata (created, modified, word count)

---

## Acceptance Criteria

### AC-6.1: Outline Sidebar
- [ ] Toggle button shows/hides outline panel
- [ ] Outline shows all headings (H1-H6)
- [ ] Headings indented by level
- [ ] Current heading highlighted as user scrolls
- [ ] Click heading to scroll editor to that section

### AC-6.2: Outline Extraction
- [ ] Outline updates in real-time as user edits
- [ ] Empty state when no headings present
- [ ] Heading text truncated if too long
- [ ] Nested structure shows hierarchy

### AC-6.3: Properties Panel
- [ ] Properties button opens panel (right side or modal)
- [ ] Shows document title with edit capability
- [ ] Shows tags with add/remove capability
- [ ] Shows description field
- [ ] Shows read-only metadata (created, modified)

### AC-6.4: Document Statistics
- [ ] Word count displayed
- [ ] Character count displayed
- [ ] Reading time estimate
- [ ] Heading count

### AC-6.5: Tag Management
- [ ] Add tags by typing and pressing Enter
- [ ] Remove tags by clicking X
- [ ] Tags shown as badges
- [ ] Autocomplete from existing tags (future)

### AC-6.6: Title Editing
- [ ] Click to edit title inline
- [ ] Save on blur or Enter
- [ ] Escape to cancel
- [ ] Title updates document frontmatter

### AC-6.7: Accessibility
- [ ] Outline navigable by keyboard
- [ ] Screen reader announces current section
- [ ] Focus management on panel open/close

---

## File Structure

```
app/(pages)/docs/
├── components/
│   ├── outline/
│   │   ├── index.ts                    # Barrel export
│   │   ├── OutlineSidebar.tsx          # Outline panel container
│   │   ├── OutlineItem.tsx             # Individual heading item
│   │   └── OutlineEmpty.tsx            # Empty state
│   ├── properties/
│   │   ├── index.ts                    # Barrel export
│   │   ├── PropertiesPanel.tsx         # Properties panel container
│   │   ├── TitleEditor.tsx             # Editable title
│   │   ├── TagEditor.tsx               # Tag management
│   │   ├── DescriptionEditor.tsx       # Description field
│   │   └── DocumentStats.tsx           # Word count, etc.
│   └── editor/
│       └── utils/
│           └── useDocumentOutline.ts   # Extract headings from editor
└── store/
    └── slices/
        └── uiSlice.ts                  # UI state (panels, etc.)
```

---

## Implementation Details

### 1. UI Store Slice

**File:** `app/(pages)/docs/store/slices/uiSlice.ts`

```ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UIState {
  // Panel visibility
  isOutlineOpen: boolean;
  isPropertiesOpen: boolean;

  // Actions
  setOutlineOpen: (isOpen: boolean) => void;
  setPropertiesOpen: (isOpen: boolean) => void;
  toggleOutline: () => void;
  toggleProperties: () => void;
  reset: () => void;
}

const initialState = {
  isOutlineOpen: false,
  isPropertiesOpen: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setOutlineOpen: (isOutlineOpen) => set({ isOutlineOpen }),
        setPropertiesOpen: (isPropertiesOpen) => set({ isPropertiesOpen }),

        toggleOutline: () =>
          set((state) => ({ isOutlineOpen: !state.isOutlineOpen })),

        toggleProperties: () =>
          set((state) => ({ isPropertiesOpen: !state.isPropertiesOpen })),

        reset: () => set(initialState),
      }),
      {
        name: "doc-ui-store",
      }
    ),
    { name: "ui-store" }
  )
);
```

---

### 2. Document Outline Hook

**File:** `app/(pages)/docs/components/editor/utils/useDocumentOutline.ts`

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, LexicalNode } from "lexical";
import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";

export interface OutlineItem {
  key: string;
  text: string;
  level: number; // 1-6 for h1-h6
  element: HTMLElement | null;
}

export function useDocumentOutline() {
  const [editor] = useLexicalComposerContext();
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Extract headings from editor
  useEffect(() => {
    const updateOutline = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const headings: OutlineItem[] = [];

        const traverse = (node: LexicalNode) => {
          if ($isHeadingNode(node)) {
            const tag = node.getTag();
            const level = parseInt(tag.slice(1), 10);
            const text = node.getTextContent();
            const key = node.getKey();

            // Get DOM element for scrolling
            const element = editor.getElementByKey(key);

            headings.push({
              key,
              text: text || "Untitled",
              level,
              element,
            });
          }

          node.getChildren?.().forEach(traverse);
        };

        root.getChildren().forEach(traverse);
        setOutline(headings);
      });
    };

    // Initial extraction
    updateOutline();

    // Listen for changes
    return editor.registerUpdateListener(() => {
      updateOutline();
    });
  }, [editor]);

  // Track active heading based on scroll position
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const handleScroll = () => {
      const scrollTop = root.scrollTop;
      const viewportTop = scrollTop + 100; // Offset for header

      let currentKey: string | null = null;

      for (const item of outline) {
        if (item.element) {
          const offsetTop = item.element.offsetTop;
          if (offsetTop <= viewportTop) {
            currentKey = item.key;
          } else {
            break;
          }
        }
      }

      setActiveKey(currentKey);
    };

    root.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => root.removeEventListener("scroll", handleScroll);
  }, [editor, outline]);

  // Scroll to heading
  const scrollToHeading = useCallback(
    (key: string) => {
      const item = outline.find((h) => h.key === key);
      if (item?.element) {
        item.element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [outline]
  );

  return {
    outline,
    activeKey,
    scrollToHeading,
  };
}
```

---

### 3. Outline Sidebar Components

**File:** `app/(pages)/docs/components/outline/index.ts`

```ts
export { OutlineSidebar } from "./OutlineSidebar";
export { OutlineItem } from "./OutlineItem";
export { OutlineEmpty } from "./OutlineEmpty";
```

**File:** `app/(pages)/docs/components/outline/OutlineSidebar.tsx`

```tsx
"use client";

import { useDocumentOutline } from "../editor/utils/useDocumentOutline";
import { OutlineItem } from "./OutlineItem";
import { OutlineEmpty } from "./OutlineEmpty";
import { useDocsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function OutlineSidebar() {
  const { isOutlineOpen, setOutlineOpen } = useDocsStore();
  const { outline, activeKey, scrollToHeading } = useDocumentOutline();

  if (!isOutlineOpen) return null;

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Outline</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setOutlineOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {outline.length === 0 ? (
          <OutlineEmpty />
        ) : (
          <nav className="space-y-0.5">
            {outline.map((item) => (
              <OutlineItem
                key={item.key}
                item={item}
                isActive={item.key === activeKey}
                onClick={() => scrollToHeading(item.key)}
              />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/outline/OutlineItem.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { OutlineItem as OutlineItemType } from "../editor/utils/useDocumentOutline";

interface OutlineItemProps {
  item: OutlineItemType;
  isActive: boolean;
  onClick: () => void;
}

export function OutlineItem({ item, isActive, onClick }: OutlineItemProps) {
  // Calculate indentation based on heading level
  const paddingLeft = (item.level - 1) * 12 + 8;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors truncate",
        "hover:bg-accent",
        isActive && "bg-accent text-accent-foreground font-medium"
      )}
      style={{ paddingLeft: `${paddingLeft}px` }}
      title={item.text}
    >
      {item.text}
    </button>
  );
}
```

**File:** `app/(pages)/docs/components/outline/OutlineEmpty.tsx`

```tsx
"use client";

import { FileText } from "lucide-react";

export function OutlineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <FileText className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No headings yet</p>
      <p className="text-xs mt-1">
        Add headings to create an outline
      </p>
    </div>
  );
}
```

---

### 4. Properties Panel Components

**File:** `app/(pages)/docs/components/properties/index.ts`

```ts
export { PropertiesPanel } from "./PropertiesPanel";
export { TitleEditor } from "./TitleEditor";
export { TagEditor } from "./TagEditor";
export { DescriptionEditor } from "./DescriptionEditor";
export { DocumentStats } from "./DocumentStats";
```

**File:** `app/(pages)/docs/components/properties/PropertiesPanel.tsx`

```tsx
"use client";

import { useDocsStore } from "../../store";
import { TitleEditor } from "./TitleEditor";
import { TagEditor } from "./TagEditor";
import { DescriptionEditor } from "./DescriptionEditor";
import { DocumentStats } from "./DocumentStats";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function PropertiesPanel() {
  const { isPropertiesOpen, setPropertiesOpen, document, content } = useDocsStore();

  if (!document) return null;

  return (
    <Sheet open={isPropertiesOpen} onOpenChange={setPropertiesOpen}>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Document Properties</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <TitleEditor
              title={document.frontmatter.title}
              documentId={document.id}
            />
          </div>

          <Separator />

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <DescriptionEditor
              description={document.frontmatter.description || ""}
              documentId={document.id}
            />
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tags
            </label>
            <TagEditor
              tags={document.frontmatter.tags || []}
              documentId={document.id}
            />
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Statistics
            </label>
            <DocumentStats content={content} />
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-sm">
                {new Date(document.frontmatter.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Modified
              </label>
              <p className="text-sm">
                {new Date(document.frontmatter.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**File:** `app/(pages)/docs/components/properties/TitleEditor.tsx`

```tsx
"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDocsStore } from "../../store";

interface TitleEditorProps {
  title: string;
  documentId: string;
}

export function TitleEditor({ title, documentId }: TitleEditorProps) {
  const [value, setValue] = useState(title);
  const [isEditing, setIsEditing] = useState(false);
  const { setDocument, document } = useDocsStore();

  const handleSave = useCallback(async () => {
    if (value === title) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/docs/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });

      if (!response.ok) throw new Error("Failed to update title");

      // Update store
      if (document) {
        setDocument({
          ...document,
          frontmatter: {
            ...document.frontmatter,
            title: value,
          },
        });
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      setValue(title); // Revert
    }

    setIsEditing(false);
  }, [value, title, documentId, document, setDocument]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setValue(title);
        setIsEditing(false);
      }
    },
    [handleSave, title]
  );

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="mt-1"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full text-left mt-1 p-2 rounded-md hover:bg-accent transition-colors"
    >
      {title || "Untitled"}
    </button>
  );
}
```

**File:** `app/(pages)/docs/components/properties/TagEditor.tsx`

```tsx
"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useDocsStore } from "../../store";

interface TagEditorProps {
  tags: string[];
  documentId: string;
}

export function TagEditor({ tags, documentId }: TagEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const { setDocument, document } = useDocsStore();

  const saveTags = useCallback(
    async (newTags: string[]) => {
      try {
        const response = await fetch(`/api/docs/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: newTags }),
        });

        if (!response.ok) throw new Error("Failed to update tags");

        // Update store
        if (document) {
          setDocument({
            ...document,
            frontmatter: {
              ...document.frontmatter,
              tags: newTags,
            },
          });
        }
      } catch (error) {
        console.error("Failed to save tags:", error);
      }
    },
    [documentId, document, setDocument]
  );

  const handleAddTag = useCallback(() => {
    const tag = inputValue.trim().toLowerCase();
    if (!tag || tags.includes(tag)) {
      setInputValue("");
      return;
    }

    const newTags = [...tags, tag];
    saveTags(newTags);
    setInputValue("");
  }, [inputValue, tags, saveTags]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((t) => t !== tagToRemove);
      saveTags(newTags);
    },
    [tags, saveTags]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  return (
    <div className="mt-2 space-y-2">
      {/* Tag list */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add tag input */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag and press Enter"
        className="h-8"
      />
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/properties/DescriptionEditor.tsx`

```tsx
"use client";

import { useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useDocsStore } from "../../store";

interface DescriptionEditorProps {
  description: string;
  documentId: string;
}

export function DescriptionEditor({ description, documentId }: DescriptionEditorProps) {
  const [value, setValue] = useState(description);
  const { setDocument, document } = useDocsStore();

  const handleSave = useCallback(async () => {
    if (value === description) return;

    try {
      const response = await fetch(`/api/docs/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value }),
      });

      if (!response.ok) throw new Error("Failed to update description");

      // Update store
      if (document) {
        setDocument({
          ...document,
          frontmatter: {
            ...document.frontmatter,
            description: value,
          },
        });
      }
    } catch (error) {
      console.error("Failed to save description:", error);
      setValue(description); // Revert
    }
  }, [value, description, documentId, document, setDocument]);

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      placeholder="Add a description..."
      className="mt-1 min-h-[80px] resize-none"
    />
  );
}
```

**File:** `app/(pages)/docs/components/properties/DocumentStats.tsx`

```tsx
"use client";

import { useMemo } from "react";
import { FileText, Clock, Hash, Type } from "lucide-react";

interface DocumentStatsProps {
  content: string;
}

export function DocumentStats({ content }: DocumentStatsProps) {
  const stats = useMemo(() => {
    // Word count
    const words = content
      .replace(/[#*`>\-_\[\]()]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const wordCount = words.length;

    // Character count (excluding whitespace)
    const charCount = content.replace(/\s/g, "").length;

    // Reading time (average 200 words per minute)
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Heading count
    const headingCount = (content.match(/^#+\s/gm) || []).length;

    return {
      wordCount,
      charCount,
      readingTime,
      headingCount,
    };
  }, [content]);

  return (
    <div className="mt-2 grid grid-cols-2 gap-4">
      <StatItem
        icon={Type}
        label="Words"
        value={stats.wordCount.toLocaleString()}
      />
      <StatItem
        icon={Hash}
        label="Characters"
        value={stats.charCount.toLocaleString()}
      />
      <StatItem
        icon={Clock}
        label="Reading time"
        value={`${stats.readingTime} min`}
      />
      <StatItem
        icon={FileText}
        label="Headings"
        value={stats.headingCount.toString()}
      />
    </div>
  );
}

interface StatItemProps {
  icon: typeof Type;
  label: string;
  value: string;
}

function StatItem({ icon: Icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
```

---

### 5. Toggle Buttons in Header

**File:** `app/(pages)/docs/components/editor/DocumentHeader.tsx` (Updated)

```tsx
"use client";

import { useDocsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { FileText, List, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DocumentHeader() {
  const { document, isOutlineOpen, toggleOutline, toggleProperties } = useDocsStore();

  if (!document) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {/* Outline Toggle */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isOutlineOpen ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleOutline}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOutlineOpen ? "Hide outline" : "Show outline"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Document Icon and Title */}
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

      {/* Properties Toggle */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={toggleProperties}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Document properties</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
```

---

### 6. Update Document Editor Layout

**File:** `app/(pages)/docs/components/editor/DocumentEditor.tsx` (Updated)

```tsx
"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatToggle } from "./ChatToggle";
import { OutlineSidebar } from "../outline/OutlineSidebar";
import { PropertiesPanel } from "../properties/PropertiesPanel";
import { useDocsStore } from "../../store";
import type { Document } from "@/app/api/docs/services/types";

interface DocumentEditorProps {
  document: Document;
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const {
    setDocument,
    setContent,
    reset,
    isChatOpen,
    resetChat,
    isOutlineOpen,
    resetUI,
  } = useDocsStore();

  // Initialize store with document data
  useEffect(() => {
    setDocument(document);
    setContent(document.content);

    // Cleanup on unmount
    return () => {
      reset();
      resetChat();
      resetUI();
    };
  }, [document, setDocument, setContent, reset, resetChat, resetUI]);

  return (
    <div className="h-full flex">
      {/* Outline Sidebar (Left) */}
      {isOutlineOpen && <OutlineSidebar />}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with title and controls */}
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

      {/* Chat Sidebar (Right) */}
      {isChatOpen && <ChatSidebar />}

      {/* Properties Panel (Sheet) */}
      <PropertiesPanel />
    </div>
  );
}
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Outline Sidebar**
   - Create document with multiple headings (H1, H2, H3)
   - Click List icon in header to toggle outline
   - Verify headings appear with correct indentation
   - Click heading in outline, verify scrolls to section
   - Scroll document, verify active heading highlights

2. **Test Outline Updates**
   - Add a new heading in editor
   - Verify outline updates immediately
   - Delete a heading
   - Verify outline removes it

3. **Test Properties Panel**
   - Click Settings icon in header
   - Verify panel slides in from right
   - Click title to edit
   - Change title and blur, verify saves
   - Verify header title updates

4. **Test Tag Management**
   - Type tag and press Enter
   - Verify tag appears as badge
   - Click X to remove tag
   - Verify tag is removed
   - Refresh page, verify tags persisted

5. **Test Description**
   - Type in description field
   - Blur field
   - Refresh page, verify saved

6. **Test Statistics**
   - Verify word count matches content
   - Verify reading time updates
   - Add/remove content, verify stats update

---

## Dependencies

### ShadCN Components Required
```bash
npx shadcn@latest add sheet separator badge
```

---

## Next Phase

**Phase 7: Version History** will add:
- Version snapshots on save
- History list showing previous versions
- Preview and restore functionality
- Diff comparison (basic)

---

## Notes

- Outline extraction uses Lexical's `$isHeadingNode` for accuracy
- Active heading tracking uses scroll position detection
- Properties panel uses ShadCN Sheet for slide-in effect
- Statistics calculate in real-time using `useMemo`
- Tag autocomplete deferred to future enhancement
