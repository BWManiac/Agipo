"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface ContainerDropZoneProps {
  id: string;
  containerId: string;
  index: number;
  className?: string;
}

/**
 * Drop zone inside containers (Loop, ForEach).
 * Styled differently from main rail drop zones.
 */
export function ContainerDropZone({
  id,
  containerId,
  index,
  className,
}: ContainerDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "container-drop-zone",
      containerId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full min-h-[24px] flex items-center justify-center transition-all duration-150 rounded-md",
        isOver
          ? "bg-primary/20 border-2 border-dashed border-primary min-h-[40px]"
          : "hover:bg-muted/50",
        className
      )}
    >
      {isOver && (
        <span className="text-xs text-primary font-medium">Drop here</span>
      )}
    </div>
  );
}

