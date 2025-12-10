# Task 22b: Docs Feature — Research Log

**Status:** Not Started
**Date:** December 2025
**Parent Task:** [00-Product-Spec.md](./00-Product-Spec.md)

---

## How to Use This Document

This is a **research log** for discovering facts about Lexical and related packages needed to implement the Docs feature.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks (PR-X.X)
3. **Answer** — What we discovered
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** External APIs are immutable. We can't change their shape—we discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: How to initialize Lexical in React?](#rq-1-how-to-initialize-lexical-in-react) | PR-2.x (Editor Core) | ❓ |
| [RQ-2: How to import/export Markdown?](#rq-2-how-to-importexport-markdown) | PR-2.x (Storage) | ❓ |
| [RQ-3: How to implement slash commands?](#rq-3-how-to-implement-slash-commands) | PR-4.x (Block Editing) | ❓ |
| [RQ-4: How to create custom block handles?](#rq-4-how-to-create-custom-block-handles) | PR-4.5-4.9 (Block Handles) | ❓ |
| [RQ-5: How to implement toolbar formatting?](#rq-5-how-to-implement-toolbar-formatting) | PR-3.x (Toolbar) | ❓ |
| [RQ-6: How to implement floating selection toolbar?](#rq-6-how-to-implement-floating-selection-toolbar) | PR-10.x (Text Selection) | ❓ |
| [RQ-7: How to programmatically insert content?](#rq-7-how-to-programmatically-insert-content) | PR-7.5-7.6 (Agent Edit) | ❓ |
| [RQ-8: How to implement heading outline?](#rq-8-how-to-implement-heading-outline) | PR-5.x (Outline) | ❓ |
| [RQ-9: How to implement GFM alert blocks?](#rq-9-how-to-implement-gfm-alert-blocks) | PR-11.11 (Callouts) | ❓ |
| [RQ-10: How to implement drag-and-drop reordering?](#rq-10-how-to-implement-drag-and-drop-reordering) | PR-4.6 (Drag Handle) | ❓ |
| [RQ-11: How to implement code blocks with syntax highlighting?](#rq-11-how-to-implement-code-blocks-with-syntax-highlighting) | PR-11.7 (Code Blocks) | ❓ |
| [RQ-12: How to implement tables?](#rq-12-how-to-implement-tables) | PR-11.10 (Tables) | ❓ |
| [RQ-13: How to track editor state for save indicator?](#rq-13-how-to-track-editor-state-for-save-indicator) | PR-2.5 (Save Indicator) | ❓ |
| [RQ-14: How to parse/generate YAML frontmatter?](#rq-14-how-to-parsegenerate-yaml-frontmatter) | PR-6.x (Properties) | ❓ |

---

## Part 1: Lexical Core

### RQ-1: How to Initialize Lexical in React?

**Why It Matters:** PR-2.x (Editor Core) — This is the foundation. Without proper initialization, nothing else works.

**Status:** ❓ Not Researched

**Question:** How do we set up a Lexical editor in a Next.js/React environment? What providers, plugins, and configuration are needed?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```tsx
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

const initialConfig = {
  namespace: "DocsEditor",
  theme: editorTheme,
  onError: (error: Error) => console.error(error),
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    // ... more nodes
  ],
};

function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor" />}
        placeholder={<div className="placeholder">Start writing...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={handleChange} />
      {/* More plugins */}
    </LexicalComposer>
  );
}
```

**Primitive Discovered:**
- Component: `LexicalComposer`
- Required plugins: `RichTextPlugin`, `HistoryPlugin`
- Configuration: `namespace`, `theme`, `nodes`, `onError`

**Key Questions to Answer:**
1. What nodes are needed for our block types?
2. How does the theme object work?
3. Is there a difference between SSR and client-side initialization?

**Source:** [Lexical React Documentation](https://lexical.dev/docs/getting-started/react)

---

### RQ-2: How to Import/Export Markdown?

**Why It Matters:** PR-2.x (Storage) — Documents are stored as Markdown. We need reliable round-trip conversion.

**Status:** ❓ Not Researched

**Question:** How do we convert between Lexical editor state and Markdown? Does it handle all our block types? Is there data loss?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { TRANSFORMERS } from "@lexical/markdown";

// Import Markdown into editor
editor.update(() => {
  $convertFromMarkdownString(markdownString, TRANSFORMERS);
});

// Export editor state to Markdown
const markdown = editor.read(() => {
  return $convertToMarkdownString(TRANSFORMERS);
});
```

**Primitive Discovered:**
- Function: `$convertFromMarkdownString(markdown, transformers)`
- Function: `$convertToMarkdownString(transformers)`
- Constant: `TRANSFORMERS` (array of transformation rules)

**Key Questions to Answer:**
1. What TRANSFORMERS are included by default?
2. How do we add custom transformers for GFM alerts?
3. Is there any data loss in the round-trip?
4. How do we handle frontmatter (YAML at top)?

**Source:** [Lexical Markdown Documentation](https://lexical.dev/docs/packages/lexical-markdown)

---

### RQ-3: How to Implement Slash Commands?

**Why It Matters:** PR-4.x (Block Editing) — Slash commands are core to the Notion-style UX.

**Status:** ❓ Not Researched

**Question:** How do we show a menu when user types `/`? How does filtering work? How do we insert the selected block type?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```tsx
import { LexicalTypeaheadMenuPlugin } from "@lexical/react/LexicalTypeaheadMenuPlugin";

function SlashCommandPlugin() {
  const [queryString, setQueryString] = useState<string | null>(null);

  const options = useMemo(() => {
    return SLASH_COMMAND_OPTIONS.filter((option) =>
      option.title.toLowerCase().includes(queryString?.toLowerCase() ?? "")
    );
  }, [queryString]);

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      menuRenderFn={(anchorElement, { options, selectedIndex, selectOptionAndCleanUp }) => (
        <SlashCommandMenu
          anchorElement={anchorElement}
          options={options}
          selectedIndex={selectedIndex}
          onSelect={selectOptionAndCleanUp}
        />
      )}
      triggerFn={(text) => {
        const match = text.match(/\/(\w*)$/);
        return match ? { leadOffset: match.index!, matchingString: match[1] } : null;
      }}
    />
  );
}
```

**Primitive Discovered:**
- Plugin: `LexicalTypeaheadMenuPlugin`
- Props: `onQueryChange`, `menuRenderFn`, `triggerFn`
- Callback: `selectOptionAndCleanUp` to insert block

**Key Questions to Answer:**
1. How does `selectOptionAndCleanUp` work?
2. How do we insert a specific node type (Heading, List, etc.)?
3. Can we have categories in the menu?
4. How do we handle keyboard navigation?

**Source:** [Lexical Typeahead Plugin](https://lexical.dev/docs/react/plugins#lexicaltypeaheadmenuplugin)

---

### RQ-4: How to Create Custom Block Handles?

**Why It Matters:** PR-4.5-4.9 (Block Handles) — Block handles are visual indicators for drag-drop and block manipulation.

**Status:** ❓ Not Researched

**Question:** How do we add visual handles on the left side of each block? Can we detect hover? How do we attach actions?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Approaches (to validate):**

**Approach A: CSS-based handles**
```css
.block-row {
  position: relative;
}

.block-handle {
  position: absolute;
  left: -40px;
  opacity: 0;
  transition: opacity 0.15s;
}

.block-row:hover .block-handle {
  opacity: 1;
}
```

**Approach B: Lexical Decorator Nodes**
```typescript
// Custom decorator that wraps each block node
class BlockHandleDecorator extends DecoratorNode {
  // ...
}
```

**Approach C: Custom Plugin with DOM manipulation**
```typescript
function BlockHandlePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Listen for editor updates
    // Inject handle elements into DOM
    // Attach event listeners
  }, [editor]);
}
```

**Key Questions to Answer:**
1. Does Lexical have built-in block handle support?
2. How do we identify "block" boundaries in the DOM?
3. How do we make handles work with drag-and-drop?
4. Is there an existing Lexical plugin for this?

**Source:** Lexical Playground source code, community examples

---

### RQ-5: How to Implement Toolbar Formatting?

**Why It Matters:** PR-3.x (Toolbar) — Toolbar buttons need to toggle formatting and show active state.

**Status:** ❓ Not Researched

**Question:** How do we apply bold/italic/etc formatting? How do we detect current selection state for active indicators?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);

  // Listen for selection changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat("bold"));
        }
      });
    });
  }, [editor]);

  // Toggle bold
  const toggleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  return (
    <button onClick={toggleBold} data-active={isBold}>
      Bold
    </button>
  );
}
```

**Primitive Discovered:**
- Command: `FORMAT_TEXT_COMMAND` with format type
- Method: `selection.hasFormat(format)` for active state
- Pattern: `editor.registerUpdateListener` for state sync

**Key Questions to Answer:**
1. What commands exist for each format type?
2. How do we toggle heading level?
3. How do we insert/toggle lists?
4. How do we insert links (needs dialog)?

**Source:** [Lexical Commands](https://lexical.dev/docs/concepts/commands)

---

### RQ-6: How to Implement Floating Selection Toolbar?

**Why It Matters:** PR-10.x (Text Selection) — Floating toolbar appears when text is selected.

**Status:** ❓ Not Researched

**Question:** How do we detect text selection, position a floating element, and apply formatting?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          // Get DOM selection for positioning
          const domSelection = window.getSelection();
          const range = domSelection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();

          if (rect) {
            setPosition({ top: rect.top - 40, left: rect.left });
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      });
    });
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div style={{ position: "fixed", top: position.top, left: position.left }}>
      {/* Formatting buttons */}
    </div>
  );
}
```

**Key Questions to Answer:**
1. How do we handle edge cases (selection at top of viewport)?
2. How do we prevent toolbar from closing when clicking it?
3. Is there a Lexical-provided plugin for this?
4. How do we add "Ask Agent" action?

**Source:** Lexical Playground floating toolbar implementation

---

### RQ-7: How to Programmatically Insert Content?

**Why It Matters:** PR-7.5-7.6 (Agent Edit) — Agents need to insert and replace text in the editor.

**Status:** ❓ Not Researched

**Question:** How do we insert text at cursor? Replace selected text? Insert at specific position? These are needed for agent edits.

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
// Insert text at cursor
editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    selection.insertText("Agent-generated content");
  }
});

// Replace selection
editor.update(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    selection.insertText("Replacement text");
  }
});

// Insert at specific position
editor.update(() => {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode("New paragraph"));
  root.append(paragraph);
});

// Insert Markdown content
editor.update(() => {
  $convertFromMarkdownString(markdownContent, TRANSFORMERS);
});
```

**Primitive Discovered:**
- Method: `selection.insertText(text)` for cursor insert
- Method: `root.append(node)` for appending
- Function: `$convertFromMarkdownString` for Markdown import

**Key Questions to Answer:**
1. How do we insert at a specific line/position (not cursor)?
2. How do we highlight newly inserted content (for UX)?
3. Can we batch multiple edits into one undo step?
4. How do we handle inserting complex structures (lists, code blocks)?

**Source:** [Lexical Updates](https://lexical.dev/docs/concepts/updates)

---

### RQ-8: How to Implement Heading Outline?

**Why It Matters:** PR-5.x (Outline) — Left sidebar shows document structure.

**Status:** ❓ Not Researched

**Question:** How do we extract all headings from the editor? How do we scroll to a specific heading?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
function useDocumentOutline() {
  const [editor] = useLexicalComposerContext();
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const headingNodes: Heading[] = [];

        // Traverse tree to find heading nodes
        root.getChildren().forEach((node) => {
          if ($isHeadingNode(node)) {
            headingNodes.push({
              key: node.getKey(),
              text: node.getTextContent(),
              level: node.getTag(), // "h1", "h2", etc.
            });
          }
        });

        setHeadings(headingNodes);
      });
    });
  }, [editor]);

  const scrollToHeading = (key: string) => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(key);
      if (node) {
        const element = editor.getElementByKey(key);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  return { headings, scrollToHeading };
}
```

**Key Questions to Answer:**
1. How do we get the DOM element for a node?
2. Does `editor.getElementByKey()` exist?
3. How do we highlight current heading (based on scroll position)?
4. How do we handle nested headings (hierarchy)?

**Source:** Lexical tree traversal, element references

---

### RQ-9: How to Implement GFM Alert Blocks?

**Why It Matters:** PR-11.11 (Callouts) — Support for Note, Tip, Warning, Caution blocks.

**Status:** ❓ Not Researched

**Question:** GitHub Flavored Markdown has alert blocks like `> [!NOTE]`. How do we render these as styled callout blocks?

**Answer:**

```typescript
// Fill in after researching
```

**GFM Alert Syntax:**
```markdown
> [!NOTE]
> This is a note callout

> [!TIP]
> This is a tip callout

> [!WARNING]
> This is a warning callout

> [!CAUTION]
> This is a caution callout
```

**Expected Approach:**

1. Create custom `CalloutNode` extending Lexical node
2. Create Markdown transformer for GFM alert syntax
3. Render with appropriate styling

```typescript
class CalloutNode extends ElementNode {
  __calloutType: "note" | "tip" | "warning" | "caution";

  static getType(): string {
    return "callout";
  }

  // ... implementation
}

const CALLOUT_TRANSFORMER: Transformer = {
  dependencies: [CalloutNode],
  export: (node) => {
    if ($isCalloutNode(node)) {
      return `> [!${node.getCalloutType().toUpperCase()}]\n> ${node.getTextContent()}`;
    }
    return null;
  },
  regExp: /^>\s*\[!(NOTE|TIP|WARNING|CAUTION)\]\s*\n([\s\S]*?)(?=\n\n|$)/,
  replace: (textNode, match) => {
    const calloutType = match[1].toLowerCase();
    const content = match[2];
    // Create callout node
  },
  type: "element",
};
```

**Key Questions to Answer:**
1. Can we extend the quote node or need completely custom?
2. How do we style different callout types?
3. How do we handle multi-line callouts?
4. Is there an existing plugin for this?

**Source:** GFM specification, Lexical custom nodes documentation

---

### RQ-10: How to Implement Drag-and-Drop Reordering?

**Why It Matters:** PR-4.6 (Drag Handle) — Users drag blocks to reorder.

**Status:** ❓ Not Researched

**Question:** How do we enable dragging blocks? How do we show drop indicators? How do we update the tree?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Approaches:**

**Approach A: Native HTML5 Drag and Drop**
```typescript
function DraggableBlockPlugin() {
  // Make block handles draggable
  // Listen for dragover on editor
  // On drop, move node in Lexical tree
}
```

**Approach B: Use existing library (dnd-kit)**
```typescript
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
// Wrap blocks, handle reordering
```

**Approach C: Lexical's built-in drag support**
```typescript
// Check if Lexical has DraggableBlockPlugin or similar
```

**Key Questions to Answer:**
1. Does Lexical have built-in drag-drop support?
2. What's the best approach for block reordering?
3. How do we move a node in the Lexical tree?
4. How do we handle nested blocks (lists)?

**Source:** Lexical Playground, dnd-kit documentation

---

### RQ-11: How to Implement Code Blocks with Syntax Highlighting?

**Why It Matters:** PR-11.7 (Code Blocks) — Code blocks need language selection and syntax highlighting.

**Status:** ❓ Not Researched

**Question:** How do we create code blocks with language selector? How does syntax highlighting work?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (to validate):**

```typescript
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code";

// Register code highlighting with editor
useEffect(() => {
  return registerCodeHighlighting(editor);
}, [editor]);

// Code node with language
const codeNode = $createCodeNode("typescript");
```

**Note:** We already have `shiki` in the project for syntax highlighting. May be able to integrate.

**Key Questions to Answer:**
1. Does `@lexical/code` handle syntax highlighting?
2. Can we integrate our existing `shiki` setup?
3. How do we add language selector UI?
4. How does code block export to Markdown (fenced blocks)?

**Source:** [Lexical Code Package](https://lexical.dev/docs/packages/lexical-code)

---

### RQ-12: How to Implement Tables?

**Why It Matters:** PR-11.10 (Tables) — Basic Markdown table support.

**Status:** ❓ Not Researched

**Question:** How do we create and edit tables? How do they export to Markdown?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern:**

```typescript
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

// Include in config nodes
nodes: [TableNode, TableRowNode, TableCellNode, /* ... */]

// Add plugin
<TablePlugin />
```

**Markdown Table Format:**
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

**Key Questions to Answer:**
1. Does `@lexical/table` have a Markdown transformer?
2. How do we create a table from slash command?
3. How do we add/remove rows/columns?
4. What's the UI for table editing?

**Source:** [Lexical Table Package](https://lexical.dev/docs/packages/lexical-table)

---

### RQ-13: How to Track Editor State for Save Indicator?

**Why It Matters:** PR-2.5 (Save Indicator) — Show "Saving...", "Saved", "Error" states.

**Status:** ❓ Not Researched

**Question:** How do we detect changes, implement debounced saving, and track save status?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern:**

```typescript
function useSaveIndicator() {
  const [editor] = useLexicalComposerContext();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        setHasChanges(true);
      }
    });
  }, [editor]);

  // Debounced save
  useEffect(() => {
    if (!hasChanges) return;

    const timeout = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const markdown = editor.read(() => $convertToMarkdownString(TRANSFORMERS));
        await saveDocument(markdown);
        setSaveStatus("saved");
        setHasChanges(false);
      } catch (error) {
        setSaveStatus("error");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [hasChanges, editor]);

  return { saveStatus, hasChanges };
}
```

**Key Questions to Answer:**
1. What are `dirtyElements` and `dirtyLeaves`?
2. Is there a more idiomatic way to detect "dirty" state?
3. How do we handle save errors gracefully?
4. How do we implement local storage backup?

**Source:** Lexical update listeners, React patterns

---

### RQ-14: How to Parse/Generate YAML Frontmatter?

**Why It Matters:** PR-6.x (Properties) — Documents have metadata stored as YAML frontmatter.

**Status:** ❓ Not Researched

**Question:** How do we parse frontmatter from Markdown? How do we regenerate it on save?

**Answer:**

```typescript
// Fill in after researching
```

**Expected Pattern (using gray-matter):**

```typescript
import matter from "gray-matter";

