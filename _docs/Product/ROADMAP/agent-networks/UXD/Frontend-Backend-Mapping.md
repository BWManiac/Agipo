# Frontend-Backend Mapping: Manager Agents (Agent Networks)

**Created:** December 2024  
**Status:** UXD Design Phase  
**Related UXD:** Current directory

---

## Overview

This document maps UI components for Manager Agents to their required backend APIs. Manager Agents coordinate multiple sub-agents through intelligent delegation using Mastra's Agent Networks feature.

---

## API Endpoints

### 1. Manager CRUD Operations

#### `GET /api/workforce/managers`
**UI Component:** `01-workforce-managers-section.html` - Manager section
**Description:** List all manager agents for current user

**Response:**
```typescript
{
  managers: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: 'active' | 'paused' | 'delegating' | 'coordinating';
    description: string;
    teamSize: number;
    subAgentIds: string[];
    activeDelgations: number;
    createdAt: string;
    lastActive: string;
    metrics: {
      totalDelegations: number;
      successRate: number;
      avgResponseTime: number;
    };
  }>;
}
```

---

#### `POST /api/workforce/managers`
**UI Component:** `02-create-manager-wizard.html` - Create button
**Description:** Create a new manager agent

**Request:**
```typescript
{
  name: string;
  role: string;
  avatar: string;
  description: string;
  instructions: string;              // Delegation strategy
  model: string;
  subAgentIds: string[];             // Selected team members
  toolIds?: string[];                // Optional direct tools
  workflowIds?: string[];            // Optional direct workflows
  delegationStrategy: {
    routingInstructions: string;
    fallbackBehavior: 'ask-user' | 'best-guess' | 'refuse';
    parallelExecution: boolean;
    maxDelegationDepth: number;
  };
}
```

**Response:**
```typescript
{
  id: string;
  success: boolean;
  manager: ManagerConfig;
  teamValidation: {
    validAgents: string[];
    invalidAgents: string[];
    warnings?: string[];
  };
}
```

---

#### `GET /api/workforce/managers/[managerId]`
**UI Component:** Manager modal - Load manager details
**Description:** Get manager configuration and status

**Response:**
```typescript
{
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'paused' | 'delegating' | 'coordinating';
  description: string;
  instructions: string;
  model: string;
  subAgentIds: string[];
  toolIds?: string[];
  workflowIds?: string[];
  delegationStrategy: {
    routingInstructions: string;
    fallbackBehavior: string;
    parallelExecution: boolean;
    maxDelegationDepth: number;
  };
  createdAt: string;
  updatedAt: string;
  activeDelegations: Array<{
    id: string;
    task: string;
    subAgentId: string;
    status: 'routing' | 'executing' | 'completed' | 'failed';
    startedAt: string;
  }>;
}
```

---

#### `PATCH /api/workforce/managers/[managerId]`
**UI Component:** `07-manager-config.html` - Save button
**Description:** Update manager configuration

**Request:**
```typescript
{
  name?: string;
  instructions?: string;
  subAgentIds?: string[];
  delegationStrategy?: Partial<DelegationStrategy>;
  status?: 'active' | 'paused';
}
```

**Response:**
```typescript
{
  success: boolean;
  updated: string[];
  manager: ManagerConfig;
}
```

---

#### `DELETE /api/workforce/managers/[managerId]`
**UI Component:** Manager settings - Delete button
**Description:** Delete a manager agent

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 2. Team Management

#### `GET /api/workforce/managers/[managerId]/team`
**UI Component:** `04-manager-modal-team-tab.html` - Team tab
**Description:** Get detailed team member information

**Response:**
```typescript
{
  team: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: 'active' | 'paused' | 'busy';
    description: string;
    capabilities: {
      tools: Array<{ id: string; name: string; type: string }>;
      workflows: Array<{ id: string; name: string }>;
      connections: Array<{ id: string; platform: string }>;
    };
    performanceMetrics: {
      tasksCompleted: number;
      avgExecutionTime: number;
      successRate: number;
      lastUsed: string;
    };
    addedToTeam: string;
    addedBy: string;
  }>;
  teamMetrics: {
    totalCapabilities: number;
    coverageAreas: string[];
    teamSuccessRate: number;
  };
}
```

---

#### `POST /api/workforce/managers/[managerId]/team/agents`
**UI Component:** `03-team-selection.html` - Add agents button
**Description:** Add agents to manager's team

