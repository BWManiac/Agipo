"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthConfig } from "../../hooks/useConnections";

type ApiKeyModalProps = {
  authConfig: AuthConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (authConfigId: string, apiKey: string) => Promise<boolean>;
};

export function ApiKeyModal({
  authConfig,
  open,
  onOpenChange,
  onConnect,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!authConfig) return;
    
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    const success = await onConnect(authConfig.id, apiKey);

    if (success) {
      setApiKey("");
      onOpenChange(false);
    } else {
      setError("Failed to connect. Please check your API key and try again.");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setApiKey("");
    setError(null);
    onOpenChange(false);
  };

  if (!authConfig) return null;

  const toolkitName = authConfig.toolkit?.name || authConfig.name;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {authConfig.toolkit?.logo ? (
              <img
                src={authConfig.toolkit.logo}
                alt=""
                className="h-12 w-12 rounded-xl border border-slate-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                {toolkitName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <DialogTitle>Connect {toolkitName}</DialogTitle>
              <DialogDescription>
                Enter your API key to connect this service.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="font-mono"
            />
            <p className="text-xs text-slate-500">
              Your API key is encrypted and stored securely.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

