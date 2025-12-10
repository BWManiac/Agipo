# Phase 7: Version History

**Phase:** 7 of 8
**Estimated LOC:** ~900
**Prerequisites:** Phase 6 (Outline & Properties)
**Focus:** Snapshot-based version history, preview, restore

---

## Overview

This phase implements a simple snapshot-based version history system. Users will be able to:

1. See automatic snapshots created on save
2. Browse previous versions of a document
3. Preview any historical version
4. Restore a document to a previous state
5. See basic information about each version

**Note:** This is a simpler approach than Git-like version control. Full diff-based version control is deferred to future work.

---

## Acceptance Criteria

### AC-7.1: Automatic Snapshots
- [ ] Snapshot created automatically on each save
- [ ] Snapshots stored in `_versions/` subdirectory
- [ ] Snapshot filename includes timestamp
- [ ] Snapshots include full content + frontmatter

### AC-7.2: Version History Panel
- [ ] History button opens version list
- [ ] Versions shown in reverse chronological order
- [ ] Each version shows timestamp
- [ ] Each version shows word count delta (if available)
- [ ] Loading state while fetching history

### AC-7.3: Version Preview
- [ ] Click version to preview content
- [ ] Preview shows read-only content
- [ ] Preview shows version metadata
- [ ] Clear visual indicator of preview mode
- [ ] Close button returns to current version

### AC-7.4: Version Restore
- [ ] Restore button available in preview
- [ ] Confirmation dialog before restore
- [ ] Restore replaces current content
- [ ] Restore creates new snapshot (before overwriting)
- [ ] Editor updates with restored content

### AC-7.5: Version Comparison (Basic)
- [ ] Show which version is newer/older
- [ ] Show word count difference
- [ ] Visual indication of changes (optional for v1)

### AC-7.6: Version Retention
- [ ] Keep all versions (no automatic cleanup for v1)
- [ ] Future: configurable retention policy
- [ ] Future: manual version deletion

### AC-7.7: Performance
- [ ] Lazy load version list
- [ ] Lazy load version content on preview
- [ ] Pagination for documents with many versions

---

## File Structure

```
_tables/
└── documents/
    └── [docId]/
        ├── content.md              # Current version
        └── _versions/
            ├── v_1733840400000.md  # Snapshot at timestamp
            ├── v_1733841200000.md
            └── v_1733842000000.md
app/(pages)/docs/
├── components/
│   └── history/
│       ├── index.ts                # Barrel export
│       ├── HistoryPanel.tsx        # Version list panel
│       ├── HistoryItem.tsx         # Individual version item
│       ├── VersionPreview.tsx      # Preview modal/panel
│       └── RestoreDialog.tsx       # Restore confirmation
└── store/
    └── slices/
        └── historySlice.ts         # History state
app/
└── api/
    └── docs/
        └── [docId]/
            └── versions/
                ├── route.ts        # GET versions list
                └── [versionId]/
                    └── route.ts    # GET/POST specific version
```

---

## Implementation Details

### 1. History Store Slice

**File:** `app/(pages)/docs/store/slices/historySlice.ts`

```ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Version {
  id: string;
  timestamp: Date;
  wordCount: number;
  contentPreview?: string; // First 200 chars
}

export interface VersionDetail extends Version {
  content: string;
  frontmatter: Record<string, unknown>;
}

interface HistoryState {
  // UI state
  isOpen: boolean;
  isPreviewOpen: boolean;

  // Data
  versions: Version[];
  selectedVersion: VersionDetail | null;
  isLoading: boolean;
  isPreviewLoading: boolean;
  error: string | null;

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  fetchVersions: (documentId: string) => Promise<void>;
  previewVersion: (documentId: string, versionId: string) => Promise<void>;
  restoreVersion: (documentId: string, versionId: string) => Promise<void>;
  closePreview: () => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  isPreviewOpen: false,
  versions: [] as Version[],
  selectedVersion: null as VersionDetail | null,
  isLoading: false,
  isPreviewLoading: false,
  error: null as string | null,
};

export const useHistoryStore = create<HistoryState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setIsOpen: (isOpen) => {
        set({ isOpen });
        if (!isOpen) {
          set({ isPreviewOpen: false, selectedVersion: null });
        }
      },

      fetchVersions: async (documentId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/docs/${documentId}/versions`);

          if (!response.ok) {
            throw new Error("Failed to fetch versions");
          }

          const data = await response.json();

          set({
            versions: data.versions.map((v: Version) => ({
              ...v,
              timestamp: new Date(v.timestamp),
            })),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          });
        }
      },

      previewVersion: async (documentId, versionId) => {
        set({ isPreviewLoading: true, isPreviewOpen: true });

        try {
          const response = await fetch(
            `/api/docs/${documentId}/versions/${versionId}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch version");
          }

          const data = await response.json();

          set({
            selectedVersion: {
              ...data,
              timestamp: new Date(data.timestamp),
            },
            isPreviewLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isPreviewLoading: false,
          });
        }
      },

      restoreVersion: async (documentId, versionId) => {
        try {
          const response = await fetch(
            `/api/docs/${documentId}/versions/${versionId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "restore" }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to restore version");
          }

          // Close preview and refresh versions
          set({ isPreviewOpen: false, selectedVersion: null });

          // Refresh version list
          get().fetchVersions(documentId);

          return response.json();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },

      closePreview: () => {
        set({ isPreviewOpen: false, selectedVersion: null });
      },

      reset: () => set(initialState),
    }),
    { name: "history-store" }
  )
);
```

---

### 2. Version API Routes

**File:** `app/api/docs/[docId]/versions/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getVersions, createVersion } from "./services";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

