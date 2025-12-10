"use client";

import { useState } from "react";
import { useRecordsStore } from "../store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowUp, ArrowDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnMenuProps {
  columnId: string;
  columnName: string;
  uniqueValues?: string[];
}

export function ColumnMenu({ columnId, columnName, uniqueValues = [] }: ColumnMenuProps) {
  const [open, setOpen] = useState(false);
  const [textFilter, setTextFilter] = useState("");

  const {
    sortColumn,
    sortDirection,
    filters,
    toggleSort,
    setFilter,
    removeFilter,
  } = useRecordsStore();

  const isSorted = sortColumn === columnId;
  const hasFilter = columnId in filters;

  const handleSortAsc = () => {
    if (sortColumn === columnId && sortDirection === "asc") {
      toggleSort(columnId); // Will cycle to desc
    } else {
      useRecordsStore.getState().setSort(columnId, "asc");
    }
    setOpen(false);
  };

  const handleSortDesc = () => {
    if (sortColumn === columnId && sortDirection === "desc") {
      toggleSort(columnId); // Will clear
    } else {
      useRecordsStore.getState().setSort(columnId, "desc");
    }
    setOpen(false);
  };

  const handleTextFilter = () => {
    if (textFilter.trim()) {
      setFilter(columnId, { operator: "contains", value: textFilter.trim() });
    }
    setOpen(false);
  };

  const handleClearFilter = () => {
    removeFilter(columnId);
    setTextFilter("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors",
            (isSorted || hasFilter) && "text-blue-600"
          )}
        >
          <span className="text-xs uppercase tracking-wider font-semibold">
            {columnName}
          </span>
          {isSorted && (
            <span className="text-xs">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
          {hasFilter && <Filter className="h-3 w-3" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {/* Sort Options */}
        <div className="p-2 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            Sort
          </div>
          <button
            onClick={handleSortAsc}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-secondary rounded-md",
              isSorted && sortDirection === "asc" && "bg-secondary"
            )}
          >
            <ArrowUp className="h-4 w-4" />
            Sort A → Z
          </button>
          <button
            onClick={handleSortDesc}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-secondary rounded-md",
              isSorted && sortDirection === "desc" && "bg-secondary"
            )}
          >
            <ArrowDown className="h-4 w-4" />
            Sort Z → A
          </button>
        </div>

        {/* Text Filter */}
        <div className="p-2 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            Text contains
          </div>
          <div className="flex gap-1">
            <Input
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Search..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleTextFilter()}
            />
            <Button size="sm" className="h-8" onClick={handleTextFilter}>
              Apply
            </Button>
          </div>
        </div>

        {/* Clear Filter */}
        {hasFilter && (
          <div className="p-2">
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear filter
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
