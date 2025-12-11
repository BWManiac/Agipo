# Phase 0: Technical Spike — Lexical Validation

**Status:** Planned
**Depends On:** Research Log (01-Research-Log.md)
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Validate core technical assumptions about Lexical before building the full document editor. This spike tests the fundamental integration points that all subsequent phases depend on.

**After this phase, we will know:**
- ✅ Lexical initializes correctly in Next.js
- ✅ Markdown import/export works reliably
- ✅ Slash commands can be implemented
- ✅ Block handles are feasible
- ✅ Programmatic content insertion works (for agent edits)
- ✅ Frontmatter parsing integrates cleanly

**If any assumption fails, we can pivot before investing in 40+ files of implementation.**

### Why This Phase Exists

Before building the full editor infrastructure, we need to validate that:
1. **Lexical works in Next.js** - No SSR issues, proper client initialization
2. **Markdown round-trip is reliable** - No data loss when loading/saving
3. **Slash commands work as expected** - Can implement Notion-style UX
4. **Block handles are feasible** - Can add visual handles on hover
5. **Agent integration is possible** - Can insert content programmatically

This follows the pattern established in browser automation (`00-Phase0-Technical-Spike.md`).

### Critical Assumptions to Validate

| Assumption | Why Critical | Risk if Wrong |
|------------|--------------|---------------|
| Lexical works in Next.js 15 | Foundation for entire feature | Need different editor library |
| Markdown import/export is lossless | Storage format depends on this | Need custom serialization |
| Slash commands are built-in | Core UX feature | Need custom implementation |
| Can add block handles via CSS/plugin | Notion-style UX requirement | Redesign block interactions |
| Can insert content programmatically | Agent editing capability | Different agent integration |
| gray-matter works for frontmatter | Metadata storage | Different frontmatter approach |

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test approach | Single test page with multiple components | Easy to iterate and debug |
| Code organization | `/experiments/lexical-spike/` page | Isolated from production code |
| Scope | Core functionality only | Prove concepts, not build features |

---

## File Impact Analysis

### Spike Files (Temporary)

| File | Action | Purpose | LOC Est. |
|------|--------|---------|----------|
| `app/(pages)/experiments/lexical-spike/page.tsx` | Create | Main test page | ~50 |
| `app/(pages)/experiments/lexical-spike/components/BasicEditor.tsx` | Create | Basic Lexical setup | ~100 |
| `app/(pages)/experiments/lexical-spike/components/MarkdownTest.tsx` | Create | Import/export test | ~150 |
| `app/(pages)/experiments/lexical-spike/components/SlashCommandTest.tsx` | Create | Slash command test | ~200 |
| `app/(pages)/experiments/lexical-spike/components/BlockHandleTest.tsx` | Create | Block handle test | ~150 |
| `app/(pages)/experiments/lexical-spike/components/InsertContentTest.tsx` | Create | Programmatic insert | ~100 |
| `app/(pages)/experiments/lexical-spike/theme.ts` | Create | Editor theme/styling | ~80 |
| `package.json` | Modify | Add Lexical packages | - |

**Total:** 7 new files, 1 modified, ~830 LOC

### What We're NOT Building

- ❌ Full document storage API (Phase 1)
- ❌ Document catalog UI (Phase 1)
- ❌ Complete toolbar (Phase 3)
- ❌ Chat integration (Phase 5)
- ❌ Version history (Phase 7)
- ❌ Production-ready code

---

## Acceptance Criteria

### Lexical Initialization (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.1 | Lexical editor renders without errors | Load test page, verify no console errors |
| AC-0.2 | Can type in editor and see content | Type text, verify it appears |
| AC-0.3 | Undo/redo works (Cmd+Z, Cmd+Shift+Z) | Type, undo, verify content reverts |

