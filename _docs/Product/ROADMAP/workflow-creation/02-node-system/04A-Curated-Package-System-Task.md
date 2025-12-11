# Task: Curated Package System

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/02-node-system/04-Curated-Package-System.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- WebContainer supports npm package execution in isolated browser environment
- TypeScript type information can be embedded in LLM prompts for accurate code generation
- Package bundling proven viable with existing build tools

**✅ Architecture Decisions:**
- Curated registry ensures quality and security of available packages
- Type information integration with AI generation improves code accuracy
- Runtime package loading enables dynamic capabilities

**✅ Integration Points:**
- WebContainer execution environment ready for package injection
- AI code generation services can incorporate package type information
- Workflow runtime already handles custom code execution

### Current State Analysis

**Existing Infrastructure:**
- WebContainer integration in workflow execution system
- Custom code node generation via AI
- Workflow transpilation and execution pipeline

**Missing Components:**
- No package registry or curation system
- No type information extraction for AI prompts
- No package bundling for browser execution

### Deterministic Decisions

**Package Selection:**
- Focus on data processing, HTTP, and utility libraries initially
- Security-first curation with vetted package versions
- TypeScript-first packages for better type information

**Storage:**
- Package metadata: Database with version, types, and documentation
- Bundled packages: CDN or static hosting for WebContainer
- Type information: Extracted and formatted for LLM consumption

**AI Integration:**
- Include package types and examples in code generation prompts
- Auto-import suggestions based on node requirements
- Type-aware code completion and validation

---

## Overview

### Goal

Build a curated package registry that provides AI code generation with type-safe, well-documented packages. This includes bundling packages for WebContainer execution, embedding type information in AI prompts, and creating a browseable package catalog for users.

### Relevant Research

The workflow system executes custom code in WebContainer (isolated JavaScript runtime). Currently, custom nodes have limited built-in capabilities. By curating a set of vetted packages with embedded type information, we enable AI to generate powerful, correct code.

Key integration points:
- WebContainer execution in workflow runtime
- AI code generation in custom node creation
- Type information feeding into LLM prompts
- Package bundling for browser execution

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/packages/types/registry.ts` | Create | Package registry types | A |
| `lib/packages/types/package.ts` | Create | Individual package types | A |

### Package Infrastructure

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/packages/registry.ts` | Create | Package registry implementation | A |
| `lib/packages/bundler.ts` | Create | Package bundling for WebContainer | A |
| `lib/packages/type-embedder.ts` | Create | Type info for AI prompts | A |
| `lib/packages/packages/*.ts` | Create | Per-package configurations | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/packages/route.ts` | Create | List available packages | B |
| `app/api/packages/[name]/route.ts` | Create | Get package details | B |
| `app/api/packages/request/route.ts` | Create | Request new package | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/PackageBrowser.tsx` | Create | Package browsing UI | C |
| `app/(pages)/workflows/editor/components/PackageDetail.tsx` | Create | Single package view | C |
| `app/(pages)/workflows/editor/components/PackageSearch.tsx` | Create | Search packages | C |

### Build Scripts

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `scripts/bundle-packages.ts` | Create | Bundle packages for production | A |

---

## Part A: Package Infrastructure

### Goal

Create the package registry, bundling system, and type embedding infrastructure.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/packages/types/registry.ts` | Create | Registry types | ~60 |
| `lib/packages/types/package.ts` | Create | Package types | ~80 |
| `lib/packages/registry.ts` | Create | Registry implementation | ~150 |
| `lib/packages/bundler.ts` | Create | Bundle generation | ~200 |
| `lib/packages/type-embedder.ts` | Create | Type embedding | ~150 |
| `lib/packages/packages/ai.ts` | Create | AI SDK config | ~100 |
| `lib/packages/packages/polars.ts` | Create | Polars config | ~100 |
| `lib/packages/packages/index.ts` | Create | Package exports | ~50 |
| `scripts/bundle-packages.ts` | Create | Build script | ~100 |

### Pseudocode

#### `lib/packages/types/package.ts`

```typescript
interface CuratedPackage {
  // Identity
  name: string;                    // npm package name
  version: string;                 // Pinned version
  category: PackageCategory;

  // Documentation
  description: string;             // One-line description
  longDescription?: string;        // Detailed explanation
  documentationUrl?: string;       // External docs link

  // Type Information
  typeDefinitions: string;         // Embedded .d.ts content
  exports: PackageExport[];        // Main exports for AI

  // AI Context
  aiPromptContext: string;         // How to describe to AI
  usageExamples: CodeExample[];    // Example code snippets
  restrictions: string[];          // What NOT to do

