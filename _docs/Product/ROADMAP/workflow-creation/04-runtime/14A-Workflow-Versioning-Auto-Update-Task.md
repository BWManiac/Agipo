# Task: Workflow Versioning & Auto-Update

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/04-runtime/14-Workflow-Versioning-Auto-Update.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Implement a versioning system for workflows that creates immutable version snapshots on save, detects breaking vs non-breaking changes, auto-updates dependent workflows for non-breaking changes, and provides migration tools for breaking changes.

### Relevant Research

The workflow system stores workflows in `_tables/workflows/{id}/`. Currently there's no versioning—saves overwrite the previous state. Adding versioning requires:
1. Version snapshot storage
2. Schema hash comparison
3. Dependency graph updates
4. Migration generation

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/versioning.ts` | Create | Version types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[id]/versions/route.ts` | Create | List versions | A |
| `app/api/workflows/[id]/versions/[version]/route.ts` | Create | Get version | A |
| `app/api/workflows/[id]/restore/route.ts` | Create | Restore version | A |
| `app/api/workflows/[id]/migrate/route.ts` | Create | Apply migration | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/version-manager.ts` | Create | Version operations | A |
| `app/api/workflows/services/change-detector.ts` | Create | Breaking detection | A |
| `app/api/workflows/services/migration-generator.ts` | Create | Migration logic | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/VersionHistory.tsx` | Create | History panel | B |
| `app/(pages)/workflows/editor/components/VersionDiff.tsx` | Create | Diff view | B |
| `app/(pages)/workflows/editor/components/BreakingChangeModal.tsx` | Create | Breaking change dialog | B |
| `app/(pages)/workflows/editor/components/MigrationPreview.tsx` | Create | Migration review | B |

---

## Part A: Backend Versioning System

### Goal

Build services for version creation, change detection, and migration generation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/versioning.ts` | Create | Types | ~100 |
| `app/api/workflows/[id]/versions/route.ts` | Create | List API | ~60 |
| `app/api/workflows/[id]/restore/route.ts` | Create | Restore API | ~80 |
| `app/api/workflows/services/version-manager.ts` | Create | Version logic | ~250 |
| `app/api/workflows/services/change-detector.ts` | Create | Detection | ~200 |
| `app/api/workflows/services/migration-generator.ts` | Create | Migrations | ~200 |

### Pseudocode

#### `app/api/workflows/types/versioning.ts`

```typescript
interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  inputSchemaHash: string;
  outputSchemaHash: string;
  createdAt: Date;
  createdBy: string;
  changeLog?: string;
  changeType: ChangeType;
  previousVersion?: number;
}

type ChangeType = 'initial' | 'non-breaking' | 'breaking';

interface VersionMetadata {
  workflowId: string;
  currentVersion: number;
  versions: VersionSummary[];
  dependents: string[];       // Workflows using this one
}

interface VersionSummary {
  version: number;
  createdAt: Date;
  changeType: ChangeType;
  changeLog?: string;
}

interface ChangeAnalysis {
  isBreaking: boolean;
  changeType: ChangeType;
  reasons: BreakingReason[];
  affectedWorkflows: AffectedWorkflow[];
  canAutoMigrate: boolean;
}

interface AffectedWorkflow {
  workflowId: string;
  workflowName: string;
  usageLocation: string;      // Step ID using this workflow
  migrationRequired: boolean;
  suggestedMigration?: Migration;
}

interface Migration {
  targetWorkflowId: string;
  steps: MigrationStep[];
}

interface MigrationStep {
  type: 'add_default' | 'update_binding' | 'add_mapping';
  stepId?: string;
  field: string;
  value?: any;
  description: string;
}
```

#### `app/api/workflows/services/version-manager.ts`

```
class VersionManager {
  async createVersion(
    workflowId: string,
    definition: WorkflowDefinition,
    changeLog?: string
  ): Promise<WorkflowVersion>
  ├── Load current version metadata
  ├── Get current version number (or 0 if new)
  ├── Analyze changes vs previous version
  │   └── Use change-detector service
  ├── Create version record
  │   ├── Increment version number
  │   ├── Hash input/output schemas
  │   ├── Set changeType from analysis
  │   └── Store definition snapshot
  ├── Write version file
  │   └── _tables/workflows/{id}/versions/v{n}.json
  ├── Update metadata
  │   └── _tables/workflows/{id}/metadata.json
  ├── If non-breaking
  │   └── Auto-update dependent workflows
  └── Return version record

  async listVersions(workflowId: string): Promise<VersionSummary[]>
  ├── Load metadata
  └── Return versions list

