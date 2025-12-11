# Mapping Code Nodes

**Status:** Draft
**Priority:** P0
**North Star:** User connects "Extract Job Requirements" (outputs `{ requirements: string[] }`) to "Generate Cover Letter" (expects `{ jobRequirements: { title: string, skills: string[] } }`) — system auto-generates a mapping node that transforms the data.

---

## Problem Statement

Workflow steps often produce output in a different shape than the next step expects. Currently:
1. Users must manually create code nodes to transform data
2. Schema mismatches cause runtime errors
3. Users don't know what transformation is needed
4. Small differences (field names, nesting) require disproportionate effort

**The Gap:** No automatic detection and resolution of schema mismatches between steps.

---

## User Value

- **Seamless connections** — Connect any compatible steps without manual mapping
- **Automatic transformation** — System generates the glue code
- **Clear visibility** — See exactly how data is transformed
- **Error prevention** — Catch mismatches at design time, not runtime
- **Intelligent suggestions** — AI proposes the most sensible mapping

---

## User Flows

### Flow 1: Automatic Mapping on Connection

```
1. User drags edge from "Extract Job Data" to "Generate Cover Letter"
2. System analyzes schemas:
   - Source: { title: string, requirements: string[], company: string }
   - Target: { jobTitle: string, skills: string[], companyName: string }
3. System detects: compatible but not identical
4. System auto-inserts mapping node between steps
5. Mapping node shows:
   - title → jobTitle
   - requirements → skills
   - company → companyName
6. User can review and adjust
7. Connection completes with mapping in place
```

### Flow 2: User-Prompted Mapping

```
1. User connects steps
2. System detects complex mismatch:
   - Source: { posting: { body: string } }
   - Target: { requirements: string[], qualifications: string[] }
3. System shows prompt:
   "These schemas don't match directly. I can generate
    a mapping that extracts requirements from the posting body.
    Would you like me to create this mapping?"
4. User clicks "Create Mapping"
5. System generates mapping node with AI transformation:
   ```typescript
   const { object } = await generateObject({
     model: anthropic('claude-3-5-sonnet'),
     schema: z.object({
       requirements: z.array(z.string()),
       qualifications: z.array(z.string())
     }),
     prompt: `Extract requirements and qualifications from:\n\n${inputData.posting.body}`
   });
   return object;
   ```
6. Mapping node inserted with generated code
```

### Flow 3: Edit Existing Mapping

```
1. User sees mapping node on canvas
2. User clicks to expand/edit
3. Mapping editor shows:
   - Source schema (left)
   - Target schema (right)
   - Current mappings (lines between fields)
   - Generated code (bottom)
4. User can:
   - Drag to create new mappings
   - Delete existing mappings
   - Add transformations (e.g., .toLowerCase())
   - Edit generated code directly
5. Code regenerates based on mapping changes
```

### Flow 4: Mismatch Warning

```
1. User tries to connect incompatible steps:
   - Source: { count: number }
   - Target: { userData: { name: string, email: string } }
2. System shows warning:
   "These schemas appear incompatible. The source produces
    a count, but the target expects user data."
3. Options presented:
   - "Create custom mapping anyway"
   - "Cancel connection"
   - "View schema details"
4. If user proceeds, empty mapping node created
5. User must fill in transformation logic
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/types/workflow.ts` | Schema definitions | `inputSchema`, `outputSchema` |
| `app/api/workflows/services/step-generator.ts` | Step code generation | `.map()` blocks |
| `app/(pages)/workflows/editor/` | Canvas and connections | Edge handling |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auto-insert vs prompt | Prompt user for non-trivial mappings | User should confirm transformations |
| Mapping representation | Code node (not special type) | Consistency, flexibility |
| AI involvement | Use AI for complex transformations | Field renaming doesn't need AI |
| Visual representation | Special "mapping" badge on node | Clear purpose at a glance |

---

## Architecture

### Schema Compatibility Analyzer

