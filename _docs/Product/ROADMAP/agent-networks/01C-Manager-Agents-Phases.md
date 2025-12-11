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

## Phase 3: Manager Store Architecture & Workforce Integration

### Goal
Establish manager state management following the agent modal store pattern, create manager display components, and integrate managers into the workforce dashboard with visual distinction. This phase provides the foundation for all manager UI features.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/store/index.ts` | Create | Workforce store combining agents and managers |
| `app/(pages)/workforce/store/slices/managerSlice.ts` | Create | Manager state management (following agent modal pattern) |
| `app/(pages)/workforce/components/ManagerBadge.tsx` | Create | Visual manager indicator component |
| `app/(pages)/workforce/components/ManagerCard.tsx` | Create | Manager card component for workforce list |
| `app/(pages)/workforce/components/WorkforceDashboard.tsx` | Modify | Add managers section above agents section |
| `app/(pages)/workforce/page.tsx` | Modify | Connect manager state to dashboard |

### Pseudocode

#### `app/(pages)/workforce/store/index.ts`
```typescript
import { create } from "zustand";
import { createManagerSlice, type ManagerSlice } from "./slices/managerSlice";
import { createAgentSlice, type AgentSlice } from "./slices/agentSlice";

type WorkforceStore = ManagerSlice & AgentSlice;

export const useWorkforceStore = create<WorkforceStore>((...a) => ({
  ...createManagerSlice(...a),
  ...createAgentSlice(...a),
}));
```

#### `app/(pages)/workforce/store/slices/managerSlice.ts`
```typescript
import type { StateCreator } from "zustand";
import type { ManagerConfig } from "@/_tables/types";

