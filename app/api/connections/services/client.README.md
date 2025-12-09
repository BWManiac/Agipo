# Composio Client Service

> Provides singleton factories for Composio SDK clients with different provider configurations.

**Service:** `client.ts`  
**Domain:** Connections

---

## Purpose

This service manages Composio SDK client instances as singletons, ensuring efficient reuse across the application. It provides three client variants: a base client for general API operations, a Mastra provider client (currently blocked by version incompatibility), and a Vercel provider client that works with our current Mastra setup. Without this service, every API call would create a new client instance, wasting resources and potentially hitting rate limits.

**Product Value:** Enables efficient, consistent access to Composio's integration platform. All routes and services that interact with Composio (OAuth flows, tool fetching, connection management) rely on these singleton clients to avoid redundant initialization.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getComposioClient()` | Creates or returns a singleton Composio client instance without any provider, suitable for general API operations like listing connections or auth configs. | Use for admin/config operations that don't need provider-specific tool formatting |
| `getComposioMastraClient()` | Creates or returns a Composio client with MastraProvider (blocked by version incompatibility - requires @mastra/core@^0.21.x but we have 0.24.6). | Currently deprecated - not usable until Composio updates compatibility |
| `getComposioVercelClient()` | Creates or returns a Composio client with VercelProvider, returning tools in Vercel AI SDK format that Mastra Agent accepts. | Use when building tools for agents - this is the working provider for agent tool integration |

---

## Approach

All three functions implement the singleton pattern, caching client instances after first creation. Each function checks for an existing instance before creating a new one. The base client and Vercel client are production-ready, while the Mastra client is marked deprecated due to version incompatibility. Environment variable validation ensures API keys are present before client creation.

---

## Public API

### `getComposioClient(): Composio`

**What it does:** Returns a singleton Composio client instance configured with the API key from environment variables. This is the base client without any provider, suitable for general API operations.

**Product Impact:** All routes that need to list connections, fetch auth configs, or perform administrative operations use this client. It's the foundation for most Composio interactions in the Connections domain.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Composio | Singleton Composio client instance configured with COMPOSIO_API_KEY |

**Process:**

```
getComposioClient(): Composio
├── Check if composioClient singleton exists
├── If exists: Return cached instance
├── If not exists:
│   ├── Check COMPOSIO_API_KEY environment variable
│   ├── If missing: Throw error
│   ├── Create new Composio instance with apiKey
│   ├── Cache instance in module variable
│   └── Return new instance
```

**Error Handling:** Throws error if `COMPOSIO_API_KEY` environment variable is not set.

---

### `getComposioMastraClient(): Composio`

**What it does:** Returns a singleton Composio client configured with MastraProvider. This client would theoretically return tools in Mastra-native format, but is currently blocked by version incompatibility.

**Product Impact:** This would be the ideal client for agent tool integration if it worked, but it's blocked until Composio updates their package to support Mastra 0.24.x.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Composio | Singleton Composio client with MastraProvider (currently unusable due to version mismatch) |

**Process:**

```
getComposioMastraClient(): Composio
├── Check if composioMastraClient singleton exists
├── If exists: Return cached instance
├── If not exists:
│   ├── Check COMPOSIO_API_KEY environment variable
│   ├── If missing: Throw error
│   ├── Create new Composio instance with apiKey and MastraProvider
│   ├── Cache instance in module variable
│   └── Return new instance
```

**Note:** ⚠️ **DEPRECATED** - Blocked by version incompatibility. `@composio/mastra` requires `@mastra/core@^0.21.x` but we have `0.24.6`. Use `getComposioVercelClient()` instead until Composio updates compatibility.

---

### `getComposioVercelClient(): Composio`

**What it does:** Returns a singleton Composio client configured with VercelProvider, which formats tools in Vercel AI SDK format that Mastra Agent accepts.

**Product Impact:** This is the working solution for agent tool integration. When agents need Composio tools (Gmail, Slack, etc.), this client provides them in a format Mastra can use, enabling the hybrid capability system.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Composio | Singleton Composio client with VercelProvider, returns tools in Vercel AI SDK format |

**Process:**

```
getComposioVercelClient(): Composio
├── Check if composioVercelClient singleton exists
├── If exists: Return cached instance
├── If not exists:
│   ├── Check COMPOSIO_API_KEY environment variable
│   ├── If missing: Throw error
│   ├── Create new Composio instance with apiKey and VercelProvider
│   ├── Cache instance in module variable
│   └── Return new instance
```

**Error Handling:** Throws error if `COMPOSIO_API_KEY` environment variable is not set.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@composio/core` | Core Composio SDK |
| `@composio/mastra` | Mastra provider (deprecated, blocked) |
| `@composio/vercel` | Vercel AI SDK provider |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Connections Service | `app/api/connections/services/connections.ts` | Base client for listing connections and auth configs |
| Auth Service | `app/api/connections/connect/services/auth.ts` | Base client for OAuth and API key flows |
| Tools Service | `app/api/connections/available/toolkits/services/tools.ts` | All three clients used for different tool fetching scenarios |
| Composio Schema Cache | `app/api/connections/schemas/composio/services/composio-schema-cache.ts` | Base client for schema synchronization |

---

## Design Decisions

### Why singleton pattern?

**Decision:** All three client functions cache instances in module-level variables.

**Rationale:** Creating new Composio client instances for every API call is wasteful and can hit rate limits. The singleton pattern ensures one instance per client type, reusing connections and configuration across all requests.

### Why three separate clients?

**Decision:** Separate functions for base client, Mastra client, and Vercel client.

**Rationale:** Different use cases need different tool formats. Admin operations (base client) don't need providers, agent tool integration (Vercel client) needs Vercel AI SDK format, and future Mastra support (blocked) would need Mastra format. Keeping them separate maintains clear boundaries and makes it obvious which client to use for which purpose.

---

## Error Handling

All functions throw errors if `COMPOSIO_API_KEY` environment variable is missing. This fails fast at startup/initialization rather than allowing runtime failures.

---

## Related Docs

- [Connections Service README](./connections.README.md) - Uses base client
- [Tools Service README](../available/toolkits/services/tools.README.md) - Uses all three clients
- [Composio Documentation](https://docs.composio.dev) - SDK reference

---

## Future Improvements

- [ ] Remove `getComposioMastraClient()` once it's confirmed we won't use it or Composio updates compatibility
- [ ] Add connection pooling or rate limit handling if needed
- [ ] Add metrics/logging for client initialization

