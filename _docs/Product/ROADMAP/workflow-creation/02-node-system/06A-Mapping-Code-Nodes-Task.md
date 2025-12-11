# Task: Mapping Code Nodes

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/02-node-system/06-Mapping-Code-Nodes.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Build a system that detects schema mismatches between workflow steps and automatically generates mapping nodes to transform data. When users connect steps with incompatible schemas, the system prompts for confirmation, generates transformation code, and inserts a mapping node.

### Relevant Research

The workflow system uses `.map()` blocks to transform data between steps. Currently in `workflow.ts`:
```typescript
.map(async ({ inputData, getStepResult, getInitData }) => {
  return {
    recipient_email: getInitData()["Email Address"],
    subject: getStepResult("BDHS3ZinvIN94tv0l35Sx")?.title,
  };
})
```

This feature automates the creation of these mapping blocks by:
1. Analyzing source and target schemas
2. Detecting field matches and mismatches
3. Generating transformation code
4. Inserting as a visible node on canvas

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/mapping.ts` | Create | Mapping types | A |
| `app/api/workflows/types/workflow.ts` | Modify | Add mapping node type | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/mapping/analyze/route.ts` | Create | Analyze schema compatibility | A |
| `app/api/workflows/mapping/generate/route.ts` | Create | Generate mapping code | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/schema-analyzer.ts` | Create | Schema comparison | A |
| `app/api/workflows/services/field-matcher.ts` | Create | Field matching logic | A |
| `app/api/workflows/services/mapping-generator.ts` | Create | Code generation | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/canvas-slice.ts` | Modify | Handle mapping insertion | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/MappingNode.tsx` | Create | Mapping node component | B |
| `app/(pages)/workflows/editor/components/MappingEditor.tsx` | Create | Editor panel | B |
| `app/(pages)/workflows/editor/components/MismatchPrompt.tsx` | Create | Confirmation dialog | B |
| `app/(pages)/workflows/editor/components/SchemaCompare.tsx` | Create | Side-by-side view | B |

---

## Part A: Backend Schema Analysis and Mapping

### Goal

Build services that analyze schema compatibility and generate mapping code.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/mapping.ts` | Create | Type definitions | ~100 |
| `app/api/workflows/mapping/analyze/route.ts` | Create | Analysis endpoint | ~60 |
| `app/api/workflows/mapping/generate/route.ts` | Create | Generation endpoint | ~80 |
| `app/api/workflows/services/schema-analyzer.ts` | Create | Schema analysis | ~200 |
| `app/api/workflows/services/field-matcher.ts` | Create | Field matching | ~250 |
| `app/api/workflows/services/mapping-generator.ts` | Create | Code generation | ~200 |

### Pseudocode

#### `app/api/workflows/types/mapping.ts`

```typescript
interface SchemaAnalysisRequest {
  sourceSchema: JSONSchema;
  targetSchema: JSONSchema;
  sourceStepId: string;
  targetStepId: string;
}

interface SchemaAnalysisResult {
  compatible: boolean;
  mappingRequired: boolean;
  complexity: MappingComplexity;
  fieldMappings: FieldMapping[];
  unmappedSource: string[];       // Source fields not used
  unmappedTarget: string[];       // Target fields not filled
  warnings: string[];
  requiresUserConfirmation: boolean;
}

type MappingComplexity =
  | 'identical'       // No mapping needed
  | 'trivial'         // Just field renames
  | 'simple'          // Renames + basic transforms
  | 'complex'         // Needs AI transformation
  | 'incompatible';   // Cannot auto-map

interface FieldMapping {
  sourcePath: string;           // e.g., "data.requirements"
  targetPath: string;           // e.g., "skills"
  matchType: MatchType;
  transformation?: string;      // e.g., ".map(x => x.toLowerCase())"
  confidence: number;           // 0-1
}

type MatchType =
  | 'exact'           // Same name
  | 'case'            // Case difference only
  | 'variation'       // Common variation (email/emailAddress)
  | 'semantic'        // AI-detected semantic match
  | 'type'            // Same type, different name
  | 'custom';         // User-defined

interface MappingGenerationRequest {
  sourceSchema: JSONSchema;
  targetSchema: JSONSchema;
  fieldMappings: FieldMapping[];
  useAiForTransform?: boolean;
  transformDescription?: string;
}

interface MappingGenerationResult {
  code: string;
  explanation: string;
  warnings?: string[];
}
```

