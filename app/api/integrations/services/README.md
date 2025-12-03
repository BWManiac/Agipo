# Composio Service

**File:** `composio.ts`

## Purpose

Thin wrapper around the Composio SDK. Provides a singleton client and typed functions for all Composio operations used by the API routes.

## Functions

### `getComposioClient()`

Returns a singleton Composio client instance.

```typescript
const client = getComposioClient();
```

**Environment Variable:** `COMPOSIO_API_KEY` (required)

---

### `listAuthConfigs()`

Fetches all available auth configurations.

```typescript
const configs = await listAuthConfigs();
// Returns: { items: AuthConfig[] }
```

**Used by:** `/api/integrations/auth-configs`

**SDK Method:** `client.authConfigs.list()`

---

### `listConnections(userId: string)`

Fetches connected accounts for a user.

```typescript
const connections = await listConnections("user_123");
// Returns: { items: ConnectedAccount[] }
```

**Used by:** `/api/integrations/list`

**SDK Method:** `client.connectedAccounts.list({ userIds: [userId] })`

---

### `initiateConnection(userId, authConfigId, redirectUri?)`

Starts an OAuth connection flow.

```typescript
const result = await initiateConnection(
  "user_123",
  "ac_FpW8_GwXyMBz",
  "http://localhost:3000/api/integrations/callback"
);
// Returns: { redirectUrl: string, connectionStatus: string }
```

**Used by:** `/api/integrations/connect`

**SDK Method:** `client.connectedAccounts.initiate(userId, authConfigId, options)`

---

### `getAvailableTools(userId, toolkits[])`

Gets available tools for a user from connected apps.

```typescript
const tools = await getAvailableTools("user_123", ["gmail", "github"]);
```

**Used by:** Tool execution runtime

**SDK Method:** `client.tools.get(userId, { toolkits })`

---

### `getToolAction(userId, actionName)`

Gets a specific tool by its action name.

```typescript
const tool = await getToolAction("user_123", "GMAIL_SEND_EMAIL");
```

**Used by:** Tool execution runtime

**SDK Method:** `client.tools.get(userId, { tools: [actionName] })`

## Composio SDK Reference

**Package:** `@composio/core`

**Documentation:**
- SDK Overview: https://docs.composio.dev/type-script/core-classes/composio
- API Reference: https://docs.composio.dev/api-reference

**TypeScript Types:** `node_modules/@composio/core/dist/index.d.ts`

### Key SDK Properties

```typescript
const composio = new Composio({ apiKey });

composio.authConfigs      // Auth config management
composio.connectedAccounts // Connection management
composio.tools            // Tool retrieval and execution
composio.toolkits         // Toolkit management
composio.triggers         // Webhook triggers
```

## Environment Setup

```bash
# .env.local
COMPOSIO_API_KEY=your_api_key_here
```

Get your API key from: https://platform.composio.dev/ → Settings → API Keys

## Error Handling

The service throws errors that are caught by route handlers:

```typescript
// Common errors
- "COMPOSIO_API_KEY environment variable is not set"
- "Auth config not found" (invalid authConfigId)
- "Connected account not found" (user not connected)
```

## Future Improvements

- [ ] Add retry logic for transient failures
- [ ] Add request/response logging
- [ ] Add caching layer for auth configs
- [ ] Add connection refresh functionality
- [ ] Add webhook trigger management
- [ ] Add tool execution wrapper with logging

