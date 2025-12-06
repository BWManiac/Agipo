# Task [NUMBER]: [FEATURE NAME] — Implementation Plan

**Status:** [Planning | In Progress | Complete]  
**Date:** [Month Year]  
**Goal:** [One-sentence description of what this task accomplishes]

---

## How to Use This Template

This template defines **how to build** a feature. It's the downstream document in our template system.

**Informed by:**
- **Product Spec** — What we're building (requirements, ACs, user flows)
- **Research Log** — What we learned about external APIs (primitives to use)

**This document covers:**
1. **Where are we?** (Current State) — Understand the existing system
2. **What do we touch?** (File Impact) — Scope the work concretely
3. **How do we build it?** (Phased Implementation) — Break into verifiable milestones

Each phase has its own acceptance criteria so we catch issues early. This document serves as both a **plan** and a **testing checklist**.

### Prerequisites

Before filling this out:
- [ ] Product Spec complete (or requirements clear)
- [ ] Research Log complete (if external APIs involved)
- [ ] UXD mockups complete (if frontend work)

### Frontend Work: Design First

**If this task includes frontend changes, UXD mockups should exist before this document.**

Location: `_docs/UXD/Pages/[feature-area]/`

Mockups should cover:
- New components (modals, forms, cards)
- New views or pages
- Significant UI changes
- Error states and loading states

---

## 1. Executive Summary

[2-4 sentences describing:
- What currently exists
- What gap or problem this addresses
- What the end state looks like]

**End state:** [One sentence describing the user-visible outcome when complete]

---

## 2. Current State Analysis

### 2.1 How It Works Today

[Describe the existing flow, architecture, or behavior. Use diagrams if helpful:]

```
[Current flow diagram or code snippet]
```

### 2.2 Key Data Structures

[Show relevant types, API responses, or schemas that inform the implementation:]

```typescript
// Example structure
type ExampleType = {
  id: string;
  relevantField: string; // ← Highlight key fields
};
```

### 2.3 Relevant Primitives/APIs

[Document any SDK methods, API endpoints, or libraries we'll use:]

| Method/Endpoint | Purpose | Notes |
|-----------------|---------|-------|
| `example.method()` | Does X | Returns Y |

---

## 3. Acceptance Criteria

[Organize into logical categories. Aim for 10-20 succinct, testable criteria.]

### [Category 1 Name] ([N] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC1 | [Specific, measurable outcome] | [How to verify] |
| AC2 | ... | ... |

### [Category 2 Name] ([N] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC3 | ... | ... |

### [Category 3: Backwards Compatibility] ([N] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| ACx | Existing [feature] continues to work unchanged | [Test method] |

---

## 4. User Flows

### Flow 1: [Happy Path Name]

```
1. User does X
2. System responds with Y
3. User sees Z
...
```

### Flow 2: [Error/Edge Case Name]

```
1. User does X
2. [Error condition occurs]
3. System shows [appropriate error]
4. User can [recover/retry]
```

### Flow 3: [Alternative Path Name]

```
...
```

---

## 5. File Impact Analysis

| File | Action | Description |
|------|--------|-------------|
| `path/to/file.ts` | Modify | [What changes] |
| `path/to/new-file.ts` | **Create** | [Purpose] |
| `path/to/deprecated.ts` | Delete | [Why removing] |

### 5.1 UX Mockups (if frontend work)

| Mockup | Location | Description |
|--------|----------|-------------|
| [Component Name] | `_docs/UXD/Pages/[path]/[file].html` | [What it shows] |

---

## 6. Implementation Phases

### Phase 1: [Foundation/Backend/Core]

**Goal:** [One sentence describing what this phase achieves]

**Changes:**
1. [Specific change]
2. [Specific change]

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | [Measurable outcome] | [How to test] |
| P1.2 | ... | ... |

**Phase 1 Test Flow:**
```
[Step-by-step test procedure or commands]
```

---

### Phase 2: [Frontend/UI/Integration]

**Goal:** [One sentence]

**Changes:**
1. ...

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | ... | ... |

**Phase 2 Test Flow:**
```
...
```

---

### Phase 3: [Polish/Edge Cases/Full Integration]

**Goal:** [One sentence]

**Changes:**
1. ...

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | All main acceptance criteria (Section 3) pass | Full test suite |

**Phase 3 Test Flow (End-to-End):**
```
[Complete user journey from start to finish]
```

---

## 7. Design Decisions

[Document key decisions and their rationale:]

| Decision | Rationale |
|----------|-----------|
| [Choice made] | [Why this approach] |
| [Trade-off accepted] | [What we gain vs. give up] |

---

## 8. Out of Scope

[Explicitly list what this task does NOT include:]

- [Future enhancement 1]
- [Related but separate concern]
- [Edge case deferred to later]

---

## 9. References

- **Product Spec:** `[N]-[feature-name].md`
- **Research Log:** `[N].1-[feature]-research.md` (if applicable)
- **UXD Mockups:** `_docs/UXD/Pages/[feature-area]/`
- **Previous Task:** Task [N] - [Name]
- **External Resources:** [URLs]

---

## 10. Completed Work

[Track progress as work is done:]

### [Subtask Name] ✅

**Issue:** [What was the problem]

**Fix:** [What was done]

**Status:** Complete

---

## Notes

[Optional section for ongoing notes, questions, or discussions during implementation]

