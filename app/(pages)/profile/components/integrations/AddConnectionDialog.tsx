"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthConfig } from "../../hooks/useIntegrations";

type AddConnectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authConfigs: AuthConfig[];
  onConnect: (authConfigId: string) => Promise<string | null>;
};

/**
 * AddConnectionDialog - shows available auth configs to connect
 */
export function AddConnectionDialog({
  open,
  onOpenChange,
  authConfigs,
  onConnect,
}: AddConnectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to only unconnected auth configs
  const availableConfigs = authConfigs.filter((c) => !c.isConnected);

  const handleConnect = async () => {
    if (!selectedId) return;

    setIsConnecting(true);
    setError(null);

    try {
      const redirectUrl = await onConnect(selectedId);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError("Failed to initiate connection");
        setIsConnecting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setSelectedId(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Select an integration to connect. You&apos;ll be redirected to authorize.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {availableConfigs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              All available integrations are already connected.
            </p>
          ) : (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {availableConfigs.map((config) => (
                <button
                  key={config.id}
                  type="button"
                  onClick={() => setSelectedId(config.id)}
                  disabled={isConnecting}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    selectedId === config.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:bg-slate-50",
                    isConnecting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {config.toolkit?.logo ? (
                    <img
                      src={config.toolkit.logo}
                      alt=""
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                      {(config.toolkit?.name || config.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {config.name}
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !selectedId}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
