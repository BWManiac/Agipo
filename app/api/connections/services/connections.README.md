# Composio Connections Service

> Lists available integrations and user-connected accounts from Composio.

**Service:** `connections.ts`  
**Domain:** Connections

---

## Purpose

This service provides read-only operations for discovering what integrations are available and what accounts users have connected. It enables users to browse available integrations (Gmail, Slack, GitHub, etc.) and see their existing connections, which is essential for the connections management UI and for agents to know what capabilities are available.

**Product Value:** Users need to see what integrations they can connect (auth configs) and what they've already connected (connections). This service powers the connections browsing and management experience, showing users their integration landscape.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `listAuthConfigs()` | Retrieves all available integration configurations from Composio, showing what integrations users can connect (Gmail, Slack, etc.). | When displaying the "available integrations" list to users or building connection UI |
| `listConnections(userId)` | Retrieves all connected accounts for a specific user, showing which integrations they've already authorized and connected. | When displaying a user's existing connections or checking what tools are available for an agent |

---

## Approach

Both functions use the base Composio client (no provider needed since these are admin/config operations, not tool execution). They make direct API calls to Composio's SDK methods, handling pagination and data transformation as needed. The service is stateless and focused purely on data retrieval.

---

## Public API

### `listAuthConfigs()`

**What it does:** Retrieves all available authentication configurations from Composio, representing integrations that users can connect (Gmail, Slack, GitHub, etc.). This shows the catalog of available integrations.

**Product Impact:** This powers the "available integrations" list that users see when they want to connect a new account. Without this, users wouldn't know what integrations are available to connect.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<AuthConfig[]> | Array of authentication configurations, each representing an available integration (includes metadata like name, description, OAuth endpoints) |

**Process:**

```
listAuthConfigs(): Promise<AuthConfig[]>
├── **Call `getComposioClient()`** to get base client
├── **Call `client.authConfigs.list({ limit: 100 })`** to fetch configs
└── Return auth configs array
```

**Note:** Uses limit of 100 to ensure we get all available configs (default is 20).

---

### `listConnections(userId: string)`

**What it does:** Retrieves all connected accounts for a specific user, showing which Composio integrations they've authorized and are currently connected.

**Product Impact:** Users need to see their existing connections to manage them (disconnect, check status, etc.). Agents also need this information to know what connection tools are available for a user.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Agipo user ID, which maps to Composio's entity ID system |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Connection[]> | Array of connected account objects, each representing an active connection (includes connection ID, status, toolkit info) |

**Process:**

```
listConnections(userId): Promise<Connection[]>
├── **Call `getComposioClient()`** to get base client
├── **Call `client.connectedAccounts.list({ userIds: [userId] })`** to fetch user's connections
└── Return connections array
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `./client` | Base Composio client for API calls |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Connections List Route | `app/api/connections/route.ts` | Lists user's connections |
| Available Auth Configs Route | `app/api/connections/available/auth-configs/route.ts` | Lists available integrations |
| Profile Page | `app/(pages)/profile/` | Displays user's connections in UI |

---

## Design Decisions

### Why separate from auth service?

**Decision:** List operations are in `connections.ts`, while create/delete operations are in `auth.ts`.

**Rationale:** Read operations (list) are simpler and used more frequently. Separating them from write operations (initiate, disconnect) makes the code more organized and follows single responsibility principle.

---

## Related Docs

- [Client Service README](./client.README.md) - Provides the Composio client
- [Auth Service README](../connect/services/auth.README.md) - Handles connection creation/deletion
- [Connections Domain README](../README.md) - Overview of connections domain

---

## Future Improvements

- [ ] Add caching for auth configs (they change infrequently)
- [ ] Add filtering/sorting options for connections list
- [ ] Add connection status health checks

