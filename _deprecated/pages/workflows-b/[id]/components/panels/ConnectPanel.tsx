"use client";

import { useWorkflowsBStore } from "../../../editor/store";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_ICONS } from "@/_tables/workflows-b/types";

/**
 * ConnectPanel - Connection requirements display
 * Based on Variation 1 (lines 696-780)
 * 
 * Shows which integrations are required by the workflow and their status.
 * In a real implementation, this would check actual connection status via Composio.
 */
export function ConnectPanel() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  
  if (!workflow) return null;
  
  const connections = workflow.connections;
  
  // Mock connection status - in real implementation this would come from Composio
  const getConnectionStatus = (platform: string): "connected" | "disconnected" | "partial" => {
    // For demo, show some as connected
    if (platform === "openai" || platform === "firecrawl") return "connected";
    return "disconnected";
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-xs text-gray-500">
          Integrations required by tools used in this workflow.
        </p>
      </div>
      
      {/* Connection List */}
      <div className="flex-1 overflow-y-auto space-y-3 -mx-4 px-4">
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">No connections required</p>
            <p className="text-xs text-gray-400">
              Add tools to see what integrations you&apos;ll need
            </p>
          </div>
        ) : (
          connections.map((connection) => {
            const status = getConnectionStatus(connection.platform);
            const isConnected = status === "connected";
            
            return (
              <div
                key={connection.platform}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isConnected
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {PLATFORM_ICONS[connection.platform] || "🔧"}
                    </span>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">
                        {connection.displayName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {connection.toolIds.length} tool{connection.toolIds.length !== 1 ? "s" : ""} used
                      </p>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Circle className="w-4 h-4" />
                      <span className="text-xs">Not connected</span>
                    </div>
                  )}
                </div>
                
                {/* Tools using this connection */}
                <div className="mt-2 pl-9">
                  <div className="text-xs text-gray-500 mb-1">Tools:</div>
                  <div className="flex flex-wrap gap-1">
                    {connection.toolIds.map((toolId) => (
                      <span
                        key={toolId}
                        className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600"
                      >
                        {toolId}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Connect Button */}
                {!isConnected && (
                  <div className="mt-3 pl-9">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Connect {connection.displayName}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Status Summary */}
      {connections.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          {(() => {
            const connectedCount = connections.filter(
              c => getConnectionStatus(c.platform) === "connected"
            ).length;
            const allConnected = connectedCount === connections.length;
            
            return allConnected ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">All connected</div>
                  <div className="text-xs opacity-70">
                    This workflow is ready to run
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">
                    {connectedCount}/{connections.length} connected
                  </div>
                  <div className="text-xs opacity-70">
                    Connect remaining integrations to run this workflow
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}


