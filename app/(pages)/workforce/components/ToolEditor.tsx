"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tools } from "@/_tables/tools";
import type { AgentConfig } from "@/_tables/types";

type ToolEditorProps = {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (toolIds: string[]) => Promise<void>;
};

export function ToolEditor({ agent, open, onOpenChange, onSave }: ToolEditorProps) {
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(
    new Set(agent.toolIds)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedToolIds(new Set(agent.toolIds));
      setSearchQuery("");
    }
  }, [open, agent.toolIds]);

  // Group tools by source (built-in vs workflow)
  const { builtInTools, workflowTools } = useMemo(() => {
    const builtIn: typeof tools = [];
    const workflow: typeof tools = [];

    tools.forEach((tool) => {
      if (tool.id.startsWith("workflow-")) {
        workflow.push(tool);
      } else {
        builtIn.push(tool);
      }
    });

    return { builtInTools: builtIn, workflowTools: workflow };
  }, []);

  // Filter tools by search query
  const filterTools = (toolList: typeof tools) => {
    if (!searchQuery) return toolList;
    const query = searchQuery.toLowerCase();
    return toolList.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  };

  const handleToggle = (toolId: string) => {
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
      await onSave(Array.from(selectedToolIds));
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save tools. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBuiltIn = filterTools(builtInTools);
  const filteredWorkflow = filterTools(workflowTools);

  const handleCancel = () => {
    setSelectedToolIds(new Set(agent.toolIds)); // Reset to original
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
              {/* Built-in Tools Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Built-in Tools</h3>
                <div className="space-y-2">
                  {filteredBuiltIn.map((tool) => (
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
                          <Badge variant="secondary">Built-in</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Tools Section */}
              {filteredWorkflow.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Workflow Tools</h3>
                  <div className="space-y-2">
                    {filteredWorkflow.map((tool) => (
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

