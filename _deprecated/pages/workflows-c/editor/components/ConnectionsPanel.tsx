"use client";

import { useState, useEffect } from "react";
import { Link, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useWorkflowEditorStore } from "../store";

interface ConnectionOption {
  id: string;
  name: string;
  toolkit: string;
}

export function ConnectionsPanel() {
  const { steps, connections, setConnection } = useWorkflowEditorStore();
  const [availableConnections, setAvailableConnections] = useState<ConnectionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Get unique toolkits from steps
  const requiredToolkits = [...new Set(
    steps
      .filter((s) => s.type === "composio" && s.toolkitSlug)
      .map((s) => s.toolkitSlug!)
  )];

  useEffect(() => {
    async function fetchConnections() {
      try {
        setLoading(true);
        const response = await fetch("/api/tools/composio/connections");
        if (response.ok) {
          const data = await response.json();
          setAvailableConnections(data.connections || []);
        }
      } catch (err) {
        console.error("Failed to fetch connections:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, []);

  function getConnectionsForToolkit(toolkit: string) {
    return availableConnections.filter(
      (c) => c.toolkit.toLowerCase() === toolkit.toLowerCase()
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading connections...</p>
      </div>
    );
  }

  if (requiredToolkits.length === 0) {
    return (
      <div className="p-8 text-center">
        <Link className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-2">No connections required</p>
        <p className="text-xs text-slate-500">
          Add tools from the palette to see required connections
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-medium text-white mb-1">Required Connections</h3>
        <p className="text-xs text-slate-500">
          Link your accounts for tools in this workflow
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
        {requiredToolkits.map((toolkit) => {
          const toolkitConnections = getConnectionsForToolkit(toolkit);
          const selectedConnection = connections[toolkit];
          const isConnected = selectedConnection !== null && selectedConnection !== undefined;

          return (
            <div key={toolkit} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white capitalize">{toolkit}</span>
                  {isConnected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  )}
                </div>
              </div>

              {toolkitConnections.length > 0 ? (
                <select
                  value={selectedConnection || ""}
                  onChange={(e) => setConnection(toolkit, e.target.value || null)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select a connection...</option>
                  {toolkitConnections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">
                    No {toolkit} connections found
                  </p>
                  <a
                    href="/tools?tab=connections"
                    className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Connect {toolkit} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




