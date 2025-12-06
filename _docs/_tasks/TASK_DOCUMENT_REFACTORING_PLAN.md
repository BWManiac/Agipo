# Task Document Refactoring Plan

**Date:** December 6, 2025  
**Purpose:** Align task documents with template while preserving the rich design decisions captured in diary entries  
**Context:** Based on comprehensive review of all diary entries (1-21), git history, and existing task documents

---

## 1. Executive Summary

Agipo has evolved through **21 diary entries** and **14 task documents** over several months. The diary entries capture the actual implementation learnings, design decisions, and architectural evolution—often in more detail than the task documents themselves.

This plan recommends:
1. **Preserving diary entries as the source of truth** for design decisions
2. **Cross-referencing** task documents to relevant diary entries
3. **Selectively refactoring** task documents to follow the template structure
4. **Reclassifying** some documents as research/planning docs rather than tasks

---

## 2. Understanding the Project Evolution

### 2.1 Evolution Timeline (From Diary Entries)

| Phase | Diary Entries | Key Tasks | Summary |
|-------|---------------|-----------|---------|
| **Foundation** (Early) | 1-7 | - | WebContainer execution, workflow canvas, node execution MVP |
| **Agent Framework** (Mid) | 8-9 | Task 1 | Vercel AI SDK spike, agent registry, tool loading |
| **Schema & Types** (Mid) | 10-11 | Task 2, 3 | Schema transpilation, agent tool management |
| **Records Domain** | 12-13 | Task 4, 5 | Polars data manipulation, mutation decomposition |
| **Workforce OS** | 14 | Task 6 | Agent modal redesign |
| **Integrations** | 15-17 | Task 7, 8 | Composio OAuth, connection tools, multi-account bindings |
| **Mastra Migration** | 18 | Task 9, 9.1 | Framework migration, memory integration, AI Elements |
| **Platform Tools** | 19-20 | Task 11, 12 | API key connections, NO_AUTH toolkit support |
| **Architecture** | 21 | Task 13, 14 | Composio/Mastra refactor (blocked), architecture audit |

### 2.2 Key Design Decisions Captured in Diary

These decisions are documented in diary entries and should be referenced from tasks:

| Decision | Diary Entry | Impact |
|----------|-------------|--------|
| IPO Model (Input-Process-Output) | 1, 3 | Core workflow architecture |
| Registry Pattern (agents/tools in `_tables`) | 9 | File-based config over database |
| ConnectionToolBinding for multi-account | 17 | Explicit binding vs. implicit lookup |
| LibSQL over PostgreSQL for memory | 18 | Per-agent isolation, zero infra |
| AI Elements over custom components | 18 | Standard chat UI |
| Manual schema conversion for Composio | 21 | Blocked official provider |

---

## 3. Task Document Classification

### 3.1 Categories

| Category | Definition | Template Fit |
|----------|------------|--------------|
| **Implementation Task** | Specific, bounded work with clear ACs | Full template |
| **Research Spike** | Exploratory work to inform decisions | Abbreviated template |
| **Planning Document** | Future vision, not yet actionable | Different format |
| **Completed Reference** | Historical record, no action needed | Archive as-is |

### 3.2 Current Classification

