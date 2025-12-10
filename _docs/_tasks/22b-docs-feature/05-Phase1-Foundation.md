# Phase 1: Foundation — Navigation, Catalog, API

**Status:** Planned
**Depends On:** Phase 0 (Technical Spike)
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Establish the foundation for the Docs feature: navigation entry point, document catalog page, and backend API for document CRUD operations.

**After this phase:**
- "Docs" tab appears in TopNav
- Users can navigate to `/docs` and see document catalog
- Users can create, view, and delete documents
- Documents are stored as Markdown files with frontmatter
- API endpoints handle all document operations

### Why This Phase First

Everything else depends on:
1. **Navigation** — Users need to access the feature
2. **Catalog** — Users need to see and manage documents
3. **API** — Editor needs backend to load/save documents
4. **Storage** — All data persistence foundations

---

## File Impact Analysis

### Files to Create

| File | Purpose | LOC Est. |
|------|---------|----------|
| `app/(pages)/docs/page.tsx` | Catalog page | 80 |
| `app/(pages)/docs/components/catalog/DocumentCatalog.tsx` | Document grid | 100 |
| `app/(pages)/docs/components/catalog/DocumentCard.tsx` | Single card | 80 |
| `app/(pages)/docs/components/catalog/CreateDocumentButton.tsx` | New doc button | 60 |
| `app/(pages)/docs/components/catalog/EmptyState.tsx` | Empty message | 40 |
| `app/(pages)/docs/store/index.ts` | Store composition | 30 |
| `app/(pages)/docs/store/types.ts` | Store types | 20 |
| `app/(pages)/docs/store/slices/catalogSlice.ts` | Catalog state & actions | 120 |
| `app/api/docs/route.ts` | List/create API | 100 |
| `app/api/docs/[docId]/route.ts` | CRUD API | 150 |
| `app/api/docs/services/index.ts` | Barrel export | 20 |
| `app/api/docs/services/document-io.ts` | File I/O | 150 |
| `app/api/docs/services/frontmatter.ts` | YAML handling | 80 |

### Files to Modify

| File | Changes |
|------|---------|
| `components/layout/TopNav.tsx` | Add Docs to NAV_ITEMS |
| `package.json` | Add gray-matter (if not in Phase 0) |

**Total:** 11 new files, 2 modified, ~1,010 LOC

---

## Acceptance Criteria

### Navigation (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.1 | "Docs" tab appears in TopNav between Records and Tools | Visual inspection |
| AC-1.2 | "Docs" tab has FileText icon | Visual inspection |
| AC-1.3 | Clicking "Docs" navigates to `/docs` | Click, verify URL |

### Catalog Page (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.4 | `/docs` page loads without errors | Navigate, check console |
| AC-1.5 | Empty state shown when no documents | Delete all docs, verify message |
| AC-1.6 | Document cards shown in grid when documents exist | Create docs, verify grid |
| AC-1.7 | Each card shows: title, last modified, word count | Visual inspection |
| AC-1.8 | Cards are clickable (navigate to editor in Phase 2) | Click, verify navigation attempted |

### Create Document (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.9 | "New Document" button visible | Visual inspection |
| AC-1.10 | Clicking creates document and navigates to `/docs/[newId]` | Click, verify URL |
| AC-1.11 | New document has default title "Untitled" | Check document |
| AC-1.12 | New document appears in catalog after creation | Navigate back, verify |

### Delete Document (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.13 | Document card has menu with "Delete" option | Click menu, verify option |
| AC-1.14 | Delete shows confirmation dialog | Click delete, verify dialog |
| AC-1.15 | Confirming delete removes document from catalog | Confirm, verify removed |

### API (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.16 | `GET /api/docs` returns list of documents | curl/Postman |
| AC-1.17 | `POST /api/docs` creates new document | curl/Postman |
| AC-1.18 | `GET /api/docs/[id]` returns document content | curl/Postman |
| AC-1.19 | `PUT /api/docs/[id]` updates document | curl/Postman |
| AC-1.20 | `DELETE /api/docs/[id]` removes document | curl/Postman |

### Storage (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.21 | Documents stored in `_tables/documents/[id]/content.md` | Check file system |
| AC-1.22 | Document files include YAML frontmatter | Open file, verify YAML |
| AC-1.23 | Frontmatter includes: id, title, created, updated, author, tags | Verify fields |
| AC-1.24 | Documents persist across server restarts | Restart, verify data |

---

