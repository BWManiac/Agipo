# Diary Entry 18: Direct Agent Configuration Editing Implementation

**Date:** 2024-12-11
**Branch:** `feature/agent-config-editing`
**Author:** Claude (with zen)
**Status:** In Progress

## Overview

Implementing direct agent configuration editing to enable users to modify agent settings (systemPrompt, model, maxSteps, objectives, guardrails) through the Config tab UI with proper backend persistence.

## Problem Statement

- Config tab has UI fields but "Save Changes" button only console.logs
- No actual persistence to agent config files
- Users cannot fine-tune agent behavior directly
- Field naming mismatch: `systemPrompt` vs Mastra's `instructions`

## Implementation Plan

### Phase 1: Backend API Foundation
- Create PATCH endpoint at `/api/workforce/[agentId]/config`
- Add service methods for updating each field
- Use regex patterns matching existing `updateAgentTools()` approach

### Phase 2: Frontend Integration  
- Wire up ConfigTab save button to call API
- Add loading states and user feedback
- Implement validation

### Phase 3: Polish
- Add dirty state tracking
- Unsaved changes warning
- Edge case handling

## Progress Log

### 2024-12-11 - Initial Setup
- Created feature branch: `feature/agent-config-editing`
- Created this diary document
- Reviewed existing patterns in `agent-config.ts`
- Identified regex patterns to use

### Planning Notes

**Key Decisions:**
1. Use regex pattern matching like existing `updateAgentTools()`
2. Allow partial updates (some fields succeed, others fail)
3. Validate models against `AVAILABLE_MODELS`
4. Manual save only for MVP
5. Maintain backward compatibility with `systemPrompt`

**File Impact:**
- CREATE: `app/api/workforce/[agentId]/config/route.ts` ✅
- MODIFY: `app/api/workforce/services/agent-config.ts` ✅
- MODIFY: `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`

**Regex Patterns Used:**
- String fields: `/(fieldName:\s*)"[^"]*"(\s*,?)/`
- Array fields: `/(fieldName:\s*)\[[^\]]*\](\s*,?)/`
- Number fields: `/(fieldName:\s*)\d+(\s*,?)/`

## Implementation Details

### Backend API Endpoint ✅

Created `app/api/workforce/[agentId]/config/route.ts`:
- PATCH endpoint accepting: `{ systemPrompt?, model?, maxSteps?, objectives?, guardrails? }`
- Validation for each field type
- Partial update support (some succeed, others fail)
- Returns: `{ success: boolean, updated: string[], errors?: string[] }`

### Service Layer Updates ✅

Added 5 new functions to `app/api/workforce/services/agent-config.ts`:

1. **updateAgentSystemPrompt()** - String field update with quote escaping
2. **updateAgentModel()** - String field with model ID validation  
3. **updateAgentMaxSteps()** - Number field, handles insertion if missing
4. **updateAgentObjectives()** - Array field update
5. **updateAgentGuardrails()** - Array field update

All follow existing patterns from `updateAgentTools()` function.

### Frontend Integration ✅

Updated `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`:
- Added `isSaving` and `saveError` state
- Implemented `handleSave()` function with API call
- Added validation for systemPrompt (min 10 chars) and model selection
- Added loading spinner and disabled state for save button
- Integrated toast notifications for success/error feedback
- Added error display below save button
- Only sends `systemPrompt`, `model`, and `objectives` (filtered and trimmed)

**API Call Details:**
- Method: PATCH `/api/workforce/${agent.id}/config`
- Body: `{ systemPrompt, model, objectives }`
- Response: `{ success: boolean, updated: string[], errors?: string[] }`

### Phase 3: Polish and Edge Cases ✅

Added polish features to ConfigTab:
- **Dirty State Tracking**: Compares current values with original agent values
- **Save Button State**: Disabled when no changes, shows "No Changes" text
- **Unsaved Changes Warning**: Browser warning when navigating away with unsaved changes
- **Auto Clear Dirty State**: Resets dirty state on successful save
- **Enhanced Button States**: Shows "Saving...", "Save Changes", or "No Changes"

## Testing Strategy

### Manual Testing Checklist
- [ ] Save button triggers API call
- [ ] Loading state displays during save  
- [ ] Success toast appears
- [ ] Error handling works
- [ ] Changes persist after refresh
- [ ] Validation prevents invalid saves
- [ ] Dirty state tracking works
- [ ] Unsaved changes warning appears
- [ ] Button shows correct states

### API Testing Commands
```bash
# Test systemPrompt update
curl -X PATCH http://localhost:3000/api/workforce/1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config \
  -H "Content-Type: application/json" \
  -b "$(cat ~/.clerk_session_cookies)" \
  -d '{"systemPrompt": "You are a highly intelligent AI assistant"}'

# Test model update
curl -X PATCH http://localhost:3000/api/workforce/1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config \
  -H "Content-Type: application/json" \
  -b "$(cat ~/.clerk_session_cookies)" \
  -d '{"model": "anthropic/claude-3-5-sonnet"}'

# Test validation errors
curl -X PATCH http://localhost:3000/api/workforce/1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config \
  -H "Content-Type: application/json" \
  -b "$(cat ~/.clerk_session_cookies)" \
  -d '{"systemPrompt": "Short", "model": "invalid-model"}'

# Test multiple fields
curl -X PATCH http://localhost:3000/api/workforce/1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config \
  -H "Content-Type: application/json" \
  -b "$(cat ~/.clerk_session_cookies)" \
  -d '{
    "systemPrompt": "You are an expert AI assistant", 
    "model": "google/gemini-2.5-flash",
    "objectives": ["Help users", "Be accurate"]
  }'
```

### Test Scenarios

#### 1. Happy Path Testing
- Open agent modal → Config tab
- Edit systemPrompt: "You are a helpful AI assistant specialized in customer support"
- Change model from current to different model
- Add objectives: "Provide excellent support\nResolve issues quickly"
- Click "Save Changes"
- **Expected**: Success toast, changes persist, dirty state clears

#### 2. Validation Testing
- Clear systemPrompt to empty or very short text
- **Expected**: Error toast "System prompt must be at least 10 characters"
- Select invalid model (if possible)
- **Expected**: Error handling

#### 3. Dirty State Testing  
- Open Config tab
- **Expected**: Button shows "No Changes" and is disabled
- Edit any field
- **Expected**: Button shows "Save Changes" and is enabled
- Try to navigate away
- **Expected**: Browser warning about unsaved changes
- Save successfully
- **Expected**: Button returns to "No Changes" state

#### 4. Loading State Testing
- Edit fields and click "Save Changes"
- **Expected**: Button shows "Saving..." with spinner and is disabled
- Wait for completion
- **Expected**: Button returns to normal state

#### 5. Error Handling Testing
- Simulate network error (disconnect internet)
- Try to save
- **Expected**: Error toast and error message below button

#### 6. Persistence Testing
- Make changes and save
- Refresh page
- **Expected**: Changes are still there
- Check config file directly
- **Expected**: File contains updated values

## Issues Encountered

## Lessons Learned

## Next Steps

---

## Updates
[Implementation details will be added as work progresses]