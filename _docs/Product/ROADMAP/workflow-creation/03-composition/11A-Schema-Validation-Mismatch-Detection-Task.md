# Task: Schema Validation & Mismatch Detection

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/03-composition/11-Schema-Validation-Mismatch-Detection.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Implement a validation system that detects schema mismatches between workflow steps at design time and runtime. Users see immediate visual feedback when connecting incompatible nodes, with actionable suggestions for resolution.

### Relevant Research

The workflow system uses JSON Schema for input/output definitions. Currently, validation happens only at runtime when data fails to match. Moving validation earlier (design time) requires:
1. Schema comparison logic
2. Visual feedback on canvas
3. Fix suggestions and auto-resolution

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/validation.ts` | Create | Validation types | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/schema-validator.ts` | Create | Validation logic | A |
| `app/api/workflows/services/compatibility-checker.ts` | Create | Schema comparison | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/validate/route.ts` | Create | Validate endpoint | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/validation-slice.ts` | Create | Validation state | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/ValidationPanel.tsx` | Create | Issues panel | B |
| `app/(pages)/workflows/editor/components/EdgeValidationIndicator.tsx` | Create | Edge overlay | B |
| `app/(pages)/workflows/editor/components/SchemaComparisonPopover.tsx` | Create | Field comparison | B |

---

## Part A: Backend Validation System

### Goal

Build services for comparing schemas and validating workflow integrity.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/validation.ts` | Create | Types | ~100 |
| `app/api/workflows/services/schema-validator.ts` | Create | Core validation | ~250 |
| `app/api/workflows/services/compatibility-checker.ts` | Create | Comparison logic | ~200 |
| `app/api/workflows/validate/route.ts` | Create | API endpoint | ~80 |

### Pseudocode

#### `app/api/workflows/types/validation.ts`

```typescript
interface ValidationResult {
  valid: boolean;
  score: number;              // 0-1 overall health
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}

interface ValidationIssue {
  id: string;
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  location: IssueLocation;
  message: string;
  details?: any;
  fix?: FixSuggestion;
}

type IssueType =
  | 'schema_mismatch'
  | 'missing_required_input'
  | 'orphan_node'
  | 'incomplete_control_flow'
  | 'circular_dependency'
  | 'type_incompatible'
  | 'runtime_type_error';

interface IssueLocation {
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

interface FixSuggestion {
  type: 'add_mapping' | 'add_default' | 'connect_input' | 'remove_node';
  label: string;
  action: FixAction;
}

interface FixAction {
  type: string;
  params: Record<string, any>;
}

interface CompatibilityResult {
  compatible: boolean;
  score: number;              // 0-1
  fieldMatches: FieldMatch[];
  fieldMismatches: FieldMismatch[];
  suggestions: string[];
}

interface FieldMatch {
  sourcePath: string;
  targetPath: string;
  matchType: 'exact' | 'compatible' | 'coercible';
  confidence: number;
}

interface FieldMismatch {
  type: MismatchType;
  sourcePath?: string;
  targetPath?: string;
  sourceType?: string;
  targetType?: string;
  message: string;
}

type MismatchType =
  | 'field_missing_in_source'
  | 'field_missing_in_target'
  | 'type_incompatible'
  | 'required_field_missing';
```

#### `app/api/workflows/services/compatibility-checker.ts`

```
class CompatibilityChecker {
  checkCompatibility(
    sourceSchema: JSONSchema,
    targetSchema: JSONSchema
  ): CompatibilityResult
  ├── Flatten schemas to field lists
  │   ├── Source: [{ path, type, required }]
  │   └── Target: [{ path, type, required }]
  ├── For each target field
  │   ├── Find matching source field
  │   │   ├── Try exact path match
  │   │   ├── Try fuzzy name match
  │   │   └── Try type-compatible match
  │   ├── If found
  │   │   ├── Check type compatibility
  │   │   └── Add to fieldMatches
  │   ├── If not found and required
  │   │   └── Add to fieldMismatches (required_field_missing)
  │   └── If not found and optional
  │       └── Add to fieldMismatches (field_missing_in_source)
  ├── For each unused source field
  │   └── Add to fieldMismatches (field_missing_in_target)
  ├── Calculate score
  │   ├── Base: matched / total required
  │   ├── Penalty for type mismatches
  │   └── Bonus for exact matches
  ├── Generate suggestions
  │   └── Based on mismatches
  └── Return CompatibilityResult

  checkTypeCompatibility(
    sourceType: string,
    targetType: string
  ): { compatible: boolean; coercible: boolean }
  ├── Exact match → compatible
  ├── Integer to number → compatible
  ├── Number to integer → warning (coercible)
  ├── String to number → not compatible
  ├── Array check items type recursively
  ├── Object check properties recursively
  └── Return result

  private flattenSchema(schema: JSONSchema, prefix = ''): FlatField[]
  ├── If type === 'object'
  │   ├── For each property
  │   │   └── Recurse with prefix + property
  │   └── Collect all paths
  ├── If type === 'array'
  │   └── Include items type
  └── Return flat list
}
```