## Implementation Details

### TopNav Modification

```tsx
// components/layout/TopNav.tsx

import { FileText } from "lucide-react"; // Add import

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: null },
  { href: "/workforce", label: "Workforce", icon: Users },
  { href: "/records", label: "Records", icon: Database },
  { href: "/docs", label: "Docs", icon: FileText }, // Add this line
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/experiments/browser-automation", label: "Browser", icon: Globe },
  { href: "/marketplace", label: "Marketplace", icon: LayoutGrid },
];
```

### Catalog Page

```tsx
// app/(pages)/docs/page.tsx
"use client";

import { useEffect } from "react";
import { DocumentCatalog } from "./components/catalog/DocumentCatalog";
import { CreateDocumentButton } from "./components/catalog/CreateDocumentButton";
import { useDocsStore } from "./store";

export default function DocsPage() {
  const documents = useDocsStore((state) => state.documents);
  const isLoading = useDocsStore((state) => state.isLoading);
  const fetchDocuments = useDocsStore((state) => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your documents
          </p>
        </div>
        <CreateDocumentButton />
      </div>

      <DocumentCatalog documents={documents} isLoading={isLoading} />
    </div>
  );
}
```

### Document Catalog Component

```tsx
// app/(pages)/docs/components/catalog/DocumentCatalog.tsx
"use client";

import { DocumentCard } from "./DocumentCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentListItem } from "@/app/api/docs/services/types";

interface DocumentCatalogProps {
  documents: DocumentListItem[];
  isLoading: boolean;
}

export function DocumentCatalog({ documents, isLoading }: DocumentCatalogProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
```

### Document Card Component

