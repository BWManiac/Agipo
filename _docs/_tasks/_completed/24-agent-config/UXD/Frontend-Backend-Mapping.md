# Frontend-Backend Mapping: Agent Configuration Direct Editing

**Created:** December 2024
**Status:** UXD Design Phase
**Related UXD:** Current directory

---

## Overview

This document maps UI components for agent configuration editing to their required backend APIs. The feature enables direct editing of agent configuration through a user-friendly interface rather than file manipulation.

---

## API Endpoints

### 1. Agent Configuration Management

#### `GET /api/workforce/[agentId]/config`
**UI Component:** `01-agent-config-panel.html` - Load configuration
**Description:** Get current agent configuration

**Response:**
```typescript
{
  id: string;
  name: string;
  status: 'active' | 'paused' | 'attention';
  instructions: string;          // Migrated from systemPrompt
  model: string;
  maxSteps: number;
  objectives: string[];
  guardrails: string[];
  variables: {
    tone?: 'professional' | 'casual' | 'enthusiastic';
    outputLength?: 'concise' | 'detailed';
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: {
    type: 'user' | 'agent';
    id: string;
    name: string;
  };
}
```

---

#### `PATCH /api/workforce/[agentId]/config`
**UI Component:** `01-agent-config-panel.html` - Save button
**Description:** Update agent configuration

**Request:**
```typescript
{
  instructions?: string;        // Will be migrated from systemPrompt if needed
  model?: string;
  maxSteps?: number;
  objectives?: string[];
  guardrails?: string[];
  variables?: Record<string, unknown>;
}
```

**Response:**
```typescript
{
  success: boolean;
  updatedFields: string[];      // Which fields were updated
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  migrated?: {                  // If systemPrompt was migrated
    from: 'systemPrompt';
    to: 'instructions';
  };
  updatedAt: string;
  fileUpdated: boolean;         // Whether the config.ts file was updated
}
```

---

#### `POST /api/workforce/[agentId]/config/validate`
**UI Component:** `04a-validation-error.html` - Real-time validation
**Description:** Validate configuration without saving

**Request:**
```typescript
{
  instructions?: string;
  model?: string;
  maxSteps?: number;
  objectives?: string[];
  guardrails?: string[];
}
```

**Response:**
```typescript
{
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}
```

---

### 2. Model Management

#### `GET /api/workforce/models`
**UI Component:** `03-model-selector.html` - Model dropdown
**Description:** Get available AI models

**Response:**
```typescript
{
  models: Array<{
    id: string;                 // e.g., "gpt-4o"
    name: string;               // e.g., "GPT-4o"
    provider: 'openai' | 'anthropic' | 'google';
    description: string;
    capabilities: {
      maxTokens: number;
      supportsVision: boolean;
      supportsFunctionCalling: boolean;
      supportsStreaming: boolean;
    };
    cost: {
      input: number;            // Per 1K tokens
      output: number;           // Per 1K tokens
      currency: 'USD';
    };
    speed: 'fast' | 'medium' | 'slow';
    recommended: boolean;
  }>;
  defaultModel: string;
}
```

---

### 3. Configuration History

#### `GET /api/workforce/[agentId]/config/diff`
**UI Component:** `05-config-comparison.html` - Change comparison
**Description:** Get diff between current and previous configuration

**Query Parameters:**
- `compareWith`: 'last-saved' | 'default' | string (version ID)

**Response:**
```typescript
{
  current: {
    instructions: string;
    model: string;
    maxSteps: number;
    objectives: string[];
    guardrails: string[];
    updatedAt: string;
  };
  previous: {
    instructions: string;
    model: string;
    maxSteps: number;
    objectives: string[];
    guardrails: string[];
    updatedAt: string;
  };
  changes: Array<{
    field: string;
    type: 'added' | 'modified' | 'removed';
    oldValue?: unknown;
    newValue?: unknown;
  }>;
}
```

---

#### `POST /api/workforce/[agentId]/config/revert`
**UI Component:** `05-config-comparison.html` - Revert button
**Description:** Revert specific fields to previous values

**Request:**
```typescript
{
  fields: string[];              // Fields to revert
  targetVersion?: string;        // Version to revert to (default: last saved)
}
```

**Response:**
```typescript
{
  success: boolean;
  revertedFields: string[];
  newConfig: {
    instructions: string;
    model: string;
    maxSteps: number;
    objectives: string[];
    guardrails: string[];
  };
}
```

---

### 4. Auto-save Support

#### `POST /api/workforce/[agentId]/config/draft`
**UI Component:** Auto-save indicator
**Description:** Save draft configuration (not persisted to file)

**Request:**
```typescript
{
  instructions?: string;
  model?: string;
  maxSteps?: number;
  objectives?: string[];
  guardrails?: string[];
  lastEditedField?: string;      // For field-level drafts
}
```

**Response:**
```typescript
{
  draftId: string;
  savedAt: string;
  expiresAt: string;             // Draft expiration time
}
```

