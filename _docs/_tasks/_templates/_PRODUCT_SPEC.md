# Task [NUMBER]: [FEATURE NAME] — Product Spec

**Status:** Planning  
**Date:** [Month Day, Year]  
**Goal:** [One sentence: what does success look like?]

---

## How to Use This Template

This template defines **what to build**. Fill it in before writing code.

**Sections:**
1. Executive Summary — The "elevator pitch"
2. Product Requirements — What the feature must do
3. Acceptance Criteria — How we know it's done
4. User Flows — Step-by-step user journeys
5. Design Decisions — Choices we control
6. UXD Requirements — Mockups needed before implementation
7. Success Criteria — The finish line

**When complete:** This document informs the Research Log (if external APIs are involved) and the Implementation Plan.

---

## 1. Executive Summary

[2-4 sentences answering:]
- What problem does this solve?
- Who benefits?
- What does the end state look like?

**End state:** [One sentence describing the user-visible outcome]

---

## 2. Product Requirements

[Organize requirements by category. Each requirement should be specific and testable.]

### 2.1 [Category Name]

**Definition:** [What this category covers]

**Why it matters:** [Business/user value]

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | [Specific capability] | P0 |
| PR-1.2 | [Specific capability] | P1 |

### 2.2 [Category Name]

**Definition:** [What this category covers]

**Why it matters:** [Business/user value]

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | [Specific capability] | P0 |

[Add more categories as needed]

---

## 3. Acceptance Criteria

[10-20 succinct, testable criteria organized by category]

### [Category 1] ([N] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | [Measurable outcome] | [Test method] |
| AC-2 | [Measurable outcome] | [Test method] |

### [Category 2] ([N] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-3 | [Measurable outcome] | [Test method] |

### Backwards Compatibility

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-X | Existing [feature] still works | [Test method] |

---

## 4. User Flows

### Flow 1: [Happy Path Name]

```
1. User [action]
2. System [response]
3. User sees [outcome]
4. ...
```

### Flow 2: [Error/Edge Case Name]

```
1. User [action]
2. [Error condition]
3. System shows [error message]
4. User can [recovery action]
```

### Flow 3: [Alternative Path Name]

```
1. ...
```

---

## 5. Design Decisions

[Document choices YOU control. These are internal decisions, not external API facts.]

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | [Choice to make] | A: [option], B: [option] | [A or B] | ❌ |
| DD-2 | [Choice to make] | A: [option], B: [option] | [A or B] | ❌ |

### 5.2 Decision Log

[Record decisions as they're made]

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| - | - | - | - |

---

## 6. UXD Requirements

[If this task has frontend work, specify what mockups are needed BEFORE implementation]

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| [Component/View name] | [What it demonstrates] | [Key elements] |

### Mockup Location

```
_docs/UXD/Pages/[feature-area]/
├── index.html          # Parent file linking variations
├── variation-1/        # Primary design
├── variation-2/        # Alternative approach (optional)
└── variation-3/        # Alternative approach (optional)
```

### Exit Criteria for UXD Phase

- [ ] All required mockups complete
- [ ] Each mockup shows all P0 requirements
- [ ] Stakeholder review complete
- [ ] Preferred direction chosen

---

## 7. Success Criteria

[High-level criteria that indicate the feature is complete]

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| [User-visible outcome] | [Validation method] | P0 |
| [User-visible outcome] | [Validation method] | P0 |
| [Stretch goal] | [Validation method] | P1 |

**North Star:** [The ultimate success metric in one sentence]

---

## 8. Out of Scope

[Explicitly list what this task does NOT include]

- [Future enhancement]
- [Related but separate concern]
- [Edge case deferred]

---

## 9. Related Documents

- **Research Log:** `[N].1-[feature]-research.md` (if applicable)
- **Implementation Plan:** `[N].2-[feature]-implementation.md`
- **Previous Task:** Task [X] - [Name]
- **Feature Doc:** `_docs/Product/Features/[name].md`

---

## Notes

[Space for ongoing discussion, questions, or clarifications during planning]




