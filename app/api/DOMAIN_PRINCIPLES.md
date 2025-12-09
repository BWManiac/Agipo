# API Domain Principles

> **Core Philosophy:** The API structure should be immediately understandable by looking at the domain model. Routes should reflect user mental models and business capabilities, not technical implementation details. A developer should be able to navigate the API intuitively without reading code or extensive documentation.

---

## 1. Semantic Architecture

**Principle:** The folder structure and route organization should communicate meaning through their structure alone.

**Goal:** A developer should understand:
- What resource this is (from the path)
- What operation this is (from HTTP method + path structure)
- Where related resources are (from nesting)
- What's available (from consistent patterns)

**The "5-Second Rule":** If you understand the domain model, you should be able to find the right route in 5 seconds.

**Domain-Driven Design Foundation:** Routes are organized by business capabilities and user mental models, not by database tables or technical layers. Each domain represents a distinct business capability that users understand and interact with.

---

## 2. Resource Hierarchy = Domain Model

**Principle:** The folder structure should mirror the mental model of the domain.

**Example:**
```
/workflows/           ← Collection of workflows
  /[workflowId]/      ← A specific workflow
    /steps/           ← Steps belong to a workflow
      /[stepId]/      ← A specific step
```

**Rule:** If `B` belongs to or is owned by `A`, then `B` should be nested under `A`.

**Violation Example:**
```
/workflows/
  /composio-schemas/  ← Schemas don't belong to workflows
```

**Resolution:** Schemas are integration metadata, so they belong in the connections domain: `/connections/schemas/composio/`. If resources are shared across domains, they should be placed in the domain that owns them conceptually, not nested under consumers.

---

## 3. Collection vs Instance Operations

**Principle:** Operations on collections vs instances should be clearly separated by path structure.

**Collection Operations (no ID):**
- `GET /workflows` → List all workflows
- `POST /workflows` → Create new workflow

**Instance Operations (with ID):**
- `GET /workflows/[id]` → Get specific workflow
- `PUT /workflows/[id]` → Update specific workflow
- `DELETE /workflows/[id]` → Delete specific workflow

**Rule:** Create operations should be at the collection level, not under an instance ID.

**Violation:**
```
POST /workflows/[workflowId]/create  ← Create is an instance path?
```

This breaks the pattern: create should be `POST /workflows` (collection level).

---

## 4. HTTP Methods = Standard Operations

**Principle:** Use HTTP methods for standard CRUD operations. Path verbs should be reserved for special actions.

**Standard Pattern:**
- `GET /resource` → List collection
- `POST /resource` → Create new resource
- `GET /resource/[id]` → Read specific resource
- `PUT /resource/[id]` → Update specific resource
- `DELETE /resource/[id]` → Delete specific resource

**When to Use Path Verbs:**
- Non-CRUD actions: `/workflows/[id]/execute`
- Domain-specific operations: `/connections/connect` (OAuth flow)
- Administrative actions: `/schemas/sync`

**Rule:** If it's standard CRUD, use HTTP methods. If it's a special operation, use a path verb.

**Repository Pattern Consideration:** For domains with complex CRUD operations, consider grouping standard CRUD routes in a `repository` subfolder if it improves organization and reduces route file complexity. This is optional and should only be used when it genuinely improves clarity.

---

## 5. Nested Resources = Ownership

**Principle:** Nesting implies ownership or containment.

**Good Nesting:**
```
/workforce/
  /[agentId]/
    /tools/        ← Tools belong to this agent
    /workflows/    ← Workflows assigned to this agent
    /threads/      ← Conversation threads for this agent
```

**Rule:** If `B` is owned by or belongs to `A`, nest `B` under `A`.

---

## 6. Consistent Naming Conventions

**Principle:** Use consistent naming patterns across domains.

**Resource ID Pattern:**
- Tools: `[toolId]`
- Workflows: `[workflowId]`
- Records: `[recordId]` (or `[tableId]` if tables are the resource)
- Workforce: `[agentId]` (agents are the primary resource, workforce is the collection)

**Rule:** Use `[resourceId]` pattern consistently. The resource name should be clear from context.

**Note:** For workforce, `[agentId]` makes sense because agents are the primary resource. The workforce domain may expand to include other agent-related resources (managers, teams, etc.) in the future.

---

## 7. Domain-Driven Design & Product Thinking

**Principle:** Organize routes by domain boundaries and user mental models, not technical concerns.

**Approach:**
- Each domain (`/workflows`, `/tools`, `/connections`, `/records`, `/workforce`) represents a distinct business capability
- Routes within a domain should reflect how users think about and interact with that capability
- Product outcomes drive structure: "What does the user need to do?" not "What does the database look like?"
- Cross-domain concerns should be handled explicitly, not hidden in nested paths

