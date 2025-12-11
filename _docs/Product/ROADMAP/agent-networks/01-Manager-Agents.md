# Manager Agents (Agent Networks)

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables the Job Application Manager to coordinate specialized agents (Resume Tailor, Job Scraper, Application Filler) through intelligent delegation. Users can talk to the manager when they're uncertain which agent to use, and the manager routes tasks to the right specialist. This validates our platform's ability to coordinate multiple agents for complex, real-world workflows.

---

## Problem Statement

Currently, users must know which specific agent to talk to for each task. If they're uncertain or have a vague request, they have to:
- Guess which agent handles what
- Manually coordinate multiple agents for complex tasks
- Switch between different agent conversations
- Lose context when delegating between agents

For complex workflows like job applications, users need a coordinator that can:
- Understand vague or high-level requests
- Route to the right specialist agent automatically
- Coordinate multiple agents when needed
- Provide visibility into which agent handled what

Manager Agents solve this by acting as intelligent routers that delegate to specialized agents using Mastra's Agent Networks feature.

---

## User Value

- **Talk to one manager instead of many agents**: Users don't need to know which agent handles what
- **Vague requests work**: "Help me apply for jobs" routes to the right specialists automatically
- **Intelligent delegation**: Manager uses LLM reasoning to decide which agent should handle a task
- **Observability**: See which agent handled what part of the request
- **Complex task coordination**: Manager can orchestrate multiple agents for multi-step tasks
- **Familiar pattern**: Manager → Team structure matches real-world organizational patterns

---

## User Flows

### Flow 1: Vague Request to Manager

```
1. User opens Job Application Manager
2. User types: "I want to apply for jobs"
3. Manager analyzes request:
   - Recognizes need for job scraping
   - Recognizes need for resume tailoring
   - Recognizes need for application filling
4. Manager delegates to Job Scraper Agent: "Find relevant job postings"
5. Job Scraper returns list of jobs
6. Manager delegates to Resume Tailor Agent: "Tailor resume for job X"
7. Resume Tailor returns tailored resume
8. Manager delegates to Application Filler Agent: "Fill application for job X"
9. Application Filler submits application
10. Manager summarizes: "Applied to 3 jobs, tailored resumes created"
11. User sees in chat which agent handled each step
```

### Flow 2: Specific Request to Manager

```
1. User: "Tailor my resume for this job posting: [URL]"
2. Manager recognizes this is a resume task
3. Manager delegates directly to Resume Tailor Agent
4. Resume Tailor processes and returns tailored resume
5. Manager presents result to user
6. User sees: "Resume Tailor Agent handled this task"
```

### Flow 3: View Manager Team

```
1. User opens Job Application Manager
2. User clicks "Team" tab
3. Sees list of sub-agents:
   - Resume Tailor Agent (specialized in resume customization)
   - Job Scraper Agent (specialized in finding job postings)
   - Application Filler Agent (specialized in form filling)
4. Can see each agent's description and capabilities
5. Can click agent to open their individual modal
```

### Flow 4: Create Manager Agent

```
1. User clicks "Create Manager" in Workforce
2. Wizard opens (similar to agent creation)
3. Step 1: Identity (name, role, avatar)
4. Step 2: Instructions (how manager should delegate)
5. Step 3: Team (select which agents manager can delegate to)
6. Step 4: Capabilities (optional tools/workflows manager can use directly)
7. Manager created and appears in Workforce
8. User can chat with manager immediately
```

### Flow 5: Observability in Chat

