"use client";

import { cn } from "@/lib/utils";
import type { OutlineItem as OutlineItemType } from "../../store/slices/outlineSlice";

interface OutlineItemProps {
  heading: OutlineItemType;
  isActive: boolean;
  onClick: () => void;
}

export function OutlineItem({ heading, isActive, onClick }: OutlineItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1 rounded text-sm hover:bg-accent transition-colors",
        isActive && "bg-accent font-medium",
        heading.level === 1 && "font-semibold",
        heading.level === 2 && "pl-4",
        heading.level === 3 && "pl-6",
        heading.level === 4 && "pl-8",
        heading.level === 5 && "pl-10",
        heading.level === 6 && "pl-12"
      )}
    >
      {heading.text}
    </button>
  );
}
