# Phases: Workflow Observability

**Task:** `01A-Workflow-Observability-Task.md`  
**Status:** Not Started  
**Last Updated:** 2025-12-11

---

## Phase 1: Backend Streaming Infrastructure

### Goal
Implement Mastra streaming API integration and SSE endpoint for real-time workflow events.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/api/tools/services/workflow-tools.ts` | ~100 | Refactor to use `run.stream()` instead of `run.start()` |
| `app/api/workforce/[agentId]/chat/workflows/[runId]/stream/route.ts` | ~80 | Create SSE endpoint for workflow events |
| `app/api/workforce/[agentId]/chat/services/workflow-stream-service.ts` | ~150 | Create stream management service |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | ~30 | Track workflow runIds in chat messages |
| `app/api/workflows/services/workflow-run-tracker.ts` | ~100 | Create run tracking service |

### Implementation

#### 1. Update workflow execution to use streaming

```typescript
// app/api/tools/services/workflow-tools.ts
export function getWorkflowToolExecutable(userId: string, binding: WorkflowBinding) {
  return tool({
    description: binding.description,
    parameters: binding.inputSchema,
    execute: async (input: any) => {
      // Create workflow run
      const run = await workflow.createRunAsync({ resourceId: userId });
      
      // Start streaming instead of waiting
      const result = await run.stream({ inputData: input, runtimeContext });
      
      // Register stream for SSE access
      WorkflowStreamService.getInstance().registerRun(run.id, result.fullStream);
      
      // Iterate stream and emit to SSE clients
      let finalResult;
      for await (const chunk of result.fullStream) {
        WorkflowStreamService.getInstance().emitEvent(run.id, {
          type: chunk.type,
          stepId: chunk.stepId,
          data: chunk.data,
          status: chunk.status,
          timestamp: new Date().toISOString()
        });
        
        if (chunk.type === 'workflow-complete') {
          finalResult = chunk.data;
        }
      }
      
      // Return result to agent (backward compatibility)
      return finalResult;
    }
  });
}
```

#### 2. Create SSE streaming endpoint

```typescript
// app/api/workforce/[agentId]/chat/workflows/[runId]/stream/route.ts
import { WorkflowStreamService } from '../../services/workflow-stream-service';

