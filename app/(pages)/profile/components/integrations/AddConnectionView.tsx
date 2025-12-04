"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import type { AuthConfig } from "../../hooks/useConnections";
import { ConnectionDetailView } from "./ConnectionDetailView";

type AddConnectionViewProps = {
  authConfigs: AuthConfig[];
  onBack: () => void;
  onConnect: (authConfigId: string) => Promise<string | null>;
};

export function AddConnectionView({
  authConfigs,
  onBack,
  onConnect,
}: AddConnectionViewProps) {
  const [selectedConfig, setSelectedConfig] = useState<AuthConfig | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Filter to only unconnected auth configs
  const availableConfigs = authConfigs.filter((c) => !c.isConnected);
  const filteredConfigs = searchFilter
    ? availableConfigs.filter(
        (c) =>
          c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          c.toolkit?.name?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : availableConfigs;

  const handleConnect = async (authConfigId: string) => {
    const redirectUrl = await onConnect(authConfigId);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  // If an integration is selected, show its detail view
  if (selectedConfig) {
    return (
      <ConnectionDetailView
        authConfig={selectedConfig}
        onBack={() => setSelectedConfig(null)}
        onConnect={handleConnect}
      />
    );
  }

  // Otherwise show the grid of available integrations
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with back button */}
      <div className="border-b border-slate-200 p-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Connection</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a service to connect. You&apos;ll be redirected to authorize.
            </p>
          </div>
        </div>
      </div>

      {/* Search + Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input
              type="text"
              placeholder="Search integrations..."
              className="pl-9 w-full max-w-sm"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredConfigs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {availableConfigs.length === 0
              ? "All available integrations are already connected."
              : "No integrations match your search."}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredConfigs.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => setSelectedConfig(config)}
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white text-left transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                {config.toolkit?.logo ? (
                  <img src={config.toolkit.logo} alt="" className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                    {(config.toolkit?.name || config.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {config.toolkit?.name || config.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {config.authScheme?.replace("_", " ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