  async getVersion(workflowId: string, version: number): Promise<WorkflowVersion>
  ├── Load version file
  └── Return version

  async restore(workflowId: string, version: number): Promise<WorkflowVersion>
  ├── Load target version
  ├── Create new version with restored definition
  │   └── changeLog: "Restored from v{version}"
  ├── Update current workflow.json
  ├── Recompile workflow
  └── Return new version

  async diffVersions(
    workflowId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiff>
  ├── Load both versions
  ├── Compare definitions
  │   ├── Steps added/removed/modified
  │   ├── Schema changes
  │   └── Binding changes
  └── Return structured diff

  private async autoUpdateDependents(workflowId: string): Promise<void>
  ├── Get dependent workflows
  ├── For each dependent
  │   └── Update workflow step reference (no changes needed)
  └── Log updates
}
```

#### `app/api/workflows/services/change-detector.ts`

```
class ChangeDetector {
  analyzeChanges(
    previous: WorkflowDefinition | null,
    current: WorkflowDefinition
  ): ChangeAnalysis
  ├── If no previous (new workflow)
  │   └── Return { isBreaking: false, changeType: 'initial' }
  ├── Compare input schemas
  │   ├── Find added fields
  │   │   ├── If required → breaking
  │   │   └── If optional → non-breaking
  │   ├── Find removed fields → non-breaking
  │   ├── Find type changes → breaking
  │   └── Collect reasons
  ├── Compare output schemas
  │   ├── Find removed fields → breaking
  │   ├── Find type changes → breaking
  │   └── Find added fields → non-breaking
  ├── Get affected workflows
  │   └── Use dependency tracker
  ├── Determine if auto-migrate possible
  │   └── Breaking reasons are all migratable
  └── Return analysis

  private compareSchemas(
    previous: JSONSchema,
    current: JSONSchema
  ): SchemaComparison
  ├── Flatten both schemas to field lists
  ├── Find additions, removals, changes
  └── Return comparison result

  private isBreakingReason(reason: BreakingReason): boolean
  ├── input_field_added_required → true
  ├── input_type_changed → true
  ├── output_field_removed → true
  ├── output_type_changed → true
  └── Others → false

  private canAutoMigrate(reason: BreakingReason): boolean
  ├── input_field_added_required → yes (add default)
  ├── input_type_changed → maybe (if coercible)
  ├── output_field_removed → no (needs manual)
  └── Return boolean
}
```

#### `app/api/workflows/services/migration-generator.ts`

```
class MigrationGenerator {
  generateMigrations(
    analysis: ChangeAnalysis,
    newWorkflow: WorkflowDefinition
  ): Migration[]
  ├── For each affected workflow
  │   ├── If not breaking → skip
  │   ├── Generate migration steps
  │   │   ├── For added required fields
  │   │   │   └── Add default value step
  │   │   ├── For type changes
  │   │   │   └── Add conversion mapping step
  │   │   └── For removed outputs
  │   │       └── Mark as manual intervention
  │   └── Create Migration record
  └── Return migrations

  async applyMigration(migration: Migration): Promise<void>
  ├── Load target workflow
  ├── For each migration step
  │   ├── add_default
  │   │   └── Update binding to use literal value
  │   ├── update_binding
  │   │   └── Modify existing binding
  │   └── add_mapping
  │       └── Insert mapping node
  ├── Save updated workflow
  └── Create new version

