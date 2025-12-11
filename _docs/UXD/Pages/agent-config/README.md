# Agent Config - Direct Agent Configuration Editing

**Date:** December 11, 2025  
**Status:** Implementation Ready  
**Roadmap Ref:** `_docs/Product/ROADMAP/agent-config/01-Direct-Agent-Configuration-Editing.md`  

---

## Overview

This feature enables users to directly edit agent configuration (instructions, model, maxSteps) in the Config tab of the Agent Modal. Currently the "Save Changes" button only logs to console - this feature makes it actually save and update the agent config files.

### User Value
- **Direct editing** of agent instructions without complex workflows
- **Support all Mastra instruction formats** (string, array, system messages)
- **Real-time updates** - changes save immediately and take effect
- **Simple UX** - just edit and save, no wizard or multi-step process
- **Model selection** - easily switch between LLM models
- **Advanced options** - configure maxSteps, provider-specific options

---

## Mockup Files

| File | Purpose | User Flow |
|------|---------|-----------|
| `01-config-tab-basic.html` | Current config tab with working save functionality | User edits instructions and saves |
| `02-config-tab-advanced.html` | Advanced options expanded (maxSteps, provider options) | User configures advanced settings |
| `03-instruction-formats.html` | Array format editor for complex instructions | User switches to array format mode |
| `04-model-selector.html` | Model dropdown with available options | User changes agent's LLM model |
| `05-validation-states.html` | Form validation and error states | User sees validation feedback |
| `06-save-states.html` | Loading, success, and error save states | User feedback during save process |

---

## Design Patterns Used

### Components
- **Card** - Config sections organization
- **Textarea** - Instructions editing
- **Select** - Model selection dropdown  
- **Input** - MaxSteps number input
- **Button** - Save Changes action
- **Badge** - Status indicators
- **Collapsible** - Advanced options toggle
- **Toast** - Success/error feedback

### Layout
- **Two-column** - Main config + advanced options
- **Progressive disclosure** - Advanced options hidden by default
- **Form validation** - Real-time validation with error states

### Styling
- **Agipo brand colors** - Consistent with workforce UI
- **Rounded corners** - Border radius 8px-16px
- **Subtle shadows** - Card elevation
- **Typography scale** - Text sizes from existing UI

---

## State Management

### Frontend State
```typescript
interface ConfigTabState {
  // Form data
  instructions: string;
  instructionFormat: 'string' | 'array';
  instructionArray: string[];
  model: string;
  maxSteps?: number;
  objectives: string;
  guardrails: string;
  
  // UI state
  showAdvanced: boolean;
  isLoading: boolean;
  hasChanges: boolean;
  
  // Validation
  errors: {
    instructions?: string;
    model?: string;
    maxSteps?: string;
  };
}
```

### API Integration
- **Save endpoint**: `PATCH /api/workforce/[agentId]/config`
- **Validation**: Client-side + server-side Zod validation
- **File updates**: Regex-based TypeScript config file updates

---

## Acceptance Criteria

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

## Technical Notes

### Backend Changes
1. **New API Endpoint** - `PATCH /api/workforce/[agentId]/config`
2. **Config Update Service** - Extend `agent-config.ts` with new update functions
3. **Runtime Conversion** - Ensure `chat-service.ts` handles all instruction formats

### Frontend Changes  
1. **ConfigTab Enhancement** - Wire up save button to API
2. **Advanced Options Section** - Collapsible maxSteps configuration
3. **Validation** - Form validation with error display

### Migration Strategy
- Migrate `systemPrompt` → `instructions` format during update
- Maintain backward compatibility with existing configs
- Store in Mastra's native format to avoid runtime conversion

---

## Related Features

- **Agent Networks** - Manager agents will need enhanced config options
- **Workflow Integration** - Agent config affects workflow tool availability  
- **RAG Integration** - Knowledge base configuration will extend this pattern