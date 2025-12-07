"use client";

import { Link2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { useWorkflowsDStore } from "../../store";

export function ConnectTab() {
  const { connections, getRequiredToolkits, setConnection, steps } = useWorkflowsDStore();
  const requiredToolkits = getRequiredToolkits();

  // Get unique toolkit info from steps
  const toolkitInfo = steps
    .filter((s) => s.type === "composio" && s.toolkitSlug)
    .reduce((acc, step) => {
      if (step.toolkitSlug && !acc[step.toolkitSlug]) {
        acc[step.toolkitSlug] = {
          slug: step.toolkitSlug,
          name: step.toolkitName || step.toolkitSlug,
          logo: step.toolkitLogo,
        };
      }
      return acc;
    }, {} as Record<string, { slug: string; name: string; logo?: string }>);

  if (requiredToolkits.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-500/10 mb-3">
          <Link2 className="h-6 w-6 text-violet-400" />
        </div>
        <h4 className="text-sm font-medium text-white mb-1">No Connections Required</h4>
        <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
          Add Composio tools to your workflow to see required connections here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-white">Required Connections</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect integrations needed by your workflow steps
        </p>
      </div>

      <div className="space-y-2">
        {requiredToolkits.map((toolkitSlug) => {
          const info = toolkitInfo[toolkitSlug];
          const connectionId = connections[toolkitSlug];
          const isConnected = !!connectionId;

          return (
            <div
              key={toolkitSlug}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isConnected
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-slate-800/30 border-white/5"
              }`}
            >
              {/* Icon */}
              {info?.logo ? (
                <img src={info.logo} alt={info.name} className="h-8 w-8 rounded-lg" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                  {(info?.name || toolkitSlug).charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-medium text-white">
                  {info?.name || toolkitSlug}
                </h5>
                <p className="text-xs text-slate-400">
                  {isConnected ? "Connected" : "Not connected"}
                </p>
              </div>

              {/* Status/Action */}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <button
                    onClick={() => setConnection(toolkitSlug, null)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // In production, this would open OAuth flow
                    // For now, simulate connection
                    setConnection(toolkitSlug, `conn_${Date.now()}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
                >
                  Connect
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning for missing connections */}
      {requiredToolkits.some((slug) => !connections[slug]) && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Some integrations are not connected. The workflow may fail when executed.
          </p>
        </div>
      )}
    </div>
  );
}