#### `app/api/workflows/services/schema-analyzer.ts`

```
class SchemaAnalyzer {
  analyze(request: SchemaAnalysisRequest): SchemaAnalysisResult
  ├── Flatten both schemas to path lists
  │   ├── { name: string } → ["name"]
  │   ├── { data: { items: [] } } → ["data", "data.items"]
  ├── Check for identical schemas
  │   └── If identical, return { compatible: true, mappingRequired: false }
  ├── For each target path
  │   ├── Find best match in source paths
  │   │   └── Use fieldMatcher.findBestMatch()
  │   ├── If found with high confidence
  │   │   └── Add to fieldMappings
  │   ├── If found with low confidence
  │   │   └── Add to fieldMappings with warning
  │   └── If not found
  │       └── Add to unmappedTarget
  ├── Calculate unmappedSource (source paths not used)
  ├── Determine complexity
  │   ├── All exact matches → 'trivial'
  │   ├── All matches with confidence > 0.8 → 'simple'
  │   ├── Some semantic matches → 'complex'
  │   └── Many unmapped fields → 'incompatible'
  ├── Set requiresUserConfirmation
  │   └── true if complexity >= 'simple'
  └── Return SchemaAnalysisResult

  private flattenSchema(schema: JSONSchema, prefix: string = ''): PathInfo[]
  ├── If type === 'object'
  │   ├── For each property
  │   │   └── Recurse with prefix + property name
  │   └── Collect all paths
  ├── If type === 'array'
  │   └── Recurse with prefix + '[]' for items
  └── Return flat list of { path, type, required }
}
```

#### `app/api/workflows/services/field-matcher.ts`

```
class FieldMatcher {
  findBestMatch(
    targetPath: string,
    targetType: string,
    sourcePaths: PathInfo[]
  ): FieldMapping | null
  ├── Try exact match
  │   ├── Look for source.path === target.path
  │   └── If found, return with confidence: 1.0, matchType: 'exact'
  ├── Try case-insensitive match
  │   ├── Look for source.path.toLowerCase() === target.path.toLowerCase()
  │   └── If found, return with confidence: 0.95, matchType: 'case'
  ├── Try variation match
  │   ├── Check COMMON_VARIATIONS map
  │   │   ├── email ↔ emailAddress, mail
  │   │   ├── name ↔ fullName, displayName
  │   │   ├── id ↔ identifier, uuid
  │   │   └── etc.
  │   └── If found, return with confidence: 0.9, matchType: 'variation'
  ├── Try prefix/suffix stripping
  │   ├── Strip common prefixes: user, item, data, input, output
  │   ├── Strip common suffixes: Id, Name, Data
  │   └── If match, return with confidence: 0.85, matchType: 'variation'
  ├── Try type-compatible match
  │   ├── Find sources with same type
  │   ├── Calculate string similarity (Levenshtein)
  │   └── If similarity > 0.7, return with confidence: 0.7, matchType: 'type'
  ├── Try semantic match (if complex)
  │   ├── Call LLM to assess semantic similarity
  │   │   └── "Is 'requirements' semantically equivalent to 'skills'?"
  │   └── If yes, return with confidence from LLM, matchType: 'semantic'
  └── Return null if no match

  private readonly COMMON_VARIATIONS: Map<string, string[]> = new Map([
    ['email', ['emailAddress', 'mail', 'userEmail', 'contactEmail']],
    ['name', ['fullName', 'displayName', 'userName', 'title']],
    ['id', ['identifier', 'uuid', 'key', 'externalId']],
    ['phone', ['phoneNumber', 'telephone', 'mobile', 'contactPhone']],
    ['address', ['location', 'streetAddress', 'fullAddress']],
    ['date', ['timestamp', 'createdAt', 'datetime', 'time']],
    ['description', ['desc', 'summary', 'details', 'body']],
    ['url', ['link', 'href', 'uri', 'website']],
    ['count', ['total', 'number', 'quantity', 'amount']],
  ]);

  private calculateSimilarity(a: string, b: string): number
  ├── Normalize: lowercase, remove special chars
  ├── Calculate Levenshtein distance
  ├── Convert to similarity: 1 - (distance / max(len(a), len(b)))
  └── Return 0-1 score
}
```

#### `app/api/workflows/services/mapping-generator.ts`

