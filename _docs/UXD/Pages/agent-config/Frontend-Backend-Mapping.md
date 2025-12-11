# Agent Config Feature - Frontend-Backend Mapping

**Date:** December 11, 2025  
**Status:** Implementation Planning  
**Purpose:** Map frontend UI components to backend API requirements for agent configuration editing  

---

## Overview

This document maps each mockup to the APIs needed to implement direct agent configuration editing functionality.

---

## Mockup Index

| File | Purpose | APIs Needed |
|------|---------|-------------|
| `01-config-tab-basic.html` | Basic config editing interface | Config Update API |
| `02-config-tab-advanced.html` | Advanced options (maxSteps, provider) | Config Update API, Models API |
| `03-instruction-formats.html` | Array format instruction editor | Config Update API |
| `04-model-selector.html` | Model selection dropdown | Models List API |
| `05-validation-states.html` | Form validation and error display | Validation API |
| `06-save-states.html` | Save loading/success/error states | Config Update API |

---

## API Requirements by Component

### 1. Config Update API

**New Endpoint:**

#### `PATCH /api/workforce/[agentId]/config`
Update agent configuration fields.

```typescript
// Request
{
  instructions?: string;           // Replaces systemPrompt
  model?: string;                  // LLM model ID
  maxSteps?: number;              // Optional execution limit
  objectives?: string;            // Agent objectives text
  guardrails?: string;            // Safety guardrails text
  instructionFormat?: 'string' | 'array';  // Format preference
}

// Response
{
  success: boolean;
  agent: {
    id: string;
    name: string;
    instructions: string | string[];  // Updated instructions
    model: string;                    // Updated model
    maxSteps?: number;               // Updated maxSteps
    objectives: string;              // Updated objectives
    guardrails: string;              // Updated guardrails
    updatedAt: string;               // ISO timestamp
  };
  message: string;                   // Success message
}

// Error Response
{
  success: false;
  error: string;
  details?: {
    instructions?: string[];        // Validation errors
    model?: string[];
    maxSteps?: string[];
  };
}
```

**Validation Rules:**
- `instructions`: Required, min length 10 characters, max length 5000
- `model`: Must be valid model ID from available models list  
- `maxSteps`: Optional, positive integer 1-50
- `objectives`: Optional, max length 1000 characters
- `guardrails`: Optional, max length 1000 characters

---

### 2. Models List API

**New Endpoint:**

#### `GET /api/workforce/models`
Get available LLM models for agent configuration.

```typescript
// Response
{
  models: Array<{
    id: string;                     // Model ID for API calls
    name: string;                   // Display name
    provider: string;               // "anthropic" | "openai" | "google"
    description: string;            // Model description
    contextLength: number;          // Token limit
    inputCost: number;             // Cost per input token
    outputCost: number;            // Cost per output token
    capabilities: string[];         // ["text", "vision", "tools"]
    deprecated?: boolean;           // If model is deprecated
  }>;
  defaultModel: string;            // Default model ID
}
```

**Example Response:**
```json
{
  "models": [
    {
      "id": "anthropic/claude-sonnet-4-20250514",
      "name": "Claude 4 Sonnet",
      "provider": "anthropic", 
      "description": "Most capable Claude model",
      "contextLength": 200000,
      "inputCost": 0.000003,
      "outputCost": 0.000015,
      "capabilities": ["text", "vision", "tools"]
    },
    {
      "id": "openai/gpt-4o",
      "name": "GPT-4o",
      "provider": "openai",
      "description": "OpenAI's flagship model",
      "contextLength": 128000,
      "inputCost": 0.000005,
      "outputCost": 0.000015, 
      "capabilities": ["text", "vision", "tools"]
    }
  ],
  "defaultModel": "anthropic/claude-sonnet-4-20250514"
}
```

---

### 3. Config Validation API

**Endpoint:** (Embedded in PATCH endpoint above)

**Client-Side Validation:**
```typescript
interface ConfigValidation {
  instructions: {
    required: true;
    minLength: 10;
    maxLength: 5000;
  };
  model: {
    required: true;
    enum: string[];  // From models API
  };
  maxSteps: {
    required: false;
    type: 'integer';
    min: 1;
    max: 50;
  };
  objectives: {
    required: false;
    maxLength: 1000;
  };
  guardrails: {
    required: false;
    maxLength: 1000;
  };
}
```

---

## Data Flow

### 1. Load Config Tab
```
User opens agent modal → Config tab
    → GET /api/workforce/[agentId] (existing)
    → GET /api/workforce/models (new)
    → Populate form with current config
    → Show available models in dropdown
```

### 2. Edit and Save Config
```
User edits form fields
    → Client-side validation on change
    → User clicks "Save Changes"
    → Show loading state
    → PATCH /api/workforce/[agentId]/config
    → Handle success/error response
    → Show toast notification
    → Update agent state if successful
```

### 3. Model Selection
```
User clicks model dropdown
    → Show available models from models API
    → User selects model
    → Update form state
    → Enable save button (if changes detected)
```

### 4. Advanced Options
```
User toggles "Advanced" section
    → Show maxSteps input
    → Show provider options
    → Allow configuration of additional settings
    → All changes save via same API endpoint
```