### Markdown Round-Trip (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.4 | Can import Markdown into editor | Load sample Markdown, verify rendered |
| AC-0.5 | Can export editor content to Markdown | Type content, export, verify Markdown |
| AC-0.6 | Round-trip preserves headings | Import H1-H4, export, verify preserved |
| AC-0.7 | Round-trip preserves lists | Import bullet/numbered/checkbox, export, verify |
| AC-0.8 | Round-trip preserves code blocks | Import fenced code, export, verify with language |
| AC-0.9 | Round-trip preserves links | Import links, export, verify URL preserved |

### Slash Commands (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.10 | Typing `/` shows command menu | Type `/` on empty line |
| AC-0.11 | Menu filters as you type | Type `/head`, verify filter |
| AC-0.12 | Selecting item inserts block | Select Heading 1, verify H1 created |
| AC-0.13 | Escape closes menu without action | Open menu, press Escape |

### Block Handles (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.14 | Handles appear on block hover | Hover left side of paragraph |
| AC-0.15 | Handles disappear when not hovering | Move mouse away |
| AC-0.16 | Handle click is detectable | Click handle, verify event fired |

### Programmatic Content (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.17 | Can insert text at cursor position | Call insert function, verify text appears |
| AC-0.18 | Can replace selected text | Select text, call replace, verify replaced |
| AC-0.19 | Can append content at end | Call append function, verify at end |

### Frontmatter Integration (2 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-0.20 | gray-matter parses frontmatter correctly | Parse sample, verify data extracted |
| AC-0.21 | gray-matter regenerates frontmatter correctly | Modify data, stringify, verify YAML |

---

## Implementation Details

### Package Installation

```bash
# Core Lexical packages
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/selection @lexical/history

# Frontmatter parsing
npm install gray-matter
```

### Test Page Structure

```tsx
// app/(pages)/experiments/lexical-spike/page.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicEditor } from "./components/BasicEditor";
import { MarkdownTest } from "./components/MarkdownTest";
import { SlashCommandTest } from "./components/SlashCommandTest";
import { BlockHandleTest } from "./components/BlockHandleTest";
import { InsertContentTest } from "./components/InsertContentTest";

export default function LexicalSpikePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Lexical Technical Spike</h1>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">Basic Editor</TabsTrigger>
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
          <TabsTrigger value="slash">Slash Commands</TabsTrigger>
          <TabsTrigger value="handles">Block Handles</TabsTrigger>
          <TabsTrigger value="insert">Insert Content</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicEditor />
        </TabsContent>

        <TabsContent value="markdown">
          <MarkdownTest />
        </TabsContent>

        <TabsContent value="slash">
          <SlashCommandTest />
        </TabsContent>

        <TabsContent value="handles">
          <BlockHandleTest />
        </TabsContent>

        <TabsContent value="insert">
          <InsertContentTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Test 1: Basic Editor

```tsx
// app/(pages)/experiments/lexical-spike/components/BasicEditor.tsx
"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { editorTheme } from "../theme";

const initialConfig = {
  namespace: "BasicEditorSpike",
  theme: editorTheme,
  onError: (error: Error) => {
    console.error("Lexical Error:", error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
  ],
};

export function BasicEditor() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Test 1: Basic Initialization</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Validates: Lexical renders, typing works, undo/redo works
      </p>

      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] p-4 border rounded focus:outline-none focus:ring-2 focus:ring-ring" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
                Start typing to test basic editor...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </div>
      </LexicalComposer>

      <div className="mt-4 text-sm text-muted-foreground">
        <strong>Test:</strong> Type some text, then press Cmd+Z to undo.
      </div>
    </div>
  );
}
```

### Test 2: Markdown Import/Export

```tsx
// app/(pages)/experiments/lexical-spike/components/MarkdownTest.tsx
"use client";

import { useState, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editorTheme } from "../theme";

const SAMPLE_MARKDOWN = `# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

- Bullet item 1
- Bullet item 2
- Bullet item 3

### Heading 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

#### Heading 4

> This is a blockquote

\`\`\`typescript
const hello = "world";
console.log(hello);
\`\`\`

Here's a [link](https://example.com) to test.
`;

const initialConfig = {
  namespace: "MarkdownTestSpike",
  theme: editorTheme,
  onError: (error: Error) => console.error(error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode],
};

