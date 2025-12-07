"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComposioTool } from "../../hooks/useComposioTools";

interface ToolPaletteItemProps {
  tool: ComposioTool;
  onSelect: () => void;
}

export function ToolPaletteItem({ tool, onSelect }: ToolPaletteItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-2 px-3 py-2 text-left",
        "hover:bg-blue-50 transition-colors group"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{tool.name}</div>
        <div className="text-xs text-slate-500 line-clamp-2">{tool.description}</div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="h-4 w-4 text-blue-500" />
      </div>
    </button>
  );
}




