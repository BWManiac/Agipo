# Workflows Table

| Column | Type | Description | Notes |
| --- | --- | --- | --- |
| id | string | Unique identifier for the workflow. | Human-readable slug preferred; used in URLs and API routes. |
| name | string | Display name shown in UI and listings. | Keep concise and descriptive. |
| description | string | Summary of the workflow's purpose or functionality. | Optional; surfaced in tooltips and cards. |
| nodes | Node[] | Array of workflow nodes (React Flow node definitions). | Represents the workflow graph structure. |
| edges | Edge[] | Array of workflow edges (React Flow edge definitions). | Defines connections between nodes. |
| lastModified | string | ISO timestamp of last modification. | Auto-generated on save; used for sorting and display. |
| apiKeys | Record<string, string> | API keys required for workflow execution. | Optional; encrypted in production. |

## Purpose
- Provide a normalized place to store user-created workflows.
- Keep the schema compact enough for JSON storage while capturing execution intent.
- Enable workflow-to-tool transpilation (future: workflows can be promoted to agent tools).

## Rationale & Notes
- `nodes` and `edges` use React Flow types (`@xyflow/react`) to maintain compatibility with the workflow editor.
- `apiKeys` stores sensitive credentials needed for workflow execution; should be encrypted in production.
- `lastModified` is automatically set by the repository on save operations.
- Workflows are stored as JSON files in `_tables/workflows/` directory, following the pseudo-database pattern.

## Registry Pattern
Workflows follow the same registry pattern as agents and tools:
- `_tables/workflows/index.ts` exports `getWorkflows()`, `getWorkflowById(id)`, and `saveWorkflow(id, data)`
- Individual workflow files are stored as `{id}.json` in `_tables/workflows/`
- Types are centralized in `_tables/types.ts` (`WorkflowData`, `WorkflowSummary`)

## Open Questions / Next Iterations
- Should we add versioning support (e.g., `version` field) to enable rollback?
- Do we need workflow metadata (tags, categories, owner) for marketplace features?
- How will we handle workflow-to-tool transpilation (colocate `.tool.ts` files with `.json`)?
- Should we add validation schemas for node/edge structures?
- Do we need workflow templates or examples?

## Example Record
```json
{
  "id": "yc-2",
  "name": "YC Application Scoring",
  "description": "Evaluates YC applications based on multiple criteria",
  "nodes": [...],
  "edges": [...],
  "lastModified": "2024-01-15T10:30:00.000Z",
  "apiKeys": {
    "openai": "sk-..."
  }
}
```

