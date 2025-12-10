# Phase 3: Toolbar & Formatting

**Phase:** 3 of 8
**Estimated LOC:** ~800
**Prerequisites:** Phase 2 (Editor Core)
**Focus:** Floating selection toolbar, text formatting commands, link insertion

---

## Overview

This phase adds rich text formatting capabilities through a floating toolbar that appears when text is selected. Users will be able to:

1. Select text and see a floating toolbar
2. Apply bold, italic, strikethrough, and code formatting
3. Create and edit hyperlinks
4. Change heading levels
5. Use keyboard shortcuts for all formatting

---

## Acceptance Criteria

### AC-3.1: Floating Selection Toolbar
- [ ] Toolbar appears when text is selected
- [ ] Toolbar disappears when selection is cleared
- [ ] Toolbar positioned above selection (with flip if near top)
- [ ] Toolbar animates in/out smoothly
- [ ] Toolbar doesn't appear for collapsed selection (cursor only)

### AC-3.2: Text Formatting Buttons
- [ ] Bold button toggles bold on selection
- [ ] Italic button toggles italic on selection
- [ ] Strikethrough button toggles strikethrough
- [ ] Inline code button toggles code formatting
- [ ] Active state shown when format is applied
- [ ] Multiple formats can be combined

### AC-3.3: Keyboard Shortcuts
- [ ] `Cmd/Ctrl + B` toggles bold
- [ ] `Cmd/Ctrl + I` toggles italic
- [ ] `Cmd/Ctrl + Shift + S` toggles strikethrough
- [ ] `Cmd/Ctrl + E` toggles inline code
- [ ] `Cmd/Ctrl + K` opens link dialog
- [ ] Shortcuts work without selection (applies to word under cursor)

### AC-3.4: Link Insertion
- [ ] Link button opens insertion dialog
- [ ] Dialog has URL input field
- [ ] Dialog has text preview (from selection)
- [ ] Enter submits, Escape cancels
- [ ] Invalid URLs show validation error
- [ ] Existing links can be edited
- [ ] Links can be removed

### AC-3.5: Heading Selector
- [ ] Dropdown shows heading levels (H1-H6) and paragraph
- [ ] Current heading level is indicated
- [ ] Selecting level converts block
- [ ] Works on any block containing selection

### AC-3.6: Turn Into Dropdown
- [ ] Dropdown appears with block type options
- [ ] Options: Paragraph, H1, H2, H3, Quote, Code Block
- [ ] Current block type is indicated
- [ ] Selection converts block type

### AC-3.7: Accessibility
- [ ] All buttons have aria-labels
- [ ] Toolbar is keyboard navigable
- [ ] Focus trapped within link dialog
- [ ] Screen reader announces format changes

---

## File Structure

```
app/(pages)/docs/
└── components/
    └── editor/
        ├── toolbar/
        │   ├── index.ts                    # Barrel export
        │   ├── FloatingToolbar.tsx         # Main toolbar container
        │   ├── FormatButton.tsx            # Individual format button
        │   ├── LinkButton.tsx              # Link button with dialog
        │   ├── HeadingDropdown.tsx         # Heading level selector
        │   ├── TurnIntoDropdown.tsx        # Block type converter
        │   └── ToolbarDivider.tsx          # Visual separator
        └── plugins/
            ├── FloatingToolbarPlugin.tsx   # Toolbar positioning logic
            └── KeyboardShortcutsPlugin.tsx # Format shortcuts
```

---

## Implementation Details

### 1. Floating Toolbar Plugin