// GET /api/docs/[docId]/versions - List all versions
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const versions = await getVersions(docId);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

// POST /api/docs/[docId]/versions - Create a new version (manual snapshot)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const version = await createVersion(docId);

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/docs/[docId]/versions/[versionId]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getVersion, restoreVersion } from "../services";

interface RouteContext {
  params: Promise<{ docId: string; versionId: string }>;
}

// GET /api/docs/[docId]/versions/[versionId] - Get specific version
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId, versionId } = await context.params;
    const version = await getVersion(docId, versionId);

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}

// POST /api/docs/[docId]/versions/[versionId] - Restore version
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { docId, versionId } = await context.params;
    const body = await request.json();

    if (body.action !== "restore") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const result = await restoreVersion(docId, versionId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
```

---

### 3. Version Services

**File:** `app/api/docs/[docId]/versions/services.ts`

```ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { Version, VersionDetail } from "@/lib/docs/store/history-slice";

const DOCS_DIR = path.join(process.cwd(), "_tables", "documents");

/**
 * Get all versions for a document
 */
export async function getVersions(docId: string): Promise<Version[]> {
  const versionsDir = path.join(DOCS_DIR, docId, "_versions");

  try {
    await fs.access(versionsDir);
  } catch {
    // No versions directory yet
    return [];
  }

  const files = await fs.readdir(versionsDir);
  const versionFiles = files.filter((f) => f.startsWith("v_") && f.endsWith(".md"));

  const versions: Version[] = [];

  for (const file of versionFiles) {
    const filePath = path.join(versionsDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { content: body } = matter(content);

    // Extract timestamp from filename (v_1733840400000.md)
    const timestamp = parseInt(file.slice(2, -3), 10);

    // Calculate word count
    const words = body.split(/\s+/).filter((w: string) => w.length > 0);

    versions.push({
      id: file.slice(0, -3), // Remove .md
      timestamp: new Date(timestamp),
      wordCount: words.length,
      contentPreview: body.slice(0, 200),
    });
  }

  // Sort by timestamp descending (newest first)
  versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return versions;
}

/**
 * Get a specific version
 */
export async function getVersion(
  docId: string,
  versionId: string
): Promise<VersionDetail | null> {
  const versionPath = path.join(DOCS_DIR, docId, "_versions", `${versionId}.md`);

  try {
    const content = await fs.readFile(versionPath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);

    // Extract timestamp from version ID
    const timestamp = parseInt(versionId.slice(2), 10);

    const words = body.split(/\s+/).filter((w: string) => w.length > 0);

    return {
      id: versionId,
      timestamp: new Date(timestamp),
      wordCount: words.length,
      content: body,
      frontmatter,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new version snapshot
 */
export async function createVersion(docId: string): Promise<Version> {
  const docPath = path.join(DOCS_DIR, docId, "content.md");
  const versionsDir = path.join(DOCS_DIR, docId, "_versions");

  // Ensure versions directory exists
  await fs.mkdir(versionsDir, { recursive: true });

  // Read current document
  const content = await fs.readFile(docPath, "utf-8");
  const { content: body } = matter(content);

  // Create version file
  const timestamp = Date.now();
  const versionId = `v_${timestamp}`;
  const versionPath = path.join(versionsDir, `${versionId}.md`);

  await fs.writeFile(versionPath, content, "utf-8");

  const words = body.split(/\s+/).filter((w: string) => w.length > 0);

  return {
    id: versionId,
    timestamp: new Date(timestamp),
    wordCount: words.length,
  };
}

/**
 * Restore a document to a specific version
 */
export async function restoreVersion(
  docId: string,
  versionId: string
): Promise<{ success: boolean; newVersionId: string }> {
  const docPath = path.join(DOCS_DIR, docId, "content.md");
  const versionPath = path.join(DOCS_DIR, docId, "_versions", `${versionId}.md`);

  // Create a backup of current state before restoring
  const backupVersion = await createVersion(docId);

  // Read the version to restore
  const versionContent = await fs.readFile(versionPath, "utf-8");

  // Update the updatedAt in frontmatter
  const { data: frontmatter, content: body } = matter(versionContent);
  frontmatter.updatedAt = new Date().toISOString();

  const newContent = matter.stringify(body, frontmatter);

  // Write restored content
  await fs.writeFile(docPath, newContent, "utf-8");

  return {
    success: true,
    newVersionId: backupVersion.id,
  };
}
```

---

### 4. Update Auto-Save to Create Versions

**File:** `app/(pages)/docs/components/editor/plugins/AutoSavePlugin.tsx` (Updated)

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useDocsStore } from "../../../store";

interface AutoSavePluginProps {
  debounceMs?: number;
}

export function AutoSavePlugin({ debounceMs = 1500 }: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const { document, isDirty, setSaveStatus, setLastSavedAt, setIsDirty } = useEditorStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const saveCountRef = useRef(0);

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

      // Create version snapshot every 5 saves (or first save)
      saveCountRef.current += 1;
      if (saveCountRef.current === 1 || saveCountRef.current % 5 === 0) {
        await fetch(`/api/docs/${document.id}/versions`, {
          method: "POST",
        });
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
        saveDocument();
      }
    };
  }, [isDirty, saveDocument]);

  return null;
}
```

---

### 5. History Panel Components

**File:** `app/(pages)/docs/components/history/index.ts`

```ts
export { HistoryPanel } from "./HistoryPanel";
export { HistoryItem } from "./HistoryItem";
export { VersionPreview } from "./VersionPreview";
export { RestoreDialog } from "./RestoreDialog";
```

**File:** `app/(pages)/docs/components/history/HistoryPanel.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useDocsStore } from "../../store";
import { HistoryItem } from "./HistoryItem";
import { VersionPreview } from "./VersionPreview";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, History } from "lucide-react";

export function HistoryPanel() {
  const {
    isHistoryOpen: isOpen,
    setHistoryOpen: setIsOpen,
    versions,
    isHistoryLoading: isLoading,
    historyError: error,
    fetchVersions,
    previewVersion,
    isPreviewOpen,
    document,
  } = useDocsStore();

  // Fetch versions when panel opens
  useEffect(() => {
    if (isOpen && document) {
      fetchVersions(document.id);
    }
  }, [isOpen, document, fetchVersions]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[400px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>{error}</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No version history yet</p>
                <p className="text-sm mt-1">
                  Versions are created automatically as you edit
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="space-y-2 pr-4">
                  {versions.map((version, index) => (
                    <HistoryItem
                      key={version.id}
                      version={version}
                      isLatest={index === 0}
                      previousVersion={versions[index + 1]}
                      onPreview={() => {
                        if (document) {
                          previewVersion(document.id, version.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      {isPreviewOpen && <VersionPreview />}
    </>
  );
}
```

**File:** `app/(pages)/docs/components/history/HistoryItem.tsx`

```tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import type { Version } from "../../store/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItemProps {
  version: Version;
  isLatest: boolean;
  previousVersion?: Version;
  onPreview: () => void;
}

export function HistoryItem({
  version,
  isLatest,
  previousVersion,
  onPreview,
}: HistoryItemProps) {
  const timeAgo = formatDistanceToNow(version.timestamp, { addSuffix: true });

  // Calculate word count delta
  const wordDelta = previousVersion
    ? version.wordCount - previousVersion.wordCount
    : 0;

  const getDeltaDisplay = () => {
    if (!previousVersion) return null;

    if (wordDelta > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          +{wordDelta}
        </span>
      );
    } else if (wordDelta < 0) {
      return (
        <span className="flex items-center text-red-600 text-xs">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {wordDelta}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-muted-foreground text-xs">
          <Minus className="h-3 w-3 mr-0.5" />
          No change
        </span>
      );
    }
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border hover:bg-accent/50 transition-colors",
        isLatest && "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {version.timestamp.toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {isLatest && (
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xs">{timeAgo}</span>
            <span className="text-xs">{version.wordCount} words</span>
            {getDeltaDisplay()}
          </div>

          {version.contentPreview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
              {version.contentPreview}...
            </p>
          )}
        </div>

        {!isLatest && (
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

**File:** `app/(pages)/docs/components/history/VersionPreview.tsx`

```tsx
"use client";

import { useState } from "react";
import { useDocsStore } from "../../store";
import { RestoreDialog } from "./RestoreDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function VersionPreview() {
  const {
    isPreviewOpen,
    closePreview,
    selectedVersion,
    isPreviewLoading,
    restoreVersion,
    document,
    setContent,
  } = useDocsStore();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!document || !selectedVersion) return;

    setIsRestoring(true);

    try {
      await restoreVersion(document.id, selectedVersion.id);

      // Update editor content
      setContent(selectedVersion.content);

      // Close dialogs
      setShowRestoreDialog(false);
      closePreview();

      // Reload the page to get fresh content
      window.location.reload();
    } catch (error) {
      console.error("Failed to restore:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Version Preview</DialogTitle>
            {selectedVersion && (
              <DialogDescription>
                From {selectedVersion.timestamp.toLocaleString()} •{" "}
                {selectedVersion.wordCount} words
              </DialogDescription>
            )}
          </DialogHeader>

          {isPreviewLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedVersion ? (
            <ScrollArea className="flex-1 border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{selectedVersion.content}</ReactMarkdown>
              </div>
            </ScrollArea>
          ) : null}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closePreview}>
              Close
            </Button>
            <Button
              onClick={() => setShowRestoreDialog(true)}
              disabled={!selectedVersion}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={handleRestore}
        isLoading={isRestoring}
        versionDate={selectedVersion?.timestamp}
      />
    </>
  );
}
```

**File:** `app/(pages)/docs/components/history/RestoreDialog.tsx`

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  versionDate?: Date;
}

export function RestoreDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  versionDate,
}: RestoreDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this version?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace the current document content with the version from{" "}
            <strong>
              {versionDate?.toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </strong>
            .
            <br />
            <br />
            A backup of the current version will be saved automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              "Restore"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### 6. History Toggle Button

**File:** `app/(pages)/docs/components/editor/HistoryToggle.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useDocsStore } from "../../store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HistoryToggle() {
  const { setHistoryOpen } = useDocsStore();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View version history</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 7. Update Document Editor

**File:** `app/(pages)/docs/components/editor/DocumentEditor.tsx` (Updated)

```tsx
"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatToggle } from "./ChatToggle";
import { HistoryToggle } from "./HistoryToggle";
import { OutlineSidebar } from "../outline/OutlineSidebar";
import { PropertiesPanel } from "../properties/PropertiesPanel";
import { HistoryPanel } from "../history/HistoryPanel";
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
    <div className="h-full flex">
      {/* Outline Sidebar (Left) */}
      {isOutlineOpen && <OutlineSidebar />}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with title and controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DocumentHeader />
          <div className="flex items-center gap-2">
            <SaveIndicator />
            <HistoryToggle />
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

      {/* Panels (Sheets/Dialogs) */}
      <PropertiesPanel />
      <HistoryPanel />
    </div>
  );
}
```

---

## Testing Instructions

### Manual Testing Checklist

1. **Test Version Creation**
   - Edit a document and save
   - Make more edits, save multiple times
   - Check `_tables/documents/[docId]/_versions/` for snapshot files

2. **Test History Panel**
   - Click History button in document header
   - Verify version list loads
   - Verify newest version is at top with "Current" badge
   - Verify timestamps and word counts display

3. **Test Version Preview**
   - Click eye icon on an older version
   - Verify preview modal opens
   - Verify content renders correctly
   - Close preview

4. **Test Version Restore**
   - Preview an older version
   - Click "Restore This Version"
   - Confirm in dialog
   - Verify document updates with restored content
   - Verify new backup snapshot was created

5. **Test Word Count Delta**
   - Create versions with different content lengths
   - Verify green/red arrows show increase/decrease
   - Verify word count differences are accurate

---

## Dependencies

### New npm Packages
```bash
npm install date-fns
```

### ShadCN Components Required
```bash
npx shadcn@latest add alert-dialog scroll-area
```

---

## Next Phase

**Phase 8: Polish & Optimization** will add:
- Keyboard shortcuts overview
- Performance optimizations
- Error boundary improvements
- Loading skeletons
- Final UI polish

---

## Future Enhancements (Deferred)

1. **Git-like Version Control**
   - Diff-based storage (only store changes)
   - Branch support
   - Merge capabilities

2. **Version Comparison**
   - Side-by-side diff view
   - Inline change highlighting
   - Character-level diff

3. **Named Versions**
   - Allow users to name/tag important versions
   - Quick restore to named versions

4. **Retention Policies**
   - Automatic cleanup of old versions
   - Configurable retention periods
   - Storage quota management

---

## Notes

- Versions are stored as complete Markdown files (simple but storage-heavy)
- Version creation is throttled to every 5 saves to reduce storage
- Restore always creates a backup first (never lose current state)
- Preview uses ReactMarkdown for rendering (same as chat messages)
- No edit capability in preview mode (read-only)
