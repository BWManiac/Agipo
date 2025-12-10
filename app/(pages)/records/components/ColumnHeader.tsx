"use client";

import { useRef, useEffect } from "react";
import { useRecordsStore } from "../store";
import { ColumnHeaderMenu } from "./ColumnHeaderMenu";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnHeaderProps {
  columnId: string;
  columnName: string;
  columnType: string;
}

export function ColumnHeader({
  columnId,
  columnName,
  columnType,
}: ColumnHeaderProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    sortColumn,
    sortDirection,
    filters,
    activeColumnId,
    setActiveColumn,
  } = useRecordsStore();

  const isSorted = sortColumn === columnId;
  const hasFilter = columnId in filters;
  const isMenuOpen = activeColumnId === columnId;
  const hasIndicator = isSorted || hasFilter;

  const handleClick = () => {
    setActiveColumn(isMenuOpen ? null : columnId);
  };

  const handleClose = () => {
    setActiveColumn(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    // Delay to avoid immediate close on the same click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Header Cell */}
      <button
        onClick={handleClick}
        className={cn(
          "w-full h-full flex items-center justify-between gap-1 px-1 py-1 group transition-colors rounded-sm",
          "hover:bg-muted/70",
          isMenuOpen && "bg-blue-100",
          hasIndicator && !isMenuOpen && "bg-blue-50/50"
        )}
      >
        {/* Column Name + Indicators */}
        <div className="flex items-center gap-1 min-w-0">
          <span
            className={cn(
              "text-xs uppercase tracking-wider font-semibold truncate",
              (hasIndicator || isMenuOpen) && "text-blue-700"
            )}
          >
            {columnName}
          </span>

          {/* Sort Indicator (always visible when sorted) */}
          {isSorted && (
            <span className="text-xs text-blue-600 shrink-0">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}

          {/* Filter Indicator (always visible when filtered) */}
          {hasFilter && (
            <Filter className="h-3 w-3 text-blue-600 shrink-0" />
          )}
        </div>

        {/* Dropdown Arrow (visible on hover or when menu is open) */}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-opacity duration-150",
            isMenuOpen
              ? "opacity-100 text-blue-700"
              : "opacity-0 group-hover:opacity-100 text-muted-foreground"
          )}
        />
      </button>

      {/* Dropdown Menu - positioned fixed to avoid clipping */}
      {isMenuOpen && (
        <div
          className="fixed z-50"
          style={{
            top: menuRef.current?.getBoundingClientRect().bottom ?? 0,
            left: Math.max(8, menuRef.current?.getBoundingClientRect().left ?? 0),
          }}
        >
          <ColumnHeaderMenu
            columnId={columnId}
            columnName={columnName}
            columnType={columnType}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
