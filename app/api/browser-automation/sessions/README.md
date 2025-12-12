# Sessions Collection

> List and create cloud browser sessions.

**Endpoint:** `GET|POST /api/browser-automation/sessions`
**Auth:** None (internal API)

---

## Purpose

This endpoint manages the collection of browser sessions. Users can list all currently active sessions or create new ones with optional profile configuration. Creating a session spins up an isolated cloud browser instance that can be controlled via natural language or the Chrome DevTools Protocol.

**Product Value:** Enables users to launch browser automation sessions on demand without managing browser infrastructure.

---

## Approach

The route delegates to the `anchor-client` service which wraps the Anchor Browser SDK. Session creation configures browser options (proxy, stealth mode, ad blocking) and optionally attaches a profile for persistent authentication. The SDK returns connection URLs for live viewing and programmatic control.

---

## GET - List Sessions

Lists all active browser sessions from Anchor's servers.

### Pseudocode

```
GET(): NextResponse
├── **Call `listSessions()`** from anchor-client
├── Return sessions array with count
└── On error: Return 500 with error message
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `sessions` | SessionData[] | Array of active sessions |
| `count` | number | Total number of active sessions |

**Example Response:**
```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "cdpUrl": "wss://...",
      "liveViewUrl": "https://...",
      "status": "running"
    }
  ],
  "count": 1
}
```

---

## POST - Create Session

Creates a new cloud browser session with optional profile attachment.

### Pseudocode

```
POST(request): NextResponse
├── Validate ANCHOR_API_KEY is configured
├── Parse and validate request body
├── **If createNewProfile**: Validate profileName is provided
├── **Call `createSession()`** from anchor-client with options
├── **If createNewProfile**: Register profile locally via profile-storage
└── Return session data with success status
```

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileName` | string | No | Profile name to attach (existing or new) |
| `initialUrl` | string | No | URL to navigate to on start |
| `createNewProfile` | boolean | No | When true, creates a new persistent profile |
| `profileDisplayName` | string | No | Human-readable name for new profile |
| `config.timeout.maxDuration` | number | No | Max session duration in minutes (1-60) |
| `config.timeout.idleTimeout` | number | No | Idle timeout in minutes (1-30) |
| `config.recording` | boolean | No | Enable session recording (default: true) |

**Example Request - No Profile:**
```json
{
  "initialUrl": "https://example.com"
}
```

**Example Request - Create New Profile:**
```json
{
  "profileName": "linkedin-work",
  "profileDisplayName": "LinkedIn - Work Account",
  "createNewProfile": true,
  "initialUrl": "https://linkedin.com"
}
```

**Example Request - Use Existing Profile:**
```json
{
  "profileName": "linkedin-work",
  "initialUrl": "https://linkedin.com"
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether session was created |
| `session.id` | string | Unique session identifier |
| `session.cdpUrl` | string | Chrome DevTools Protocol WebSocket URL |
| `session.liveViewUrl` | string | URL to view browser in real-time |
| `session.status` | string | Session status (always "starting" initially) |
| `session.profileName` | string | Attached profile name (if any) |
| `session.createNewProfile` | boolean | Whether a new profile was created |
| `session.createdAt` | string | ISO timestamp |

**Example Response:**
```json
{
  "success": true,
  "session": {
    "id": "sess_abc123",
    "cdpUrl": "wss://browser.anchorbrowser.io/sess_abc123",
    "liveViewUrl": "https://live.anchorbrowser.io/sess_abc123",
    "status": "starting",
    "profileName": "linkedin-work",
    "createNewProfile": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| SessionsSidebar | `app/(pages)/experiments/browser-automation` | Lists and creates sessions |
| sessionsSlice | `store/slices/sessionsSlice.ts` | Zustand store actions |

---

## Related Docs

- [Session Instance](./[sessionId]/README.md) - Individual session operations
- [anchor-client Service](../services/anchor-client.README.md) - SDK wrapper
- [Anchor Browser API](https://docs.anchorbrowser.io/api-reference/browser-sessions/start-browser-session)
