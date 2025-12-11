# Phases: Control Flow Visual Primitives

**Task:** `09A-Control-Flow-Visual-Primitives-Task.md`  
**Status:** Not Started  
**Last Updated:** 2025-12-11

---

## Phase 1: Control Flow Schema and Transpilation

### Goal
Extend the workflow schema to support control flow structures and implement transpilation to Mastra's control flow primitives.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/api/workflows/types/workflow.ts` | ~100 | Extend workflow schema for control flow |
| `app/api/workflows/types/control-flow.ts` | ~150 | Create control flow type definitions |
| `app/api/workflows/services/step-generator.ts` | ~200 | Add control flow transpilation logic |
| `app/api/workflows/services/control-flow-validator.ts` | ~120 | Validate control flow structures |

### Implementation

#### 1. Extend workflow schema for control flow

```typescript
// app/api/workflows/types/control-flow.ts
import { z } from 'zod';

export const ConditionalBranchSchema = z.object({
  type: z.literal('branch'),
  id: z.string(),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']),
    value: z.any(),
    expression: z.string().optional() // For complex expressions
  }),
  thenSteps: z.array(z.string()), // Step IDs
  elseSteps: z.array(z.string()).optional()
});

export const LoopSchema = z.object({
  type: z.enum(['foreach', 'dowhile', 'dountil']),
  id: z.string(),
  source: z.object({
    field: z.string(), // Field containing array to iterate
    stepId: z.string().optional() // Step that provides the array
  }).optional(),
  condition: z.object({
    expression: z.string() // For while/until loops
  }).optional(),
  steps: z.array(z.string()), // Step IDs to execute in loop
  maxIterations: z.number().optional() // Safety limit
});

export const ParallelSchema = z.object({
  type: z.literal('parallel'),
  id: z.string(),
  branches: z.array(z.object({
    id: z.string(),
    steps: z.array(z.string())
  })),
  waitStrategy: z.enum(['all', 'any', 'first_n']).default('all'),
  maxConcurrency: z.number().optional()
});

export const ErrorHandlingSchema = z.object({
  type: z.literal('try_catch'),
  id: z.string(),
  trySteps: z.array(z.string()),
  catchSteps: z.array(z.string()).optional(),
  finallySteps: z.array(z.string()).optional(),
  retryStrategy: z.object({
    maxRetries: z.number().default(0),
    backoffMs: z.number().default(1000),
    exponential: z.boolean().default(false)
  }).optional()
});

export const ControlFlowNodeSchema = z.union([
  ConditionalBranchSchema,
  LoopSchema,
  ParallelSchema,
  ErrorHandlingSchema
]);

export type ControlFlowNode = z.infer<typeof ControlFlowNodeSchema>;
```

#### 2. Update workflow schema

```typescript
// app/api/workflows/types/workflow.ts (additions)
import { ControlFlowNodeSchema } from './control-flow';

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(StepSchema),
  bindings: z.array(BindingSchema),
  controlFlow: z.array(ControlFlowNodeSchema).default([]), // New field
  metadata: WorkflowMetadataSchema.optional()
});
```

#### 3. Implement control flow transpilation

