# List Connections Route

**Endpoint:** `GET /api/integrations/list`

## Purpose

Lists all connected accounts for a specific user. Returns the user's active integrations with their connection status.

## Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | No | User identifier, defaults to "agipo_test_user" |

## Response Format

```json
[
  {
    "id": "conn_abc123",
    "appName": "ac_FpW8_GwXyMBz",
    "status": "ACTIVE",
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-03T12:34:56.789Z"
  }
]
```

| Field | Description |
|-------|-------------|
| `id` | Unique connection ID |
| `appName` | The auth config ID this connection uses |
| `status` | ACTIVE, PENDING, EXPIRED, FAILED |
| `createdAt` | When the connection was created |
| `updatedAt` | Last activity timestamp |

**Note:** The `appName` field is actually the `authConfigId` - this naming is from the original implementation and could be improved.

## Frontend Consumers

| Component | File | Usage |
|-----------|------|-------|
| `useIntegrations` | `app/(pages)/profile/hooks/useIntegrations.ts` | Fetches on dialog open |

The hook uses this data to:
1. Show which auth configs are connected
2. Display connection status badges
3. Calculate stats (healthy, errors)

## Composio SDK

**Method:** `client.connectedAccounts.list(options)`

**Documentation:** https://docs.composio.dev/api-reference/connected-accounts

**TypeScript SDK Types:** See `node_modules/@composio/core/dist/index.d.ts` lines 65340-65360

### SDK Example from Docs

```typescript
// List all connected accounts
const allAccounts = await composio.connectedAccounts.list();

// List connected accounts for specific users
const userAccounts = await composio.connectedAccounts.list({
  userIds: ['user_123', 'user_456']
});

// List connected accounts for a specific toolkit
const githubAccounts = await composio.connectedAccounts.list({
  toolkit: 'github'
});
```

## Data Transformation

The route transforms the Composio response:

```typescript
// Composio returns
{
  items: [
    { id, authConfigId, connectionStatus, createdAt, updatedAt, ... }
  ]
}

// We transform to
[
  { id, appName: authConfigId, status: connectionStatus, createdAt, updatedAt }
]
```

## Future Improvements

- [ ] Rename `appName` to `authConfigId` in response for clarity
- [ ] Add pagination for users with many connections
- [ ] Include more connection metadata (scopes, expiry)
- [ ] Add filtering by status (show only errors)
- [ ] Cache responses with short TTL
- [ ] Add connection health check endpoint