| Task | Current Type | Actual Type | Recommendation |
|------|--------------|-------------|----------------|
| **Task 1** | Implementation | ✅ Completed Reference | Update status, link to Diary 9 |
| **Task 2** | Implementation | Planning Document | Move to `_docs/Engineering/Planning/` |
| **Task 2-example.ts** | Code Example | Code Example | Move to `_docs/Engineering/Examples/` |
| **Task 2-vercel-compat** | Analysis | Research Spike | Merge into Task 2 or move |
| **Task 3** | Implementation | Planning Document | Keep in planning, not actionable yet |
| **Task 4** | Implementation | ✅ Completed Reference | Mark complete, link to Diary 13 |
| **Task 5** | Analysis | Analysis Document | Keep as-is, it's a design doc |
| **Task 6** | Implementation | ✅ Completed Reference | Mark complete, link to Diary 14 |
| **Task 7** | Research Spike | ✅ Completed Research | Merge into Diary 15 or archive |
| **Task 8** | Implementation | ✅ Completed Reference | Merge test results into main doc |
| **Task 8-results** | Test Report | Merge Target | Merge into Task 8 |
| **Task 9** | Implementation | ✅ Completed Reference | Mark Phase 1 complete, link to Diary 18 |
| **Task 9.1** | Implementation | ✅ Completed Reference | Best example of template usage |
| **Task 10** | Planning | Vision Document | Move to `_docs/Product/Strategy/` |
| **Task 11** | Implementation | Planning Document | Keep, partially complete |
| **Task 12** | Implementation | ⚠️ In Progress | Good template fit, needs runtime fix |
| **Task 13** | Implementation | ❌ Blocked | Good template fit, blocked status documented |
| **Task 14** | Implementation | 🟡 Ready | Good template fit, ready to execute |

---

## 4. Refactoring Recommendations by Document

### 4.1 Priority 1: Quick Wins (< 30 min total)

#### Task 8: Backend Integration
**Action:** Merge `8-backend-integration-test-results.md` into main document
```
8-backend-integration.md
└── Section 10. Completed Work
    └── Merge content from test results doc
    
DELETE: 8-backend-integration-test-results.md
```

#### Task 1: Agent Registry Preflight
**Action:** Mark complete, add cross-reference
```
Add to header:
**Status:** Complete
**Diary Reference:** Entry 9 - AgentRegistry.md

Add to section 10 (Completed Work):
- Link to diary entry for implementation details
```

#### Task 4: Schema Evolution Fix
**Action:** Mark complete, add reference
```
Add to header:
**Status:** Complete
**Diary Reference:** Entry 13 - RecordsDomainAndPolars.md
```

### 4.2 Priority 2: Document Relocation (30-60 min)

| File | Current Location | New Location | Reason |
|------|------------------|--------------|--------|
| `2-workflow-schema-and-transpiler.md` | `_tasks/` | `_docs/Engineering/Planning/` | Vision doc, not actionable |
| `2-workflow-schema-and-transpiler-example.ts` | `_tasks/` | `_docs/Engineering/Examples/` | Code example |
| `2-workflow-schema-vercel-ai-sdk-compatibility.md` | `_tasks/` | `_docs/Engineering/Architecture/` | Analysis doc |
| `7-integrations-spike.md` | `_tasks/` | Archive or merge into Diary 15 | Superseded by implementation |
| `10-platform-evolution.md` | `_tasks/` | `_docs/Product/Strategy/` | Vision/roadmap |

### 4.3 Priority 3: Template Alignment (1-2 hours)

Documents that should follow the full template:

#### Task 11: API Key Connections
**Current State:** Good structure, partially complete
**Missing:**
- [ ] Current State code examples
- [ ] Per-phase test flows

#### Task 12: NO_AUTH Platform Tools
**Current State:** Excellent template usage
**Missing:**
- [ ] Update status for Phase 4 investigation
- [ ] Link to Task 13 for architectural context

#### Task 13: Composio Mastra Refactor
**Current State:** Good structure, blocked
**Missing:**
- [ ] Categorized ACs (Backend, Integration, Backwards Compat)
- [ ] Formal User Flows in template format

#### Task 14: Architecture Refactoring
**Current State:** Good file impact analysis
**Missing:**
- [ ] User Flows section
- [ ] Design Decisions table

---

## 5. Template Enhancements

Based on the best examples (Task 9.1, Task 12), recommend adding to `_TEMPLATE.md`:

### 5.1 New Sections to Add

