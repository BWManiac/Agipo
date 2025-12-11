# Manager Agents - Implementation Phases

**Feature:** Manager Agents (Agent Networks)  
**Task Document:** `01A-Manager-Agents-Task.md`  
**API Specification:** `01D-Manager-Agents-API.md`

---

## Phase 1: Backend Infrastructure & Storage

### Goal
Create backend infrastructure for manager storage, configuration, and basic CRUD operations. Establish the foundation for manager entities separate from regular agents.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `_tables/types.ts` | Modify | Add ManagerConfig type |
| `_tables/managers/README.md` | Create | Document manager storage structure |
| `app/api/workforce/services/manager-creator.ts` | Create | Manager creation service |
| `app/api/workforce/managers/route.ts` | Create | List/create managers API |
| `app/api/workforce/managers/[managerId]/route.ts` | Create | Get/update/delete manager API |

### Pseudocode

#### `_tables/types.ts` - Add ManagerConfig
```typescript
export interface ManagerConfig {
  // Identity
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "paused" | "draft";
  
  // Configuration
  description: string;
  instructions: string;  // How to delegate
  model: string;
  
  // Team Management
  subAgentIds: string[];
  
  // Optional Direct Capabilities
  toolIds?: string[];
  workflowBindings?: WorkflowBinding[];
  connectionToolBindings?: ConnectionToolBinding[];
  
  // Governance
  objectives?: string[];
  guardrails?: string[];
  
  // Metadata
  highlight: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `app/api/workforce/services/manager-creator.ts`
```typescript
export async function createManager(data: CreateManagerRequest) {
  const managerId = crypto.randomUUID();
  const folderName = `${slugify(data.name)}-${managerId}`;
  const managerPath = `_tables/managers/${folderName}`;
  
  // Create directory
  await fs.mkdir(managerPath, { recursive: true });
  
  // Generate config
  const config: ManagerConfig = {
    id: managerId,
    name: data.name,
    role: data.role || "Manager",
    subAgentIds: data.subAgentIds || [],
    instructions: data.instructions,
    model: data.model || "google/gemini-2.5-flash",
    // ... other fields
  };
  
  // Write config.ts
  const configContent = generateManagerConfigFile(config);
  await fs.writeFile(`${managerPath}/config.ts`, configContent);
  
  return { managerId, folderName };
}

