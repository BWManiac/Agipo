# Diary Entry 17: Connection Tools Integration

**Date:** December 4, 2025  
**Topic:** Enabling Agents to Use Composio Tools from User Connections  
**Status:** Complete

---

## 1. Executive Summary

Building on the Composio Integrations Platform (Entry 15) and Clerk Authentication (Entry 16), we implemented **Connection Tools** - the ability for agents to use tools from a user's connected accounts (e.g., sending emails via a connected Gmail account). This entry documents:

1. **The goal:** Grant agents access to Composio-provided tools based on the authenticated user's connections.

2. **The architecture:** A 7-stage implementation plan covering data model, API routes, frontend components, and chat execution.

3. **The key challenge:** Multi-account handling - when a user has multiple Gmail accounts, which one should the agent use?

4. **The solution:** `ConnectionToolBinding` - an explicit link between a tool, a specific connection, and an agent.

**Key Insight:** Unlike custom tools (local workflows), connection tools require **user context** at runtime. The same "GMAIL_SEND_EMAIL" tool behaves differently depending on which connected Gmail account is bound to the agent.

---

## 2. Philosophy: Two Types of Agent Tools

### 2.1 Custom Tools (Existing)

Local workflows defined in `_tables/tools/`. These are:
- User-agnostic (no OAuth required)
- Defined as TypeScript files with Zod schemas
- Executed entirely within Agipo

**Example:** `workflow-weekly_report` - generates a report from local data.

### 2.2 Connection Tools (New)

Composio-provided tools from connected services. These are:
- User-specific (require OAuth connection)
- Defined by Composio SDK
- Execute via Composio Cloud with user's credentials

**Example:** `GMAIL_SEND_EMAIL` - sends an email from user's connected Gmail.

### 2.3 The Binding Problem

**Scenario:** User has two Gmail accounts connected:
- `personal@gmail.com` (connectionId: `ca_abc123`)
- `work@gmail.com` (connectionId: `ca_xyz789`)

When assigning "GMAIL_SEND_EMAIL" to an agent, which account should it use?

**Solution:** `ConnectionToolBinding` - explicitly links:
```typescript
{
  toolId: "GMAIL_SEND_EMAIL",      // The Composio tool
  connectionId: "ca_abc123",       // Which specific account
  toolkitSlug: "gmail"             // For display/grouping
}
```

This allows assigning the same tool multiple times with different accounts, or different tools to different accounts.

---

## 3. Implementation Plan Overview

The implementation was divided into 7 verifiable stages:

| Stage | Focus | Deliverable |
|-------|-------|-------------|
| 1 | Data Model | `ConnectionToolBinding` type, `AgentConfig` extension |
| 2 | Custom Tools API | Refactored routes under `/tools/custom/` |
| 3 | Connection Tools API | New routes under `/tools/connection/` |
| 4 | Frontend Hooks | `useCustomTools`, `useConnectionTools` |
| 5 | ConnectionToolEditor | Dialog for managing connection tool assignments |
| 6 | CapabilitiesTab Refactor | Split into Custom Tools + Connection Tools sections |
| 7 | Chat Execution | Runtime integration with Clerk auth and bindings |

---

## 4. Stage 1: Data Model Foundation

### 4.1 New Type: ConnectionToolBinding

```typescript
// _tables/types.ts
type ConnectionToolBinding = {
  toolId: string;        // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string;  // e.g., "ca_abc123"
  toolkitSlug: string;   // e.g., "gmail"
};
```

### 4.2 Extended AgentConfig

```typescript
type AgentConfig = {
  // ... existing fields unchanged
  toolIds: string[];                           // Custom tools (existing)
  connectionToolBindings?: ConnectionToolBinding[];  // Connection tools (new)
};
```

### 4.3 Design Decisions

| Decision | Rationale |
|----------|-----------|
| Optional field | Backwards compatible - existing agents work without changes |
| Array of bindings | Supports multiple tools and multi-account scenarios |
| Include `toolkitSlug` | Enables UI grouping without additional API calls |

---

## 5. Stage 2: Backend - Custom Tools API Refactor

### 5.1 New Route Structure

Before:
```
/api/workforce/[agentId]/tools  →  GET/POST for all tools
```