```typescript
interface CompatibilityResult {
  compatible: boolean;
  mappingRequired: boolean;
  mappingComplexity: 'trivial' | 'rename' | 'transform' | 'incompatible';
  suggestedMappings: FieldMapping[];
  warnings: string[];
}

interface FieldMapping {
  sourcePath: string;         // e.g., "requirements"
  targetPath: string;         // e.g., "skills"
  transformation?: string;    // e.g., "map(r => r.toLowerCase())"
  confidence: number;         // 0-1
}
```

### Compatibility Levels

| Level | Description | Auto-Action |
|-------|-------------|-------------|
| **Identical** | Schemas match exactly | Direct connection |
| **Trivial** | Same structure, different field names | Auto-generate rename mapping |
| **Rename** | Field renames with obvious matches | Suggest mapping, user confirms |
| **Transform** | Requires data transformation | Prompt user, generate with AI |
| **Incompatible** | No reasonable mapping exists | Warn user, require manual code |

### Mapping Code Generation

```
Source Schema + Target Schema
          ↓
┌─────────────────────────────────────────┐
│         Field Matcher                   │
│  - Exact name match                     │
│  - Fuzzy name match (camelCase, etc.)   │
│  - Type-compatible match                │
│  - Semantic match (AI for complex)      │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│         Mapping Generator               │
│  - Simple: direct assignment            │
│  - Rename: object destructure           │
│  - Transform: AI-generated code         │
└─────────────────────────────────────────┘
          ↓
Mapping Code Node
```

### Field Matching Strategies

```typescript
// Strategy 1: Exact match
source.name === target.name

// Strategy 2: Case-insensitive
source.name.toLowerCase() === target.name.toLowerCase()

// Strategy 3: Common variations
const variations = {
  'email': ['emailAddress', 'mail', 'userEmail'],
  'name': ['fullName', 'displayName', 'userName'],
  'id': ['identifier', 'uuid', 'key'],
};

// Strategy 4: Prefix/suffix stripping
stripPrefix(source.name, ['user', 'item', 'data']) === target.name

// Strategy 5: Type compatibility
source.type === target.type && levenshtein(source.name, target.name) < 3

// Strategy 6: Semantic (AI)
"Does 'requirements' semantically map to 'skills'?" → yes
```

---

## Constraints

- **User confirmation** — Non-trivial mappings require user approval
- **Reversibility** — User can remove mapping and reconnect directly
- **Visibility** — Mapping nodes clearly show transformation
- **Performance** — Schema analysis should be fast (<100ms)
- **Nested schemas** — Must handle deeply nested objects/arrays

---

## Success Criteria

- [ ] Direct connection works for identical schemas
- [ ] Rename mappings auto-generated for obvious field matches
- [ ] Complex mappings prompt user before insertion
- [ ] Generated code passes validation
- [ ] Visual indicator shows mapping nodes clearly
- [ ] User can edit mapping code
- [ ] Incompatible schemas show warning
- [ ] Mapping works with arrays and nested objects

---

## Out of Scope

- Multi-step mapping (A → B → C transformation)
- Mapping templates/presets
- Mapping version history
- Automatic mapping optimization

---

## Open Questions

- Should we show mapping in the edge line or as a separate node?
- How do we handle optional fields in mapping?
- Should mappings be collapsible/expandable on canvas?
- How do we handle array-to-single transformations?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Mapping Node | Canvas appearance | Badge, compact view |
| Mapping Editor | Edit interface | Source/target schemas, drag mapping |
| Mismatch Prompt | User decision | Options, schema preview |
| Mapping Code | Generated code view | Editable code, regenerate button |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── mapping-nodes/
│   ├── mapping-node.html
│   ├── mapping-editor.html
│   ├── mismatch-prompt.html
│   └── mapping-code.html
```

---

## References

- Workflow types: `app/api/workflows/types/workflow.ts`
- Current `.map()` pattern: `_tables/workflows/wf-*/workflow.ts`
- JSON Schema: https://json-schema.org/
