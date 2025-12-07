# Task [NUMBER].1: [FEATURE NAME] — Research Log

**Status:** In Progress  
**Date:** [Month Day, Year]  
**Parent Task:** [Link to Product Spec]

---

## How to Use This Document

This is a **research log** for discovering facts about external systems (APIs, SDKs, libraries). 

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks (PR-X.X)
3. **Answer** — What we discovered
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** External APIs are immutable. We can't change their shape—we discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Short description](#rq-1-question-title) | PR-X.X | ❓ |
| [RQ-2: Short description](#rq-2-question-title) | PR-X.X | ❓ |
| [RQ-3: Short description](#rq-3-question-title) | PR-X.X | ❓ |

---

## Part 1: [API/SDK Name] Research

### RQ-1: [Question Title]

**Why It Matters:** PR-X.X ([Requirement Name]) — [One sentence on why this blocks implementation]

**Status:** ❓ Not Researched

**Question:** [The specific thing we need to discover]

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How this affects our code]

**Source:** [Link to documentation]

---

### RQ-2: [Question Title]

**Why It Matters:** PR-X.X ([Requirement Name]) — [One sentence]

**Status:** ❓ Not Researched

**Question:** [Specific question]

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 

**Implementation Note:** 

**Source:** 

---

### RQ-3: [Question Title]

**Why It Matters:** PR-X.X ([Requirement Name]) — [One sentence]

**Status:** ❓ Not Researched

**Question:** [Specific question]

**Answer:**


**If Not Available, Workarounds:**

| Option | Pros | Cons |
|--------|------|------|
| A: [Approach] | | |
| B: [Approach] | | |

**Our Choice:** 

**Source:** 

---

## Part 2: [Second API/SDK Name] Research (if applicable)

### RQ-4: [Question Title]

[Same structure as above]

---

## Part 3: Integration Patterns

### RQ-X: How do [System A] and [System B] work together?

**Why It Matters:** [Which requirements this affects]

**Status:** ❓ Not Researched

**Questions:**
1. Can [A] use [B] directly?
2. Do we need a wrapper?
3. How does data flow between them?

**Integration Pattern:**
```typescript
// Fill in after researching
```

**Source:** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| [Capability needed] | | [API/SDK] | ❓ |
| [Capability needed] | | [API/SDK] | ❓ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| - | - | - |

### Key Learnings

[Summarize the most important discoveries that affect implementation]

1. 
2. 
3. 

---

## Exit Criteria

- [ ] All RQ questions answered
- [ ] Summary table complete
- [ ] No unresolved blockers
- [ ] Key learnings documented

**Next Step:** Implementation Plan

---

## Resources Used

- [Resource 1](URL)
- [Resource 2](URL)
- Existing code: `path/to/file.ts`