// Parse Markdown with frontmatter
const { data: frontmatter, content: markdownContent } = matter(fileContent);

// frontmatter = { title: "...", tags: [...], ... }
// markdownContent = "# Heading\nContent..."

// Generate Markdown with frontmatter
const outputContent = matter.stringify(markdownContent, frontmatter);
```

**Key Questions to Answer:**
1. Does `gray-matter` work in browser and Node.js?
2. How do we handle frontmatter separately from Lexical?
3. Should frontmatter be editable in Lexical or separate UI?
4. How do we update frontmatter properties?

**Package:** `gray-matter` (popular, well-maintained)

**Source:** [gray-matter documentation](https://github.com/jonschlinkert/gray-matter)

---

## Part 2: Integration Patterns

### RQ-15: How to Structure Document Save/Load?

**Why It Matters:** Overall data flow for documents

**Status:** ❓ Not Researched

**Question:** What's the complete flow for loading a document into Lexical and saving changes back to Markdown?

**Expected Pattern:**

```typescript
// LOAD DOCUMENT
async function loadDocument(docId: string) {
  // 1. Fetch Markdown file from API
  const response = await fetch(`/api/docs/${docId}`);
  const fileContent = await response.text();

  // 2. Parse frontmatter
  const { data: frontmatter, content: markdownContent } = matter(fileContent);

  // 3. Load content into Lexical
  editor.update(() => {
    $convertFromMarkdownString(markdownContent, TRANSFORMERS);
  });

  // 4. Set frontmatter in store/state
  setFrontmatter(frontmatter);
}

