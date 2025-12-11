# Direct Agent Configuration Editing

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables users to directly edit agent basics (instructions, model, maxSteps) without complex workflows. Critical for fine-tuning the Job Application Agent's behavior and personality.

---

## Problem Statement

Currently, the Config tab in the agent modal shows fields for editing (systemPrompt, model, objectives), but the "Save Changes" button only logs to console—it doesn't actually save. Users cannot directly edit the core agent properties that Mastra uses at runtime.

Additionally, our current `systemPrompt` field doesn't align with Mastra's flexible `instructions` format, which supports:
- Single string
- Array of strings
- Array of system messages with provider options

This limits users' ability to customize agent behavior and leverage Mastra's full instruction capabilities.

---

## User Value

- **Direct editing** of agent instructions without complex workflows
- **Support all Mastra instruction formats** (string, array, system messages)
- **Real-time updates** - changes save immediately and take effect
- **Simple UX** - just edit and save, no wizard or multi-step process
- **Better agent customization** - fine-tune personality, behavior, and capabilities
- **Model selection** - easily switch between LLM models
- **Advanced options** - configure maxSteps, provider-specific options

---

## User Flows

### Flow 1: Edit Instructions (Simple String)

```
1. User opens Agent Modal → Config tab
2. User sees "Instructions" textarea with current systemPrompt
3. User edits the text directly
4. User clicks "Save Changes"
5. System saves to agent config file
6. Success toast: "Agent configuration updated"
7. Changes take effect immediately (next chat uses new instructions)
```

### Flow 2: Edit Instructions (Array Format)

```
1. User clicks "Advanced" toggle in Instructions section
2. UI switches to "Array Format" mode
3. User sees list of instruction strings (one per line/item)
4. User can add/remove/reorder instructions
5. User saves
6. System converts to Mastra array format: ["instruction1", "instruction2"]
7. Saved to config
```

### Flow 3: Edit Model

```
1. User opens Config tab
2. User sees "Model" dropdown with current selection
3. User selects different model (e.g., "Gemini 3 Pro" → "GPT-4o")
4. User clicks "Save Changes"
5. System updates model in config
6. Next chat uses new model
```

### Flow 4: Edit Advanced Options

```
1. User expands "Advanced Options" section
2. User sees:
   - Max Steps: [5] (number input)
   - Provider Options: (collapsed, shows "Configure")
3. User changes maxSteps to 10
4. User clicks "Configure" for provider options
5. Modal shows provider-specific settings (reasoning, caching, etc.)
6. User saves
7. All changes persisted
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` | Current config UI (needs save functionality) | Current implementation |
| `app/api/workforce/services/agent-config.ts` | Agent config file manipulation | `updateAgentTools()`, regex patterns |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | How agent uses config at runtime | `createConfiguredAgent()`, `instructions` mapping |
| `_tables/agents/[folder]/config.ts` | Agent config file structure | File format, field locations |
| Mastra Agent API | Instruction formats, model options | `instructions`, `model`, `maxSteps`, `providerOptions` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Instruction Format Support** | Migrate `systemPrompt` → `instructions` format | Align with Mastra's native format, migration during update |
| **Save Method** | Extend existing regex-based file update pattern | Consistent with `updateAgentTools()` approach |
| **API Endpoint** | `PATCH /api/workforce/[agentId]/config` | RESTful, matches other update endpoints |
| **Validation** | Client-side + server-side Zod validation | Both client and server validation with UX for error display |
| **Format Conversion** | Migrate to `instructions` format in config | Store in Mastra's native format, no runtime conversion needed |
| **Advanced Options** | Collapsible section, hidden by default | Keep UI simple, advanced users can expand |
| **Auto-save vs Manual** | Manual save button (MVP), design for future auto-save | Manual for MVP, but UI architecture supports future debounced auto-save |
| **maxSteps Validation** | Any positive integer (no range limit) | Flexible, no artificial constraints |
| **Concurrent Edits** | Single-user assumption for MVP | Multi-user conflict handling deferred to later |
| **Model Validation** | Validate against `AVAILABLE_MODELS` from `app/api/workforce/[agentId]/chat/services/models.ts` | Use existing model list, ensures valid Vercel AI Gateway models |
| **Provider Options** | IN SCOPE - Model selection UI | Provider options (model selection) are part of MVP |
| **Config Backup** | No backups, rely on Git | Git provides version history, no need for backup files |

