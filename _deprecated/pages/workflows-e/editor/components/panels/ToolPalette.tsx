"use client";

import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useComposioTools, filterTools, type ComposioTool, type ToolkitGroup } from "../../hooks/useComposioTools";
import { ToolPaletteGroup } from "./ToolPaletteGroup";
import { useWorkflowEditorStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows-e/services/types";

export function ToolPalette() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toolkits, isLoading, error } = useComposioTools();
  const { steps, addStep, setSelectedStep, setConnection } = useWorkflowEditorStore();

  // Filter toolkits based on search
  const filteredToolkits = useMemo(
    () => filterTools(toolkits, searchQuery),
    [toolkits, searchQuery]
  );

  const handleAddTool = (tool: ComposioTool, toolkit: ToolkitGroup) => {
    const newStep: WorkflowStep = {
      id: nanoid(),
      type: "composio",
      toolId: tool.id,
      toolkitSlug: toolkit.slug,
      toolkitName: toolkit.name,
      toolkitLogo: toolkit.logo,
      position: { x: 100 + steps.length * 50, y: 100 + steps.length * 50 },
      listIndex: steps.length,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
      name: tool.name,
      description: tool.description,
    };

    addStep(newStep);
    setSelectedStep(newStep.id);
    
    // Auto-detect connection requirement
    if (toolkit.slug && toolkit.slug !== "browser_tool") {
      setConnection(toolkit.slug, null); // null = inherit from agent
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400">Error loading tools: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-[#1a1a2e]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#0a0a14] border-[#1a1a2e] text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Toolkits */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredToolkits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No tools found</p>
          </div>
        ) : (
          filteredToolkits.map((toolkit) => (
            <ToolPaletteGroup
              key={toolkit.slug}
              toolkit={toolkit}
              onAddTool={(tool) => handleAddTool(tool, toolkit)}
            />
          ))
        )}
      </div>
    </div>
  );
}


