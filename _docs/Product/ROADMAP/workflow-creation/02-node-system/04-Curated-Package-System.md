# Curated Package System

**Status:** Draft
**Priority:** P0
**North Star:** Enable AI to generate bespoke code that uses well-known, type-safe packages (Vercel AI SDK, Polars) without hallucinating APIs or introducing security vulnerabilities.

---

## Problem Statement

When AI generates custom code for workflow nodes, it faces two risks:

1. **API Hallucination** — The AI might invent function signatures that don't exist
2. **Security Vulnerabilities** — Arbitrary package usage could introduce malicious code

Current AI code generation either:
- Uses generic JavaScript (limited capability)
- Allows any package (security risk)
- Requires manual verification (defeats automation)

**The Gap:** No curated, type-safe package ecosystem for AI code generation.

---

## User Value

- **Powerful bespoke nodes** — Access to real capabilities (AI SDK, data processing, HTTP)
- **Safe by default** — Only vetted packages available
- **Reliable code** — Type information prevents hallucinated APIs
- **Extensible** — Users can request new packages; admins can curate
- **Learning resource** — Package documentation teaches users what's possible

---

## Package Selection Criteria

A package must meet ALL criteria to be included:

| Criterion | Why It Matters | Example |
|-----------|---------------|---------|
| **Well-documented** | AI needs accurate type/doc information | Vercel AI SDK has excellent docs |
| **Type-safe** | TypeScript types prevent hallucination | `generateText()` has strict params |
| **Actively maintained** | Security patches, compatibility | Weekly npm updates |
| **No native dependencies** | WebContainer compatibility | Pure JS, no node-gyp |
| **Scoped functionality** | Clear purpose, no bloat | Polars for data, not Lodash |
| **No network I/O** | Composio handles external APIs | No fetch, axios |
| **Deterministic** | Reproducible results | No random without seed |

---

## Initial Package List (MECE)

### 1. AI & Language Processing

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `ai` | ^4.0.0 | Vercel AI SDK for LLM calls | `generateText`, `generateObject`, `streamText` |
| `@ai-sdk/anthropic` | ^1.0.0 | Claude provider | `anthropic()` model provider |
| `@ai-sdk/openai` | ^1.0.0 | OpenAI provider | `openai()` model provider |
| `zod` | ^3.22.0 | Schema definition for structured output | `z.object`, `z.string`, etc. |

### 2. Data Processing & Transformation

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `nodejs-polars` | ^0.14.0 | DataFrame operations | `pl.DataFrame`, `select`, `filter`, `groupBy` |
| `date-fns` | ^3.0.0 | Date manipulation | `format`, `parse`, `addDays`, `differenceInDays` |
| `decimal.js` | ^10.4.0 | Precise numeric calculations | `Decimal` for financial math |
| `uuid` | ^9.0.0 | ID generation | `v4()` for unique identifiers |

### 3. Text & Content Processing

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `marked` | ^12.0.0 | Markdown parsing | `marked.parse()` |
| `sanitize-html` | ^2.11.0 | HTML sanitization | `sanitizeHtml()` |
| `csv-parse` | ^5.5.0 | CSV parsing | `parse()` |
| `csv-stringify` | ^6.4.0 | CSV generation | `stringify()` |
| `yaml` | ^2.3.0 | YAML parsing/generation | `parse`, `stringify` |

### 4. String & Pattern Matching

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `validator` | ^13.11.0 | String validation | `isEmail`, `isURL`, `isUUID` |
| `slugify` | ^1.6.0 | URL-safe strings | `slugify()` |
| `crypto-js` | ^4.2.0 | Hashing (non-crypto) | `SHA256`, `MD5` for checksums |

### 5. Schema & Validation

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `ajv` | ^8.12.0 | JSON Schema validation | `Ajv.validate()` |
| `json-schema-to-typescript` | ^13.0.0 | Schema to types | `compile()` |

### 6. Utilities

| Package | Version | Purpose | Key APIs |
|---------|---------|---------|----------|
| `lodash-es` | ^4.17.0 | Collection utilities | `groupBy`, `sortBy`, `uniqBy` |
| `ms` | ^2.1.0 | Time string parsing | `ms('1 day')` → 86400000 |
| `bytes` | ^3.1.0 | Byte string parsing | `bytes('1kb')` → 1024 |

---

## Architecture

### Package Registry

```typescript
interface CuratedPackage {
  name: string;
  version: string;
  category: PackageCategory;
  description: string;
  documentation: string;        // URL or embedded
  typeDefinitions: string;      // .d.ts content
  exampleUsage: string[];       // Code examples
  aiPromptContext: string;      // Guidance for AI
  restrictions?: string[];      // What NOT to use
}

type PackageCategory =
  | 'ai'
  | 'data'
  | 'text'
  | 'validation'
  | 'utility';
```

