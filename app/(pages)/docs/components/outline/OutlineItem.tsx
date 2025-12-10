"use client";

import { cn } from "@/lib/utils";
import type { OutlineHeading } from "../../store/types";

interface OutlineItemProps {
  heading: OutlineHeading;
  isActive: boolean;
  onClick: () => void;
}

export function OutlineItem({ heading, isActive, onClick }: OutlineItemProps) {
  // Calculate indentation based on heading level
  const paddingLeft = (heading.level - 1) * 12;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-muted",
        isActive && "bg-muted font-medium"
      )}
      style={{ paddingLeft: `${paddingLeft + 12}px` }}
    >
      <span className="truncate block">{heading.text}</span>
    </button>
  );
}