**File:** `app/(pages)/docs/components/editor/plugins/FloatingToolbarPlugin.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { FloatingToolbar } from "../toolbar/FloatingToolbar";

const VERTICAL_OFFSET = 10;

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false);
      return;
    }

    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setIsVisible(false);
      return;
    }

    // Calculate toolbar position
    const toolbarWidth = toolbarRef.current?.offsetWidth || 300;
    const toolbarHeight = toolbarRef.current?.offsetHeight || 40;

    let top = rect.top - toolbarHeight - VERTICAL_OFFSET + window.scrollY;
    let left = rect.left + rect.width / 2 - toolbarWidth / 2 + window.scrollX;

    // Flip below if too close to top
    if (top < 10) {
      top = rect.bottom + VERTICAL_OFFSET + window.scrollY;
    }

    // Keep within viewport horizontally
    left = Math.max(10, Math.min(left, window.innerWidth - toolbarWidth - 10));

    setPosition({ top, left });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  // Also update on editor state changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Hide on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        // Let Lexical handle the click first
        setTimeout(() => {
          editor.getEditorState().read(() => {
            updateToolbar();
          });
        }, 0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editor, updateToolbar]);

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <FloatingToolbar />
    </div>,
    document.body
  );
}
```

---

### 2. Floating Toolbar Component

**File:** `app/(pages)/docs/components/editor/toolbar/index.ts`

```ts
export { FloatingToolbar } from "./FloatingToolbar";
export { FormatButton } from "./FormatButton";
export { LinkButton } from "./LinkButton";
export { HeadingDropdown } from "./HeadingDropdown";
export { TurnIntoDropdown } from "./TurnIntoDropdown";
export { ToolbarDivider } from "./ToolbarDivider";
```

**File:** `app/(pages)/docs/components/editor/toolbar/FloatingToolbar.tsx`

```tsx
"use client";

import { FormatButton } from "./FormatButton";
import { LinkButton } from "./LinkButton";
import { TurnIntoDropdown } from "./TurnIntoDropdown";
import { ToolbarDivider } from "./ToolbarDivider";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
} from "lucide-react";

export function FloatingToolbar() {
  return (
    <div className="flex items-center gap-0.5 bg-popover border rounded-lg shadow-lg p-1">
      {/* Turn Into Dropdown */}
      <TurnIntoDropdown />

      <ToolbarDivider />

      {/* Text Formatting */}
      <FormatButton
        format="bold"
        icon={Bold}
        label="Bold"
        shortcut="⌘B"
      />
      <FormatButton
        format="italic"
        icon={Italic}
        label="Italic"
        shortcut="⌘I"
      />
      <FormatButton
        format="strikethrough"
        icon={Strikethrough}
        label="Strikethrough"
        shortcut="⌘⇧S"
      />
      <FormatButton
        format="code"
        icon={Code}
        label="Inline Code"
        shortcut="⌘E"
      />

      <ToolbarDivider />

      {/* Link */}
      <LinkButton />
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/editor/toolbar/ToolbarDivider.tsx`

```tsx
export function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}
```

---

### 3. Format Button Component

**File:** `app/(pages)/docs/components/editor/toolbar/FormatButton.tsx`

```tsx
"use client";

import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, TextFormatType } from "lexical";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useTextFormatState } from "../hooks/useTextFormatState";

interface FormatButtonProps {
  format: TextFormatType;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
}

export function FormatButton({ format, icon: Icon, label, shortcut }: FormatButtonProps) {
  const [editor] = useLexicalComposerContext();
  const formatState = useTextFormatState();

  const isActive = formatState[format];

  const handleClick = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor, format]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={handleClick}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 4. Format State Hook

**File:** `app/(pages)/docs/components/editor/hooks/useTextFormatState.ts`

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_NORMAL,
} from "lexical";

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
}

const initialState: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
};

export function useTextFormatState(): FormatState {
  const [editor] = useLexicalComposerContext();
  const [formatState, setFormatState] = useState<FormatState>(initialState);

  const updateState = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      setFormatState(initialState);
      return;
    }

    setFormatState({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
      strikethrough: selection.hasFormat("strikethrough"),
      code: selection.hasFormat("code"),
    });
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateState();
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );
  }, [editor, updateState]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateState();
      });
    });
  }, [editor, updateState]);

  return formatState;
}
```

---

### 5. Link Button with Dialog