---

## Constraints

- **File-based Storage**: Must update TypeScript config files using regex (can't use database)
- **Backward Compatibility**: Existing `systemPrompt` field must continue working
- **Mastra API**: Must convert our format to Mastra's `instructions` format at runtime
- **Config File Structure**: Must preserve file formatting, comments, other fields
- **No Breaking Changes**: Existing agents must continue working after update

---

## Success Criteria

- [ ] User can edit systemPrompt/instructions in Config tab
- [ ] "Save Changes" button actually saves to config file
- [ ] Changes persist across page refreshes
- [ ] Agent uses updated instructions in next chat
- [ ] Model selection updates agent's LLM
- [ ] MaxSteps can be edited and saved
- [ ] Validation prevents invalid config (empty instructions, invalid model)
- [ ] Success/error feedback shown to user
- [ ] Config file formatting preserved (indentation, structure)

---

## Out of Scope

- **Instruction Format UI**: Array format editor (future enhancement)
- **Advanced Provider Options UI**: Provider-specific settings beyond model selection (reasoning, caching, etc.) - future
- **Version History**: Tracking config changes over time (future)
- **Config Templates**: Pre-built instruction templates (future)
- **A/B Testing**: Testing different instruction variants (future)
- **Bulk Updates**: Updating multiple agents at once (future)

**Note:** Provider options (model selection like Gemini/Claude) are IN SCOPE for MVP.

---

## Open Questions

- ✅ **Should we migrate `systemPrompt` → `instructions`?** **ANSWERED** - Yes, migrate during update
- ✅ **How to handle instruction format conversion?** **ANSWERED** - Store in Mastra's native `instructions` format
- ✅ **Should maxSteps be required or optional?** **ANSWERED** - Optional (Mastra defaults to 5), but allow any positive integer
- ✅ **How to validate model IDs?** **ANSWERED** - Validate against `AVAILABLE_MODELS` from `models.ts`
- ✅ **Should we support providerOptions in UI?** **ANSWERED** - Yes, provider options (model selection) are IN SCOPE

---

## Technical Architecture (High-Level)

### Backend Changes

1. **New API Endpoint**
   - `PATCH /api/workforce/[agentId]/config`
   - Accepts: `{ systemPrompt?, model?, maxSteps?, objectives?, guardrails? }`
   - Updates config file using regex patterns
   - Returns success/error

2. **Config Update Service**
   - `app/api/workforce/services/agent-config.ts` (extend existing)
   - Add: `updateAgentInstructions()`, `updateAgentModel()`, `updateAgentMaxSteps()`
   - Follow same regex pattern as `updateAgentTools()`

3. **Runtime Conversion**
   - `chat-service.ts` already converts `systemPrompt` → `instructions`
   - Ensure this handles all Mastra instruction formats

### Frontend Changes

1. **ConfigTab Enhancement**
   - Wire up "Save Changes" button to API
   - Add loading state during save
   - Show success/error toasts
   - Add validation (min length, required fields)

2. **Advanced Options Section**
   - Collapsible section for maxSteps
   - Number input with validation (1-50 range)
   - Help text explaining what maxSteps does

---

## References

- [Mastra Agents Overview](https://mastra.ai/docs/agents/overview) - Instruction formats, model options
- Existing implementation: `app/api/workforce/services/agent-config.ts` (update patterns)
- Current UI: `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`
- Runtime usage: `app/api/workforce/[agentId]/chat/services/chat-service.ts`

---

## Related Roadmap Items

- **Instruction Format Editor**: Advanced UI for array/system message formats
- **Provider Options**: UI for provider-specific settings (reasoning, caching)
- **Config Templates**: Pre-built instruction templates for common use cases
