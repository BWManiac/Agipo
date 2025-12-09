# OAuth Callback

> Completes the OAuth connection flow after a user authorizes access with an external provider.

**Endpoint:** `GET /api/connections/connect/callback`  
**Auth:** None (called by OAuth provider)

---

## Purpose

Handles the OAuth callback after a user authorizes with an external provider like Google, GitHub, or Slack. This is the redirect target that OAuth providers call after user authorization. The route processes the result (success or error) and redirects the user back to the profile page with appropriate status information.

---

## Approach

When called, we parse the query parameters from the OAuth provider. If there's an error parameter, we redirect to the profile page with error details. On success, Composio handles the token storage on their backend - we simply redirect the user back to the profile page with a success action that triggers the connections dialog to open and refresh.

---

## Pseudocode

```
GET(request): NextResponse
├── Parse searchParams from URL
├── Check for error parameter
├── If error:
│   ├── Log error details
│   └── Redirect to /profile?action=integration-error&error=...
├── Else (success):
│   ├── Log success (hasCode, hasState)
│   └── Redirect to /profile?action=open-connections
└── On exception: Redirect to /profile with generic error
```

---

## Input

Query parameters (provided by OAuth provider):

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Authorization code (on success) |
| `state` | string | CSRF state parameter |
| `error` | string | Error code (on failure) |
| `error_description` | string | Error details (on failure) |

---

## Output

This endpoint always redirects (302). No JSON response.

**Success Redirect:**
```
/profile?action=open-connections
```

**Error Redirect:**
```
/profile?action=integration-error&error=<message>
```

---

## Flow Diagram

```
1. User clicks "Connect" → POST /api/connections/connect
2. User redirected to OAuth provider (Google, GitHub, etc.)
3. User authorizes access
4. Provider redirects to THIS endpoint with code/state
5. We redirect to /profile?action=open-connections
6. Profile page auto-opens ConnectionsDialog
7. Dialog fetches updated connections list
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| OAuth Providers | External | Redirect target after authorization |
| ConnectionsSection | `app/(pages)/profile/` | Reads `action` query param |

---

## Notes

- Composio handles token exchange and storage on their backend
- We don't store any OAuth tokens locally
- The callback URL must be whitelisted in OAuth provider settings

---

## Related Docs

- [Composio OAuth Flow](https://docs.composio.dev/docs/authentication) - OAuth documentation

---

## Future Improvements

- [ ] Add state parameter validation for CSRF protection
- [ ] Store connection audit trail in database
- [ ] Handle edge case: user cancels OAuth flow
