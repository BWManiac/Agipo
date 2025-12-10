# Phase 4: Block System

**Phase:** 4 of 8
**Estimated LOC:** ~1,000
**Prerequisites:** Phase 3 (Toolbar & Formatting)
**Focus:** Slash commands, block handles, drag-and-drop, block operations

---

## Overview

This phase implements Notion-style block interactions. Users will be able to:

1. Type `/` to open a command menu for inserting blocks
2. See block handles on hover for any block
3. Drag blocks to reorder them
4. Delete blocks via handle menu
5. Duplicate blocks quickly

---

## Acceptance Criteria

### AC-4.1: Slash Command Menu
- [ ] Typing `/` at start of line opens command menu
- [ ] Menu shows available block types with icons
- [ ] Arrow keys navigate menu items
- [ ] Enter selects highlighted item
- [ ] Escape closes menu
- [ ] Typing filters menu items
- [ ] Menu positioned below cursor

### AC-4.2: Block Type Commands
- [ ] `/heading1` or `/h1` inserts H1
- [ ] `/heading2` or `/h2` inserts H2
- [ ] `/heading3` or `/h3` inserts H3
- [ ] `/bullet` or `/list` inserts bullet list
- [ ] `/numbered` or `/ordered` inserts numbered list
- [ ] `/todo` or `/checkbox` inserts task list
- [ ] `/quote` inserts blockquote
- [ ] `/code` inserts code block
- [ ] `/divider` or `/hr` inserts horizontal rule
- [ ] `/callout` inserts callout/alert block

### AC-4.3: Block Handles
- [ ] Drag handle appears left of block on hover
- [ ] Handle shows drag icon (⋮⋮)
- [ ] Clicking handle opens block menu
- [ ] Handle hidden when not hovering
- [ ] Handle positioned correctly for all block types

### AC-4.4: Block Menu
- [ ] Delete option removes block
- [ ] Duplicate option copies block below
- [ ] Turn into submenu for type conversion
- [ ] Move up/down options for reordering
- [ ] Copy to clipboard option

### AC-4.5: Drag and Drop
- [ ] Dragging handle initiates drag operation
- [ ] Visual indicator shows drop position
- [ ] Blocks can be reordered within document
- [ ] Drop target highlights on dragover
- [ ] Drag preview shows block content

### AC-4.6: Empty Block Behavior
- [ ] Empty paragraph shows placeholder text
- [ ] Backspace on empty block deletes it (except first)
- [ ] Delete at end of block merges with next

### AC-4.7: Keyboard Navigation
- [ ] Enter at end of block creates new paragraph
- [ ] Backspace at start of formatted block converts to paragraph
- [ ] Tab in list increases indent
- [ ] Shift+Tab in list decreases indent

---

## File Structure

```
app/(pages)/docs/
└── components/
    └── editor/
        ├── blocks/
        │   ├── index.ts                  # Barrel export
        │   ├── BlockHandle.tsx           # Drag handle + menu
        │   ├── BlockMenu.tsx             # Context menu for block
        │   ├── BlockWrapper.tsx          # Wrapper with handle
        │   └── DragIndicator.tsx         # Drop position indicator
        ├── slash-command/
        │   ├── index.ts                  # Barrel export
        │   ├── SlashCommandMenu.tsx      # Command menu component
        │   ├── SlashCommandItem.tsx      # Individual menu item
        │   └── commands.ts               # Command definitions
        ├── plugins/
        │   ├── SlashCommandPlugin.tsx    # Handles / trigger
        │   ├── BlockHandlePlugin.tsx     # Block handle logic
        │   └── DragDropPlugin.tsx        # Drag and drop logic
        └── nodes/
            ├── CalloutNode.tsx           # Custom callout block
            └── index.ts                  # Updated node exports
```

---

## Implementation Details

### 1. Slash Command Definitions

**File:** `app/(pages)/docs/components/editor/slash-command/commands.ts`

