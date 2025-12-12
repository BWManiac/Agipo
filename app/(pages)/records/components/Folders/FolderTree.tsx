"use client";

/**
 * Folder Tree Sidebar Component
 *
 * Displays collapsible folder tree for navigation.
 * Based on 01-folder-view.html mockup.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRecordsStore } from "../../store";
import { ChevronRight, ChevronDown, Folder, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FolderTreeNode } from "@/app/api/records/types";

interface FolderTreeItemProps {
  node: FolderTreeNode;
  level: number;
}

function FolderTreeItem({ node, level }: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentFolderId, navigateToFolder } = useRecordsStore();
  const isActive = currentFolderId === node.id;
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    navigateToFolder(node.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors",
          "hover:bg-secondary",
          isActive && "bg-blue-50 text-blue-600"
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-secondary/80 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Folder
          className={cn(
            "w-4 h-4",
            isActive ? "text-blue-600" : "text-emerald-500"
          )}
          fill={isActive ? "currentColor" : "currentColor"}
        />
        <span className="truncate flex-1">{node.name}</span>
        {node.itemCount > 0 && (
          <span className="text-xs text-muted-foreground">{node.itemCount}</span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  onCreateFolder?: () => void;
}

export function FolderTree({ onCreateFolder }: FolderTreeProps) {
  const {
    folderTree,
    currentFolderId,
    isFolderLoading,
    fetchFolderTree,
    navigateToFolder,
  } = useRecordsStore();

  // Folder tree is fetched by parent component on mount

  const isRootActive = currentFolderId === null;

  return (
    <div className="w-64 bg-white border-r flex flex-col shrink-0">
      <div className="p-3 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Folders
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-0.5">
          {/* Root / All Records */}
          <button
            onClick={() => navigateToFolder(null)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors",
              "hover:bg-secondary",
              isRootActive && "bg-blue-50 text-blue-600"
            )}
          >
            <Home
              className={cn(
                "w-4 h-4",
                isRootActive ? "text-blue-600" : "text-muted-foreground"
              )}
            />
            <span>All Records</span>
          </button>

          {/* Folder Tree */}
          {isFolderLoading ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            (folderTree ?? []).map((node) => (
              <FolderTreeItem key={node.id} node={node} level={0} />
            ))
          )}
        </div>
      </div>

      {/* Create folder at bottom */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onCreateFolder}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>
    </div>
  );
}
