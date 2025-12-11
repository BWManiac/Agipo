# Phase 8: Polish & Optimization

**Phase:** 8 of 8
**Estimated LOC:** ~600
**Prerequisites:** Phase 7 (Version History)
**Focus:** Keyboard shortcuts help, performance, error boundaries, loading states, final polish

---

## Overview

This final phase focuses on polish and user experience improvements:

1. Keyboard shortcuts help dialog
2. Performance optimizations
3. Error boundaries for graceful error handling
4. Loading skeletons and states
5. Empty states and onboarding hints
6. Final UI refinements

---

## Acceptance Criteria

### AC-8.1: Keyboard Shortcuts Help
- [ ] `?` or `Cmd/Ctrl + /` opens shortcuts dialog
- [ ] Dialog shows all available shortcuts grouped by category
- [ ] Shortcuts include: formatting, navigation, actions
- [ ] Dialog is dismissable via Escape or click outside

### AC-8.2: Loading States
- [ ] Document list shows skeleton while loading
- [ ] Editor shows skeleton while document loads
- [ ] History panel shows loading spinner
- [ ] Chat shows typing indicator

### AC-8.3: Error Boundaries
- [ ] Editor wrapped in error boundary
- [ ] Chat wrapped in error boundary
- [ ] Error states show retry button
- [ ] Errors logged for debugging

### AC-8.4: Empty States
- [ ] Empty document catalog shows helpful guidance
- [ ] Empty outline shows "Add headings" hint
- [ ] Empty chat shows conversation starters
- [ ] Empty history explains versioning

### AC-8.5: Performance
- [ ] Debounced outline extraction
- [ ] Memoized expensive computations
- [ ] Lazy loaded heavy components
- [ ] Optimized re-renders

### AC-8.6: Accessibility Final Pass
- [ ] All interactive elements have focus states
- [ ] Skip links where appropriate
- [ ] Reduced motion support
- [ ] Color contrast meets WCAG AA

### AC-8.7: Final UI Polish
- [ ] Consistent spacing and alignment
- [ ] Hover and active states
- [ ] Transitions and animations
- [ ] Dark mode completeness

---

## File Structure

```
app/(pages)/docs/
└── components/
    ├── common/
    │   ├── index.ts                     # Barrel export
    │   ├── ErrorBoundary.tsx            # Error boundary wrapper
    │   ├── ErrorFallback.tsx            # Error display component
    │   ├── LoadingSkeleton.tsx          # Reusable skeleton
    │   └── EmptyState.tsx               # Reusable empty state
    ├── shortcuts/
    │   ├── index.ts                     # Barrel export
    │   ├── ShortcutsDialog.tsx          # Keyboard shortcuts help
    │   └── shortcuts-data.ts            # Shortcut definitions
    └── editor/
        └── plugins/
            └── ShortcutsHelpPlugin.tsx  # ? key handler
```

---

## Implementation Details

### 1. Keyboard Shortcuts Data

**File:** `app/(pages)/docs/components/shortcuts/shortcuts-data.ts`