```ts
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Minus,
  AlertCircle,
  Type,
  Table,
  Image,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  category: "text" | "list" | "media" | "advanced";
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Text blocks
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Plain text block",
    icon: Type,
    keywords: ["text", "paragraph", "p"],
    category: "text",
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    keywords: ["h1", "heading", "title", "large"],
    category: "text",
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    keywords: ["h2", "heading", "subtitle"],
    category: "text",
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    keywords: ["h3", "heading", "subheading"],
    category: "text",
  },
  {
    id: "quote",
    label: "Quote",
    description: "Capture a quote",
    icon: Quote,
    keywords: ["blockquote", "quote", "citation"],
    category: "text",
  },
  {
    id: "callout",
    label: "Callout",
    description: "Highlight important information",
    icon: AlertCircle,
    keywords: ["callout", "alert", "note", "warning", "info"],
    category: "text",
  },

  // Lists
  {
    id: "bullet",
    label: "Bullet List",
    description: "Create a simple bulleted list",
    icon: List,
    keywords: ["bullet", "list", "ul", "unordered"],
    category: "list",
  },
  {
    id: "numbered",
    label: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    keywords: ["numbered", "list", "ol", "ordered"],
    category: "list",
  },
  {
    id: "todo",
    label: "To-do List",
    description: "Track tasks with checkboxes",
    icon: CheckSquare,
    keywords: ["todo", "task", "checkbox", "check"],
    category: "list",
  },

  // Advanced
  {
    id: "code",
    label: "Code Block",
    description: "Add a code snippet",
    icon: Code2,
    keywords: ["code", "snippet", "pre", "programming"],
    category: "advanced",
  },
  {
    id: "divider",
    label: "Divider",
    description: "Visually divide blocks",
    icon: Minus,
    keywords: ["divider", "hr", "line", "separator"],
    category: "advanced",
  },
  {
    id: "table",
    label: "Table",
    description: "Add a table",
    icon: Table,
    keywords: ["table", "grid", "spreadsheet"],
    category: "advanced",
  },
  {
    id: "image",
    label: "Image",
    description: "Upload or embed an image",
    icon: Image,
    keywords: ["image", "picture", "photo", "img"],
    category: "media",
  },
];

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;

  const lowerQuery = query.toLowerCase();

  return SLASH_COMMANDS.filter((cmd) => {
    return (
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some((kw) => kw.includes(lowerQuery))
    );
  });
}

export function getCommandById(id: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find((cmd) => cmd.id === id);
}
```

---

### 2. Slash Command Menu Component

**File:** `app/(pages)/docs/components/editor/slash-command/index.ts`

```ts
export { SlashCommandMenu } from "./SlashCommandMenu";
export { SlashCommandItem } from "./SlashCommandItem";
export { SLASH_COMMANDS, filterCommands, getCommandById } from "./commands";
export type { SlashCommand } from "./commands";
```

**File:** `app/(pages)/docs/components/editor/slash-command/SlashCommandMenu.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { filterCommands, type SlashCommand } from "./commands";
import { SlashCommandItem } from "./SlashCommandItem";
import { cn } from "@/lib/utils";

interface SlashCommandMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  query,
  position,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const filteredCommands = filterCommands(query);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const selectedItem = menu.children[selectedIndex] as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) {
    return (
      <div
        className="fixed z-50 bg-popover border rounded-lg shadow-lg p-3 text-sm text-muted-foreground"
        style={{ top: position.top, left: position.left }}
      >
        No results found
      </div>
    );
  }

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  const categoryLabels: Record<string, string> = {
    text: "Text",
    list: "Lists",
    media: "Media",
    advanced: "Advanced",
  };

  let flatIndex = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border rounded-lg shadow-lg py-2 w-72 max-h-80 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {Object.entries(groupedCommands).map(([category, commands]) => (
        <div key={category}>
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {categoryLabels[category] || category}
          </div>
          {commands.map((command) => {
            const currentIndex = flatIndex++;
            return (
              <SlashCommandItem
                key={command.id}
                command={command}
                isSelected={currentIndex === selectedIndex}
                onClick={() => onSelect(command)}
                onMouseEnter={() => setSelectedIndex(currentIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/editor/slash-command/SlashCommandItem.tsx`

```tsx
"use client";

import type { SlashCommand } from "./commands";
import { cn } from "@/lib/utils";

interface SlashCommandItemProps {
  command: SlashCommand;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function SlashCommandItem({
  command,
  isSelected,
  onClick,
  onMouseEnter,
}: SlashCommandItemProps) {
  const Icon = command.icon;

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{command.label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {command.description}
        </div>
      </div>
    </button>
  );
}
```

---

### 3. Slash Command Plugin

