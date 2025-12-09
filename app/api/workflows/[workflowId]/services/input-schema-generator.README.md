# Input Schema Generator Service

> Converts workflow runtime input configurations to JSON Schema.

**Service:** `input-schema-generator.ts`  
**Domain:** Workflows

---

## Purpose

This service converts workflow runtime input configurations (defined in the workflow editor) into JSON Schema format for input validation and transpilation. It bridges the gap between the editor's input definition format and the schema format needed for workflow execution.

**Product Value:** Enables workflows to have typed, validated inputs. When users define workflow inputs in the editor (like "URL" and "Email Address"), this service converts those definitions to schemas that validate inputs at runtime, ensuring workflows receive correct data types and required fields.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `generateInputSchemaFromRuntimeInputs()` | Converts an array of runtime input configurations to a JSON Schema object with properties and required fields. | During workflow transpilation and runtime construction - converts editor input definitions to validation schemas |

---

## Approach

The service maps each runtime input configuration to a JSON Schema property, converts input types (string, number, boolean, array, object) to JSON Schema types, preserves descriptions and default values, and builds the required array from inputs marked as required. It returns a complete JSON Schema object ready for validation or further conversion to Zod.

---

## Public API

### `generateInputSchemaFromRuntimeInputs(runtimeInputs: RuntimeInputConfig[]): JSONSchema`

**What it does:** Converts workflow runtime input configurations to a JSON Schema object that can be used for input validation and schema conversion.

**Product Impact:** This function enables workflow inputs to be validated. When workflows execute, their inputs are validated against the schema generated from editor definitions, ensuring data correctness.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `runtimeInputs` | RuntimeInputConfig[] | Yes | Array of input configurations from the workflow editor |

**RuntimeInputConfig:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Input field name |
| `type` | "string" \| "number" \| "boolean" \| "array" \| "object" | Input data type |
| `description` | string | Optional input description |
| `default` | any | Optional default value |
| `required` | boolean | Whether input is required |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | JSONSchema | JSON Schema object with properties and required fields |

**Process:**

```
generateInputSchemaFromRuntimeInputs(runtimeInputs): JSONSchema
├── If runtimeInputs is empty: Return empty object schema
├── Initialize empty properties object and required array
├── **For each input in runtimeInputs:**
│   ├── Build propertySchema:
│   │   ├── type: Map input.type to JSON Schema type
│   │   ├── description: Add if present
│   │   └── default: Add if present
│   ├── Add property to properties object using input.key
│   └── **If input.required:**
│       └── Add input.key to required array
└── Return { type: "object", properties, required }
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/app/api/workflows/types/workflow-settings` | RuntimeInputConfig type |
| `@/app/api/workflows/types/schemas` | JSONSchema type |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Builder Service | `app/api/workflows/services/workflow-builder.ts` | Converts runtime inputs to Zod schemas for workflow construction |
| Workflow Transpiler | `app/api/workflows/[workflowId]/services/transpiler/` | Generates input schemas in transpiled workflow code |

---

## Design Decisions

### Why JSON Schema as intermediate format?

**Decision:** Converts to JSON Schema first, then to Zod in workflow builder.

**Rationale:** JSON Schema is a standard format that's portable and can be used in multiple contexts (validation, documentation, API specs). The workflow builder then converts to Zod for Mastra compatibility. This separation keeps concerns clear.

### Why empty schema for no inputs?

**Decision:** Returns empty object schema (`{ type: "object", properties: {}, required: [] }`) when no inputs are provided.

**Rationale:** Workflows can have no inputs. An empty schema validates correctly (allows empty objects) and is clearer than null or undefined.

---

## Error Handling

- Empty/null inputs: Returns empty schema gracefully
- Invalid input types: Defaults to "string" type (permissive)

---

## Related Docs

- [Workflow Builder Service README](../../services/workflow-builder.README.md) - Uses this to convert inputs to Zod schemas
- [Workflow Types](../../types/workflow-settings.ts) - RuntimeInputConfig type definition

---

## Future Improvements

- [ ] Add more input types (date, enum, etc.)
- [ ] Add input validation rules (min/max, patterns, etc.)
- [ ] Add nested object/array schema generation
- [ ] Add schema composition (oneOf, anyOf, etc.)

