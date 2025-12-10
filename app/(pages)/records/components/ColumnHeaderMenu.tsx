"use client";

import { useRecordsStore } from "../store";
import { Input } from "@/components/ui/input";
import {
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Scissors,
  Copy,
  ClipboardPaste,
  Plus,
  Trash2,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ColumnHeaderMenuProps {
  columnId: string;
  columnName: string;
  columnType: string;
  onClose: () => void;
}

export function ColumnHeaderMenu({
  columnId,
  columnName,
  columnType,
  onClose,
}: ColumnHeaderMenuProps) {
  const [textFilter, setTextFilter] = useState("");

  const {
    sortColumn,
    sortDirection,
    filters,
    setSort,
    setFilter,
    removeFilter,
  } = useRecordsStore();

  const isSortedAsc = sortColumn === columnId && sortDirection === "asc";
  const isSortedDesc = sortColumn === columnId && sortDirection === "desc";
  const hasFilter = columnId in filters;

  const handleSortAsc = () => {
    setSort(columnId, "asc");
    onClose();
  };

  const handleSortDesc = () => {
    setSort(columnId, "desc");
    onClose();
  };

  const handleTextFilter = () => {
    if (textFilter.trim()) {
      setFilter(columnId, { operator: "contains", value: textFilter.trim() });
    }
    onClose();
  };

  const handleClearFilter = () => {
    removeFilter(columnId);
    setTextFilter("");
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-lg border py-1 text-sm">
      {/* Clipboard Section */}
      <div className="px-1 py-1 border-b">
        <MenuItem icon={Scissors} label="Cut" shortcut="⌘X" disabled />
        <MenuItem icon={Copy} label="Copy" shortcut="⌘C" disabled />
        <MenuItem icon={ClipboardPaste} label="Paste" shortcut="⌘V" disabled />
      </div>

      {/* Column Structure Section */}
      <div className="px-1 py-1 border-b">
        <MenuItem icon={Plus} label="Insert 1 column left" disabled />
        <MenuItem icon={Plus} label="Insert 1 column right" disabled />
        <MenuItem icon={Trash2} label="Delete column" disabled />
        <MenuItem icon={EyeOff} label="Hide column" disabled />
        <MenuItem icon={GripVertical} label="Resize column" disabled />
      </div>

      {/* Filter Section */}
      <div className="px-1 py-1 border-b">
        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Filter
        </div>
        <div className="px-3 py-1">
          <div className="flex gap-1">
            <Input
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Contains..."
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleTextFilter()}
            />
            <button
              onClick={handleTextFilter}
              className="px-2 h-7 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        </div>
        {hasFilter && (
          <button
            onClick={handleClearFilter}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear filter
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="px-1 py-1">
        <MenuItem
          icon={ArrowUp}
          label="Sort A → Z"
          onClick={handleSortAsc}
          active={isSortedAsc}
        />
        <MenuItem
          icon={ArrowDown}
          label="Sort Z → A"
          onClick={handleSortDesc}
          active={isSortedDesc}
        />
      </div>
    </div>
  );
}

// Reusable menu item component
function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-1.5 rounded-sm transition-colors",
        disabled
          ? "text-muted-foreground/50 cursor-not-allowed"
          : "hover:bg-muted/50",
        active && "bg-blue-50 text-blue-700"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground">{shortcut}</span>
      )}
    </button>
  );
}
