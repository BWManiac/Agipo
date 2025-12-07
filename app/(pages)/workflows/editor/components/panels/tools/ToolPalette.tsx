"use client";

import { useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useWorkflowStore } from "../../../store";
import { ToolPaletteGroup } from "./ToolPaletteGroup";

export function ToolPalette() {
  const {
    integrations,
    isLoadingTools,
    toolsError,
    toolsSearchQuery,
    fetchTools,
    setToolsSearchQuery,
    getFilteredIntegrations,
  } = useWorkflowStore();

  // Fetch tools on mount if not already loaded
  useEffect(() => {
    if (integrations.length === 0 && !isLoadingTools && !toolsError) {
      fetchTools();
    }
  }, [integrations.length, isLoadingTools, toolsError, fetchTools]);

  const filteredIntegrations = getFilteredIntegrations();

  if (isLoadingTools) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (toolsError) {
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading tools: {toolsError}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={toolsSearchQuery}
            onChange={(e) => setToolsSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Tip */}
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Drag tools to the workflow canvas →
        </p>
      </div>

      {/* Integration list */}
      <div className="flex-1 overflow-y-auto">
        {filteredIntegrations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {toolsSearchQuery ? "No tools found" : "No integrations available"}
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <ToolPaletteGroup
              key={integration.slug}
              integration={integration}
            />
          ))
        )}
      </div>
    </div>
  );
}