  // Metadata
  license: string;
  maintainer: string;
  lastUpdated: Date;
  webContainerCompatible: boolean;
}

interface PackageExport {
  name: string;                    // Export name
  type: 'function' | 'class' | 'constant' | 'type';
  signature: string;               // TypeScript signature
  description: string;
  parameters?: ParameterDoc[];
  returnType?: string;
  example?: string;
}

interface CodeExample {
  title: string;
  description: string;
  code: string;
  inputs?: Record<string, any>;
  expectedOutput?: any;
}

type PackageCategory =
  | 'ai'           // AI/LLM operations
  | 'data'         // Data processing
  | 'text'         // Text manipulation
  | 'validation'   // Schema/data validation
  | 'utility';     // General utilities
```

#### `lib/packages/registry.ts`

```
class PackageRegistry {
  private packages: Map<string, CuratedPackage>

  constructor()
  ├── Load all package configurations from lib/packages/packages/
  ├── Validate each package meets criteria
  └── Index by name and category

  getPackage(name: string): CuratedPackage | undefined
  └── Return package from map

  getPackagesByCategory(category: PackageCategory): CuratedPackage[]
  ├── Filter packages by category
  └── Sort by name

  getAllPackages(): CuratedPackage[]
  └── Return all packages sorted by category then name

  searchPackages(query: string): CuratedPackage[]
  ├── Search name, description, exports
  ├── Score by relevance
  └── Return top matches

  getTypeEmbedding(packages: string[]): string
  ├── For each requested package
  │   ├── Get aiPromptContext
  │   ├── Get key exports with signatures
  │   └── Get best example
  ├── Format as markdown
  └── Return combined embedding

  validatePackage(pkg: CuratedPackage): ValidationResult
  ├── Check all required fields present
  ├── Verify type definitions parse
  ├── Validate examples compile
  └── Return errors/warnings
}

// Singleton instance
export const packageRegistry = new PackageRegistry();
```

#### `lib/packages/bundler.ts`

```
class PackageBundler {
  async bundleAll(): Promise<BundleResult>
  ├── Get all packages from registry
  ├── Create esbuild config
  │   ├── Format: ESM
  │   ├── Target: ES2022
  │   ├── Platform: browser
  │   └── External: none (bundle everything)
  ├── For each package
  │   ├── Create entry point importing all exports
  │   └── Add to bundle
  ├── Run esbuild
  ├── Generate import map for WebContainer
  └── Return bundle + importMap

  async bundlePackage(name: string): Promise<string>
  ├── Get package from registry
  ├── Create single-package bundle
  └── Return bundled code

  generateImportMap(packages: CuratedPackage[]): ImportMap
  ├── For each package
  │   └── Map package name to bundle path
  └── Return import map JSON

  // Output structure:
  // public/packages/
  // ├── bundle.js        (all packages)
  // ├── import-map.json  (import resolution)
  // └── individual/
  //     ├── ai.js
  //     ├── polars.js
  //     └── ...
}
```

#### `lib/packages/type-embedder.ts`

```
class TypeEmbedder {
  generatePromptContext(
    packages: string[],
    taskDescription?: string
  ): string
  ├── Start with header: "## Available Packages"
  ├── If taskDescription, filter to relevant packages
  ├── For each package
  │   ├── Add package header with description
  │   ├── Add key exports (limit to most relevant)
  │   │   ├── Function signature
  │   │   ├── Parameter descriptions
  │   │   └── Return type
  │   ├── Add 1-2 best examples
  │   └── Add restrictions/warnings
  ├── Add footer with general guidance
  └── Return formatted markdown

  selectRelevantPackages(
    allPackages: CuratedPackage[],
    taskDescription: string
  ): CuratedPackage[]
  ├── Analyze task description
  │   ├── Data processing → include polars, csv
  │   ├── AI/LLM → include ai, zod
  │   ├── Text → include marked, sanitize-html
  │   └── etc.
  ├── Score each package by relevance
  └── Return top N packages

  formatExport(exp: PackageExport): string
  ├── Format as TypeScript signature
  ├── Add JSDoc-style description
  └── Return formatted string

  generateRestrictions(): string
  └── Return common restrictions:
      - Do not use fetch() or HTTP calls
      - Do not access filesystem
      - Do not use eval() or dynamic imports
      - Handle errors gracefully
}
```

#### `lib/packages/packages/ai.ts`

```typescript
import { CuratedPackage } from '../types/package';

