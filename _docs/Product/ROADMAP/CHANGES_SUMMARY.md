# Roadmap Documents - Changes Summary

**Date:** December 2024  
**Changes Based On:** User answers to implementation questions

---

## Summary of Changes

### 1. Document Renumbering
- ✅ Renamed task files from `01-*-Task.md` to `01A-*-Task.md` pattern
- ✅ Roadmap files remain as `01-*.md`
- ✅ Research logs created as `01B-*-Research.md`

### 2. Research Logs Created
Created research logs for all features using external APIs:
- `browser-automation/01B-Authenticated-Sessions-Research.md` (Anchor Browser)
- `browser-automation/02B-Tasks-API-Research.md` (Anchor Browser)
- `browser-automation/03B-Stagehand-Integration-Research.md` (Stagehand)
- `agent-networks/01B-Manager-Agents-Research.md` (Mastra Agent Networks)
- `workflow-state-injection/01B-Workflow-State-Injection-Research.md` (Mastra)
- `workflow-visibility/01B-Workflow-Observability-Research.md` (Mastra)
- `planner/01B-Planner-System-Research.md` (Inngest + Composio)
- `rag-integration/01B-RAG-Integration-Research.md` (Mastra RAG)

### 3. Questions Document Updated
- ✅ Marked answered questions with ✅ in `ROADMAP_QUESTIONS.md`
- ✅ Added research log references for external API questions
- ✅ Added summary of research logs created

### 4. Documents Updated with Answers

#### Agent Config
- ✅ Updated Key Decisions with migration strategy, validation approach, model validation
- ✅ Updated Open Questions section with answers
- ✅ Updated Out of Scope to clarify provider options are IN SCOPE
- ✅ Updated task pseudocode with validation details

#### Agent Networks
- ✅ Updated Key Decisions with manager UI decisions (separate section, badge, hybrid model)
- ✅ Updated Open Questions with answers
- ✅ Added research log reference

---

## Key Decisions Documented

### Agent Configuration
1. **Migration**: Migrate `systemPrompt` → `instructions` format during update
2. **maxSteps**: Allow any positive integer (no range limit)
3. **Concurrent Edits**: Single-user assumption for MVP
4. **Model Validation**: Use `AVAILABLE_MODELS` from `models.ts`
5. **Provider Options**: IN SCOPE (model selection UI)
6. **Error Handling**: Continue with partial updates
7. **Validation**: Both client-side and server-side
8. **Auto-save**: Design UI for future support, manual for MVP
9. **Backup**: No backups, rely on Git

### Manager Agents
1. **UI Location**: Dedicated section on workforce page + badge
2. **Sub-Agent Selection**: Multi-select from all available agents
3. **Manager Capabilities**: Hybrid model - can have own tools/workflows
4. **Delegation Visibility**: Full sub-agent conversation (expandable)
5. **Error Handling**: Defer to Mastra framework
6. **Manager Memory**: Research Mastra documentation (see research log)

---

## Next Steps

1. **Research Phase**: Fill in research logs (01B documents) by researching:
   - Anchor Browser documentation for profiles, tasks, Stagehand
   - Mastra documentation for Agent Networks, workflow state, streaming, RAG
   - Inngest and Composio APIs for planner system

2. **Implementation**: Use research findings to update task documents with specific API calls and patterns

3. **Continue Answering Questions**: User can continue answering remaining questions in `ROADMAP_QUESTIONS.md`

---

## File Structure

```
_docs/Product/ROADMAP/
├── ROADMAP_QUESTIONS.md (updated with ✅ markers)
├── CHANGES_SUMMARY.md (this file)
├── agent-config/
│   ├── 01-Direct-Agent-Configuration-Editing.md (updated)
│   ├── 01A-Direct-Agent-Configuration-Editing-Task.md (renamed + updated)
│   └── (no research log - no external APIs)
├── agent-networks/
│   ├── 01-Manager-Agents.md (updated)
│   ├── 01A-Manager-Agents-Task.md (renamed + updated)
│   └── 01B-Manager-Agents-Research.md (created)
├── browser-automation/
│   ├── 01-Authenticated-Sessions.md
│   ├── 01A-Authenticated-Sessions-Task.md (updated with research log ref)
│   ├── 01B-Authenticated-Sessions-Research.md (created)
│   ├── 02-Tasks-API.md
│   ├── 02A-Tasks-API-Task.md (updated with research log ref)
│   ├── 02B-Tasks-API-Research.md (created)
│   ├── 03-Stagehand-Integration.md
│   ├── 03A-Stagehand-Integration-Task.md (updated with research log ref)
│   └── 03B-Stagehand-Integration-Research.md (created)
├── workflow-state-injection/
│   ├── 01-Workflow-State-Injection.md
│   ├── 01A-Workflow-State-Injection-Task.md (updated with research log ref)
│   └── 01B-Workflow-State-Injection-Research.md (created)
├── workflow-visibility/
│   ├── 01-Workflow-Observability.md
│   ├── 01A-Workflow-Observability-Task.md (updated with research log ref)
│   └── 01B-Workflow-Observability-Research.md (created)
├── planner/
│   ├── 01-Planner-System.md
│   ├── 01A-Planner-System-Task.md (renamed + updated with research log ref)
│   └── 01B-Planner-System-Research.md (created)
└── rag-integration/
    ├── 01-RAG-for-Records-and-Docs.md
    ├── 01A-RAG-for-Records-and-Docs-Task.md (renamed + updated with research log ref)
    └── 01B-RAG-Integration-Research.md (created)
```

---

## Philosophy Applied

**Internal vs External Questions:**
- **Internal questions** (our design decisions) → Answered directly in roadmap/task docs
- **External questions** (API limitations) → Moved to research logs (01B) for documentation research

**Research Log Focus:**
- Research logs focus on discovering what external APIs provide
- Answers will be filled by researching official documentation
- Primitives discovered will inform implementation details


