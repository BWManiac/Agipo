# Workforce API (`/api/workforce`)

The Workforce API is the root for interacting with all agents in the system.

## Endpoints

### `GET /api/workforce`
Returns all agents in the system.

See [route.README.md](./route.README.md) for details.

---

### `POST /api/workforce/create`
Creates a new agent with folder-based storage structure.

See [create/README.md](./create/README.md) for details.

---

### `/api/workforce/[agentId]`
All capabilities are scoped to a specific agent ID (UUID format).

-   **Chat:** `/api/workforce/[agentId]/chat` (POST)
-   **Tools:** `/api/workforce/[agentId]/tools` (POST)

## Namespace
The `workforce` domain represents the collection of all available agents.

## Agent Storage

Agents are stored in folders with the format: `{name-slug}-{uuid}/`

- Config file: `{folder}/config.ts`
- Memory DB: `{folder}/memory.db`
- Index: `_tables/agents/index.ts` (auto-updated on creation)

