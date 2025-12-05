"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useConnectionTools, type ConnectionWithTools } from "./agent-modal/hooks/useConnectionTools";
import type { AgentConfig, ConnectionToolBinding } from "@/_tables/types";
import { ChevronLeft, ChevronDown, ChevronRight, AlertCircle, Link2 } from "lucide-react";
import Link from "next/link";

type ConnectionToolEditorPanelProps = {
  agent: AgentConfig;
  onBack: () => void;
  onSave: (bindings: ConnectionToolBinding[]) => Promise<void>;
};

function bindingKey(connectionId: string, toolId: string): string {
  return `${connectionId}:${toolId}`;
}

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

export function ConnectionToolEditorPanel({
  agent,
  onBack,
  onSave,
}: ConnectionToolEditorPanelProps) {
  const {
    availableConnections,
    assignedBindings,
    isLoading,
    fetchData,
  } = useConnectionTools(agent.id);

  const [selectedBindings, setSelectedBindings] = useState<Set<string>>(new Set());
  const [expandedToolkits, setExpandedToolkits] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load data when panel mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize selected bindings (toolkits collapsed by default)
  useEffect(() => {
    if (assignedBindings.length > 0 || availableConnections.length > 0) {
      const initialSelection = new Set(
        assignedBindings.map((b) => bindingKey(b.connectionId, b.toolId))
      );
      setSelectedBindings(initialSelection);
      // Keep toolkits collapsed by default - user can expand as needed
    }
  }, [assignedBindings, availableConnections]);

  const toolkitGroups = useMemo(
    () => groupByToolkit(availableConnections),
    [availableConnections]
  );

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

  const toggleToolkit = (toolkitSlug: string) => {
    const newSet = new Set(expandedToolkits);
    if (newSet.has(toolkitSlug)) {
      newSet.delete(toolkitSlug);
    } else {
      newSet.add(toolkitSlug);
    }
    setExpandedToolkits(newSet);
  };

  const handleToggle = (connectionId: string, toolId: string) => {
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
      const bindings: ConnectionToolBinding[] = [];
      for (const key of selectedBindings) {
        const [connectionId, toolId] = key.split(":");
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

  const hasNoConnections = availableConnections.length === 0 && !isLoading;

  // Count selected tools per toolkit for badge
  const getSelectedCount = (connections: ConnectionWithTools[]) => {
    let count = 0;
    for (const conn of connections) {
      for (const tool of conn.tools) {
        if (selectedBindings.has(bindingKey(conn.connectionId, tool.id))) {
          count++;
        }
      }
    }
    return count;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Manage Connection Tools</h2>
            <p className="text-sm text-gray-500">
              Select which connection tools {agent.name} can use.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      {!hasNoConnections && (
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-12">
            Loading connection tools...
          </div>
        ) : hasNoConnections ? (
          <div className="text-center py-12 max-w-sm mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No connections available
            </h3>
            <p className="text-sm text-gray-500 mb-4">
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
          <div className="space-y-4">
            {Array.from(toolkitGroups.entries()).map(([toolkitSlug, connections]) => {
              const toolkitName = connections[0]?.toolkitName || toolkitSlug;
              const isExpanded = expandedToolkits.has(toolkitSlug);
              const selectedCount = getSelectedCount(connections);
              const totalTools = connections.reduce((sum, c) => sum + c.tools.length, 0);

              return (
                <div key={toolkitSlug} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  {/* Toolkit Header - Collapsible */}
                  <button
                    onClick={() => toggleToolkit(toolkitSlug)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm">{toolkitName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {connections[0]?.status === "ACTIVE" ? "Active" : connections[0]?.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedCount} / {totalTools} selected
                    </span>
                  </button>

                  {/* Tools List - Collapsible Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {connections.map((connection) => {
                        const filteredTools = filterTools(connection.tools);
                        if (filteredTools.length === 0 && searchQuery) return null;

                        return (
                          <div key={connection.connectionId}>
                            {/* Show account label if multiple connections per toolkit */}
                            {connections.length > 1 && (
                              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs text-gray-500">
                                  {connection.accountLabel}
                                </span>
                              </div>
                            )}
                            
                            <div className="divide-y divide-gray-100">
                              {filteredTools.map((tool) => {
                                const key = bindingKey(connection.connectionId, tool.id);
                                const isSelected = selectedBindings.has(key);

                                return (
                                  <label
                                    key={tool.id}
                                    className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleToggle(connection.connectionId, tool.id)
                                      }
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm">
                                        {tool.name || tool.id}
                                      </div>
                                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                        {tool.description}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!hasNoConnections && (
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