```typescript
// app/api/workflows/services/step-generator.ts (additions)
import { ControlFlowNode } from '../types/control-flow';

class StepGenerator {
  // Existing generateSteps method...
  
  generateControlFlow(controlFlowNodes: ControlFlowNode[], steps: any[]): string {
    let mastraCode = '';
    
    for (const node of controlFlowNodes) {
      switch (node.type) {
        case 'branch':
          mastraCode += this.generateConditional(node, steps);
          break;
        case 'foreach':
          mastraCode += this.generateLoop(node, steps);
          break;
        case 'parallel':
          mastraCode += this.generateParallel(node, steps);
          break;
        case 'try_catch':
          mastraCode += this.generateErrorHandling(node, steps);
          break;
      }
    }
    
    return mastraCode;
  }
  
  private generateConditional(node: ConditionalBranchSchema, steps: any[]): string {
    const condition = this.buildConditionExpression(node.condition);
    const thenSteps = this.getStepsByIds(node.thenSteps, steps);
    const elseSteps = node.elseSteps ? this.getStepsByIds(node.elseSteps, steps) : [];
    
    return `
      .branch({
        if: ${condition},
        then: workflow => workflow
          ${thenSteps.map(step => this.generateStepCall(step)).join('')},
        else: workflow => workflow
          ${elseSteps.map(step => this.generateStepCall(step)).join('')}
      })`;
  }
  
  private generateLoop(node: LoopSchema, steps: any[]): string {
    const loopSteps = this.getStepsByIds(node.steps, steps);
    
    if (node.type === 'foreach') {
      const sourceField = node.source?.field || 'items';
      return `
        .foreach({
          source: '${sourceField}',
          step: (workflow, item, index) => workflow
            ${loopSteps.map(step => this.generateStepCall(step, 'item')).join('')}
        })`;
    } else if (node.type === 'dowhile') {
      return `
        .dowhile({
          condition: ${node.condition?.expression},
          step: workflow => workflow
            ${loopSteps.map(step => this.generateStepCall(step)).join('')},
          maxIterations: ${node.maxIterations || 100}
        })`;
    }
    
    return '';
  }
  
  private generateParallel(node: ParallelSchema, steps: any[]): string {
    const branches = node.branches.map(branch => {
      const branchSteps = this.getStepsByIds(branch.steps, steps);
      return `
        workflow => workflow
          ${branchSteps.map(step => this.generateStepCall(step)).join('')}`;
    });
    
    return `
      .parallel([
        ${branches.join(',\n        ')}
      ])`;
  }
  
  private generateErrorHandling(node: ErrorHandlingSchema, steps: any[]): string {
    const trySteps = this.getStepsByIds(node.trySteps, steps);
    const catchSteps = node.catchSteps ? this.getStepsByIds(node.catchSteps, steps) : [];
    
    return `
      .try(
        workflow => workflow
          ${trySteps.map(step => this.generateStepCall(step)).join('')}
      )${catchSteps.length ? `
      .catch(
        (workflow, error) => workflow
          ${catchSteps.map(step => this.generateStepCall(step)).join('')}
      )` : ''}`;
  }
  
  private buildConditionExpression(condition: any): string {
    const { field, operator, value } = condition;
    
    if (condition.expression) {
      return condition.expression;
    }
    
    switch (operator) {
      case 'equals':
        return `ctx.get('${field}') === ${JSON.stringify(value)}`;
      case 'not_equals':
        return `ctx.get('${field}') !== ${JSON.stringify(value)}`;
      case 'greater_than':
        return `ctx.get('${field}') > ${JSON.stringify(value)}`;
      case 'less_than':
        return `ctx.get('${field}') < ${JSON.stringify(value)}`;
      case 'contains':
        return `ctx.get('${field}')?.includes?.(${JSON.stringify(value)})`;
      case 'exists':
        return `ctx.get('${field}') != null`;
      default:
        return 'true';
    }
  }
}
```

#### 4. Create control flow validator

```typescript
// app/api/workflows/services/control-flow-validator.ts
export class ControlFlowValidator {
  validateControlFlow(controlFlow: ControlFlowNode[], steps: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const node of controlFlow) {
      switch (node.type) {
        case 'branch':
          this.validateBranch(node, steps, errors, warnings);
          break;
        case 'foreach':
        case 'dowhile':
        case 'dountil':
          this.validateLoop(node, steps, errors, warnings);
          break;
        case 'parallel':
          this.validateParallel(node, steps, errors, warnings);
          break;
        case 'try_catch':
          this.validateErrorHandling(node, steps, errors, warnings);
          break;
      }
    }
    
    // Check for circular dependencies
    this.validateNoCycles(controlFlow, steps, errors);
    
    // Validate all referenced steps exist
    this.validateStepReferences(controlFlow, steps, errors);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private validateBranch(node: ConditionalBranch, steps: any[], errors: string[], warnings: string[]) {
    // Validate condition references valid fields
    const condition = node.condition;
    if (!this.isValidCondition(condition, steps)) {
      errors.push(`Branch ${node.id}: Invalid condition field '${condition.field}'`);
    }
    
    // Validate then/else steps exist
    for (const stepId of node.thenSteps) {
      if (!steps.find(s => s.id === stepId)) {
        errors.push(`Branch ${node.id}: Then step '${stepId}' not found`);
      }
    }
    
    if (node.elseSteps) {
      for (const stepId of node.elseSteps) {
        if (!steps.find(s => s.id === stepId)) {
          errors.push(`Branch ${node.id}: Else step '${stepId}' not found`);
        }
      }
    }
  }
  
  private validateLoop(node: LoopSchema, steps: any[], errors: string[], warnings: string[]) {
    // Validate loop doesn't exceed reasonable limits
    if (node.maxIterations && node.maxIterations > 1000) {
      warnings.push(`Loop ${node.id}: High iteration limit may cause performance issues`);
    }
    
    // Validate source field for foreach loops
    if (node.type === 'foreach' && node.source) {
      if (!this.isValidArrayField(node.source.field, steps)) {
        errors.push(`Loop ${node.id}: Source field '${node.source.field}' is not an array`);
      }
    }
    
    // Validate loop body steps
    for (const stepId of node.steps) {
      if (!steps.find(s => s.id === stepId)) {
        errors.push(`Loop ${node.id}: Step '${stepId}' not found`);
      }
    }
  }
  
  private validateStepReferences(controlFlow: ControlFlowNode[], steps: any[], errors: string[]) {
    const allReferencedSteps = new Set<string>();
    
    for (const node of controlFlow) {
      const stepIds = this.getReferencedSteps(node);
      stepIds.forEach(id => allReferencedSteps.add(id));
    }
    
    for (const stepId of allReferencedSteps) {
      if (!steps.find(s => s.id === stepId)) {
        errors.push(`Referenced step '${stepId}' not found in workflow`);
      }
    }
  }
}
```