**Rule:** If it's not clearly part of the domain's mental model or user workflow, it shouldn't be nested there.

**Product-First Thinking:** Routes should answer user questions like "How do I create a workflow?" or "How do I assign tools to an agent?" The structure should make these user intents obvious.

---

## 8. Query Parameters vs Path Segments

**Principle:** Prefer query parameters for filtering and options. Use path segments for distinct resource concepts or when a filter route would be too simple.

**Default Approach:**
- Use query parameters: `GET /workflows?published=true&status=active`
- Use query parameters for pagination: `GET /workflows?page=1&limit=20`
- Use query parameters for search: `GET /workflows?q=email`

**When to Use Path Segments:**
- When the filter represents a distinct, meaningful concept users think about separately
- When a query-parameter-based route would be too simple (10-30 lines of trivial logic)
- When the filtered subset is a first-class concept in the domain model

**Example:**
- `GET /workflows/available` → If "available workflows" is a distinct concept users think about
- `GET /workflows?status=available` → If it's just a filter among many

**Rule:** Prefer queries, but use paths when the filter is conceptually important or prevents unnecessary route file proliferation.

---

## 9. Builder vs Runtime Distinction

**Principle:** Recognize that there are two distinct phases: building capabilities and executing them, but no explicit structural separation is required.

**Builder Phase:**
- Creating/editing workflows and tools
- Configuring schemas and connections
- Designing capabilities

**Runtime Phase:**
- Executing workflows with agents
- Chatting with agents
- Running tools in context

**Rule:** The distinction exists conceptually but doesn't require separate route structures. The same resources (workflows, tools) exist in both phases with different operations (create/edit vs execute). The operation type (create vs execute) naturally implies the phase.

---

## 10. Service Organization & Co-location

**Principle:** Services should be co-located with their primary consumers. Ownership and usage should be immediately clear from the folder structure.

**Rule 1: Co-locate with Single Consumer**
- If a service is used by exactly one route → Place it under that route's `services/` folder
- Example: `/workforce/[agentId]/chat/services/chat-service.ts` (only used by chat route)

**Rule 2: Move Up One Level for Shared Services**
- If a service is shared by 2+ routes within the same domain → Move to domain-level `services/` folder
- Example: `/workflows/services/storage/` (shared by create, [workflowId], list, available routes)

**Rule 3: Cross-Domain Services**
- If a service is shared across multiple domains → Keep at domain level with clear documentation
- Example: `/workflows/services/workflow-loader.ts` (used by workforce and tools domains for runtime execution)

**Rule 4: Unused Services**
- If a service has no consumers → Delete it or document why it exists

**Benefits:**
- Clear ownership: Services live with their primary consumer
- Discoverability: Easy to find what a route uses
- Maintainability: Changes to a route's services are localized
- Consistency: Matches the workforce domain pattern

**Example Structure:**
```
/workflows/
  /[workflowId]/
    /route.ts
    /services/              ← Co-located (single consumer)
      - transpiler/
      - input-schema-generator.ts
      - storage/
        - code-writer.ts
  /services/                ← Domain-level (shared)
    - storage/              ← Shared by multiple routes
    - workflow-loader.ts    ← Cross-domain usage
```

---

## 11. Edge Cases & Decisions

### Composio Schemas Placement

**Decision:** Move `/workflows/composio-schemas/` to `/connections/schemas/composio/`

**Rationale:**
- Schemas are integration metadata about Composio tools
- Connections domain already owns Composio integration logic
- Workflows reference connections, so the relationship is clear
- Avoids creating a new domain for a single concern
- Keeps schemas close to the integration they describe

**Implementation:** Schemas are used during workflow building, but they're metadata about connections, not workflow resources. The workflow builder will reference connection schemas when needed.

---

## Implementation Guidelines

### Standard CRUD Route Structure

For standard CRUD operations, use HTTP methods at the appropriate level:

```
/resource/              → GET (list), POST (create)
/resource/[id]/        → GET (read), PUT (update), DELETE (delete)
```

### Special Operations

For non-CRUD operations, use path verbs:

```
/resource/[id]/execute  → POST (action on instance)
/resource/action        → POST (action on collection)
```

### Repository Pattern (Optional)

For domains with complex CRUD logic, consider grouping in a `repository` subfolder:

```
/resource/
  /repository/
    /[id]/
      route.ts         → GET, PUT, DELETE
  /create/
    route.ts           → POST
  /list/
    route.ts           → GET
```

**Use this pattern only when:**
- CRUD operations are complex enough to benefit from separation
- It genuinely improves code organization
- It doesn't obscure the domain model

---

## Next Steps

1. Apply principles to current route structure
2. Reorganize services to follow co-location principles
3. Create migration plan for restructuring
4. Document domain-specific patterns as they emerge

