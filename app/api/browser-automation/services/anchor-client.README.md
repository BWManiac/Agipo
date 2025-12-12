# Anchor Client Service

> Wrapper for the Anchor Browser SDK providing typed session management operations.

**Service:** `anchor-client.ts`
**Domain:** Browser Automation

---

## Purpose

This service provides a typed interface for interacting with Anchor Browser's cloud browser infrastructure. It handles session lifecycle (create, get, list, terminate) and abstracts the SDK configuration including anti-detection features, proxy settings, and profile persistence.

**Product Value:** Enables the application to spin up isolated cloud browsers with stealth capabilities without managing browser infrastructure directly.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `createSession()` | Creates a new cloud browser instance with configured anti-detection features and optional profile attachment. | When user starts a new browser automation session. |
| `terminateSession()` | Ends a browser session and triggers profile persistence if configured. | When user ends a session or session times out. |
| `listSessions()` | Retrieves all active sessions from Anchor's servers. | When displaying the session list in the UI. |
| `getSession()` | Fetches status and connection details for a specific session. | When polling session status or verifying existence. |

---

## Approach

The service uses lazy initialization for the Anchor SDK client to ensure environment variables are loaded. All sessions are created with a standard set of anti-detection features enabled:

- **Residential proxy** - US-based residential IPs for legitimate-looking traffic
- **Extra stealth mode** - Patched Chromium to avoid bot detection
- **Ad blocker** - Removes unwanted advertisements
- **Popup blocker** - Blocks consent banners and popups
- **CAPTCHA solver** - Automatically handles CAPTCHA challenges

Profile persistence is controlled via the `persist` option - when true, browser state (cookies, localStorage) is saved when the session ends.

---

## Public API

### `createSession(options?: CreateSessionOptions): Promise<SessionData>`

**What it does:** Creates a new cloud browser session with the specified configuration. Returns connection URLs for live viewing and programmatic control.

**Product Impact:** Enables users to launch browser automation sessions with pre-configured anti-detection capabilities.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.profileName` | string | No | Profile name to attach (for persistence or loading) |
| `options.initialUrl` | string | No | URL to navigate to on session start |
| `options.timeout.maxDuration` | number | No | Max session duration in minutes (default: 20) |
| `options.timeout.idleTimeout` | number | No | Idle timeout in minutes (default: 5) |
| `options.recording` | boolean | No | Enable session recording (default: true) |
| `options.persist` | boolean | No | Save browser state when session ends |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique session identifier |
| `cdpUrl` | string | Chrome DevTools Protocol WebSocket URL |
| `liveViewUrl` | string | URL to view browser in real-time |
| `status` | string | Session status (always "starting" initially) |
| `profileName` | string | Attached profile name (if any) |
| `persist` | boolean | Whether session will save state |
| `createdAt` | string | ISO timestamp |

**Process:**

```
createSession(options): SessionData
├── Get or initialize Anchor SDK client
├── Build profile config with optional persist flag
├── **Call `client.sessions.create()`** with browser and session config
├── Validate response has required fields
└── Return normalized SessionData
```

---

### `terminateSession(sessionId: string): Promise<void>`

**What it does:** Terminates a browser session. If the session was created with `persist: true`, browser state is saved to the profile.

**Product Impact:** Enables clean session cleanup and triggers profile persistence for authenticated sessions.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | ID of session to terminate |

**Process:**

```
terminateSession(sessionId): void
├── Get Anchor SDK client
└── **Call `client.sessions.delete(sessionId)`**
```

---

### `listSessions(): Promise<SessionData[]>`

**What it does:** Retrieves all active browser sessions from Anchor's servers using the REST API.

**Product Impact:** Enables the UI to display all running sessions for management.

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | SessionData[] | Array of active sessions |

**Process:**

```
listSessions(): SessionData[]
├── **Fetch** `GET /v1/sessions/all/status` from Anchor API
├── **If no sessions**: Return empty array
└── Map response to SessionData format
```

**Note:** Uses direct REST API call because the SDK may not expose a list method.

---

### `getSession(sessionId: string): Promise<SessionData | null>`

**What it does:** Fetches the current status and connection details for a specific session.

**Product Impact:** Enables status polling and session validation.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | ID of session to fetch |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | SessionData \| null | Session data or null if not found |

**Process:**

```
getSession(sessionId): SessionData | null
├── **Fetch** `GET /v1/sessions/{sessionId}/status` from Anchor API
├── **If 404**: Return null
└── Return normalized SessionData
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `anchorbrowser` | Official Anchor Browser SDK |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Sessions Route | `sessions/route.ts` | createSession, listSessions |
| Session Instance Route | `sessions/[sessionId]/route.ts` | getSession, terminateSession |

---

## Design Decisions

### Why hardcode anti-detection settings?

**Decision:** All sessions are created with adblock, popup blocker, stealth mode, CAPTCHA solver, and residential proxy enabled.

**Rationale:** Browser automation typically requires anti-detection to avoid being blocked. Making these configurable would add complexity without clear benefit - users want sessions that "just work" on most websites. If specific sites require different settings, this can be made configurable later.

### Why use REST API for list/get operations?

**Decision:** `listSessions()` and `getSession()` use direct REST calls instead of SDK methods.

**Rationale:** The SDK may not expose these methods, or they may have different behavior. Direct REST calls give us full control and predictable responses.

---

## Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `ANCHOR_API_KEY` | API key for Anchor Browser service (required) |

---

## Related Docs

- [Sessions Route](../sessions/README.md) - Route that uses this service
- [Anchor Browser API](https://docs.anchorbrowser.io/api-reference/browser-sessions/start-browser-session)
