/**
 * Composio Service
 * 
 * Barrel file that re-exports from client.ts, auth.ts, connections.ts, and tools.ts.
 * All existing imports from this file will continue to work.
 */

// Client factories
export { 
  getComposioClient, 
  getComposioMastraClient, 
  getComposioVercelClient 
} from "./client";

// Authentication
export { 
  initiateConnection, 
  initiateApiKeyConnection, 
  disconnectAccount 
} from "./auth";

// Connections
export { 
  listAuthConfigs, 
  listConnections 
} from "./connections";

// Tools
export {
  getAvailableTools,
  getToolAction,
  getToolsForConnection,
  getToolkit,
  getToolsForToolkit,
  getTriggersForToolkit,
  getNoAuthToolkits,
  getConnectionToolsForMastra,
  getConnectionToolsVercel,
} from "./tools";
