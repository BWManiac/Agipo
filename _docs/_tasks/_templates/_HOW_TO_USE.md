# Task Documentation: How to Use

## Purpose

These templates create **actionable documentation** that aligns humans and LLMs on what to build, what to learn, and how to implement. 

**The goal:** An LLM reading these documents can implement the feature the same way you would.

---

## Philosophy

### Why Research Before Implementation?

We research to **ground implementation in truth**. The failure mode we're avoiding:

1. Assume an API works a certain way
2. Design our system around that assumption
3. Discover during implementation the API doesn't work that way
4. **Now we're screwed** — redesign required, time wasted

Research eliminates assumptions. By the time we implement, we know exactly what the external world provides and have made informed decisions about how to use it.

### Why Actionable Documentation?

Documentation exists to guide implementation. Every section should answer: **"What do I do with this information?"**

| Type | Example |
|------|---------|
| ❌ Not actionable | "The system uses React" |
| ✅ Actionable | "Use React's `useState` for local form state, `react-query` for server state" |
| ❌ Vague research | "Mastra has workflow support" |
| ✅ Actionable research | "Call `workflow.execute({ triggerData })` which returns `{ results, status }`" |

If a section doesn't inform a decision or action, it doesn't belong.

### External Facts vs Internal Decisions

This is the core distinction that shapes how we document:

| Type | Nature | Example | You Can... | Template |
|------|--------|---------|------------|----------|
| **External (Immutable)** | Facts about APIs | "Mastra's `createStep()` requires an `id` field" | Only discover, accept, adapt | Research Log |
| **Internal (Mutable)** | Decisions we control | "Should we generate `.ts` files or build in memory?" | Decide based on tradeoffs | Product Spec |

**External facts constrain us.** You can't require Mastra to have a certain API shape. You can't require Composio to expose output schemas. You discover what they provide and adapt.

**Internal architecture is mutable.** Code-gen vs runtime? Your choice. How to handle errors? Your choice. These are design decisions you control—but they should be **informed by external truths**.

This is why we split documentation:
- **Research Log** = "What does the external world give us?" (facts to discover)
- **Product Spec** = "What do we want to build and how?" (decisions to make, grounded in facts)

### Mapping Research to Requirements

