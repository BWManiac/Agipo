# Thread Details

> Enables users to view and delete specific conversation threads.

**Endpoint:** `GET/DELETE /api/workforce/[agentId]/threads/[threadId]`  
**Auth:** Clerk

---

## Purpose

Manages individual conversation threads. GET retrieves thread metadata and message history. DELETE removes a thread and its messages. This supports viewing previous conversations and cleaning up unwanted threads.

---

## Approach

We authenticate the user and validate they own the thread. For GET, we fetch the thread details from Mastra's memory system. For DELETE, we remove the thread and all associated messages.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId, threadId from params
├── **Call `getThread(agentId, userId, threadId)`**
└── Return thread with messages
```

**DELETE:**
```
DELETE(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId, threadId from params
├── **Call `deleteThread(agentId, userId, threadId)`**
└── Return { success: true }
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentId` | string (path) | Yes | Agent identifier |
| `threadId` | string (path) | Yes | Thread identifier |

---

## Output

**GET Response:**
```json
{
  "thread": {
    "id": "thread_abc123",
    "title": "Email drafting",
    "messages": [
      { "role": "user", "content": "Draft an email..." },
      { "role": "assistant", "content": "Here's a draft..." }
    ]
  }
}
```

**DELETE Response:**
```json
{ "success": true }
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ThreadList | `app/(pages)/workforce/components/agent-modal/` | View/delete threads |