### Testing

```bash
# Test control flow schema validation
npm run test -- --grep "control-flow schema"

# Test transpilation output
npm run test -- --grep "control-flow transpilation"

# Test validator
npm run test -- --grep "control-flow validation"
```

### Success Metrics

- [ ] Control flow schema validates all supported primitives
- [ ] Transpilation generates valid Mastra control flow code
- [ ] Generated workflows execute correctly with control flow
- [ ] Validator catches common control flow errors
- [ ] Complex nested control flows transpile correctly
- [ ] Performance remains acceptable with deep nesting

---

## Phase 2: Visual Control Flow Nodes

### Goal
Create visual node types for control flow primitives in the workflow editor canvas.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workflows/editor/components/nodes/BranchNode.tsx` | ~200 | Conditional branch node |
| `app/(pages)/workflows/editor/components/nodes/LoopNode.tsx` | ~180 | Loop iteration node |
| `app/(pages)/workflows/editor/components/nodes/ParallelNode.tsx` | ~150 | Parallel execution node |
| `app/(pages)/workflows/editor/components/nodes/ErrorHandlingNode.tsx` | ~160 | Try/catch node |
| `app/(pages)/workflows/editor/components/NodePalette.tsx` | ~50 | Add control flow nodes to palette |
| `app/(pages)/workflows/editor/store/slices/control-flow-slice.ts` | ~100 | Control flow state management |

### Implementation

#### 1. Create branch node component

```tsx
// app/(pages)/workflows/editor/components/nodes/BranchNode.tsx
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { GitBranch } from 'lucide-react';
import { useNodeData } from '../hooks/useNodeData';

interface BranchNodeData {
  condition: {
    field: string;
    operator: string;
    value: any;
  };
  thenSteps: string[];
  elseSteps: string[];
}

