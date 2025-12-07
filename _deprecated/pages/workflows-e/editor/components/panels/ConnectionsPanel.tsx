"use client";

import { useWorkflowEditorStore } from "../../store";

export function ConnectionsPanel() {
  const { getRequiredToolkits, connections } = useWorkflowEditorStore();
  const requiredToolkits = getRequiredToolkits();

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-4">
        Required connections for this workflow.
      </p>
      {requiredToolkits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-2">No connections required</p>
          <p className="text-xs text-gray-500">Add Composio tools to see required connections</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requiredToolkits.map((toolkitSlug) => {
            const connectionId = connections[toolkitSlug];
            const isConnected = connectionId !== null && connectionId !== undefined;
            
            return (
              <div key={toolkitSlug} className="p-3 bg-[#12121f] rounded border border-[#1a1a2e]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{toolkitSlug}</p>
                    <p className="text-xs text-gray-400">
                      {isConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">Full connections editor coming in Phase 7</p>
    </div>
  );
}