```
class MappingGenerator {
  generate(request: MappingGenerationRequest): MappingGenerationResult
  ├── Group mappings by complexity
  │   ├── Direct: sourcePath === targetPath
  │   ├── Rename: different names, same type
  │   └── Transform: needs conversion
  ├── If all direct
  │   └── Return pass-through code: `return inputData;`
  ├── If mostly renames
  │   ├── Generate destructuring code
  │   │   └── `const { oldName: newName } = inputData;`
  │   └── Return renamed object
  ├── If transforms needed
  │   ├── If useAiForTransform
  │   │   └── Generate AI transformation code
  │   └── Else
  │       └── Generate basic transformation code
  └── Return MappingGenerationResult

  private generateRenameCode(mappings: FieldMapping[]): string
  ├── Build object with renamed fields
  │   ```typescript
  │   return {
  │     newField1: inputData.oldField1,
  │     newField2: inputData.oldField2,
  │   };
  │   ```
  └── Return code string

  private generateTransformCode(
    mappings: FieldMapping[],
    description: string
  ): string
  ├── Call code generator service
  │   └── Use Bespoke Code Node Generation
  ├── With context: source schema, target schema, mappings
  └── Return generated code

  private generateAiTransformCode(
    sourceSchema: JSONSchema,
    targetSchema: JSONSchema,
    description: string
  ): string
  ├── Build AI SDK code template
  │   ```typescript
  │   import { generateObject } from 'ai';
  │   import { anthropic } from '@ai-sdk/anthropic';
  │   import { z } from 'zod';

  │   const { object } = await generateObject({
  │     model: anthropic('claude-3-5-sonnet-20241022'),
  │     schema: targetZodSchema,
  │     prompt: `Transform this data: ${JSON.stringify(inputData)}\n\n${description}`
  │   });
  │   return object;
  │   ```
  └── Return code string
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Identical schemas need no mapping | Analyze same schema, verify mappingRequired: false |
| AC-A.2 | Field renames detected | { name } → { fullName }, verify matchType: 'variation' |
| AC-A.3 | Case differences detected | { Email } → { email }, verify matchType: 'case' |
| AC-A.4 | Complex transforms flagged | { body } → { items[] }, verify complexity: 'complex' |
| AC-A.5 | Code generation works | Generate for rename, verify valid TypeScript |
| AC-A.6 | AI transform generates | Request AI transform, verify generateObject code |

---

## Part B: Frontend Mapping UI

### Goal

Create UI components for displaying mapping nodes, editing mappings, and confirming mismatch resolution.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/MappingNode.tsx` | Create | Node display | ~120 |
| `app/(pages)/workflows/editor/components/MappingEditor.tsx` | Create | Edit panel | ~200 |
| `app/(pages)/workflows/editor/components/MismatchPrompt.tsx` | Create | Confirmation | ~120 |
| `app/(pages)/workflows/editor/components/SchemaCompare.tsx` | Create | Schema view | ~150 |
| `app/(pages)/workflows/editor/store/slices/canvas-slice.ts` | Modify | Handle mapping | ~50 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/MappingNode.tsx`

```
MappingNode({ data, selected })
├── Compact view (default)
│   ├── "Mapping" badge with transform icon
│   ├── Brief description: "3 field mappings"
│   ├── Expand indicator
│   └── Input/output handles
├── Expanded view (on click)
│   ├── List of mappings
│   │   ├── source → target for each
│   │   └── Confidence indicator (dot color)
│   ├── "Edit" button → opens MappingEditor
│   └── Collapse button
├── Visual indicators
│   ├── Green border: all high confidence
│   ├── Yellow border: some low confidence
│   └── Red border: unmapped required fields
└── On double-click
    └── Open MappingEditor panel
```

#### `app/(pages)/workflows/editor/components/MappingEditor.tsx`

```
MappingEditor({ nodeId, onSave, onClose })
├── Header: "Edit Mapping"
├── Schema comparison
│   └── Render SchemaCompare component
├── Mappings list
│   ├── For each mapping
│   │   ├── Source field (draggable)
│   │   ├── Arrow indicator with confidence
│   │   ├── Target field (drop target)
│   │   ├── Transformation badge (if any)
│   │   └── Remove button
│   └── "Add mapping" button
├── Unmapped fields section
│   ├── Unmapped source fields (can drag)
│   └── Unmapped target fields (shows required)
├── Code preview
│   ├── Generated code (read-only or editable)
│   ├── "Regenerate" button
│   └── "Edit code" toggle
├── Actions
│   ├── "Save" button
│   ├── "Cancel" button
│   └── "Delete mapping node" button
└── On drag mapping
    ├── Update fieldMappings
    ├── Regenerate code
    └── Update preview
