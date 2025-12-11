# Schema Validation & Mismatch Detection

**Status:** Draft
**Priority:** P0
**North Star:** User connects nodes with incompatible schemas, sees immediate visual warning with option to auto-generate mapping, preventing runtime errors.

---

## Problem Statement

Workflows fail at runtime when data doesn't match expected schemas. Currently:
1. Schema mismatches aren't detected until execution
2. Users don't see why connections are invalid
3. No guidance on how to fix mismatches
4. Type errors are cryptic and unhelpful

**The Gap:** No design-time validation of schema compatibility between workflow steps.

---

## User Value

- **Catch errors early** — See problems before running
- **Understand issues** — Clear explanation of what's wrong
- **Fix quickly** — Guided resolution with auto-mapping option
- **Build confidence** — Know workflows will work before deploying
- **Learn schemas** — Visual feedback teaches good data modeling

---

## Validation Levels

### Level 1: Connection Validation (Real-time)

When user draws an edge, immediately check if connection is valid:
- Does source output schema exist?
- Does target input schema exist?
- Are types compatible?

### Level 2: Workflow Validation (On save/run)

Before saving or running, validate entire workflow:
- All connections are valid
- All required inputs are provided
- No orphan nodes
- Control flow is complete

### Level 3: Runtime Validation (On execute)

During execution, validate actual data:
- Data matches declared schema
- Required fields are present
- Types are correct

---

## User Flows

### Flow 1: Connection-Time Warning

```
1. User has "Extract Data" step (outputs: { name: string, count: number })
2. User drags edge to "Send Email" step (expects: { email: string, subject: string })
3. System detects mismatch immediately
4. Edge appears with warning indicator (yellow dotted line)
5. Tooltip shows: "Schema mismatch: source has {name, count}, target expects {email, subject}"
6. Options appear:
   - "Add mapping node"
   - "Ignore (advanced)"
7. User clicks "Add mapping node"
8. Mapping node inserted (see 06-Mapping-Code-Nodes.md)
```

### Flow 2: Partial Match Detection

```
1. User connects steps with partial overlap
2. Source: { name: string, email: string, age: number }
3. Target: { email: string, message: string }
4. System shows:
   - Green checkmark for "email" (compatible)
   - Yellow warning for "message" (missing in source)
   - Gray note for "name, age" (unused from source)
5. User sees which fields need mapping
6. Can choose to map "name" → "message" or add custom value
```

### Flow 3: Workflow-Level Validation

```
1. User clicks "Validate" or "Save"
2. System scans entire workflow
3. Validation panel shows:
   - Step 1: Valid ✓
   - Step 2: Valid ✓
   - Step 3: Schema mismatch with Step 2
   - Step 4: Missing required input "apiKey"
   - Step 5: Unreachable (not connected)
4. User clicks on issue → navigates to problem
5. "Fix all" button auto-inserts mapping nodes
```

### Flow 4: Runtime Type Error

```
1. Workflow starts executing
2. Step 3 receives data that doesn't match schema
3. Execution pauses (or fails gracefully)
4. Error shown:
   - Expected: { items: string[] }
   - Received: { items: "single string value" }
   - Suggestion: "Add .split() transformation"
5. User can:
   - Fix and retry
   - Skip step
   - Abort workflow
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/types/workflow.ts` | Schema types | `inputSchema`, `outputSchema` |
| `app/(pages)/workflows/editor/` | Canvas validation | Edge creation |
| `ajv` or `zod` | Schema validation | JSON Schema validation |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Validation library | AJV (JSON Schema) | Standard, well-supported |
| When to validate | Real-time + save + run | Multiple safety nets |
| Error severity | Warning (allow) vs Error (block) | Warnings for mismatches, errors for critical |
| Visual feedback | Inline on canvas | Immediate, contextual |

---

## Architecture

### Schema Compatibility Check

```typescript
interface CompatibilityResult {
  compatible: boolean;
  score: number;                  // 0-1, how compatible
  matches: FieldMatch[];
  mismatches: FieldMismatch[];
  suggestions: string[];
}

interface FieldMatch {
  sourcePath: string;
  targetPath: string;
  exactMatch: boolean;
  typeCompatible: boolean;
}

interface FieldMismatch {
  type: 'missing_in_source' | 'missing_in_target' | 'type_incompatible';
  field: string;
  sourceType?: string;
  targetType?: string;
  suggestion?: string;
}
```

### Validation Service

