"use client";

import type { Tool, Integration } from "../../../store/slices/tabs/toolsSlice";
import { DraggablePaletteItem } from "../../drag-and-drop/DraggablePaletteItem";

interface ToolPaletteItemProps {
  tool: Tool;
  integration: Integration;
}

export function ToolPaletteItem({ tool, integration }: ToolPaletteItemProps) {
  return (
    <DraggablePaletteItem
      id={`palette-tool-${tool.id}`}
      data={{ type: "tool", tool, integration, name: tool.name }}
    >
      <div className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {tool.name}
          </span>
        </div>
        {tool.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {tool.description}
          </p>
        )}
      </div>
    </DraggablePaletteItem>
  );
}

