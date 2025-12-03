"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIntegrations, type AuthConfig } from "../../hooks/useIntegrations";
import { IntegrationTable } from "./IntegrationTable";
import { AddConnectionDialog } from "./AddConnectionDialog";
import { IntegrationDetailView } from "./IntegrationDetailView";

type IntegrationSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function StatCard({ label, value, variant = "default" }: { label: string; value: number; variant?: "default" | "success" | "error" }) {
  return (
    <div className={cn("bg-white p-4 rounded-lg border shadow-sm", variant === "error" && value > 0 ? "border-red-100 bg-red-50/50" : "border-slate-200")}>
      <div className={cn("text-xs font-medium uppercase", variant === "error" && value > 0 ? "text-red-600" : "text-slate-500")}>{label}</div>
      <div className={cn("text-2xl font-semibold mt-1", variant === "success" ? "text-green-600" : variant === "error" && value > 0 ? "text-red-700" : "text-slate-900")}>{value}</div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="mt-4 text-sm text-slate-500">Loading integrations...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to load integrations</h3>
      <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">{error}</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

export function IntegrationSettingsDialog({ open, onOpenChange }: IntegrationSettingsDialogProps) {
  const { authConfigs, stats, isLoading, error, fetchData, refetch, initiateConnection } = useIntegrations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
      setSelectedConfig(null); // Reset to list view when dialog opens
    }
  }, [open, fetchData]);

  const filteredConfigs = authConfigs.filter((config) =>
    searchFilter
      ? config.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        config.toolkit?.name?.toLowerCase().includes(searchFilter.toLowerCase())
      : true
  );

  const handleConnect = async (authConfigId: string) => {
    const redirectUrl = await initiateConnection(authConfigId);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[95vw] max-w-[1200px] h-[85vh] sm:max-w-[1200px] bg-slate-50 p-0 gap-0 overflow-hidden rounded-xl flex flex-col"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">Integrations</DialogTitle>

          {selectedConfig ? (
            /* Detail View - Full container */
            <IntegrationDetailView
              authConfig={selectedConfig}
              onBack={() => setSelectedConfig(null)}
              onConnect={handleConnect}
            />
          ) : (
            /* List View */
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              {/* Header */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage API access, auth types, and OAuth scopes for your organization.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => alert("Audit logs coming soon...")}>View Audit Logs</Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Connection
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Integrations" value={stats.total} />
                <StatCard label="Active Agents" value={stats.activeAgents} />
                <StatCard label="Connected" value={stats.healthy} variant="success" />
                <StatCard label="Errors" value={stats.errors} variant="error" />
              </div>

              {/* Table */}
              <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <Input type="text" placeholder="Filter integrations..." className="pl-8 w-64" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
                  </div>
                  <div className="text-xs text-slate-500">{filteredConfigs.length} integration{filteredConfigs.length !== 1 ? "s" : ""}</div>
                </div>

                <div className="flex-1 overflow-auto">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <ErrorState error={error} onRetry={refetch} />
                  ) : (
                    <IntegrationTable
                      authConfigs={filteredConfigs}
                      onAddConnection={() => setShowAddDialog(true)}
                      onConnect={handleConnect}
                      onViewDetails={setSelectedConfig}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddConnectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        authConfigs={authConfigs}
        onConnect={initiateConnection}
      />
    </>
  );
}
