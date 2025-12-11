# Mastra Agent Primitives Research

**Date:** December 8, 2025  
**Purpose:** Understand what's actually required to create a Mastra Agent

---

## Mastra Agent Constructor (From Documentation)

Reference: [Mastra Agent API](https://mastra.ai/reference/agents/agent)

### Required Parameters
- `name: string` - Unique identifier for the agent
- `instructions: SystemMessage | Function` - Instructions that guide agent behavior
- `model: MastraLanguageModel | Function` - The language model used by the agent

### Optional Parameters
- `id?: string` - Optional unique identifier (defaults to `name` if not provided)
- `description?: string` - Optional description of agent's purpose
- `tools?: ToolsInput | Function` - Tools the agent can access
- `workflows?: Record<string, Workflow> | Function` - Workflows the agent can execute
- `agents?: Record<string, Agent> | Function` - Sub-agents the agent can access
- `memory?: MastraMemory | Function` - Memory module for stateful context
- `voice?: CompositeVoice` - Voice settings for speech
- `scorers?: MastraScorers | Function` - Scoring configuration (⚠️ Research needed - deferred)
- `evals?: Record<string, Metric>` - Evaluation metrics (⚠️ Research needed - deferred)
- `inputProcessors?: Processor[] | Function` - Input processors (⚠️ Research needed - deferred)
- `outputProcessors?: Processor[] | Function` - Output processors (⚠️ Research needed - deferred)
- `defaultGenerateOptions?: AgentGenerateOptions | Function` - Default generate options (⚠️ Research needed - deferred)
- `defaultStreamOptions?: AgentStreamOptions | Function` - Default stream options (⚠️ Research needed - deferred)

---

## How We Currently Create Agents

From `app/api/workforce/[agentId]/chat/services/chat-service.ts`:

```typescript
return new Agent({
  name: agentConfig.id,              // Required
  instructions: agentConfig.systemPrompt,  // Required
  model: gateway(agentConfig.model),       // Required
  tools: toolMap,                          // Optional (built from capabilities)
  memory: getAgentMemory(agentConfig.id),  // Optional (auto-created)
});
```

**Key Insight:** We only use 4 of Mastra's parameters:
1. `name` (required)
2. `instructions` (required)
3. `model` (required)
4. `tools` (optional)
5. `memory` (optional, auto-created)

---

## AgentConfig Type Analysis

From `_tables/types.ts`:

### Required for Mastra Agent Creation
| Field | Mastra Mapping | Required? | Default? |
|-------|---------------|-----------|----------|
| `id` | `name` parameter | ✅ Yes | Generated from name |
| `systemPrompt` | `instructions` parameter | ✅ Yes | None |
| `model` | `model` parameter | ✅ Yes | "google/gemini-2.5-pro" |

### Required for UI/Display
| Field | Purpose | Required? | Default? |
|-------|---------|-----------|----------|
| `name` | Display name | ✅ Yes | None |
| `role` | Role label | ✅ Yes | None |
| `avatar` | Visual identifier | ✅ Yes | "🤖" |
| `status` | Agent status | ✅ Yes | "active" |
| `description` | Short description | ✅ Yes | "" |

### Required for Capabilities (Optional)
| Field | Purpose | Required? | Default? |
|-------|---------|-----------|----------|
| `toolIds` | Custom tool IDs | ❌ No | `[]` |
| `connectionToolBindings` | Connection tools | ❌ No | `[]` |
| `workflowBindings` | Workflow tools | ❌ No | `[]` |

### UI Metadata (Not Used by Mastra)
| Field | Purpose | Required? | Default? |
|-------|---------|-----------|----------|
| `quickPrompts` | Conversation starters | ❌ No | `[]` |
| `objectives` | Goal statements | ❌ No | `[]` |
| `guardrails` | Constraint statements | ❌ No | `[]` |
| `highlight` | Status highlight | ❌ No | `""` |
| `lastActivity` | Activity text | ❌ No | `"Just created"` |
| `metrics` | Display metrics | ❌ No | `[]` |
| `capabilities` | Capability labels | ❌ No | `[]` |
| `insights` | Insight cards | ❌ No | `[]` |
| `activities` | Activity history | ❌ No | `[]` |
| `feedback` | Feedback array | ❌ No | `[]` |
| `assignedWorkflows` | Deprecated | ❌ No | `[]` |
| `maxSteps` | Agent loop control | ❌ No | `undefined` |

---

## Minimum Viable Agent Creation

**Absolute Minimum:**
```typescript
{
  id: "generated-id",
  name: "Agent Name",
  systemPrompt: "You are a helpful assistant.",
  model: "google/gemini-2.5-pro",
  // Everything else has defaults
}
```

**With Defaults Applied:**
```typescript
{
  id: "generated-id",
  name: "Agent Name",
  role: "Assistant",
  avatar: "🤖",
  status: "active",
  description: "",
  systemPrompt: "You are a helpful assistant.",
  model: "google/gemini-2.5-pro",
  toolIds: [],
  connectionToolBindings: [],
  workflowBindings: [],
  quickPrompts: [],
  objectives: [],
  guardrails: [],
  highlight: "",
  lastActivity: "Just created",
  metrics: [],
  capabilities: [],
  insights: [],
  activities: [],
  feedback: [],
}
```

---

## Primitives Classification

### Tier 1: Core Primitives (Required for Agent to Exist)
1. **Identity**
   - `id` - Unique identifier (generated)
   - `name` - Display name
   - `role` - Role label
   - `avatar` - Visual identifier

2. **Personality**
   - `systemPrompt` - Core instructions (REQUIRED for Mastra)
   - `model` - LLM model (REQUIRED for Mastra, has default)

### Tier 2: Capabilities (Optional but Important)
3. **Tools & Workflows**
   - `toolIds` - Custom tools
   - `connectionToolBindings` - Connection tools
   - `workflowBindings` - Workflow tools

### Tier 3: Directives (Optional, UI Metadata)
4. **Guidance**
   - `objectives` - What agent should achieve
   - `guardrails` - What agent should avoid
   - `quickPrompts` - Conversation starters

### Tier 4: Display Metadata (Optional, Not Used by Mastra)
5. **UI State**
   - `description` - Short description
   - `status` - Agent status
   - `highlight` - Status highlight
   - `lastActivity` - Activity text
   - `metrics` - Display metrics
   - `capabilities` - Capability labels
   - `insights` - Insight cards
   - `activities` - Activity history
   - `feedback` - Feedback array

---

## What Mastra Actually Uses

**At Runtime:**
- `name` → Used as agent identifier
- `instructions` → Passed to LLM as system message(s)
- `model` → LLM provider/model selection
- `tools` → Available tools for agent to call
- `memory` → Conversation persistence (auto-created per agent)

**Not Used by Mastra:**
- Everything else in `AgentConfig` is UI metadata for display/management

---

## Key Insights

1. **Minimal Required:** Only 3 fields are truly required for Mastra:
   - `name` (or `id`)
   - `instructions` (systemPrompt)
   - `model`

2. **Everything Else is Optional:** Tools, memory, workflows can all be added later

3. **UI Metadata is Separate:** Most AgentConfig fields are for UI display, not runtime

4. **Memory is Auto-Created:** We don't need to configure memory during creation - it's created lazily on first use

5. **Tools Can Be Empty:** Agent can be created with no tools and tools added later

---

## Implications for Create Agent Flow

### Minimal Flow (MVP)
1. **Identity** - Name, role, avatar
2. **Personality** - System prompt, model
3. **Done** - Create agent (capabilities can be added later)

### Enhanced Flow
1. **Identity** - Name, role, avatar, description
2. **Personality** - System prompt, model, objectives, guardrails
3. **Capabilities** - Tools, connections, workflows (optional)
4. **Quick Prompts** - Conversation starters (optional)
5. **Review** - Summary before creation

---

## Recommended Approach

**Start Minimal, Enhance Later:**
- Step 1: Identity (name, role, avatar) - Required
- Step 2: Personality (systemPrompt, model) - Required
- Step 3: Create Agent (capabilities can be added in agent modal after creation)

**Rationale:**
- Fewer steps = less friction
- Agent can be created immediately
- Capabilities can be configured in agent modal (already exists)
- Matches "create first, configure later" pattern

---

---

## Advanced Features Research (Deferred)

### Scorers
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Scoring configuration for agent evaluation  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

### Evals
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Evaluation metrics for agent performance  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

### Input Processors
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Process input before agent receives it  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

### Output Processors
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Process output after agent generates it  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

### Default Generate Options
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Default options for `agent.generate()` calls  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

### Default Stream Options
**Status:** ⚠️ Research needed - Deferred for future implementation  
**Purpose:** Default options for `agent.stream()` calls  
**Usage:** Unknown - requires further research  
**Decision:** Not included in MVP agent creation flow

---

## Sub-Agents Support

### Mastra Parameter: `agents`
**Type:** `Record<string, Agent> | Function`  
**Purpose:** Allows an agent to access and delegate to other agents (sub-agents)

### Our Implementation
**Fields:**
- `isManager?: boolean` - Boolean flag indicating if agent is a manager
- `subAgentIds?: string[]` - Array of agent IDs that this agent can access

### Usage Pattern
```typescript
// Manager agent with sub-agents
const managerAgent = new Agent({
  name: "manager-agent",
  instructions: "You are a manager who delegates tasks to sub-agents.",
  model: gateway("google/gemini-2.5-pro"),
  agents: {
    "sub-agent-1": subAgent1,
    "sub-agent-2": subAgent2,
  },
});
```

### UI Flow
1. User toggles "This agent is a manager" checkbox in Step 2 (Personality)
2. If enabled, shows link/button to "Configure Sub-Agents"
3. Opens separate screen (not modal) to select from user's available agents
4. Selected agent IDs stored in `subAgentIds` array

**Rationale:** Separate screen avoids modal nesting. Manager agents can delegate tasks to sub-agents.

---

## Storage Structure

### Current Structure (Legacy - To Be Deleted)
```
_tables/agents/
├── index.ts
├── mira-patel.ts
├── alex-kim.ts
├── elena-park.ts
├── noah-reyes.ts
├── engineering/
│   └── memory.db
├── marketing/
│   └── memory.db
└── pm/
    └── memory.db
```

### New Structure (Folder-Based with UUID)
```
_tables/agents/
├── index.ts
├── mira-patel-a1b2c3d4-e5f6-7890-abcd-ef1234567890/
│   ├── config.ts (agent configuration)
│   └── memory.db (SQLite database, auto-created)
└── alex-kim-b2c3d4e5-f6g7-8901-bcde-f12345678901/
    ├── config.ts
    └── memory.db
```

### Folder Naming Convention
- Format: `{name-slug}-{uuid}`
- Example: `mira-patel-a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- UUID: Standard UUID v4 format
- Benefits:
  - Human-readable (name slug)
  - Guaranteed unique (UUID)
  - Co-located config and memory

### Agent ID Generation
- **Method:** `crypto.randomUUID()` (standard UUID v4)
- **Format:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **Storage:** Used as `id` field in `AgentConfig`
- **Folder:** Used as folder name (with name slug prefix)

---

## Updated Primitives Classification

### Tier 1: Core Primitives (Required for Agent to Exist)
1. **Identity**
   - `id` - Unique identifier (UUID v4, auto-generated)
   - `name` - Display name (used for folder slug)
   - `role` - Role label
   - `avatar` - Visual identifier

2. **Personality**
   - `systemPrompt` - Core instructions (REQUIRED for Mastra, labeled as "Instructions" in UI)
   - `model` - LLM model (REQUIRED for Mastra, has default)

### Tier 2: Capabilities (Optional but Important)
3. **Tools & Workflows**
   - `toolIds` - Custom tools
   - `connectionToolBindings` - Connection tools
   - `workflowBindings` - Workflow tools

4. **Sub-Agents** (New)
   - `isManager` - Boolean flag for manager agents
   - `subAgentIds` - Array of sub-agent IDs

### Tier 3: Directives (Optional, UI Metadata)
5. **Guidance**
   - `objectives` - What agent should achieve
   - `guardrails` - What agent should avoid
   - `quickPrompts` - Conversation starters

### Tier 4: Display Metadata (Optional, Not Used by Mastra)
6. **UI State**
   - `description` - Short description
   - `status` - Agent status
   - `highlight` - Status highlight
   - `lastActivity` - Activity text
   - `metrics` - Display metrics
   - `capabilities` - Capability labels
   - `insights` - Insight cards
   - `activities` - Activity history
   - `feedback` - Feedback array

### Tier 5: Advanced Features (Deferred)
7. **Advanced Configuration**
   - `scorers` - Scoring configuration (deferred)
   - `evals` - Evaluation metrics (deferred)
   - `inputProcessors` - Input processors (deferred)
   - `outputProcessors` - Output processors (deferred)
   - `defaultGenerateOptions` - Default generate options (deferred)
   - `defaultStreamOptions` - Default stream options (deferred)

---

**Next:** Update flow plan based on this research.

