# Browser Automation API (`/api/browser-automation`)

> Cloud-based browser automation with AI-powered natural language control.

**Domain:** Browser Automation (Experiments)

---

## Purpose

The Browser Automation API enables users to create and control cloud browser sessions using natural language commands. Users can spin up isolated browser instances, navigate websites, perform actions, and maintain authenticated sessions across multiple runs.

This domain integrates with [Anchor Browser](https://anchorbrowser.io), a cloud browser service that provides:
- Isolated Chromium instances with live view streaming
- AI agent for natural language browser control
- Profile persistence for authenticated sessions
- Anti-detection features (stealth mode, residential proxies, CAPTCHA solving)

**Product Value:** Enables AI agents and users to interact with any website programmatically without maintaining local browser infrastructure.

---

## Endpoints Overview

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/browser-automation/sessions` | GET | List all active browser sessions |
| `/api/browser-automation/sessions` | POST | Create a new browser session |
| `/api/browser-automation/sessions/[sessionId]` | GET | Get details for a specific session |
| `/api/browser-automation/sessions/[sessionId]` | DELETE | Terminate a session |
| `/api/browser-automation/sessions/[sessionId]/chat` | POST | Execute natural language task (SSE) |

See [sessions/README.md](./sessions/README.md) for details.

### Profiles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/browser-automation/profiles` | GET | List all saved profiles |
| `/api/browser-automation/profiles` | POST | Create a new credential profile |
| `/api/browser-automation/profiles/[profileName]` | GET | Get profile details |
| `/api/browser-automation/profiles/[profileName]` | PUT | Update a profile |
| `/api/browser-automation/profiles/[profileName]` | DELETE | Delete a profile |

See [profiles/README.md](./profiles/README.md) for details.

---

## Architecture

```
browser-automation/
├── README.md                              ← This file
├── services/                              ← Shared services
│   ├── anchor-client.ts                   ← Anchor Browser SDK wrapper
│   └── profile-storage.ts                 ← Profile & credential storage
├── sessions/
│   ├── route.ts                           ← GET (list), POST (create)
│   ├── README.md
│   └── [sessionId]/
│       ├── route.ts                       ← GET (details), DELETE (terminate)
│       ├── README.md
│       └── chat/
│           ├── route.ts                   ← POST (SSE agent task)
│           ├── README.md
│           └── services/
│               └── anchor-agent.ts        ← Co-located agent service
└── profiles/
    ├── route.ts                           ← GET (list), POST (create)
    ├── README.md
    └── [profileName]/
        ├── route.ts                       ← GET, PUT, DELETE
        └── README.md
```

---

## Key Concepts

### Sessions

A **session** is an active cloud browser instance. Each session has:
- `id` - Unique session identifier
- `liveViewUrl` - URL to view the browser in real-time
- `cdpUrl` - Chrome DevTools Protocol URL for programmatic control
- `status` - Current state (starting, running, idle, stopped)

Sessions are ephemeral by default but can persist browser state using profiles.

### Profiles

**Profiles** come in two types:

1. **Anchor Profiles** (`type: "anchor"`)
   - Store browser state (cookies, localStorage) on Anchor's servers
   - Created by setting `persist: true` when creating a session
   - Allow resuming authenticated sessions

2. **Local Profiles** (`type: "local"`)
   - Store encrypted credentials locally
   - Can be used for automated login flows (future feature)

### Agent Tasks

The chat endpoint accepts natural language commands and uses Anchor's built-in AI agent to:
- Navigate to URLs
- Click elements
- Fill forms
- Extract data
- Perform multi-step workflows

Results are streamed via Server-Sent Events (SSE).

---

## Configuration

Required environment variables:

| Variable | Description |
|----------|-------------|
| `ANCHOR_API_KEY` | API key for Anchor Browser service |
| `PROFILE_ENCRYPTION_KEY` | Key for encrypting stored credentials (optional) |

---

## Related Docs

- [Anchor Browser Documentation](https://docs.anchorbrowser.io)
- [Domain Principles](../DOMAIN_PRINCIPLES.md)
- [Service README Template](../SERVICE_README_TEMPLATE.md)
- [Route README Template](../ROUTE_README_TEMPLATE.md)
