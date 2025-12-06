# Disconnect

> Enables users to remove a connected external account they no longer want linked.

**Endpoint:** `DELETE /api/connections/disconnect`  
**Auth:** Clerk

---

## Purpose

Removes a connected account for the authenticated user. When a user no longer wants an integration (like Gmail or GitHub) linked to their Agipo account, this endpoint handles the disconnection. After disconnection, agents will no longer be able to use tools from that service on behalf of the user.

---

## Approach

We authenticate the user via Clerk, validate the connection ID from the request body, then call Composio's `disconnectAccount()` to remove the connection. Composio handles revoking any stored tokens on their end.

---

## Pseudocode

```
DELETE(request): NextResponse
├── Authenticate user via Clerk
├── If not authenticated: Return 401
├── Parse connectionId from request body
├── Validate connectionId is present and is string
├── **Call `disconnectAccount(connectionId)`** from composio service
└── Return { success: true }
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `connectionId` | string | Yes | The connection ID to remove |

**Example Request:**
```json
{
  "connectionId": "conn_abc123"
}
```

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether disconnection succeeded |

**Example Response:**
```json
{
  "success": true
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionsSection | `app/(pages)/profile/components/connections/` | "Disconnect" button action |

---

## Related Docs

- [Composio Connected Accounts](https://docs.composio.dev/api-reference/connected-accounts) - SDK reference

---

## Notes

- We don't verify the connection belongs to the user - Composio may handle this
- Consider adding ownership validation before disconnecting

---

## Future Improvements

- [ ] Verify connection belongs to authenticated user
- [ ] Warn user if agents are using this connection
- [ ] Add soft-delete with grace period
