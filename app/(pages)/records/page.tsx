"use client";

/**
 * Records Page
 *
 * Unified view for all records (folders, tables, documents).
 * Features Google Drive-like folder navigation with sidebar tree.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecordsStore } from "./store";
import {
  FolderTree,
  ItemCard,
  Breadcrumbs,
  CreateDropdown,
  CreateFolderDialog,
  CreateTableDialog,
  CreateDocumentDialog,
} from "./components/Folders";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Folder, Plus } from "lucide-react";

export default function RecordsPage() {
  const router = useRouter();

  const {
    items: storeItems,
    breadcrumbs: storeBreadcrumbs,
    currentFolder,
    currentFolderId,
    isItemsLoading,
    folderError,
    navigateToFolder,
    fetchFolderTree,
    fetchItems,
    createFolder,
    createTable,
    createDocument,
    deleteItem,
  } = useRecordsStore();

  // Provide defaults for arrays that might be undefined during hydration
  const items = storeItems ?? [];
  const breadcrumbs = storeBreadcrumbs ?? [{ id: null, name: "All Records" }];

  // Dialog states
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Initialize data
  useEffect(() => {
    fetchFolderTree();
    fetchItems();
  }, [fetchFolderTree, fetchItems]);

  // Handlers
  const handleCreateFolder = async (name: string) => {
    setIsCreating(true);
    try {
      await createFolder(name);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTable = async (name: string, description?: string) => {
    setIsCreating(true);
    try {
      const tableId = await createTable(name, description);
      if (tableId) {
        router.push(`/records/${tableId}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateDocument = async (title?: string) => {
    setIsCreating(true);
    try {
      const docId = await createDocument(title);
      if (docId) {
        router.push(`/docs/${docId}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemType: string) => {
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
    await deleteItem(itemId, itemType as "table" | "document" | "folder");
  };

  const handleNavigateToFolder = (folderId: string) => {
    navigateToFolder(folderId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shrink-0">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Records</h1>
              <Breadcrumbs items={breadcrumbs} onNavigate={navigateToFolder} />
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search all records..."
                  className="w-64 pl-9"
                />
              </div>
              {/* Create Dropdown */}
              <CreateDropdown
                onCreateFolder={() => setFolderDialogOpen(true)}
                onCreateTable={() => setTableDialogOpen(true)}
                onCreateDocument={() => setDocumentDialogOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder Tree Sidebar */}
        <FolderTree onCreateFolder={() => setFolderDialogOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Folder Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Folder className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {currentFolder?.name ?? "All Records"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {folderError && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
              {folderError}
            </div>
          )}

          {/* Items Grid */}
          {isItemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[180px] rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              folderId={currentFolderId}
              onCreateTable={() => setTableDialogOpen(true)}
              onCreateDocument={() => setDocumentDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onNavigate={handleNavigateToFolder}
                  onDelete={handleDeleteItem}
                />
              ))}
              {/* Add to folder card */}
              <AddItemCard
                onCreateTable={() => setTableDialogOpen(true)}
                onCreateDocument={() => setDocumentDialogOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t px-6 py-2 shrink-0">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {items.length} {items.length === 1 ? "item" : "items"} in{" "}
            {currentFolder?.name ?? "All Records"}
          </span>
        </div>
      </footer>

      {/* Dialogs */}
      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSubmit={handleCreateFolder}
        isLoading={isCreating}
      />
      <CreateTableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        onSubmit={handleCreateTable}
        isLoading={isCreating}
      />
      <CreateDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onSubmit={handleCreateDocument}
        isLoading={isCreating}
      />
    </div>
  );
}

function EmptyState({
  folderId,
  onCreateTable,
  onCreateDocument,
}: {
  folderId: string | null;
  onCreateTable: () => void;
  onCreateDocument: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Folder className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {folderId ? "This folder is empty" : "No records yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {folderId
          ? "Add tables or documents to this folder to get started."
          : "Create your first table or document to start organizing your data."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCreateTable}
          className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Table
        </button>
        <button
          onClick={onCreateDocument}
          className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Create Document
        </button>
      </div>
    </div>
  );
}

function AddItemCard({
  onCreateTable,
  onCreateDocument,
}: {
  onCreateTable: () => void;
  onCreateDocument: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-dashed hover:border-primary/50 hover:bg-secondary/30 transition-all cursor-pointer group">
      <div className="p-4 h-full flex flex-col items-center justify-center text-center min-h-[180px]">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
          <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
          Add to folder
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Create a table or document
        </p>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateTable();
            }}
            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          >
            Table
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument();
            }}
            className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
          >
            Document
          </button>
        </div>
      </div>
    </div>
  );
}
