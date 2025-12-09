# Toolkit Triggers

> Enables users to see what event triggers are available within a specific toolkit.

**Endpoint:** `GET /api/connections/available/toolkits/[slug]/triggers`  
**Auth:** None

---

## Purpose

Lists all available triggers for a specific toolkit. Triggers are events that can start workflows - for example, "new email received" or "new GitHub issue created". This supports future workflow automation features where agents can respond to external events.

---

## Approach

We extract the toolkit slug and call Composio's `getTriggersForToolkit()`. Note: Composio's API ignores the toolkit filter, so we fetch all triggers and filter client-side by the toolkit slug.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract slug from params
├── **Call `getTriggersForToolkit(slug)`** from composio service
│   └── (Internally fetches all triggers and filters by slug)
└── Return filtered triggers array
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string (path) | Yes | Toolkit identifier (e.g., "gmail") |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `items` | Trigger[] | Array of available triggers |
| `items[].name` | string | Trigger identifier |
| `items[].displayName` | string | Friendly name |
| `items[].description` | string | What triggers this event |

**Example Response:**
```json
{
  "items": [
    {
      "name": "gmail_new_email",
      "displayName": "New Email Received",
      "description": "Triggers when a new email arrives"
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| (Future) Workflow Editor | - | Trigger selection for automations |

---

## Notes

- Composio's trigger filter appears broken - we filter client-side
- Triggers are not yet fully integrated into the product

---

## Related Docs

- [Composio Triggers](https://docs.composio.dev/api-reference/triggers) - SDK reference

---

## Future Improvements

- [ ] Integrate triggers into workflow editor
- [ ] Add webhook registration for trigger events