After:
```
/api/workforce/[agentId]/tools/
├── route.ts                    →  Legacy compatibility
├── custom/
│   ├── route.ts               →  GET/POST agent's custom tools
│   └── available/route.ts     →  GET all available custom tools
└── connection/
    ├── route.ts               →  GET/POST agent's connection bindings
    └── available/route.ts     →  GET tools from user's connections
```

### 5.2 Service Layer Additions

```typescript
// app/api/workforce/services/agent-config.ts

export function getAgentCustomTools(agentId: string): string[] {
  const agent = getAgentById(agentId);
  return agent?.toolIds || [];
}

export function getAgentConnectionToolBindings(agentId: string): ConnectionToolBinding[] {
  const agent = getAgentById(agentId);
  return agent?.connectionToolBindings || [];
}
```

---

## 6. Stage 3: Backend - Connection Tools APIs

### 6.1 Composio Service Addition

```typescript
// app/api/connections/services/composio.ts

export async function getToolsForConnection(toolkitSlug: string) {
  const client = getComposioClient();
  const tools = await client.tools.getRawComposioTools({ 
    toolkits: [toolkitSlug],
    limit: 100 
  });
  
  return (tools || []).map((tool) => ({
    id: tool.slug || tool.name || "",  // Action name for execution
    name: tool.displayName || tool.name || "",
    description: tool.description || "",
  }));
}
```

### 6.2 Available Connection Tools Endpoint

`GET /api/workforce/[agentId]/tools/connection/available`

Returns tools grouped by connection:

```typescript
{
  connections: [
    {
      connectionId: "ca_abc123",
      toolkitSlug: "gmail",
      toolkitName: "Gmail",
      accountLabel: "personal@gmail.com",
      status: "ACTIVE",
      tools: [
        { id: "GMAIL_SEND_EMAIL", name: "Send email", description: "..." },
        { id: "GMAIL_FETCH_EMAILS", name: "Fetch emails", description: "..." },
        // ... more tools
      ]
    }
  ]
}
```

### 6.3 Connection Tool Bindings Endpoint

`GET/POST /api/workforce/[agentId]/tools/connection`

- **GET:** Returns agent's current `connectionToolBindings`
- **POST:** Updates bindings (full replacement)

---

## 7. Stage 4: Frontend Hooks

### 7.1 useCustomTools

```typescript
// Manages custom tool assignments
const {
  tools,           // Available custom tools
  assignedTools,   // Currently assigned to agent
  isLoading,
  updateTools,     // Save changes
} = useCustomTools(agentId);
```

### 7.2 useConnectionTools

```typescript
// Manages connection tool bindings
const {
  availableConnections,  // User's connections with their tools
  assignedBindings,      // Currently assigned to agent
  isLoading,
  updateBindings,        // Save changes
} = useConnectionTools(agentId);
```

---

## 8. Stage 5: ConnectionToolEditor Dialog

### 8.1 Component Structure

```
ConnectionToolEditor
├── Search Input
├── Toolkit Groups (accordion)
│   ├── Gmail
│   │   ├── personal@gmail.com (connection)
│   │   │   ├── ☑ GMAIL_SEND_EMAIL
│   │   │   ├── ☐ GMAIL_FETCH_EMAILS
│   │   │   └── ...
│   │   └── work@gmail.com (connection)
│   │       └── ...
│   ├── Slack
│   │   └── ...
│   └── ...
├── Cancel Button
└── Save Changes Button
```

### 8.2 Key Features

| Feature | Implementation |
|---------|----------------|
| Multi-account support | Tools grouped by connection within each toolkit |
| Search | Filters tools by name, description, or id |
| Binding key | `${connectionId}:${toolId}` uniquely identifies each selection |
| Empty state | Links to Connections page if no connections exist |

---

## 9. Stage 6: CapabilitiesTab Refactor

### 9.1 New UI Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Assigned Capabilities                                           │
│  Manage what this agent can do.                                 │
│                                                                  │
│  CUSTOM TOOLS                                        [Manage]   │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ 🔧 hohoho       │  │ 🔧 weekly_report│                       │
│  │ READ/WRITE      │  │ WORKFLOW        │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  CONNECTION TOOLS                                    [Manage]   │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ ⚡ Fetch emails │  │ ⚡ Send email   │                       │
│  │ GMAIL           │  │ GMAIL           │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  WORKFLOWS                                                       │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ 📄 Draft Notes  │  │ 📄 Weekly Report│                       │
│  │ WORKFLOW        │  │ WORKFLOW        │                       │
│  └─────────────────┘  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 ConnectionToolCard Component