---

## Service Layer Implementation

### Backend Services

#### `app/api/workforce/services/agent-config.ts` (Extend existing)

```typescript
// New functions to add:
export async function updateAgentInstructions(
  agentId: string, 
  instructions: string | string[]
): Promise<void>;

export async function updateAgentModel(
  agentId: string, 
  model: string
): Promise<void>;

export async function updateAgentMaxSteps(
  agentId: string, 
  maxSteps?: number
): Promise<void>;

export async function updateAgentObjectives(
  agentId: string,
  objectives: string
): Promise<void>;

export async function updateAgentGuardrails(
  agentId: string,
  guardrails: string  
): Promise<void>;

// Utility functions:
export async function validateAgentConfig(
  config: Partial<AgentConfig>
): Promise<ValidationResult>;

export async function getAvailableModels(): Promise<ModelInfo[]>;
```

#### `app/api/workforce/models/route.ts` (New)

```typescript
// GET handler
export async function GET() {
  const models = await getAvailableModels();
  return NextResponse.json({
    models,
    defaultModel: "anthropic/claude-sonnet-4-20250514"
  });
}
```

### Frontend Services

#### `hooks/useAgentConfig.ts` (New)

```typescript
export function useAgentConfig(agentId: string) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateConfig = async (updates: Partial<AgentConfig>) => {
    // PATCH request to update config
  };

  const loadModels = async () => {
    // GET request to load available models
  };

  return {
    config,
    models,
    isLoading,
    error,
    updateConfig,
    loadModels
  };
}
```

---

## File Update Strategy

### Config File Updates
The system uses regex-based updates to modify TypeScript config files:

```typescript
// Example: Update instructions field
const configPath = `_tables/agents/${agentId}/config.ts`;
const content = await fs.readFile(configPath, 'utf-8');

// Replace systemPrompt with instructions
const updatedContent = content.replace(
  /systemPrompt:\s*["'`]([^"'`]*?)["'`]/g,
  `instructions: ${JSON.stringify(newInstructions)}`
);

await fs.writeFile(configPath, updatedContent);
```

### Migration Strategy
1. **Read current config** - Parse existing `systemPrompt` field
2. **Convert format** - Transform to `instructions` format
3. **Update file** - Replace field using regex pattern
4. **Preserve structure** - Maintain file formatting and comments

---

## Error Handling

### Frontend Error States
- **Validation errors** - Show field-specific error messages
- **Network errors** - Show toast with retry option
- **Save failures** - Keep form data, show error details
- **Load failures** - Show error state with reload button

### Backend Error Responses
- **400 Bad Request** - Validation errors with field details
- **404 Not Found** - Agent not found
- **500 Internal Error** - File system or parsing errors
- **422 Unprocessable** - Invalid model or configuration

---

## Testing Strategy

### API Testing
- Test config update with all field combinations
- Test validation with invalid inputs
- Test file system error handling
- Test model list retrieval

### UI Testing  
- Test form submission and validation
- Test success/error state handling
- Test model dropdown functionality
- Test advanced options toggle

### Integration Testing
- Test end-to-end save flow
- Test agent runtime with updated config
- Test chat functionality with new instructions
- Test persistence across page refreshes

---

## Performance Considerations

### Optimization Strategies
- **Debounced validation** - Avoid excessive API calls during typing
- **Model caching** - Cache model list for session duration  
- **Optimistic updates** - Update UI immediately, rollback on error
- **Form auto-save** - Future enhancement for drafts

### File System Performance
- **Atomic writes** - Use temporary files for updates
- **Concurrent safety** - Handle multiple simultaneous updates
- **Backup strategy** - Git provides version history

---

## Implementation Order

### Phase 1: Basic Config Update (P0)
1. Create config update API endpoint
2. Wire up save button in ConfigTab
3. Add basic validation and error handling

### Phase 2: Model Selection (P0)  
1. Create models API endpoint
2. Build model selection dropdown
3. Integrate with config update

### Phase 3: Advanced Options (P1)
1. Add maxSteps configuration UI
2. Add provider options section
3. Test all configuration combinations

### Phase 4: Enhanced Validation (P1)
1. Improve validation messages
2. Add real-time validation
3. Add form state management

### Phase 5: Polish (P2)
1. Add loading animations
2. Improve error messaging
3. Add auto-save capability

---

## API Summary

### New APIs to Create

| API | Method | Purpose | Priority |
|-----|--------|---------|----------|
| `/api/workforce/[agentId]/config` | PATCH | Update agent configuration | **P0** |
| `/api/workforce/models` | GET | List available models | **P0** |

### External Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| `@mastra/core` | Agent runtime | Already installed |
| `zod` | Validation schemas | Already installed |
| `fs/promises` | File system operations | Node.js built-in |

---

## Notes

- Config updates use regex-based file modification to preserve TypeScript formatting
- Migration from `systemPrompt` to `instructions` happens during first save
- Model validation ensures only supported models are selectable
- Advanced options are progressive disclosure to keep UI simple
- File system errors are handled gracefully with user feedback