**File:** `app/(pages)/docs/components/editor/plugins/SlashCommandPlugin.tsx`

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  TextNode,
  $getNodeByKey,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import {
  $createListNode,
  $createListItemNode,
  ListNode,
} from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import { $createHorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { $setBlocksType } from "@lexical/selection";

import { SlashCommandMenu } from "../slash-command/SlashCommandMenu";
import type { SlashCommand } from "../slash-command/commands";
import { $createCalloutNode } from "../nodes/CalloutNode";

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [triggerOffset, setTriggerOffset] = useState<number | null>(null);

  // Listen for "/" key to trigger menu
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key !== "/" || isOpen) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        // Only trigger at start of line or after whitespace
        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if (anchorNode instanceof TextNode) {
          const textContent = anchorNode.getTextContent();
          const offset = anchor.offset;

          // Check if we're at start or after whitespace
          if (offset > 0 && textContent[offset - 1] !== " ") {
            return false;
          }
        }

        // Get cursor position for menu placement
        const nativeSelection = window.getSelection();
        if (!nativeSelection || nativeSelection.rangeCount === 0) return false;

        const range = nativeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX,
        });
        setTriggerOffset(selection.anchor.offset);
        setQuery("");
        setIsOpen(true);

        return false; // Let the "/" be typed
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isOpen]);

  // Track query after "/" is typed
  useEffect(() => {
    if (!isOpen) return;

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsOpen(false);
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if (!(anchorNode instanceof TextNode)) {
          setIsOpen(false);
          return;
        }

        const textContent = anchorNode.getTextContent();
        const slashIndex = textContent.lastIndexOf("/");

        if (slashIndex === -1) {
          setIsOpen(false);
          return;
        }

        // Extract query after "/"
        const newQuery = textContent.slice(slashIndex + 1, anchor.offset);

        // Close if space is typed (user is done)
        if (newQuery.includes(" ")) {
          setIsOpen(false);
          return;
        }

        setQuery(newQuery);
      });
    });
  }, [editor, isOpen]);

  const handleSelect = useCallback(
    (command: SlashCommand) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Remove the "/" and query text
        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if (anchorNode instanceof TextNode) {
          const textContent = anchorNode.getTextContent();
          const slashIndex = textContent.lastIndexOf("/");

          if (slashIndex !== -1) {
            // Delete from slash to current position
            const startOffset = slashIndex;
            const endOffset = anchor.offset;

            anchorNode.spliceText(startOffset, endOffset - startOffset, "");
          }
        }

        // Insert the selected block type
        switch (command.id) {
          case "paragraph":
            $setBlocksType(selection, () => $createParagraphNode());
            break;

          case "heading1":
            $setBlocksType(selection, () => $createHeadingNode("h1"));
            break;

          case "heading2":
            $setBlocksType(selection, () => $createHeadingNode("h2"));
            break;

          case "heading3":
            $setBlocksType(selection, () => $createHeadingNode("h3"));
            break;

          case "quote":
            $setBlocksType(selection, () => $createQuoteNode());
            break;

          case "callout":
            $setBlocksType(selection, () => $createCalloutNode("info"));
            break;

          case "bullet": {
            const listNode = $createListNode("bullet");
            const listItem = $createListItemNode();
            listNode.append(listItem);
            selection.insertNodes([listNode]);
            break;
          }

          case "numbered": {
            const listNode = $createListNode("number");
            const listItem = $createListItemNode();
            listNode.append(listItem);
            selection.insertNodes([listNode]);
            break;
          }

          case "todo": {
            const listNode = $createListNode("check");
            const listItem = $createListItemNode();
            listNode.append(listItem);
            selection.insertNodes([listNode]);
            break;
          }

          case "code":
            $setBlocksType(selection, () => $createCodeNode());
            break;

          case "divider":
            selection.insertNodes([$createHorizontalRuleNode()]);
            break;

          case "table":
            // Table implementation deferred to later phase
            console.log("Table not yet implemented");
            break;

          case "image":
            // Image implementation deferred to later phase
            console.log("Image not yet implemented");
            break;
        }
      });

      setIsOpen(false);
      setQuery("");
    },
    [editor]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <SlashCommandMenu
      query={query}
      position={position}
      onSelect={handleSelect}
      onClose={handleClose}
    />,
    document.body
  );
}
```

---

### 4. Block Handle Components

**File:** `app/(pages)/docs/components/editor/blocks/index.ts`

```ts
export { BlockHandle } from "./BlockHandle";
export { BlockMenu } from "./BlockMenu";
export { BlockWrapper } from "./BlockWrapper";
export { DragIndicator } from "./DragIndicator";
```

**File:** `app/(pages)/docs/components/editor/blocks/BlockHandle.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BlockHandleProps {
  onDragStart: (e: React.DragEvent) => void;
  onMenuOpen: () => void;
  onAddBlock: () => void;
  isVisible: boolean;
  className?: string;
}