// SAVE DOCUMENT
async function saveDocument(docId: string) {
  // 1. Export Lexical state to Markdown
  const markdownContent = editor.read(() => {
    return $convertToMarkdownString(TRANSFORMERS);
  });

  // 2. Combine with frontmatter
  const fileContent = matter.stringify(markdownContent, frontmatter);

  // 3. Send to API
  await fetch(`/api/docs/${docId}`, {
    method: "PUT",
    body: fileContent,
  });
}
```

**Key Questions:**
1. How do we handle version creation on save?
2. Should we diff before saving to detect real changes?
3. How do we handle concurrent edits (future)?

---

### RQ-16: How to Integrate Agent Edits with Lexical?

**Why It Matters:** PR-7.x (Agent Integration) — Agents need to modify the document.

**Status:** ❓ Not Researched

**Question:** When an agent calls `sys_doc_insert` or `sys_doc_replace`, how does that translate to Lexical operations?

**Expected Pattern:**

```typescript
// Agent tool: sys_doc_insert
async function sysDocInsert(args: { content: string; position?: "cursor" | "end" }) {
  const { content, position = "cursor" } = args;

  // Convert agent's Markdown content to Lexical nodes
  // This needs to happen on the client side where Lexical runs
  // Solution: WebSocket or SSE to send edit commands to client

  // Client-side handler:
  editor.update(() => {
    if (position === "cursor") {
      const selection = $getSelection();
      // Insert at selection
    } else {
      const root = $getRoot();
      // Append to end
    }
    $convertFromMarkdownString(content, TRANSFORMERS);
  });

  return { success: true };
}
```

**Challenge:** Agent tools run on server, but Lexical runs on client.

**Potential Solutions:**
1. Send edit commands via SSE from chat stream
2. Use WebSocket for bidirectional communication
3. Send Markdown chunks that client applies

**Key Questions:**
1. How do we bridge server-side agent to client-side Lexical?
2. How do we show "Agent is editing..." indicator?
3. How do we highlight agent-inserted content?

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Initialize editor | `LexicalComposer`, `RichTextPlugin` | @lexical/react | ❓ |
| Markdown import | `$convertFromMarkdownString` | @lexical/markdown | ❓ |
| Markdown export | `$convertToMarkdownString` | @lexical/markdown | ❓ |
| Slash commands | `LexicalTypeaheadMenuPlugin` | @lexical/react | ❓ |
| Format text | `FORMAT_TEXT_COMMAND` | lexical | ❓ |
| Track selection | `$getSelection`, `$isRangeSelection` | lexical | ❓ |
| Get headings | `$isHeadingNode`, tree traversal | @lexical/rich-text | ❓ |
| Code highlighting | `registerCodeHighlighting` | @lexical/code | ❓ |
| Tables | `TablePlugin`, `TableNode` | @lexical/table | ❓ |
| Parse frontmatter | `matter()` | gray-matter | ❓ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| TBD | TBD | TBD |

### Key Learnings

[To be filled after research]

1.
2.
3.

---

## Exit Criteria

- [ ] All RQ questions answered
- [ ] Summary table complete
- [ ] No unresolved blockers
- [ ] Key learnings documented

**Next Step:** Phase 0 Technical Spike (`02-Phase0-Technical-Spike.md`)

---

## Resources

### Official Documentation
- [Lexical Documentation](https://lexical.dev/docs/intro)
- [Lexical React](https://lexical.dev/docs/getting-started/react)
- [Lexical Markdown](https://lexical.dev/docs/packages/lexical-markdown)
- [Lexical Playground Source](https://github.com/facebook/lexical/tree/main/packages/lexical-playground)

### Package References
- [@lexical/react](https://www.npmjs.com/package/@lexical/react)
- [@lexical/markdown](https://www.npmjs.com/package/@lexical/markdown)
- [@lexical/code](https://www.npmjs.com/package/@lexical/code)
- [@lexical/table](https://www.npmjs.com/package/@lexical/table)
- [gray-matter](https://www.npmjs.com/package/gray-matter)

### Existing Code Patterns
- Records chat: `app/api/records/[tableId]/chat/`
- Agent tools: `app/api/tools/services/`
- Workforce chat: `app/api/workforce/[agentId]/chat/`

---

**Last Updated:** December 2025