#### `app/api/workflows/services/schema-validator.ts`

```
class SchemaValidator {
  validateWorkflow(workflow: WorkflowDefinition): ValidationResult
  ├── Initialize issues array
  ├── Validate all edges
  │   └── For each edge, check source→target compatibility
  ├── Validate required inputs
  │   └── For each step, check all required inputs are bound
  ├── Validate orphan nodes
  │   └── Find nodes with no incoming or outgoing edges
  ├── Validate control flow
  │   └── Check branches merge, loops terminate
  ├── Calculate overall score
  │   ├── 1.0 if no issues
  │   ├── Reduce for each issue by severity
  └── Return ValidationResult

  validateEdge(
    sourceNode: Step,
    targetNode: Step,
    edge: Edge
  ): ValidationIssue[]
  ├── Get source output schema
  ├── Get target input schema
  ├── Check compatibility
  ├── If not compatible
  │   └── Create issue with fix suggestion
  └── Return issues

  validateRequiredInputs(
    node: Step,
    bindings: BindingMap
  ): ValidationIssue[]
  ├── Get node input schema
  ├── Get required properties
  ├── For each required property
  │   ├── Check if bound in bindings
  │   ├── If not bound
  │   │   └── Create missing_required_input issue
  └── Return issues

  validateData(
    data: any,
    schema: JSONSchema
  ): ValidationResult
  ├── Use AJV to validate
  ├── Map AJV errors to ValidationIssues
  └── Return result

  generateFixSuggestion(issue: ValidationIssue): FixSuggestion
  ├── If schema_mismatch
  │   └── Suggest: Add mapping node
  ├── If missing_required_input
  │   └── Suggest: Connect input or add default
  ├── If orphan_node
  │   └── Suggest: Remove node
  └── Return suggestion
}
```

#### `app/api/workflows/validate/route.ts`

```
POST /api/workflows/validate
├── Parse request body
│   ├── workflow: WorkflowDefinition
│   └── options?: { strict?: boolean }
├── Create SchemaValidator instance
├── Run validateWorkflow()
├── Return ValidationResult

Response: {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Compatible schemas pass | Check { name: string } → { name: string } |
| AC-A.2 | Incompatible schemas fail | Check { count: number } → { name: string } |
| AC-A.3 | Partial match detected | Check { a, b } → { a, c }, verify both noted |
| AC-A.4 | Required missing detected | Remove required binding, verify issue |
| AC-A.5 | Fix suggestion provided | Mismatch creates add_mapping suggestion |
| AC-A.6 | Workflow validation aggregates | Validate full workflow, get all issues |

---

## Part B: Frontend Validation UI

### Goal

Create visual feedback for validation status on canvas and in a dedicated panel.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/validation-slice.ts` | Create | State | ~80 |
| `app/(pages)/workflows/editor/components/ValidationPanel.tsx` | Create | Issues list | ~180 |
| `app/(pages)/workflows/editor/components/EdgeValidationIndicator.tsx` | Create | Edge overlay | ~100 |
| `app/(pages)/workflows/editor/components/SchemaComparisonPopover.tsx` | Create | Field view | ~150 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/validation-slice.ts`

```typescript
interface ValidationState {
  result: ValidationResult | null;
  isValidating: boolean;
  lastValidated: Date | null;
  dismissedIssues: string[];  // Issue IDs user dismissed
}

actions:
  validateWorkflow(workflow: WorkflowDefinition)
  ├── Set isValidating: true
  ├── Call POST /api/workflows/validate
  ├── Set result
  ├── Set lastValidated
  └── Set isValidating: false

  dismissIssue(issueId: string)
  └── Add to dismissedIssues

  clearDismissed()
  └── Clear dismissedIssues

  applyFix(issue: ValidationIssue)
  ├── Based on fix.type
  │   ├── add_mapping: Insert mapping node
  │   ├── add_default: Set default value
  │   └── remove_node: Delete node
  └── Re-validate after fix

selectors:
  activeIssues: Filter out dismissed
  issuesForNode(nodeId): Filter by location
  issuesForEdge(edgeId): Filter by location