export const aiPackage: CuratedPackage = {
  name: 'ai',
  version: '^4.0.0',
  category: 'ai',
  description: 'Vercel AI SDK for generating text and structured data with LLMs',
  longDescription: `
    The AI SDK provides a unified interface for working with large language models.
    Use generateText for free-form text, generateObject for structured JSON output,
    and streamText for streaming responses.
  `,
  documentationUrl: 'https://sdk.vercel.ai/docs',

  typeDefinitions: `
    declare module 'ai' {
      export interface GenerateTextOptions {
        model: LanguageModelV1;
        prompt: string;
        system?: string;
        maxTokens?: number;
        temperature?: number;
      }

      export interface GenerateTextResult {
        text: string;
        usage: { promptTokens: number; completionTokens: number };
        finishReason: 'stop' | 'length' | 'content-filter';
      }

      export function generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;

      export interface GenerateObjectOptions<T> {
        model: LanguageModelV1;
        schema: ZodSchema<T>;
        prompt: string;
        system?: string;
      }

      export interface GenerateObjectResult<T> {
        object: T;
        usage: { promptTokens: number; completionTokens: number };
      }

      export function generateObject<T>(options: GenerateObjectOptions<T>): Promise<GenerateObjectResult<T>>;
    }
  `,

  exports: [
    {
      name: 'generateText',
      type: 'function',
      signature: 'generateText(options: GenerateTextOptions): Promise<GenerateTextResult>',
      description: 'Generate free-form text from a prompt',
      parameters: [
        { name: 'model', type: 'LanguageModelV1', description: 'The model to use' },
        { name: 'prompt', type: 'string', description: 'The prompt to send' },
        { name: 'system', type: 'string', description: 'Optional system message', optional: true }
      ],
      returnType: 'Promise<{ text: string, usage: TokenUsage }>',
      example: `const { text } = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: 'Summarize this article'
});`
    },
    {
      name: 'generateObject',
      type: 'function',
      signature: 'generateObject<T>(options: GenerateObjectOptions<T>): Promise<GenerateObjectResult<T>>',
      description: 'Generate structured JSON output matching a Zod schema',
      parameters: [
        { name: 'model', type: 'LanguageModelV1', description: 'The model to use' },
        { name: 'schema', type: 'ZodSchema<T>', description: 'Zod schema for output structure' },
        { name: 'prompt', type: 'string', description: 'The prompt to send' }
      ],
      returnType: 'Promise<{ object: T, usage: TokenUsage }>',
      example: `const { object } = await generateObject({
  model: anthropic('claude-3-5-sonnet-20241022'),
  schema: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string())
  }),
  prompt: 'Analyze this document'
});`
    }
  ],

  aiPromptContext: `
## ai (Vercel AI SDK)
Generate text or structured data using LLMs.

Key Functions:
- generateText({ model, prompt, system? }) → { text: string }
- generateObject({ model, schema, prompt }) → { object: T }

Always use with a model from @ai-sdk/anthropic or @ai-sdk/openai.
Use generateObject when you need structured output (with a Zod schema).
Use generateText for free-form text generation.
`,

  usageExamples: [
    {
      title: 'Summarize Text',
      description: 'Generate a summary of input text',
      code: `import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const { text } = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: \`Summarize the following in 2-3 sentences:\\n\\n\${inputData.text}\`
});

return { summary: text };`,
      inputs: { text: 'Long article content...' },
      expectedOutput: { summary: 'A 2-3 sentence summary...' }
    },
    {
      title: 'Extract Structured Data',
      description: 'Extract specific fields from unstructured text',
      code: `import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const { object } = await generateObject({
  model: anthropic('claude-3-5-sonnet-20241022'),
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    company: z.string().optional()
  }),
  prompt: \`Extract contact info from:\\n\\n\${inputData.text}\`
});

return object;`,
      inputs: { text: 'Contact John Smith at john@acme.com...' },
      expectedOutput: { name: 'John Smith', email: 'john@acme.com', company: 'Acme' }
    }
  ],

  restrictions: [
    'Always import model provider separately (@ai-sdk/anthropic or @ai-sdk/openai)',
    'Do not stream in workflow nodes (use generateText, not streamText)',
    'Keep prompts concise to manage token usage',
    'Use generateObject with Zod schemas for structured output'
  ],

  license: 'Apache-2.0',
  maintainer: 'Vercel',
  lastUpdated: new Date('2024-12-01'),
  webContainerCompatible: true
};
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Registry loads all packages | Call getAllPackages(), verify 20 packages |
| AC-A.2 | Type embedding generates correct format | Call getTypeEmbedding(['ai']), verify markdown |
| AC-A.3 | Bundle generates valid JS | Run bundler, verify output runs in browser |
| AC-A.4 | Import map resolves correctly | Use import map in WebContainer test |
| AC-A.5 | Search finds relevant packages | Search "dataframe", verify polars returned |
| AC-A.6 | Package validation catches errors | Submit invalid package, verify rejected |

