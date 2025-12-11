# Dynamic Schema UI

**Status:** Draft
**Priority:** P1
**North Star:** User creates node with output schema `{ items: Item[] }`, and the next node's input form automatically shows an array editor with fields for each Item property.

---

## Problem Statement

Workflow steps have input/output schemas, but users can't easily:
1. See what data a step produces
2. Configure inputs in a type-appropriate way
3. Understand complex nested structures
4. Edit schemas when needed

**The Gap:** No dynamic UI generation from JSON Schema for viewing and editing workflow data.

---

## User Value

- **Intuitive data entry** — Form fields match data types automatically
- **Clear data visualization** — See complex structures at a glance
- **Type safety** — UI prevents invalid data entry
- **Schema editing** — Modify schemas without writing JSON
- **Runtime insight** — Preview actual data flowing through workflow

---

## User Flows

### Flow 1: Schema-Driven Input Form

```
1. User configures step with input schema:
   {
     email: string (required)
     subject: string (required)
     body: string (optional)
     attachments: File[] (optional)
   }
2. Configuration panel shows:
   - Email input (text, required indicator, email validation)
   - Subject input (text, required indicator)
   - Body input (textarea, optional)
   - Attachments (file picker, multi-select)
3. User fills form fields
4. Validation runs in real-time
5. Data bindings created automatically
```

### Flow 2: Complex Schema Visualization

```
1. User views output of "Extract Job Posting" step
2. Output schema is:
   {
     job: {
       title: string
       company: { name: string, location: string }
       requirements: string[]
       salary: { min: number, max: number, currency: string }
     }
   }
3. Schema viewer shows:
   - Expandable tree view
   - Type badges for each field
   - Required/optional indicators
   - Sample values (if available)
4. User can click any field to use in binding
```

### Flow 3: Edit Schema Visually

```
1. User creates custom code node
2. Needs to define output schema
3. Opens schema editor
4. Visual builder shows:
   - Add field button
   - Field name input
   - Type dropdown (string, number, boolean, array, object)
   - Required checkbox
   - Nested fields for object/array
5. User builds schema visually
6. JSON preview updates in real-time
7. Schema saved to node configuration
```

### Flow 4: Runtime Data Preview

```
1. Workflow is running
2. User watches execution
3. Each step shows data preview as it completes
4. For "Analyze Resume" step:
   - Input tab: shows actual resume data
   - Output tab: shows skills, experience arrays
5. Data is formatted by schema type
6. Arrays show item count and expandable list
7. Objects show key-value pairs
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/types/workflow.ts` | Schema types | JSONSchema patterns |
| `components/ui/` | UI primitives | Form components |
| `react-hook-form` + `zod` | Form handling | Validation patterns |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema standard | JSON Schema Draft 7 | Well-supported, expressive |
| UI library | Radix + custom | Consistent with app design |
| Form library | react-hook-form + zod | Already in use |
| Schema editor | Visual builder + JSON | Both modes for different users |

---

## Architecture

### Schema to UI Mapping

| JSON Schema Type | UI Component |
|------------------|--------------|
| `string` | Text input |
| `string` + `format: email` | Email input with validation |
| `string` + `format: uri` | URL input with validation |
| `string` + `format: date` | Date picker |
| `string` + `format: date-time` | DateTime picker |
| `string` + `enum` | Select dropdown |
| `string` + `maxLength > 100` | Textarea |
| `number` | Number input |
| `integer` | Number input (step=1) |
| `boolean` | Checkbox |
| `array` | List builder (add/remove items) |
| `object` | Nested fieldset |
| `oneOf` / `anyOf` | Union type selector |

### Schema Renderer Component

```typescript
interface SchemaRendererProps {
  schema: JSONSchema;
  value: any;
  onChange: (value: any) => void;
  mode: 'edit' | 'view' | 'preview';
  path?: string;
  errors?: ValidationError[];
}

// Recursive rendering
function SchemaRenderer({ schema, value, onChange, mode, path }: SchemaRendererProps) {
  switch (schema.type) {
    case 'string':
      return <StringField schema={schema} value={value} onChange={onChange} mode={mode} />;
    case 'number':
    case 'integer':
      return <NumberField schema={schema} value={value} onChange={onChange} mode={mode} />;
    case 'boolean':
      return <BooleanField schema={schema} value={value} onChange={onChange} mode={mode} />;
    case 'array':
      return <ArrayField schema={schema} value={value} onChange={onChange} mode={mode} />;
    case 'object':
      return <ObjectField schema={schema} value={value} onChange={onChange} mode={mode} />;
    default:
      return <AnyField schema={schema} value={value} onChange={onChange} mode={mode} />;
  }
}
```

### Schema Builder Component

```typescript
interface SchemaBuilderProps {
  schema: JSONSchema;
  onChange: (schema: JSONSchema) => void;
  allowRequired?: boolean;
}

// Visual schema editor
function SchemaBuilder({ schema, onChange }: SchemaBuilderProps) {
  // State for managing fields
  const [fields, setFields] = useState(extractFields(schema));

  return (
    <div>
      {fields.map(field => (
        <FieldEditor
          key={field.name}
          field={field}
          onChange={updated => updateField(field.name, updated)}
          onRemove={() => removeField(field.name)}
        />
      ))}
      <AddFieldButton onClick={() => addField()} />
      <JSONPreview schema={schema} />
    </div>
  );
}
```

---

## Components Needed

### 1. SchemaRenderer

Renders UI from schema for viewing/editing data.

### 2. SchemaBuilder

Visual editor for creating/modifying schemas.

### 3. SchemaViewer

Read-only view of schema structure with expand/collapse.

### 4. DataPreview

Shows actual data formatted according to schema.

### 5. FieldPicker

Allows selecting fields from schema for bindings.

---

## Constraints

- **JSON Schema compatibility** — Must support standard JSON Schema features
- **Performance** — Large schemas shouldn't slow UI
- **Accessibility** — All form fields must be accessible
- **Validation** — Real-time validation feedback
- **Nested depth** — Support up to 5 levels of nesting

---

## Success Criteria

- [ ] Schema renders appropriate input for each type
- [ ] Arrays support add/remove items
- [ ] Objects render nested fields
- [ ] Validation errors shown inline
- [ ] Schema builder creates valid JSON Schema
- [ ] Data preview shows runtime values
- [ ] Field picker allows path selection
- [ ] Performance acceptable for complex schemas

---

## Out of Scope

- Schema inference from data
- Custom widgets beyond standard types
- Schema validation rules editor
- Real-time collaboration on schema editing

---

## Open Questions

- How do we handle recursive schemas?
- Should we support JSON Schema $ref?
- How do we handle very large arrays in preview?
- Should schema changes require migration?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Schema Form | Generated input form | Type-appropriate fields |
| Schema Viewer | Schema structure | Tree view, types |
| Schema Builder | Visual editor | Add/edit fields |
| Data Preview | Runtime data | Formatted values |
| Field Picker | Select for binding | Navigable tree |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── dynamic-schema-ui/
│   ├── schema-form.html
│   ├── schema-viewer.html
│   ├── schema-builder.html
│   ├── data-preview.html
│   └── field-picker.html
```

---

## References

- JSON Schema: https://json-schema.org/
- react-jsonschema-form: https://rjsf-team.github.io/react-jsonschema-form/
- Radix UI: https://www.radix-ui.com/