**Request:**
```typescript
{
  agentIds: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  added: string[];
  failed: Array<{
    agentId: string;
    reason: string;
  }>;
  newTeamSize: number;
}
```

---

#### `DELETE /api/workforce/managers/[managerId]/team/agents/[agentId]`
**UI Component:** `04-manager-modal-team-tab.html` - Remove button
**Description:** Remove agent from manager's team

**Response:**
```typescript
{
  success: boolean;
  removedAgentId: string;
  newTeamSize: number;
}
```

---

### 3. Network Chat & Delegation

#### `POST /api/workforce/managers/[managerId]/network` (Streaming)
**UI Component:** `05-network-chat-delegation.html` - Chat input
**Description:** Send message to manager for network execution

**Request:**
```typescript
{
  threadId?: string;
  message: string;
  context?: {
    files?: string[];
    data?: Record<string, unknown>;
  };
}
```

**Response:** Server-Sent Events stream
```typescript
// Routing start
{ 
  type: 'routing_start',
  managerId: string,
  message: string 
}

// Routing decision
{ 
  type: 'routing_decision',
  targetAgent: {
    id: string,
    name: string,
    reason: string
  }
}

// Delegation start
{ 
  type: 'delegation_start',
  agentId: string,
  agentName: string,
  task: string 
}

// Sub-agent event
{ 
  type: 'agent_event',
  agentId: string,
  agentName: string,
  event: {
    type: string,
    content: unknown
  }
}

// Delegation complete
{ 
  type: 'delegation_complete',
  agentId: string,
  result: unknown,
  duration: number 
}

// Multiple delegations (parallel)
{
  type: 'parallel_delegations',
  delegations: Array<{
    agentId: string,
    agentName: string,
    task: string,
    status: 'pending' | 'executing' | 'completed'
  }>
}

// Manager summary
{ 
  type: 'manager_summary',
  content: string,
  delegationCount: number,
  totalDuration: number 
}

// Error
{ 
  type: 'error',
  error: string,
  agentId?: string 
}
```

---

### 4. Delegation History

#### `GET /api/workforce/managers/[managerId]/delegations`
**UI Component:** `08-delegation-history.html` - History view
**Description:** Get delegation history for a manager

**Query Parameters:**
- `limit`: number (default: 20)
- `offset`: number (default: 0)
- `status`: 'all' | 'completed' | 'failed' | 'active'
- `agentId`: string (filter by sub-agent)

**Response:**
```typescript
{
  delegations: Array<{
    id: string;
    managerId: string;
    managerName: string;
    task: string;
    userMessage: string;
    routingDecision: {
      agentId: string;
      agentName: string;
      reason: string;
    };
    subAgentExecutions: Array<{
      agentId: string;
      agentName: string;
      task: string;
      status: 'completed' | 'failed' | 'executing';
      startedAt: string;
      completedAt?: string;
      duration?: number;
      result?: unknown;
      error?: string;
    }>;
    parallelExecutions: boolean;
    totalDuration: number;
    status: 'completed' | 'failed' | 'partial' | 'executing';
    createdAt: string;
    completedAt?: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalDelegations: number;
    successRate: number;
    avgDuration: number;
    topAgents: Array<{
      agentId: string;
      agentName: string;
      taskCount: number;
    }>;
  };
}
```

---

#### `GET /api/workforce/managers/[managerId]/delegations/[delegationId]`
**UI Component:** Delegation detail view
**Description:** Get detailed delegation information

**Response:**
```typescript
{
  id: string;
  managerId: string;
  threadId: string;
  userMessage: string;
  managerAnalysis: string;
  routingDecisions: Array<{
    agentId: string;
    agentName: string;
    task: string;
    reason: string;
    confidence: number;
  }>;
  executionGraph: {
    nodes: Array<{
      id: string;
      type: 'manager' | 'agent' | 'task';
      data: Record<string, unknown>;
    }>;
    edges: Array<{
      source: string;
      target: string;
      label?: string;
    }>;
  };
  timeline: Array<{
    timestamp: string;
    type: 'routing' | 'delegation' | 'execution' | 'completion';
    actor: string;
    details: string;
  }>;
  results: Record<string, unknown>;
  metrics: {
    totalDuration: number;
    routingTime: number;
    executionTime: number;
    parallelTasks: number;
  };
}
```