// 1. State Interface
export interface ManagerSliceState {
  managers: ManagerConfig[];
  selectedManagerId: string | null;
  isLoading: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface ManagerSliceActions {
  fetchManagers: () => Promise<void>;
  selectManager: (managerId: string | null) => void;
  createManager: (data: CreateManagerRequest) => Promise<ManagerConfig>;
  updateManager: (managerId: string, updates: Partial<ManagerConfig>) => Promise<void>;
  deleteManager: (managerId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type ManagerSlice = ManagerSliceState & ManagerSliceActions;

// 4. Initial State
const initialState: ManagerSliceState = {
  managers: [],
  selectedManagerId: null,
  isLoading: false,
  error: null,
};

// 5. Slice Creator
export const createManagerSlice: StateCreator<
  WorkforceStore,
  [],
  [],
  ManagerSlice
> = (set, get) => ({
  ...initialState,

  fetchManagers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/workforce/managers");
      if (!response.ok) throw new Error("Failed to fetch managers");
      const data = await response.json();
      set({ managers: data.managers || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  selectManager: (managerId) => {
    set({ selectedManagerId: managerId });
  },

  createManager: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/workforce/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create manager");
      const result = await response.json();
      const newManager = result.manager;
      set((state) => ({
        managers: [...state.managers, newManager],
        isLoading: false,
      }));
      return newManager;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateManager: async (managerId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workforce/managers/${managerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update manager");
      const updated = await response.json();
      set((state) => ({
        managers: state.managers.map((m) =>
          m.id === managerId ? updated.manager : m
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteManager: async (managerId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workforce/managers/${managerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete manager");
      set((state) => ({
        managers: state.managers.filter((m) => m.id !== managerId),
        selectedManagerId:
          state.selectedManagerId === managerId ? null : state.selectedManagerId,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
});
```

#### `app/(pages)/workforce/components/ManagerBadge.tsx`
```tsx
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagerBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ManagerBadge({ className, size = "md" }: ManagerBadgeProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700",
        className
      )}
      title="Manager Agent"
    >
      <Crown className={sizeClasses[size]} />
    </div>
  );
}
```

#### `app/(pages)/workforce/components/ManagerCard.tsx`
```tsx
import type { ManagerConfig } from "@/_tables/types";
import { ManagerBadge } from "./ManagerBadge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const statusStyles: Record<ManagerConfig["status"], string> = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  paused: "bg-slate-100 text-slate-600 border border-slate-200",
  draft: "bg-amber-100 text-amber-700 border border-amber-200",
};

interface ManagerCardProps {
  manager: ManagerConfig;
  onClick: () => void;
}

export function ManagerCard({ manager, onClick }: ManagerCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-full flex-col rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg focus:outline-none relative"
    >
      {/* Manager Badge */}
      <div className="absolute top-4 right-4">
        <ManagerBadge size="lg" />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {manager.avatar}
          </span>
          <div>
            <div className="text-lg font-semibold text-foreground flex items-center gap-2">
              {manager.name}
            </div>
            <div className="text-sm text-muted-foreground">{manager.role}</div>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[manager.status]}`}
        >
          {manager.status === "draft"
            ? "Draft"
            : manager.status === "paused"
            ? "Paused"
            : "Active"}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{manager.description}</p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="font-medium text-foreground">Team Size</div>
        <p className="text-muted-foreground">
          {manager.subAgentIds?.length || 0} sub-agents
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="font-medium text-foreground">Last activity</div>
        <p className="text-muted-foreground">{manager.lastActivity}</p>
      </div>

      <Separator className="my-4" />
      <div className="text-sm font-semibold text-primary">Open manager →</div>
    </button>
  );
}
```

#### `app/(pages)/workforce/components/WorkforceDashboard.tsx` (modifications)
```tsx
// Add to existing component:
import { ManagerCard } from "./ManagerCard";
import { ManagerBadge } from "./ManagerBadge";
import { useWorkforceStore } from "../store";

export function WorkforceDashboard() {
  const { managers, fetchManagers, selectManager } = useWorkforceStore();
  
  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  return (
    <div className="space-y-8">
      {/* Existing header... */}
      
      {/* NEW: Managers Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Managers</h2>
            <ManagerBadge />
            <span className="text-sm text-muted-foreground">
              ({managers.length})
            </span>
          </div>
          <Button onClick={() => setCreateManagerDialogOpen(true)}>
            Create Manager
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managers.map((manager) => (
            <ManagerCard
              key={manager.id}
              manager={manager}
              onClick={() => selectManager(manager.id)}
            />
          ))}
          {managers.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No managers yet. Create your first manager to coordinate multiple agents.
            </div>
          )}
        </div>
      </section>

      {/* Existing Active Roster section for regular agents... */}
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Manager store slice created | TypeScript compilation succeeds, slice follows agent modal pattern |
| Managers fetch from API | GET /api/workforce/managers populates store |
| Manager badge renders | Visual crown icon displayed on manager cards |
| Managers section appears | Navigate to /workforce, see "Managers" section above agents |
| Manager cards display correctly | Cards show name, role, team size, status badge |
| Managers visually distinct | Manager badge clearly differentiates from agents |
| Create Manager button present | Button appears in managers section header |
| Empty state shows | Message displays when no managers exist |
| Manager selection works | Clicking manager card updates selectedManagerId in store |

### Testing Strategy
- Unit tests for manager slice actions
- Component tests for ManagerCard and ManagerBadge
- Integration test for workforce dashboard with managers
- Visual regression test for manager badge styling
- Store integration tests for manager state management

---

## Phase 4: Manager Creation Wizard

### Goal
Build a multi-step wizard for creating manager agents, following the existing CreateFromScratchWizard pattern. Enable users to configure manager identity, delegation instructions, team selection, and optional direct capabilities.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/CreateManagerDialog.tsx` | Create | Entry point dialog for manager creation |
| `app/(pages)/workforce/components/wizard/ManagerWizard.tsx` | Create | Main wizard container with step navigation |
| `app/(pages)/workforce/components/wizard/ManagerIdentityStep.tsx` | Create | Step 1: Name, role, avatar, description |
| `app/(pages)/workforce/components/wizard/ManagerInstructionsStep.tsx` | Create | Step 2: Delegation instructions and strategy |
| `app/(pages)/workforce/components/wizard/TeamSelectionStep.tsx` | Create | Step 3: Multi-select sub-agents for team |
| `app/(pages)/workforce/components/wizard/ManagerCapabilitiesStep.tsx` | Create | Step 4: Optional tools/workflows for manager |
| `app/(pages)/workforce/components/wizard/ManagerReviewStep.tsx` | Create | Step 5: Review and confirm creation |

### Pseudocode

#### `app/(pages)/workforce/components/CreateManagerDialog.tsx`
```tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManagerWizard } from "./wizard/ManagerWizard";
import { useWorkforceStore } from "../store";

interface CreateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManagerCreated?: () => void;
}

export function CreateManagerDialog({
  open,
  onOpenChange,
  onManagerCreated,
}: CreateManagerDialogProps) {
  const { createManager } = useWorkforceStore();

  const handleComplete = async (data: CreateManagerRequest) => {
    await createManager(data);
    onManagerCreated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manager Agent</DialogTitle>
        </DialogHeader>
        <ManagerWizard
          onComplete={handleComplete}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### `app/(pages)/workforce/components/wizard/ManagerWizard.tsx`
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ManagerIdentityStep } from "./ManagerIdentityStep";
import { ManagerInstructionsStep } from "./ManagerInstructionsStep";
import { TeamSelectionStep } from "./TeamSelectionStep";
import { ManagerCapabilitiesStep } from "./ManagerCapabilitiesStep";
import { ManagerReviewStep } from "./ManagerReviewStep";
import { ErrorState } from "./ErrorState";
import { SuccessState } from "./SuccessState";

type WizardStep = 1 | 2 | 3 | 4 | 5 | "success" | "error";

interface ManagerFormData {
  name: string;
  role: string;
  avatar: string;
  description: string;
  instructions: string;
  model: string;
  subAgentIds: string[];
  toolIds?: string[];
  workflowBindings?: WorkflowBinding[];
  connectionToolBindings?: ConnectionToolBinding[];
}

interface ManagerWizardProps {
  onComplete: (data: ManagerFormData) => Promise<void>;
  onCancel: () => void;
}

export function ManagerWizard({ onComplete, onCancel }: ManagerWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ManagerFormData>({
    name: "",
    role: "Manager",
    avatar: "👔",
    description: "",
    instructions: "",
    model: "google/gemini-2.5-flash",
    subAgentIds: [],
    toolIds: [],
    workflowBindings: [],
    connectionToolBindings: [],
  });

  const handleNext = () => {
    setError(null);
    
    // Validation
    if (step === 1) {
      if (!formData.name.trim() || !formData.role.trim()) {
        setError("Name and role are required");
        return;
      }
    } else if (step === 2) {
      if (!formData.instructions.trim()) {
        setError("Delegation instructions are required");
        return;
      }
    } else if (step === 3) {
      if (formData.subAgentIds.length === 0) {
        setError("Select at least one agent for the team");
        return;
      }
    }
    
    if (step === 5) {
      handleSubmit();
    } else {
      setStep((step + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onComplete(formData);
      setStep("success");
    } catch (err) {
      setError(err.message || "Failed to create manager");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: Partial<ManagerFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  if (step === "success") {
    return <SuccessState onClose={onCancel} message="Manager created successfully!" />;
  }

  if (step === "error") {
    return (
      <ErrorState
        error={error || "An error occurred"}
        onRetry={() => setStep(5)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <span>Step {step} of 5</span>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <ManagerIdentityStep
            data={formData}
            onChange={updateFormData}
            error={error}
          />
        )}
        {step === 2 && (
          <ManagerInstructionsStep
            data={formData}
            onChange={updateFormData}
            error={error}
          />
        )}
        {step === 3 && (
          <TeamSelectionStep
            data={formData}
            onChange={updateFormData}
            error={error}
          />
        )}
        {step === 4 && (
          <ManagerCapabilitiesStep
            data={formData}
            onChange={updateFormData}
          />
        )}
        {step === 5 && (
          <ManagerReviewStep data={formData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        <div className="flex gap-2">
          {step < 5 && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleNext} disabled={isLoading}>
            {step === 5 ? "Create Manager" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### `app/(pages)/workforce/components/wizard/TeamSelectionStep.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AgentConfig } from "@/_tables/types";
import type { ManagerFormData } from "./ManagerWizard";

interface TeamSelectionStepProps {
  data: ManagerFormData;
  onChange: (updates: Partial<ManagerFormData>) => void;
  error?: string | null;
}

export function TeamSelectionStep({
  data,
  onChange,
  error,
}: TeamSelectionStepProps) {
  const [availableAgents, setAvailableAgents] = useState<AgentConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workforce")
      .then((res) => res.json())
      .then((result) => {
        setAvailableAgents(result.agents || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filteredAgents = availableAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAgent = (agentId: string) => {
    const newSubAgentIds = data.subAgentIds.includes(agentId)
      ? data.subAgentIds.filter((id) => id !== agentId)
      : [...data.subAgentIds, agentId];
    onChange({ subAgentIds: newSubAgentIds });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Team Members</h3>
        <p className="text-sm text-muted-foreground">
          Choose which agents this manager can delegate tasks to.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">
            {data.subAgentIds.length} agent{data.subAgentIds.length !== 1 ? "s" : ""} selected
          </span>
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading agents...
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredAgents.map((agent) => {
              const isSelected = data.subAgentIds.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleAgent(agent.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                  <Avatar>
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>{agent.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.role}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {agent.description}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 2).map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Wizard dialog opens | Click "Create Manager", wizard appears |
| Step 1 validates | Cannot proceed without name and role |
| Step 2 validates | Cannot proceed without instructions |
| Step 3 validates | Cannot proceed without selecting at least one agent |
| Team selection works | Can search, select, and deselect agents |
| Step indicator shows | Progress indicator displays current step |
| Form data persists | Data maintained when navigating between steps |
| Review step shows summary | Final step displays all configured values |
| Manager created | Submit creates manager via API and updates store |
| Success state shows | Success message appears after creation |
| Error handling works | Errors displayed appropriately at each step |

### Testing Strategy
- Component tests for each wizard step
- E2E test for complete wizard flow
- Integration test with API creation endpoint
- Form validation tests
- Search/filter tests for team selection

---

## Phase 5: Manager Modal Foundation & Team Tab

### Goal
Create the manager modal structure following the agent modal pattern, with basic tabs (Overview, Team) and the Team management interface. Establish the store architecture for manager modal state.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/manager-modal/ManagerModal.tsx` | Create | Main modal wrapper (mirrors AgentModal.tsx) |
| `app/(pages)/workforce/components/manager-modal/components/ManagerHeader.tsx` | Create | Header with tab navigation |
| `app/(pages)/workforce/components/manager-modal/store/index.ts` | Create | Manager modal store |
| `app/(pages)/workforce/components/manager-modal/store/types.ts` | Create | Type definitions |
| `app/(pages)/workforce/components/manager-modal/store/slices/managerDetailsSlice.ts` | Create | Manager details state |
| `app/(pages)/workforce/components/manager-modal/store/slices/uiSlice.ts` | Create | UI state (tabs, selections) |
| `app/(pages)/workforce/components/manager-modal/components/tabs/OverviewTab.tsx` | Create | Basic overview tab |
| `app/(pages)/workforce/components/manager-modal/components/tabs/TeamTab.tsx` | Create | Team management tab |
| `app/(pages)/workforce/components/manager-modal/components/tabs/TeamTab/components/TeamMemberCard.tsx` | Create | Individual team member card |
| `app/(pages)/workforce/components/manager-modal/components/tabs/TeamTab/components/AddTeamMemberButton.tsx` | Create | Add agent to team button |
| `app/(pages)/workforce/components/manager-modal/index.tsx` | Create | Public export |

### Pseudocode

#### `app/(pages)/workforce/components/manager-modal/ManagerModal.tsx`
```tsx
"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ManagerConfig } from "@/_tables/types";
import { useManagerModalStore } from "./store";
import { ManagerHeader } from "./components/ManagerHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { TeamTab } from "./components/tabs/TeamTab";

export type ManagerTabId = "overview" | "team" | "chat" | "capabilities" | "config" | "delegations";

export type ManagerModalProps = {
  manager: ManagerConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManagerUpdated?: () => void;
};

export function ManagerModal({
  manager,
  open,
  onOpenChange,
  onManagerUpdated,
}: ManagerModalProps) {
  const activeTab = useManagerModalStore((state) => state.activeTab);
  const setActiveTab = useManagerModalStore((state) => state.setActiveTab);
  const setManager = useManagerModalStore((state) => state.setManager);
  const resetState = useManagerModalStore((state) => state.resetState);

  useEffect(() => {
    setManager(manager);
    if (!open) {
      resetState();
    }
  }, [manager, open, setManager, resetState]);

  if (!manager) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab manager={manager} onTabChange={setActiveTab} />;
      case "team":
        return <TeamTab manager={manager} />;
      case "chat":
        return <div className="p-8 text-center text-muted-foreground">Chat tab coming in Phase 6...</div>;
      case "capabilities":
        return <div className="p-8 text-center text-muted-foreground">Capabilities tab coming in Phase 8...</div>;
      case "config":
        return <div className="p-8 text-center text-muted-foreground">Config tab coming in Phase 8...</div>;
      case "delegations":
        return <div className="p-8 text-center text-muted-foreground">Delegations tab coming in Phase 7...</div>;
      default:
        return <div className="p-8 text-center text-muted-foreground">Content for {activeTab} coming soon...</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[1400px] h-[85vh] sm:max-w-[1400px] bg-white p-0 gap-0 overflow-hidden rounded-2xl flex flex-col border-none shadow-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Manager Dashboard: {manager.name}
        </DialogTitle>

        <ManagerHeader
          manager={manager}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => onOpenChange(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### `app/(pages)/workforce/components/manager-modal/store/index.ts`
```typescript
import { create } from "zustand";
import {
  createManagerDetailsSlice,
  type ManagerDetailsSlice,
} from "./slices/managerDetailsSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";

type ManagerModalStore = ManagerDetailsSlice & UiSlice;

export const useManagerModalStore = create<ManagerModalStore>((...a) => ({
  ...createManagerDetailsSlice(...a),
  ...createUiSlice(...a),
}));
```

#### `app/(pages)/workforce/components/manager-modal/store/slices/uiSlice.ts`
```typescript
import type { StateCreator } from "zustand";
import type { ManagerTabId } from "../../ManagerModal";
import type { ManagerModalStore } from "../types";

export interface UiSliceState {
  activeTab: ManagerTabId;
}

export interface UiSliceActions {
  setActiveTab: (tab: ManagerTabId) => void;
  resetState: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

const initialState: UiSliceState = {
  activeTab: "overview",
};

export const createUiSlice: StateCreator<
  ManagerModalStore,
  [],
  [],
  UiSlice
> = (set) => ({
  ...initialState,

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  resetState: () => {
    set({ activeTab: "overview" });
  },
});
```

#### `app/(pages)/workforce/components/manager-modal/components/tabs/TeamTab.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ManagerConfig } from "@/_tables/types";
import { TeamMemberCard } from "./TeamTab/components/TeamMemberCard";
import { AddTeamMemberButton } from "./TeamTab/components/AddTeamMemberButton";

interface TeamTabProps {
  manager: ManagerConfig;
}

interface SubAgentInfo {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
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
}

export function TeamTab({ manager }: TeamTabProps) {
  const [team, setTeam] = useState<SubAgentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamMetrics, setTeamMetrics] = useState({
    totalCapabilities: 0,
    coverageAreas: [] as string[],
    teamSuccessRate: 0,
  });

  useEffect(() => {
    const fetchTeam = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/workforce/managers/${manager.id}/team`
        );
        if (!response.ok) throw new Error("Failed to fetch team");
        const data = await response.json();
        setTeam(data.team || []);
        setTeamMetrics(data.teamMetrics || teamMetrics);
      } catch (error) {
        console.error("Failed to fetch team:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [manager.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading team...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Team Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Team Overview</h3>
              <p className="text-sm text-muted-foreground">
                {team.length} specialized agent{team.length !== 1 ? "s" : ""} working together
              </p>
            </div>
            <AddTeamMemberButton managerId={manager.id} />
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {teamMetrics.totalCapabilities}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Capabilities
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {teamMetrics.teamSuccessRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {team.length}
              </div>
              <div className="text-xs text-muted-foreground">Team Size</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {teamMetrics.coverageAreas.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Coverage Areas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div className="space-y-4">
        <h3 className="font-semibold">Team Members</h3>
        {team.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No agents in team yet. Add agents to enable delegation.
              </p>
              <AddTeamMemberButton managerId={manager.id} />
            </CardContent>
          </Card>
        ) : (
          team.map((agent) => (
            <TeamMemberCard key={agent.id} agent={agent} managerId={manager.id} />
          ))
        )}
      </div>
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Manager modal opens | Click manager card, modal appears |
| Modal structure matches agent modal | Same layout, header, tab structure |
| Overview tab renders | Basic manager info displayed |
| Team tab loads team data | API call fetches team members |
| Team member cards display | Cards show agent info, capabilities, metrics |
| Team stats calculate | Overview stats displayed correctly |
| Add team member button present | Button appears in team tab |
| Empty team state shows | Message when no team members |
| Store architecture follows pattern | Zustand slices match agent modal structure |
| Tab navigation works | Can switch between tabs |
| Modal closes correctly | Close button and outside click work |

### Testing Strategy
- Component tests for ManagerModal and tabs
- Store tests for manager modal slices
- Integration test for team data fetching
- E2E test for opening manager modal and viewing team

---

## Phase 6: Network Chat Tab with Basic Delegation

### Goal
Implement the network chat interface with SSE event streaming, basic delegation event display, and message handling. Follow the ChatTab pattern from agent modal with network-specific extensions.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/index.tsx` | Create | Main network chat tab |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/NetworkChatArea.tsx` | Create | Chat messages area with delegation events |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/DelegationIndicator.tsx` | Create | Delegation event card component |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/ChatInput.tsx` | Create | Message input component |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/MessageBubble.tsx` | Create | Individual message bubble |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/hooks/useNetworkChat.tsx` | Create | SSE stream handling hook |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/hooks/useDelegationEvents.tsx` | Create | Delegation event state management |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/types.ts` | Create | Type definitions for chat and events |

### Pseudocode

#### `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/index.tsx`
```tsx
"use client";

import { NetworkChatArea } from "./components/NetworkChatArea";
import { ChatInput } from "./components/ChatInput";
import { useNetworkChat } from "./hooks/useNetworkChat";
import { useDelegationEvents } from "./hooks/useDelegationEvents";
import type { ManagerConfig } from "@/_tables/types";

interface NetworkChatTabProps {
  manager: ManagerConfig;
}

export function NetworkChatTab({ manager }: NetworkChatTabProps) {
  const {
    messages,
    sendMessage,
    isStreaming,
    isLoading,
  } = useNetworkChat(manager.id);

  const {
    delegations,
    handleDelegationEvent,
    clearDelegations,
  } = useDelegationEvents();

  const handleSend = async (content: string) => {
    clearDelegations();
    await sendMessage(content, (event) => {
      if (event.type.startsWith("delegation") || event.type.startsWith("agent-execution")) {
        handleDelegationEvent(event);
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <NetworkChatArea
        messages={messages}
        delegations={delegations}
        isStreaming={isStreaming}
        managerName={manager.name}
        managerAvatar={manager.avatar}
      />
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming || isLoading}
        placeholder={`Message ${manager.name}...`}
      />
    </div>
  );
}
```

#### `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/hooks/useNetworkChat.tsx`
```tsx
import { useState, useCallback, useRef } from "react";

export interface NetworkMessage {
  id: string;
  role: "user" | "manager" | "system";
  content: string;
  timestamp: Date;
}

export interface NetworkEvent {
  type: string;
  data: unknown;
  timestamp: Date;
}

export function useNetworkChat(managerId: string) {
  const [messages, setMessages] = useState<NetworkMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      onEvent?: (event: NetworkEvent) => void
    ) => {
      // Add user message
      const userMessage: NetworkMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `/api/workforce/managers/${managerId}/network`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: content,
              threadId: `thread-${managerId}`,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) throw new Error("Network request failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let buffer = "";
        let managerResponseId = crypto.randomUUID();
        let managerContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: NetworkEvent = JSON.parse(line.slice(6));
                onEvent?.(event);

                // Handle manager response content
                if (event.type === "text-delta" || event.type === "text") {
                  managerContent += String(event.data);
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === managerResponseId);
                    if (existing) {
                      return prev.map((m) =>
                        m.id === managerResponseId
                          ? { ...m, content: managerContent }
                          : m
                      );
                    }
                    return [
                      ...prev,
                      {
                        id: managerResponseId,
                        role: "manager",
                        content: managerContent,
                        timestamp: new Date(),
                      },
                    ];
                  });
                }
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Network chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "Failed to send message. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [managerId]
  );

  return {
    messages,
    sendMessage,
    isStreaming,
    isLoading,
  };
}
```

#### `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/DelegationIndicator.tsx`
```tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { DelegationState } from "../types";

interface DelegationIndicatorProps {
  delegation: DelegationState;
  expanded?: boolean;
  onToggle?: () => void;
}

export function DelegationIndicator({
  delegation,
  expanded = false,
  onToggle,
}: DelegationIndicatorProps) {
  const statusColors = {
    routing: "bg-purple-50 border-purple-200",
    delegating: "bg-blue-50 border-blue-200",
    executing: "bg-green-50 border-green-200",
    complete: "bg-emerald-50 border-emerald-200",
    failed: "bg-red-50 border-red-200",
  };

  const statusLabels = {
    routing: "Routing...",
    delegating: "Delegating...",
    executing: "Executing...",
    complete: "Complete",
    failed: "Failed",
  };

  const isActive = delegation.status === "routing" ||
    delegation.status === "delegating" ||
    delegation.status === "executing";

  return (
    <Card
      className={`${statusColors[delegation.status]} border animate-slide-up cursor-pointer transition-all`}
      onClick={onToggle}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={delegation.agentAvatar} />
            <AvatarFallback>{delegation.agentName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {isActive ? "Delegating to" : "Delegated to"} {delegation.agentName}
              </span>
              {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            {delegation.task && (
              <p className="text-xs text-muted-foreground mb-2">
                {delegation.task}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${
                  delegation.status === "complete"
                    ? "border-green-500 text-green-700"
                    : delegation.status === "failed"
                    ? "border-red-500 text-red-700"
                    : ""
                }`}
              >
                {statusLabels[delegation.status]}
              </Badge>
              {delegation.reason && (
                <span className="text-xs text-muted-foreground">
                  {delegation.reason}
                </span>
              )}
            </div>
          </div>
          {onToggle && (
            <div className="text-muted-foreground">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          )}
        </div>

        {expanded && delegation.result && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs font-medium mb-1">Result:</div>
            <div className="text-sm text-muted-foreground">
              {typeof delegation.result === "string"
                ? delegation.result
                : JSON.stringify(delegation.result, null, 2)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Network chat tab renders | Open manager modal, click Chat tab |
| Chat input sends messages | Type message, press send |
| SSE stream connects | Network request initiated on message send |
| Messages display | User and manager messages appear in chat |
| Delegation events parse | SSE events parsed correctly |
| Delegation indicators show | "Delegating to..." cards appear |
| Delegation status updates | Status changes from routing → delegating → executing → complete |
| Streaming state works | Loading indicators show during stream |
| Error handling works | Errors displayed if stream fails |
| Manager responses accumulate | Text deltas combine into full message |

### Testing Strategy
- Component tests for chat components
- Hook tests for useNetworkChat and useDelegationEvents
- SSE parsing tests
- Integration test with mock SSE stream
- E2E test for sending message and seeing delegation

---

## Phase 7: Delegation Observability & History

### Goal
Enhance delegation visibility with expandable details, full sub-agent conversation views, delegation history tab, and advanced event visualization including parallel delegations.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/ExpandedDelegationView.tsx` | Create | Full delegation details view |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/SubAgentConversation.tsx` | Create | Full sub-agent chat conversation |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/DelegationTimeline.tsx` | Create | Timeline visualization of delegation |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/components/ParallelDelegationsView.tsx` | Create | Multi-agent coordination display |
| `app/(pages)/workforce/components/manager-modal/components/tabs/DelegationHistoryTab.tsx` | Create | Historical delegations tab |
| `app/(pages)/workforce/components/manager-modal/components/tabs/DelegationHistoryTab/components/DelegationHistoryList.tsx` | Create | List of past delegations |
| `app/(pages)/workforce/components/manager-modal/components/tabs/DelegationHistoryTab/components/DelegationDetailModal.tsx` | Create | Detailed delegation view modal |
| `app/(pages)/workforce/components/manager-modal/components/shared/StatusIndicators.tsx` | Create | Manager status indicator components |
| `app/(pages)/workforce/components/manager-modal/components/tabs/NetworkChatTab/hooks/useDelegationHistory.tsx` | Create | Fetch delegation history |

### Pseudocode

#### `app/(pages)/workforce/components/manager-modal/components/tabs/DelegationHistoryTab.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { DelegationHistoryList } from "./DelegationHistoryTab/components/DelegationHistoryList";
import { useDelegationHistory } from "./DelegationHistoryTab/hooks/useDelegationHistory";
import type { ManagerConfig } from "@/_tables/types";

interface DelegationHistoryTabProps {
  manager: ManagerConfig;
}

export function DelegationHistoryTab({ manager }: DelegationHistoryTabProps) {
  const {
    delegations,
    isLoading,
    loadMore,
    hasMore,
    filters,
    setFilters,
  } = useDelegationHistory(manager.id);

  return (
    <div className="p-6 h-full overflow-y-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Delegation History</h3>
        {/* Filter controls */}
      </div>

      <DelegationHistoryList
        delegations={delegations}
        isLoading={isLoading}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Delegation expands | Click delegation indicator, details expand |
| Sub-agent conversation visible | Full conversation shown in expanded view |
| Delegation timeline renders | Timeline shows routing → execution → completion |
| Parallel delegations display | Multiple agents shown simultaneously |
| History tab loads | Navigate to Delegations tab, history loads |
| History filters work | Filter by status, agent, date range |
| Delegation detail modal opens | Click delegation, detail view appears |
| History pagination works | Load more button fetches next page |
| Status indicators show | Manager status (coordinating, routing) displayed |
| Metrics calculate | Success rate, avg duration displayed |

### Testing Strategy
- Component tests for all observability components
- Integration test for delegation history API
- E2E test for expanding delegation and viewing history
- Performance test for large delegation lists

---

## Phase 8: Manager Configuration & Advanced Features

### Goal
Implement manager-specific configuration tab, delegation strategy editor, team management within modal, and polish remaining features. Complete the manager feature set.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/manager-modal/components/tabs/ConfigTab.tsx` | Create | Manager configuration tab |
| `app/(pages)/workforce/components/manager-modal/components/tabs/ConfigTab/components/DelegationStrategyEditor.tsx` | Create | Edit delegation instructions |
| `app/(pages)/workforce/components/manager-modal/components/tabs/ConfigTab/components/TeamManagement.tsx` | Create | Add/remove team members from config |
| `app/(pages)/workforce/components/manager-modal/components/tabs/ConfigTab/components/ManagerCapabilitiesEditor.tsx` | Create | Edit manager's direct tools/workflows |
| `app/(pages)/workforce/components/manager-modal/components/tabs/CapabilitiesTab.tsx` | Create | Capabilities tab (tools/workflows manager can use) |

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Config tab opens | Navigate to Config tab in manager modal |
| Delegation instructions editable | Can edit and save instructions |
| Team management works | Add/remove agents from team in config |
| Capabilities editor works | Assign tools/workflows to manager |
| Changes persist | Updates saved via API |
| Validation works | Invalid configurations rejected |

### Testing Strategy
- Component tests for config tab
- Integration test for manager updates
- E2E test for editing and saving config

---

## Implementation Order

1. **Phase 1** (Days 1-2): Backend infrastructure
   - Critical path: Manager type and storage
   - Enables: Basic CRUD operations

2. **Phase 2** (Days 3-4): Network execution
   - Critical path: Mastra integration
   - Enables: Core delegation functionality

3. **Phase 3** (Days 5-6): Manager Store Architecture & Workforce Integration
   - Critical path: State management foundation
   - Enables: Manager display and selection

4. **Phase 4** (Days 7-8): Manager Creation Wizard
   - Critical path: Manager creation flow
   - Enables: Users can create managers

5. **Phase 5** (Days 9-10): Manager Modal Foundation & Team Tab
   - Critical path: Manager interaction interface
   - Enables: View and manage teams

6. **Phase 6** (Days 11-13): Network Chat Tab with Basic Delegation
   - Critical path: Network chat functionality
   - Enables: Users can chat with managers

7. **Phase 7** (Days 14-16): Delegation Observability & History
   - Critical path: Visibility and transparency
   - Enables: Users see delegation details

8. **Phase 8** (Days 17-18): Manager Configuration & Advanced Features
   - Critical path: Configuration and polish
   - Enables: Complete manager management

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