New card component for displaying assigned connection tools:

```typescript
// Shows tool name, toolkit badge, connection account
<ConnectionToolCard
  binding={{
    toolId: "GMAIL_SEND_EMAIL",
    connectionId: "ca_abc123",
    toolkitSlug: "gmail"
  }}
/>
```

---

## 10. Stage 7: Chat Execution Integration

### 10.1 Chat Route Updates

```typescript
// app/api/workforce/[agentId]/chat/route.ts

export async function POST(request: Request, routeContext) {
  // 1. Get authenticated user
  const { userId } = await auth();
  if (!userId) return 401;

  // 2. Load agent config
  const agent = getAgentById(agentId);

  // 3. Build tool map from BOTH types
  const toolMap: Record<string, Tool> = {};

  // Custom tools (existing)
  for (const toolId of agent.toolIds) {
    const toolDef = await getExecutableToolById(toolId);
    if (toolDef) toolMap[toolId] = toolDef.run;
  }

  // Connection tools (new)
  for (const binding of agent.connectionToolBindings || []) {
    const toolDef = await getConnectionToolExecutable(userId, binding);
    if (toolDef) toolMap[binding.toolId] = toolDef.run;
  }

  // 4. Create agent with combined tools
  const dynamicAgent = new Agent({
    model: agent.model,
    system: agent.systemPrompt,
    tools: toolMap,
  });
  
  // 5. Execute
  return await dynamicAgent.respond({ messages });
}
```

### 10.2 Runtime Service Addition

```typescript
// app/api/tools/services/runtime.ts

export async function getConnectionToolExecutable(
  userId: string,
  binding: ConnectionToolBinding
): Promise<ToolDefinition | undefined> {
  const client = getComposioClient();
  const composioTool = await getToolAction(userId, binding.toolId);
  
  if (!composioTool) return undefined;

  // Create Vercel AI SDK tool wrapper
  const vercelTool = tool({
    description: composioTool.description,
    inputSchema: convertComposioSchemaToZod(composioTool.parameters),
    execute: async (input) => {
      // Execute with SPECIFIC connection ID
      return await client.tools.execute(binding.toolId, {
        userId,
        arguments: input,
        connectedAccountId: binding.connectionId,  // Key: uses bound account
        dangerouslySkipVersionCheck: true,
      });
    },
  });

  return { id: binding.toolId, run: vercelTool };
}
```

### 10.3 Key Integration Points

| Component | Role |
|-----------|------|
| Clerk `auth()` | Provides `userId` for Composio API calls |
| `binding.connectionId` | Routes execution to specific connected account |
| `getConnectionToolExecutable()` | Wraps Composio tool in Vercel AI SDK format |

---

## 11. File Impact Analysis

### 11.1 Files Created (8)

| File | Lines | Description |
|------|-------|-------------|
| `app/api/workforce/[agentId]/tools/custom/available/route.ts` | ~35 | GET available custom tools |
| `app/api/workforce/[agentId]/tools/custom/route.ts` | ~55 | GET/POST agent's custom tools |
| `app/api/workforce/[agentId]/tools/connection/available/route.ts` | ~95 | GET tools from user's connections |
| `app/api/workforce/[agentId]/tools/connection/route.ts` | ~60 | GET/POST agent's connection bindings |
| `app/(pages)/workforce/components/agent-modal/hooks/useCustomTools.ts` | ~45 | Hook for custom tools management |
| `app/(pages)/workforce/components/agent-modal/hooks/useConnectionTools.ts` | ~65 | Hook for connection tools management |
| `app/(pages)/workforce/components/ConnectionToolEditor.tsx` | ~250 | Dialog for selecting connection tools |
| `app/(pages)/workforce/components/agent-modal/components/shared/ConnectionToolCard.tsx` | ~45 | Card component for connection tools |

### 11.2 Files Modified (8)

