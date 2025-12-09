# Composio Tools Service (Toolkits)

> Fetches tools, toolkits, and triggers from Composio for discovery and assignment.

**Service:** `tools.ts`  
**Domain:** Connections

---

## Purpose

This service provides discovery and metadata operations for Composio integrations. It enables users to browse available tools, toolkits, and triggers, discover what integrations are available, and understand what capabilities each toolkit provides. This powers the tool assignment UI where users select which Composio tools their agents can use.

**Product Value:** Users need to explore and discover what integrations are available before connecting them. This service enables "What tools does Gmail have?" and "What can I do with Slack?" type queries, making the integration landscape discoverable and understandable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getAvailableTools()` | Retrieves available tools for a user from their connected apps, filtered by toolkit names. | When displaying tools available for assignment after user has connected accounts |
| `getToolAction()` | Gets a specific tool by its action name (e.g., "GMAIL_SEND_EMAIL") from Composio. | When you need metadata for a specific tool |
| `getToolsForConnection()` | Retrieves all tools available for a specific toolkit slug, formatted for UI display. | When showing tool list for a connection/toolkit in the assignment UI |
| `getToolkit()` | Gets toolkit details by slug, including metadata like name, description, and logo. | When displaying toolkit information in the UI |
| `getToolsForToolkit()` | Gets all tools for a specific toolkit in raw Composio format. | When you need the complete tool list with full schema details |
| `getTriggersForToolkit()` | Gets trigger types for a toolkit (webhooks, events that can trigger workflows). | When displaying trigger options for workflow automation |
| `getNoAuthToolkits()` | Retrieves platform-provided toolkits that work without user authentication (like browser_tool). | When displaying tools available to all users without requiring connections |
| `getConnectionToolsForMastra()` | Gets Composio tools in Mastra-native format (deprecated, blocked by version incompatibility). | Currently unusable - deprecated |
| `getConnectionToolsVercel()` | Gets Composio tools in Vercel AI SDK format (deprecated, use composio-tools.ts instead). | Currently deprecated - use manual conversion in composio-tools.ts |

---

## Approach

The service uses the base Composio client for most operations (toolkit/tool discovery doesn't need providers). It handles data transformation to match UI expectations, filters out unnecessary data, and works around Composio API quirks (like broken trigger filtering). NO_AUTH toolkit handling is special-cased since these toolkits don't appear in auth configs but are available to all users.

---

## Public API

### `getAvailableTools(userId: string, toolkits: string[]): Promise<Tool[]>`

**What it does:** Retrieves tools available for a user from their connected apps, filtered by the specified toolkit names.

**Product Impact:** When users have connected multiple accounts (Gmail, Slack, etc.), this function shows what tools are actually available from those connections, enabling tool assignment.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Agipo user ID (maps to Composio entity ID) |
| `toolkits` | string[] | Yes | Array of toolkit slugs to filter by (e.g., ["gmail", "slack"]) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Tool[]> | Array of available tools from the specified toolkits for this user's connections |

---

### `getToolAction(userId: string, actionName: string): Promise<Tool | null>`

**What it does:** Gets a specific Composio tool by its action name, useful when you know exactly which tool you need.

**Product Impact:** Routes that need specific tool metadata (like schema details) can fetch just that tool without loading all tools from a toolkit.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Agipo user ID (maps to Composio entity ID) |
| `actionName` | string | Yes | The Composio action name (e.g., "GMAIL_SEND_EMAIL") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Tool \| null> | The tool object if found, null if not found |

---

### `getToolsForConnection(toolkitSlug: string): Promise<ToolSummary[]>`

**What it does:** Gets all tools available for a specific toolkit slug, formatted with simplified structure (id, name, description) for UI display.

**Product Impact:** The connection assignment UI needs to show "What tools does Gmail have?" This function provides that list in a UI-friendly format.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkitSlug` | string | Yes | The toolkit slug (e.g., "gmail", "slack") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolSummary[]> | Array of tools with id, name, and description fields |

---

### `getToolkit(slug: string): Promise<Toolkit>`

**What it does:** Gets toolkit metadata including name, description, logo, and authentication details.

