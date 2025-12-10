# Phase 1: API Foundation

**Status:** Planned
**Depends On:** Phase 0 (Technical Spike)
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Create the backend infrastructure for browser session management using Anchor Browser SDK. This phase establishes the API routes and services that all other phases depend on.

**Note:** This phase assumes Phase 0 (Technical Spike) has validated all core assumptions. If Phase 0 revealed any issues, this phase should be updated accordingly before execution.

After this phase, the backend can create, list, and terminate browser sessions via Anchor Browser, returning the necessary URLs for iframe embedding and Playwright control.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SDK vs REST | SDK (`anchorbrowser` npm) | Type safety, better DX, SDK handles auth |
| Session storage | In-memory + Anchor | Anchor manages session state, we cache metadata |
| Error handling | Return structured errors | Agent and UI need actionable error messages |

### Pertinent Research

- **Research Log Section 2**: Anchor Browser Sessions API details
- **Research Log Section 4**: SDK usage patterns and authentication
- **Research Log Section 8**: Rate limits and quotas

*Source: `_docs/_tasks/21-browser-automation/02-Research-Log.md`*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/services/anchor-client.ts` | Create | Anchor Browser SDK wrapper |
| `app/api/browser-automation/services/session-manager.ts` | Create | Session lifecycle management |

#### Backend / Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/sessions/route.ts` | Create | GET list, POST create |
| `app/api/browser-automation/sessions/[sessionId]/route.ts` | Create | GET details, DELETE terminate |

#### Dependencies

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `anchorbrowser` dependency |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-1.1 | Create session returns session object | POST /sessions, verify response shape |
| AC-1.2 | Session object includes cdpUrl | Verify cdpUrl in response |
| AC-1.3 | Session object includes liveViewUrl | Verify liveViewUrl in response |
| AC-1.4 | List sessions returns array | GET /sessions, verify array |
| AC-1.5 | Get session returns details | GET /sessions/[id], verify response |
| AC-1.6 | Delete session terminates in Anchor | DELETE /sessions/[id], verify in Anchor dashboard |
| AC-1.7 | Invalid session ID returns 404 | GET/DELETE with fake ID |
| AC-1.8 | API key validation | Missing/invalid key returns 401 |

### User Flows

#### Flow 1: Create Session

```
1. Client sends POST /api/browser-automation/sessions
2. Server validates request body (optional: profileName, initialUrl)
3. anchor-client.ts calls anchorClient.sessions.create()
4. Anchor Browser returns session data
5. session-manager.ts caches session metadata
6. Server returns { success: true, session: { id, cdpUrl, liveViewUrl, status } }
```

#### Flow 2: List Sessions

```
1. Client sends GET /api/browser-automation/sessions
2. anchor-client.ts calls anchorClient.sessions.list() or status endpoint
3. Server returns { sessions: [...], count: N }
```

#### Flow 3: Terminate Session

```
1. Client sends DELETE /api/browser-automation/sessions/[sessionId]
2. session-manager.ts validates session exists
3. anchor-client.ts calls anchorClient.sessions.delete(sessionId)
4. session-manager.ts removes from cache
5. Server returns { success: true, message: "Session terminated" }
```

---

## Out of Scope

- Profile management (Phase 5)
- Chat/agent functionality (Phase 3)
- Frontend UI (Phase 2)
- Action logging (Phase 4)

**Note:** Phase 0 spike code will be refactored into proper service structure in this phase.

---

## Implementation Details

### anchor-client.ts

```typescript
// app/api/browser-automation/services/anchor-client.ts

import AnchorClient from "anchorbrowser";

// Initialize client
const anchorClient = new AnchorClient({
  apiKey: process.env.ANCHOR_API_KEY!,
});

export interface CreateSessionOptions {
  profileName?: string;
  initialUrl?: string;
  timeout?: {
    maxDuration?: number;  // Minutes
    idleTimeout?: number;  // Minutes
  };
  recording?: boolean;
}

export interface SessionData {
  id: string;
  cdpUrl: string;
  liveViewUrl: string;
  status: "starting" | "running" | "idle" | "stopped";
}

export async function createSession(options?: CreateSessionOptions): Promise<SessionData> {
  const session = await anchorClient.sessions.create({
    browser: {
      profile: options?.profileName
        ? { name: options.profileName, persist: true }
        : undefined,
    },
    session: {
      initial_url: options?.initialUrl,
      timeout: {
        max_duration: options?.timeout?.maxDuration || 20,
        idle_timeout: options?.timeout?.idleTimeout || 5,
      },
      recording: {
        active: options?.recording ?? true,
      },
    },
  });

  return {
    id: session.data.id,
    cdpUrl: session.data.cdp_url,
    liveViewUrl: session.data.live_view_url,
    status: "starting",
  };
}

export async function terminateSession(sessionId: string): Promise<void> {
  await anchorClient.sessions.delete(sessionId);
}

export async function listSessions(): Promise<SessionData[]> {
  // Use REST endpoint since SDK may not have list method
  const response = await fetch("https://api.anchorbrowser.io/v1/sessions/all/status", {
    headers: {
      "anchor-api-key": process.env.ANCHOR_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list sessions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.sessions.map((s: any) => ({
    id: s.id,
    cdpUrl: s.cdp_url,
    liveViewUrl: s.live_view_url,
    status: s.status,
  }));
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    const response = await fetch(`https://api.anchorbrowser.io/v1/sessions/${sessionId}/status`, {
      headers: {
        "anchor-api-key": process.env.ANCHOR_API_KEY!,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      cdpUrl: data.cdp_url,
      liveViewUrl: data.live_view_url,
      status: data.status,
    };
  } catch (error) {
    if ((error as any).status === 404) {
      return null;
    }
    throw error;
  }
}
```

### sessions/route.ts

```typescript
// app/api/browser-automation/sessions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, listSessions } from "../services/anchor-client";

const CreateSessionSchema = z.object({
  profileName: z.string().optional(),
  initialUrl: z.string().url().optional(),
  config: z.object({
    timeout: z.object({
      maxDuration: z.number().min(1).max(60).optional(),
      idleTimeout: z.number().min(1).max(30).optional(),
    }).optional(),
    recording: z.boolean().optional(),
  }).optional(),
});

// GET /api/browser-automation/sessions
export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

// POST /api/browser-automation/sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = CreateSessionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { profileName, initialUrl, config } = validated.data;

    const session = await createSession({
      profileName,
      initialUrl,
      timeout: config?.timeout,
      recording: config?.recording,
    });

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        profileName,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
```

### sessions/[sessionId]/route.ts

```typescript
// app/api/browser-automation/sessions/[sessionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSession, terminateSession } from "../../services/anchor-client";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// GET /api/browser-automation/sessions/[sessionId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

// DELETE /api/browser-automation/sessions/[sessionId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    await terminateSession(sessionId);

    return NextResponse.json({
      success: true,
      message: "Session terminated",
    });
  } catch (error) {
    console.error("Failed to terminate session:", error);
    return NextResponse.json(
      { error: "Failed to terminate session" },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

```env
# .env.local (add these)
ANCHOR_API_KEY=your_anchor_api_key_here
```

---

## References

- **Phase 0**: `00-Phase0-Technical-Spike.md` - Core assumptions validation
- **Research Log**: `02-Research-Log.md`
- **Anchor Browser Docs**: https://docs.anchorbrowser.io
- **Frontend-Backend Mapping**: `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/Frontend-Backend-Mapping.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