export function BranchNode({ id, data }: { id: string; data: BranchNodeData }) {
  const { updateNodeData } = useNodeData(id);
  
  const handleConditionChange = (key: string, value: any) => {
    updateNodeData({
      condition: {
        ...data.condition,
        [key]: value
      }
    });
  };
  
  return (
    <Card className="min-w-[300px] border-orange-200 bg-orange-50">
      <Handle type="target" position={Position.Top} />
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-800">Conditional Branch</span>
        </div>
        
        <div className="space-y-3">
          {/* Condition configuration */}
          <div className="grid grid-cols-3 gap-2">
            <Select 
              value={data.condition.field} 
              onValueChange={(value) => handleConditionChange('field', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                {/* Dynamic options based on previous step outputs */}
              </SelectContent>
            </Select>
            
            <Select 
              value={data.condition.operator} 
              onValueChange={(value) => handleConditionChange('operator', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="exists">Exists</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Value"
              value={data.condition.value || ''}
              onChange={(e) => handleConditionChange('value', e.target.value)}
            />
          </div>
          
          {/* Branch indicators */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>✓ True: {data.thenSteps.length} steps</span>
            <span>✗ False: {data.elseSteps.length} steps</span>
          </div>
        </div>
      </CardContent>
      
      {/* Output handles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="then"
        style={{ left: '25%', background: '#22c55e' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="else"
        style={{ left: '75%', background: '#ef4444' }}
      />
    </Card>
  );
}
```

#### 2. Create loop node component

```tsx
// app/(pages)/workflows/editor/components/nodes/LoopNode.tsx
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RotateCw } from 'lucide-react';

interface LoopNodeData {
  type: 'foreach' | 'dowhile' | 'dountil';
  source?: { field: string };
  condition?: { expression: string };
  steps: string[];
  maxIterations?: number;
}

export function LoopNode({ id, data }: { id: string; data: LoopNodeData }) {
  const { updateNodeData } = useNodeData(id);
  
  const getLoopTypeLabel = (type: string) => {
    switch (type) {
      case 'foreach': return 'For Each Item';
      case 'dowhile': return 'While Condition';
      case 'dountil': return 'Until Condition';
      default: return 'Loop';
    }
  };
  
  return (
    <Card className="min-w-[280px] border-blue-200 bg-blue-50">
      <Handle type="target" position={Position.Top} />
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCw className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">{getLoopTypeLabel(data.type)}</span>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={data.type} 
            onValueChange={(value) => updateNodeData({ type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="foreach">For Each Item</SelectItem>
              <SelectItem value="dowhile">While Condition</SelectItem>
              <SelectItem value="dountil">Until Condition</SelectItem>
            </SelectContent>
          </Select>
          
          {data.type === 'foreach' && (
            <Input
              placeholder="Array field name"
              value={data.source?.field || ''}
              onChange={(e) => updateNodeData({
                source: { field: e.target.value }
              })}
            />
          )}
          
          {(data.type === 'dowhile' || data.type === 'dountil') && (
            <Input
              placeholder="Condition expression"
              value={data.condition?.expression || ''}
              onChange={(e) => updateNodeData({
                condition: { expression: e.target.value }
              })}
            />
          )}
          
          <Input
            type="number"
            placeholder="Max iterations (safety limit)"
            value={data.maxIterations || ''}
            onChange={(e) => updateNodeData({
              maxIterations: parseInt(e.target.value) || undefined
            })}
          />
          
          <div className="text-xs text-muted-foreground">
            Loop body: {data.steps.length} steps
          </div>
        </div>
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}
```

#### 3. Update node palette

```tsx
// app/(pages)/workflows/editor/components/NodePalette.tsx (additions)
const CONTROL_FLOW_NODES = [
  {
    type: 'branch',
    label: 'Conditional Branch',
    icon: GitBranch,
    description: 'Execute different paths based on conditions',
    category: 'Control Flow'
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: RotateCw,
    description: 'Repeat steps for each item or while condition is true',
    category: 'Control Flow'
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: Zap,
    description: 'Execute multiple paths simultaneously',
    category: 'Control Flow'
  },
  {
    type: 'try_catch',
    label: 'Error Handling',
    icon: Shield,
    description: 'Handle errors and exceptions gracefully',
    category: 'Control Flow'
  }
];

export function NodePalette() {
  return (
    <div className="space-y-4">
      {/* Existing categories */}
      
      <div>
        <h3 className="font-medium mb-2">Control Flow</h3>
        <div className="grid grid-cols-2 gap-2">
          {CONTROL_FLOW_NODES.map((node) => (
            <DraggableNode key={node.type} {...node} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Testing

```bash
# Test control flow nodes render correctly
npm run test -- --grep "control flow nodes"

# Test node configuration updates state
npm run test -- --grep "control flow configuration"

# E2E test drag and drop control flow
npx playwright test control-flow-nodes.spec.ts
```

### Success Metrics

- [ ] Control flow nodes can be dragged from palette to canvas
- [ ] Node configuration UI updates underlying data correctly
- [ ] Visual connections work between control flow and regular nodes
- [ ] Node styling clearly differentiates control flow types
- [ ] Complex nested structures can be built visually
- [ ] Performance remains good with many control flow nodes

---

## Phase 3: Control Flow Execution Integration

### Goal
Integrate visual control flow with workflow execution and provide execution visualization.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workflows/editor/components/ExecutionVisualization.tsx` | ~150 | Show control flow execution state |
| `app/(pages)/workflows/editor/hooks/useControlFlowExecution.ts` | ~100 | Track control flow execution |
| `app/api/workflows/services/execution-tracker.ts` | ~120 | Control flow execution tracking |

### Implementation

#### 1. Control flow execution tracking

```typescript
// app/api/workflows/services/execution-tracker.ts
interface ControlFlowExecution {
  nodeId: string;
  type: 'branch' | 'loop' | 'parallel' | 'try_catch';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  currentIteration?: number;
  branchTaken?: 'then' | 'else';
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export class ExecutionTracker {
  private controlFlowExecutions = new Map<string, ControlFlowExecution>();
  
  startControlFlowExecution(nodeId: string, type: any) {
    this.controlFlowExecutions.set(nodeId, {
      nodeId,
      type,
      status: 'executing',
      startTime: new Date()
    });
    
    // Emit to SSE stream for real-time updates
    this.emitExecutionUpdate(nodeId);
  }
  
  updateControlFlowExecution(nodeId: string, update: Partial<ControlFlowExecution>) {
    const existing = this.controlFlowExecutions.get(nodeId);
    if (existing) {
      this.controlFlowExecutions.set(nodeId, { ...existing, ...update });
      this.emitExecutionUpdate(nodeId);
    }
  }
  
  completeControlFlowExecution(nodeId: string) {
    this.updateControlFlowExecution(nodeId, {
      status: 'completed',
      endTime: new Date()
    });
  }
  
  private emitExecutionUpdate(nodeId: string) {
    const execution = this.controlFlowExecutions.get(nodeId);
    if (execution) {
      // Emit to workflow observability SSE stream
      WorkflowStreamService.getInstance().emitEvent(execution.nodeId, {
        type: 'control-flow-update',
        data: execution,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

#### 2. Execution visualization component

```tsx
// app/(pages)/workflows/editor/components/ExecutionVisualization.tsx
import { useEffect, useState } from 'react';
import { useStore } from '../store';

interface ControlFlowExecution {
  nodeId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  currentIteration?: number;
  branchTaken?: 'then' | 'else';
}

export function ExecutionVisualization() {
  const [executions, setExecutions] = useState<Map<string, ControlFlowExecution>>(new Map());
  
  useEffect(() => {
    // Subscribe to control flow execution updates via SSE
    const eventSource = new EventSource('/api/workflows/execution/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'control-flow-update') {
        setExecutions(prev => new Map(prev.set(data.data.nodeId, data.data)));
      }
    };
    
    return () => eventSource.close();
  }, []);
  
  // This component overlays execution state on the canvas
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from(executions.entries()).map(([nodeId, execution]) => (
        <ControlFlowExecutionOverlay 
          key={nodeId}
          nodeId={nodeId}
          execution={execution}
        />
      ))}
    </div>
  );
}

function ControlFlowExecutionOverlay({ 
  nodeId, 
  execution 
}: { 
  nodeId: string; 
  execution: ControlFlowExecution; 
}) {
  // Position overlay based on node position in canvas
  const nodePosition = useNodePosition(nodeId);
  
  if (!nodePosition) return null;
  
  return (
    <div 
      className="absolute z-10"
      style={{ 
        left: nodePosition.x, 
        top: nodePosition.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {execution.status === 'executing' && (
        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs animate-pulse">
          {execution.currentIteration && `Iteration ${execution.currentIteration}`}
          {execution.branchTaken && `Branch: ${execution.branchTaken}`}
          Executing...
        </div>
      )}
      
      {execution.status === 'completed' && (
        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
          ✓ Completed
        </div>
      )}
      
      {execution.status === 'failed' && (
        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">
          ✗ Failed
        </div>
      )}
    </div>
  );
}
```

### Testing

```bash
# Test execution tracking
npm run test -- --grep "control flow execution"

# Test execution visualization
npm run test -- --grep "execution visualization"

# E2E test control flow execution
npx playwright test control-flow-execution.spec.ts
```

### Success Metrics

- [ ] Control flow execution state tracked correctly
- [ ] Visual indicators show execution progress on canvas
- [ ] Loop iterations display current count
- [ ] Branch decisions show which path was taken
- [ ] Parallel execution shows concurrent state
- [ ] Error handling shows caught exceptions
- [ ] Execution timeline displays in workflow observability

---

## Validation & Testing

### Integration Tests

```typescript
describe('Control Flow Visual Primitives', () => {
  it('should transpile visual branch to Mastra code', async () => {
    // 1. Create visual branch node
    // 2. Configure condition
    // 3. Connect to steps
    // 4. Transpile workflow
    // 5. Verify generated Mastra .branch() code
  });
  
  it('should execute complex nested control flow', async () => {
    // 1. Create nested loop with conditional branches
    // 2. Execute workflow
    // 3. Verify correct execution path
    // 4. Verify all iterations and branches tracked
  });
});
```

### Manual Testing Checklist

- [ ] Drag branch node to canvas and configure condition
- [ ] Create loop node and configure iteration parameters  
- [ ] Connect control flow nodes to regular workflow steps
- [ ] Test nested control structures (loop containing branches)
- [ ] Execute workflow and verify control flow visualization
- [ ] Test error scenarios (infinite loops, invalid conditions)
- [ ] Verify transpiled code matches visual structure
- [ ] Test performance with complex control flow workflows

---

## Future Enhancements

1. **Visual Debugging**: Step-through debugging of control flow execution
2. **Performance Optimization**: Optimize transpiled code for complex control flows
3. **Advanced Conditions**: Visual condition builder with AND/OR logic
4. **Control Flow Templates**: Pre-built control flow patterns
5. **Simulation Mode**: Test control flow without executing full workflow
6. **Version Control**: Track changes to control flow structures