# Phase X: [Phase Name]

**Status:** 📋 Planned | 🚧 In Progress | ✅ Complete | ⚠️ Partially Complete  
**Depends On:** Phase X-1  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

One to two paragraphs describing what this phase accomplishes. What can users do after this phase is complete? What problem does it solve?

### Design Decisions

Key architectural and design choices for this phase:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Area] | [What we chose] | [Why] |
| [Area] | [What we chose] | [Why] |

### Pertinent Research

Relevant findings from research that inform this phase:

- **[Topic]**: Key finding or quote from research
- **[Topic]**: Key finding or quote from research

*Source: `research-doc.md`, `other-doc.md`*

### Overall File Impact

Complete list of all files created/modified in this phase, organized by category:

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/.../route.ts` | Create | Product-focused description | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/.../services/example.ts` | Create | Product-focused description | A |

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/.../types/example.ts` | Create | Product-focused description | A |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/.../store/slices/exampleSlice.ts` | Create | Product-focused description | A |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/.../components/Example.tsx` | Create | Product-focused description | B |

*Note: Remove empty sections. Add other categories as needed (e.g., Scripts, Config, Tests).*

### Overall Acceptance Criteria

Master list of acceptance criteria for the entire phase:

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-X.1 | [What must be true] | [How to verify] | A |
| AC-X.2 | [What must be true] | [How to verify] | A |
| AC-X.3 | [What must be true] | [How to verify] | B |

### User Flows (Phase Level)

High-level user journeys that span multiple parts:

#### Flow 1: [Flow Name]

```
1. User does X
2. System responds with Y
3. User sees Z
4. ...
```

---

## Part A: [Part Name]

### Goal

What Part A specifically accomplishes. This should be a discrete, shippable unit of work.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `path/to/file.ts` | Create | Product-focused description | ~XX |

### Pseudocode

#### `path/to/route.ts`

```
GET /api/example
├── Validate request parameters
├── Call service function
│   ├── Fetch from database
│   └── Transform data
└── Return JSON response
```

#### `path/to/service.ts`

```
functionName(input: Type): ReturnType
├── Step 1: Description
├── Step 2: Description
│   ├── Sub-step 2a
│   └── Sub-step 2b
└── Return result
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-X.1 | [What must be true] | [How to verify] |
| AC-X.2 | [What must be true] | [How to verify] |

### User Flows

#### Flow A.1: [Flow Name]

```
1. User does X
2. System responds with Y
3. ...
```

---

## Part B: [Part Name]

### Goal

What Part B specifically accomplishes.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `path/to/file.ts` | Create | Product-focused description | ~XX |

### Pseudocode

#### `path/to/component.tsx`

```
ComponentName
├── Render: Main layout
│   ├── Header section
│   ├── Content area
│   └── Footer actions
├── State: [what state it manages]
└── Events: [key interactions]
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-X.3 | [What must be true] | [How to verify] |

### User Flows

#### Flow B.1: [Flow Name]

```
1. User does X
2. ...
```

---

## Part C: [Part Name]

*(Repeat structure as needed for additional parts)*

---

## Out of Scope

What is explicitly NOT included in this phase:

- [Feature/capability] → Planned for Phase Y
- [Feature/capability] → Future consideration
- [Feature/capability] → Not planned

---

## References

- **Research**: `doc-name.md` - Brief description of what's relevant
- **Related Phase**: `XX-PhaseY.md` - How it relates
- **External**: [Link](url) - What it provides

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | [Name] |
| YYYY-MM-DD | [Description of change] | [Name] |

---

**Last Updated:** [Date]

