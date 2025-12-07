"use client";

import { useDroppable } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  index: number;
}

export function DropZone({ id, index }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "drop-zone", index },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-4 w-full flex items-center justify-center transition-all ${
        isOver ? "h-12" : ""
      }`}
    >
      {isOver && (
        <div className="w-48 h-1 bg-primary rounded-full" />
      )}
    </div>
  );
}

