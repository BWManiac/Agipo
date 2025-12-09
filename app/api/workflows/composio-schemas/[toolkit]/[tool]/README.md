# Tool Schema

> Returns a single tool's complete schema with full input and output parameter definitions, enabling users to configure workflow steps with proper field mappings.

**Endpoint:** `GET /api/workflows/composio-schemas/[toolkit]/[tool]`  
**Auth:** None

---

## Purpose

Enables users to see the complete schema for a specific tool when configuring a workflow step. When users select a tool in the workflow editor, this endpoint provides the full input and output parameter schemas needed to map data between steps. This powers the step configuration UI where users bind workflow inputs and previous step outputs to tool parameters.

---

## Approach

Reads the cached toolkit file from disk, then finds the specific tool within that toolkit by matching the tool slug. Returns the tool's complete schema including input and output parameters. If the toolkit or tool isn't found, returns 404. This relies on the cache being populated by the sync endpoint.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract toolkit slug and tool slug from route params
├── **Call `readToolkitCache(toolkitSlug)`** from cache service
├── If toolkit not found:
│   └── Return 404 with error message
├── Find tool in toolkit.tools array by slug
├── If tool not found:
│   └── Return 404 with error message
├── Return tool schema with inputParameters and outputParameters
└── On error: Return 500 with error message
```

---

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkit` | string | Yes | Toolkit slug (e.g., "gmail") |
| `tool` | string | Yes | Tool slug (e.g., "GMAIL_SEND_EMAIL") |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Tool slug |
| `name` | string | Tool display name |
| `description` | string | Tool description |
| `toolkitSlug` | string | Parent toolkit slug |
| `inputParameters` | object | Full input parameter schema |
| `outputParameters` | object | Full output parameter schema |

**Example Response:**
```json
{
  "slug": "GMAIL_SEND_EMAIL",
  "name": "Send Email",
  "description": "Sends an email via Gmail",
  "toolkitSlug": "gmail",
  "inputParameters": {
    "to": {
      "type": "string",
      "description": "Recipient email address",
      "required": true
    },
    "subject": {
      "type": "string",
      "description": "Email subject",
      "required": true
    },
    "body": {
      "type": "string",
      "description": "Email body",
      "required": true
    }
  },
  "outputParameters": {
    "messageId": {
      "type": "string",
      "description": "Gmail message ID"
    }
  }
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Details Panel | `app/(pages)/workflows/editor/components/panels/details/DetailsPanel.tsx` | Load tool schema when step selected |
| Step Path Picker | `app/(pages)/workflows/editor/components/panels/details/StepPathPicker.tsx` | Show output schema for data mapping |

---

## Related Docs

- Schema Cache Service - `app/api/workflows/composio-schemas/services/composio-schema-cache.ts`
- `/api/workflows/composio-schemas/[toolkit]` - Returns all tools for a toolkit
- `/api/workflows/composio-schemas/sync` - Populates the cache

---

## Notes

This endpoint reads from cache, so the toolkit must have been synced first. The outputParameters schema is used by the step path picker to show available fields from previous steps for data binding.

---

## Future Improvements

- [ ] Add schema validation
- [ ] Add example values for parameters
- [ ] Add parameter descriptions in UI-friendly format

