# Connect

> Enables users to link their external accounts (Gmail, GitHub, Slack) to power agent capabilities.

**Endpoint:** `POST /api/connections/connect`  
**Auth:** Clerk

---

## Purpose

Initiates a connection flow for the authenticated user. This is how users link their external accounts to Agipo. The route supports two authentication modes: OAuth (redirects user to provider) and API Key (immediate connection). Once connected, agents can use these accounts to perform actions on behalf of the user.

---

## Approach

We authenticate the user via Clerk, then branch based on whether an API key was provided. For OAuth connections, we call Composio's `initiateConnection()` which returns a redirect URL to the OAuth provider. For API key connections, we call `initiateApiKeyConnection()` which creates the connection immediately without a redirect.

---

## Pseudocode

```
POST(request): NextResponse
├── Authenticate user via Clerk
├── Parse request body for authConfigId, redirectUri, apiKey
├── Validate authConfigId is present
├── If apiKey provided:
│   ├── **Call `initiateApiKeyConnection()`** with userId, authConfigId, apiKey
│   └── Return { success, connectionId, status }
├── Else (OAuth flow):
│   ├── **Call `initiateConnection()`** with userId, authConfigId, redirectUri
│   └── Return { redirectUrl, connectionStatus }
└── On error: Return 500 with error message
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authConfigId` | string | Yes | The Composio auth config ID |
| `redirectUri` | string | No | Custom OAuth callback URL |
| `apiKey` | string | No | API key for non-OAuth connections |

**Example Request (OAuth):**
```json
{
  "authConfigId": "ac_FpW8_GwXyMBz"
}
```

**Example Request (API Key):**
```json
{
  "authConfigId": "ac_xyz123",
  "apiKey": "sk-live-abc123..."
}
```

---

## Output

**OAuth Response:**
| Field | Type | Description |
|-------|------|-------------|
| `redirectUrl` | string | URL to redirect user for OAuth |
| `connectionStatus` | string | "PENDING" |

**API Key Response:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether connection was created |
| `connectionId` | string | The new connection ID |
| `status` | string | "ACTIVE" |

**Example Response (OAuth):**
```json
{
  "redirectUrl": "https://accounts.google.com/o/oauth2/auth?...",
  "connectionStatus": "PENDING"
}
```

---

## Flow Diagram

```
OAuth Flow:
1. User selects service in AddConnectionDialog
2. Frontend calls POST /api/connections/connect
3. Backend returns redirectUrl
4. Frontend redirects user to OAuth provider
5. User authorizes access
6. Provider redirects to /api/connections/connect/callback
7. Callback redirects to /profile with status

API Key Flow:
1. User enters API key in dialog
2. Frontend calls POST /api/connections/connect with apiKey
3. Backend creates connection immediately
4. Frontend shows success, refreshes connections list
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| AddConnectionDialog | `app/(pages)/profile/components/connections/` | Initiates connection |

---

## Related Docs

- [Composio Connected Accounts](https://docs.composio.dev/api-reference/connected-accounts) - SDK reference

---

## Future Improvements

- [ ] Validate authConfigId exists before calling Composio
- [ ] Add rate limiting
- [ ] Support custom scopes for OAuth