```

#### `app/(pages)/workflows/editor/components/ValidationPanel.tsx`

```
ValidationPanel()
├── State: expanded
├── Header
│   ├── "Validation" title
│   ├── Status indicator
│   │   ├── Green checkmark if valid
│   │   ├── Yellow warning if warnings only
│   │   └── Red X if errors
│   ├── Issue count badge
│   └── Refresh button
├── Collapsed view
│   └── Just header with count
├── Expanded view
│   ├── Summary
│   │   ├── "X valid connections"
│   │   ├── "Y warnings"
│   │   └── "Z errors"
│   ├── Issue list
│   │   ├── Grouped by severity
│   │   ├── For each issue
│   │   │   ├── Icon by type
│   │   │   ├── Message
│   │   │   ├── Location link (click to navigate)
│   │   │   ├── Fix button (if suggestion available)
│   │   │   └── Dismiss button
│   │   └── Empty state if no issues
│   └── "Fix all" button (if multiple fixable)
├── On issue click
│   └── Select and zoom to location
└── On fix click
    └── Apply fix and re-validate
```

#### `app/(pages)/workflows/editor/components/EdgeValidationIndicator.tsx`

```
EdgeValidationIndicator({ edgeId, sourceId, targetId })
├── Get validation result from state
├── Find issues for this edge
├── If no issues
│   └── Render nothing (default edge styling)
├── If warnings
│   ├── Render yellow overlay on edge
│   └── Warning icon at midpoint
├── If errors
│   ├── Render red dashed overlay
│   └── Error icon at midpoint
├── On hover
│   └── Show SchemaComparisonPopover
└── On click
    └── Open validation panel, highlight issue
```

#### `app/(pages)/workflows/editor/components/SchemaComparisonPopover.tsx`

```
SchemaComparisonPopover({ sourceSchema, targetSchema, compatibility })
├── Two-column layout
│   ├── Left: Source fields
│   │   ├── For each field
│   │   │   ├── Field name
│   │   │   ├── Type badge
│   │   │   └── Match indicator (green line to right)
│   └── Right: Target fields
│       ├── For each field
│       │   ├── Match indicator (line from left)
│       │   ├── Field name
│       │   ├── Type badge
│       │   └── Required indicator
├── Lines between matched fields
│   ├── Green: exact match
│   ├── Yellow: coercible
│   └── Red: type mismatch
├── Missing fields highlighted
│   ├── Missing in source: red on right
│   └── Unused in target: gray on left
├── Footer
│   ├── Compatibility score
│   └── "Add mapping" button
└── Styling
    ├── Popover with arrow
    └── Max height with scroll
```

### Integration with Canvas

```typescript
// In canvas edge rendering
const EdgeWithValidation = ({ edge, ...props }) => {
  const issues = useIssuesForEdge(edge.id);

  return (
    <>
      <DefaultEdge {...props} style={getEdgeStyle(issues)} />
      {issues.length > 0 && (
        <EdgeValidationIndicator
          edgeId={edge.id}
          sourceId={edge.source}
          targetId={edge.target}
        />
      )}
    </>
  );
};

const getEdgeStyle = (issues) => {
  if (issues.some(i => i.severity === 'error')) {
    return { stroke: 'red', strokeDasharray: '5,5' };
  }
  if (issues.some(i => i.severity === 'warning')) {
    return { stroke: 'orange' };
  }
  return { stroke: 'green' };
};
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Panel shows issues | Validate workflow with issues, verify displayed |
| AC-B.2 | Edge indicator appears | Create mismatch, verify yellow/red edge |
| AC-B.3 | Popover shows comparison | Hover edge, verify field comparison |
| AC-B.4 | Fix applies | Click fix, verify mapping added |
| AC-B.5 | Navigate to issue | Click issue, verify canvas zooms |
| AC-B.6 | Dismiss works | Dismiss issue, verify hidden |

---

## User Flows

### Flow 1: Real-time Validation

```
1. User drags edge from Step A to Step B
2. System immediately checks compatibility
3. If mismatch, edge appears yellow/red
4. User hovers edge
5. SchemaComparisonPopover shows field mismatch
6. User clicks "Add mapping"
7. Mapping node inserted
8. Edge turns green
```

---

## Out of Scope

- Schema inference
- Custom validation rules
- Cross-workflow validation

---

## Open Questions

- [ ] How often to re-validate (every change vs. debounced)?
- [ ] Should errors prevent save completely?
- [ ] How to handle dynamic schemas?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
