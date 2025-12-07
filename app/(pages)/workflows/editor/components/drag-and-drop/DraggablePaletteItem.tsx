"use client";

import { useDraggable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DraggablePaletteItemProps {
  id: string;
  data: Record<string, unknown>;
  children: ReactNode;
}

export function DraggablePaletteItem({ id, data, children }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { ...data, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
    >
      {children}
    </div>
  );
}

