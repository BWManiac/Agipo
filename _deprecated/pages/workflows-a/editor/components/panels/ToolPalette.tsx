"use client";

import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComposioTools, filterTools, type ComposioTool, type ToolkitGroup } from "../../hooks/useComposioTools";
import { ToolPaletteGroup } from "./ToolPaletteGroup";
import { useWorkflowEditorStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows/services/types";

export function ToolPalette() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toolkits, isLoading, error, refetch } = useComposioTools();
  const { steps, addStep, setSelectedStep } = useWorkflowEditorStore();

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
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search input */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-sm">Loading tools...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : filteredToolkits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <p className="text-sm">
              {searchQuery ? "No tools match your search" : "No tools available"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredToolkits.map((toolkit) => (
              <ToolPaletteGroup
                key={toolkit.slug}
                toolkit={toolkit}
                onSelectTool={(tool) => handleAddTool(tool, toolkit)}
                defaultExpanded={searchQuery.length > 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-slate-400">
        {toolkits.length > 0 && (
          <span>
            {toolkits.reduce((acc, t) => acc + t.tools.length, 0)} tools from{" "}
            {toolkits.length} integrations
          </span>
        )}
      </div>
    </div>
  );
}




