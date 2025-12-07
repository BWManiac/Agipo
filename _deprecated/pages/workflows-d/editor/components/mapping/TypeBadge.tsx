"use client";

import { getTypeColor, getTypeLabel } from "../../utils/schemaUtils";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 text-[10px]" 
    : "px-2 py-1 text-xs";

  return (
    <span className={`inline-flex items-center font-medium rounded border ${sizeClasses} ${getTypeColor(type)}`}>
      {getTypeLabel(type)}
    </span>
  );
}