```tsx
// app/(pages)/docs/components/catalog/DocumentCard.tsx
"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";
import { useDocsStore } from "../../store";
import type { DocumentListItem } from "@/app/api/docs/services/types";

interface DocumentCardProps {
  document: DocumentListItem;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDocument = useDocsStore((state) => state.deleteDocument);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteDocument(document.id);
    if (success) {
      setDeleteDialogOpen(false);
    }
    setIsDeleting(false);
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <Link href={`/docs/${document.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{document.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(document.updated), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{document.wordCount.toLocaleString()} words</span>
              {document.tags.length > 0 && (
                <span className="truncate">
                  {document.tags.slice(0, 2).join(", ")}
                  {document.tags.length > 2 && ` +${document.tags.length - 2}`}
                </span>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{document.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Create Document Button

```tsx
// app/(pages)/docs/components/catalog/CreateDocumentButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../../store";

export function CreateDocumentButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useDocsStore((state) => state.createDocument);

  const handleCreate = async () => {
    setIsCreating(true);
    const docId = await createDocument("Untitled");
    if (docId) {
      router.push(`/docs/${docId}`);
    }
    setIsCreating(false);
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating}>
      <Plus className="h-4 w-4 mr-2" />
      {isCreating ? "Creating..." : "New Document"}
    </Button>
  );
}
```

### Empty State

```tsx
// app/(pages)/docs/components/catalog/EmptyState.tsx
"use client";

import { FileText } from "lucide-react";
import { CreateDocumentButton } from "./CreateDocumentButton";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-muted rounded-full mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No documents yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Create your first document to start writing with AI assistance.
      </p>
      <CreateDocumentButton />
    </div>
  );
}
```

### Catalog Store Slice

```tsx
// app/(pages)/docs/store/types.ts

import type { DocumentListItem } from "@/app/api/docs/services/types";

export interface CatalogSlice {
  // State
  documents: DocumentListItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDocuments: () => Promise<void>;
  createDocument: (title?: string) => Promise<string | null>; // Returns docId or null
  deleteDocument: (docId: string) => Promise<boolean>;
}

export interface DocsStore extends CatalogSlice {
  // Other slices will be added here (editor, chat, etc.)
}
```

```tsx
// app/(pages)/docs/store/slices/catalogSlice.ts

import type { StateCreator } from "zustand";
import type { CatalogSlice, DocsStore } from "../types";
import type { DocumentListItem } from "@/app/api/docs/services/types";

export const createCatalogSlice: StateCreator<
  DocsStore,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  // Initial state
  documents: [],
  isLoading: false,
  error: null,

  // Fetch all documents
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/docs");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      set({ documents: data.documents, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch documents",
        isLoading: false,
      });
    }
  },

  // Create new document
  createDocument: async (title?: string) => {
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create document");
      const data = await response.json();
      const docId = data.document.frontmatter.id;

      // Refresh the document list
      get().fetchDocuments();

      return docId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create document",
      });
      return null;
    }
  },

  // Delete document
  deleteDocument: async (docId: string) => {
    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");

      // Remove from local state immediately
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== docId),
      }));

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete document",
      });
      return false;
    }
  },
});
```

```tsx
// app/(pages)/docs/store/index.ts

import { create } from "zustand";
import { createCatalogSlice } from "./slices/catalogSlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()((...args) => ({
  ...createCatalogSlice(...args),
}));

// Re-export types
export type { DocsStore, CatalogSlice } from "./types";
```

### API Route - List/Create

```typescript
// app/api/docs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { listDocuments, createDocument } from "./services";
import type { CreateDocumentRequest } from "./services/types";

export const runtime = "nodejs";

// GET /api/docs - List all documents
export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[Docs API] List error:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// POST /api/docs - Create new document
export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentRequest = await request.json().catch(() => ({}));
    const document = await createDocument(body.title);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("[Docs API] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
```

### API Route - Document CRUD

```typescript
// app/api/docs/[docId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, deleteDocument } from "../services";
import type { UpdateDocumentRequest } from "../services/types";

export const runtime = "nodejs";

interface RouteParams {
  params: { docId: string };
}

// GET /api/docs/[docId] - Get document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { docId } = params;
    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[Docs API] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

// PUT /api/docs/[docId] - Update document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { docId } = params;
    const body: UpdateDocumentRequest = await request.json();

    const result = await updateDocument(docId, body);

    if (!result) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Docs API] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/docs/[docId] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { docId } = params;
    const success = await deleteDocument(docId);

    if (!success) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Docs API] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
```

### Document I/O Service

```typescript
// app/api/docs/services/document-io.ts

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import type {
  Document,
  DocumentFrontmatter,
  DocumentListItem,
  UpdateDocumentRequest,
} from "./types";

const DOCS_DIR = path.join(process.cwd(), "_tables", "documents");

// Ensure documents directory exists
async function ensureDocsDir() {
  await fs.mkdir(DOCS_DIR, { recursive: true });
}

// Get document directory path
function getDocDir(docId: string) {
  return path.join(DOCS_DIR, docId);
}

// Get document file path
function getDocPath(docId: string) {
  return path.join(getDocDir(docId), "content.md");
}

// Count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// List all documents
export async function listDocuments(): Promise<DocumentListItem[]> {
  await ensureDocsDir();

  const entries = await fs.readdir(DOCS_DIR, { withFileTypes: true });
  const documents: DocumentListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const docPath = getDocPath(entry.name);
    try {
      const fileContent = await fs.readFile(docPath, "utf-8");
      const { data, content } = matter(fileContent);
      const frontmatter = data as DocumentFrontmatter;

      documents.push({
        id: frontmatter.id,
        title: frontmatter.title,
        updated: frontmatter.updated,
        wordCount: countWords(content),
        tags: frontmatter.tags || [],
      });
    } catch {
      // Skip invalid documents
      continue;
    }
  }

  // Sort by updated date, newest first
  documents.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

  return documents;
}

// Get single document
export async function getDocument(docId: string): Promise<Document | null> {
  const docPath = getDocPath(docId);

  try {
    const fileContent = await fs.readFile(docPath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      frontmatter: data as DocumentFrontmatter,
      content,
    };
  } catch {
    return null;
  }
}

// Create new document
export async function createDocument(title?: string): Promise<Document> {
  await ensureDocsDir();

  const docId = `doc_${nanoid(12)}`;
  const now = new Date().toISOString();

  const frontmatter: DocumentFrontmatter = {
    id: docId,
    title: title || "Untitled",
    created: now,
    updated: now,
    author: "user", // TODO: Get from auth
    tags: [],
    agents_with_access: [],
  };

  const content = "";
  const fileContent = matter.stringify(content, frontmatter);

  const docDir = getDocDir(docId);
  await fs.mkdir(docDir, { recursive: true });
  await fs.writeFile(getDocPath(docId), fileContent, "utf-8");

  return { frontmatter, content };
}

// Update document
export async function updateDocument(
  docId: string,
  updates: UpdateDocumentRequest
): Promise<{ document: Document } | null> {
  const existing = await getDocument(docId);
  if (!existing) return null;

  const now = new Date().toISOString();

  // Update frontmatter
  const updatedFrontmatter: DocumentFrontmatter = {
    ...existing.frontmatter,
    updated: now,
  };

  if (updates.title !== undefined) {
    updatedFrontmatter.title = updates.title;
  }

  if (updates.tags !== undefined) {
    updatedFrontmatter.tags = updates.tags;
  }

  // Update content
  let updatedContent = existing.content;
  if (updates.content !== undefined) {
    // If full content with frontmatter provided, parse it
    if (updates.content.startsWith("---")) {
      const { data, content } = matter(updates.content);
      updatedFrontmatter.title = data.title || updatedFrontmatter.title;
      updatedFrontmatter.tags = data.tags || updatedFrontmatter.tags;
      updatedContent = content;
    } else {
      updatedContent = updates.content;
    }
  }

  // Write file
  const fileContent = matter.stringify(updatedContent, updatedFrontmatter);
  await fs.writeFile(getDocPath(docId), fileContent, "utf-8");

  return {
    document: {
      frontmatter: updatedFrontmatter,
      content: updatedContent,
    },
  };
}

// Delete document
export async function deleteDocument(docId: string): Promise<boolean> {
  const docDir = getDocDir(docId);

  try {
    await fs.rm(docDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
```

### Services Barrel Export

```typescript
// app/api/docs/services/index.ts

export {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./document-io";

export type {
  Document,
  DocumentFrontmatter,
  DocumentListItem,
  AgentAccess,
  CreateDocumentRequest,
  CreateDocumentResponse,
  GetDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
} from "./types";
```

### Types

```typescript
// app/api/docs/services/types.ts

export interface AgentAccess {
  agent_id: string;
  permission: "read" | "read_write";
  granted_at: string;
}

export interface DocumentFrontmatter {
  id: string;
  title: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  agents_with_access: AgentAccess[];
}

export interface Document {
  frontmatter: DocumentFrontmatter;
  content: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  updated: string;
  wordCount: number;
  tags: string[];
}

export interface CreateDocumentRequest {
  title?: string;
}

export interface CreateDocumentResponse {
  document: Document;
}

export interface GetDocumentResponse {
  document: Document;
}

export interface UpdateDocumentRequest {
  content?: string;
  title?: string;
  tags?: string[];
}

export interface UpdateDocumentResponse {
  document: Document;
}
```

---

## Testing Instructions

### 1. Add "Docs" to Navigation

Modify `TopNav.tsx` as shown above.

### 2. Test Navigation

```
1. Start dev server: npm run dev
2. Verify "Docs" tab appears in TopNav
3. Click "Docs" tab
4. Verify URL is /docs
```

### 3. Test Empty State

```
1. Navigate to /docs
2. Verify empty state message shows
3. Verify "New Document" button in empty state
```

### 4. Test Document Creation

```
1. Click "New Document" button
2. Verify navigation to /docs/[newId]
3. Navigate back to /docs
4. Verify document card appears
5. Verify card shows "Untitled", recent time, 0 words
```

### 5. Test Document Deletion

```
1. Hover over document card
2. Click menu button (...)
3. Click "Delete"
4. Verify confirmation dialog
5. Click "Cancel", verify document still exists
6. Click "Delete" again, confirm
7. Verify document removed from catalog
```

### 6. Test API Endpoints

```bash
# List documents
curl http://localhost:3000/api/docs

# Create document
curl -X POST http://localhost:3000/api/docs \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Document"}'

# Get document (use ID from create response)
curl http://localhost:3000/api/docs/doc_xxxxxxxxxxxx

# Update document
curl -X PUT http://localhost:3000/api/docs/doc_xxxxxxxxxxxx \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "content": "# New Content"}'

# Delete document
curl -X DELETE http://localhost:3000/api/docs/doc_xxxxxxxxxxxx
```

### 7. Verify File Storage

```bash
# Check documents directory
ls -la _tables/documents/

# Check document content
cat _tables/documents/doc_xxxxxxxxxxxx/content.md
```

---

## Success Criteria

Phase 1 is complete when:

- [ ] All 24 acceptance criteria pass
- [ ] "Docs" tab appears in navigation
- [ ] Catalog page shows documents
- [ ] Create document works
- [ ] Delete document works
- [ ] API endpoints function correctly
- [ ] Documents stored as Markdown with frontmatter
- [ ] No console errors

---

## Next Phase

**Phase 2: Editor Core** — Lexical editor integration with auto-save

---

**Last Updated:** December 2025