function MarkdownControls({ onExported }: { onExported: (md: string) => void }) {
  const [editor] = useLexicalComposerContext();

  const handleImport = useCallback(() => {
    editor.update(() => {
      $convertFromMarkdownString(SAMPLE_MARKDOWN, TRANSFORMERS);
    });
  }, [editor]);

  const handleExport = useCallback(() => {
    editor.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      onExported(markdown);
    });
  }, [editor, onExported]);

  return (
    <div className="flex gap-2 mb-4">
      <Button onClick={handleImport}>Import Sample Markdown</Button>
      <Button onClick={handleExport} variant="outline">Export to Markdown</Button>
    </div>
  );
}

export function MarkdownTest() {
  const [exportedMarkdown, setExportedMarkdown] = useState("");

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Test 2: Markdown Import/Export</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Validates: Import Markdown, export Markdown, round-trip preserves content
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Editor</h3>
          <LexicalComposer initialConfig={initialConfig}>
            <MarkdownControls onExported={setExportedMarkdown} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="min-h-[300px] p-4 border rounded focus:outline-none" />
              }
              placeholder={<div className="absolute p-4 text-muted-foreground">Click "Import Sample Markdown"...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
          </LexicalComposer>
        </div>

        <div>
          <h3 className="font-medium mb-2">Exported Markdown</h3>
          <Textarea
            value={exportedMarkdown}
            readOnly
            className="min-h-[300px] font-mono text-sm"
            placeholder="Click 'Export to Markdown' to see output..."
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted rounded">
        <strong>Test Flow:</strong>
        <ol className="list-decimal list-inside mt-2 text-sm">
          <li>Click "Import Sample Markdown"</li>
          <li>Verify content renders correctly (headings, lists, code, link)</li>
          <li>Click "Export to Markdown"</li>
          <li>Compare exported Markdown with original</li>
          <li>Edit content, export again, verify changes reflected</li>
        </ol>
      </div>
    </div>
  );
}
```

### Test 3: Slash Commands

```tsx
// app/(pages)/experiments/lexical-spike/components/SlashCommandTest.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalTypeaheadMenuPlugin, MenuOption } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $createListNode, $createListItemNode, ListNode, ListItemNode } from "@lexical/list";
import { $createCodeNode, CodeNode, CodeHighlightNode } from "@lexical/code";
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } from "lexical";
import { editorTheme } from "../theme";
import * as ReactDOM from "react-dom";

// Slash command options
class SlashCommandOption extends MenuOption {
  title: string;
  icon: string;
  keywords: string[];
  onSelect: (editor: any) => void;

  constructor(
    title: string,
    icon: string,
    keywords: string[],
    onSelect: (editor: any) => void
  ) {
    super(title);
    this.title = title;
    this.icon = icon;
    this.keywords = keywords;
    this.onSelect = onSelect;
  }
}

const SLASH_COMMANDS: SlashCommandOption[] = [
  new SlashCommandOption("Heading 1", "H1", ["h1", "heading", "title"], (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const heading = $createHeadingNode("h1");
        selection.insertNodes([heading]);
      }
    });
  }),
  new SlashCommandOption("Heading 2", "H2", ["h2", "heading", "subtitle"], (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const heading = $createHeadingNode("h2");
        selection.insertNodes([heading]);
      }
    });
  }),
  new SlashCommandOption("Bullet List", "•", ["bullet", "list", "ul"], (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const list = $createListNode("bullet");
        const item = $createListItemNode();
        list.append(item);
        selection.insertNodes([list]);
      }
    });
  }),
  new SlashCommandOption("Numbered List", "1.", ["numbered", "list", "ol"], (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const list = $createListNode("number");
        const item = $createListItemNode();
        list.append(item);
        selection.insertNodes([list]);
      }
    });
  }),
  new SlashCommandOption("Code Block", "</>", ["code", "snippet", "pre"], (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const code = $createCodeNode();
        selection.insertNodes([code]);
      }
    });
  }),
];

