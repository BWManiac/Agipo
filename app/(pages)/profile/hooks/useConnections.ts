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
  authConfigId: string | null;
  toolkitSlug: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  // Enriched fields
  authConfig?: AuthConfig;
};

/**
 * Connections grouped by toolkit
 */
export type ConnectionGroup = {
  toolkit: { slug: string; name: string; logo?: string };
  connections: ConnectedAccount[];
};

/**
 * Stats calculated from connected accounts
 */
export type ConnectionStats = {
  total: number;
  activeAgents: number;
  healthy: number;
  errors: number;
};

/**
 * Custom hook for fetching and managing connections data.
 */
export function useConnections() {
  const [authConfigs, setAuthConfigs] = useState<AuthConfig[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [connectionGroups, setConnectionGroups] = useState<ConnectionGroup[]>([]);
  const [stats, setStats] = useState<ConnectionStats>({
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
      const [authConfigsRes, connectionsRes] = await Promise.all([
        fetch("/api/connections/auth-configs"),
        fetch("/api/connections/list"),
      ]);

      if (!authConfigsRes.ok) {
        throw new Error(`Failed to fetch auth configs: ${authConfigsRes.status}`);
      }

      const authConfigsData = await authConfigsRes.json();
      const connectionsData: ConnectedAccount[] = connectionsRes.ok ? await connectionsRes.json() : [];

      const configs: AuthConfig[] = authConfigsData.items || authConfigsData || [];

      // Create map of toolkit.slug -> authConfig (first one wins if multiple)
      const authConfigByToolkit = new Map<string, AuthConfig>();
      for (const config of configs) {
        const slug = config.toolkit?.slug;
        if (slug && !authConfigByToolkit.has(slug)) {
          authConfigByToolkit.set(slug, config);
        }
      }

      // Enrich connections with auth config data (match by toolkit.slug)
      const enrichedConnections = connectionsData.map((conn) => ({
        ...conn,
        authConfig: authConfigByToolkit.get(conn.toolkitSlug),
      }));

      // Group connections by toolkit
      const groupMap = new Map<string, ConnectionGroup>();
      for (const conn of enrichedConnections) {
        const toolkit = conn.authConfig?.toolkit || { slug: conn.toolkitSlug, name: conn.toolkitSlug };
        const key = toolkit.slug;
        if (!groupMap.has(key)) {
          groupMap.set(key, { toolkit, connections: [] });
        }
        groupMap.get(key)!.connections.push(conn);
      }

      // Enrich auth configs with connection status (for Add Connection dialog)
      const connectionByToolkit = new Map<string, ConnectedAccount>();
      for (const conn of connectionsData) {
        connectionByToolkit.set(conn.toolkitSlug, conn);
      }
      const enrichedConfigs: AuthConfig[] = configs.map((config: AuthConfig) => {
        const connection = connectionByToolkit.get(config.toolkit?.slug || "");
        return {
          ...config,
          isConnected: !!connection,
          connectionId: connection?.id,
          connectionStatus: connection?.status,
        };
      });

      setAuthConfigs(enrichedConfigs);
      setConnectedAccounts(enrichedConnections);
      setConnectionGroups(Array.from(groupMap.values()));

      // Stats based on connected accounts
      const healthy = enrichedConnections.filter(
        (c) => c.status === "ACTIVE" || c.status === "CONNECTED"
      ).length;
      const errors = enrichedConnections.filter(
        (c) => c.status === "FAILED" || c.status === "EXPIRED"
      ).length;

      setStats({
        total: enrichedConnections.length,
        activeAgents: 12,
        healthy,
        errors,
      });
    } catch (err) {
      console.error("[useConnections] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load connections");
      setAuthConfigs([]);
      setConnectedAccounts([]);
      setConnectionGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateConnection = useCallback(async (authConfigId: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/connections/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authConfigId,
          redirectUri: `${window.location.origin}/api/connections/callback`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate connection");
      }

      const { redirectUrl } = await response.json();
      return redirectUrl;
    } catch (err) {
      console.error("[useConnections] Error initiating connection:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate connection");
      return null;
    }
  }, []);

  const disconnectAccount = useCallback(async (connectionId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/connections/disconnect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to disconnect");
      }

      return true;
    } catch (err) {
      console.error("[useConnections] Error disconnecting:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect");
      return false;
    }
  }, []);

  return {
    authConfigs,
    connectedAccounts,
    connectionGroups,
    stats,
    isLoading,
    error,
    fetchData,
    refetch: fetchData,
    initiateConnection,
    disconnectAccount,
  };
}
