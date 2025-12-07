"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolkitGroup, ComposioTool } from "../../hooks/useComposioTools";
import { ToolPaletteItem } from "./ToolPaletteItem";

interface ToolPaletteGroupProps {
  toolkit: ToolkitGroup;
  onSelectTool: (tool: ComposioTool) => void;
  defaultExpanded?: boolean;
}

export function ToolPaletteGroup({
  toolkit,
  onSelectTool,
  defaultExpanded = false,
}: ToolPaletteGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left",
          "hover:bg-slate-50 transition-colors"
        )}
      >
        {toolkit.logo ? (
          <img src={toolkit.logo} alt={toolkit.name} className="h-5 w-5 rounded" />
        ) : (
          <div className="h-5 w-5 rounded bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
            {toolkit.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="flex-1 font-medium text-sm">{toolkit.name}</span>
        <span className="text-xs text-slate-400">{toolkit.tools.length}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t">
          {toolkit.tools.map((tool) => (
            <ToolPaletteItem key={tool.id} tool={tool} onSelect={() => onSelectTool(tool)} />
          ))}
        </div>
      )}
    </div>
  );
}
