# Tool List API (`/api/tools/list`)

**Method:** `GET`

## Purpose
Retrieves a summary list of all tool definitions stored in the system. This is distinct from the executable tool registry; this lists the *source files* (workflows).

## Response
Array of summaries:
```json
[
  { "id": "tool-1", "name": "My Tool", "description": "...", "lastModified": "..." }
]
```