```
1. User chats with manager
2. Manager delegates to Resume Tailor Agent
3. Chat shows: "🔄 Delegating to Resume Tailor Agent..."
4. Resume Tailor processes task
5. Chat shows: "✅ Resume Tailor Agent completed: [result]"
6. Manager presents final response
7. User can expand to see full sub-agent conversation
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workforce/` | Current agent API structure | `[agentId]/chat/route.ts`, `services/chat-service.ts` |
| `app/api/workforce/[agentId]/chat/services/` | Agent chat service | `chat-service.ts`, how agents are created |
| `_tables/agents/` | Agent storage structure | `[folder]/config.ts`, how agents are loaded |
| `app/(pages)/workforce/` | Workforce UI | Agent modal, agent list |
| Mastra Agent Networks | Network API | `.network()` method, network events |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Manager Storage** | Separate from agents: `_tables/managers/` | Managers are different abstraction, cleaner separation |
| **Manager Type** | New `ManagerConfig` type (not `AgentConfig`) | Different structure, different capabilities |
| **Network API** | Use Mastra's `.network()` instead of `.stream()` | Native support for agent coordination |
| **Sub-Agent Loading** | Load sub-agent configs when creating manager | Manager needs access to sub-agents at runtime |
| **Chat Endpoint** | Separate endpoint: `/api/workforce/managers/[managerId]/network` | Different API pattern, different event stream |
| **Observability** | Show delegation events in chat UI | Users need to see which agent handled what |
| **Team Tab** | New "Team" tab in manager modal | Shows sub-agents and their capabilities |
| **Delegation Focus** | Managers focus on routing/delegation | Not complex orchestration (that's workflows) |
| **Manager UI Location** | Dedicated section on workforce page + badge | Separate section for managers, badge for visual distinction |
| **Sub-Agent Selection** | Multi-select from all available agents | No filtering/search for MVP |
| **Manager Capabilities** | Hybrid model - managers can have own tools/workflows | Not pure routers, can use tools/workflows directly |
| **Delegation Visibility** | Full sub-agent conversation (expandable) | Full conversation visibility when possible |
| **Error Handling** | Defer to Mastra framework | Rely on Mastra's error handling, not custom logic |
| **Manager Memory** | Defer to Mastra documentation | Research Mastra Agent Networks memory scoping |

---

## Constraints

- **Mastra Networks Required**: Must use Mastra's Agent Networks feature (`.network()` API)
- **Memory Required**: Networks require memory to track task history and completion
- **Sub-Agent Descriptions**: Sub-agents need clear descriptions for routing accuracy
- **Agent Independence**: Sub-agents remain independent (can be used directly or via manager)
- **Existing Agent System**: Must not break existing agent chat functionality
- **File-Based Storage**: Managers stored in `_tables/managers/` following existing patterns

---

## Success Criteria

- [ ] Users can create a Manager Agent through wizard
- [ ] Manager Agent can be configured with sub-agents (team)
- [ ] Users can chat with Manager Agent
- [ ] Manager Agent delegates to sub-agents using Mastra Networks
- [ ] Chat shows delegation events (which agent is handling what)
- [ ] Manager Agent routes vague requests to appropriate sub-agents
- [ ] Manager Agent routes specific requests directly to relevant sub-agent
- [ ] Team tab shows all sub-agents with descriptions
- [ ] Sub-agents can still be used independently (not manager-only)
- [ ] Network execution events are observable in UI
- [ ] Job Application Manager example works end-to-end

---

## Out of Scope

- **Complex Orchestration**: Multi-agent workflows with dependencies (that's workflows)
- **Manager-to-Manager Delegation**: Managers delegating to other managers (future)
- **Dynamic Team Changes**: Adding/removing sub-agents at runtime (future)
- **Team Permissions**: Restricting which users can see which sub-agents (future)
- **Manager Analytics**: Detailed metrics on delegation patterns (future)
- **Custom Routing Logic**: User-defined routing rules (LLM handles this)

---

## Open Questions

- ✅ **Manager vs Agent UI**: **ANSWERED** - Managers appear in dedicated section on workforce page with badge. Separate section + badge approach. UI exploration needed.
- ✅ **Sub-Agent Selection**: **ANSWERED** - Multi-select from all available agents. No filtering/search for MVP.
- ✅ **Manager Capabilities**: **ANSWERED** - Yes, managers CAN have their own tools/workflows (hybrid model). Not pure routers.
- ✅ **Delegation Visibility**: **ANSWERED** - Full sub-agent conversation if possible (expandable). Full conversation visibility is the goal.
- ✅ **Error Handling**: **ANSWERED** - Defer to Mastra. Error handling logic not in scope - rely on Mastra's framework behavior.

---

## Technical Architecture (High-Level)

### Storage Structure

```
_tables/managers/
├── job-application-manager-[uuid]/
│   ├── config.ts                    # ManagerConfig
│   └── memory.db                    # Manager's memory (for network tracking)
└── research-manager-[uuid]/
    ├── config.ts
    └── memory.db
```

### ManagerConfig Type

```typescript
export type ManagerConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "paused" | "draft";
  description: string;
  instructions: string;              // How manager should delegate
  model: string;                     // LLM for routing decisions
  subAgentIds: string[];            // Agents manager can delegate to
  toolIds?: string[];               // Optional: tools manager can use directly
  workflowIds?: string[];           // Optional: workflows manager can use
  objectives?: string[];
  guardrails?: string[];
  // ... other metadata fields
};
```

### API Structure

- `GET /api/workforce/managers` - List all managers
- `POST /api/workforce/managers` - Create manager
- `GET /api/workforce/managers/[managerId]` - Get manager config
- `PATCH /api/workforce/managers/[managerId]` - Update manager
- `DELETE /api/workforce/managers/[managerId]` - Delete manager
- `POST /api/workforce/managers/[managerId]/network` - Chat with manager (network API)
- `GET /api/workforce/managers/[managerId]/team` - Get sub-agents list

### Frontend Structure

- `/workforce` - Shows managers and agents (managers have special badge/icon)
- Manager Modal - Similar to agent modal but with "Team" tab
- Team Tab - Shows sub-agents, their descriptions, capabilities
- Chat Tab - Shows delegation events, which agent handled what
- Create Manager Wizard - Similar to agent wizard but with Team step

### Network Execution Flow

```
1. User sends message to manager
2. Manager service loads manager config
3. Manager service loads all sub-agent configs
4. Create Mastra Agent with sub-agents:
   ```typescript
   const managerAgent = new Agent({
     name: managerConfig.name,
     instructions: managerConfig.instructions,
     model: gateway(managerConfig.model),
     agents: {
       [subAgent1.name]: subAgent1Instance,
       [subAgent2.name]: subAgent2Instance,
     },
     memory: managerMemory,
   });
   ```
5. Call `.network()` instead of `.stream()`:
   ```typescript
   const result = await managerAgent.network(userMessage);
   ```
6. Stream network events to frontend:
   - `routing-agent-start`
   - `agent-execution-start` (sub-agent started)
   - `agent-execution-event-*` (sub-agent events)
   - `agent-execution-end` (sub-agent finished)
   - `network-execution-event-step-finish` (network step complete)
7. Frontend displays delegation events in chat
8. Manager presents final result to user
```

---

## References

- **Mastra Agent Networks**: https://mastra.ai/docs/agents/networks
- **Current Agent Architecture**: `_docs/Product/Features/03-Agents-Architecture.md`
- **North Star**: `_docs/Product/ROADMAP/00-North-Star.md` (Job Application Agent)
- **Agent Creation**: `app/api/workforce/services/agent-creator.ts`

---

## Related Roadmap Items

- **Workflow Observability**: Similar pattern for showing workflow execution in chat
- **Agent Configuration Editing**: Managers need same config editing capabilities
- **RAG Integration**: Sub-agents can use RAG for context-aware responses
