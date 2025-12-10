"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAgentModalStore, type ConnectionWithTools, type PlatformToolkit } from "./agent-modal/store";
import type { AgentConfig, ConnectionToolBinding } from "@/_tables/types";
import { ChevronLeft, ChevronDown, ChevronRight, AlertCircle, Link2, Zap } from "lucide-react";
import Link from "next/link";

type ConnectionToolEditorPanelProps = {
  agent: AgentConfig;
  onBack: () => void;
  onSave: (bindings: ConnectionToolBinding[]) => Promise<void>;
};

// Special marker for NO_AUTH platform tools (no connection needed)
const PLATFORM_TOOL_MARKER = "__platform__";

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
  // Store state
  const availableConnections = useAgentModalStore((state) => state.availableConnections);
  const platformToolkits = useAgentModalStore((state) => state.platformToolkits);
  const assignedConnectionBindings = useAgentModalStore((state) => state.assignedConnectionBindings);
  const isLoadingConnectionTools = useAgentModalStore((state) => state.isLoadingConnectionTools);
  const selectedConnectionBindings = useAgentModalStore((state) => state.selectedConnectionBindings);
  const expandedToolkits = useAgentModalStore((state) => state.expandedToolkits);
  const connectionSearchQuery = useAgentModalStore((state) => state.connectionSearchQuery);
  const isSavingConnectionTools = useAgentModalStore((state) => state.isSavingConnectionTools);

  // Store actions
  const fetchConnectionTools = useAgentModalStore((state) => state.fetchConnectionTools);
  const toggleConnectionBinding = useAgentModalStore((state) => state.toggleConnectionBinding);
  const toggleToolkit = useAgentModalStore((state) => state.toggleToolkit);
  const setConnectionSearchQuery = useAgentModalStore((state) => state.setConnectionSearchQuery);

  // Load data when panel mounts
  useEffect(() => {
    fetchConnectionTools(agent.id);
  }, [agent.id, fetchConnectionTools]);

  // Initialize selected bindings (toolkits collapsed by default)
  useEffect(() => {
    if (assignedConnectionBindings.length > 0 && selectedConnectionBindings.size === 0) {
      // Initialize store state with selected bindings (only if store is empty)
      // Use store actions to initialize instead of direct setState
      assignedConnectionBindings.forEach((b) => {
        // Platform tools have empty connectionId, use marker
        const connId = b.connectionId || PLATFORM_TOOL_MARKER;
        const key = bindingKey(connId, b.toolId);
        toggleConnectionBinding(key);
      });
    }
    // Only run when assignedConnectionBindings changes, not when selectedConnectionBindings changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedConnectionBindings.length]);

  const toolkitGroups = useMemo(
    () => groupByToolkit(availableConnections),
    [availableConnections]
  );

  const filterTools = (tools: ConnectionWithTools["tools"]) => {
    if (!connectionSearchQuery) return tools;
    const query = connectionSearchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query)
    );
  };

  const handleToggle = (connectionId: string, toolId: string) => {
    const key = bindingKey(connectionId, toolId);
    toggleConnectionBinding(key);
  };

  const handleSave = async () => {
    try {
      const bindings: ConnectionToolBinding[] = [];
      for (const key of selectedConnectionBindings) {
        const [connectionId, toolId] = key.split(":");
        
        // Check if it's a platform tool
        if (connectionId === PLATFORM_TOOL_MARKER) {
          const platformToolkit = platformToolkits.find((pt) =>
            pt.tools.some((t) => t.id === toolId)
          );
          if (platformToolkit) {
            bindings.push({
              connectionId: "", // Empty for platform tools
              toolId,
              toolkitSlug: platformToolkit.slug,
            });
          }
        } else {
          // Regular connection tool
          const connection = availableConnections.find((c) => c.connectionId === connectionId);
          if (connection) {
            bindings.push({
              connectionId,
              toolId,
              toolkitSlug: connection.toolkitSlug,
            });
          }
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
    }
  };

  const hasNoTools = availableConnections.length === 0 && platformToolkits.length === 0 && !isLoadingConnectionTools;

  // Count selected tools per toolkit for badge
  const getSelectedCount = (connections: ConnectionWithTools[]) => {
    let count = 0;
    for (const conn of connections) {
      for (const tool of conn.tools) {
        if (selectedConnectionBindings.has(bindingKey(conn.connectionId, tool.id))) {
          count++;
        }
      }
    }
    return count;
  };

  // Count selected tools for platform toolkit
  const getPlatformSelectedCount = (toolkit: PlatformToolkit) => {
    let count = 0;
    for (const tool of toolkit.tools) {
      if (selectedConnectionBindings.has(bindingKey(PLATFORM_TOOL_MARKER, tool.id))) {
        count++;
      }
    }
    return count;
  };

  // Filter tools for platform toolkit
  const filterPlatformTools = (tools: PlatformToolkit["tools"]) => {
    if (!connectionSearchQuery) return tools;
    const query = connectionSearchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query)
    );
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
      {!hasNoTools && (
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <Input
            placeholder="Search tools..."
            value={connectionSearchQuery}
            onChange={(e) => setConnectionSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoadingConnectionTools ? (
          <div className="text-center text-gray-500 py-12">
            Loading connection tools...
          </div>
        ) : hasNoTools ? (
          <div className="text-center py-12 max-w-sm mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tools available
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
          <div className="space-y-6">
            {/* Platform Tools Section */}
            {platformToolkits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Platform Tools
                  </h3>
                  <span className="text-xs text-gray-400">(No setup required)</span>
                </div>
                <div className="space-y-2">
                  {platformToolkits.map((toolkit) => {
                    const isExpanded = expandedToolkits.has(toolkit.slug);
                    const selectedCount = getPlatformSelectedCount(toolkit);
                    const filteredTools = filterPlatformTools(toolkit.tools);

                    return (
                      <div key={toolkit.slug} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => toggleToolkit(toolkit.slug)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            {toolkit.logo && (
                              <img src={toolkit.logo} alt="" className="h-5 w-5 rounded" />
                            )}
                            <span className="font-medium text-sm">{toolkit.name}</span>
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                              No Auth
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {selectedCount} / {toolkit.tools.length} selected
                          </span>
                        </button>

                        {isExpanded && filteredTools.length > 0 && (
                          <div className="border-t border-gray-200 divide-y divide-gray-100">
                            {filteredTools.map((tool) => {
                              const key = bindingKey(PLATFORM_TOOL_MARKER, tool.id);
                              const isSelected = selectedConnectionBindings.has(key);

                              return (
                                <label
                                  key={tool.id}
                                  className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleToggle(PLATFORM_TOOL_MARKER, tool.id)
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Your Connections Section */}
            {availableConnections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Your Connections
                </h3>
                <div className="space-y-2">
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
                        if (filteredTools.length === 0 && connectionSearchQuery) return null;

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
                                const isSelected = selectedConnectionBindings.has(key);

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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!hasNoTools && (
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onBack} disabled={isSavingConnectionTools}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSavingConnectionTools}>
            {isSavingConnectionTools ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