**File:** `app/(pages)/docs/components/editor/toolbar/LinkButton.tsx`

```tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Unlink, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function LinkButton() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [isLink, setIsLink] = useState(false);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);

  // Check if selection is a link
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            setIsLink(false);
            setExistingUrl(null);
            return;
          }

          const node = selection.anchor.getNode();
          const parent = node.getParent();
          const linkNode = $isLinkNode(parent) ? parent : $isLinkNode(node) ? node : null;

          if (linkNode) {
            setIsLink(true);
            setExistingUrl(linkNode.getURL());
          } else {
            setIsLink(false);
            setExistingUrl(null);
          }
        });
      })
    );
  }, [editor]);

  const handleOpen = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setSelectedText(selection.getTextContent());
        setUrl(existingUrl || "");
      }
    });
    setIsOpen(true);
  }, [editor, existingUrl]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!url) {
        // Remove link if URL is empty
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else {
        // Validate URL
        let finalUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          finalUrl = `https://${url}`;
        }

        editor.dispatchCommand(TOGGLE_LINK_COMMAND, finalUrl);
      }

      setIsOpen(false);
      setUrl("");
    },
    [editor, url]
  );

  const handleRemoveLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setIsOpen(false);
    setUrl("");
  }, [editor]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  isLink && "bg-accent text-accent-foreground"
                )}
                onClick={handleOpen}
                aria-label="Insert link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>{isLink ? "Edit link" : "Insert link"}</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘K</kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-80" align="start">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          {selectedText && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Text:</span> {selectedText}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLink && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLink}
                    className="text-destructive"
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  {existingUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={existingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </a>
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {isLink ? "Update" : "Insert"}
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
```

---

### 6. Turn Into Dropdown

**File:** `app/(pages)/docs/components/editor/toolbar/TurnIntoDropdown.tsx`

```tsx
"use client";

import { useCallback, useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BlockType = "paragraph" | "h1" | "h2" | "h3" | "quote" | "code";

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "h1", label: "Heading 1", icon: Heading1 },
  { type: "h2", label: "Heading 2", icon: Heading2 },
  { type: "h3", label: "Heading 3", icon: Heading3 },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "code", label: "Code Block", icon: Code2 },
];

