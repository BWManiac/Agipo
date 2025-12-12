"use client";

/**
 * Create Dropdown Component
 *
 * "New" button with dropdown to create folders, tables, or documents.
 * Based on 01-folder-view.html mockup.
 */

import { Plus, ChevronDown, Folder, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreateDropdownProps {
  onCreateFolder: () => void;
  onCreateTable: () => void;
  onCreateDocument: () => void;
}

export function CreateDropdown({
  onCreateFolder,
  onCreateTable,
  onCreateDocument,
}: CreateDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onCreateFolder} className="gap-3">
          <Folder className="w-4 h-4 text-muted-foreground" />
          Folder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateTable} className="gap-3">
          <Database className="w-4 h-4 text-blue-500" />
          Table
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateDocument} className="gap-3">
          <FileText className="w-4 h-4 text-amber-500" />
          Document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
