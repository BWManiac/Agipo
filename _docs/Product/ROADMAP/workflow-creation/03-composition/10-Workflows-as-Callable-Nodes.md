# Workflows as Callable Nodes

**Status:** Draft
**Priority:** P0
**North Star:** User has "Analyze Job Posting" workflow. When building "Job Application" workflow, user drags "Analyze Job Posting" as a step, reusing it without duplication.

---

## Problem Statement

Users build powerful workflows but can't compose them. Currently:
1. Workflows are standalone—they can't call other workflows
2. Common patterns must be duplicated across workflows
3. No way to build a library of reusable workflow components
4. Changes to shared logic require updating multiple workflows

**The Gap:** Workflows can't be used as building blocks within other workflows.

---

## User Value

- **Reusability** — Build once, use everywhere
- **Modularity** — Complex workflows from simple components
- **Maintainability** — Update one workflow, all uses updated
- **Abstraction** — Hide complexity behind clear interfaces
- **Organization** — Group related logic into focused workflows

---

## User Flows

### Flow 1: Use Existing Workflow as Node

```
1. User opens workflow editor for "Job Application Pipeline"
2. User opens toolkit sidebar
3. User sees "My Workflows" section
4. User sees "Analyze Job Posting" workflow (created earlier)
5. User drags "Analyze Job Posting" onto canvas
6. Node appears showing:
   - Workflow name
   - Input schema (job URL)
   - Output schema (requirements, qualifications)
7. User connects previous step's output to workflow input
8. User connects workflow output to next step
9. At runtime, nested workflow executes inline
```

### Flow 2: Create Reusable Workflow from Selection

```
1. User has workflow with 5 steps
2. Steps 2-4 are "Analyze and Score Match"
3. User selects steps 2-4
4. User right-clicks → "Extract as Workflow"
5. Dialog appears:
   - Name: "Analyze and Score Match"
   - Input: Derived from step 2's inputs
   - Output: Derived from step 4's outputs
6. User confirms
7. New workflow created and saved
8. Original steps replaced with workflow node
9. Workflow now available in toolkit
```

### Flow 3: Browse Workflow Library

```
1. User opens toolkit sidebar
2. User sees sections:
   - Integrations (Composio tools)
   - Control Flow
   - My Workflows
   - Shared Workflows (organization)
3. User clicks "My Workflows"
4. User sees list of created workflows
5. Each shows: name, input/output preview, usage count
6. User can search and filter
7. User clicks workflow → sees full preview
8. User drags to use
```

### Flow 4: Update Shared Workflow

```
1. User has "Email Notification" workflow used in 5 places
2. User opens "Email Notification" for editing
3. System warns: "This workflow is used in 5 other workflows"
4. User makes changes (adds CC field)
5. User saves
6. System offers:
   - "Update all usages" (add CC as optional input)
   - "Create new version" (keep old version for existing)
7. User chooses "Update all"
8. All 5 parent workflows updated to use new schema
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `_tables/workflows/` | Workflow storage | `registry.ts`, workflow folders |
| `app/api/workflows/services/` | Workflow services | `step-generator.ts` |
| `app/(pages)/workflows/editor/` | Editor UI | Toolkit, canvas |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage model | `_tables/workflows/` pattern | Consistency with existing |
| Execution model | Inline execution (not subprocess) | Simplicity, shared context |
| Versioning | Optional, soft versions | Balance flexibility/stability |
| Visibility | User's own + organization shared | Progressive access |

---

## Architecture

### Workflow as Step

When a workflow is used as a node in another workflow, it becomes a "workflow step":

```typescript
interface WorkflowStep {
  id: string;
  type: 'workflow';
  workflowId: string;           // Reference to nested workflow
  inputBindings: BindingMap;    // How inputs are provided
  position: { x: number; y: number };
}

// In transpiled code:
const nestedWorkflow = createStep({
  id: 'nested-wf-step-id',
  inputSchema: nestedWorkflowInputSchema,
  outputSchema: nestedWorkflowOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    // Execute the nested workflow
    const result = await executeWorkflow(
      'nested-workflow-id',
      inputData,
      runtimeContext
    );
    return result;
  }
});
```

### Workflow Registry Extension

```typescript
// In registry.ts
interface WorkflowRegistryEntry {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  createdBy: string;
  visibility: 'private' | 'shared' | 'public';
  usedBy: string[];            // IDs of workflows using this
  version?: string;
  tags?: string[];
}

// Query for available workflows
async function getCallableWorkflows(
  userId: string,
  orgId?: string
): Promise<WorkflowRegistryEntry[]> {
  // Return user's workflows + shared workflows
}
```

### Dependency Tracking

```typescript
interface WorkflowDependencies {
  workflowId: string;
  dependsOn: string[];         // Workflows this one calls
  usedBy: string[];            // Workflows that call this one
}

// When saving a workflow, update dependencies
async function updateDependencies(workflow: WorkflowDefinition) {
  const calledWorkflows = workflow.steps
    .filter(s => s.type === 'workflow')
    .map(s => s.workflowId);

  // Update dependency graph
  // Used for:
  // - Warning when editing used workflows
  // - Preventing circular dependencies
  // - Impact analysis
}
```

### Circular Dependency Prevention

```typescript
function detectCircularDependency(
  workflowId: string,
  targetWorkflowId: string
): boolean {
  // BFS/DFS through dependency graph
  const visited = new Set<string>();
  const queue = [targetWorkflowId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === workflowId) return true;  // Circular!
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = getDependencies(current);
    queue.push(...deps.dependsOn);
  }

  return false;  // No cycle
}
```

---

## Constraints

- **No circular dependencies** — A can't call B if B calls A
- **Schema compatibility** — Parent workflow must provide compatible inputs
- **Single execution context** — Nested workflow shares runtimeContext
- **Depth limit** — Max 5 levels of nesting (prevent stack overflow)
- **Version consistency** — Breaking changes need explicit handling

---

## Success Criteria

- [ ] Workflows appear in toolkit under "My Workflows"
- [ ] User can drag workflow onto canvas as a node
- [ ] Workflow node shows input/output schemas
- [ ] Workflow node can be connected like any other node
- [ ] Nested workflow executes correctly at runtime
- [ ] "Extract as Workflow" creates reusable component
- [ ] Usage tracking shows where workflows are used
- [ ] Circular dependencies are prevented
- [ ] Editing used workflow shows warning

---

## Out of Scope

- Workflow marketplace (public sharing)
- Workflow versioning with rollback
- Dynamic workflow selection at runtime
- Workflow parameters (beyond input schema)
- Cross-organization workflow sharing

---

## Open Questions

- How do we handle breaking changes to nested workflow schemas?
- Should nested workflow execution be synchronous or async?
- How do we handle errors in nested workflows?
- Can users see nested workflow execution details?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| My Workflows Panel | Toolkit section | List, search, preview |
| Workflow Node | Node on canvas | Name, I/O preview, expand |
| Extract Dialog | Create from selection | Name, schemas, confirm |
| Usage Warning | Edit shared workflow | Usage count, options |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── workflows-as-nodes/
│   ├── my-workflows-panel.html
│   ├── workflow-node.html
│   ├── extract-dialog.html
│   └── usage-warning.html
```

---

## References

- Workflow storage: `_tables/workflows/`
- Registry pattern: `registry.ts`
- Mastra nested workflows: https://mastra.ai/docs/workflows/nested-workflows
