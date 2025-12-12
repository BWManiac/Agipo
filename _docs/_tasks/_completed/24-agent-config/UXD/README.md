# Agent Configuration Direct Editing - UXD

**Created:** December 2024
**Status:** UXD Design Phase
**Related Roadmap:** `../01-Direct-Agent-Configuration-Editing.md`

---

## Overview

Direct agent configuration editing enables users to modify agent settings without accessing the underlying configuration files. This UXD provides high-fidelity mockups for an intuitive configuration interface that allows editing of instructions, model selection, max steps, and other agent parameters.

### Design Philosophy

Building upon the existing ConfigTab in the workforce modal, we're extending the interface to support:
- **Direct instruction editing** with migration from `systemPrompt` to `instructions` format
- **Model selection** with available models from the system
- **Validation feedback** for configuration changes
- **Save states** showing success/error conditions
- **Comparison view** for before/after configuration changes

---

## Scope

### In Scope (v1)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Instruction Editor** | Rich text editor for agent instructions | Core |
| **Model Selector** | Dropdown with available AI models | Core |
| **Max Steps Configuration** | Number input with validation | Core |
| **Objectives Management** | Multi-line text for agent objectives | Core |
| **Guardrails Editor** | Safety and limitation settings | Core |
| **Save/Cancel Actions** | Configuration persistence with validation | Core |
| **Error States** | Clear feedback for validation failures | Core |
| **Success Confirmation** | Visual feedback on successful save | Core |
| **Configuration Comparison** | Side-by-side view of changes | Nice to have |
| **Auto-save Indicator** | Show when changes are being saved | Future |

### Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Version History | Handled by Git for now |
| Multi-agent Bulk Editing | Single agent focus |
| Advanced Model Parameters | Temperature, top-p, etc. (future) |
| Custom Model Addition | Pre-defined models only |

---

## Features to Demonstrate in UXD

### 1. Main Configuration Panel (`01-agent-config-panel.html`)

The primary configuration interface within the agent modal:

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Agent Configuration                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Instructions                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ You are a helpful assistant that...                 │    │
│  │ [Rich text editor with formatting]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Model Selection                                             │
│  [Dropdown: Claude 3.5 Sonnet ▼]                            │
│                                                              │
│  Max Steps                                                   │
│  [Number input: 5]                                          │
│                                                              │
│  Objectives                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ - Help users understand complex topics               │    │
│  │ - Provide accurate information                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Guardrails                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ - Never provide medical advice                       │    │
│  │ - Always cite sources                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Cancel]                                    [Save Changes]  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Instruction Editor (`02-instruction-editor.html`)

Focused view of the instruction editing interface:
- Rich text editor with markdown support
- Character/token count
- Formatting toolbar (if applicable)
- Migration indicator for systemPrompt → instructions

### 3. Model Selector (`03-model-selector.html`)

Model selection dropdown showing:
- Available models grouped by provider (OpenAI, Anthropic, Google)
- Model descriptions and capabilities
- Current selection indicator
- Cost/speed indicators (optional)

### 4. Validation States

#### `04-validation-states/04a-validation-error.html`
Shows validation errors:
- Field-level error messages
- Global error banner
- Disabled save button
- Clear error recovery instructions

#### `04-validation-states/04b-save-success.html`
Success confirmation:
- Success banner with checkmark
- Auto-dismiss timer
- Updated timestamp
- Optional "View changes" link

### 5. Configuration Comparison (`05-config-comparison.html`)

Before/after comparison view:
- Side-by-side diff of configuration changes
- Highlighted additions/deletions
- Revert individual changes option
- Confirm all changes button

---

## UXD File Manifest

| # | File | Description | Status |
|---|------|-------------|--------|
| 01 | `01-agent-config-panel.html` | Main configuration interface | Pending |
| 02 | `02-instruction-editor.html` | Detailed instruction editing view | Pending |
| 03 | `03-model-selector.html` | Model selection with descriptions | Pending |
| 04 | `04-validation-states/` | Validation and save states | Pending |
|    | `04a-validation-error.html` | Error state display | Pending |
|    | `04b-save-success.html` | Success confirmation | Pending |
| 05 | `05-config-comparison.html` | Configuration change comparison | Pending |
| -- | `Frontend-Backend-Mapping.md` | API endpoint documentation | Pending |

---

## Design Patterns from Existing Code

Based on analysis of the current ConfigTab component:

### Current UI Elements
- **Cards**: `bg-white p-6 rounded-xl border border-gray-200 shadow-sm`
- **Labels**: `text-sm font-medium text-gray-700 mb-1`
- **Descriptions**: `text-xs text-gray-500 mb-2`
- **Inputs**: Textarea, Select components from shadcn/ui
- **Save Button**: `bg-black text-white hover:bg-gray-800`

### Color Palette (from existing code)
- Background: `bg-gray-50`
- Cards: `bg-white`
- Borders: `border-gray-200`
- Text primary: `text-gray-700`
- Text secondary: `text-gray-500`
- Button primary: `bg-black text-white`

### Layout Patterns
- Max width container: `max-w-2xl mx-auto`
- Card spacing: `space-y-6`
- Form element spacing: `space-y-4`
- Grid layouts: `grid grid-cols-2 gap-4`

---

## Agent Integration

### Configuration Tools

These tools will be available for agents to self-modify (with user approval):

| Tool | Description |
|------|-------------|
| `agent_update_instructions` | Modify agent's own instructions |
| `agent_update_objectives` | Update agent objectives |
| `agent_suggest_model` | Suggest a different model based on task |

### Auto-configuration

Agents may suggest configuration changes based on:
- Task performance metrics
- User feedback patterns
- Error frequency
- Token usage optimization

---

## Technical Notes

### Validation Rules
1. **Instructions**: Required, min 10 characters
2. **Model**: Must be from available models list
3. **Max Steps**: Positive integer, no upper limit
4. **Objectives**: At least one objective required
5. **Guardrails**: Optional but recommended

### Save Behavior
1. Client-side validation first
2. Server-side validation on submit
3. Partial updates supported (save only changed fields)
4. File update via regex replacement
5. Git commit for version tracking

---

## Open Questions

1. ~~Should we support markdown in instructions?~~ **YES** - Matches with instructions format
2. Should model changes trigger a warning about cost implications?
3. How do we handle concurrent edits (multiple browser tabs)?
4. Should there be a "reset to defaults" option?
5. Should agents be able to modify their own configuration?

---

## Related Documentation

- **Current Implementation**: `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`
- **Agent Types**: `_tables/types.ts`
- **Available Models**: `app/api/workforce/[agentId]/chat/services/models.ts`
- **Roadmap Doc**: `../01-Direct-Agent-Configuration-Editing.md`