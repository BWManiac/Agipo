"use client";

import { useEffect, useState } from "react";
import { Plug, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowEditorStore } from "../../store";

interface ConnectionStatus {
  toolkitSlug: string;
  toolkitName: string;
  logo?: string;
  isConnected: boolean;
}

export function ConnectionsPanel() {
  const { steps, connections, getRequiredToolkits } = useWorkflowEditorStore();
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const requiredToolkits = getRequiredToolkits();

  useEffect(() => {
    // Build connection statuses from steps
    const toolkitMap = new Map<string, { name: string; logo?: string }>();
    
    for (const step of steps) {
      if (step.type === "composio" && step.toolkitSlug) {
        toolkitMap.set(step.toolkitSlug, {
          name: step.toolkitName || step.toolkitSlug,
          logo: step.toolkitLogo,
        });
      }
    }

    const statuses: ConnectionStatus[] = Array.from(toolkitMap.entries()).map(
      ([slug, info]) => ({
        toolkitSlug: slug,
        toolkitName: info.name,
        logo: info.logo,
        isConnected: connections[slug] !== null && connections[slug] !== undefined,
      })
    );

    setConnectionStatuses(statuses);
  }, [steps, connections]);

  if (requiredToolkits.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Plug className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">No connections required</p>
        <p className="text-xs text-slate-500 mt-1">
          Add Composio tool steps to see required connections
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h4 className="font-medium">Required Connections</h4>
        <p className="text-xs text-slate-500 mt-1">
          Integrations needed to run this workflow
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {connectionStatuses.map((status) => (
          <ConnectionCard key={status.toolkitSlug} status={status} />
        ))}
      </div>

      <div className="p-3 border-t">
        <p className="text-xs text-slate-500">
          {connectionStatuses.filter((s) => s.isConnected).length} of{" "}
          {connectionStatuses.length} connected
        </p>
      </div>
    </div>
  );
}

function ConnectionCard({ status }: { status: ConnectionStatus }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center gap-3">
        {status.logo ? (
          <img src={status.logo} alt={status.toolkitName} className="h-8 w-8 rounded" />
        ) : (
          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
            <Plug className="h-4 w-4 text-slate-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{status.toolkitName}</div>
          <div className="text-xs text-slate-500">{status.toolkitSlug}</div>
        </div>

        {status.isConnected ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">Connected</span>
          </div>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href="/profile" target="_blank" rel="noopener noreferrer">
              <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
              Connect
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}




