# Task: Bespoke Code Node Generation

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/02-node-system/05-Bespoke-Code-Node-Generation.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- AI code generation with TypeScript proven viable with Claude and GPT models
- WebContainer provides secure execution environment for generated code
- TypeScript AST analysis can reliably infer input/output schemas

**✅ Architecture Decisions:**
- Conversational refinement enables iterative code improvement
- Security validation prevents execution of unsafe code patterns
- Schema inference automates workflow binding generation

**✅ Integration Points:**
- Curated package system provides type-safe libraries for generation
- Workflow execution system ready for custom code nodes
- Editor canvas can display generated nodes with proper schemas

### Current State Analysis

**Existing Infrastructure:**
- WebContainer execution in workflow runtime
- Basic custom code step support in workflow system
- AI generation patterns from natural language workflow creation

**Missing Components:**
- No AI-powered code generation for individual nodes
- No TypeScript schema inference system
- No code security validation framework

### Deterministic Decisions

**Code Generation:**
- Use Claude 3.5 Sonnet for TypeScript generation
- Include curated package types in generation context
- Generate complete functions with input validation

**Security:**
- Static analysis to prevent dangerous operations (file system, network)
- Allowlist of permitted APIs and packages
- Sandbox execution in WebContainer

**Schema Inference:**
- Parse TypeScript AST to extract parameter and return types
- Convert TypeScript types to JSON Schema format
- Support complex types including arrays and nested objects

---

## Overview

### Goal

Build an AI-powered code generation system for custom workflow nodes. Users describe what they want in natural language, and the system generates TypeScript code using curated packages. The code is validated for security, schemas are inferred, and users can test and refine through conversation.

### Relevant Research

The workflow system currently supports custom code steps that execute in WebContainer. This feature adds AI-assisted code generation that:
1. Uses curated packages with embedded type information
2. Infers input/output schemas from code analysis
3. Validates code for security constraints
4. Enables conversational refinement

Key dependencies:
- Curated Package System (04-Curated-Package-System.md)
- WebContainer execution runtime
- TypeScript parser for validation and schema inference

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/code-generation.ts` | Create | Code generation types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/code/generate/route.ts` | Create | Generate code endpoint | A |
| `app/api/workflows/code/refine/route.ts` | Create | Refine code endpoint | A |
| `app/api/workflows/code/validate/route.ts` | Create | Validate code endpoint | A |
| `app/api/workflows/code/test/route.ts` | Create | Test code endpoint | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/code-generator.ts` | Create | Core code generation | A |
| `app/api/workflows/services/code-validator.ts` | Create | Security validation | A |
| `app/api/workflows/services/schema-inferrer.ts` | Create | Schema inference | A |
| `app/api/workflows/services/code-executor.ts` | Create | Test execution | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/code-node-slice.ts` | Create | Code node state | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/CodeNodeEditor.tsx` | Create | Code editor UI | B |
| `app/(pages)/workflows/editor/components/CodeGenerationInput.tsx` | Create | Description input | B |
| `app/(pages)/workflows/editor/components/CodeRefinementChat.tsx` | Create | Refinement UI | B |
| `app/(pages)/workflows/editor/components/CodeTestRunner.tsx` | Create | Test execution UI | B |

---

## Part A: Backend Code Generation System

### Goal

Build the services for generating, validating, and testing custom code using AI and curated packages.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/code-generation.ts` | Create | Types | ~80 |
| `app/api/workflows/code/generate/route.ts` | Create | Generate endpoint | ~100 |
| `app/api/workflows/code/refine/route.ts` | Create | Refine endpoint | ~80 |
| `app/api/workflows/code/validate/route.ts` | Create | Validate endpoint | ~60 |
| `app/api/workflows/code/test/route.ts` | Create | Test endpoint | ~80 |
| `app/api/workflows/services/code-generator.ts` | Create | Generation service | ~300 |
| `app/api/workflows/services/code-validator.ts` | Create | Validation service | ~200 |
| `app/api/workflows/services/schema-inferrer.ts` | Create | Schema inference | ~250 |
| `app/api/workflows/services/code-executor.ts` | Create | Execution service | ~150 |

### Pseudocode

#### `app/api/workflows/types/code-generation.ts`

```typescript
interface CodeGenerationRequest {
  description: string;
  inputSchema?: JSONSchema;          // From previous step
  outputHints?: string[];            // What next step expects
  existingCode?: string;             // For refinement
  conversationHistory?: Message[];
}

interface CodeGenerationResponse {
  code: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  explanation: string;
  usedPackages: string[];
  warnings?: string[];
}

interface CodeValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  securityIssues: SecurityIssue[];
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface SecurityIssue {
  pattern: string;
  line: number;
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

interface CodeTestRequest {
  code: string;
  inputData: Record<string, any>;
}

interface CodeTestResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
  executionTime: number;
  logs: string[];
}
```