### Type Embedding for AI

For each package, we embed type information in the AI prompt:

```
Available Packages:

## @ai-sdk/anthropic
Purpose: Create Claude model instances for AI operations
Types:
  anthropic(modelId: string): LanguageModelV1
  - modelId: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | ...
Example:
  import { anthropic } from '@ai-sdk/anthropic';
  const model = anthropic('claude-3-5-sonnet-20241022');

## ai
Purpose: Core AI SDK for text and structured generation
Types:
  generateText({ model, prompt, system? }): Promise<{ text: string }>
  generateObject({ model, schema, prompt }): Promise<{ object: T }>
  streamText({ model, prompt }): AsyncIterable<string>
Example:
  import { generateText } from 'ai';
  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt: 'Summarize this document'
  });

## nodejs-polars
Purpose: DataFrame operations for tabular data
Types:
  pl.DataFrame(data: Record<string, any>[]): DataFrame
  df.select(columns: string[]): DataFrame
  df.filter(predicate: Expr): DataFrame
  df.groupBy(columns: string[]): GroupBy
Example:
  import pl from 'nodejs-polars';
  const df = pl.DataFrame(data);
  const result = df.filter(pl.col('age').gt(30)).select(['name', 'email']);
```

### WebContainer Bundling

Curated packages are pre-bundled for WebContainer:

```
lib/packages/
├── bundle.js           # All packages bundled
├── types/             # Type definitions
│   ├── ai.d.ts
│   ├── polars.d.ts
│   └── ...
└── registry.json      # Package metadata
```

---

## User Flows

### Flow 1: AI Code Generation with Packages

```
1. User creates custom code node
2. User describes: "Summarize the input text using Claude"
3. System includes package context in AI prompt
4. AI generates code:
   import { generateText } from 'ai';
   import { anthropic } from '@ai-sdk/anthropic';

   const { text } = await generateText({
     model: anthropic('claude-3-5-sonnet-20241022'),
     prompt: `Summarize: ${inputData.text}`
   });
   return { summary: text };
5. Code validated against package types
6. Code executed in WebContainer with pre-bundled packages
```

### Flow 2: Browse Available Packages

```
1. User opens code node editor
2. User clicks "Available Packages" panel
3. User sees categorized package list
4. User clicks on "ai" package
5. User sees:
   - Description
   - Available functions
   - Type signatures
   - Examples
6. User clicks "Insert Example"
7. Code snippet inserted into editor
```

### Flow 3: Request New Package

```
1. User needs functionality not in curated list
2. User clicks "Request Package"
3. User enters package name and use case
4. Request submitted for review
5. Admin reviews against criteria
6. If approved, package added to curated list
7. User notified when available
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Initial package count | ~20 packages | Cover common needs without overwhelming |
| Package versioning | Pinned versions | Reproducibility, prevent breaking changes |
| Type embedding | Inline in prompts | AI needs context at generation time |
| Execution environment | WebContainer | Isolated, secure sandboxing |
| Update frequency | Monthly review | Balance stability with updates |

---

## Constraints

- **WebContainer limits** — No native modules, no filesystem (beyond sandbox)
- **Bundle size** — Must fit in WebContainer memory
- **License compliance** — All packages must be MIT/Apache/BSD
- **AI context limits** — Can't embed all type info; prioritize relevance
- **Version conflicts** — Packages must have compatible peer dependencies

---

## Success Criteria

- [ ] All 20 initial packages bundled and available
- [ ] Type definitions embedded in AI prompts
- [ ] AI-generated code uses correct API signatures >95% of the time
- [ ] Package browser shows documentation and examples
- [ ] Users can request new packages
- [ ] Monthly package review process established
- [ ] No security incidents from package usage

---

## Out of Scope

- User-installed arbitrary packages
- Package version selection per-node
- Local package development
- Package aliasing/renaming
- Automatic package updates

---

## Open Questions

- How do we handle package updates that break existing nodes?
- Should we allow different package versions per workflow?
- How do we measure AI's package usage accuracy?
- Should packages be lazy-loaded or all pre-bundled?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Package Browser | Explore available packages | Categories, search, details panel |
| Package Detail | Single package view | Docs, types, examples, insert button |
| Request Form | Request new package | Name, use case, criteria checklist |
| Code Editor Integration | Package suggestions | Autocomplete, inline docs |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── curated-packages/
│   ├── package-browser.html
│   ├── package-detail.html
│   ├── request-form.html
│   └── editor-integration.html
```

---

## References

- Vercel AI SDK: https://sdk.vercel.ai/docs
- Polars: https://pola.rs/
- WebContainer API: https://webcontainers.io/
- npm package guidelines: https://docs.npmjs.com/packages-and-modules
