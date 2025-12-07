"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ToolPaletteItem } from "./ToolPaletteItem";
import type { ToolkitGroup, ComposioTool } from "../../hooks/useComposioTools";

interface ToolPaletteGroupProps {
  toolkit: ToolkitGroup;
  onAddTool: (tool: ComposioTool) => void;
}

export function ToolPaletteGroup({ toolkit, onAddTool }: ToolPaletteGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[#1a1a2e] rounded-lg bg-[#12121f]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#1a1a2e] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-white">{toolkit.name}</span>
          <span className="text-xs text-gray-500">({toolkit.tools.length})</span>
        </div>
      </button>

      {/* Tools */}
      {isExpanded && (
        <div className="border-t border-[#1a1a2e]">
          {toolkit.tools.map((tool) => (
            <ToolPaletteItem
              key={tool.id}
              tool={tool}
              onAdd={() => onAddTool(tool)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


