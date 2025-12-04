# Disconnect Connection API (`/api/connections/disconnect`)

**Method:** `DELETE`

## Purpose

Disconnects (removes) a connected account for the authenticated user. This revokes the OAuth connection and removes it from the user's account.

## Authentication

Requires Clerk authentication. The authenticated user can only disconnect their own connections.

## Request Body

```json
{
  "connectionId": "ca_abc123xyz"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `connectionId` | string | Yes | The Composio connected account ID to disconnect |

## Response

**Success (200):**
```json
{
  "success": true
}
```

**Error (400):**
```json
{
  "message": "connectionId is required"
}
```

**Error (401):**
```json
{
  "message": "Unauthorized"
}
```

## Service Layer

**Function:** `disconnectAccount(connectionId)` from `services/composio.ts`

**SDK Method:** `client.connectedAccounts.delete(connectionId)`

## Frontend Consumer

- `useIntegrations.disconnectConnection()` in `app/(pages)/profile/hooks/useIntegrations.ts`
- Called from the connection management UI in profile settings

## Notes

- This action is irreversible - the user will need to re-authenticate to reconnect
- Any agent connection tool bindings using this `connectionId` will no longer work after disconnection

