# Runtime Engine - UXD

**Created:** December 2024
**Status:** UXD Design Phase
**Related Feature:** workflow-creation/runtime-engine

---

## Overview

The Runtime Engine provides seamless workflow lifecycle management from compilation to execution monitoring. This feature enables users to save workflows, automatically compile them to executable code, run them with real-time progress updates, and review execution history. The system handles the complete transformation from JSON workflow definitions to running code with comprehensive monitoring and debugging capabilities.

### Design Philosophy

1. **Immediate Feedback** - Compilation and execution status visible instantly
2. **Real-time Transparency** - Live progress updates and step-by-step execution tracking
3. **Error Recovery** - Clear error messages with actionable recovery options
4. **Performance Insights** - Detailed metrics for optimization opportunities
5. **Historical Context** - Complete execution history for learning and debugging
6. **Developer Experience** - Debugging tools and logs for technical users

---

## Scope

### In Scope (v1)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Compilation Status** | Real-time feedback on workflow compilation | Core |
| **Input Collection** | Schema-driven forms for runtime parameters | Core |
| **Execution Monitor** | Live progress tracking with step visualization | Core |
| **History Management** | Browse and analyze past execution runs | Core |
| **Execution Details** | Comprehensive view of individual runs | Core |
| **Step Debugging** | Inspect individual step execution and outputs | Core |
| **Live Logging** | Real-time log streaming during execution | Core |
| **Error Handling** | Graceful error recovery and retry mechanisms | Core |
| **Performance Metrics** | Execution timing and resource usage analytics | Important |
| **Runtime Settings** | Configuration for execution environment | Important |

### Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Scheduled Execution | Separate triggers feature |
| Distributed Execution | Single-node execution for v1 |
| Multi-tenant Isolation | Single-user focus |
| Workflow Versioning at Runtime | Version control feature handles this |

---

## UXD File Manifest

| # | File | Description | Status |
|---|------|-------------|--------|
| 01 | `01-compilation-status.html` | Compilation feedback and error display | Complete |
| 02 | `02-run-input-modal.html` | Runtime parameter collection interface | Complete |
| 03 | `03-execution-monitor.html` | Live execution tracking and progress | Complete |
| 04 | `04-history-list.html` | Browse past workflow executions | Complete |
| 05 | `05-execution-detail.html` | Detailed view of specific execution runs | Complete |
| 06 | `06-step-debugging.html` | Step-by-step debugging and inspection | Complete |
| 07 | `07-live-logs.html` | Real-time log streaming interface | Complete |
| 08 | `08-error-handling.html` | Error recovery and retry mechanisms | Complete |
| 09 | `09-performance-metrics.html` | Execution performance analysis | Complete |
| 10 | `10-runtime-settings.html` | Runtime environment configuration | Complete |
| -- | `Frontend-Backend-Mapping.md` | API endpoint documentation | Complete |

---

## Key Features to Demonstrate

### 1. Compilation Status (`01-compilation-status.html`)

Real-time compilation feedback:
- Automatic compilation trigger on save
- Success/warning/error states with details
- Validation results and compilation logs
- Ready-to-run status indicators
- Build artifact information

### 2. Run Input Modal (`02-run-input-modal.html`)

Schema-driven input collection:
- Dynamic form generation from workflow schema
- Input validation and type checking
- Default values and required field indicators
- Advanced input types (files, API keys, etc.)
- Saved input configurations

### 3. Execution Monitor (`03-execution-monitor.html`)

Live execution tracking:
- Step-by-step progress visualization
- Real-time status updates via Server-Sent Events
- Execution timeline and duration tracking
- Cancel/pause execution capabilities
- Output preview as steps complete

### 4. History List (`04-history-list.html`)

Historical execution management:
- Chronological list of all executions
- Status filtering (completed, failed, running)
- Search and sort capabilities
- Quick re-run with same inputs
- Execution metadata and duration

### 5. Execution Detail (`05-execution-detail.html`)

Comprehensive execution analysis:
- Complete execution timeline
- Input values and configuration used
- Step-by-step results and outputs
- Error details and stack traces
- Performance metrics and insights

### 6. Step Debugging (`06-step-debugging.html`)

Individual step inspection:
- Step input/output data inspection
- Code execution logs and traces
- Variable state at each step
- Retry individual steps
- Step performance profiling

### 7. Live Logs (`07-live-logs.html`)

Real-time log streaming:
- Live console output during execution
- Log level filtering (error, warn, info, debug)
- Search and highlight in logs
- Download log files
- Custom log integration

### 8. Error Handling (`08-error-handling.html`)

Error recovery mechanisms:
- Clear error messaging and context
- Suggested fix recommendations
- Retry failed steps with modifications
- Skip steps and continue execution
- Error pattern recognition