```ts
export interface Shortcut {
  keys: string[];
  description: string;
  category: "formatting" | "navigation" | "editing" | "general";
}

export const SHORTCUTS: Shortcut[] = [
  // Formatting
  {
    keys: ["⌘", "B"],
    description: "Bold",
    category: "formatting",
  },
  {
    keys: ["⌘", "I"],
    description: "Italic",
    category: "formatting",
  },
  {
    keys: ["⌘", "⇧", "S"],
    description: "Strikethrough",
    category: "formatting",
  },
  {
    keys: ["⌘", "E"],
    description: "Inline code",
    category: "formatting",
  },
  {
    keys: ["⌘", "K"],
    description: "Insert/edit link",
    category: "formatting",
  },
  {
    keys: ["⌘", "⇧", "7"],
    description: "Numbered list",
    category: "formatting",
  },
  {
    keys: ["⌘", "⇧", "8"],
    description: "Bullet list",
    category: "formatting",
  },

  // Editing
  {
    keys: ["/"],
    description: "Open slash command menu",
    category: "editing",
  },
  {
    keys: ["⌘", "Z"],
    description: "Undo",
    category: "editing",
  },
  {
    keys: ["⌘", "⇧", "Z"],
    description: "Redo",
    category: "editing",
  },
  {
    keys: ["⌘", "S"],
    description: "Save (auto-saves)",
    category: "editing",
  },
  {
    keys: ["Tab"],
    description: "Indent list item",
    category: "editing",
  },
  {
    keys: ["⇧", "Tab"],
    description: "Outdent list item",
    category: "editing",
  },

  // Navigation
  {
    keys: ["⌘", "↑"],
    description: "Jump to document start",
    category: "navigation",
  },
  {
    keys: ["⌘", "↓"],
    description: "Jump to document end",
    category: "navigation",
  },
  {
    keys: ["⌥", "↑"],
    description: "Move line up",
    category: "navigation",
  },
  {
    keys: ["⌥", "↓"],
    description: "Move line down",
    category: "navigation",
  },

  // General
  {
    keys: ["?"],
    description: "Show keyboard shortcuts",
    category: "general",
  },
  {
    keys: ["Esc"],
    description: "Close dialog/menu",
    category: "general",
  },
];

export const CATEGORY_LABELS: Record<Shortcut["category"], string> = {
  formatting: "Text Formatting",
  editing: "Editing",
  navigation: "Navigation",
  general: "General",
};

export function getShortcutsByCategory(): Record<string, Shortcut[]> {
  const grouped: Record<string, Shortcut[]> = {};

  for (const shortcut of SHORTCUTS) {
    if (!grouped[shortcut.category]) {
      grouped[shortcut.category] = [];
    }
    grouped[shortcut.category].push(shortcut);
  }

  return grouped;
}
```

---

### 2. Shortcuts Dialog

**File:** `app/(pages)/docs/components/shortcuts/index.ts`

```ts
export { ShortcutsDialog } from "./ShortcutsDialog";
export { SHORTCUTS, getShortcutsByCategory, CATEGORY_LABELS } from "./shortcuts-data";
export type { Shortcut } from "./shortcuts-data";
```

**File:** `app/(pages)/docs/components/shortcuts/ShortcutsDialog.tsx`

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getShortcutsByCategory, CATEGORY_LABELS, type Shortcut } from "./shortcuts-data";
import { Keyboard } from "lucide-react";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const groupedShortcuts = getShortcutsByCategory();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {CATEGORY_LABELS[category as Shortcut["category"]]}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">?</kbd> anytime
          to show this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 bg-muted rounded text-xs font-mono min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Shortcuts Help Plugin

**File:** `app/(pages)/docs/components/editor/plugins/ShortcutsHelpPlugin.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND } from "lexical";
import { ShortcutsDialog } from "../../shortcuts/ShortcutsDialog";

export function ShortcutsHelpPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        // Open on "?" key (Shift + /)
        if (event.key === "?" || (event.key === "/" && (event.metaKey || event.ctrlKey))) {
          event.preventDefault();
          setIsOpen(true);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  // Also listen globally for when editor not focused
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?" && !event.target?.closest("[contenteditable]")) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <ShortcutsDialog open={isOpen} onOpenChange={setIsOpen} />;
}
```

---

### 4. Error Boundary Components

**File:** `app/(pages)/docs/components/common/index.ts`

```ts
export { ErrorBoundary } from "./ErrorBoundary";
export { ErrorFallback } from "./ErrorFallback";
export { LoadingSkeleton } from "./LoadingSkeleton";
export { EmptyState } from "./EmptyState";
```

**File:** `app/(pages)/docs/components/common/ErrorBoundary.tsx`

```tsx
"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Document editor error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
```

