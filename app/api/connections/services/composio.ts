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

// Authentication (co-located with connect route)
export { 
  initiateConnection, 
  initiateApiKeyConnection, 
  disconnectAccount 
} from "../connect/services/auth";

// Connections
export { 
  listAuthConfigs, 
  listConnections 
} from "./connections";

// Tools (co-located with toolkits routes)
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
} from "../available/toolkits/services/tools";
