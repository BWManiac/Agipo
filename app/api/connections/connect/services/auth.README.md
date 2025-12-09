# Composio Authentication Service

> Handles OAuth and API key connection flows for integrating external services.

**Service:** `auth.ts`  
**Domain:** Connections

---

## Purpose

This service manages the lifecycle of user connections to external services via Composio. It initiates OAuth flows that redirect users to authorize with providers like Google, GitHub, or Slack, and handles API key connections for services that don't support OAuth. Without this service, users couldn't connect their accounts, and agents would have no access to external integrations.

**Product Value:** Enables users to connect their Gmail, Slack, GitHub, and other accounts to Agipo. Once connected, these accounts power agent capabilities - agents can send emails, post to Slack, create GitHub issues, etc. This is the foundation of the hybrid capability system.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `initiateConnection()` | Starts an OAuth connection flow by generating a redirect URL where users authorize with the provider (Google, GitHub, etc.). | When user clicks "Connect Gmail" or similar - initiates the OAuth handshake |
| `initiateApiKeyConnection()` | Creates an immediate connection using an API key for services that don't support OAuth (like Perplexity). | When user provides an API key for a service that uses API key authentication |
| `disconnectAccount()` | Removes a connected account, revoking access to that integration. | When user wants to disconnect an integration or revoke access |

---

## Approach

The service uses the base Composio client (no provider needed for connection management). For OAuth flows, it generates redirect URLs that users visit to authorize, then Composio redirects back to our callback endpoint. For API key connections, it makes immediate API calls to establish the connection. All operations are scoped to user IDs, ensuring connections are user-specific.

---

## Public API

### `initiateConnection(userId: string, authConfigId: string, redirectUri?: string)`

**What it does:** Initiates an OAuth connection flow by generating a redirect URL where users authorize with the external provider (Google, GitHub, Slack, etc.). After authorization, the provider redirects back to our callback endpoint.

**Product Impact:** This is how users connect their accounts to Agipo. When a user wants to enable Gmail capabilities for their agents, this function starts the authorization process that grants Agipo access to their Gmail account.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Agipo user ID (maps to Composio entity ID) |
| `authConfigId` | string | Yes | The Composio auth config ID (e.g., "ac_FpW8_GwXyMBz") identifying which integration to connect |
| `redirectUri` | string | No | Optional redirect URI for OAuth callback (defaults to localhost callback endpoint) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Connection> | Connection object containing `redirectUrl` that the frontend should redirect the user to, plus connection metadata |

**Process:**

```
initiateConnection(userId, authConfigId, redirectUri?): Promise<Connection>
├── **Call `getComposioClient()`** to get base client
├── **Call `client.connectedAccounts.initiate()`** with:
│   ├── userId
│   ├── authConfigId
│   └── callbackUrl (redirectUri or default)
└── Return connection object with redirectUrl
```

---

### `initiateApiKeyConnection(userId: string, authConfigId: string, apiKey: string)`

**What it does:** Creates an immediate connection using an API key for services that don't support OAuth. The connection is established immediately without requiring user redirection.

**Product Impact:** Enables connections to services like Perplexity that use API key authentication instead of OAuth. Users can paste their API key and connect instantly, without the OAuth redirect flow.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Agipo user ID (maps to Composio entity ID) |
| `authConfigId` | string | Yes | The Composio auth config ID for the API key-based integration |
| `apiKey` | string | Yes | The user's API key for the service |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Connection> | Connection object with status (should be ACTIVE immediately, no redirect needed) |

**Process:**

```
initiateApiKeyConnection(userId, authConfigId, apiKey): Promise<Connection>
├── **Call `getComposioClient()`** to get base client
├── **Call `client.connectedAccounts.initiate()`** with:
│   ├── userId
│   ├── authConfigId
│   └── config: { authScheme: "API_KEY", val: { generic_api_key: apiKey } }
└── Return connection object (status: ACTIVE)
```

---

### `disconnectAccount(connectionId: string)`

**What it does:** Removes a connected account by deleting it from Composio, effectively revoking access to that integration.

**Product Impact:** Allows users to disconnect integrations they no longer want Agipo to access. This is important for user control and privacy - users should be able to revoke access at any time.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionId` | string | Yes | The Composio connection ID (e.g., "ca_abc123") identifying which connection to remove |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when connection is successfully deleted |

**Process:**

```
disconnectAccount(connectionId): Promise<void>
├── **Call `getComposioClient()`** to get base client
├── **Call `client.connectedAccounts.delete(connectionId)`** to remove connection
└── Return (void)
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/app/api/connections/services/client` | Base Composio client for API calls |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Connect Route | `app/api/connections/connect/route.ts` | Initiates OAuth flows |
| Disconnect Route | `app/api/connections/disconnect/route.ts` | Removes connections |
| Connections UI | `app/(pages)/profile/components/connections/` | Frontend connection management |

---

## Design Decisions

### Why co-located with connect route?

**Decision:** This service is in `connect/services/` rather than the domain-level `connections/services/`.

**Rationale:** According to domain principles, services used by a single route should be co-located with that route. The connect route is the primary consumer of these functions, so they live together. The domain-level `connections.ts` service handles read operations (list) which are used by multiple routes.

---

## Error Handling

Functions will throw errors if:
- Composio API key is missing (caught at client initialization)
- Invalid auth config ID provided
- Invalid connection ID for disconnect
- API key format is incorrect for API key connections

Errors bubble up to route handlers for user-friendly error responses.

---

## Related Docs

- [Client Service README](../../services/client.README.md) - Provides the Composio client
- [Connect Route README](../README.md) - Uses this service for OAuth initiation
- [Disconnect Route README](../../disconnect/README.md) - Uses disconnectAccount function

---

## Future Improvements

- [ ] Add connection status polling for OAuth flows
- [ ] Add webhook handling for connection status updates
- [ ] Add connection refresh/reauth for expired tokens
- [ ] Add bulk disconnect operations

