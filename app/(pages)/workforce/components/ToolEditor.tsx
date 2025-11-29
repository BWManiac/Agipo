"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentConfig, WorkflowSummary } from "@/_tables/types";

type ToolEditorProps = {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (toolIds: string[]) => Promise<void>;
};

/**
 * Normalizes tool ID by removing the "workflow-" prefix if present.
 * Used for comparing agent toolIds (which may have prefix) with list API IDs (which don't).
 */
function normalizeToolIdForComparison(id: string): string {
  return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
}

/**
 * Converts a tool definition ID to the executable tool format (adds "workflow-" prefix).
 * Used when saving tool IDs to match the format expected by executable tools.
 */
function toExecutableToolId(id: string): string {
  return id.startsWith("workflow-") ? id : `workflow-${id}`;
}

export function ToolEditor({ agent, open, onOpenChange, onSave }: ToolEditorProps) {
  // Store normalized IDs (without "workflow-" prefix) for comparison with list API
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [tools, setTools] = useState<WorkflowSummary[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  // Load tools when dialog opens
  useEffect(() => {
    if (open) {
      // Normalize agent.toolIds (remove "workflow-" prefix) for comparison with list API
      const normalizedAgentToolIds = new Set(
        agent.toolIds.map(normalizeToolIdForComparison)
      );
      setSelectedToolIds(normalizedAgentToolIds);
      setSearchQuery("");
      loadTools();
    }
  }, [open, agent.toolIds]);

  const loadTools = async () => {
    setIsLoadingTools(true);
    try {
      const response = await fetch("/api/tools/list");
      if (!response.ok) {
        throw new Error("Failed to load tools");
      }
      const data = await response.json();
      setTools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tools:", error);
      setTools([]);
    } finally {
      setIsLoadingTools(false);
    }
  };

  // Filter tools by search query
  const filterTools = (toolList: WorkflowSummary[]) => {
    if (!searchQuery) return toolList;
    const query = searchQuery.toLowerCase();
    return toolList.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  };

  const handleToggle = (toolId: string) => {
    // toolId from list API is already normalized (no prefix)
    const newSet = new Set(selectedToolIds);
    if (newSet.has(toolId)) {
      newSet.delete(toolId);
    } else {
      newSet.add(toolId);
    }
    setSelectedToolIds(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert normalized IDs back to executable format (with "workflow-" prefix)
      const executableToolIds = Array.from(selectedToolIds).map(toExecutableToolId);
      await onSave(executableToolIds);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save tools. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTools = filterTools(tools);

  const handleCancel = () => {
    // Reset to original normalized agent toolIds
    const normalizedAgentToolIds = new Set(
      agent.toolIds.map(normalizeToolIdForComparison)
    );
    setSelectedToolIds(normalizedAgentToolIds);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCancel();
      }
    }}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Tools for {agent.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ScrollArea className="flex-1 overflow-auto">
            <div className="space-y-6 pr-4">
              {isLoadingTools ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading tools...
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tools available. Create tools in the workflow editor to get started.
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Available Tools</h3>
                  <div className="space-y-2">
                    {filteredTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border"
                      >
                        <Checkbox
                          checked={selectedToolIds.has(tool.id)}
                          onCheckedChange={() => handleToggle(tool.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{tool.name}</h4>
                            <Badge variant="outline">Workflow</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