#### `app/api/workflows/services/code-generator.ts`

```
class CodeGenerator {
  async generate(request: CodeGenerationRequest): Promise<CodeGenerationResponse>
  ├── Build context
  │   ├── Get relevant packages from registry (based on description)
  │   ├── Get type embeddings for selected packages
  │   ├── Include input schema if available
  │   └── Include output hints if available
  ├── Build generation prompt
  │   ├── System: Code generation instructions
  │   │   ├── Use TypeScript
  │   │   ├── Only import from curated packages
  │   │   ├── Return object (not primitive)
  │   │   ├── Handle errors gracefully
  │   │   └── Include comments
  │   ├── Context: Package types, schemas
  │   └── User: Description
  ├── Call LLM with structured output
  │   ├── Model: claude-3-5-sonnet
  │   ├── Output: { code, explanation, usedPackages }
  ├── Validate generated code
  │   ├── Parse TypeScript
  │   ├── Check imports are curated
  │   └── Run security scan
  ├── Infer schemas
  │   ├── Analyze inputData usage for input schema
  │   ├── Analyze return statement for output schema
  └── Return CodeGenerationResponse

  async refine(request: CodeGenerationRequest): Promise<CodeGenerationResponse>
  ├── Include existing code in context
  ├── Include conversation history
  ├── Call LLM with refinement prompt
  │   ├── "Current code: {existingCode}"
  │   ├── "User wants: {description}"
  │   ├── "Make minimal changes to achieve the goal"
  ├── Validate refined code
  ├── Infer updated schemas
  └── Return CodeGenerationResponse

  private buildGenerationPrompt(request: CodeGenerationRequest): string
  ├── Add system instructions
  │   └── Code style, structure requirements
  ├── Add package context
  │   └── Types and examples for relevant packages
  ├── Add schema context
  │   └── Input schema, output expectations
  └── Add user description
}

// Generation prompt template
const SYSTEM_PROMPT = `
You are a code generator for workflow automation. Generate TypeScript code that:

1. Uses ONLY these curated packages (do not import anything else):
{packageList}

2. Follows this structure:
\`\`\`typescript
// Brief description of what this code does

import { ... } from 'package';

// inputData contains: {inputSchemaDescription}
const result = // your logic here

return {
  // structured output
};
\`\`\`

3. Security requirements:
- Do NOT use fetch, eval, Function, require
- Do NOT access process, filesystem, or network
- Do NOT use dynamic imports

4. Best practices:
- Use meaningful variable names
- Add comments for complex logic
- Handle edge cases gracefully
- Return an object (not primitive values)

{packageContext}
`;
```

#### `app/api/workflows/services/code-validator.ts`

```
class CodeValidator {
  validate(code: string): CodeValidationResult
  ├── Parse TypeScript AST
  │   ├── If parse fails, return syntax error
  │   └── Store AST for analysis
  ├── Check imports
  │   ├── Extract all import statements
  │   ├── For each import
  │   │   ├── Check source is in curated list
  │   │   └── If not, add error
  ├── Security scan
  │   ├── Check for forbidden patterns
  │   │   ├── fetch, XMLHttpRequest
  │   │   ├── eval, Function constructor
  │   │   ├── require, dynamic import
  │   │   ├── process, global access
  │   │   └── fs, child_process
  │   └── Add security issue for each match
  ├── Check return statement
  │   ├── Verify return exists
  │   ├── Verify returns object
  │   └── Warn if return missing
  ├── Check inputData usage
  │   ├── Verify inputData is used
  │   └── Warn if accessing undefined properties
  └── Return CodeValidationResult

  private parseCode(code: string): ParseResult
  ├── Use TypeScript compiler API
  ├── Parse with loose settings
  └── Return AST and diagnostics

  private checkForbiddenPatterns(code: string): SecurityIssue[]
  ├── For each FORBIDDEN_PATTERN
  │   ├── Find matches in code
  │   ├── Calculate line number
  │   └── Create SecurityIssue
  └── Return issues

