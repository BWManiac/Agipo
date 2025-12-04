# Integrations API

This module provides API routes for managing Composio integrations - OAuth connections to external services like Gmail, GitHub, Slack, etc.

## Architecture Overview

```
Frontend                          Backend                         Composio
────────                          ───────                         ────────
useIntegrations hook  ──────►  /api/integrations/auth-configs  ──►  authConfigs.list()
                      ──────►  /api/integrations/list          ──►  connectedAccounts.list()

AddConnectionDialog   ──────►  /api/integrations/connect       ──►  connectedAccounts.initiate()
                                      │
                                      ▼
                              Redirect to OAuth Provider
                                      │
                                      ▼
                              /api/integrations/callback  ──►  Redirect to /profile
```

---

## Routes

### GET `/api/integrations/auth-configs`

Lists all available auth configurations from Composio. These are the pre-configured integrations (e.g., "gmail-oxzcjt", "github-ff-xrb") set up in your Composio workspace.

**Response:**
```json
{
  "items": [
    {
      "id": "ac_FpW8_GwXyMBz",
      "name": "gmail-oxzcjt",
      "toolkit": { "slug": "gmail", "name": "Gmail", "logo": "..." },
      "authScheme": "OAUTH2",
      "status": "ENABLED"
    }
  ]
}
```

**Frontend Consumer:** `useIntegrations` hook in `app/(pages)/profile/hooks/useIntegrations.ts`

**Composio SDK:** `client.authConfigs.list()` - [Auth Configs Documentation](https://docs.composio.dev/api-reference/auth-configs)

---

### POST `/api/integrations/connect`

Initiates an OAuth connection flow for a user using a specific auth config.

**Request Body:**
```json
{
  "authConfigId": "ac_FpW8_GwXyMBz",
  "userId": "agipo_test_user",
  "redirectUri": "http://localhost:3000/api/integrations/callback"
}
```

**Response:**
```json
{
  "redirectUrl": "https://accounts.google.com/oauth/...",
  "connectionStatus": "PENDING"
}
```

**Frontend Consumer:** 
- `useIntegrations.initiateConnection()` in `app/(pages)/profile/hooks/useIntegrations.ts`
- Called from `IntegrationTable` and `AddConnectionDialog`

**Composio SDK:** `client.connectedAccounts.initiate(userId, authConfigId, options)` - [Connected Accounts Documentation](https://docs.composio.dev/api-reference/connected-accounts)

**Important:** The second parameter must be an **auth config ID** (e.g., `ac_FpW8_GwXyMBz`), not an app name like "gmail".

---

### GET `/api/integrations/list`

Lists all connected accounts for a user.

**Query Parameters:**
- `userId` (optional) - Defaults to `"agipo_test_user"` for MVP

**Response:**
```json
[
  {
    "id": "conn_abc123",
    "appName": "ac_FpW8_GwXyMBz",
    "status": "ACTIVE",
    "createdAt": "2025-12-01T...",
    "updatedAt": "2025-12-03T..."
  }
]
```

**Frontend Consumer:** `useIntegrations` hook in `app/(pages)/profile/hooks/useIntegrations.ts`

**Composio SDK:** `client.connectedAccounts.list({ userIds: [...] })` - [Connected Accounts Documentation](https://docs.composio.dev/api-reference/connected-accounts)

---

### GET `/api/integrations/callback`

OAuth callback handler. After a user authorizes with an external provider (Google, GitHub, etc.), Composio redirects here.

**Query Parameters (from Composio):**
- `status` - "success" or "error"
- `connectionId` - The new connection ID (on success)
- `error` - Error message (on failure)

**Behavior:** Redirects to `/profile?action=open-integrations` with status info.

**Frontend Consumer:** Browser redirect after OAuth completion

---

## Service Layer

### `services/composio.ts`

Thin wrapper around the Composio SDK. Provides:

- `getComposioClient()` - Singleton client initialization
- `listAuthConfigs()` - Fetches available auth configs
- `listConnections(userId)` - Fetches user's connected accounts
- `initiateConnection(userId, authConfigId, redirectUri)` - Starts OAuth flow
- `getAvailableTools(userId, toolkits)` - Gets tools for connected apps
- `getToolAction(userId, actionName)` - Gets a specific tool by name

**Composio SDK Reference:** [TypeScript SDK Core Classes](https://docs.composio.dev/type-script/core-classes/composio)

---

## Key Concepts

### Auth Configs vs Connected Accounts

| Concept | Description | Example |
|---------|-------------|---------|
| **Auth Config** | Pre-configured authentication template | `gmail-oxzcjt` with OAuth2 |
| **Connected Account** | Actual user connection using an auth config | User "agipo_test_user" connected to Gmail |

Auth configs are created in the [Composio Dashboard](https://platform.composio.dev/). Connected accounts are created when users authorize via OAuth.

### User Identity (MVP)

Currently using hardcoded `"agipo_test_user"` for all operations. TODO: Replace with actual authenticated user ID.

---

## Composio Documentation Links

- **SDK Reference:** https://docs.composio.dev/type-script/core-classes/composio
- **Auth Configs API:** https://docs.composio.dev/api-reference/auth-configs
- **Connected Accounts API:** https://docs.composio.dev/api-reference/connected-accounts
- **Composio Dashboard:** https://platform.composio.dev/

---

## Frontend Components

| Component | Location | Uses Routes |
|-----------|----------|-------------|
| `useIntegrations` | `app/(pages)/profile/hooks/` | `/auth-configs`, `/list`, `/connect` |
| `IntegrationSettingsDialog` | `app/(pages)/profile/components/integrations/` | Via hook |
| `IntegrationTable` | `app/(pages)/profile/components/integrations/` | Via hook |
| `AddConnectionDialog` | `app/(pages)/profile/components/integrations/` | Via hook |
| `ConnectionsSection` | `app/(pages)/profile/components/integrations/` | Opens dialog |