export async function GET(
  request: Request,
  { params }: { params: { agentId: string; runId: string } }
) {
  const { agentId, runId } = params;
  
  // Verify user access to this workflow run
  const user = await getCurrentUser();
  if (!user || !await canAccessWorkflowRun(user.id, runId)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const streamService = WorkflowStreamService.getInstance();
      
      // Register connection
      const connectionId = streamService.registerConnection(runId, (event) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      });
      
      // Send connection confirmation
      const confirmData = `data: ${JSON.stringify({
        type: 'connection',
        runId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(confirmData));
      
      // Handle cleanup on close
      request.signal.addEventListener('abort', () => {
        streamService.unregisterConnection(runId, connectionId);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

#### 3. Create workflow stream service

```typescript
// app/api/workforce/[agentId]/chat/services/workflow-stream-service.ts
interface WorkflowEvent {
  type: 'step-start' | 'step-complete' | 'step-error' | 'workflow-complete';
  stepId?: string;
  data?: any;
  status?: 'running' | 'success' | 'failed';
  timestamp: string;
}

interface SSEConnection {
  id: string;
  emit: (event: WorkflowEvent) => void;
}

export class WorkflowStreamService {
  private static instance: WorkflowStreamService;
  private activeStreams = new Map<string, SSEConnection[]>();
  private activeRuns = new Map<string, AsyncIterable<any>>();
  
  static getInstance() {
    if (!WorkflowStreamService.instance) {
      WorkflowStreamService.instance = new WorkflowStreamService();
    }
    return WorkflowStreamService.instance;
  }
  
  registerRun(runId: string, stream: AsyncIterable<any>) {
    this.activeRuns.set(runId, stream);
  }
  
  registerConnection(runId: string, emit: (event: WorkflowEvent) => void): string {
    const connectionId = crypto.randomUUID();
    const connection: SSEConnection = { id: connectionId, emit };
    
    if (!this.activeStreams.has(runId)) {
      this.activeStreams.set(runId, []);
    }
    this.activeStreams.get(runId)!.push(connection);
    
    return connectionId;
  }
  
  emitEvent(runId: string, event: WorkflowEvent) {
    const connections = this.activeStreams.get(runId) || [];
    connections.forEach(conn => conn.emit(event));
  }
  
  unregisterConnection(runId: string, connectionId: string) {
    const connections = this.activeStreams.get(runId) || [];
    const filtered = connections.filter(conn => conn.id !== connectionId);
    
    if (filtered.length === 0) {
      this.activeStreams.delete(runId);
    } else {
      this.activeStreams.set(runId, filtered);
    }
  }
  
  getActiveRuns(userId: string, agentId: string): string[] {
    // Return runIds for active workflows for this user/agent
    return Array.from(this.activeRuns.keys()).filter(runId => 
      // Filter by user access rights
      this.canUserAccessRun(userId, runId)
    );
  }
}
```

### Testing

```bash
# Test streaming API refactor
npm run test -- --grep "workflow-tools streaming"

# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3000/api/workforce/agent-123/chat/workflows/run-456/stream"

# Test concurrent connections
# Open multiple browser tabs with SSE connections to same runId
```

### Success Metrics

- [ ] Workflow execution uses `run.stream()` instead of `run.start()`
- [ ] SSE endpoint accepts connections and emits events
- [ ] Multiple clients can connect to same workflow run
- [ ] Stream cleanup occurs on client disconnect
- [ ] No memory leaks in stream service after disconnections
- [ ] Agent still receives final workflow result (backward compatibility)

---

## Phase 2: Frontend State Management

### Goal
Create Zustand slice for workflow observability state and hook for SSE connection management.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/slices/workflowObservabilitySlice.ts` | ~200 | Create workflow state slice |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/index.ts` | ~10 | Export new slice |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts` | ~100 | Create SSE connection hook |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/types.ts` | ~50 | Add workflow state types |

### Implementation

#### 1. Create workflow state types

```typescript
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/types.ts
export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowRunState {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed';
  steps: WorkflowStep[];
  startTime: string;
  endTime?: string;
  result?: any;
  expanded: boolean;
}

export interface WorkflowObservabilityState {
  activeWorkflows: Map<string, WorkflowRunState>;
  panelOpen: boolean;
  selectedRunId: string | null;
}
```

#### 2. Create Zustand slice

```typescript
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/slices/workflowObservabilitySlice.ts
import { StateCreator } from 'zustand';
import { WorkflowObservabilityState, WorkflowRunState, WorkflowStep } from '../../types';

export interface WorkflowObservabilitySlice {
  workflowObservability: WorkflowObservabilityState;
  addWorkflow: (runId: string, name: string, steps: string[]) => void;
  updateWorkflowStep: (runId: string, stepId: string, update: Partial<WorkflowStep>) => void;
  setWorkflowStatus: (runId: string, status: 'success' | 'failed', result?: any) => void;
  removeWorkflow: (runId: string) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  selectWorkflow: (runId: string | null) => void;
  toggleWorkflowExpansion: (runId: string) => void;
  getActiveWorkflows: () => WorkflowRunState[];
  getWorkflow: (runId: string) => WorkflowRunState | undefined;
}

export const createWorkflowObservabilitySlice: StateCreator<
  WorkflowObservabilitySlice,
  [],
  [],
  WorkflowObservabilitySlice
> = (set, get) => ({
  workflowObservability: {
    activeWorkflows: new Map(),
    panelOpen: false,
    selectedRunId: null,
  },
  
  addWorkflow: (runId, name, stepIds) => set(state => {
    const steps = stepIds.map(id => ({
      id,
      name: id,
      status: 'pending' as const,
    }));
    
    const workflow: WorkflowRunState = {
      id: runId,
      name,
      status: 'running',
      steps,
      startTime: new Date().toISOString(),
      expanded: true,
    };
    
    const newWorkflows = new Map(state.workflowObservability.activeWorkflows);
    newWorkflows.set(runId, workflow);
    
    return {
      workflowObservability: {
        ...state.workflowObservability,
        activeWorkflows: newWorkflows,
        panelOpen: true, // Auto-open panel when workflow starts
      }
    };
  }),
  
  updateWorkflowStep: (runId, stepId, update) => set(state => {
    const workflow = state.workflowObservability.activeWorkflows.get(runId);
    if (!workflow) return state;
    
    const updatedSteps = workflow.steps.map(step => 
      step.id === stepId ? { ...step, ...update } : step
    );
    
    const updatedWorkflow = { ...workflow, steps: updatedSteps };
    const newWorkflows = new Map(state.workflowObservability.activeWorkflows);
    newWorkflows.set(runId, updatedWorkflow);
    
    return {
      workflowObservability: {
        ...state.workflowObservability,
        activeWorkflows: newWorkflows,
      }
    };
  }),
  
  setWorkflowStatus: (runId, status, result) => set(state => {
    const workflow = state.workflowObservability.activeWorkflows.get(runId);
    if (!workflow) return state;
    
    const updatedWorkflow = {
      ...workflow,
      status,
      result,
      endTime: new Date().toISOString(),
    };
    
    const newWorkflows = new Map(state.workflowObservability.activeWorkflows);
    newWorkflows.set(runId, updatedWorkflow);
    
    return {
      workflowObservability: {
        ...state.workflowObservability,
        activeWorkflows: newWorkflows,
      }
    };
  }),
  
  // Additional actions...
  togglePanel: () => set(state => ({
    workflowObservability: {
      ...state.workflowObservability,
      panelOpen: !state.workflowObservability.panelOpen,
    }
  })),
  
  getActiveWorkflows: () => {
    const { activeWorkflows } = get().workflowObservability;
    return Array.from(activeWorkflows.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },
  
  getWorkflow: (runId) => {
    return get().workflowObservability.activeWorkflows.get(runId);
  },
});
```

#### 3. Create SSE connection hook

```typescript
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts
import { useEffect, useCallback } from 'react';
import { useStore } from '../store';

interface UseWorkflowStreamOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useWorkflowStream(
  runId: string | null,
  agentId: string,
  options: UseWorkflowStreamOptions = {}
) {
  const { enabled = true, onError } = options;
  
  const {
    addWorkflow,
    updateWorkflowStep,
    setWorkflowStatus,
  } = useStore();
  
  const connectToStream = useCallback(() => {
    if (!runId || !enabled) return null;
    
    const url = `/api/workforce/${agentId}/chat/workflows/${runId}/stream`;
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log('Workflow stream connected:', runId);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connection':
            // Stream connected successfully
            break;
            
          case 'workflow-start':
            addWorkflow(runId, data.workflowName, data.stepIds);
            break;
            
          case 'step-start':
            updateWorkflowStep(runId, data.stepId, {
              status: 'running',
              startTime: data.timestamp,
            });
            break;
            
          case 'step-complete':
            updateWorkflowStep(runId, data.stepId, {
              status: 'success',
              output: data.data,
              endTime: data.timestamp,
            });
            break;
            
          case 'step-error':
            updateWorkflowStep(runId, data.stepId, {
              status: 'failed',
              error: data.error || data.data,
              endTime: data.timestamp,
            });
            break;
            
          case 'workflow-complete':
            setWorkflowStatus(runId, 'success', data.data);
            break;
            
          case 'workflow-error':
            setWorkflowStatus(runId, 'failed');
            break;
        }
      } catch (error) {
        console.error('Error parsing workflow stream event:', error);
        onError?.(error as Error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Workflow stream error:', error);
      onError?.(new Error('Stream connection failed'));
    };
    
    return eventSource;
  }, [runId, agentId, enabled, addWorkflow, updateWorkflowStep, setWorkflowStatus, onError]);
  
  useEffect(() => {
    const eventSource = connectToStream();
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [connectToStream]);
  
  return {
    isConnected: !!runId && enabled,
  };
}
```

### Testing

```bash
# Test Zustand slice
npm run test -- --grep "workflowObservabilitySlice"

# Test SSE hook
npm run test -- --grep "useWorkflowStream"

# Test state updates
npm run test -- --grep "workflow state management"
```

### Success Metrics

- [ ] Workflow state slice manages workflow and step states correctly
- [ ] SSE hook connects to stream and updates store based on events
- [ ] Multiple workflows can be tracked simultaneously in state
- [ ] Panel state persists across component re-renders
- [ ] Error handling works for connection failures
- [ ] Cleanup occurs when components unmount

---

## Phase 3: Observability UI Components

### Goal
Build the observability panel UI with workflow cards, step details, and split view integration.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx` | ~150 | Create main panel component |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowCard.tsx` | ~100 | Create workflow card component |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowStep.tsx` | ~120 | Create step component |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/index.tsx` | ~50 | Add split view layout |

### Implementation

#### 1. Create main observability panel

```tsx
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useStore } from "../store";
import { WorkflowCard } from "./WorkflowCard";

export function WorkflowObservabilityPanel() {
  const {
    workflowObservability: { panelOpen },
    getActiveWorkflows,
    closePanel,
  } = useStore();
  
  const activeWorkflows = getActiveWorkflows();
  
  if (!panelOpen) return null;
  
  return (
    <div className="h-full border-l border-border bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Active Workflows</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={closePanel}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {activeWorkflows.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="mb-2">🔍</div>
              <p className="text-sm">No active workflows</p>
              <p className="text-xs text-muted-foreground mt-1">
                Workflows will appear here when running
              </p>
            </div>
          ) : (
            activeWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 2. Create workflow card component

```tsx
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Play, CheckCircle, XCircle } from "lucide-react";
import { WorkflowRunState } from "../types";
import { useStore } from "../store";
import { WorkflowStep } from "./WorkflowStep";

interface WorkflowCardProps {
  workflow: WorkflowRunState;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const { toggleWorkflowExpansion } = useStore();
  
  const getStatusConfig = (status: WorkflowRunState['status']) => {
    switch (status) {
      case 'running':
        return { icon: Play, color: 'bg-blue-100 text-blue-700', label: 'Running' };
      case 'success':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Success' };
      case 'failed':
        return { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Failed' };
    }
  };
  
  const statusConfig = getStatusConfig(workflow.status);
  const StatusIcon = statusConfig.icon;
  
  const completedSteps = workflow.steps.filter(step => 
    step.status === 'success' || step.status === 'failed'
  ).length;
  
  const totalSteps = workflow.steps.length;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            {workflow.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleWorkflowExpansion(workflow.id)}
              className="h-6 w-6 p-0"
            >
              {workflow.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="text-xs text-muted-foreground">
          {completedSteps}/{totalSteps} steps completed
        </div>
      </CardHeader>
      
      {workflow.expanded && (
        <CardContent className="pt-0">
          {/* Steps list */}
          <div className="space-y-2">
            {workflow.steps.map((step) => (
              <WorkflowStep key={step.id} step={step} />
            ))}
          </div>
          
          {/* Final result */}
          {workflow.status === 'success' && workflow.result && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-1">Final Result</div>
              <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-hidden">
                {typeof workflow.result === 'string' 
                  ? workflow.result 
                  : JSON.stringify(workflow.result, null, 2)
                }
              </pre>
            </div>
          )}
          
          {/* Execution time */}
          {workflow.endTime && (
            <div className="mt-2 text-xs text-muted-foreground">
              Completed in {formatDuration(workflow.startTime, workflow.endTime)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function formatDuration(start: string, end: string): string {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
}
```

#### 3. Create step component

```tsx
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowStep.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { WorkflowStep as WorkflowStepType } from "../types";

interface WorkflowStepProps {
  step: WorkflowStepType;
}

export function WorkflowStep({ step }: WorkflowStepProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusConfig = (status: WorkflowStepType['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'bg-gray-100 text-gray-600', label: 'Pending' };
      case 'running':
        return { icon: Loader2, color: 'bg-blue-100 text-blue-700', label: 'Running', animate: true };
      case 'success':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Success' };
      case 'failed':
        return { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Failed' };
    }
  };
  
  const statusConfig = getStatusConfig(step.status);
  const StatusIcon = statusConfig.icon;
  const hasDetails = step.input || step.output || step.error;
  
  return (
    <div className="border border-border rounded-md">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <StatusIcon 
            className={`h-4 w-4 flex-shrink-0 ${statusConfig.animate ? 'animate-spin' : ''}`}
          />
          <span className="text-sm font-medium truncate">{step.name}</span>
          <Badge variant="secondary" className={`${statusConfig.color} text-xs`}>
            {statusConfig.label}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {step.endTime && (
            <span className="text-xs text-muted-foreground">
              {new Date(step.endTime).toLocaleTimeString()}
            </span>
          )}
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {expanded && hasDetails && (
        <div className="border-t border-border bg-muted/30">
          {/* Input */}
          {step.input && (
            <div className="p-3 border-b border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Input</div>
              <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                {typeof step.input === 'string' 
                  ? step.input 
                  : JSON.stringify(step.input, null, 2)
                }
              </pre>
            </div>
          )}
          
          {/* Output */}
          {step.output && (
            <div className="p-3 border-b border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Output</div>
              <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                {typeof step.output === 'string' 
                  ? step.output 
                  : JSON.stringify(step.output, null, 2)
                }
              </pre>
            </div>
          )}
          
          {/* Error */}
          {step.error && (
            <div className="p-3">
              <div className="text-xs font-medium text-red-600 mb-2">Error</div>
              <pre className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200 overflow-auto max-h-40">
                {step.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 4. Update ChatTab with split view

```tsx
// app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/index.tsx (additions)
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WorkflowObservabilityPanel } from "./components/WorkflowObservabilityPanel";

export function ChatTab({ agent }: ChatTabProps) {
  const { workflowObservability: { panelOpen } } = useStore();
  
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Main chat area */}
      <ResizablePanel defaultSize={panelOpen ? 70 : 100} minSize={50}>
        <div className="h-full flex">
          <ThreadSidebar />
          <ChatArea agent={agent} />
        </div>
      </ResizablePanel>
      
      {/* Observability panel */}
      {panelOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <WorkflowObservabilityPanel />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
```

### Testing

```bash
# Test component rendering
npm run test -- --grep "WorkflowObservabilityPanel"
npm run test -- --grep "WorkflowCard"
npm run test -- --grep "WorkflowStep"

# E2E test workflow observability
npx playwright test workflow-observability.spec.ts
```

### Success Metrics

- [ ] Panel opens automatically when workflow starts
- [ ] Workflow cards show correct status and progress
- [ ] Steps update in real-time without page refresh
- [ ] Step expansion shows input/output data correctly
- [ ] Failed steps display error details prominently
- [ ] Multiple workflows can be displayed simultaneously
- [ ] Panel can be resized and closed by user
- [ ] UI is responsive and performs well with multiple workflows
- [ ] Empty state displays when no workflows are active
- [ ] Execution times are shown accurately

---

## Validation & Testing

### Integration Tests

```typescript
// Test workflow observability end-to-end
describe('Workflow Observability', () => {
  it('should display workflow progress in real-time', async () => {
    // 1. Start chat with agent
    // 2. Trigger workflow execution
    // 3. Verify panel opens automatically
    // 4. Verify steps update as workflow progresses
    // 5. Verify final result is displayed
  });
  
  it('should handle workflow failures gracefully', async () => {
    // 1. Trigger workflow with forced failure
    // 2. Verify error step is highlighted
    // 3. Verify error details are shown on expansion
  });
  
  it('should support multiple concurrent workflows', async () => {
    // 1. Start multiple workflows
    // 2. Verify all appear in panel
    // 3. Verify each updates independently
  });
});
```

### Manual Testing Checklist

- [ ] Invoke workflow from chat, verify panel opens automatically
- [ ] Verify workflow name and steps appear correctly
- [ ] Watch steps transition: pending → running → success/failed
- [ ] Expand step to see input/output data
- [ ] Trigger workflow failure, verify error handling
- [ ] Start multiple workflows, verify all tracked
- [ ] Resize panel using drag handle
- [ ] Close panel, verify chat area expands
- [ ] Refresh page during workflow execution, verify state restored
- [ ] Test panel performance with long-running workflows

### Performance Considerations

- [ ] SSE connections cleaned up properly on disconnect
- [ ] Large workflow outputs don't freeze UI (virtualization/truncation)
- [ ] Multiple concurrent workflows don't impact chat performance
- [ ] Memory usage remains stable during long sessions
- [ ] Panel rendering is smooth when resizing

---

## Future Enhancements

1. **Historical Workflows**: View completed workflows from previous sessions
2. **Workflow Comparison**: Compare multiple workflow runs side-by-side
3. **Export Capabilities**: Export workflow execution logs
4. **Workflow Pause/Resume**: Interactive control over workflow execution
5. **Step Retry**: Retry individual failed steps
6. **Performance Metrics**: Track workflow execution times and optimization suggestions