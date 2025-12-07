"use client";

import { useWorkflowsBStore } from "../../editor/store";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_ICONS } from "@/_tables/workflows-b/types";

/**
 * WorkflowOverview - Top overview card showing workflow info
 * Based on Variation 3 (lines 106-134)
 */
export function WorkflowOverview() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  
  if (!workflow) return null;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Workflow Overview
          </h2>
          <p className="text-sm text-gray-500">
            {workflow.description || "No description provided."}
          </p>
        </div>
      </div>
      
      {/* Requirements Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
        {/* Runtime Inputs */}
        {workflow.inputs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-medium">
              Inputs:
            </span>
            {workflow.inputs.map((input) => (
              <Badge 
                key={input.name}
                variant="secondary"
                className="bg-purple-100 text-purple-700 hover:bg-purple-100"
              >
                {input.name}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Connections */}
        {workflow.connections.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-medium">
              Requires:
            </span>
            {workflow.connections.map((conn) => (
              <Badge 
                key={conn.platform}
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {PLATFORM_ICONS[conn.platform] || "🔧"} {conn.displayName}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {workflow.inputs.length === 0 && workflow.connections.length === 0 && (
          <p className="text-sm text-gray-400">
            Add steps to see requirements
          </p>
        )}
      </div>
    </div>
  );
}