export function TurnIntoDropdown() {
  const [editor] = useLexicalComposerContext();
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>("paragraph");

  // Detect current block type
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const element =
          anchorNode.getKey() === "root"
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();

        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setCurrentBlockType(tag as BlockType);
        } else if ($isCodeNode(element)) {
          setCurrentBlockType("code");
        } else if (element.getType() === "quote") {
          setCurrentBlockType("quote");
        } else {
          setCurrentBlockType("paragraph");
        }
      });
    });
  }, [editor]);

  const handleBlockChange = useCallback(
    (blockType: BlockType) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        if (blockType === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else if (blockType === "h1" || blockType === "h2" || blockType === "h3") {
          $setBlocksType(selection, () => $createHeadingNode(blockType as HeadingTagType));
        } else if (blockType === "quote") {
          $setBlocksType(selection, () => $createQuoteNode());
        } else if (blockType === "code") {
          $setBlocksType(selection, () => $createCodeNode());
        }
      });
    },
    [editor]
  );

  const currentType = BLOCK_TYPES.find((bt) => bt.type === currentBlockType);
  const CurrentIcon = currentType?.icon || Type;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <CurrentIcon className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">{currentType?.label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {BLOCK_TYPES.map((blockType, index) => {
          const Icon = blockType.icon;
          const isActive = currentBlockType === blockType.type;

          return (
            <div key={blockType.type}>
              {index === 4 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleBlockChange(blockType.type)}
                className={cn(isActive && "bg-accent")}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span>{blockType.label}</span>
                {isActive && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 7. Keyboard Shortcuts Plugin

**File:** `app/(pages)/docs/components/editor/plugins/KeyboardShortcutsPlugin.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const isMod = event.metaKey || event.ctrlKey;

        if (!isMod) return false;

        // Bold: Cmd/Ctrl + B
        if (event.key === "b") {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          return true;
        }

        // Italic: Cmd/Ctrl + I
        if (event.key === "i") {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          return true;
        }

        // Inline Code: Cmd/Ctrl + E
        if (event.key === "e") {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
          return true;
        }

        // Strikethrough: Cmd/Ctrl + Shift + S
        if (event.key === "s" && event.shiftKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          return true;
        }

        // Link: Cmd/Ctrl + K
        if (event.key === "k") {
          event.preventDefault();
          // Dispatch custom event to open link dialog
          const customEvent = new CustomEvent("openLinkDialog");
          document.dispatchEvent(customEvent);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
```

---

### 8. Link Plugin

**File:** `app/(pages)/docs/components/editor/plugins/LinkPlugin.tsx`

```tsx
"use client";

import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";

const URL_REGEX =
  /((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)))/;

function validateUrl(url: string): boolean {
  return URL_REGEX.test(url) || url.startsWith("/");
}

export function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}
```

---

### 9. Update Editor Container

**File:** `app/(pages)/docs/components/editor/EditorContainer.tsx` (Updated)

```tsx
"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
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
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { KeyboardShortcutsPlugin } from "./plugins/KeyboardShortcutsPlugin";
import { LinkPlugin } from "./plugins/LinkPlugin";

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
        <div className="flex-1 overflow-auto">
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

        {/* Toolbar & Formatting Plugins */}
        <FloatingToolbarPlugin />
        <KeyboardShortcutsPlugin />
        <LinkPlugin />
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

### 10. Hooks Barrel Export

**File:** `app/(pages)/docs/components/editor/hooks/index.ts`

```ts
export { useTextFormatState } from "./useTextFormatState";
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Selection Toolbar**
   - Open a document with text
   - Select some text with mouse
   - Verify toolbar appears above selection
   - Clear selection, verify toolbar disappears
   - Select text near top of viewport, verify toolbar flips below

2. **Test Text Formatting**
   - Select text and click Bold button
   - Verify text becomes bold and button shows active state
   - Repeat for Italic, Strikethrough, Code
   - Apply multiple formats to same selection
   - Verify formats persist after deselection

3. **Test Keyboard Shortcuts**
   - Press Cmd+B with text selected → bold
   - Press Cmd+I with text selected → italic
   - Press Cmd+Shift+S with text selected → strikethrough
   - Press Cmd+E with text selected → inline code
   - Press Cmd+K with text selected → link dialog

4. **Test Link Insertion**
   - Select text, click Link button
   - Enter URL, click Insert
   - Verify text becomes linked
   - Click on link, verify Edit dialog appears
   - Test Remove link button
   - Test Open button (opens in new tab)

5. **Test Turn Into Dropdown**
   - Click on a paragraph
   - Open Turn Into dropdown
   - Select "Heading 1" → verify conversion
   - Open dropdown again, verify H1 is checked
   - Convert to Quote, Code Block
   - Verify all conversions work correctly

6. **Test Edge Cases**
   - Select text across multiple paragraphs
   - Apply formatting to partial words
   - Test with very long selections
   - Test with already formatted text

---

## Dependencies

### New npm Packages
None - all packages were installed in Phase 2.

### ShadCN Components Required
```bash
npx shadcn@latest add dropdown-menu popover tooltip
```

---

## Next Phase

**Phase 4: Block System** will add:
- Slash command menu (`/` trigger)
- Block handles on hover
- Drag-and-drop reordering
- Block deletion
- Block insertion shortcuts

---

## Notes

- The floating toolbar uses `createPortal` to render at document root for proper z-index
- Position calculation includes scroll offset for accurate placement
- Format state is updated on both selection change and editor update for reliability
- Link validation automatically prepends `https://` for convenience
- The Turn Into dropdown uses Lexical's `$setBlocksType` for atomic block conversions