**Product Impact:** UI displays toolkit information when users browse available integrations. This provides the metadata needed for cards, descriptions, and logos.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | The toolkit slug (e.g., "gmail", "slack") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Toolkit> | Toolkit object with metadata |

---

### `getToolsForToolkit(toolkitSlug: string): Promise<Tool[]>`

**What it does:** Gets all tools for a toolkit in raw Composio format with full schema details.

**Product Impact:** When detailed tool schemas are needed (for code generation, validation, etc.), this provides the complete tool definitions.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkitSlug` | string | Yes | The toolkit slug (e.g., "gmail", "slack") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<Tool[]> | Array of raw Composio tool objects with full schemas |

---

### `getTriggersForToolkit(toolkitSlug: string): Promise<TriggerList>`

**What it does:** Gets trigger types available for a toolkit (webhooks, events that can trigger workflows).

**Product Impact:** Future feature for workflow automation - when Gmail receives an email or Slack gets a message, workflows could be triggered. This function discovers what triggers are available.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkitSlug` | string | Yes | The toolkit slug (e.g., "gmail", "slack") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<TriggerList> | List of trigger types available for the toolkit |

**Note:** Composio's API filter is broken, so this function fetches all triggers and filters client-side by toolkit slug.

---

### `getNoAuthToolkits(): Promise<NoAuthToolkit[]>`

**What it does:** Retrieves platform-provided toolkits that work without user authentication, formatted with toolkit metadata and available tools.

**Product Impact:** Some tools (like browser automation) are available to all users without requiring connections. This function surfaces those tools so they can be assigned to agents universally.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<NoAuthToolkit[]> | Array of NO_AUTH toolkits with metadata and tools |

**Process:**

```
getNoAuthToolkits(): Promise<NoAuthToolkit[]>
├── Initialize empty results array
├── **For each known NO_AUTH toolkit slug:**
│   ├── **Call `client.toolkits.get(slug)`**
│   ├── **Check if mode is NO_AUTH**
│   ├── **Call `client.tools.getRawComposioTools()`** for toolkit
│   ├── Map tools to simplified format (id, name, description)
│   └── Add to results
└── Return results array
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/app/api/connections/services/client` | Composio client factories (base, Mastra, Vercel) |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Available Toolkits Route | `app/api/connections/available/toolkits/route.ts` | Lists all available toolkits |
| Toolkit Tools Route | `app/api/connections/available/toolkits/[slug]/tools/route.ts` | Lists tools for a specific toolkit |
| Toolkit Triggers Route | `app/api/connections/available/toolkits/[slug]/triggers/route.ts` | Lists triggers for a toolkit |
| Connection Tools UI | `app/(pages)/workforce/components/agent-modal/` | Displays available tools for assignment |

---

## Design Decisions

### Why client-side filtering for triggers?

**Decision:** `getTriggersForToolkit()` fetches all triggers and filters client-side instead of using Composio's API filter.

**Rationale:** Composio's API filter parameter doesn't work correctly for triggers. Fetching all and filtering client-side is a workaround that ensures we get accurate results. This is documented in code comments.

### Why separate NO_AUTH toolkit handling?

**Decision:** NO_AUTH toolkits are handled separately with a hardcoded list rather than discovered from auth configs.

**Rationale:** NO_AUTH toolkits don't appear in auth configs (they don't require authentication), so they need special discovery logic. Hardcoding the known list is simple and reliable for MVP.

---

## Error Handling

- Functions return `null` or empty arrays if tools/toolkits are not found
- NO_AUTH toolkit failures are logged as warnings but don't fail the entire operation
- Client-side filtering gracefully handles missing toolkit slugs

---

## Related Docs

- [Client Service README](../../services/client.README.md) - Provides Composio clients
- [Composio Tools Service README](../../../tools/services/composio-tools.README.md) - Tool execution and schema conversion

---

## Future Improvements

- [ ] Cache toolkit metadata (changes infrequently)
- [ ] Add toolkit search/filtering capabilities
- [ ] Remove deprecated provider functions once fully migrated
- [ ] Add trigger subscription management when workflow triggers are implemented

