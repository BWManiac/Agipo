"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConnectionTools, type ConnectionWithTools } from "./agent-modal/hooks/useConnectionTools";
import type { AgentConfig, ConnectionToolBinding } from "@/_tables/types";
import { Link2, AlertCircle } from "lucide-react";
import Link from "next/link";

type ConnectionToolEditorProps = {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bindings: ConnectionToolBinding[]) => Promise<void>;
};

/**
 * Create a unique key for a binding
 */
function bindingKey(connectionId: string, toolId: string): string {
  return `${connectionId}:${toolId}`;
}

/**
 * Group connections by toolkit for display
 */
function groupByToolkit(connections: ConnectionWithTools[]): Map<string, ConnectionWithTools[]> {
  const groups = new Map<string, ConnectionWithTools[]>();
  for (const conn of connections) {
    const key = conn.toolkitSlug;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(conn);
  }
  return groups;
}

export function ConnectionToolEditor({
  agent,
  open,
  onOpenChange,
  onSave,
}: ConnectionToolEditorProps) {
  const {
    availableConnections,
    assignedBindings,
    isLoading,
    fetchData,
  } = useConnectionTools(agent.id);

  const [selectedBindings, setSelectedBindings] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load data and initialize selection when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  // Initialize selected bindings from agent's current bindings
  useEffect(() => {
    if (assignedBindings.length > 0 || availableConnections.length > 0) {
      const initialSelection = new Set(
        assignedBindings.map((b) => bindingKey(b.connectionId, b.toolId))
      );
      setSelectedBindings(initialSelection);
    }
  }, [assignedBindings, availableConnections]);

  // Group connections by toolkit
  const toolkitGroups = useMemo(
    () => groupByToolkit(availableConnections),
    [availableConnections]
  );

  // Filter tools by search query
  const filterTools = (tools: ConnectionWithTools["tools"]) => {
    if (!searchQuery) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query)
    );
  };

  const handleToggle = (connectionId: string, toolId: string, toolkitSlug: string) => {
    const key = bindingKey(connectionId, toolId);
    const newSet = new Set(selectedBindings);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedBindings(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert selected keys back to bindings
      const bindings: ConnectionToolBinding[] = [];
      for (const key of selectedBindings) {
        const [connectionId, toolId] = key.split(":");
        // Find the toolkit slug for this connection
        const connection = availableConnections.find((c) => c.connectionId === connectionId);
        if (connection) {
          bindings.push({
            connectionId,
            toolId,
            toolkitSlug: connection.toolkitSlug,
          });
        }
      }
      await onSave(bindings);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save connection tools:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save connection tools. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original bindings
    const initialSelection = new Set(
      assignedBindings.map((b) => bindingKey(b.connectionId, b.toolId))
    );
    setSelectedBindings(initialSelection);
    setSearchQuery("");
    onOpenChange(false);
  };

  const hasNoConnections = availableConnections.length === 0 && !isLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Connection Tools for {agent.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {!hasNoConnections && (
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}

          <ScrollArea className="flex-1 overflow-auto">
            <div className="space-y-6 pr-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading connection tools...
                </div>
              ) : hasNoConnections ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-slate-100 rounded-full">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No connections available
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                    Connect accounts in Settings to enable connection tools for your agents.
                  </p>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      <Link2 className="h-4 w-4 mr-2" />
                      Go to Connections
                    </Button>
                  </Link>
                </div>
              ) : (
                Array.from(toolkitGroups.entries()).map(([toolkitSlug, connections]) => {
                  const toolkitName = connections[0]?.toolkitName || toolkitSlug;
                  
                  return (
                    <div key={toolkitSlug} className="space-y-3">
                      {/* Toolkit header */}
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {toolkitName}
                      </h3>

                      {/* Connection accounts within toolkit */}
                      {connections.map((connection) => {
                        const filteredTools = filterTools(connection.tools);
                        if (filteredTools.length === 0 && searchQuery) return null;

                        return (
                          <div
                            key={connection.connectionId}
                            className="border rounded-lg overflow-hidden"
                          >
                            {/* Account header */}
                            <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {connection.accountLabel}
                                </span>
                                <Badge
                                  variant={
                                    connection.status === "ACTIVE" ? "default" : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {connection.status === "ACTIVE" ? "Active" : connection.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Tools list */}
                            <div className="divide-y">
                              {filteredTools.map((tool) => {
                                const key = bindingKey(connection.connectionId, tool.id);
                                const isSelected = selectedBindings.has(key);

                                return (
                                  <div
                                    key={tool.id}
                                    className="flex items-start space-x-3 p-3 hover:bg-slate-50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleToggle(
                                          connection.connectionId,
                                          tool.id,
                                          connection.toolkitSlug
                                        )
                                      }
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate">
                                          {tool.name || tool.id}
                                        </h4>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {tool.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {!hasNoConnections && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

