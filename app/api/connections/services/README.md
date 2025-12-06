# Connections Services

**Domain:** Connections  
**Last Updated:** December 6, 2025

---

## Overview

This directory contains services for managing Composio connections and integration tools. Connections enable agents to access external services like Gmail, Slack, GitHub, etc.

---

## File Structure

```
services/
├── composio.ts          # Barrel exports (re-exports from below)
├── client.ts            # Composio client factories
├── auth.ts              # OAuth and API key connection flows
├── connections.ts       # List connections and auth configs
├── tools.ts             # Tool and toolkit fetching
└── README.md            # This file
```

---

## Usage

```typescript
import { 
  // Client factories
  getComposioClient,
  getComposioVercelClient,
  
  // Authentication
  initiateConnection,
  initiateApiKeyConnection,
  disconnectAccount,
  
  // Connections
  listConnections,
  listAuthConfigs,
  
  // Tools
  getToolsForConnection,
  getNoAuthToolkits,
} from "@/app/api/connections/services/composio";
```

---

## Key Exports

### Client (`client.ts`)

| Export | Purpose |
|--------|---------|
| `getComposioClient()` | Base Composio client (singleton) |
| `getComposioMastraClient()` | ⚠️ Deprecated - Mastra provider incompatible |
| `getComposioVercelClient()` | Vercel AI SDK provider |

### Authentication (`auth.ts`)

| Export | Purpose |
|--------|---------|
| `initiateConnection(userId, authConfigId, redirectUri?)` | Start OAuth flow |
| `initiateApiKeyConnection(userId, authConfigId, apiKey)` | Connect with API key |
| `disconnectAccount(connectionId)` | Remove connection |

### Connections (`connections.ts`)

| Export | Purpose |
|--------|---------|
| `listAuthConfigs()` | List available integrations |
| `listConnections(userId)` | List user's connected accounts |

### Tools (`tools.ts`)

| Export | Purpose |
|--------|---------|
| `getAvailableTools(userId, toolkits)` | Get tools for toolkits |
| `getToolAction(userId, actionName)` | Get single tool by action |
| `getToolsForConnection(toolkitSlug)` | Get tools for a connection |
| `getToolkit(slug)` | Get toolkit details |
| `getTriggersForToolkit(toolkitSlug)` | Get triggers for toolkit |
| `getNoAuthToolkits()` | Get platform tools (no auth needed) |

---

## Architecture

```
Profile Page / Agent Modal
    │
    ├── List Connections ───── connections.ts
    │   └── listAuthConfigs(), listConnections()
    │
    ├── Add Connection ─────── auth.ts
    │   └── initiateConnection(), initiateApiKeyConnection()
    │
    └── Manage Tools ────────── tools.ts
        └── getToolsForConnection(), getNoAuthToolkits()
```

---

## Environment Requirements

- `COMPOSIO_API_KEY` - Required for all Composio operations

---

## Related Files

- `@/app/api/tools/services/composio-tools.ts` - Tool execution wrappers
- `@/app/(pages)/profile/components/connections/` - Connections UI
- `@/app/(pages)/workforce/components/agent-modal/` - Tool assignment UI