**File:** `app/(pages)/docs/components/common/ErrorFallback.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  onRetry,
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>

      {error && process.env.NODE_ENV === "development" && (
        <pre className="text-xs text-left bg-muted p-4 rounded-lg mb-4 max-w-md overflow-auto">
          {error.message}
        </pre>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
```

---

### 5. Loading Skeletons

**File:** `app/(pages)/docs/components/common/LoadingSkeleton.tsx`

```tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant: "document-list" | "editor" | "sidebar" | "chat";
  className?: string;
}

export function LoadingSkeleton({ variant, className }: LoadingSkeletonProps) {
  switch (variant) {
    case "document-list":
      return (
        <div className={cn("space-y-4", className)}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );

    case "editor":
      return (
        <div className={cn("p-6 space-y-4", className)}>
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-32 w-full mt-4" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      );

    case "sidebar":
      return (
        <div className={cn("p-4 space-y-3", className)}>
          <Skeleton className="h-4 w-24 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-6"
              style={{ width: `${60 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      );

    case "chat":
      return (
        <div className={cn("p-4 space-y-4", className)}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
```

---

### 6. Empty State Component

**File:** `app/(pages)/docs/components/common/EmptyState.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
```

---

### 7. Updated Editor Container with Error Boundary

**File:** `app/(pages)/docs/components/editor/EditorContainer.tsx` (Final)

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
import { ShortcutsHelpPlugin } from "./plugins/ShortcutsHelpPlugin";
import { ErrorBoundary } from "../common/ErrorBoundary";

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
    <ErrorBoundary>
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

          {/* Help Plugin */}
          <ShortcutsHelpPlugin />
        </div>
      </LexicalComposer>
    </ErrorBoundary>
  );
}

function EditorPlaceholder() {
  return (
    <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground px-16 py-12">
      Start writing, or press{" "}
      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">/</kbd> for
      commands...
    </div>
  );
}
```

---

### 8. Reduced Motion Support

**File:** `app/(pages)/docs/components/common/MotionPreference.tsx`

```tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MotionPreference {
  prefersReducedMotion: boolean;
}

const MotionPreferenceContext = createContext<MotionPreference>({
  prefersReducedMotion: false,
});

export function MotionPreferenceProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <MotionPreferenceContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference() {
  return useContext(MotionPreferenceContext);
}
```

---

### 9. Global Styles for Transitions

**File:** Add to global CSS or Tailwind config

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Focus visible styles */
.focus-ring {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* Smooth transitions for UI elements */
.transition-ui {
  @apply transition-all duration-200 ease-out;
}

/* Editor specific styles */
.editor-content {
  @apply focus:outline-none;
}

.editor-content [data-lexical-editor] {
  @apply outline-none;
}

/* Selection toolbar animation */
.selection-toolbar {
  @apply animate-in fade-in-0 zoom-in-95 duration-150;
}

/* Slash menu animation */
.slash-menu {
  @apply animate-in fade-in-0 slide-in-from-top-2 duration-150;
}

/* Sidebar animation */
.sidebar-enter {
  @apply animate-in slide-in-from-right duration-200;
}

.sidebar-exit {
  @apply animate-out slide-out-to-right duration-200;
}
```

---

### 10. Help Button in Header

**File:** `app/(pages)/docs/components/editor/HelpButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { ShortcutsDialog } from "../shortcuts/ShortcutsDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HelpButton() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowShortcuts(true)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Keyboard shortcuts{" "}
              <kbd className="ml-1 px-1 py-0.5 bg-muted rounded text-xs">?</kbd>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  );
}
```

---

### 11. Final Document Editor Assembly

**File:** `app/(pages)/docs/components/editor/DocumentEditor.tsx` (Final)

```tsx
"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatToggle } from "./ChatToggle";
import { HistoryToggle } from "./HistoryToggle";
import { HelpButton } from "./HelpButton";
import { OutlineSidebar } from "../outline/OutlineSidebar";
import { PropertiesPanel } from "../properties/PropertiesPanel";
import { HistoryPanel } from "../history/HistoryPanel";
import { ErrorBoundary } from "../common/ErrorBoundary";
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
    isOutlineOpen,
    resetHistory,
  } = useDocsStore();

  // Initialize store with document data
  useEffect(() => {
    setDocument(document);
    setContent(document.content);

    // Cleanup on unmount
    return () => {
      reset();
      resetHistory();
    };
  }, [document, setDocument, setContent, reset, resetHistory]);

  return (
    <ErrorBoundary>
      <div className="h-full flex">
        {/* Outline Sidebar (Left) */}
        {isOutlineOpen && (
          <ErrorBoundary>
            <OutlineSidebar />
          </ErrorBoundary>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with title and controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <DocumentHeader />
            <div className="flex items-center gap-2">
              <SaveIndicator />
              <HistoryToggle />
              <ChatToggle />
              <HelpButton />
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-hidden">
            <EditorContainer initialContent={document.content} />
          </div>
        </div>

        {/* Chat Sidebar (Right) */}
        {isChatOpen && (
          <ErrorBoundary>
            <ChatSidebar />
          </ErrorBoundary>
        )}

        {/* Panels (Sheets/Dialogs) */}
        <PropertiesPanel />
        <HistoryPanel />
      </div>
    </ErrorBoundary>
  );
}
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Keyboard Shortcuts Dialog**
   - Press `?` key anywhere
   - Verify dialog opens with all shortcuts
   - Press Escape to close
   - Click outside to close

2. **Test Loading States**
   - Refresh document page
   - Verify skeleton shows while loading
   - Navigate to document list
   - Verify list skeleton shows

3. **Test Error Boundaries**
   - (Dev only) Force an error in component
   - Verify error fallback displays
   - Click "Try Again" to recover

4. **Test Empty States**
   - Delete all documents
   - Verify empty state on catalog page
   - Create document with no headings
   - Verify outline empty state

5. **Test Accessibility**
   - Tab through all interactive elements
   - Verify focus indicators visible
   - Test with screen reader
   - Enable "Reduce motion" in OS settings
   - Verify animations are disabled

6. **Test Dark Mode**
   - Toggle system dark mode
   - Verify all components styled correctly
   - Verify contrast is readable

---

## Performance Optimization Notes

### Memoization Applied
- Document statistics calculation
- Outline extraction with debounce
- Format state detection
- Filtered command list

### Lazy Loading
- Chat sidebar components
- History panel components
- Properties panel components
- Shortcuts dialog

### React Optimizations
- Use `useCallback` for event handlers
- Use `useMemo` for computed values
- Avoid unnecessary re-renders with proper deps

---

## Final Checklist

### Before Launch
- [ ] All acceptance criteria met for phases 1-8
- [ ] Manual testing completed
- [ ] Keyboard navigation verified
- [ ] Screen reader testing done
- [ ] Dark mode complete
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Performance acceptable

### Known Limitations (v1)
- No collaborative editing
- No offline support
- No image/file uploads
- No table editing UI
- Basic version history (no diffs)
- No document templates
- No document sharing

### Post-Launch Improvements
- Real-time collaboration (WebSocket)
- Offline support with service worker
- Image upload and embedding
- Table editing interface
- Advanced version history with diffs
- Document templates
- Sharing and permissions

---

## Summary

This completes the 8-phase implementation plan for the Docs feature. The feature provides:

1. **Document Management** - Create, list, edit, delete documents
2. **Rich Text Editor** - Lexical-powered with Markdown storage
3. **Formatting Tools** - Floating toolbar, keyboard shortcuts
4. **Block System** - Slash commands, block handles, drag-and-drop
5. **AI Integration** - Chat sidebar with document editing tools
6. **Navigation** - Outline sidebar, jump to headings
7. **Properties** - Title, tags, description, statistics
8. **Version History** - Automatic snapshots, preview, restore

The implementation follows existing patterns in the codebase and integrates seamlessly with the Agipo platform architecture.