  private readonly FORBIDDEN_PATTERNS = [
    { pattern: /\bfetch\s*\(/, message: 'HTTP calls not allowed. Use Composio tools instead.' },
    { pattern: /\beval\s*\(/, message: 'eval() is not allowed for security reasons.' },
    { pattern: /new\s+Function\s*\(/, message: 'Function constructor not allowed.' },
    { pattern: /\brequire\s*\(/, message: 'Use ES imports instead of require().' },
    { pattern: /\bimport\s*\(/, message: 'Dynamic imports not allowed.' },
    { pattern: /\bprocess\./, message: 'Process access not allowed.' },
    { pattern: /\bglobal\./, message: 'Global access not allowed.' },
  ];
}
```

#### `app/api/workflows/services/schema-inferrer.ts`

```
class SchemaInferrer {
  inferInputSchema(code: string, declaredSchema?: JSONSchema): JSONSchema
  ├── Parse code AST
  ├── Find all inputData property accesses
  │   ├── inputData.foo → { foo: unknown }
  │   ├── inputData.bar.baz → { bar: { baz: unknown } }
  ├── For each property
  │   ├── Infer type from usage context
  │   │   ├── .length → string or array
  │   │   ├── .map(), .filter() → array
  │   │   ├── .toLowerCase() → string
  │   │   ├── + number → number
  │   │   └── Default to any
  │   └── Add to schema
  ├── If declaredSchema provided
  │   └── Merge with inferred (declared wins)
  └── Return JSONSchema

  inferOutputSchema(code: string): JSONSchema
  ├── Parse code AST
  ├── Find return statement(s)
  ├── For each return
  │   ├── If object literal
  │   │   ├── Extract property names
  │   │   ├── Infer types from values
  │   │   └── Build object schema
  │   ├── If identifier
  │   │   └── Trace back to definition
  │   └── If expression
  │       └── Infer from expression type
  ├── Merge multiple returns (union if different)
  └── Return JSONSchema

  private inferTypeFromExpression(expr: Expression): string
  ├── String literal → 'string'
  ├── Number literal → 'number'
  ├── Boolean literal → 'boolean'
  ├── Array literal → 'array' (recurse for items)
  ├── Object literal → 'object' (recurse for properties)
  ├── Function call → infer from known functions
  │   ├── generateText → { text: string, usage: ... }
  │   ├── generateObject → { object: T }
  │   ├── pl.DataFrame → DataFrame type
  │   └── etc.
  └── Unknown → 'any'

  private mergeSchemas(inferred: JSONSchema, declared: JSONSchema): JSONSchema
  ├── Start with declared
  ├── Add inferred properties not in declared
  ├── Keep declared types over inferred
  └── Return merged
}
```

#### `app/api/workflows/services/code-executor.ts`

```
class CodeExecutor {
  async execute(code: string, inputData: any): Promise<CodeTestResult>
  ├── Create WebContainer instance (or reuse)
  ├── Set up execution environment
  │   ├── Write code to temp file
  │   ├── Write input data as JSON
  │   └── Create wrapper script
  ├── Wrapper script structure:
  │   ```javascript
  │   import inputData from './input.json';
  │   // User code inserted here
  │   const result = await (async () => {
  │     {userCode}
  │   })();
  │   console.log(JSON.stringify({ __result: result }));
  │   ```
  ├── Execute with timeout
  │   ├── Start timer
  │   ├── Run script
  │   ├── Capture stdout/stderr
  │   └── Enforce 30 second timeout
  ├── Parse output
  │   ├── Find __result in output
  │   ├── Parse as JSON
  │   └── Separate logs from result
  ├── Clean up
  │   └── Remove temp files
  └── Return CodeTestResult

  private createWrapper(code: string): string
  ├── Add imports map for curated packages
  ├── Wrap user code in async function
  ├── Add error handling
  └── Return wrapper code

  private parseOutput(stdout: string): { result: any, logs: string[] }
  ├── Split stdout by lines
  ├── Find line with __result
  ├── Parse result JSON
  ├── Collect other lines as logs
  └── Return parsed output
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Simple code generates correctly | "Sum numbers in array", verify working code |
| AC-A.2 | AI SDK code generates correctly | "Summarize text", verify generateText usage |
| AC-A.3 | Polars code generates correctly | "Group by column", verify DataFrame usage |
| AC-A.4 | Invalid imports rejected | Insert fetch, verify error |
| AC-A.5 | Security patterns blocked | Insert eval, verify security issue |
| AC-A.6 | Input schema inferred | Use inputData.name, verify name in schema |
| AC-A.7 | Output schema inferred | Return { count: 5 }, verify number type |
| AC-A.8 | Test execution works | Run generated code, verify output |

---

## Part B: Frontend Code Node UI

### Goal

Create the user interface for describing, generating, viewing, and testing custom code nodes.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/code-node-slice.ts` | Create | State | ~100 |
| `app/(pages)/workflows/editor/components/CodeNodeEditor.tsx` | Create | Main editor | ~250 |
| `app/(pages)/workflows/editor/components/CodeGenerationInput.tsx` | Create | Input UI | ~100 |
| `app/(pages)/workflows/editor/components/CodeRefinementChat.tsx` | Create | Chat UI | ~150 |
| `app/(pages)/workflows/editor/components/CodeTestRunner.tsx` | Create | Test UI | ~150 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/CodeNodeEditor.tsx`

```
CodeNodeEditor({ nodeId, onSave })
├── State: code, description, inputSchema, outputSchema, testResult
├── Fetch node data on mount
├── Layout (split view)
│   ├── Left panel: Code editor
│   │   ├── Monaco editor with TypeScript
│   │   ├── Package autocomplete (from registry)
│   │   ├── Error highlighting (from validation)
│   │   └── Read-only mode for generated code (editable for experts)
│   ├── Right panel: Tabs
│   │   ├── Generate tab
│   │   │   └── CodeGenerationInput
│   │   ├── Schemas tab
│   │   │   ├── Input schema (derived/editable)
│   │   │   └── Output schema (inferred)
│   │   ├── Test tab
│   │   │   └── CodeTestRunner
│   │   └── Packages tab
│   │       └── PackageBrowser (compact)
├── On generate
│   ├── Call POST /api/workflows/code/generate
│   ├── Update code in editor
│   ├── Update schemas
│   └── Show explanation toast
├── On code change
│   ├── Debounced validation
│   ├── Update error highlighting
│   └── Re-infer schemas
└── On save
    ├── Validate code
    ├── If valid, call onSave with code + schemas
    └── If invalid, show errors
```

#### `app/(pages)/workflows/editor/components/CodeGenerationInput.tsx`

```
CodeGenerationInput({ onGenerate, isGenerating })
├── Textarea for description
│   ├── Placeholder: "Describe what this code should do..."
│   ├── Example prompts as chips below
│   │   ├── "Calculate match percentage"
│   │   ├── "Summarize with AI"
│   │   ├── "Transform data format"
│   └── Cmd+Enter to generate
├── Context hints (collapsible)
│   ├── Input schema preview (from previous step)
│   ├── Expected output hint (from next step)
│   └── Available packages list
├── Generate button
│   ├── Primary action
│   ├── Loading state when generating
│   └── Keyboard shortcut hint
└── On submit
    ├── Validate description not empty
    └── Call onGenerate(description)
```

#### `app/(pages)/workflows/editor/components/CodeRefinementChat.tsx`

```
CodeRefinementChat({ currentCode, onRefine })
├── Conversation history
│   ├── Initial generation message
│   ├── Refinement requests
│   └── Code change summaries
├── Input area
│   ├── Textarea for refinement instruction
│   ├── Suggestions based on current code
│   │   ├── "Add error handling"
│   │   ├── "Optimize performance"
│   │   ├── "Add input validation"
│   └── Send button
├── On submit refinement
│   ├── Add to conversation history
│   ├── Call POST /api/workflows/code/refine
│   ├── Highlight changes in editor
│   └── Add AI response to history
└── Code diff view (optional)
    └── Show before/after for each refinement
```

#### `app/(pages)/workflows/editor/components/CodeTestRunner.tsx`

```
CodeTestRunner({ code, inputSchema })
├── Input data editor
│   ├── JSON editor based on inputSchema
│   ├── Auto-populate with example values
│   └── Validate against schema
├── Run button
│   ├── Disabled if input invalid
│   ├── Loading state during execution
│   └── Timeout indicator
├── Result display
│   ├── Success state
│   │   ├── Output JSON (formatted)
│   │   ├── Execution time
│   │   └── Logs (collapsible)
│   ├── Error state
│   │   ├── Error message
│   │   ├── Stack trace (if available)
│   │   └── Line number (if available)
│   └── Timeout state
│       └── Suggest optimization
├── History (optional)
│   └── Previous test runs
└── On run
    ├── Validate input
    ├── Call POST /api/workflows/code/test
    └── Display result
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Description input works | Type description, click generate |
| AC-B.2 | Generated code appears | Generate, verify code in editor |
| AC-B.3 | Schemas displayed | Generate, verify input/output schemas |
| AC-B.4 | Test runner executes | Enter input, run, verify output |
| AC-B.5 | Refinement updates code | Request change, verify code updated |
| AC-B.6 | Errors highlighted | Generate invalid code, verify red underline |
| AC-B.7 | Packages accessible | Open packages tab, verify browseable |

---

## User Flows

### Flow 1: Generate and Test Code

```
1. User adds custom code node
2. CodeNodeEditor opens in sidebar
3. User types: "Extract email addresses from text"
4. User clicks Generate
5. API returns generated code using regex
6. Code appears in editor
7. Schemas update (input: { text: string }, output: { emails: string[] })
8. User switches to Test tab
9. User enters sample text with emails
10. User clicks Run
11. Output shows extracted emails
12. User clicks Save
13. Node updated with code and schemas
```

---

## Out of Scope

- Code debugging (breakpoints)
- Version history for code
- Collaborative editing
- Custom package imports

---

## Open Questions

- [ ] Should we allow expert mode for manual code editing?
- [ ] How do we handle AI SDK calls in test execution (real or mock)?
- [ ] Should test results persist across sessions?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
