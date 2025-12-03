# Connect Route

**Endpoint:** `POST /api/integrations/connect`

## Purpose

Initiates an OAuth connection flow for a user. Returns a redirect URL to the OAuth provider (Google, GitHub, etc.) where the user can authorize access.

## Request Format

```json
{
  "authConfigId": "ac_FpW8_GwXyMBz",
  "userId": "agipo_test_user",
  "redirectUri": "http://localhost:3000/api/integrations/callback"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authConfigId` | string | Yes | The Composio auth config ID (NOT the app name) |
| `userId` | string | No | User identifier, defaults to "agipo_test_user" |
| `redirectUri` | string | No | OAuth callback URL |

## Response Format

```json
{
  "redirectUrl": "https://accounts.google.com/o/oauth2/auth?...",
  "connectionStatus": "PENDING"
}
```

## Frontend Consumers

| Component | File | Usage |
|-----------|------|-------|
| `useIntegrations.initiateConnection()` | `app/(pages)/profile/hooks/useIntegrations.ts` | Hook method |
| `IntegrationTable` | `app/(pages)/profile/components/integrations/IntegrationTable.tsx` | "Connect" button |
| `AddConnectionDialog` | `app/(pages)/profile/components/integrations/AddConnectionDialog.tsx` | Selection confirm |

## Composio SDK

**Method:** `client.connectedAccounts.initiate(userId, authConfigId, options)`

**Documentation:** https://docs.composio.dev/api-reference/connected-accounts

**TypeScript SDK Types:** See `node_modules/@composio/core/dist/index.d.ts` lines 65360-65410

### Critical: Use Auth Config ID, NOT App Name

```typescript
// ❌ WRONG - will fail with "Auth config not found"
await client.connectedAccounts.initiate(userId, "gmail", options);

// ✅ CORRECT - use the auth config ID
await client.connectedAccounts.initiate(userId, "ac_FpW8_GwXyMBz", options);
```

The auth config ID can be found:
- In the Composio Dashboard
- From the `/api/integrations/auth-configs` response

### SDK Example from Docs

```typescript
// For OAuth2 authentication
const connectionRequest = await composio.connectedAccounts.initiate(
  'user_123',
  'auth_config_123',
  {
    callbackUrl: 'https://your-app.com/callback',
    config: AuthScheme.OAuth2({
      access_token: 'your_access_token',
      token_type: 'Bearer'
    })
  }
);

// For API Key authentication
const connectionRequest = await composio.connectedAccounts.initiate(
  'user_123',
  'auth_config_123',
  {
    config: AuthScheme.ApiKey({
      api_key: 'your_api_key'
    })
  }
);
```

## User Identity (MVP)

Currently using hardcoded `"agipo_test_user"`. In production, this should come from:
- Session/JWT token
- Clerk/Auth0 user ID
- Database user record

## Future Improvements

- [ ] Replace hardcoded userId with authenticated user
- [ ] Support API Key auth flow (no redirect needed)
- [ ] Add rate limiting
- [ ] Validate authConfigId exists before calling Composio
- [ ] Store pending connections in database

