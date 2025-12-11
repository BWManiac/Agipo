# Task 22a: Docs Feature — Research Log

**Status:** In Progress  
**Date:** December 2025  
**Parent Task:** [00-Product-Spec.md](./00-Product-Spec.md)

---

## How to Use This Document

This is a **research log** for discovering facts about external systems (APIs, SDKs, libraries) needed to implement the Docs feature.

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
| [RQ-1: How to create Lexical editor?](#rq-1-how-to-create-lexical-editor) | PR-1.1 (Document Editor) | ❓ |
| [RQ-2: How to serialize blocks to Markdown?](#rq-2-how-to-serialize-blocks-to-markdown) | PR-8.1 (Markdown Storage) | ❓ |
| [RQ-3: How to parse Markdown to blocks?](#rq-3-how-to-parse-markdown-to-blocks) | PR-8.1 (Markdown Storage) | ❓ |
| [RQ-4: How to insert blocks programmatically?](#rq-4-how-to-insert-blocks-programmatically) | PR-5.4 (Agent Insert) | ❓ |
| [RQ-5: How to delete blocks programmatically?](#rq-5-how-to-delete-blocks-programmatically) | PR-5.5 (Agent Replace/Delete) | ❓ |
| [RQ-6: How to implement slash commands?](#rq-6-how-to-implement-slash-commands) | PR-1.3 (Slash Commands) | ❓ |
| [RQ-7: How to implement drag-and-drop?](#rq-7-how-to-implement-drag-and-drop) | PR-1.2 (Block Reordering) | ❓ |
| [RQ-8: How to parse YAML frontmatter?](#rq-8-how-to-parse-yaml-frontmatter) | PR-4.1 (Properties Panel) | ❓ |
| [RQ-9: How to extract document outline?](#rq-9-how-to-extract-document-outline) | PR-3.1 (Document Outline) | ❓ |
| [RQ-10: How to generate version diffs?](#rq-10-how-to-generate-version-diffs) | PR-6.5 (Version Comparison) | ❓ |
| [RQ-11: How to implement auto-save?](#rq-11-how-to-implement-auto-save) | PR-1.5 (Auto-save) | ❓ |
| [RQ-12: How to handle large documents?](#rq-12-how-to-handle-large-documents) | PR-1.10 (Large Documents) | ❓ |

---

## Part 1: Lexical Editor Research

### RQ-1: How to Create Lexical Editor?

**Why It Matters:** PR-1.1 (Document Editor) — Foundation for all editing. Without editor creation, nothing works.

**Status:** ❓ Not Researched

**Question:** How do we create a Lexical editor instance in React? What configuration is needed? How do we render it?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How this affects our code]

**Source:** [Link to Lexical documentation]

---

### RQ-2: How to Serialize Blocks to Markdown?

**Why It Matters:** PR-8.1 (Markdown Storage) — Documents must be stored as Markdown. Need bidirectional conversion.

**Status:** ❓ Not Researched

**Question:** How do we convert Lexical editor state (blocks) to Markdown string? What does `@lexical/markdown` provide?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How blocks map to Markdown]

**Source:** [Link to Lexical Markdown docs]

---

### RQ-3: How to Parse Markdown to Blocks?

**Why It Matters:** PR-8.1 (Markdown Storage) — Need to load Markdown files into editor. Must convert Markdown → Lexical blocks.

**Status:** ❓ Not Researched

**Question:** How do we convert Markdown string to Lexical editor state? Does `@lexical/markdown` support parsing?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How Markdown elements map to blocks]

**Source:** [Link to Lexical Markdown docs]

---

### RQ-4: How to Insert Blocks Programmatically?

**Why It Matters:** PR-5.4 (Agent Insert) — Agents need to insert content at specific positions. Must work programmatically.

**Status:** ❓ Not Researched

**Question:** How do we insert a block (paragraph, heading, etc.) at a specific position in the editor? Can we insert by block ID or position?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How agent tools will use this]

**Source:** [Link to Lexical docs]

---

### RQ-5: How to Delete Blocks Programmatically?

**Why It Matters:** PR-5.5 (Agent Replace/Delete) — Agents need to delete content. Must work programmatically.

**Status:** ❓ Not Researched

**Question:** How do we delete blocks programmatically? Can we delete by block ID or range?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How agent tools will use this]

**Source:** [Link to Lexical docs]

---

### RQ-6: How to Implement Slash Commands?

**Why It Matters:** PR-1.3 (Slash Commands) — Users need `/` command menu to insert blocks. Core UX feature.

**Status:** ❓ Not Researched

**Question:** Does Lexical have built-in slash command support? Or do we need to build it with `cmdk`? How do we detect `/` input?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How slash commands integrate with editor]

**Source:** [Link to Lexical docs or cmdk docs]

---

### RQ-7: How to Implement Drag-and-Drop?

**Why It Matters:** PR-1.2 (Block Reordering) — Users need to reorder blocks via drag-and-drop. Core UX feature.

**Status:** ❓ Not Researched

**Question:** Does Lexical have built-in drag-and-drop? Or do we use `@dnd-kit`? How do we identify blocks for dragging?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How drag-and-drop integrates with editor]

**Source:** [Link to Lexical docs or @dnd-kit docs]

---

## Part 2: Markdown Processing Research

### RQ-8: How to Parse YAML Frontmatter?

**Why It Matters:** PR-4.1 (Properties Panel) — Documents have frontmatter that must be parsed and displayed.

**Status:** ❓ Not Researched

**Question:** How does `gray-matter` parse YAML frontmatter from Markdown? What's the API? Does it handle edge cases?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How frontmatter parsing works]

**Source:** [Link to gray-matter docs]

---

### RQ-9: How to Extract Document Outline?

**Why It Matters:** PR-3.1 (Document Outline) — Need to extract heading hierarchy from document for navigation.

**Status:** ❓ Not Researched

**Question:** How do we extract headings from Markdown? Use `remark` AST? How do we generate heading IDs for navigation?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How outline generation works]

**Source:** [Link to remark docs]

---

## Part 3: Version History Research

### RQ-10: How to Generate Version Diffs?

**Why It Matters:** PR-6.5 (Version Comparison) — Need to show differences between versions.

**Status:** ❓ Not Researched

**Question:** How do we generate diffs between Markdown versions? Use `diff` library? `diff-match-patch`? What format works best?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How version diffing works]

**Source:** [Link to diff library docs]

---

## Part 4: Editor Performance Research

### RQ-11: How to Implement Auto-save?

**Why It Matters:** PR-1.5 (Auto-save) — Documents must auto-save every 2 seconds idle.

**Status:** ❓ Not Researched

**Question:** How do we detect editor changes? How do we debounce saves? How do we show save status?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [How auto-save works]

**Source:** [Link to Lexical docs]

---

### RQ-12: How to Handle Large Documents?

**Why It Matters:** PR-1.10 (Large Documents) — Editor must handle 10k+ words without lag.

**Status:** ❓ Not Researched

**Question:** Does Lexical handle large documents well? Do we need virtualization? Any performance considerations?

**Answer:**
```typescript
// Fill in after researching
```

**Primitive Discovered:**
- Function/Method: 
- Signature: 
- Return type: 

**Implementation Note:** [Performance considerations]

**Source:** [Link to Lexical docs]

---

## Part 5: Integration Patterns

### RQ-13: How Do Lexical and remark Work Together?

**Why It Matters:** PR-8.1 (Markdown Storage) — Need to understand how Lexical's Markdown serialization relates to remark AST.

**Status:** ❓ Not Researched

**Question:** 
1. Does Lexical use remark internally?
2. Can we use remark AST for outline extraction?
3. How do we reconcile Lexical blocks with remark AST?

**Integration Pattern:**
```typescript
// Fill in after researching
```

**Source:** [Link to documentation]

---

### RQ-14: How Do Agent Tools Manipulate Blocks?

**Why It Matters:** PR-5.4, PR-5.5 (Agent Editing) — Agents need to insert/delete blocks. How do tools interact with editor?

**Status:** ❓ Not Researched

**Question:**
1. Can agent tools call editor functions directly?
2. Do we need a bridge between API and editor?
3. How do we handle concurrent edits (user + agent)?

**Integration Pattern:**
```typescript
// Fill in after researching
```

**Source:** [Link to documentation or code examples]

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|-----------|
| Create editor | | Lexical | ❓ |
| Serialize to Markdown | | @lexical/markdown | ❓ |
| Parse from Markdown | | @lexical/markdown | ❓ |
| Insert blocks | | Lexical | ❓ |
| Delete blocks | | Lexical | ❓ |
| Slash commands | | cmdk + Lexical | ❓ |
| Drag & drop | | @dnd-kit + Lexical | ❓ |
| Parse frontmatter | | gray-matter | ❓ |
| Extract outline | | remark | ❓ |
| Generate diffs | | diff or diff-match-patch | ❓ |
| Auto-save | | Lexical onChange | ❓ |

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

**Next Step:** Phase 0 Technical Spike (validate assumptions)

---

## Resources Used

- [Lexical Documentation](https://lexical.dev/)
- [Lexical GitHub](https://github.com/facebook/lexical)
- [Lexical Markdown Guide](https://lexical.dev/docs/packages/lexical-markdown)
- [remark Documentation](https://remark.js.org/)
- [gray-matter npm](https://www.npmjs.com/package/gray-matter)
- [diff npm](https://www.npmjs.com/package/diff)
- [cmdk Documentation](https://cmdk.paco.me/)
- [@dnd-kit Documentation](https://docs.dndkit.com/)

---

**Last Updated:** 2025-12-10