| Section | Purpose | Example |
|---------|---------|---------|
| **Diary Reference** | Link to relevant diary entries | Task 9.1 links to Diary 18 |
| **Status Tracking Table** | Phase-by-phase status | Task 9.1 "Phases Overview" table |
| **Key Learnings** | Post-implementation insights | Task 13 "Lessons Learned" |
| **Test Plan** | Verification approach | Task 14 section 7 |
| **Rollback Strategy** | Risk mitigation | Task 14 section 8 |

### 5.2 Header Enhancement

Current:
```
**Status:** [Planning | In Progress | Complete]
**Date:** [Month Year]
**Goal:** [One-sentence description]
```

Proposed:
```
**Status:** [Planning | In Progress | Complete | Blocked]
**Created:** [Date]
**Last Updated:** [Date]
**Goal:** [One-sentence description]
**Diary Reference:** Entry [N] - [Title]
```

---

## 6. Diary-Task Cross-Reference Matrix

| Diary Entry | Related Task(s) | Relationship |
|-------------|-----------------|--------------|
| 1-7 (Execution Engine) | - | Foundation (pre-task era) |
| 8 (Agent SDK Spike) | Task 1 | Task 1 implements findings |
| 9 (Agent Registry) | Task 1 | Implementation reference |
| 10-11 (Schema/Tools) | Task 2, 3 | Planning informed by entries |
| 12-13 (Records) | Task 4, 5 | Task 4 implementation reference |
| 14 (Workforce OS) | Task 6 | Task 6 implementation reference |
| 15-17 (Integrations) | Task 7, 8 | Task 7 research, Task 8 implementation |
| 18 (Mastra Memory) | Task 9, 9.1 | Task 9.1 is most detailed |
| 19-20 (Platform Tools) | Task 11, 12 | Parallel documentation |
| 21 (Refactor Blocked) | Task 13 | Task 13 is detailed, Diary 21 adds context |

---

## 7. Action Items

### Immediate (Do Now)

- [ ] Merge Task 8 test results into main doc
- [ ] Add "Complete" status and diary references to Tasks 1, 4, 6, 9 (Phase 1)
- [ ] Delete `8-backend-integration-test-results.md`

### Short-Term (This Week)

- [ ] Move Task 2, Task 10 to appropriate locations
- [ ] Add User Flows to Task 14
- [ ] Update Task 12 status with Phase 4 findings
- [ ] Add template enhancements (header format, new sections)

### Medium-Term (When Revisiting)

- [ ] Full template alignment for Tasks 11, 12, 13, 14
- [ ] Create `_docs/Engineering/Examples/` folder
- [ ] Create `_docs/Engineering/Planning/` folder
- [ ] Consider archiving older completed tasks

---

## 8. Philosophy Note

The task template is designed for **execution-focused** work. Not every document needs to follow it:

| Document Type | Template Usage |
|---------------|----------------|
| Implementation Task | Full template |
| Research Spike | Executive Summary + Findings + Next Steps |
| Planning Document | Vision + Phases + Open Questions |
| Analysis | Current State + Options + Recommendation |

**The diary entries are invaluable.** They capture the narrative of development—the bugs, the breakthroughs, the dead ends. Tasks should reference them, not duplicate their content.

---

## 9. Summary

| Action | Count | Effort |
|--------|-------|--------|
| Merge/Delete | 2 files | 15 min |
| Status Updates | 4 files | 15 min |
| Relocate | 5 files | 30 min |
| Template Alignment | 4 files | 2 hours |
| Template Enhancement | 1 file | 30 min |

**Total Estimated Effort:** ~3.5 hours

**Recommended Approach:** Start with immediate actions (30 min), then relocations (30 min), then template alignment as tasks are revisited.

---

## References

- **Template:** `_docs/_tasks/_TEMPLATE.md`
- **Diary Index:** `_docs/_diary/` (21 entries)
- **Architecture Audit:** `_docs/Architecture/ARCHITECTURE_AUDIT_2025-12-06.md`
- **CLAUDE.MD:** Project context file