  previewMigration(migration: Migration): MigrationPreview
  ├── Load target workflow
  ├── Apply changes in memory
  ├── Generate diff
  └── Return preview without saving
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Save creates version | Save workflow, verify version file created |
| AC-A.2 | Non-breaking detected | Add optional field, verify changeType |
| AC-A.3 | Breaking detected | Add required field, verify isBreaking=true |
| AC-A.4 | Auto-update works | Non-breaking change, verify dependents updated |
| AC-A.5 | Migration generated | Breaking change, verify migration steps |
| AC-A.6 | Restore works | Restore v1, verify new version created |
| AC-A.7 | Diff shows changes | Compare v1 to v2, verify diff accurate |

---

## Part B: Frontend Versioning UI

### Goal

Create UI for viewing version history, comparing versions, handling breaking changes, and reviewing migrations.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/VersionHistory.tsx` | Create | History panel | ~180 |
| `app/(pages)/workflows/editor/components/VersionDiff.tsx` | Create | Diff view | ~200 |
| `app/(pages)/workflows/editor/components/BreakingChangeModal.tsx` | Create | Breaking dialog | ~180 |
| `app/(pages)/workflows/editor/components/MigrationPreview.tsx` | Create | Migration review | ~150 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/VersionHistory.tsx`

```
VersionHistory({ workflowId })
├── State: versions, selectedVersion, compareVersion
├── Fetch versions on mount
├── Layout
│   ├── Header
│   │   ├── "Version History"
│   │   └── Current version badge
│   ├── Version list
│   │   ├── For each version (newest first)
│   │   │   ├── Version number (v1, v2...)
│   │   │   ├── Change type badge
│   │   │   │   ├── initial → gray
│   │   │   │   ├── non-breaking → green
│   │   │   │   └── breaking → red
│   │   │   ├── Timestamp (relative)
│   │   │   ├── Change log (if any)
│   │   │   └── Actions
│   │   │       ├── "View" → shows version detail
│   │   │       ├── "Compare" → enables diff
│   │   │       └── "Restore" → restores this version
│   │   └── Empty state if no versions
│   └── Compare mode (when enabled)
│       ├── Two version selectors
│       └── "Show Diff" button
├── On view version
│   └── Open VersionDiff in detail mode
├── On compare
│   └── Open VersionDiff with two versions
└── On restore
    └── Confirm and call restore API
```

#### `app/(pages)/workflows/editor/components/BreakingChangeModal.tsx`

```
BreakingChangeModal({ analysis, onCreateVersion, onMigrate, onCancel })
├── Modal overlay
├── Header
│   ├── Warning icon
│   └── "Breaking Change Detected"
├── Breaking reasons list
│   ├── For each reason
│   │   ├── Icon by type
│   │   ├── Description
│   │   └── Field name
├── Affected workflows section
│   ├── Count: "{n} workflows use this workflow"
│   ├── List (collapsible)
│   │   ├── Workflow name
│   │   ├── Migration status
│   │   │   ├── "Can auto-migrate" → green
│   │   │   └── "Requires manual update" → yellow
│   │   └── View link
├── Options
│   ├── Option A: Create new version
│   │   ├── "Keep v{n} for existing workflows"
│   │   ├── "Create v{n+1} as new version"
│   │   └── "Existing workflows continue using v{n}"
│   ├── Option B: Migrate all
│   │   ├── "Update all {n} workflows"
│   │   ├── "Apply suggested migrations"
│   │   └── Preview button
├── Actions
│   ├── "Create New Version" (Option A)
│   ├── "Migrate All" (Option B)
│   └── "Cancel"
└── On migrate
    └── Open MigrationPreview
```

#### `app/(pages)/workflows/editor/components/MigrationPreview.tsx`

```
MigrationPreview({ migrations, onApply, onCancel })
├── Modal overlay
├── Header: "Review Migrations"
├── For each migration
│   ├── Target workflow section
│   │   ├── Workflow name
│   │   └── Step count
│   ├── Changes list
│   │   ├── For each step
│   │   │   ├── Action description
│   │   │   ├── Before/after preview
│   │   │   └── Impact note
│   └── Divider
├── Summary
│   ├── Total workflows affected
│   ├── Total changes
│   └── Warnings (if any)
├── Actions
│   ├── "Apply All Migrations" (primary)
│   ├── "Apply Selected" (if multi-select)
│   └── "Cancel"
└── On apply
    ├── Show progress
    ├── Apply each migration
    └── Show results
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | History shows versions | Open history, verify versions listed |
| AC-B.2 | Breaking modal appears | Save breaking change, verify modal |
| AC-B.3 | Migration preview shows | Click migrate, verify preview |
| AC-B.4 | Restore works from UI | Click restore, verify workflow updated |
| AC-B.5 | Diff shows changes | Compare versions, verify diff visible |

---

## User Flows

### Flow 1: Non-Breaking Save

```
1. User edits workflow (adds optional field)
2. User saves
3. System detects non-breaking change
4. Version v{n+1} created automatically
5. Dependent workflows auto-updated
6. Toast: "Saved. 3 workflows updated."
```

### Flow 2: Breaking Save with Migration

```
1. User edits workflow (adds required field)
2. User saves
3. System detects breaking change
4. BreakingChangeModal appears
5. User clicks "Migrate All"
6. MigrationPreview shows changes
7. User reviews, clicks "Apply"
8. Migrations applied
9. All workflows updated
```

---

## Out of Scope

- Branching/merging
- Collaborative conflict resolution
- Automatic rollback on failure
- Scheduled deployments

---

## Open Questions

- [ ] How many versions to keep before pruning?
- [ ] Should we support version pinning in workflow step refs?
- [ ] How to handle circular dependency updates?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
