# Phase 3: API Foundation

**Status:** 📋 Planned  
**Depends On:** Phase 2  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Create backend APIs and services for agent creation and listing. This includes the agent-creator service that generates UUIDs, creates folder structures, writes config files, and updates the index. Also includes API routes for creating and listing agents.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UUID generation | `crypto.randomUUID()` | Standard UUID v4, guaranteed unique, Node.js built-in |
| Folder naming | `{name-slug}-{uuid}` | Human-readable (name) + unique (UUID) |
| Index update strategy | Regex-based replacement | Matches existing pattern in agent-config.ts, simple and fast |
| Error handling | Atomic operations with rollback | Ensures consistency - if any step fails, cleanup occurs |
| Memory initialization | Lazy (on first use) | Matches current pattern, efficient |

### Pertinent Research

- **Mastra Agent Primitives**: Only 3 fields truly required: name, instructions (systemPrompt), model
- **Agent Storage**: Folder-based with co-located config and memory
- **UUID Format**: Standard UUID v4 (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

*Source: `_references/04-MASTRA-PRIMITIVES-RESEARCH.md`, `_references/02-Impact-Analysis.md`*

### Overall File Impact

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add `isManager?: boolean` and `subAgentIds?: string[]` to AgentConfig | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/agent-creator.ts` | Create | Service for agent file generation (UUID, folder-based) | B |
| `app/api/workforce/services/agent-creator.README.md` | Create | Service documentation | B |

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/create/route.ts` | Create | POST endpoint for creating agents | C |
| `app/api/workforce/create/README.md` | Create | API route documentation | C |
| `app/api/workforce/route.ts` | Create | GET endpoint for listing all agents | D |
| `app/api/workforce/README.md` | Create | API route documentation | D |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-3.1 | `POST /api/workforce/create` creates agent successfully | Call API with valid data, verify 200 response with agentId | C |
| AC-3.2 | Agent folder created with `{name-slug}-{uuid}` format | Verify folder exists in `_tables/agents/` | B |
| AC-3.3 | Config file created in agent folder | Verify `{folder}/config.ts` exists with correct structure | B |
| AC-3.4 | index.ts updated automatically | Verify index.ts includes new agent import/export | B |
| AC-3.5 | API validates required fields | Call API with missing name/role/systemPrompt, verify 400 error | C |
| AC-3.6 | `GET /api/workforce` returns all agents | Call API, verify response includes newly created agent | D |
| AC-3.7 | Rollback works on errors | Simulate error, verify file deleted and index reverted | B |

### User Flows (Phase Level)

#### Flow 1: Create Agent via API

```
1. POST to /api/workforce/create with agent data
2. System generates UUID v4
3. System creates folder: {name-slug}-{uuid}/
4. System writes config.ts file
5. System updates index.ts
6. Returns agentId and agent config
```

#### Flow 2: List Agents via API

```
1. GET /api/workforce
2. System reads index.ts or scans folders
3. System loads all agent configs
4. Returns array of agent configs
```

---

## Part A: Update Types

### Goal

Add new fields to AgentConfig type to support manager agents and sub-agents.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Add isManager and subAgentIds fields | ~5 |

### Pseudocode

#### `_tables/types.ts` Updates

```
Update AgentConfig type
├── Add isManager?: boolean
│   └── JSDoc: "Whether this agent is a manager that can delegate to sub-agents"
└── Add subAgentIds?: string[]
    └── JSDoc: "Array of agent IDs that this manager agent can delegate to"
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.0 | AgentConfig type includes isManager field | Verify type definition has isManager?: boolean |
| AC-3.0 | AgentConfig type includes subAgentIds field | Verify type definition has subAgentIds?: string[] |

---

## Part B: Create agent-creator Service

### Goal

Create service that handles agent file generation, folder creation, UUID generation, and index updates with proper error handling and rollback.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/services/agent-creator.ts` | Create | Core service for agent creation | ~300 |
| `app/api/workforce/services/agent-creator.README.md` | Create | Service documentation | ~150 |

### Pseudocode

#### `agent-creator.ts`

```
generateAgentId(): string
└── Return crypto.randomUUID()

slugify(name: string): string
├── Convert to lowercase
├── Replace spaces with hyphens
├── Remove special characters
└── Return slug

generateFolderName(name: string, agentId: string): string
└── Return `${slugify(name)}-${agentId}`

generateAgentFileContent(agentId, config): string
├── Build TypeScript file template
├── Escape strings properly
├── Format arrays correctly
├── Handle optional fields
└── Return file content string

createAgentFolder(name, agentId): Promise<string>
├── Generate folder name: {name-slug}-{uuid}
├── Create directory: _tables/agents/{folder-name}/
└── Return folder path

createAgentConfigFile(folderPath, agentId, config): Promise<void>
├── Generate file content
├── Write to {folderPath}/config.ts
└── Verify file created

updateAgentsIndex(folderName, agentId, camelCaseId): Promise<void>
├── Read index.ts
├── Find export const agents = [...]
├── Add import: import { {camelCaseId}Agent } from "./{folderName}/config"
├── Add to array: {camelCaseId}Agent
└── Write updated index.ts

createAgent(config): Promise<{ agentId, agent }>
├── Validate config (required fields)
├── Generate UUID agentId
├── Create folder (with rollback on failure)
├── Write config file (with rollback on failure)
├── Update index (with rollback on failure)
└── Return agentId and full agent config
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.2 | generateAgentId() returns UUID v4 format | Call function, verify format matches UUID pattern |
| AC-3.2 | generateFolderName() creates correct format | Call with "Test Agent" and UUID, verify "test-agent-{uuid}" |
| AC-3.3 | createAgentConfigFile() writes valid TypeScript | Create agent, verify config.ts is valid TypeScript |
| AC-3.4 | updateAgentsIndex() adds agent to exports | Create agent, verify index.ts includes new import/export |
| AC-3.7 | Rollback deletes file and reverts index on error | Simulate error after file creation, verify cleanup |

### User Flows

#### Flow B.1: Create Agent with Full Config

```
1. Call createAgent() with complete config
2. System generates UUID
3. System creates folder: test-agent-{uuid}/
4. System writes config.ts with all fields
5. System updates index.ts
6. Returns agentId and agent config
```

---

## Part C: Create POST /api/workforce/create Route

### Goal

Create API endpoint that accepts agent creation requests, validates input, calls agent-creator service, and returns response.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/create/route.ts` | Create | POST endpoint for creating agents | ~100 |
| `app/api/workforce/create/README.md` | Create | API route documentation | ~100 |

### Pseudocode

#### `route.ts`

```
POST(request): NextResponse
├── Authenticate user via Clerk
├── Parse request body
├── Validate with Zod schema
│   ├── Required: name, role, systemPrompt
│   ├── Optional: avatar, description, model, toolIds, etc.
│   └── Return 400 if validation fails
├── **Call `createAgent()`** from agent-creator service
├── Handle errors
│   ├── If validation error: Return 400 with details
│   ├── If file system error: Return 500 with message
│   └── If rollback occurred: Return 500 with cleanup confirmation
└── Return 200 with { success: true, agentId, agent }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.1 | POST /api/workforce/create creates agent successfully | Call API, verify 200 response with agentId |
| AC-3.5 | API validates required fields | Call with missing name, verify 400 error |
| AC-3.5 | API validates field types | Call with invalid types, verify 400 error |
| AC-3.1 | API returns correct response format | Verify response has success, agentId, agent fields |

### User Flows

#### Flow C.1: Create Agent via API (Happy Path)

```
1. POST /api/workforce/create
   Body: { name: "Test Agent", role: "Test", systemPrompt: "You are..." }
2. System validates request
3. System calls createAgent()
4. System creates folder and files
5. Returns { success: true, agentId: "uuid", agent: {...} }
```

#### Flow C.2: Create Agent with Validation Error

```
1. POST /api/workforce/create
   Body: { name: "Test" } // Missing required fields
2. System validates request
3. Validation fails
4. Returns 400 { success: false, error: "Missing required field: systemPrompt" }
```

---

## Part D: Create GET /api/workforce Route

### Goal

Create API endpoint that lists all agents for the authenticated user.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/route.ts` | Create | GET endpoint for listing agents | ~50 |
| `app/api/workforce/README.md` | Create | API route documentation | ~80 |

### Pseudocode

#### `route.ts`

```
GET(request): NextResponse
├── Authenticate user via Clerk
├── Read index.ts or scan folders
│   ├── Option A: Import from index.ts (agents array)
│   └── Option B: Scan _tables/agents/ folders, load each config.ts
├── Return array of AgentConfig objects
└── Return 200 with { agents: AgentConfig[] }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.6 | GET /api/workforce returns all agents | Call API, verify response includes all created agents |
| AC-3.6 | Response format is correct | Verify response has agents array with AgentConfig objects |

### User Flows

#### Flow D.1: List All Agents

```
1. GET /api/workforce
2. System reads index.ts or scans folders
3. System loads all agent configs
4. Returns { agents: [...] }
```

---

## Out of Scope

- **LLM-powered tools search API** → Planned for future phase
- **Agent update/delete APIs** → Can be added later
- **Bulk agent creation** → Not needed for MVP
- **Agent categories/organization** → Keep flat structure for now

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - API requirements (PR-4.1, PR-4.2)
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 3 details
- **Service Template:** `app/api/SERVICE_README_TEMPLATE.md` - Service documentation format
- **Route Template:** `app/api/ROUTE_README_TEMPLATE.md` - Route documentation format
- **Mastra Research:** `_references/04-MASTRA-PRIMITIVES-RESEARCH.md` - Agent primitives

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025

