# Workflow Versioning & Auto-Update

**Status:** Draft
**Priority:** P2
**North Star:** User updates "Analyze Job Posting" workflow, all 5 parent workflows using it either auto-update (non-breaking) or prompt for migration (breaking).

---

## Problem Statement

Workflows evolve over time. When a workflow changes:
1. Parent workflows using it may break
2. Historical executions reference old versions
3. No way to compare versions
4. No rollback capability

**The Gap:** No version management for workflows, especially nested ones.

---

## User Value

- **Safe updates** — Changes don't break parent workflows unexpectedly
- **Traceability** — Know which version of workflow was used in past runs
- **Rollback** — Revert to previous version if something breaks
- **Migration path** — Clear guidance when breaking changes occur
- **Confidence** — Experiment knowing you can go back

---

## User Flows

### Flow 1: Non-Breaking Change

```
1. User has "Process Invoice" workflow used in 3 places
2. User opens "Process Invoice" and adds logging step
3. Change is non-breaking (same input/output schemas)
4. User saves
5. System detects:
   - Input schema: unchanged
   - Output schema: unchanged
   - Classification: non-breaking
6. System automatically updates all usages
7. User notified: "Updated 3 workflows using Process Invoice"
8. No action required from parent workflow owners
```

### Flow 2: Breaking Change with Migration

```
1. User has "Extract Requirements" used in 5 places
2. User adds required input field "language"
3. Change is breaking (input schema changed)
4. User saves
5. System detects breaking change
6. Modal shows:
   - "This change requires updates to 5 workflows"
   - Option A: Create new version (v2), keep v1 for existing
   - Option B: Update all and add migration
7. User chooses Option B
8. System generates migration:
   - For each parent, add default for "language": "en"
9. User reviews migration
10. User applies migration
11. All parent workflows updated with default
```

### Flow 3: View Version History

```
1. User opens workflow
2. User clicks "History" or "Versions"
3. Version list shows:
   - v3 (current) - 2 days ago - "Added error handling"
   - v2 - 1 week ago - "Changed output format" (breaking)
   - v1 - 1 month ago - "Initial version"
4. User clicks on v2
5. Diff view shows changes between v1 and v2
6. User can:
   - View full workflow at that version
   - Restore v2 as current
   - Compare any two versions
```

### Flow 4: Rollback

```
1. User deployed workflow update
2. Something is broken in production
3. User opens workflow → Versions
4. User selects previous stable version
5. User clicks "Restore this version"
6. Confirmation: "This will restore v2 and update all usages"
7. User confirms
8. Workflow rolled back
9. Parent workflows updated to use restored version
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `_tables/workflows/` | Workflow storage | Version storage |
| `app/api/workflows/` | Workflow APIs | CRUD operations |
| `10-Workflows-as-Callable-Nodes.md` | Nested workflows | Dependency tracking |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version storage | Immutable versions in separate files | Clean history, easy comparison |
| Breaking detection | Schema comparison | Automated, consistent |
| Auto-update scope | Non-breaking only | Safety first |
| Migration approach | User-reviewed | Control over changes |

---

## Architecture

### Version Model

```typescript
interface WorkflowVersion {
  id: string;                    // UUID
  workflowId: string;            // Parent workflow ID
  version: number;               // Sequential: 1, 2, 3...
  definition: WorkflowDefinition; // Full workflow at this version
  inputSchemaHash: string;       // For breaking change detection
  outputSchemaHash: string;
  createdAt: Date;
  createdBy: string;
  changeLog?: string;            // User-provided description
  changeType: 'initial' | 'non-breaking' | 'breaking';
}

interface WorkflowVersionReference {
  workflowId: string;
  version: number | 'latest';    // 'latest' auto-updates
}
```

### Storage Structure

```
_tables/workflows/{workflowId}/
├── workflow.json           # Current version definition
├── workflow.ts             # Current compiled code
├── versions/
│   ├── v1.json            # Version 1 snapshot
│   ├── v2.json            # Version 2 snapshot
│   └── v3.json            # Version 3 snapshot
└── metadata.json          # Version history, dependencies
```

### Breaking Change Detection

```typescript
interface ChangeAnalysis {
  isBreaking: boolean;
  breakingReasons: BreakingReason[];
  affectedWorkflows: string[];
  suggestedMigrations: Migration[];
}

type BreakingReason =
  | { type: 'input_field_added_required'; field: string }
  | { type: 'input_field_removed'; field: string }
  | { type: 'input_type_changed'; field: string; from: string; to: string }
  | { type: 'output_field_removed'; field: string }
  | { type: 'output_type_changed'; field: string; from: string; to: string };

interface Migration {
  targetWorkflowId: string;
  changes: MigrationChange[];
}

interface MigrationChange {
  type: 'add_default' | 'update_binding' | 'remove_binding';
  field: string;
  value?: any;
  binding?: BindingDefinition;
}
```

### Change Classification

| Change Type | Input Schema | Output Schema | Classification |
|-------------|-------------|---------------|----------------|
| Add optional input | New optional field | Unchanged | Non-breaking |
| Add required input | New required field | Unchanged | **Breaking** |
| Remove input | Field removed | Unchanged | Non-breaking |
| Change input type | Type changed | Unchanged | **Breaking** |
| Add output | Unchanged | New field | Non-breaking |
| Remove output | Unchanged | Field removed | **Breaking** |
| Change output type | Unchanged | Type changed | **Breaking** |

---

## Constraints

- **Storage space** — Versions accumulate; need cleanup policy
- **Migration complexity** — Some changes can't be auto-migrated
- **Execution consistency** — Running workflows use version at start
- **Circular updates** — A updates B which triggers update to A

---

## Success Criteria

- [ ] Save creates new version automatically
- [ ] Non-breaking changes auto-update dependents
- [ ] Breaking changes prompt for action
- [ ] Version history viewable
- [ ] Diff between versions works
- [ ] Rollback restores previous version
- [ ] Migrations can be previewed and applied
- [ ] Execution records reference specific version

---

## Out of Scope

- Branching/merging (git-style)
- Collaborative versioning (conflicts)
- Scheduled version deployments
- Version approval workflows
- Automatic rollback on failure

---

## Open Questions

- How many versions should we keep?
- Should we support "pinning" to specific version vs "latest"?
- How do we handle migrations that require user input?
- Should breaking changes require explicit publish action?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Version History | List of versions | Version list, timestamps |
| Version Diff | Compare versions | Side-by-side changes |
| Breaking Change Modal | Migration prompt | Options, affected workflows |
| Migration Preview | Review changes | Changes per workflow |
| Rollback Confirmation | Restore version | Warning, impacts |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── versioning/
│   ├── version-history.html
│   ├── version-diff.html
│   ├── breaking-change-modal.html
│   ├── migration-preview.html
│   └── rollback-confirmation.html
```

---

## References

- Semantic versioning: https://semver.org/
- Schema evolution: https://docs.confluent.io/platform/current/schema-registry/avro.html#schema-evolution
- Nested workflows: `10-Workflows-as-Callable-Nodes.md`