```typescript
class SchemaValidator {
  // Check if source output is compatible with target input
  checkCompatibility(
    sourceSchema: JSONSchema,
    targetSchema: JSONSchema
  ): CompatibilityResult {
    // ... implementation
  }

  // Validate entire workflow
  validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check all connections
    for (const edge of workflow.edges) {
      const sourceSchema = getOutputSchema(edge.source);
      const targetSchema = getInputSchema(edge.target);
      const compat = this.checkCompatibility(sourceSchema, targetSchema);
      if (!compat.compatible) {
        issues.push({
          type: 'schema_mismatch',
          severity: 'warning',
          location: { edgeId: edge.id },
          message: `Schema mismatch between ${edge.source} and ${edge.target}`,
          details: compat.mismatches,
          suggestions: compat.suggestions
        });
      }
    }

    // Check required inputs
    // Check orphan nodes
    // Check control flow completeness

    return { valid: issues.length === 0, issues };
  }

  // Validate data at runtime
  validateData(data: any, schema: JSONSchema): ValidationResult {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, data);
    if (!valid) {
      return {
        valid: false,
        issues: ajv.errors.map(e => ({
          type: 'runtime_type_error',
          severity: 'error',
          message: e.message,
          path: e.instancePath
        }))
      };
    }
    return { valid: true, issues: [] };
  }
}
```

### Type Compatibility Rules

| Source Type | Target Type | Compatible? | Notes |
|-------------|-------------|-------------|-------|
| `string` | `string` | Yes | Exact match |
| `number` | `number` | Yes | Exact match |
| `integer` | `number` | Yes | Integer is subset of number |
| `number` | `integer` | Warning | May lose precision |
| `string` | `number` | No | Needs parsing |
| `array<T>` | `array<T>` | Check T | Recursive |
| `object` | `object` | Check props | Field-by-field |
| `any` | `T` | Yes | Any accepts all |
| `T` | `any` | Yes | All accepted by any |

---

## Visual Design

### Edge States

| State | Style | Indicator |
|-------|-------|-----------|
| Valid | Solid green | None |
| Partial match | Solid yellow | Warning icon |
| Mismatch | Dotted red | Error icon |
| Unmapped | Dashed gray | Question mark |

### Node Validation Indicators

| State | Indicator |
|-------|-----------|
| All inputs satisfied | Green border |
| Missing required input | Red border + icon |
| Unused outputs | Gray dashed output handle |

### Validation Panel

```
┌─────────────────────────────────────────┐
│ Workflow Validation           [Refresh] │
├─────────────────────────────────────────┤
│ ✓ 5 valid connections                   │
│ ⚠ 2 schema mismatches                   │
│ ✗ 1 missing required input              │
├─────────────────────────────────────────┤
│ Issues:                                 │
│                                         │
│ ⚠ Step 3 → Step 4                       │
│   Source missing field: 'email'         │
│   [Fix: Add mapping]  [Ignore]          │
│                                         │
│ ⚠ Step 5 → Step 6                       │
│   Type mismatch: string vs number       │
│   [Fix: Add conversion]  [Ignore]       │
│                                         │
│ ✗ Step 7: Missing 'apiKey' input        │
│   Required input not provided           │
│   [Fix: Connect input]                  │
└─────────────────────────────────────────┘
```

---

## Constraints

- **Performance** — Real-time validation must be fast (<50ms)
- **JSON Schema support** — Must handle standard JSON Schema features
- **Non-blocking** — Warnings shouldn't prevent saving (user can acknowledge)
- **Clear messages** — Errors must be actionable, not cryptic

---

## Success Criteria

- [ ] Incompatible connections show warning immediately
- [ ] Partial matches show which fields are ok/missing
- [ ] Validation panel shows all workflow issues
- [ ] "Fix" buttons resolve issues with one click
- [ ] Runtime errors caught and displayed clearly
- [ ] Performance stays responsive during editing
- [ ] Edge styling reflects validation state

---

## Out of Scope

- Schema inference from sample data
- Custom validation rules beyond JSON Schema
- Cross-workflow validation
- Historical validation (comparing versions)

---

## Open Questions

- Should we block saving with errors or just warn?
- How strict should type coercion be?
- Should we validate against actual runtime data types or declared schemas?
- How do we handle optional fields in compatibility checks?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Edge Warning | Invalid connection | Red dotted edge, tooltip |
| Validation Panel | All issues | List with fix buttons |
| Field Comparison | Partial match | Side-by-side field view |
| Runtime Error | Execution failure | Error with suggestion |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── schema-validation/
│   ├── edge-warning.html
│   ├── validation-panel.html
│   ├── field-comparison.html
│   └── runtime-error.html
```

---

## References

- JSON Schema: https://json-schema.org/
- AJV validator: https://ajv.js.org/
- Mapping nodes: `06-Mapping-Code-Nodes.md`
