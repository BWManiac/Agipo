"use client";

/**
 * Item Card Component
 *
 * Unified card display for folders, tables, and documents.
 * Based on 01-folder-view.html mockup.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Folder, Database, FileText, Rows3, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  AnyItemMetadata,
  TableMetadata,
  DocumentMetadata,
  FolderMetadata,
} from "@/app/api/records/types";

interface ItemCardProps {
  item: AnyItemMetadata;
  onNavigate?: (folderId: string) => void;
  onDelete?: (itemId: string, itemType: string) => void;
  onMove?: (itemId: string, itemType: string) => void;
  onRename?: (itemId: string, itemType: string) => void;
}

export function ItemCard({
  item,
  onNavigate,
  onDelete,
  onMove,
  onRename,
}: ItemCardProps) {
  const isFolder = item.type === "folder";
  const isTable = item.type === "table";
  const isDocument = item.type === "document";

  const iconBgColor = isFolder
    ? "bg-emerald-100 border-emerald-200"
    : isTable
      ? "bg-blue-100 border-blue-200"
      : "bg-amber-100 border-amber-200";
  const iconColor = isFolder
    ? "text-emerald-600"
    : isTable
      ? "text-blue-600"
      : "text-amber-600";

  const Icon = isFolder ? Folder : isTable ? Database : FileText;

  const href = isTable
    ? `/records/${item.id}`
    : isDocument
      ? `/docs/${item.id}`
      : undefined;

  const handleClick = () => {
    if (isFolder && onNavigate) {
      onNavigate(item.id);
    }
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link href={href} className="block h-full">
          {children}
        </Link>
      );
    }
    return (
      <div className="h-full cursor-pointer" onClick={handleClick}>
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      <div className="bg-card rounded-xl border hover:shadow-lg transition-shadow cursor-pointer group h-full">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 min-w-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
                  iconBgColor
                )}
              >
                <Icon className={cn("w-5 h-5", iconColor)} />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.type}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRename && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      onRename(item.id, item.type);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                )}
                {onMove && !isFolder && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      onMove(item.id, item.type);
                    }}
                  >
                    Move to...
                  </DropdownMenuItem>
                )}
                {(onRename || onMove) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(item.id, item.type);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Type-specific metadata */}
          {isTable && (
            <TableMetadataDisplay item={item as TableMetadata} />
          )}
          {isDocument && (
            <DocumentMetadataDisplay item={item as DocumentMetadata} />
          )}
          {isFolder && (
            <FolderMetadataDisplay item={item as FolderMetadata} />
          )}

          {/* Footer with timestamp */}
          <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
            <MetadataStats item={item} />
            <span>
              Updated{" "}
              {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

function TableMetadataDisplay({ item }: { item: TableMetadata }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Rows3 className="w-3.5 h-3.5" />
        <span>{item.recordCount} rows</span>
      </div>
      <div className="flex items-center gap-1">
        <Columns3 className="w-3.5 h-3.5" />
        <span>{item.columnCount} cols</span>
      </div>
    </div>
  );
}

function DocumentMetadataDisplay({ item }: { item: DocumentMetadata }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
      <span>~{item.wordCount} words</span>
      {item.tags.length > 0 && (
        <>
          <span className="text-border">•</span>
          <span>{item.tags.slice(0, 2).join(", ")}</span>
          {item.tags.length > 2 && <span>+{item.tags.length - 2}</span>}
        </>
      )}
    </div>
  );
}

function FolderMetadataDisplay({ item }: { item: FolderMetadata }) {
  return (
    <div className="text-xs text-muted-foreground">
      {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
    </div>
  );
}

function MetadataStats({ item }: { item: AnyItemMetadata }) {
  if (item.type === "table") {
    return <span>{(item as TableMetadata).recordCount} records</span>;
  }
  if (item.type === "document") {
    return <span>~{(item as DocumentMetadata).wordCount} words</span>;
  }
  if (item.type === "folder") {
    return <span>{(item as FolderMetadata).itemCount} items</span>;
  }
  return null;
}