```

#### `app/(pages)/workflows/editor/components/MismatchPrompt.tsx`

```
MismatchPrompt({ analysis, onConfirm, onCancel })
├── Dialog overlay
├── Header: "Schema Mismatch Detected"
├── Comparison preview
│   └── Compact SchemaCompare
├── Analysis summary
│   ├── Complexity badge
│   ├── Number of auto-mappings
│   ├── Unmapped fields list
│   └── Confidence summary
├── Options based on complexity
│   ├── If trivial/simple
│   │   └── "Create mapping" (primary)
│   ├── If complex
│   │   ├── "Create AI-powered mapping" (primary)
│   │   ├── "Create basic mapping" (secondary)
│   │   └── Description input for AI
│   ├── If incompatible
│   │   ├── Warning message
│   │   └── "Create empty mapping" (secondary)
│   └── Always: "Cancel" button
├── Preview of generated code (collapsible)
└── On confirm
    ├── Call mapping generator
    ├── Insert mapping node
    └── Close prompt
```

#### `app/(pages)/workflows/editor/components/SchemaCompare.tsx`

```
SchemaCompare({ sourceSchema, targetSchema, mappings })
├── Two-column layout
│   ├── Left: Source schema tree
│   │   ├── For each field
│   │   │   ├── Field name
│   │   │   ├── Type badge
│   │   │   └── Required indicator
│   │   └── Nested fields indented
│   ├── Center: Mapping lines
│   │   ├── SVG lines connecting mapped fields
│   │   └── Color by confidence
│   └── Right: Target schema tree
│       └── Same structure as left
├── Interaction
│   ├── Hover field → highlight mapping line
│   ├── Click field → show details
│   └── (In editor) drag to create mapping
└── Legend
    ├── Green line: high confidence
    ├── Yellow line: medium confidence
    └── Red line: low confidence
```

### Integration with Canvas

```typescript
// In canvas-slice.ts, handle edge creation
onConnect(connection: Connection) {
  const sourceNode = getNode(connection.source);
  const targetNode = getNode(connection.target);

  // Analyze schema compatibility
  const analysis = await analyzeSchemas(
    sourceNode.data.outputSchema,
    targetNode.data.inputSchema
  );

  if (analysis.mappingRequired) {
    if (analysis.requiresUserConfirmation) {
      // Show MismatchPrompt dialog
      openMismatchPrompt(analysis, connection);
    } else {
      // Auto-insert mapping node
      insertMappingNode(connection, analysis);
    }
  } else {
    // Direct connection
    addEdge(connection);
  }
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Mapping node renders | Add mapping, verify badge and handles |
| AC-B.2 | Editor opens on click | Click mapping node, verify panel opens |
| AC-B.3 | Schema comparison shows mappings | Open editor, verify lines connect fields |
| AC-B.4 | Mismatch prompt appears | Connect incompatible nodes, verify dialog |
| AC-B.5 | Confirm creates mapping | Click create, verify node inserted |
| AC-B.6 | Drag mapping works | Drag field to target, verify mapping added |

---

## User Flows

### Flow 1: Auto-Mapping on Connection

```
1. User drags edge from Step A to Step B
2. System analyzes: Step A outputs { email }, Step B expects { userEmail }
3. Analysis: complexity='trivial', 1 variation match
4. Since trivial, auto-insert mapping node
5. Mapping node appears between A and B
6. Edges: A → Mapping → B
7. User can click to review/edit
```

### Flow 2: Prompted Complex Mapping

```
1. User drags edge from "Extract" to "Analyze"
2. System analyzes: Extract outputs { rawText }, Analyze expects { items: [] }
3. Analysis: complexity='complex', requires transformation
4. MismatchPrompt appears
5. User sees schema comparison and options
6. User types: "Parse the raw text into list items"
7. User clicks "Create AI-powered mapping"
8. System generates AI transform code
9. Mapping node inserted with generated code
```

---

## Out of Scope

- Mapping suggestions based on usage history
- Mapping templates library
- Multi-hop mappings (A → intermediate → B)
- Mapping optimization

---

## Open Questions

- [ ] Should mapping nodes be collapsible on canvas?
- [ ] How do we handle array index mappings?
- [ ] Should we cache analysis results?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
