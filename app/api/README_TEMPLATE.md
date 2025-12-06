# API Route README Template

Use this template when creating README files for API routes. Each route should have a co-located `README.md` file.

---

# [Route Name]

> [One-line product description: What does this enable users to do?]

**Endpoint:** `[METHOD] /api/[path]`  
**Auth:** [Clerk | None | API Key]

---

## Purpose

[3-4 sentences expanding on what this route accomplishes from a product perspective. 
Focus on the "why" and user value, not just technical implementation.
Explain the business problem this solves and who benefits from it.]

**Guidelines:**
- Write from a product perspective, not technical
- ❌ "Handles the OAuth callback after authorization"
- ✅ "Enables users to complete connecting their external accounts after authorizing with providers like Google or GitHub. This is the final step in the OAuth flow where we receive confirmation that the user granted access. Once complete, users can leverage their connected accounts to power agent capabilities."

---

## Approach

[Describe HOW this is accomplished at a technical level, but without code.
Explain the strategy, what services are involved, and the general flow.
This helps developers understand the implementation philosophy.]

**Guidelines:**
- Be technical but avoid code snippets
- Mention key services, SDKs, or patterns used
- Keep it to 2-4 sentences

**Example:**
> We use the Composio SDK to initiate the OAuth handshake. The SDK handles token exchange and returns a redirect URL. After user authorization, Composio calls back to our callback endpoint with the connection status.

---

## Pseudocode

[Show the logical flow of the route using pseudocode notation.
This makes the implementation scannable without reading actual code.]

**Format:**
```
routeHandler(request): response
├── Validate input
├── **Call `serviceFunction()`** with extracted params
├── Transform response
└── Return result
```

**Guidelines:**
- Use `├──` for steps, `└──` for final step
- Use `**Call \`functionName()\`**` for service calls
- Keep it high-level (5-10 steps max)
- Include error handling paths if significant

**Example:**
```
POST(request): NextResponse
├── Authenticate user via Clerk
├── Parse and validate request body
├── **Call `composio.connectedAccounts.initiate()`** with userId, authConfigId
├── Extract redirectUrl from response
└── Return { redirectUrl, status: "PENDING" }
```

---

## Input

[Document request body (POST/PUT) or query parameters (GET).]

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fieldName` | string | Yes | What this field represents |
| `optionalField` | number | No | Defaults to X |

**Example Request:**
```json
{
  "fieldName": "example value",
  "optionalField": 10
}
```

**Guidelines:**
- Always include at least one representative example
- For GET requests, document query params
- For routes with no input, write "None"

---

## Output

[Document the response structure.]

| Field | Type | Description |
|-------|------|-------------|
| `responseField` | string | What this field represents |
| `data` | object | Nested data structure |

**Example Response:**
```json
{
  "responseField": "example",
  "data": {
    "id": "abc123",
    "status": "success"
  }
}
```

**Guidelines:**
- Include success response format
- Document error response format if non-standard
- Include realistic example values

---

## Consumers

[List where this API is used - pages, hooks, other APIs, cron jobs, etc.]

| Consumer | Location | Usage |
|----------|----------|-------|
| Component/Hook | `app/(pages)/...` | Brief description |

**Guidelines:**
- Acknowledge this may become outdated - that's okay
- Helps developers understand impact of changes
- Include both frontend and backend consumers

---

## Flow Diagram

[For complex multi-step flows only. Skip for simple CRUD routes.]

```
1. User clicks "Connect"
2. Frontend calls POST /api/connect
3. Backend returns redirectUrl
4. User authorizes with provider
5. Provider redirects to callback
6. Callback redirects to app with status
```

**Guidelines:**
- Include for OAuth flows, webhooks, multi-step processes
- Skip for simple GET/POST CRUD operations
- Use numbered steps for clarity

---

## Related Docs

[External documentation links if applicable.]

- [Doc Name](https://...) - Brief description

**Guidelines:**
- Link to SDK documentation
- Link to third-party API docs
- Remove section if no external docs

---

## Notes

[Implementation details, gotchas, or important context. Remove if not needed.]

**Guidelines:**
- Document known limitations
- Explain non-obvious decisions
- Note dependencies on external services
- Remove this section if nothing noteworthy

---

## Future Improvements

[Ideas and TODOs for this route.]

- [ ] Improvement idea 1
- [ ] Improvement idea 2

**Guidelines:**
- Use checkbox format `- [ ]`
- Keep it realistic
- Okay if this becomes outdated

---

## File Location

READMEs should be co-located with their route:

```
app/api/
├── connections/
│   ├── connect/
│   │   ├── route.ts
│   │   └── README.md    ← co-located
│   └── list/
│       ├── route.ts
│       └── README.md    ← co-located
├── README_TEMPLATE.md   ← this file
```
