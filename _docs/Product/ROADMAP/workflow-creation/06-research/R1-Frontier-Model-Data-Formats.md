# Research Log: Frontier Model Data Formats

**Status:** Not Started
**Date:** December 2024
**Related Roadmaps:**
- `01-creation-paths/01-Natural-Language-Workflow-Creation.md`
- `02-node-system/05-Bespoke-Code-Node-Generation.md`
- `02-node-system/06-Mapping-Code-Nodes.md`

---

## How to Use This Document

This is a **research log** for discovering how frontier LLMs (Claude, GPT-4, Gemini) best receive and produce structured data formats. Understanding these patterns is critical for:

1. **Workflow generation** — How to structure prompts for consistent workflow JSON output
2. **Code generation** — What format constraints produce the most reliable code
3. **Schema inference** — How to extract schemas from natural language
4. **Validation** — How to get models to validate their own output

**Philosophy:** LLM capabilities are empirically discovered. We need to test various formats and measure reliability, not assume what works.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Structured output formats](#rq-1-structured-output-formats) | Workflow JSON generation | ❓ |
| [RQ-2: Schema-constrained generation](#rq-2-schema-constrained-generation) | Reliable code generation | ❓ |
| [RQ-3: JSON Schema in prompts](#rq-3-json-schema-in-prompts) | Dynamic UI schemas | ❓ |
| [RQ-4: Multi-step reasoning formats](#rq-4-multi-step-reasoning-formats) | Workflow decomposition | ❓ |
| [RQ-5: Error self-correction](#rq-5-error-self-correction) | Validation loops | ❓ |
| [RQ-6: Context window optimization](#rq-6-context-window-optimization) | Large workflow handling | ❓ |
| [RQ-7: Code generation constraints](#rq-7-code-generation-constraints) | Curated package safety | ❓ |
| [RQ-8: Model-specific behaviors](#rq-8-model-specific-behaviors) | Multi-model support | ❓ |

---

## Part 1: Structured Output Research

### RQ-1: Structured Output Formats

**Why It Matters:** Natural language workflow creation requires the LLM to produce valid JSON workflow definitions. Unreliable JSON output breaks the entire creation flow.

**Status:** ❓ Not Researched

**Questions:**
1. What output format produces the most reliable JSON from each model?
2. How do markdown code blocks compare to raw JSON output?
3. Does the AI SDK's `generateObject` guarantee valid JSON?
4. What happens when the model needs to generate nested structures?

**Answer:**
```typescript
// To be filled after research
// Test cases:
// 1. generateText with JSON in markdown blocks
// 2. generateObject with Zod schema
// 3. generateObject with JSON Schema
// 4. Custom parsing with retry logic
```

**Test Cases to Run:**

| Test | Format | Complexity | Success Rate |
|------|--------|------------|--------------|
| Simple workflow | generateObject | 3 nodes | % |
| Complex workflow | generateObject | 15+ nodes | % |
| Nested schemas | generateObject | 3 levels deep | % |
| Markdown extraction | generateText | Medium | % |

**Primitive Discovered:**
- Function/Method:
- Signature:
- Return type:
- Reliability:

**Implementation Note:**

**Source:**
- Vercel AI SDK docs
- Anthropic API docs
- OpenAI API docs

---

### RQ-2: Schema-Constrained Generation

**Why It Matters:** We need LLMs to generate code that uses only our curated packages. Unconstrained generation produces code with arbitrary dependencies.

**Status:** ❓ Not Researched

**Questions:**
1. Can we constrain models to only use specific imports via system prompt?
2. How effective is few-shot prompting for import constraints?
3. Does providing a "allowed imports" list work?
4. Should we post-process and rewrite disallowed imports?

**Answer:**
```typescript
// To be filled after research
// Test prompt structures:
// 1. System prompt with explicit constraints
// 2. Few-shot examples showing only allowed imports
// 3. JSON schema with enum of allowed imports
// 4. Post-processing AST transformation
```

**Test Cases:**

| Approach | Constraint Method | Success Rate | Edge Cases |
|----------|-------------------|--------------|------------|
| System prompt only | "Only use these packages: ..." | % | |
| Few-shot | 5 examples with correct imports | % | |
| Schema constraint | Enum of package names | % | |
| Post-process | AST rewrite | 100% (by design) | Performance |

**Implementation Note:**

**Source:**

---

### RQ-3: JSON Schema in Prompts

**Why It Matters:** Dynamic schema UI (doc 12) needs LLMs to work with JSON Schema for generating input forms and validating structures.

**Status:** ❓ Not Researched

**Questions:**
1. Do LLMs understand JSON Schema syntax correctly?
2. Can models generate valid JSON Schema from descriptions?
3. How do models handle schema references ($ref)?
4. What's the reliability of schema inference from examples?

**Answer:**
```typescript
// To be filled after research
// Test cases:
// 1. Generate schema from "I need name, email, age"
// 2. Generate schema from example JSON
// 3. Validate data against provided schema
// 4. Handle $ref and nested schemas
```

**Test Cases:**

| Input | Expected Output | Model | Success |
|-------|----------------|-------|---------|
| "name (required), email, age (number)" | Valid JSON Schema | Claude | |
| Example JSON object | Inferred schema | Claude | |
| Schema + data | Validation result | Claude | |
| Nested $ref schema | Correct resolution | Claude | |

**Primitive Discovered:**
- Best prompt structure for schema generation:
- Accuracy of schema inference:
- $ref handling capability:

**Implementation Note:**

**Source:**

---

### RQ-4: Multi-Step Reasoning Formats

**Why It Matters:** Workflow decomposition (doc 08) requires models to break complex tasks into sequential steps. Understanding the best reasoning format improves decomposition quality.

**Status:** ❓ Not Researched

**Questions:**
1. Does Chain-of-Thought improve workflow decomposition?
2. Should we use XML tags for structured reasoning?
3. How does "thinking" affect output quality for workflows?
4. What's the optimal number of decomposition steps?

**Answer:**
```typescript
// To be filled after research
// Test formats:
// 1. Direct output: "Generate workflow for X"
// 2. CoT: "Think step by step, then generate workflow"
// 3. XML: "<thinking>...</thinking><workflow>..."
// 4. Multi-turn: First list steps, then generate each
```

**Test Cases:**

| Task | Format | Decomposition Quality | Token Usage |
|------|--------|----------------------|-------------|
| "Send weekly report" | Direct | /10 | |
| "Send weekly report" | CoT | /10 | |
| "Send weekly report" | XML tags | /10 | |
| "Send weekly report" | Multi-turn | /10 | |

**Best Format Discovered:**

**Implementation Note:**

**Source:**

---

### RQ-5: Error Self-Correction

**Why It Matters:** Schema validation (doc 11) catches mismatches, but we need models to fix their own errors efficiently.

**Status:** ❓ Not Researched

**Questions:**
1. Can models correct JSON syntax errors when shown the error?
2. How well do models fix type mismatches?
3. What's the optimal error feedback format?
4. How many retry iterations are typically needed?

**Answer:**
```typescript
// To be filled after research
// Test correction scenarios:
// 1. Invalid JSON syntax
// 2. Missing required fields
// 3. Type mismatch (string where number expected)
// 4. Schema validation failure
```

**Test Cases:**

| Error Type | Feedback Format | Fix Rate | Avg Retries |
|------------|----------------|----------|-------------|
| Syntax error | Raw error message | % | |
| Missing field | "Missing: fieldName" | % | |
| Type mismatch | "Expected X, got Y" | % | |
| Complex validation | JSON Schema error | % | |

**Implementation Note:**

**Source:**

---

### RQ-6: Context Window Optimization

**Why It Matters:** Large workflows with many nodes may exceed context windows. We need strategies for handling complex workflows.

**Status:** ❓ Not Researched

**Questions:**
1. What's the practical limit for workflow complexity per request?
2. How do we chunk large workflows for generation?
3. Does workflow context compress well?
4. When should we use retrieval vs. full context?

**Answer:**
```typescript
// To be filled after research
// Test scenarios:
// 1. Generate 5-node workflow
// 2. Generate 20-node workflow
// 3. Generate 50-node workflow
// 4. Generate with retrieved examples vs. full context
```

**Test Cases:**

| Workflow Size | Tokens Used | Quality | Time |
|---------------|-------------|---------|------|
| 5 nodes | | /10 | ms |
| 10 nodes | | /10 | ms |
| 20 nodes | | /10 | ms |
| 50 nodes | | /10 | ms |

**Chunking Strategies:**

| Strategy | Pros | Cons |
|----------|------|------|
| Full context | Complete information | Token limits |
| Node-by-node | Low tokens | Loss of global context |
| Phase-by-phase | Balanced | Requires phases defined |
| RAG | Scalable | Retrieval complexity |

**Implementation Note:**

**Source:**

---

### RQ-7: Code Generation Constraints

**Why It Matters:** Bespoke code generation (doc 05) and mapping nodes (doc 06) require reliable code that follows our patterns.

**Status:** ❓ Not Researched

**Questions:**
1. What's the most reliable way to constrain code output format?
2. How do we ensure TypeScript types are correct?
3. Can we enforce async/await patterns reliably?
4. What template structure produces best results?

**Answer:**
```typescript
// To be filled after research
// Test code generation patterns:
// 1. Function signature template
// 2. Full file template with placeholders
// 3. Step-by-step code blocks
// 4. Fill-in-the-blank approach
```

**Test Cases:**

| Template Style | Constraint Level | Type Errors | Pattern Compliance |
|----------------|------------------|-------------|-------------------|
| Signature only | Low | /10 | % |
| Full template | High | /10 | % |
| Examples + signature | Medium | /10 | % |
| Fill-in-blank | Very High | /10 | % |

**Best Code Generation Template:**
```typescript
// To be filled with discovered best practice
```

**Implementation Note:**

**Source:**

---

### RQ-8: Model-Specific Behaviors

**Why It Matters:** We support multiple models (Claude, GPT-4, etc.). Understanding their differences helps optimize prompts per model.

**Status:** ❓ Not Researched

**Questions:**
1. How do Claude and GPT-4 differ in JSON output reliability?
2. Which model handles code generation best?
3. Are there model-specific prompt optimizations?
4. How do smaller models (Haiku, GPT-3.5) compare?

**Model Comparison:**

| Capability | Claude 3.5 Sonnet | GPT-4 Turbo | Claude 3 Haiku | GPT-3.5 |
|------------|------------------|-------------|----------------|---------|
| JSON reliability | /10 | /10 | /10 | /10 |
| Code generation | /10 | /10 | /10 | /10 |
| Schema understanding | /10 | /10 | /10 | /10 |
| Reasoning quality | /10 | /10 | /10 | /10 |
| Speed | ms | ms | ms | ms |
| Cost/1k tokens | $ | $ | $ | $ |

**Model-Specific Optimizations:**

| Model | Optimization | Why |
|-------|-------------|-----|
| Claude | | |
| GPT-4 | | |
| Haiku | | |

**Implementation Note:**

**Source:**
- Model documentation
- Benchmark results
- Internal testing

---

## Part 2: Integration with Vercel AI SDK

### RQ-9: AI SDK Structured Output

**Why It Matters:** We use Vercel AI SDK. Understanding its structured output capabilities affects our implementation choices.

**Status:** ❓ Not Researched

**Questions:**
1. How does `generateObject` handle complex schemas?
2. What happens when the model fails to match the schema?
3. Can we customize the retry logic?
4. How do we handle partial objects?

**Answer:**
```typescript
// To be filled after research
import { generateObject } from 'ai';
import { z } from 'zod';

// Test generateObject capabilities
```

**Primitive Discovered:**
- Function/Method: `generateObject`
- Signature:
- Schema types supported:
- Error handling:

**Implementation Note:**

**Source:**
- https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data

---

### RQ-10: Streaming Structured Data

**Why It Matters:** Large workflows benefit from streaming. Can we stream structured JSON?

**Status:** ❓ Not Researched

**Questions:**
1. Does AI SDK support streaming objects?
2. How do we handle partial JSON in UI?
3. What's the latency improvement with streaming?
4. Can we show progressive workflow building?

**Answer:**
```typescript
// To be filled after research
import { streamObject } from 'ai';
```

**Primitive Discovered:**
- Function/Method:
- Partial object handling:
- UI update strategy:

**Implementation Note:**

**Source:**

---

## Part 3: Empirical Testing Framework

### Testing Approach

To answer these questions, we need systematic testing:

```typescript
interface PromptTest {
  id: string;
  name: string;
  prompt: string;
  expectedOutput: z.ZodSchema;
  models: string[];
  iterations: number;
}

interface TestResult {
  testId: string;
  model: string;
  successRate: number;
  avgTokens: number;
  avgLatency: number;
  failures: FailureCase[];
}

// Run tests across models
async function runPromptTests(tests: PromptTest[]): Promise<TestResult[]> {
  // Implementation
}
```

### Test Categories

1. **JSON Generation Tests**
   - Simple objects
   - Nested objects
   - Arrays
   - Union types

2. **Code Generation Tests**
   - Simple functions
   - Async functions
   - Functions with specific imports
   - Type-safe code

3. **Schema Tests**
   - Schema generation
   - Schema inference
   - Schema validation

4. **Decomposition Tests**
   - Simple tasks (1-3 steps)
   - Medium tasks (4-7 steps)
   - Complex tasks (8+ steps)

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Structured output | `generateObject` | Vercel AI SDK | ❓ |
| Schema validation | Zod | zod | ✅ |
| Streaming objects | `streamObject` | Vercel AI SDK | ❓ |
| Code parsing | | | ❓ |
| JSON Schema | | | ❓ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| - | - | - |

### Key Learnings

[To be filled after research]

1. Best structured output format:
2. Most reliable code generation pattern:
3. Model recommendations by task:
4. Error handling strategy:
5. Context window strategies:

---

## Exit Criteria

- [ ] All RQ questions answered with test data
- [ ] Summary table complete
- [ ] No unresolved blockers
- [ ] Prompt templates documented
- [ ] Model-specific optimizations identified

**Next Step:** Update implementation docs with discovered patterns

---

## Resources Used

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Zod Documentation](https://zod.dev/)
- Internal codebase: `app/api/workflows/services/`