function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const options = useMemo(() => {
    if (queryString === null) return SLASH_COMMANDS;
    const lowerQuery = queryString.toLowerCase();
    return SLASH_COMMANDS.filter(
      (option) =>
        option.title.toLowerCase().includes(lowerQuery) ||
        option.keywords.some((kw) => kw.includes(lowerQuery))
    );
  }, [queryString]);

  const onSelectOption = useCallback(
    (option: SlashCommandOption, textNodeContainingQuery: any, closeMenu: () => void) => {
      editor.update(() => {
        // Remove the slash command text
        if (textNodeContainingQuery) {
          textNodeContainingQuery.remove();
        }
      });
      option.onSelect(editor);
      closeMenu();
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={(text) => {
        const match = text.match(/\/(\w*)$/);
        if (match) {
          return {
            leadOffset: match.index!,
            matchingString: match[1],
            replaceableString: match[0],
          };
        }
        return null;
      }}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null;

        return ReactDOM.createPortal(
          <div className="absolute z-50 bg-white border rounded-lg shadow-lg py-2 min-w-[200px]">
            {options.map((option, index) => (
              <div
                key={option.title}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  selectedIndex === index ? "bg-accent" : "hover:bg-muted"
                }`}
                onClick={() => selectOptionAndCleanUp(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="w-8 h-8 flex items-center justify-center bg-muted rounded text-sm font-mono">
                  {option.icon}
                </span>
                <span>{option.title}</span>
              </div>
            ))}
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}

const initialConfig = {
  namespace: "SlashCommandSpike",
  theme: editorTheme,
  onError: (error: Error) => console.error(error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode],
};

export function SlashCommandTest() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Test 3: Slash Commands</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Validates: "/" triggers menu, filtering works, selection inserts block
      </p>

      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] p-4 border rounded focus:outline-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
                Type "/" to see slash commands...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <SlashCommandPlugin />
        </div>
      </LexicalComposer>

      <div className="mt-4 p-4 bg-muted rounded">
        <strong>Test Flow:</strong>
        <ol className="list-decimal list-inside mt-2 text-sm">
          <li>Type "/" on an empty line - menu should appear</li>
          <li>Type "/head" - menu should filter to headings</li>
          <li>Use arrow keys to navigate, Enter to select</li>
          <li>Press Escape to close menu without action</li>
          <li>Verify selected block type is inserted</li>
        </ol>
      </div>
    </div>
  );
}
```

### Test 4: Block Handles

```tsx
// app/(pages)/experiments/lexical-spike/components/BlockHandleTest.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { GripVertical, Plus } from "lucide-react";
import { editorTheme } from "../theme";

const SAMPLE_CONTENT = `# Document Title

This is the first paragraph. Hover on the left side to see the block handle.

## Section One

This is another paragraph in section one.

## Section Two

And this is a paragraph in section two.

- List item 1
- List item 2
- List item 3
`;

function BlockHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [handlePosition, setHandlePosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Find the closest block-level element
      const blockElement = target.closest("p, h1, h2, h3, h4, ul, ol, blockquote, pre");

      if (blockElement && editorElement.contains(blockElement)) {
        setHoveredElement(blockElement as HTMLElement);
        const rect = blockElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        setHandlePosition({
          top: rect.top - editorRect.top,
          left: -40,
        });
      } else {
        setHoveredElement(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredElement(null);
    };

    editorElement.addEventListener("mousemove", handleMouseMove);
    editorElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      editorElement.removeEventListener("mousemove", handleMouseMove);
      editorElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor]);

  const handleDragClick = useCallback(() => {
    console.log("Drag handle clicked!", hoveredElement?.tagName);
    alert(`Block handle clicked! Element: ${hoveredElement?.tagName}`);
  }, [hoveredElement]);

  const handlePlusClick = useCallback(() => {
    console.log("Plus handle clicked!", hoveredElement?.tagName);
    alert(`Plus handle clicked! Would insert new block after: ${hoveredElement?.tagName}`);
  }, [hoveredElement]);

  if (!hoveredElement) return null;

  return (
    <div
      className="absolute flex items-center gap-0.5 transition-opacity duration-150"
      style={{
        top: handlePosition.top,
        left: handlePosition.left,
      }}
    >
      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
        onClick={handlePlusClick}
        title="Add block"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-grab"
        onClick={handleDragClick}
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}

function LoadContentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(SAMPLE_CONTENT, TRANSFORMERS);
    });
  }, [editor]);

  return null;
}

const initialConfig = {
  namespace: "BlockHandleSpike",
  theme: editorTheme,
  onError: (error: Error) => console.error(error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
};

export function BlockHandleTest() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Test 4: Block Handles</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Validates: Handles appear on hover, click events work
      </p>

      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative pl-12">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[300px] p-4 border rounded focus:outline-none" />
            }
            placeholder={<div />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <LoadContentPlugin />
          <BlockHandlePlugin />
        </div>
      </LexicalComposer>

      <div className="mt-4 p-4 bg-muted rounded">
        <strong>Test Flow:</strong>
        <ol className="list-decimal list-inside mt-2 text-sm">
          <li>Hover over different blocks (paragraphs, headings, lists)</li>
          <li>Verify handles appear on the left side</li>
          <li>Click the drag handle (⋮⋮) - should show alert</li>
          <li>Click the plus handle (+) - should show alert</li>
          <li>Move mouse away - handles should disappear</li>
        </ol>
      </div>
    </div>
  );
}
```

### Test 5: Programmatic Content Insert

```tsx
// app/(pages)/experiments/lexical-spike/components/InsertContentTest.tsx
"use client";

import { useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $getSelection, $isRangeSelection, $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { Button } from "@/components/ui/button";
import { editorTheme } from "../theme";

function InsertControls() {
  const [editor] = useLexicalComposerContext();

  const insertAtCursor = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText("[INSERTED AT CURSOR]");
      } else {
        // No selection, insert at end
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("[INSERTED - NO CURSOR]"));
        root.append(paragraph);
      }
    });
  }, [editor]);

  const replaceSelection = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        selection.insertText("[REPLACED SELECTION]");
      } else {
        alert("Please select some text first!");
      }
    });
  }, [editor]);

  const appendToEnd = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("[APPENDED TO END]"));
      root.append(paragraph);
    });
  }, [editor]);

  const insertMarkdown = useCallback(() => {
    const markdown = `

## Agent-Generated Section

This section was **generated programmatically** by simulating an agent insertion.

- Point one
- Point two
- Point three

`;
    editor.update(() => {
      const root = $getRoot();
      // Clear and insert
      root.clear();
      $convertFromMarkdownString(markdown, TRANSFORMERS);
    });
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button onClick={insertAtCursor}>Insert at Cursor</Button>
      <Button onClick={replaceSelection} variant="outline">Replace Selection</Button>
      <Button onClick={appendToEnd} variant="outline">Append to End</Button>
      <Button onClick={insertMarkdown} variant="secondary">Insert Markdown Block</Button>
    </div>
  );
}

const initialConfig = {
  namespace: "InsertContentSpike",
  theme: editorTheme,
  onError: (error: Error) => console.error(error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
};

export function InsertContentTest() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Test 5: Programmatic Content Insertion</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Validates: Insert at cursor, replace selection, append to end (for agent edits)
      </p>

      <LexicalComposer initialConfig={initialConfig}>
        <InsertControls />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[200px] p-4 border rounded focus:outline-none" />
          }
          placeholder={
            <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
              Type some text, then use the buttons above...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
      </LexicalComposer>

      <div className="mt-4 p-4 bg-muted rounded">
        <strong>Test Flow:</strong>
        <ol className="list-decimal list-inside mt-2 text-sm">
          <li>Type some text in the editor</li>
          <li>Click "Insert at Cursor" - text should appear at cursor</li>
          <li>Select some text, click "Replace Selection" - should replace</li>
          <li>Click "Append to End" - should add at bottom</li>
          <li>Click "Insert Markdown Block" - should insert formatted content</li>
        </ol>
        <p className="mt-2 text-sm">
          <strong>Agent Integration:</strong> These patterns will be used when agents call
          sys_doc_insert and sys_doc_replace tools.
        </p>
      </div>
    </div>
  );
}
```

### Editor Theme

```typescript
// app/(pages)/experiments/lexical-spike/theme.ts
export const editorTheme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-3xl font-bold mb-4",
    h2: "text-2xl font-bold mb-3",
    h3: "text-xl font-bold mb-2",
    h4: "text-lg font-bold mb-2",
  },
  list: {
    ul: "list-disc list-inside mb-2",
    ol: "list-decimal list-inside mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-gray-300 pl-4 italic mb-2",
  code: "bg-gray-100 rounded px-1 py-0.5 font-mono text-sm",
  codeHighlight: {
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-red-600",
    builtin: "text-cyan-600",
    cdata: "text-gray-500",
    char: "text-green-600",
    class: "text-yellow-600",
    "class-name": "text-yellow-600",
    comment: "text-gray-500 italic",
    constant: "text-purple-600",
    deleted: "text-red-600",
    doctype: "text-gray-500",
    entity: "text-red-600",
    function: "text-blue-600",
    important: "text-red-600 font-bold",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-gray-600",
    number: "text-green-600",
    operator: "text-gray-600",
    prolog: "text-gray-500",
    property: "text-blue-600",
    punctuation: "text-gray-600",
    regex: "text-red-600",
    selector: "text-yellow-600",
    string: "text-green-600",
    symbol: "text-purple-600",
    tag: "text-red-600",
    url: "text-blue-600",
    variable: "text-red-600",
  },
  link: "text-blue-600 underline",
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "bg-gray-100 rounded px-1 py-0.5 font-mono text-sm",
  },
};
```

---

## Testing Instructions

### 1. Install Dependencies

```bash
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/link @lexical/code @lexical/table @lexical/selection @lexical/history gray-matter
```

### 2. Create Test Files

Create all files listed in the File Impact Analysis section.

### 3. Run Tests

```bash
npm run dev
# Navigate to http://localhost:3000/experiments/lexical-spike
```

### 4. Execute Test Flows

For each tab (Basic, Markdown, Slash, Handles, Insert):
1. Follow the test flow instructions
2. Record pass/fail for each acceptance criterion
3. Note any unexpected behavior

---

## Success Criteria

Phase 0 is complete when:

- [ ] All 21 acceptance criteria pass
- [ ] Lexical initializes without SSR errors
- [ ] Markdown round-trip preserves all tested elements
- [ ] Slash commands work as expected
- [ ] Block handles appear and respond to clicks
- [ ] Programmatic insertion works for agent integration
- [ ] No blocking technical issues discovered

---

## Failure Scenarios & Mitigation

| Failure | Impact | Next Steps |
|---------|--------|------------|
| SSR errors with Lexical | **High** | Use dynamic import with `ssr: false` |
| Markdown round-trip loses data | **High** | Add custom transformers or use different format |
| Slash commands don't work | **Medium** | Build custom typeahead plugin |
| Block handles difficult to implement | **Medium** | Simplify to CSS-only approach |
| Programmatic insert breaks editor | **High** | Research alternative insertion methods |

---

## Post-Phase 0: Updating Later Phases

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them.

If Phase 0 reveals issues:
1. Document specific failures in Research Log
2. Update Technical Architecture if needed
3. Revise Implementation Plan
4. Adjust phase scope/order as needed

---

## References

- **Research Log:** `01-Research-Log.md`
- **Product Spec:** `00-Product-Spec.md`
- **Browser Automation Spike (Pattern):** `_docs/_tasks/21-browser-automation/00-Phase0-Technical-Spike.md`
- **Lexical Playground:** https://playground.lexical.dev/
- **Lexical Documentation:** https://lexical.dev/docs/intro

---

**Last Updated:** December 2025
