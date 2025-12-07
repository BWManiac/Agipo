"use client";

import type { ComposioTool } from "../../hooks/useComposioTools";

interface ToolPaletteItemProps {
  tool: ComposioTool;
  onAdd: () => void;
}

export function ToolPaletteItem({ tool, onAdd }: ToolPaletteItemProps) {
  const inputCount = tool.inputSchema.properties 
    ? Object.keys(tool.inputSchema.properties).length 
    : 0;
  const outputCount = tool.outputSchema.properties 
    ? Object.keys(tool.outputSchema.properties).length 
    : 0;

  return (
    <button
      onClick={onAdd}
      className="w-full text-left px-3 py-2 hover:bg-[#1a1a2e] transition-colors border-b border-[#1a1a2e] last:border-b-0"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white font-medium">{tool.name}</span>
        <span className="text-xs text-gray-500">
          {inputCount} in, {outputCount} out
        </span>
      </div>
      {tool.description && (
        <p className="text-xs text-gray-400 line-clamp-2">{tool.description}</p>
      )}
    </button>
  );
}


