"use client";

import { useState, useCallback } from "react";

/**
 * Auth config from Composio - represents an available integration
 */
export type AuthConfig = {
  id: string;
  name: string;
  toolkit: { slug: string; name: string; logo?: string };
  authScheme: string;
  status: "ENABLED" | "DISABLED";
  createdAt?: string;
  // Derived from connected accounts
  isConnected?: boolean;
  connectionId?: string;
  connectionStatus?: string;
};

/**
 * Connected account from Composio
 */
export type ConnectedAccount = {
  id: string;
  authConfigId: string;
  connectionStatus: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Stats calculated from data
 */
export type IntegrationStats = {
  total: number;
  activeAgents: number;
  healthy: number;
  errors: number;
};

/**
 * Custom hook for fetching and managing integrations data.
 */
export function useIntegrations() {
  const [authConfigs, setAuthConfigs] = useState<AuthConfig[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [stats, setStats] = useState<IntegrationStats>({
    total: 0,
    activeAgents: 12,
    healthy: 0,
    errors: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both auth configs and connected accounts in parallel
      const [authConfigsRes, connectionsRes] = await Promise.all([
        fetch("/api/integrations/auth-configs"),
        fetch("/api/integrations/list"),
      ]);

      if (!authConfigsRes.ok) {
        throw new Error(`Failed to fetch auth configs: ${authConfigsRes.status}`);
      }

      const authConfigsData = await authConfigsRes.json();
      const connectionsData = connectionsRes.ok ? await connectionsRes.json() : [];

      // Create a map of authConfigId -> connection for quick lookup
      const connectionMap = new Map<string, ConnectedAccount>();
      for (const conn of connectionsData) {
        connectionMap.set(conn.appName, conn); // appName is actually authConfigId from list endpoint
      }

      // Enrich auth configs with connection status
      const enrichedConfigs: AuthConfig[] = (authConfigsData.items || authConfigsData || []).map(
        (config: AuthConfig) => {
          const connection = connectionMap.get(config.id);
          return {
            ...config,
            isConnected: !!connection,
            connectionId: connection?.id,
            connectionStatus: connection?.connectionStatus,
          };
        }
      );

      setAuthConfigs(enrichedConfigs);
      setConnectedAccounts(connectionsData);

      // Calculate stats
      const connected = enrichedConfigs.filter((c) => c.isConnected);
      const healthy = connected.filter(
        (c) => c.connectionStatus === "ACTIVE" || c.connectionStatus === "CONNECTED"
      ).length;
      const errors = connected.filter(
        (c) => c.connectionStatus === "FAILED" || c.connectionStatus === "EXPIRED"
      ).length;

      setStats({
        total: enrichedConfigs.length,
        activeAgents: 12, // Placeholder
        healthy,
        errors,
      });
    } catch (err) {
      console.error("[useIntegrations] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load integrations");
      setAuthConfigs([]);
      setConnectedAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initiates a new connection for an auth config
   */
  const initiateConnection = useCallback(async (authConfigId: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authConfigId,
          redirectUri: `${window.location.origin}/api/integrations/callback`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate connection");
      }

      const { redirectUrl } = await response.json();
      return redirectUrl;
    } catch (err) {
      console.error("[useIntegrations] Error initiating connection:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate connection");
      return null;
    }
  }, []);

  return {
    authConfigs,
    connectedAccounts,
    stats,
    isLoading,
    error,
    fetchData,
    refetch: fetchData,
    initiateConnection,
  };
}
