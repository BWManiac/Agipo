# Session Instance

> Get details or terminate a specific browser session.

**Endpoint:** `GET|DELETE /api/browser-automation/sessions/[sessionId]`
**Auth:** None (internal API)

---

## Purpose

This endpoint provides operations on individual browser sessions. Users can retrieve the current status and connection details for a session, or terminate it when finished. Terminating a session with `persist: true` saves the browser state (cookies, localStorage) to the profile.

**Product Value:** Enables users to monitor session status and cleanly end sessions, preserving authenticated state when desired.

---

## Approach

The route extracts the session ID from the URL path and delegates to the `anchor-client` service. For GET, it fetches session status from Anchor's API. For DELETE, it calls the SDK's delete method which terminates the browser instance and triggers profile persistence if configured.

---

## GET - Get Session Details

Retrieves the current status and connection URLs for a session.

### Pseudocode

```
GET(request, { params }): NextResponse
├── Extract sessionId from params
├── **Call `getSession(sessionId)`** from anchor-client
├── **If not found**: Return 404
└── Return session data
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `session.id` | string | Session identifier |
| `session.cdpUrl` | string | Chrome DevTools Protocol URL |
| `session.liveViewUrl` | string | Live view URL |
| `session.status` | string | Current status (starting, running, idle, stopped) |

**Example Response:**
```json
{
  "session": {
    "id": "sess_abc123",
    "cdpUrl": "wss://browser.anchorbrowser.io/sess_abc123",
    "liveViewUrl": "https://live.anchorbrowser.io/sess_abc123",
    "status": "running"
  }
}
```

---

## DELETE - Terminate Session

Terminates a browser session. If the session was created with `persist: true`, the browser state is saved to the profile.

### Pseudocode

```
DELETE(request, { params }): NextResponse
├── Extract sessionId from params
├── **Call `getSession(sessionId)`** to verify existence
├── **If not found**: Return 404
├── **Call `terminateSession(sessionId)`** from anchor-client
└── Return success message
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether termination succeeded |
| `message` | string | Confirmation message |

**Example Response:**
```json
{
  "success": true,
  "message": "Session terminated"
}
```

---

## Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Session not found |
| 500 | Failed to get/terminate session |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| sessionsSlice | `store/slices/sessionsSlice.ts` | terminateSession action |
| BrowserView | `components/BrowserView` | Session status polling |

---

## Notes

- Terminating a session is idempotent - calling DELETE on an already-terminated session returns 404
- Profile persistence happens automatically on termination if `persist: true` was set at creation
- The session status may lag behind actual state; poll for accurate status

---

## Related Docs

- [Sessions Collection](../README.md) - List and create sessions
- [Chat Endpoint](./chat/README.md) - Execute agent tasks
- [Anchor Browser API](https://docs.anchorbrowser.io/api-reference/browser-sessions/end-browser-session)