### 9. Performance Metrics (`09-performance-metrics.html`)

Execution performance analysis:
- Step execution timing breakdowns
- Resource usage monitoring (CPU, memory)
- Performance trend analysis
- Bottleneck identification
- Optimization recommendations

### 10. Runtime Settings (`10-runtime-settings.html`)

Execution environment configuration:
- Timeout settings and limits
- Resource allocation preferences
- Debug mode and logging levels
- Environment variable management
- Integration connection settings

---

## Technical Specifications

### Execution State Management

```typescript
interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  inputs: Record<string, any>;
  currentStep?: string;
  stepResults: Map<string, StepResult>;
  startedAt: Date;
  metadata: {
    trigger: 'manual' | 'scheduled' | 'api';
    version: string;
    environment: string;
  };
}
```

### Real-time Progress Updates

```typescript
interface ProgressEvent {
  executionId: string;
  timestamp: Date;
  type: 'step_started' | 'step_completed' | 'step_failed' | 'execution_completed';
  stepId?: string;
  data: any;
  duration?: number;
}
```

### Compilation Results

```typescript
interface CompilationResult {
  workflowId: string;
  status: 'success' | 'warning' | 'error';
  timestamp: Date;
  artifacts: {
    generatedCode: string;
    sourceMap?: string;
    dependencies: string[];
  };
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    line?: number;
    suggestion?: string;
  }>;
}
```

---

## Integration Points

### With Existing Systems

| System | Integration Type | Purpose |
|--------|--------------------|---------|
| **Mastra Runtime** | Execution Engine | Core workflow execution |
| **XYFlow Canvas** | Visual Updates | Highlight executing steps |
| **Composio SDK** | Integration Access | Runtime connection resolution |
| **WebContainer API** | Code Execution | Isolated execution environment |
| **Workflow Editor** | Compilation Trigger | Auto-compile on save |

### Server-Sent Events Integration

- Real-time execution progress updates
- Live log streaming
- Compilation status notifications
- Performance metric streaming
- Error event broadcasting

---

## User Interaction Patterns

### Compilation Workflow

1. **Auto-trigger** - Compilation starts automatically on save
2. **Progress Display** - Real-time compilation status
3. **Result Review** - Success confirmation or error details
4. **Action Enable** - Run button activates on successful compilation

### Execution Workflow

1. **Input Collection** - Schema-driven parameter gathering
2. **Execution Launch** - Start workflow with collected inputs
3. **Progress Monitoring** - Real-time step tracking and visualization
4. **Result Review** - Analyze outputs and performance
5. **History Storage** - Automatic execution record keeping

---

## Error Handling Patterns

### Compilation Errors

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| **Syntax Error** | "Invalid workflow structure detected" | Show specific validation errors |
| **Missing Dependencies** | "Required integration not connected" | Link to connections setup |
| **Type Mismatch** | "Parameter type conflict found" | Suggest type corrections |
| **Import Resolution** | "Cannot resolve workflow imports" | Check registry and dependencies |

### Runtime Errors

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| **Step Timeout** | "Step execution exceeded time limit" | Offer retry with increased timeout |
| **Connection Failure** | "Integration connection lost" | Suggest connection refresh |
| **Input Validation** | "Invalid input data provided" | Show validation errors and fixes |
| **Resource Limit** | "Execution resource limit exceeded" | Suggest optimization or retry |

---

## Performance Considerations

### Real-time Updates

- Server-Sent Events for efficient live updates
- Debounced UI updates to prevent performance issues
- Selective step output streaming based on size
- Connection pooling for multiple concurrent executions

### Data Management

- Execution history pagination
- Step output truncation for large data
- Automatic cleanup of old execution records
- Efficient log storage and retrieval

### Scalability

- Execution queue management
- Resource allocation limits
- Concurrent execution controls
- Memory usage monitoring

---

## Accessibility Features

- Screen reader support for execution status
- Keyboard navigation through execution steps
- High contrast mode for error states
- Alternative text for progress indicators
- Focus management during state transitions

---

## Future Enhancements

### Phase 2
- Scheduled execution integration
- Workflow execution queuing
- Advanced debugging breakpoints
- Performance optimization suggestions

### Phase 3
- Distributed execution support
- Real-time collaboration on executions
- Advanced analytics and machine learning insights
- Custom execution environments

---

## Related Documentation

- **Mastra Integration**: `/lib/mastra/`
- **Workflow Editor**: `../ai-workflow-builder/`
- **Step Generator**: `app/api/workflows/services/step-generator.ts`
- **Registry Management**: `_tables/workflows/registry.ts`