function generateManagerConfigFile(config: ManagerConfig): string {
  return `import type { ManagerConfig } from "@/_tables/types";

export const config: ManagerConfig = ${JSON.stringify(config, null, 2)};

export default config;`;
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Manager type exists | TypeScript compilation succeeds |
| Can create manager | POST /api/workforce/managers creates folder |
| Config file generated | Verify config.ts exists with correct structure |
| Can list managers | GET /api/workforce/managers returns array |
| Can get single manager | GET /api/workforce/managers/[id] returns config |
| Can update manager | PATCH updates config.ts file |
| Can delete manager | DELETE removes folder |

### Testing Strategy
- Unit tests for manager-creator service
- Integration tests for manager CRUD endpoints
- File system verification tests

---

## Phase 2: Network Execution & Sub-Agent Loading

### Goal
Implement Mastra Agent Networks integration, sub-agent loading, and network execution with proper event streaming for delegation observability.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/services/sub-agent-loader.ts` | Create | Load and configure sub-agents |
| `app/api/workforce/services/manager-network-service.ts` | Create | Manager network execution |
| `app/api/workforce/managers/[managerId]/network/route.ts` | Create | Network chat endpoint |
| `app/api/workforce/managers/[managerId]/team/route.ts` | Create | Get sub-agents list |
| `_tables/managers/[folder]/memory.db` | Auto-create | Mastra memory storage |

### Pseudocode

#### `app/api/workforce/services/sub-agent-loader.ts`
```typescript
import { Agent } from "@mastra/core/agent";
import { getAgentById } from "@/_tables/agents";
import { buildToolMap } from "../../[agentId]/chat/services/chat-service";

export async function loadSubAgents(
  userId: string,
  subAgentIds: string[]
): Promise<Record<string, Agent>> {
  const agents: Record<string, Agent> = {};
  
  for (const agentId of subAgentIds) {
    try {
      const config = getAgentById(agentId);
      if (!config) continue;
      
      // Reuse existing tool loading
      const tools = await buildToolMap(userId, config);
      
      // Create agent instance
      const agent = new Agent({
        name: config.id,
        instructions: config.systemPrompt,
        model: gateway(config.model),
        tools,
        memory: getAgentMemory(config.id),
      });
      
      agents[config.id] = agent;
    } catch (error) {
      console.warn(`Failed to load sub-agent ${agentId}:`, error);
    }
  }
  
  return agents;
}
```

#### `app/api/workforce/services/manager-network-service.ts`
```typescript
export async function createManagerNetwork(
  userId: string,
  managerConfig: ManagerConfig
): Promise<Agent> {
  // Load sub-agents
  const subAgents = await loadSubAgents(userId, managerConfig.subAgentIds);
  
  // Load manager's own tools if any
  const managerTools = managerConfig.toolIds?.length 
    ? await buildToolMap(userId, managerConfig)
    : {};
  
  // Create manager agent with network capabilities
  const manager = new Agent({
    name: managerConfig.name,
    instructions: managerConfig.instructions,
    model: gateway(managerConfig.model),
    agents: subAgents,  // This enables network mode
    tools: managerTools,
    // CRITICAL: Memory is MANDATORY for .network() to function
    memory: getManagerMemory(managerConfig.id),
  });
  
  return manager;
}

export async function* executeNetwork(
  manager: Agent,
  message: string,
  memory: any,  // LibSQLStore instance  
  threadId: string
): AsyncIterator<NetworkEvent> {
  // CRITICAL: Must pass memory in options for .network() to work
  const networkResponse = await manager.network(
    message,
    {
      memory,  // MANDATORY - networks fail without this
      thread: threadId,
      maxSteps: 10  // Prevent infinite loops
    }
  );
  
  for await (const event of networkResponse.stream) {
    // Transform Mastra events to frontend format
    yield transformNetworkEvent(event);
  }
}
```

#### `app/api/workforce/managers/[managerId]/network/route.ts`
```typescript
export async function POST(req: Request, { params }) {
  const { message } = await req.json();
  const { managerId } = params;
  
  // Load manager
  const managerConfig = getManagerById(managerId);
  const manager = await createManagerNetwork(userId, managerConfig);
  
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of executeNetwork(manager, message)) {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        }
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Sub-agents load | Verify agent instances created |
| Network executes | POST to /network returns SSE stream |
| Delegation events | Stream includes agent-execution events |
| Team endpoint works | GET /team returns sub-agent info |
| Memory persists | Verify memory.db created and used |
| Error handling | Failed sub-agent doesn't break network |

### Testing Strategy
- Mock Mastra Agent for unit tests
- Integration test with real agent configs
- SSE stream parsing tests
- Network event transformation tests

---

## Phase 3: Frontend UI & Integration

### Goal
Build complete frontend UI for managers including list view, creation wizard, manager modal with Team tab, and network chat with delegation visibility.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/store/slices/managerSlice.ts` | Create | Manager state management |
| `app/(pages)/workforce/store/index.ts` | Modify | Add manager slice |
| `app/(pages)/workforce/components/ManagerCard.tsx` | Create | Manager card component |
| `app/(pages)/workforce/components/ManagerBadge.tsx` | Create | Visual manager indicator |
| `app/(pages)/workforce/components/manager-modal/index.tsx` | Create | Manager modal wrapper |
| `app/(pages)/workforce/components/manager-modal/TeamTab.tsx` | Create | Team management tab |
| `app/(pages)/workforce/components/manager-modal/NetworkChatTab.tsx` | Create | Network chat with delegation |
| `app/(pages)/workforce/components/wizard/ManagerWizard.tsx` | Create | Manager creation wizard |
| `app/(pages)/workforce/page.tsx` | Modify | Show managers in list |

### Pseudocode

#### `app/(pages)/workforce/store/slices/managerSlice.ts`
```typescript
interface ManagerSlice {
  managers: ManagerConfig[];
  selectedManager: ManagerConfig | null;
  isManagerModalOpen: boolean;
  isCreatingManager: boolean;
  
  // Actions
  fetchManagers: () => Promise<void>;
  selectManager: (managerId: string) => void;
  createManager: (data: CreateManagerRequest) => Promise<void>;
  updateManager: (managerId: string, updates: Partial<ManagerConfig>) => Promise<void>;
  deleteManager: (managerId: string) => Promise<void>;
  
  // Network chat
  networkMessages: Message[];
  delegationEvents: DelegationEvent[];
  sendNetworkMessage: (managerId: string, message: string) => Promise<void>;
}
```

#### `app/(pages)/workforce/components/manager-modal/TeamTab.tsx`
```tsx
export function TeamTab({ manager }: { manager: ManagerConfig }) {
  const [team, setTeam] = useState<SubAgentInfo[]>([]);
  
  useEffect(() => {
    fetch(`/api/workforce/managers/${manager.id}/team`)
      .then(res => res.json())
      .then(data => setTeam(data.subAgents));
  }, [manager.id]);
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Team ({team.length} agents)
      </h3>
      
      <div className="grid gap-3">
        {team.map(agent => (
          <div key={agent.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Avatar src={agent.avatar} />
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-gray-600">{agent.role}</div>
              </div>
              <Button 
                size="sm" 
                onClick={() => openAgentModal(agent.id)}
              >
                View Agent
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `app/(pages)/workforce/components/manager-modal/NetworkChatTab.tsx`
```tsx
export function NetworkChatTab({ manager }: { manager: ManagerConfig }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [delegations, setDelegations] = useState<Map<string, DelegationState>>();
  
  const sendMessage = async (content: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: "user", content }]);
    
    // Start SSE connection
    const response = await fetch(`/api/workforce/managers/${manager.id}/network`, {
      method: "POST",
      body: JSON.stringify({ message: content }),
    });
    
    const reader = response.body.getReader();
    // Parse SSE stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const event = parseSSEEvent(value);
      
      if (event.type === "delegation") {
        // Show delegation indicator
        setDelegations(prev => new Map(prev).set(
          event.agentId,
          { status: "delegating", agent: event.agentName }
        ));
      } else if (event.type === "delegation-complete") {
        // Update delegation status
        setDelegations(prev => new Map(prev).set(
          event.agentId,
          { status: "complete", result: event.result }
        ));
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatMessage message={msg} />
            
            {/* Show delegations after user messages */}
            {msg.role === "user" && delegations.get(msg.id) && (
              <DelegationIndicator 
                delegation={delegations.get(msg.id)}
                expanded={expandedDelegations.has(msg.id)}
                onToggle={() => toggleDelegation(msg.id)}
              />
            )}
          </div>
        ))}
      </div>
      
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Managers appear in list | Navigate to /workforce, see manager cards |
| Manager badge visible | Visual distinction from agents |
| Creation wizard works | Complete wizard, manager created |
| Team tab shows agents | Open manager modal, see Team tab |
| Network chat sends messages | Type message, see response |
| Delegation events display | See "Delegating to..." indicators |
| Sub-agent results shown | Delegation completes with result |
| Can expand delegation details | Click to see full sub-agent conversation |

### Testing Strategy
- Component tests with React Testing Library
- E2E tests with Playwright
- Visual regression tests for manager badge
- SSE mocking for network chat tests

---

## Implementation Order

1. **Phase 1** (Days 1-2): Backend infrastructure
   - Critical path: Manager type and storage
   - Enables: Basic CRUD operations

2. **Phase 2** (Days 3-4): Network execution
   - Critical path: Mastra integration
   - Enables: Core delegation functionality

3. **Phase 3** (Days 5-6): Frontend UI
   - Critical path: User interaction
   - Enables: Complete feature

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Mastra API changes | Abstract behind service layer |
| Sub-agent loading performance | Lazy load, cache instances |
| Network event parsing complexity | Create robust event transformer |
| SSE connection drops | Implement reconnection logic |
| Delegation visibility UX | Start simple, iterate based on feedback |

---

## Success Metrics

- Manager creation time < 2 seconds
- Network delegation latency < 500ms
- Sub-agent loading < 1 second per agent
- SSE stream stability > 99%
- Clear delegation timeline in UI