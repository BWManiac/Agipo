"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockHandleProps {
  blockId: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

/**
 * Block Handle Component
 *
 * Shows a drag handle on hover for block reordering.
 * Phase 3: Basic hover-only handle (full drag-and-drop in future enhancement)
 */
export function BlockHandle({
  blockId,
  onDragStart,
  onDragEnd,
  className,
}: BlockHandleProps) {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
    >
      <button
        type="button"
        className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        data-block-id={blockId}
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
