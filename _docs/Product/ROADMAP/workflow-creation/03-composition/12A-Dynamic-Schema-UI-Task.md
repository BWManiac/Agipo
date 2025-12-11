# Task: Dynamic Schema UI

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/03-composition/12-Dynamic-Schema-UI.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Build a component library that dynamically generates UI from JSON Schema. Components can render editable forms from schemas, display schema structures, provide visual schema builders, and preview runtime data.

### Relevant Research

The workflow system uses JSON Schema for input/output definitions. Currently, schema editing is JSON-only and data preview is raw. Libraries like react-jsonschema-form exist, but we need custom styling and integration.

Key requirements:
1. Match existing UI design system (Radix + Tailwind)
2. Support all common JSON Schema types
3. Integrate with react-hook-form for validation
4. Work in multiple contexts (node config, data preview, schema builder)

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/schema/types.ts` | Create | Schema-related types | A |

### Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `components/schema/SchemaRenderer.tsx` | Create | Dynamic form renderer | A |
| `components/schema/SchemaViewer.tsx` | Create | Schema structure viewer | A |
| `components/schema/SchemaBuilder.tsx` | Create | Visual schema editor | B |
| `components/schema/DataPreview.tsx` | Create | Data preview component | B |
| `components/schema/FieldPicker.tsx` | Create | Field selection tree | B |
| `components/schema/fields/*.tsx` | Create | Individual field components | A |

### Utilities

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/schema/schema-to-zod.ts` | Create | Convert JSON Schema to Zod | A |
| `lib/schema/field-resolver.ts` | Create | Map schema to components | A |

---

## Part A: Core Schema Components

### Goal

Build the foundational components for rendering and viewing schemas.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/schema/types.ts` | Create | Types | ~80 |
| `lib/schema/schema-to-zod.ts` | Create | Conversion | ~150 |
| `lib/schema/field-resolver.ts` | Create | Component mapping | ~100 |
| `components/schema/SchemaRenderer.tsx` | Create | Main renderer | ~200 |
| `components/schema/SchemaViewer.tsx` | Create | Viewer | ~150 |
| `components/schema/fields/StringField.tsx` | Create | String input | ~100 |
| `components/schema/fields/NumberField.tsx` | Create | Number input | ~80 |
| `components/schema/fields/BooleanField.tsx` | Create | Boolean input | ~60 |
| `components/schema/fields/ArrayField.tsx` | Create | Array input | ~150 |
| `components/schema/fields/ObjectField.tsx` | Create | Object input | ~120 |

### Pseudocode

#### `lib/schema/types.ts`

```typescript
import { JSONSchema7 } from 'json-schema';

// Re-export for convenience
export type JSONSchema = JSONSchema7;

interface SchemaFieldProps<T = any> {
  schema: JSONSchema;
  value: T;
  onChange: (value: T) => void;
  mode: FieldMode;
  path: string;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

type FieldMode = 'edit' | 'view' | 'preview';

interface SchemaRendererProps {
  schema: JSONSchema;
  value: any;
  onChange: (value: any) => void;
  mode?: FieldMode;
  errors?: Record<string, string>;
  disabled?: boolean;
}

interface SchemaViewerProps {
  schema: JSONSchema;
  expandLevel?: number;
  onFieldClick?: (path: string) => void;
  highlightPaths?: string[];
}

interface FieldResolverResult {
  component: React.ComponentType<SchemaFieldProps>;
  props: Partial<SchemaFieldProps>;
}
```

#### `lib/schema/schema-to-zod.ts`

```
function schemaToZod(schema: JSONSchema): z.ZodType
├── If type === 'string'
│   ├── Base: z.string()
│   ├── If minLength → .min()
│   ├── If maxLength → .max()
│   ├── If pattern → .regex()
│   ├── If format === 'email' → .email()
│   ├── If format === 'uri' → .url()
│   └── If enum → z.enum()
├── If type === 'number' or 'integer'
│   ├── Base: z.number()
│   ├── If integer → .int()
│   ├── If minimum → .min()
│   └── If maximum → .max()
├── If type === 'boolean'
│   └── z.boolean()
├── If type === 'array'
│   ├── z.array(schemaToZod(items))
│   ├── If minItems → .min()
│   └── If maxItems → .max()
├── If type === 'object'
│   ├── z.object({ ... })
│   ├── For each property → recurse
│   └── Apply required
├── If anyOf/oneOf
│   └── z.union([...])
└── Return zod schema
```

#### `lib/schema/field-resolver.ts`

```
function resolveField(schema: JSONSchema): FieldResolverResult
├── If type === 'string'
│   ├── If enum → return SelectField
│   ├── If format === 'date' → return DateField
│   ├── If format === 'date-time' → return DateTimeField
│   ├── If maxLength > 100 → return TextareaField
│   └── Default → return StringField
├── If type === 'number' or 'integer'
│   └── return NumberField
├── If type === 'boolean'
│   └── return BooleanField
├── If type === 'array'
│   └── return ArrayField
├── If type === 'object'
│   └── return ObjectField
└── Default → return AnyField
```

#### `components/schema/SchemaRenderer.tsx`

```
SchemaRenderer({ schema, value, onChange, mode = 'edit', errors, disabled })
├── If schema.type === 'object'
│   ├── Get properties
│   ├── Get required fields
│   └── Render ObjectField with children
├── Else (primitive or array at root)
│   ├── Resolve field component
│   └── Render directly
├── Pass error for path to each field
└── Handle mode (edit/view/preview)

// Recursive rendering for nested schemas
ObjectField({ schema, value, onChange, path, mode })
├── For each property in schema.properties
│   ├── Calculate child path
│   ├── Resolve field component
│   ├── Get current value
│   └── Render with onChange that updates parent
└── Wrap in fieldset with legend if nested
```

#### `components/schema/fields/StringField.tsx`

```
StringField({ schema, value, onChange, mode, label, required, error, disabled })
├── If mode === 'view' or 'preview'
│   └── Render text value with label
├── If mode === 'edit'
│   ├── Render input based on schema
│   │   ├── If maxLength > 100 → textarea
│   │   ├── If format === 'email' → type="email"
│   │   ├── If format === 'uri' → type="url"
│   │   └── Default → type="text"
│   ├── Add validation attributes
│   │   ├── required={required}
│   │   ├── minLength={schema.minLength}
│   │   ├── maxLength={schema.maxLength}
│   │   └── pattern={schema.pattern}
│   ├── Show description as helper text
│   └── Show error message if present
└── Wrap in FormField component
```

#### `components/schema/fields/ArrayField.tsx`

```
ArrayField({ schema, value = [], onChange, mode, path })
├── State: items (internal array state)
├── If mode === 'view' or 'preview'
│   ├── If items.length === 0 → show "No items"
│   ├── Render count: "{n} items"
│   └── Expandable list of items
│       └── Each item rendered with schema.items
├── If mode === 'edit'
│   ├── List of item editors
│   │   ├── For each item
│   │   │   ├── Index indicator
│   │   │   ├── SchemaRenderer for item schema
│   │   │   ├── Move up/down buttons
│   │   │   └── Remove button
│   │   └── Empty state if no items
│   ├── "Add item" button
│   │   └── Creates new item with defaults
│   └── Constraints display (min/max items)
├── On item change
│   ├── Update items array
│   └── Call onChange with new array
└── On add/remove
    ├── Update items
    └── Call onChange
```

#### `components/schema/SchemaViewer.tsx`

```
SchemaViewer({ schema, expandLevel = 1, onFieldClick, highlightPaths })
├── Render tree structure
│   └── SchemaNode({ schema, path, depth })
├── SchemaNode component
│   ├── Expand/collapse toggle (if has children)
│   ├── Field name
│   ├── Type badge
│   │   ├── string → blue
│   │   ├── number → green
│   │   ├── boolean → purple
│   │   ├── array → orange
│   │   └── object → gray
│   ├── Required indicator (*)
│   ├── Description tooltip
│   └── If object or array with items
│       └── Render children when expanded
├── Interaction
│   ├── Click field → call onFieldClick(path)
│   ├── Hover → show full path tooltip
│   └── Highlight if in highlightPaths
└── Styling
    ├── Indentation by depth
    ├── Tree lines connecting nodes
    └── Monospace font for paths
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | String field renders | Schema { type: 'string' } → text input |
| AC-A.2 | Number field renders | Schema { type: 'number' } → number input |
| AC-A.3 | Array field renders | Schema { type: 'array' } → list with add |
| AC-A.4 | Nested objects render | Nested object schema → nested fieldset |
| AC-A.5 | Validation works | Required field empty → error shown |
| AC-A.6 | View mode shows values | Mode='view' → read-only display |
| AC-A.7 | Viewer shows structure | Complex schema → tree view |

---

## Part B: Advanced Schema Components

### Goal

Build schema builder, data preview, and field picker components.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/schema/SchemaBuilder.tsx` | Create | Visual editor | ~300 |
| `components/schema/DataPreview.tsx` | Create | Data preview | ~150 |
| `components/schema/FieldPicker.tsx` | Create | Field selector | ~180 |

### Pseudocode

#### `components/schema/SchemaBuilder.tsx`

```
SchemaBuilder({ schema, onChange })
├── State: fields (parsed from schema)
├── Field list
│   ├── For each field
│   │   ├── FieldEditor component
│   │   │   ├── Name input
│   │   │   ├── Type selector (dropdown)
│   │   │   ├── Required checkbox
│   │   │   ├── Description input (collapsible)
│   │   │   ├── Type-specific options
│   │   │   │   ├── String: minLength, maxLength, format, enum
│   │   │   │   ├── Number: min, max
│   │   │   │   ├── Array: item type (recursive)
│   │   │   │   └── Object: nested fields (recursive)
│   │   │   ├── Drag handle for reordering
│   │   │   └── Delete button
│   │   └── Nested SchemaBuilder for object/array items
│   └── Add field button
├── JSON preview panel
│   ├── Read-only JSON display
│   ├── Copy button
│   └── Toggle: visual / JSON mode
├── On any field change
│   ├── Update fields state
│   ├── Rebuild schema from fields
│   └── Call onChange(newSchema)
└── Import/export
    ├── Import from JSON
    └── Export to JSON
```

#### `components/schema/DataPreview.tsx`

```
DataPreview({ data, schema, maxDepth = 3 })
├── Render based on type
│   ├── null/undefined → "null" badge
│   ├── string → quoted value (truncated if long)
│   ├── number → formatted number
│   ├── boolean → "true"/"false" badge
│   ├── array → collapsible list
│   │   ├── Header: "Array ({length} items)"
│   │   ├── Collapsed: first 3 items preview
│   │   └── Expanded: all items with DataPreview
│   └── object → collapsible key-value
│       ├── Header: "Object ({keys} properties)"
│       ├── Collapsed: key list
│       └── Expanded: each property with DataPreview
├── Type badge showing actual type
├── Schema type mismatch warning
│   └── If actual type !== schema type → red badge
├── Depth limiting
│   └── If depth > maxDepth → "[...]" with expand
└── Styling
    ├── Syntax highlighting
    ├── Collapsible sections
    └── Copy value button
```

#### `components/schema/FieldPicker.tsx`

```
FieldPicker({ schema, onSelect, value, filter })
├── Render selectable tree
│   └── FieldNode({ schema, path, depth })
├── FieldNode component
│   ├── Radio/checkbox (based on single/multi select)
│   ├── Field name
│   ├── Type badge
│   ├── Path display (e.g., "job.company.name")
│   └── If object/array
│       ├── Expand toggle
│       └── Children when expanded
├── Search/filter
│   ├── Filter input at top
│   ├── Filters by name or path
│   └── Highlights matches
├── Selection
│   ├── Single select: radio buttons
│   ├── Multi select: checkboxes
│   └── Selected paths shown at bottom
├── On select
│   └── Call onSelect(path) or onSelect(paths)
└── Quick actions
    ├── Select all
    ├── Clear selection
    └── Collapse all
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Builder creates schema | Add 3 fields, verify valid JSON Schema |
| AC-B.2 | Builder handles nesting | Add object with properties, verify structure |
| AC-B.3 | Data preview renders | Pass complex data, verify displayed |
| AC-B.4 | Arrays collapsible | 10-item array, verify collapse/expand |
| AC-B.5 | Field picker selects | Click field, verify onSelect called with path |
| AC-B.6 | Search filters | Type query, verify filtered tree |

---

## Integration Points

### In Node Configuration Panel

```tsx
<NodeConfigPanel node={selectedNode}>
  {/* Input configuration using schema */}
  <SchemaRenderer
    schema={node.inputSchema}
    value={node.inputBindings}
    onChange={updateBindings}
    mode="edit"
  />
</NodeConfigPanel>
```

### In Execution Monitor

```tsx
<ExecutionStep step={step}>
  <DataPreview
    data={step.output}
    schema={step.outputSchema}
  />
</ExecutionStep>
```

### In Schema Definition

```tsx
<CustomNodeEditor>
  <SchemaBuilder
    schema={node.outputSchema}
    onChange={updateOutputSchema}
  />
</CustomNodeEditor>
```

---

## Out of Scope

- Schema versioning
- Custom field widgets
- Real-time collaboration

---

## Open Questions

- [ ] How handle recursive schemas ($ref)?
- [ ] Should we support custom renderers per field?
- [ ] How preview very large data sets?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