---

#### `GET /api/workforce/[agentId]/config/draft`
**UI Component:** Page load - restore unsaved changes
**Description:** Get draft configuration if exists

**Response:**
```typescript
{
  hasDraft: boolean;
  draft?: {
    instructions?: string;
    model?: string;
    maxSteps?: number;
    objectives?: string[];
    guardrails?: string[];
    savedAt: string;
    lastEditedField?: string;
  };
}
```

---

## WebSocket Events (Real-time Updates)

For collaborative editing awareness (future enhancement):

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_config` | `{ agentId: string }` | Join config editing session |
| `leave_config` | `{ agentId: string }` | Leave config editing session |
| `field_focus` | `{ agentId: string, field: string }` | User focused on field |
| `field_blur` | `{ agentId: string, field: string }` | User left field |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `config_updated` | `{ agentId: string, updatedBy: { type: string, id: string, name: string }, fields: string[] }` | Config was updated |
| `user_editing` | `{ agentId: string, userId: string, field: string }` | Another user is editing |
| `draft_saved` | `{ agentId: string, draftId: string }` | Draft was auto-saved |

---

## Data Models

### Agent Configuration (File-based)

Located at: `_tables/agents/[agent-folder]/config.ts`

```typescript
export const config: AgentConfig = {
  id: string;
  name: string;
  role: string;
  status: "active" | "paused" | "attention";
  avatar: string;
  description: string;
  instructions: string;           // Migrated from systemPrompt
  model: string;
  maxSteps: number;
  objectives: string[];
  guardrails: string[];
  toolIds: string[];
  connectionToolBindings: ConnectionToolBinding[];
  workflowBindings: WorkflowBinding[];
  createdAt: string;
  updatedAt: string;
  variables?: Record<string, unknown>;
};
```

### Configuration Update Service

```typescript
// app/api/workforce/[agentId]/config/services/config-updater.ts

interface ConfigUpdateOptions {
  agentId: string;
  updates: Partial<AgentConfig>;
  userId: string;
  validateOnly?: boolean;
}

interface ConfigUpdateResult {
  success: boolean;
  config?: AgentConfig;
  validationErrors?: ValidationError[];
  fileUpdated?: boolean;
  migrated?: MigrationInfo;
}

class ConfigUpdaterService {
  async updateConfig(options: ConfigUpdateOptions): Promise<ConfigUpdateResult> {
    // 1. Load current config
    // 2. Validate updates
    // 3. Migrate systemPrompt to instructions if needed
    // 4. Apply updates to config object
    // 5. Write to file using regex replacement
    // 6. Return result
  }

  async validateConfig(config: Partial<AgentConfig>): Promise<ValidationResult> {
    // Validate each field according to rules
  }

  private async migrateSystemPrompt(config: AgentConfig): Promise<MigrationInfo | null> {
    // Migrate from systemPrompt to instructions format
  }

  private async writeConfigToFile(agentId: string, config: AgentConfig): Promise<boolean> {
    // Update config.ts file using regex replacement
    // Preserve formatting and comments
  }
}
```

---

## Error Handling

### Validation Errors
```typescript
{
  type: 'VALIDATION_ERROR';
  errors: Array<{
    field: string;
    code: 'REQUIRED' | 'MIN_LENGTH' | 'INVALID_VALUE' | 'UNKNOWN_MODEL';
    message: string;
  }>;
}
```

### File System Errors
```typescript
{
  type: 'FILE_ERROR';
  code: 'READ_FAILED' | 'WRITE_FAILED' | 'PERMISSION_DENIED';
  message: string;
  path?: string;
}
```

### Concurrency Errors
```typescript
{
  type: 'CONCURRENCY_ERROR';
  code: 'CONFIG_MODIFIED' | 'DRAFT_EXPIRED';
  message: string;
  suggestion: string;
}
```

---

## Implementation Priority

### Phase 1: Core Configuration Editing
1. `GET/PATCH /api/workforce/[agentId]/config`
2. Basic validation
3. File update with regex

### Phase 2: Enhanced Validation
1. `POST /api/workforce/[agentId]/config/validate`
2. Model availability check
3. Field-level validation

### Phase 3: Comparison & History
1. `GET /api/workforce/[agentId]/config/diff`
2. `POST /api/workforce/[agentId]/config/revert`

### Phase 4: Auto-save & Drafts
1. `POST/GET /api/workforce/[agentId]/config/draft`
2. Draft expiration management

### Phase 5: Real-time Collaboration
1. WebSocket integration
2. Concurrent edit detection

---

## Notes

- **File-based storage**: Agent configurations stored in `_tables/agents/[folder]/config.ts`
- **Regex updates**: Use careful regex to preserve file formatting and comments
- **Migration**: Automatic migration from `systemPrompt` to `instructions` on first edit
- **Validation**: Both client-side (immediate) and server-side (on save)
- **Git tracking**: All config changes tracked in Git for version history