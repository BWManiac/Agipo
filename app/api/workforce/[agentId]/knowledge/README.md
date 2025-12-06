# Agent Knowledge

> Enables users to view and manage an agent's working memory about them.

**Endpoint:** `GET/DELETE /api/workforce/[agentId]/knowledge`  
**Auth:** Clerk

---

## Purpose

Provides access to an agent's "working memory" - facts and context the agent has learned about the user across conversations. This allows users to see what an agent remembers about them and clear that memory if desired. Working memory helps agents provide more personalized and contextual responses.

---

## Approach

Working memory is stored in Mastra's memory system, scoped by agent and user. GET retrieves the current memory state. DELETE clears all working memory for that agent-user pair, giving users control over what the agent knows.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId from params
├── **Call `getWorkingMemory(agentId, userId)`**
└── Return memory contents
```

**DELETE:**
```
DELETE(request, { params }): NextResponse
├── Authenticate user via Clerk
├── Extract agentId from params
├── **Call `clearWorkingMemory(agentId, userId)`**
└── Return { success: true }
```

---

## Input

None (agentId from path, userId from Clerk)

---

## Output

**GET Response:**
```json
{
  "memories": [
    {
      "fact": "User prefers formal email tone",
      "createdAt": "2025-12-01T00:00:00.000Z"
    }
  ]
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
| KnowledgePanel | `app/(pages)/workforce/components/agent-modal/` | Memory viewer |

---

## Related Docs

- [Mastra Memory](https://mastra.dev/docs/memory) - Working memory system

---

## Future Improvements

- [ ] Add selective memory deletion
- [ ] Add memory editing
- [ ] Show memory source (which conversation)

