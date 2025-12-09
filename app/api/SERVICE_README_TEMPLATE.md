# Service README Template

Use this template when creating README files for services. Services should have co-located `[service-name].README.md` files.

---

# [Service Name]

> [One-line product description: What business capability does this service provide?]

**Service:** `[service-name].ts`  
**Domain:** [Tools | Workforce | Connections | Records | Shared]

---

## Purpose

[3-4 sentences expanding on what this service accomplishes from a product perspective. Focus on the "why" and user value, not just technical implementation. Explain what user-facing capability this enables and why it exists as a separate service.]

**Product Value:** [One sentence connecting the service to a user-facing outcome or product feature.]

**Guidelines:**
- Write from a product perspective, not purely technical
- ❌ "Handles database queries and CRUD operations"
- ✅ "Enables users to store and retrieve structured data that agents and workflows can access. This creates a shared memory layer where complex agent conversations can reference past data, workflows can output results for future use, and users can inspect what their agents 'know' about their business."
- Explain what breaks or can't happen if this service doesn't exist

---

## Methods Overview

[Provides a scannable overview of all public API methods. The detailed "Public API" section below expands on each method.]

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `functionName1()` | One complete sentence describing what the function does, what it retrieves, transforms, or creates, and any key details about its purpose. | Use case/context |
| `functionName2()` | One complete sentence explaining the function's role, what data or inputs it works with, and what it produces or enables. | Use case/context |

**Guidelines:**
- Include if service has 2+ public functions
- "What It Does" should be one complete sentence (not half a sentence, not multiple sentences)
- Focus on "what" and "when" for quick scanning while providing meaningful detail
- This table provides an overview - detailed documentation follows in "Public API" section
- Remove if service only has one function or functions are self-explanatory

---

## Usage Flow

[If the service has multiple functions that are typically called in sequence, show the flow:]

```
1. Step description
2. Calls functionA() → Result
3. Calls functionB() with result → Next result
4. Final outcome
```

**Guidelines:**
- Show how functions work together
- Keep it high-level (not code)
- Skip if functions are independent

---

## Approach

[Describe HOW this service accomplishes its purpose at a technical level, but without code. Explain the strategy, what other services/domains it integrates with, and the general patterns used. This helps developers understand the implementation philosophy and architectural decisions.]

**Guidelines:**
- Be technical but avoid code snippets
- Mention key dependencies, SDKs, or patterns used
- Keep it to 2-4 sentences
- Explain why this is a service (separated from route logic)

**Example:**
> This service acts as an orchestrator that combines data from multiple sources (agent registry, tools domain, connections domain) into a unified agent runtime. It follows a clear separation of concerns where configuration loading, tool aggregation, message normalization, and agent instantiation are distinct operations. The service is stateless - each function call produces results based on inputs, making it easy to test and reason about.

---

## Public API

[Document each exported function/class. For each function, follow this structure:]

### `functionName(param1: Type, param2?: Type): ReturnType`

**What it does:** [1-2 sentences describing what this function accomplishes from a product/user perspective.]

**Product Impact:** [1 sentence explaining how this function enables a user-facing capability or solves a user problem.]

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1` | Type | Yes/No | What this parameter represents, any default values, options, or constraints |
| `param2` | Type | Yes/No | What this parameter represents |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | ReturnType | What is returned and when/why you'd use it |

**Process:**

[For multi-step functions, use pseudocode format. Skip if function is straightforward.]

```
functionName(params): ReturnType
├── Step 1 description
├── **Call `otherFunction()`** or **Check condition**
├── Step 3 description
└── Return result
```

**Guidelines:**
- Use `├──` for steps, `└──` for final step
- Use `**Call \`functionName()\`**` for service/function calls
- Use `**Check condition**` or `**If condition**` for conditional logic
- Keep it high-level (5-10 steps max)
- Only include if function has multiple logical steps
- Remove if function is simple (single operation, straightforward logic)

**Error Handling:** [If applicable, describe how this function handles errors. Skip if standard/obvious.]

---

## Dependencies

[Table of what this service depends on]

| Dependency | Purpose |
|------------|---------|
| `@/path/to/other-service` | What it's used for |
| `external-package` | What it provides |

**Guidelines:**
- List services, domains, or external packages
- Explain why each dependency exists
- Helps understand impact of changes elsewhere

---

## Consumers

[List where this service is used]

| Consumer | Location | Usage |
|----------|----------|-------|
| Route | `app/api/.../route.ts` | How it's used |
| Other Service | `app/api/.../service.ts` | What it depends on |

**Guidelines:**
- List routes, other services, or tests
- Helps understand impact of changes to this service
- Acknowledge this may become outdated - that's okay

---

## Design Decisions

[Document important architectural or product decisions made in this service]

### Why [decision]?

**Decision:** [What was decided]

**Rationale:** [Why this decision was made, what trade-offs were considered, what it enables or prevents]

**Guidelines:**
- Document non-obvious choices
- Explain product implications of technical decisions
- Helps future developers understand constraints and opportunities

---

## Error Handling

[Describe how errors are handled in this service]

**Philosophy:** [Graceful degradation? Fail fast? Log and continue?]

**Behavior:**
- [How specific error scenarios are handled]

**Guidelines:**
- Document error handling philosophy
- Explain any special error handling patterns
- Skip if standard/obvious

---

## Related Docs

[Links to related documentation]

- [Related Route README](../route/README.md) - How the service is consumed
- [Domain Principles](../../DOMAIN_PRINCIPLES.md) - Architectural context
- [External Documentation](https://...) - SDK or framework docs

**Guidelines:**
- Link to routes that use this service
- Link to related services
- Link to external documentation if relevant

---

## Notes

[Implementation details, gotchas, or important context. Remove if not needed.]

**Guidelines:**
- Document known limitations
- Explain non-obvious implementation details
- Note any assumptions or constraints
- Remove this section if nothing noteworthy

---

## Future Improvements

[Ideas and TODOs for this service]

- [ ] Improvement idea 1
- [ ] Improvement idea 2

**Guidelines:**
- Use checkbox format `- [ ]`
- Keep it realistic
- Okay if this becomes outdated
- Focus on product-facing improvements where possible

---

## File Location

Service READMEs should be co-located with their service file:

```
app/api/
├── [domain]/
│   ├── services/
│   │   ├── chat-service.ts
│   │   └── chat-service.README.md    ← co-located, named after service
│   └── [route]/
│       ├── services/
│       │   ├── custom-service.ts
│       │   └── custom-service.README.md    ← co-located, named after service
```

If a service file is standalone (not in a services/ folder), place the README next to it:

```
app/api/
├── [domain]/
│   ├── important-service.ts
│   └── important-service.README.md    ← co-located, named after service
```

**Naming Convention:** Use `[service-name].README.md` format to make the README easily identifiable when viewing files.