---

## Part B: Package API

### Goal

Create API endpoints for listing, searching, and requesting packages.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/packages/route.ts` | Create | List/search packages | ~60 |
| `app/api/packages/[name]/route.ts` | Create | Get package details | ~40 |
| `app/api/packages/request/route.ts` | Create | Request new package | ~80 |

### Pseudocode

#### `app/api/packages/route.ts`

```
GET /api/packages
├── Get query params: category?, search?
├── If search
│   └── Return packageRegistry.searchPackages(search)
├── If category
│   └── Return packageRegistry.getPackagesByCategory(category)
└── Else
    └── Return packageRegistry.getAllPackages()

Response: { packages: CuratedPackage[] }
```

#### `app/api/packages/[name]/route.ts`

```
GET /api/packages/[name]
├── Get package from registry
├── If not found, return 404
└── Return full package details including examples

Response: CuratedPackage
```

#### `app/api/packages/request/route.ts`

```
POST /api/packages/request
├── Validate request body
│   ├── packageName: string (npm package name)
│   ├── useCase: string (why user needs it)
│   └── userId: string (from auth)
├── Check package doesn't already exist
├── Store request in database
├── Optionally notify admin
└── Return request ID

Response: { requestId: string, status: 'pending' }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | List packages returns all | GET /api/packages, verify 20 packages |
| AC-B.2 | Category filter works | GET /api/packages?category=ai, verify filtered |
| AC-B.3 | Search works | GET /api/packages?search=data, verify results |
| AC-B.4 | Get package returns detail | GET /api/packages/ai, verify full details |
| AC-B.5 | Request creates record | POST /api/packages/request, verify stored |

---

## Part C: Package Browser UI

### Goal

Create the frontend UI for browsing, searching, and viewing package documentation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/PackageBrowser.tsx` | Create | Main browser | ~150 |
| `app/(pages)/workflows/editor/components/PackageDetail.tsx` | Create | Package view | ~120 |
| `app/(pages)/workflows/editor/components/PackageSearch.tsx` | Create | Search bar | ~60 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/PackageBrowser.tsx`

```
PackageBrowser({ onInsertExample, onClose })
├── State: selectedCategory, searchQuery, selectedPackage
├── Fetch packages from /api/packages
├── Layout
│   ├── Header with search bar
│   ├── Category tabs (All, AI, Data, Text, Validation, Utility)
│   ├── Package list (filtered by category/search)
│   │   ├── For each package
│   │   │   ├── Package icon (by category)
│   │   │   ├── Name and version
│   │   │   ├── Short description
│   │   │   └── Click → select package
│   └── Detail panel (if package selected)
│       └── Render PackageDetail
├── On package select
│   └── Set selectedPackage, show detail panel
└── On insert
    ├── Call onInsertExample with code
    └── Close browser
```

#### `app/(pages)/workflows/editor/components/PackageDetail.tsx`

```
PackageDetail({ package, onInsertExample })
├── Header
│   ├── Package name and version
│   ├── Category badge
│   └── External docs link
├── Description section
│   └── Long description with markdown
├── Exports section
│   ├── For each export
│   │   ├── Name with type badge
│   │   ├── Signature (monospace)
│   │   ├── Description
│   │   └── Quick example (collapsible)
├── Examples section
│   ├── For each example
│   │   ├── Title and description
│   │   ├── Code block with syntax highlighting
│   │   ├── "Insert Example" button
│   │   └── Input/output preview (collapsible)
├── Restrictions section
│   └── Warning list of don'ts
└── Footer
    └── License and last updated
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Browser shows all packages | Open browser, verify all categories |
| AC-C.2 | Category filter works | Select "AI", verify only AI packages |
| AC-C.3 | Search works | Type "data", verify polars appears |
| AC-C.4 | Detail shows exports | Select "ai", verify generateText shown |
| AC-C.5 | Insert example works | Click insert, verify code added to editor |
| AC-C.6 | External link works | Click docs link, verify opens in new tab |

---

## User Flows

### Flow 1: Find and Use a Package

```
1. User creating custom code node
2. User clicks "Available Packages" button
3. PackageBrowser opens
4. User browses "Data" category
5. User clicks on "nodejs-polars"
6. PackageDetail shows DataFrame operations
7. User finds "Filter DataFrame" example
8. User clicks "Insert Example"
9. Code inserted into editor
10. User modifies for their use case
```

---

## Out of Scope

- Package version selection
- User-uploaded packages
- Package deprecation workflow
- Usage analytics per package
- Package comparison view

---

## Open Questions

- [ ] How do we handle package updates?
- [ ] Should we show "popular" packages first?
- [ ] How do we measure AI's package usage quality?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
