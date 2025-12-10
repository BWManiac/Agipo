# Model Management - Understanding & Plan

## Current Understanding

### Architecture Overview

1. **Mastra Agent Integration:**
   - Using `Agent` class from `@mastra/core/agent`
   - Agent is instantiated with: `new Agent({ name, instructions, model, tools, memory })`
   - The `model` parameter accepts a model instance (not just a string)

2. **Vercel AI Gateway:**
   - Using `createGateway()` from `@ai-sdk/gateway`
   - Gateway wraps model strings: `gateway("provider/model-name")`
   - Model format: `"provider/model-name"` (e.g., `"google/gemini-2.5-pro"`)
   - Gateway provides unified access to multiple providers (Google, OpenAI, Anthropic, etc.)

3. **Current Flow:**
   ```
   AgentConfig.model (string) 
   → gateway(agentConfig.model) 
   → Model instance 
   → Mastra Agent
   ```

4. **Current Problem:**
   - Models are **hardcoded** in multiple places:
     - `PersonalityStep.tsx` (wizard)
     - `ConfigTab.tsx` (agent modal)
   - No single source of truth
   - No dynamic model discovery
   - Hard to maintain when new models are added

### Code Locations

**Where models are used:**
- `app/api/workforce/[agentId]/chat/route.ts:96` - `model: gateway(agentConfig.model)`
- `app/(pages)/workforce/components/wizard/PersonalityStep.tsx:94-100` - Hardcoded Select options
- `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx:102-104` - Hardcoded Select options

**Where models are stored:**
- `AgentConfig.model` (string) in agent config files
- Saved in `{folder}/config.ts` when agent is created

---

## Research Needed

### Questions to Answer:

1. **Does Vercel AI Gateway provide an API to list available models?**
   - Check: https://vercel.com/docs/ai-gateway/models-and-providers
   - If yes: We can fetch dynamically
   - If no: We maintain our own model list

2. **What's the complete list of supported models?**
   - Need to understand all providers and models available
   - Format: `provider/model-name`

3. **Should we cache the model list?**
   - Models don't change frequently
   - Could cache in memory or fetch on demand

---

## Proposed Solution

### Option A: Static Model List (Recommended for MVP)

**Approach:**
- Create a shared model list constant/service
- Single source of truth for all models
- Easy to maintain and update
- No external API dependency

**Structure:**
```typescript
// app/api/workforce/services/models.ts
export const AVAILABLE_MODELS = [
  { 
    id: "google/gemini-2.5-pro",
    name: "Google Gemini 2.5 Pro",
    provider: "google"
  },
  { 
    id: "openai/gpt-4o",
    name: "OpenAI GPT-4o",
    provider: "openai"
  },
  { 
    id: "anthropic/claude-3-5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
    provider: "anthropic"
  },
  // ... more models
] as const;

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}
```

**API Endpoint:**
```typescript
// app/api/workforce/models/route.ts
export async function GET() {
  return NextResponse.json({ models: getAvailableModels() });
}
```

**Benefits:**
- ✅ Simple and fast
- ✅ No external API calls
- ✅ Full control over model list
- ✅ Easy to add/remove models

**Drawbacks:**
- ❌ Requires manual updates when new models are added
- ❌ Not automatically synced with Gateway

---

### Option B: Dynamic Model Discovery (Future Enhancement)

**Approach:**
- Query Vercel AI Gateway API (if available)
- Cache results
- Fallback to static list if API unavailable

**Structure:**
```typescript
// app/api/workforce/services/models.ts
export async function fetchAvailableModels(): Promise<Model[]> {
  // Try to fetch from Gateway API
  // Fallback to static list
}
```

**Benefits:**
- ✅ Always up-to-date
- ✅ Automatic discovery

**Drawbacks:**
- ❌ Requires Gateway API (may not exist)
- ❌ More complex
- ❌ External dependency

---

## Implementation Plan

### Phase 1: Create Model Service (Static List)

1. **Create model service:**
   - `app/api/workforce/services/models.ts`
   - Define `AVAILABLE_MODELS` constant
   - Export `getAvailableModels()` function

2. **Create API endpoint:**
   - `app/api/workforce/models/route.ts`
   - GET endpoint that returns available models
   - Authenticated (Clerk)

3. **Update PersonalityStep:**
   - Fetch models from API on mount
   - Replace hardcoded Select options
   - Add loading state

4. **Update ConfigTab:**
   - Fetch models from API on mount
   - Replace hardcoded Select options
   - Add loading state

### Phase 2: Enhancements (Future)

1. **Model metadata:**
   - Add descriptions, capabilities, pricing info
   - Help users choose the right model

2. **Model validation:**
   - Validate model exists when creating agent
   - Show error if model is unavailable

3. **Dynamic discovery:**
   - If Gateway API becomes available, implement Option B

---

## Files to Create/Modify

### New Files:
- `app/api/workforce/services/models.ts` - Model list service
- `app/api/workforce/models/route.ts` - GET endpoint for models
- `app/api/workforce/models/README.md` - Documentation

### Files to Modify:
- `app/(pages)/workforce/components/wizard/PersonalityStep.tsx` - Use dynamic models
- `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx` - Use dynamic models

---

## Acceptance Criteria

- [ ] Model list is centralized in one service
- [ ] PersonalityStep fetches models dynamically
- [ ] ConfigTab fetches models dynamically
- [ ] API endpoint returns available models
- [ ] Models are properly formatted for Gateway (`provider/model-name`)
- [ ] Loading states show while fetching models
- [ ] Error handling if model fetch fails

---

## Next Steps

1. **Research:** Check Vercel AI Gateway docs for model listing API
2. **Decide:** Static list (Option A) or dynamic (Option B)
3. **Implement:** Create model service and update components
4. **Test:** Verify models work correctly in wizard and agent modal

---

**Status:** Planning
**Last Updated:** 2025-12-09