Research questions aren't random exploration. Each question should:
1. **Map to a product requirement** (PR-X.X)
2. **Identify the primitive we need** (exact function/method)
3. **Inform implementation** (how we'll use it)

**For each Research Question (RQ-X), document:**

| Component | What to Record | Example |
|-----------|----------------|---------|
| **The Truth** | What does the API actually do? | "Mastra workflows require a `triggerSchema` defined with Zod" |
| **The Primitive** | Exact function/method signature | `createWorkflow({ id, triggerSchema, execute })` |
| **Requirement Mapping** | Which PR-X.X does this satisfy? | "Satisfies PR-8 (Runtime Inputs)" |
| **Gap Analysis** | Does the API fully meet our needs? | "No output schema validation—we'll need to handle this ourselves" |
| **Implementation Note** | Specific guidance for coding | "Use Zod schemas from our editor state to generate `triggerSchema`" |

By the time research is complete, you know exactly what code to write—not conceptually, but specifically: "Call `workflow.execute({ triggerData })` to run the workflow, which returns `{ results, activePaths }`."

### Standalone Readability

Each document should make sense on its own. Someone reading just the Research Log should understand:
- What questions we needed to answer
- Why each question mattered
- What we discovered
- What primitives we'll use

They shouldn't need to read other documents to understand the context.

### LLM-Friendly Structure

Templates use consistent patterns that LLMs can follow:
- Tables for quick reference
- Numbered lists for sequences
- Clear section headers
- Explicit placeholders (`[Fill this in]`)
- Links between related sections

---

## The Three Templates

| Template | Question It Answers | Output |
|----------|---------------------|--------|
| **Product Spec** | "What should we build?" | Requirements, acceptance criteria, user flows, design decisions |
| **Research Log** | "What do we need to learn?" | Questions about external APIs → Answers → Primitives to use |
| **Implementation Plan** | "How do we build it?" | Phases, file impact, test flows |

---

## How They Flow

```
┌─────────────────┐
│  PRODUCT SPEC   │  ← Define what success looks like
│                 │
└───────┬─────────┘
        │
        │ informs
        ▼
┌─────────────────┐
│  RESEARCH LOG   │  ← Discover external facts needed to build
│                 │
└───────┬─────────┘
        │
        │ informs
        ▼
┌─────────────────┐
│ IMPLEMENTATION  │  ← Plan the actual code changes
│     PLAN        │
└─────────────────┘
        ▲
        │
        └─── Product Spec ALSO informs Implementation Plan directly
```

**Key principle:** Information flows downstream. Implementation Plan doesn't inform the others—it consumes them.

---

## When to Use Which

| Task Type | Templates Needed | Example |
|-----------|------------------|---------|
| **Bug fix** | Implementation Plan only | "Fix the null pointer in X" |
| **Simple feature** | Product Spec + Implementation Plan | "Add delete button to Y" |
| **API integration** | Research Log + Implementation Plan | "Integrate with Z API" |
| **Complex feature** | All three | "Build workflow editor with Mastra" |
| **Discovery spike** | Research Log only | "Explore how Composio works" |

---

## Key Principles (Summary)

| Principle | What It Means |
|-----------|---------------|
| **Grounded in Truth** | Research discovers what APIs actually provide, eliminating assumptions |
| **Actionable** | Every section informs a decision or action |
| **External vs Internal** | Research Log = discover immutable facts; Product Spec = make mutable decisions |
| **Mapped to Requirements** | Research questions tie to PR-X.X acceptance criteria |
| **Primitive-Focused** | Research ends with specific functions to call, not vague concepts |
| **Gap-Aware** | Document where APIs don't fully meet requirements (blockers) |
| **Standalone Readable** | Each document makes sense on its own |
| **LLM-Friendly** | Tables, clear headers, explicit placeholders |

See the [Philosophy](#philosophy) section above for detailed explanations.

---

## Creating a New Task

### Step 1: Assess Complexity

Ask yourself:
1. Do I know exactly what to build? → Skip Product Spec
2. Do I need to learn how external APIs work? → Need Research Log
3. Is this more than a 1-file change? → Need Implementation Plan

### Step 2: Create Documents

```
_docs/_tasks/
├── [N]-[feature-name].md           # Product Spec (if needed)
├── [N].1-[feature]-research.md     # Research Log (if needed)
└── [N].2-[feature]-implementation.md  # Implementation Plan
```

Or for simple tasks, combine into one document using relevant sections from each template.

### Step 3: Fill Top-Down

1. **Product Spec first** — Define what success looks like
2. **Research Log second** — Answer questions that block implementation
3. **Implementation Plan last** — Now you know enough to plan

---

## Template Locations

```
_docs/_tasks/_templates/
├── _HOW_TO_USE.md           # This file
├── _PRODUCT_SPEC.md         # What to build
├── _RESEARCH_LOG.md         # What to learn
└── _IMPLEMENTATION_PLAN.md  # How to build
```

---

## Quick Reference: Which Sections Go Where

| Section | Product Spec | Research Log | Implementation Plan |
|---------|:------------:|:------------:|:-------------------:|
| Executive Summary | ✅ | | |
| Product Requirements | ✅ | | |
| Acceptance Criteria | ✅ | | ✅ (per-phase) |
| User Flows | ✅ | | |
| Design Decisions | ✅ | | |
| Research Questions | | ✅ | |
| Discovered Primitives | | ✅ | |
| Current State Analysis | | | ✅ |
| File Impact | | | ✅ |
| Implementation Phases | | | ✅ |
| Test Flows | | | ✅ |
| UXD Mockups | ✅ (requirements) | | ✅ (file list) |