export const BlockHandle = forwardRef<HTMLDivElement, BlockHandleProps>(
  ({ onDragStart, onMenuOpen, onAddBlock, isVisible, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute -left-16 top-0 flex items-center gap-0.5 transition-opacity",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
      >
        <TooltipProvider delayDuration={300}>
          {/* Add Block Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onAddBlock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Click to add block below</p>
            </TooltipContent>
          </Tooltip>

          {/* Drag Handle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                draggable
                onDragStart={onDragStart}
                onClick={onMenuOpen}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Drag to move • Click for options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

BlockHandle.displayName = "BlockHandle";
```

**File:** `app/(pages)/docs/components/editor/blocks/BlockMenu.tsx`

```tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  ArrowRightLeft,
  Clipboard,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  List,
} from "lucide-react";

interface BlockMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCopyToClipboard: () => void;
  onTurnInto: (type: string) => void;
  trigger: React.ReactNode;
}

export function BlockMenu({
  open,
  onOpenChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onCopyToClipboard,
  onTurnInto,
  trigger,
}: BlockMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Turn into
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onClick={() => onTurnInto("paragraph")}>
              <Type className="h-4 w-4 mr-2" />
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnInto("h1")}>
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnInto("h2")}>
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnInto("h3")}>
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTurnInto("quote")}>
              <Quote className="h-4 w-4 mr-2" />
              Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnInto("code")}>
              <Code2 className="h-4 w-4 mr-2" />
              Code Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTurnInto("bullet")}>
              <List className="h-4 w-4 mr-2" />
              Bullet List
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onMoveUp}>
          <MoveUp className="h-4 w-4 mr-2" />
          Move up
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onMoveDown}>
          <MoveDown className="h-4 w-4 mr-2" />
          Move down
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onCopyToClipboard}>
          <Clipboard className="h-4 w-4 mr-2" />
          Copy to clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**File:** `app/(pages)/docs/components/editor/blocks/DragIndicator.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils";

interface DragIndicatorProps {
  position: "above" | "below";
  isVisible: boolean;
}

export function DragIndicator({ position, isVisible }: DragIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-50",
        position === "above" ? "-top-1" : "-bottom-1"
      )}
    >
      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-blue-500" />
      <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-blue-500" />
    </div>
  );
}
```

---

### 5. Block Handle Plugin

**File:** `app/(pages)/docs/components/editor/plugins/BlockHandlePlugin.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $isParagraphNode,
  LexicalNode,
  NodeKey,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";

import { BlockHandle } from "../blocks/BlockHandle";
import { BlockMenu } from "../blocks/BlockMenu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";

interface BlockHandleState {
  nodeKey: NodeKey;
  top: number;
  left: number;
}

export function BlockHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [hoveredBlock, setHoveredBlock] = useState<BlockHandleState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const editorRootRef = useRef<HTMLElement | null>(null);

  // Get editor root element
  useEffect(() => {
    editorRootRef.current = editor.getRootElement();
  }, [editor]);

  // Track mouse position to show handles
  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (menuOpen) return; // Don't update while menu is open

      const target = e.target as HTMLElement;

      // Find the top-level block element
      let blockElement: HTMLElement | null = target;
      while (blockElement && blockElement !== root) {
        const key = blockElement.getAttribute("data-lexical-node-key");
        if (key) {
          // Check if this is a top-level block (direct child of root)
          if (blockElement.parentElement === root) {
            const rect = blockElement.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();

            setHoveredBlock({
              nodeKey: key,
              top: rect.top - rootRect.top + root.scrollTop,
              left: 0,
            });
            return;
          }
        }
        blockElement = blockElement.parentElement;
      }

      setHoveredBlock(null);
    };

    const handleMouseLeave = () => {
      if (!menuOpen) {
        setHoveredBlock(null);
      }
    };

    root.addEventListener("mousemove", handleMouseMove);
    root.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      root.removeEventListener("mousemove", handleMouseMove);
      root.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor, menuOpen]);

  const handleDelete = useCallback(() => {
    if (!hoveredBlock) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        node.remove();
      }
    });

    setMenuOpen(false);
    setHoveredBlock(null);
  }, [editor, hoveredBlock]);

  const handleDuplicate = useCallback(() => {
    if (!hoveredBlock) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        const clone = node.clone();
        node.insertAfter(clone);
      }
    });

    setMenuOpen(false);
  }, [editor, hoveredBlock]);

  const handleMoveUp = useCallback(() => {
    if (!hoveredBlock) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        const prev = node.getPreviousSibling();
        if (prev) {
          prev.insertBefore(node);
        }
      }
    });

    setMenuOpen(false);
  }, [editor, hoveredBlock]);

  const handleMoveDown = useCallback(() => {
    if (!hoveredBlock) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        const next = node.getNextSibling();
        if (next) {
          next.insertAfter(node);
        }
      }
    });

    setMenuOpen(false);
  }, [editor, hoveredBlock]);

  const handleCopyToClipboard = useCallback(() => {
    if (!hoveredBlock) return;

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        const textContent = node.getTextContent();
        navigator.clipboard.writeText(textContent);
      }
    });

    setMenuOpen(false);
  }, [editor, hoveredBlock]);

  const handleTurnInto = useCallback(
    (type: string) => {
      if (!hoveredBlock) return;

      editor.update(() => {
        const node = $getNodeByKey(hoveredBlock.nodeKey);
        if (!node) return;

        // Select the node first
        node.selectStart();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        switch (type) {
          case "paragraph":
            $setBlocksType(selection, () => $createParagraphNode());
            break;
          case "h1":
            $setBlocksType(selection, () => $createHeadingNode("h1"));
            break;
          case "h2":
            $setBlocksType(selection, () => $createHeadingNode("h2"));
            break;
          case "h3":
            $setBlocksType(selection, () => $createHeadingNode("h3"));
            break;
          case "quote":
            $setBlocksType(selection, () => $createQuoteNode());
            break;
          case "code":
            $setBlocksType(selection, () => $createCodeNode());
            break;
          case "bullet": {
            const listNode = $createListNode("bullet");
            const listItem = $createListItemNode();
            const textContent = node.getTextContent();
            listItem.append($createParagraphNode().append(...node.getChildren()));
            listNode.append(listItem);
            node.replace(listNode);
            break;
          }
        }
      });

      setMenuOpen(false);
    },
    [editor, hoveredBlock]
  );

  const handleAddBlock = useCallback(() => {
    if (!hoveredBlock) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlock.nodeKey);
      if (node) {
        const newParagraph = $createParagraphNode();
        node.insertAfter(newParagraph);
        newParagraph.selectStart();
      }
    });
  }, [editor, hoveredBlock]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!hoveredBlock) return;

      e.dataTransfer.setData("text/plain", hoveredBlock.nodeKey);
      e.dataTransfer.effectAllowed = "move";
    },
    [hoveredBlock]
  );

  if (!hoveredBlock || !editorRootRef.current) return null;

  return createPortal(
    <div
      className="absolute"
      style={{
        top: hoveredBlock.top,
        left: -64,
        zIndex: 40,
      }}
    >
      <BlockMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onCopyToClipboard={handleCopyToClipboard}
        onTurnInto={handleTurnInto}
        trigger={
          <DropdownMenuTrigger asChild>
            <div>
              <BlockHandle
                ref={handleRef}
                isVisible={true}
                onDragStart={handleDragStart}
                onMenuOpen={() => setMenuOpen(true)}
                onAddBlock={handleAddBlock}
              />
            </div>
          </DropdownMenuTrigger>
        }
      />
    </div>,
    editorRootRef.current
  );
}
```

---

### 6. Callout Node (Custom Block)

**File:** `app/(pages)/docs/components/editor/nodes/CalloutNode.tsx`

```tsx
import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutType = "info" | "warning" | "success" | "error";

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
    content: string;
  },
  SerializedLexicalNode
>;

export class CalloutNode extends DecoratorNode<ReactNode> {
  __calloutType: CalloutType;
  __content: string;

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__content, node.__key);
  }

  constructor(calloutType: CalloutType = "info", content: string = "", key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
    this.__content = content;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "callout-wrapper";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): ReactNode {
    return (
      <CalloutComponent
        type={this.__calloutType}
        content={this.__content}
        nodeKey={this.__key}
      />
    );
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    return $createCalloutNode(serializedNode.calloutType, serializedNode.content);
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: "callout",
      calloutType: this.__calloutType,
      content: this.__content,
      version: 1,
    };
  }

  getTextContent(): string {
    return this.__content;
  }
}

export function $createCalloutNode(
  type: CalloutType = "info",
  content: string = ""
): CalloutNode {
  return new CalloutNode(type, content);
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}

// React component for rendering
interface CalloutComponentProps {
  type: CalloutType;
  content: string;
  nodeKey: NodeKey;
}

function CalloutComponent({ type, content, nodeKey }: CalloutComponentProps) {
  const icons: Record<CalloutType, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: AlertCircle,
  };

  const styles: Record<CalloutType, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border my-4",
        styles[type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{content || "Type your callout content here..."}</p>
      </div>
    </div>
  );
}
```

---

### 7. Update Node Exports

**File:** `app/(pages)/docs/components/editor/nodes/index.ts` (Updated)

```ts
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { CalloutNode } from "./CalloutNode";
import type { Klass, LexicalNode } from "lexical";

export { CalloutNode, $createCalloutNode, $isCalloutNode } from "./CalloutNode";
export type { CalloutType, SerializedCalloutNode } from "./CalloutNode";

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
  CalloutNode,
];
```

---

### 8. Update Editor Container

**File:** `app/(pages)/docs/components/editor/EditorContainer.tsx` (Updated)

```tsx
"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { editorTheme } from "./themes/editorTheme";
import { editorNodes } from "./nodes";
import { EditorContent } from "./EditorContent";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { MarkdownPlugin } from "./plugins/MarkdownPlugin";
import { OnChangePlugin } from "./plugins/OnChangePlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { KeyboardShortcutsPlugin } from "./plugins/KeyboardShortcutsPlugin";
import { LinkPlugin } from "./plugins/LinkPlugin";
import { SlashCommandPlugin } from "./plugins/SlashCommandPlugin";
import { BlockHandlePlugin } from "./plugins/BlockHandlePlugin";

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
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-auto relative">
          <RichTextPlugin
            contentEditable={<EditorContent />}
            placeholder={<EditorPlaceholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Core Plugins */}
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownPlugin initialContent={initialContent} />
        <OnChangePlugin />
        <AutoSavePlugin debounceMs={1500} />

        {/* List Plugins */}
        <ListPlugin />
        <CheckListPlugin />

        {/* Toolbar & Formatting Plugins */}
        <FloatingToolbarPlugin />
        <KeyboardShortcutsPlugin />
        <LinkPlugin />

        {/* Block System Plugins */}
        <SlashCommandPlugin />
        <BlockHandlePlugin />
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

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Slash Commands**
   - Type `/` at start of empty line
   - Verify menu appears below cursor
   - Type to filter (e.g., `/head` filters to headings)
   - Use arrow keys to navigate
   - Press Enter to select
   - Press Escape to close
   - Verify `/h1`, `/bullet`, `/code`, `/quote` all work

2. **Test Block Handles**
   - Hover over any block
   - Verify handle appears on the left
   - Click handle, verify menu opens
   - Test Delete → block removed
   - Test Duplicate → block copied below
   - Test Move Up/Down → reorders blocks
   - Test Turn Into submenu → converts block type

3. **Test Add Block Button**
   - Hover to reveal handle
   - Click the + button
   - Verify new paragraph added below
   - Verify cursor moves to new block

4. **Test Lists**
   - Type `/bullet` → bullet list created
   - Type `/numbered` → numbered list created
   - Type `/todo` → checkbox list created
   - Press Tab → increases indent
   - Press Shift+Tab → decreases indent

5. **Test Callout Block**
   - Type `/callout`
   - Verify styled callout block appears
   - Verify icon displays correctly

---

## Dependencies

### New npm Packages
None required beyond Phase 2 packages.

### Lexical Plugins to Enable
```tsx
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
```

---

## Next Phase

**Phase 5: Chat Integration** will add:
- Chat sidebar with agent conversation
- Agent document tools (read, insert, replace)
- Real-time document updates from agent
- Chat history persistence

---

## Notes

- Slash commands filter in real-time as user types
- Block handles use `data-lexical-node-key` to identify blocks
- The CalloutNode is a decorator node for custom rendering
- Table and Image commands are stubbed for future implementation
- Block menu reuses ShadCN DropdownMenu for consistency
