"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Integration } from "../../../store/slices/tabs/toolsSlice";
import { ToolPaletteItem } from "./ToolPaletteItem";

interface ToolPaletteGroupProps {
  integration: Integration;
}

export function ToolPaletteGroup({ integration }: ToolPaletteGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-accent/50 transition-colors"
      >
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
        <span className="flex-1 text-sm font-medium text-foreground text-left truncate">
          {integration.name}
        </span>
        <span className="text-xs text-muted-foreground">
          ({integration.tools.length})
        </span>
      </button>

      {isExpanded && (
        <div className="pb-2 px-2 pl-8 space-y-1">
          {integration.tools.map((tool) => (
            <ToolPaletteItem
              key={tool.id}
              tool={tool}
              integration={integration}
            />
          ))}
        </div>
      )}
    </div>
  );
}