| File | Changes | Description |
|------|---------|-------------|
| `_tables/types.ts` | +10 | Added `ConnectionToolBinding` type |
| `app/api/workforce/services/agent-config.ts` | +40 | Added getter/updater for connection bindings |
| `app/api/workforce/[agentId]/tools/route.ts` | ~20 | Updated for backwards compatibility |
| `app/api/connections/services/composio.ts` | +15 | Added `getToolsForConnection()` |
| `app/api/tools/services/runtime.ts` | +70 | Added `getConnectionToolExecutable()` |
| `app/api/workforce/[agentId]/chat/route.ts` | +25 | Integrated connection tool loading |
| `app/(pages)/workforce/components/agent-modal/hooks/useAgentDetails.ts` | +10 | Fetch connection bindings |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | +80 | Split into two sections |

### 11.3 Summary

| Metric | Count |
|--------|-------|
| Files Created | 8 |
| Files Modified | 8 |
| Total Files Touched | 16 |
| Estimated Lines Added | ~800 |
| API Routes Created | 4 |
| React Components Created | 2 |
| React Hooks Created | 2 |

---

## 12. API Route Summary

### 12.1 New Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/workforce/[agentId]/tools/custom` | GET | ✓ | Get agent's custom tool IDs |
| `/api/workforce/[agentId]/tools/custom` | POST | ✓ | Update agent's custom tools |
| `/api/workforce/[agentId]/tools/custom/available` | GET | - | List all available custom tools |
| `/api/workforce/[agentId]/tools/connection` | GET | ✓ | Get agent's connection bindings |
| `/api/workforce/[agentId]/tools/connection` | POST | ✓ | Update agent's connection bindings |
| `/api/workforce/[agentId]/tools/connection/available` | GET | ✓ | List tools from user's connections |

### 12.2 Modified Routes

| Route | Change |
|-------|--------|
| `/api/workforce/[agentId]/tools` | Now delegates to `/custom` for backwards compat |
| `/api/workforce/[agentId]/chat` | Loads connection tool bindings |

---

## 13. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
│                                                                             │
│  1. User connects Gmail in Profile → Connections                            │
│     └── Composio stores: { connectionId: "ca_abc", userId: "user_123" }    │
│                                                                             │
│  2. User opens Agent → Capabilities → Connection Tools → Manage             │
│     └── Frontend fetches: GET /tools/connection/available                   │
│         └── Backend calls: listConnections(userId) + getToolsForConnection()│
│         └── Returns: tools grouped by connection                            │
│                                                                             │
│  3. User selects tools → Save                                               │
│     └── Frontend calls: POST /tools/connection                              │
│         └── Backend updates: agent.connectionToolBindings in config file    │
│                                                                             │
│  4. User chats: "Send an email to John"                                    │
│     └── Chat route loads: agent.connectionToolBindings                      │
│     └── For each binding: getConnectionToolExecutable(userId, binding)      │
│         └── Wraps Composio tool with specific connectionId                  │
│     └── Agent executes: GMAIL_SEND_EMAIL via Composio                       │
│         └── Composio uses: connectionId "ca_abc" credentials               │
│     └── Email sent from user's Gmail account                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Testing & Verification

### 14.1 Acceptance Criteria

| # | Criteria | Status |
|---|----------|--------|
| 1 | `ConnectionToolBinding` type exists in `types.ts` | ✅ |
| 2 | `AgentConfig` includes optional `connectionToolBindings` | ✅ |
| 3 | Custom tools API routes work (`/tools/custom/*`) | ✅ |
| 4 | Connection tools API routes work (`/tools/connection/*`) | ✅ |
| 5 | `useCustomTools` hook fetches and saves tools | ✅ |
| 6 | `useConnectionTools` hook fetches and saves bindings | ✅ |
| 7 | ConnectionToolEditor displays tools by connection | ✅ |
| 8 | CapabilitiesTab shows two sections with Manage buttons | ✅ |
| 9 | Chat route loads connection tool bindings | ✅ |
| 10 | Agent can execute Composio tools in chat | ✅ |

### 14.2 Manual Test Flow

