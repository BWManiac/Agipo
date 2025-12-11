# Bespoke Code Node Generation

**Status:** Draft
**Priority:** P0
**North Star:** User describes "Calculate match score between job requirements and my resume", AI generates a custom code node using AI SDK and Polars that runs reliably.

---

## Problem Statement

Pre-built integrations can't cover every use case. Users need custom logic for:
- Data transformation specific to their domain
- Business rules that don't fit standard tools
- AI-powered processing (summarization, extraction, classification)
- Complex calculations combining multiple data sources

Currently, users must:
1. Write code manually (requires programming knowledge)
2. Use generic "code" blocks (no AI assistance)
3. Chain multiple simple nodes (verbose, inefficient)

**The Gap:** No AI-assisted generation of custom code nodes using curated packages.

---

## User Value

- **Custom logic without coding** — Describe what you need, get working code
- **Leverage powerful packages** — AI uses Vercel AI SDK, Polars, etc. correctly
- **Type-safe by design** — Input/output schemas enforce data contracts
- **Iterate conversationally** — Refine generated code through dialogue
- **Learn by example** — See how experts would write the code

---

## Core Principle: Extensibility

> "If I could code, this is how I'd do it."

Bespoke nodes should feel like an extension of the user's thinking, not a black box. The generated code should be:
- **Readable** — Clear variable names, logical structure
- **Documented** — Comments explain intent
- **Inspectable** — User can view and understand the code
- **Modifiable** — Expert users can edit the generated code

---

## User Flows

### Flow 1: Generate Custom Node from Description

```
1. User adds "Custom Code" node to canvas
2. Node shows description input: "What should this step do?"
3. User types: "Take the job requirements and my resume skills,
   then calculate a match percentage based on keyword overlap"
4. User clicks "Generate"
5. System shows thinking indicator
6. Generated code appears in editor:
   ```typescript
   // Calculate skill match percentage
   import pl from 'nodejs-polars';

   // Extract skills from resume
   const resumeSkills = new Set(
     inputData.resume.skills.map(s => s.toLowerCase())
   );

   // Extract required skills from job
   const requiredSkills = inputData.requirements.map(r => r.toLowerCase());

   // Calculate match
   const matched = requiredSkills.filter(skill =>
     resumeSkills.has(skill)
   );

   const matchPercentage = (matched.length / requiredSkills.length) * 100;

   return {
     matchPercentage: Math.round(matchPercentage),
     matchedSkills: matched,
     missingSkills: requiredSkills.filter(s => !resumeSkills.has(s))
   };
   ```
7. User sees input/output schema derived from code
8. User can run test with sample data
9. User accepts or refines
```

### Flow 2: Refine Generated Code

```
1. User has generated code (from Flow 1)
2. User types: "Also use fuzzy matching for similar skills"
3. System updates code:
   ```typescript
   import { distance } from 'fastest-levenshtein';
   // ... previous code ...

   // Fuzzy match for similar skills
   const fuzzyMatched = requiredSkills.filter(req =>
     Array.from(resumeSkills).some(skill =>
       distance(req, skill) <= 2  // Allow 2 character difference
     )
   );
   ```
4. Changes highlighted in editor
5. User reviews and accepts
```

### Flow 3: Generate AI-Powered Node

```
1. User adds custom node
2. User types: "Analyze the job posting and extract key requirements
   as a structured list with importance level"
3. System generates code using AI SDK:
   ```typescript
   import { generateObject } from 'ai';
   import { anthropic } from '@ai-sdk/anthropic';
   import { z } from 'zod';

   const RequirementSchema = z.object({
     requirements: z.array(z.object({
       text: z.string().describe('The requirement'),
       category: z.enum(['technical', 'experience', 'education', 'soft-skill']),
       importance: z.enum(['required', 'preferred', 'nice-to-have'])
     }))
   });

   const { object } = await generateObject({
     model: anthropic('claude-3-5-sonnet-20241022'),
     schema: RequirementSchema,
     prompt: `Extract requirements from this job posting:\n\n${inputData.jobPosting}`
   });

   return object;
   ```
4. User sees schema with structured output
5. User can test with sample job posting
```

### Flow 4: Generate Data Processing Node

