# Workforce API (`/api/workforce`)

The Workforce API is the root for interacting with all agents in the system.

## Endpoints

### `/api/workforce/[agentId]`
All capabilities are scoped to a specific agent ID (e.g., `pm`, `marketing`).

-   **Chat:** `/api/workforce/[agentId]/chat` (POST)
-   **Tools:** `/api/workforce/[agentId]/tools` (POST)

## Namespace
The `workforce` domain represents the collection of all available agents.