---

### 5. Available Agents for Team

#### `GET /api/workforce/agents/available`
**UI Component:** `03-team-selection.html` - Agent grid
**Description:** Get agents available for team assignment

**Query Parameters:**
- `excludeManagers`: boolean (default: true)
- `includeCapabilities`: boolean (default: true)

**Response:**
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: 'active' | 'paused';
    description: string;
    capabilities: {
      toolCount: number;
      workflowCount: number;
      connectionCount: number;
      primaryTools: string[];
    };
    isAssignedToManager: boolean;
    assignedManagerId?: string;
    assignedManagerName?: string;
  }>;
  stats: {
    totalAgents: number;
    availableAgents: number;
    assignedAgents: number;
  };
}
```

---

### 6. Sub-agent Preview

#### `GET /api/workforce/agents/[agentId]/preview`
**UI Component:** `09-subagent-preview.html` - Preview modal
**Description:** Get agent preview information

**Response:**
```typescript
{
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  description: string;
  capabilities: {
    tools: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
    }>;
    workflows: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    connections: Array<{
      id: string;
      platform: string;
      status: 'connected' | 'expired';
    }>;
  };
  recentTasks: Array<{
    id: string;
    task: string;
    completedAt: string;
    duration: number;
    status: 'success' | 'failed';
    delegatedBy?: string;
  }>;
  metrics: {
    totalTasks: number;
    successRate: number;
    avgExecutionTime: number;
    specialties: string[];
  };
}
```

---

## WebSocket Events (Real-time Updates)

For real-time delegation status:

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_manager` | `{ managerId: string }` | Subscribe to manager events |
| `leave_manager` | `{ managerId: string }` | Unsubscribe from manager |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `delegation_started` | `{ managerId: string, agentId: string, task: string }` | Delegation began |
| `delegation_updated` | `{ delegationId: string, status: string, progress?: number }` | Status update |
| `delegation_completed` | `{ delegationId: string, result: unknown }` | Delegation finished |
| `manager_status_changed` | `{ managerId: string, status: string }` | Manager status change |

---

## Data Models

### Manager Configuration (File-based)

Located at: `_tables/managers/[manager-folder]/config.ts`

```typescript
export interface ManagerConfig {
  id: string;
  type: 'manager';
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'paused' | 'delegating' | 'coordinating';
  description: string;
  instructions: string;           // Delegation instructions
  model: string;
  maxSteps: number;
  subAgentIds: string[];          // Team members
  toolIds?: string[];             // Optional direct tools
  workflowIds?: string[];         // Optional direct workflows
  delegationStrategy: {
    routingInstructions: string;
    fallbackBehavior: 'ask-user' | 'best-guess' | 'refuse';
    parallelExecution: boolean;
    maxDelegationDepth: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Team Configuration

Located at: `_tables/managers/[manager-folder]/team.json`

```typescript
export interface TeamConfig {
  managerId: string;
  agents: Array<{
    agentId: string;
    addedAt: string;
    addedBy: string;
    role?: string;                // Role within team
    specialties?: string[];        // What this agent is best at
  }>;
  teamMetrics: {
    lastUpdated: string;
    totalDelegations: number;
    successRate: number;
  };
}
```

---

## Implementation Priority

### Phase 1: Basic Manager Creation
1. `POST /api/workforce/managers`
2. `GET /api/workforce/managers`
3. Manager storage structure

### Phase 2: Team Management
1. `GET /api/workforce/managers/[managerId]/team`
2. `POST /api/workforce/managers/[managerId]/team/agents`
3. `GET /api/workforce/agents/available`

### Phase 3: Network Execution
1. `POST /api/workforce/managers/[managerId]/network`
2. Mastra network integration
3. Event streaming

### Phase 4: Observability
1. `GET /api/workforce/managers/[managerId]/delegations`
2. WebSocket events
3. Delegation history

### Phase 5: Advanced Features
1. Parallel delegation support
2. Manager-to-manager delegation
3. Analytics and metrics

---

## Notes

- **Storage**: Managers stored separately in `_tables/managers/`
- **Mastra Networks**: Use `.network()` API for delegation
- **Event Streaming**: SSE for chat, WebSocket for status
- **Team Validation**: Ensure agents exist and are active
- **Circular Prevention**: Managers cannot add other managers (v1)