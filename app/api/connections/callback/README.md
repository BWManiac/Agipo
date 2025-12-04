# OAuth Callback Route

**Endpoint:** `GET /api/integrations/callback`

## Purpose

Handles the OAuth callback after a user authorizes with an external provider (Google, GitHub, Slack, etc.). 

When a user clicks "Connect" and completes the OAuth flow with the external provider, Composio redirects them back to this endpoint.

## Flow

```
1. User clicks "Connect" in AddConnectionDialog
2. Frontend calls POST /api/integrations/connect
3. Backend returns redirectUrl to OAuth provider
4. User authorizes in OAuth provider
5. OAuth provider redirects to Composio
6. Composio redirects to THIS endpoint with status
7. This endpoint redirects to /profile with query params
8. Frontend opens IntegrationSettingsDialog and refetches data
```

## Query Parameters (from Composio)

| Param | Description |
|-------|-------------|
| `status` | "success" or "error" |
| `connectionId` | The new connected account ID (on success) |
| `error` | Error message (on failure) |

## Redirect Behavior

**On Success:**
```
/profile?action=open-integrations&connectionStatus=success&connectionId=conn_xxx
```

**On Error:**
```
/profile?action=open-integrations&connectionStatus=error&errorMessage=...
```

## Frontend Consumer

| Component | File | Usage |
|-----------|------|-------|
| `ConnectionsSection` | `app/(pages)/profile/components/integrations/ConnectionsSection.tsx` | Reads `action` query param to auto-open dialog |

The frontend checks for `?action=open-integrations` and automatically opens the IntegrationSettingsDialog.

## Composio Configuration

The callback URL is passed when initiating the connection:

```typescript
// In /api/integrations/connect
const connection = await client.connectedAccounts.initiate(
  userId,
  authConfigId,
  {
    callbackUrl: "http://localhost:3000/api/integrations/callback"
  }
);
```

**Documentation:** https://docs.composio.dev/api-reference/connected-accounts

## Environment Considerations

| Environment | Callback URL |
|-------------|--------------|
| Development | `http://localhost:3000/api/integrations/callback` |
| Production | `https://your-domain.com/api/integrations/callback` |

The callback URL must be whitelisted in your OAuth provider's settings (Google Console, GitHub OAuth App, etc.).

## Future Improvements

- [ ] Store connection result in database for audit trail
- [ ] Send notification/toast on success/error
- [ ] Handle edge cases (user cancels OAuth, token already exists)
- [ ] Add webhook support for async connection updates