1. Connect Gmail in Profile → Connections
2. Open agent → Capabilities → see empty Connection Tools section
3. Click Manage → ConnectionToolEditor opens
4. See Gmail tools listed under your connected account
5. Select "GMAIL_FETCH_EMAILS" → Save
6. See tool appear in Connection Tools section
7. Go to Chat → ask "Fetch my emails"
8. Agent calls the tool and returns email data

---

## 15. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        CapabilitiesTab                                │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────┐    │  │
│  │  │    CUSTOM TOOLS         │  │    CONNECTION TOOLS              │    │  │
│  │  │  useCustomTools() hook  │  │  useConnectionTools() hook       │    │  │
│  │  │  → CustomToolEditor     │  │  → ConnectionToolEditor          │    │  │
│  │  └─────────────────────────┘  └─────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                     │                              │                        │
│                     ▼                              ▼                        │
│          /tools/custom/*                /tools/connection/*                 │
└─────────────────────────────────────────────────────────────────────────────┘
                      │                              │
                      ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
│                                                                             │
│  /api/workforce/[agentId]/tools/                                           │
│  ├── custom/                                                                │
│  │   ├── route.ts          ← GET/POST agent.toolIds                        │
│  │   └── available/        ← GET all workflow-* tools                      │
│  └── connection/                                                            │
│      ├── route.ts          ← GET/POST agent.connectionToolBindings         │
│      └── available/        ← GET user's connections + their tools          │
│                                                                             │
│  /api/workforce/[agentId]/chat/route.ts                                    │
│  └── Loads both toolIds AND connectionToolBindings                         │
│      └── getConnectionToolExecutable(userId, binding)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT CONFIG FILE                                  │
│  _tables/agents/mira-patel.ts                                               │
│                                                                             │
│  {                                                                          │
│    toolIds: ["workflow-hohoho", ...],           // Custom tools             │
│    connectionToolBindings: [                    // Connection tools         │
│      { toolId: "GMAIL_SEND_EMAIL", connectionId: "ca_abc", toolkitSlug: "gmail" }│
│    ]                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPOSIO                                        │
│                                                                             │
│  client.tools.execute("GMAIL_SEND_EMAIL", {                                │
│    userId: "user_123",                                                      │
│    arguments: { to: "john@example.com", subject: "Hello" },                │
│    connectedAccountId: "ca_abc"  ← Key: routes to specific account         │
│  })                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Known Limitations

| Limitation | Severity | Future Fix |
|------------|----------|------------|
| Connection bindings stored in agent config files | Medium | Move to database for multi-user |
| No UI for re-ordering tools | Low | Add drag-and-drop |
| Tool descriptions not shown in Capabilities | Low | Add hover tooltips |
| No bulk enable/disable | Low | Add select all checkbox |

---

## 17. Lessons Learned

### 17.1 Phased Implementation Works

Breaking the feature into 7 stages allowed:
- Incremental verification
- Clear git commits per stage
- Easier debugging when issues arose

### 17.2 Multi-Account is Non-Trivial

The binding concept emerged from thinking about edge cases. Without explicit bindings, we'd have to guess which account to use - leading to unpredictable behavior.

### 17.3 API Structure Matters

The `/custom/` and `/connection/` split makes the API self-documenting. Each endpoint does one thing clearly.

---

## 18. Summary

We implemented a complete Connection Tools system enabling agents to use Composio-provided tools from user connections:

**What we built:**
- Data model for tool bindings with multi-account support
- 4 new API routes for managing tools
- 2 React hooks for frontend state
- ConnectionToolEditor dialog with search and grouping
- Refactored CapabilitiesTab with two sections
- Chat execution integration with Clerk auth

**The result:**
- Users can assign Gmail, Slack, GitHub tools to agents
- Each binding specifies exactly which connected account to use
- Agents can execute real actions (send emails, create issues, etc.)
- Full user isolation via Clerk authentication

**Files Created:** 8  
**Files Modified:** 8  
**Total Lines Added:** ~800  
**Implementation Time:** ~3 hours

---

## 19. Related Entries

- **Entry 15:** Composio Integrations Platform (OAuth connections)
- **Entry 15.1:** Connections Page Refinement (UX improvements)
- **Entry 16:** Clerk Authentication (user isolation)
- **Entry 17.1:** Connection Tool Execution Fix (bug fix for tool.slug vs tool.name)


