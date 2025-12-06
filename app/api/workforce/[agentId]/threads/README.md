# Conversation Threads

> Enables users to manage their conversation history with agents.

**Endpoint:** `GET/POST /api/workforce/[agentId]/threads`  
**Auth:** Clerk

---

## Purpose

Manages conversation threads between users and agents. Threads allow users to have multiple separate conversations with the same agent and return to previous conversations with full context. Each thread stores the conversation history and can have an optional title.

---

## Approach

Threads are stored in Mastra's memory system, scoped by agent ID and user ID (resource ID). We provide endpoints to list existing threads and create new ones. The actual message history is stored within each thread by Mastra.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId from params
├── **Call `getThreadsForUser(agentId, userId)`**
└── Return { threads } sorted by updatedAt desc
```

**POST:**
```
POST(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId from params
├── Parse optional title from body
├── **Call `createThread(agentId, userId, title)`**
└── Return { thread } with 201 status
```

---

## Input (POST)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Optional thread title |

**Example Request:**
```json
{
  "title": "Email drafting session"
}
```

---

## Output

**GET Response:**
```json
{
  "threads": [
    {
      "id": "thread_abc123",
      "title": "Email drafting session",
      "createdAt": "2025-12-01T00:00:00.000Z",
      "updatedAt": "2025-12-03T12:00:00.000Z"
    }
  ]
}
```

**POST Response:**
```json
{
  "thread": {
    "id": "thread_xyz789",
    "title": "New conversation",
    "createdAt": "2025-12-05T10:00:00.000Z"
  }
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ThreadList | `app/(pages)/workforce/components/agent-modal/` | Thread history sidebar |

---

## Related Docs

- [Mastra Memory](https://mastra.dev/docs/memory) - Thread storage

---

## Future Improvements

- [ ] Add thread deletion
- [ ] Add thread renaming
- [ ] Add thread search