```
1. User has data from previous step (array of records)
2. User types: "Group by company, sum the amounts, sort by total descending"
3. System generates Polars code:
   ```typescript
   import pl from 'nodejs-polars';

   const df = pl.DataFrame(inputData.records);

   const result = df
     .groupBy('company')
     .agg(pl.col('amount').sum().alias('total'))
     .sort('total', { descending: true })
     .toRecords();

   return { grouped: result };
   ```
4. User sees output schema inferred from Polars operations
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/services/step-generator.ts` | Existing step generation | Code transpilation |
| `lib/packages/` | Curated packages | Package registry |
| `app/(pages)/workflows/editor/` | Node editor UI | Custom node components |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Code language | TypeScript | Type safety, familiar to web devs |
| Execution environment | WebContainer | Isolated, secure |
| Schema inference | From code analysis | Automatic, reduces manual config |
| Package access | Curated only | Security, reliability |
| Error handling | Try-catch wrapper | Graceful failures |

---

## Architecture

### Generation Pipeline

```
User Description
      ↓
┌─────────────────────────────────────────┐
│         Context Assembly                │
│  - Available packages (from registry)   │
│  - Input schema (from previous step)    │
│  - Output expectations (from next step) │
│  - User's connected integrations        │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         LLM Code Generation             │
│  - System: Code generation instructions │
│  - Context: Packages, schemas           │
│  - User: Task description               │
│  - Output: TypeScript code              │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Code Validation                 │
│  - Syntax check (TypeScript parser)     │
│  - Import validation (curated only)     │
│  - Security scan (no fetch, eval, etc.) │
│  - Schema inference                     │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Schema Generation               │
│  - Analyze return statement             │
│  - Infer output schema                  │
│  - Match against next step input        │
└─────────────────────────────────────────┘
      ↓
Generated Node (code + schemas)
```

### Code Template

All generated code follows this structure:

```typescript
// [Brief description of what this code does]

// Imports (curated packages only)
import { ... } from 'package';

// Type definitions (if complex)
interface InputType { ... }
interface OutputType { ... }

// Main logic
// inputData is available with schema from previous step
const result = ...;

// Return structured output
return {
  field1: value1,
  field2: value2,
};
```

### Security Constraints

Generated code is scanned for:

```typescript
const FORBIDDEN_PATTERNS = [
  /\bfetch\b/,           // No HTTP calls
  /\beval\b/,            // No eval
  /\bFunction\b/,        // No Function constructor
  /\bimport\(/,          // No dynamic imports
  /\brequire\(/,         // No CommonJS
  /process\./,           // No process access
  /\bfs\b/,              // No filesystem
  /child_process/,       // No shell
];

const ALLOWED_IMPORTS = [
  'ai',
  '@ai-sdk/anthropic',
  '@ai-sdk/openai',
  'zod',
  'nodejs-polars',
  // ... curated packages
];
```

---

## Constraints

- **Curated packages only** — No arbitrary npm packages
- **Stateless execution** — No persisted state between runs
- **No external I/O** — No HTTP, filesystem, database (use Composio for that)
- **Timeout limits** — Code must complete in <30 seconds
- **Memory limits** — WebContainer memory constraints
- **Deterministic preferred** — Same input → same output

---

## Success Criteria

- [ ] User can describe custom logic and get working code
- [ ] Generated code uses curated packages correctly
- [ ] Code passes security validation
- [ ] Input/output schemas are inferred accurately
- [ ] User can refine code through conversation
- [ ] Code executes successfully in WebContainer
- [ ] Generated code is readable and documented
- [ ] Test execution with sample data works

---

## Out of Scope

- Code debugging tools (breakpoints, step-through)
- Code versioning within a node
- Collaborative code editing
- External API calls from custom code (use Composio)
- Package installation on-demand

---

## Open Questions

- How do we handle long-running code (AI calls)?
- Should we show execution metrics (time, tokens)?
- How do we help users understand generated code?
- Should we support multiple code snippets per node?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Custom Node Empty | Initial state | Description input, generate button |
| Custom Node Generated | Code view | Editor, schemas, test button |
| Generation Progress | Loading state | Spinner, stage indicator |
| Refinement Chat | Conversation | History, inline code changes |
| Test Runner | Testing | Sample input, output, errors |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── bespoke-code/
│   ├── custom-node-empty.html
│   ├── custom-node-generated.html
│   ├── generation-progress.html
│   ├── refinement-chat.html
│   └── test-runner.html
```

---

## References

- Curated Package System: `04-Curated-Package-System.md`
- Vercel AI SDK: https://sdk.vercel.ai/docs
- WebContainer API: https://webcontainers.io/
- TypeScript AST: https://ts-ast-viewer.com/
