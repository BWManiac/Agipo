# Runtime Engine - Frontend-Backend Mapping

## Overview

The Runtime Engine feature provides comprehensive workflow execution capabilities including compilation, monitoring, debugging, performance tracking, and configuration management. This document maps the frontend UX components to their corresponding backend implementations.

## File Structure

```
runtime-engine/UXD/
├── 01-compilation-status.html      # Workflow compilation monitoring
├── 02-run-input-modal.html         # Execution parameter collection
├── 03-execution-monitor.html       # Real-time execution tracking
├── 04-history-list.html            # Execution history and logs
├── 05-execution-detail.html        # Detailed execution analysis
├── 06-step-debugging.html          # Interactive step debugger
├── 07-live-logs.html               # Real-time log streaming
├── 08-error-handling.html          # Error management and recovery
├── 09-performance-metrics.html     # Performance monitoring dashboard
├── 10-runtime-settings.html        # Runtime configuration
└── Frontend-Backend-Mapping.md     # This file
```

## Frontend-Backend Mappings

### 1. Compilation Status (01-compilation-status.html)

**Frontend Components:**
- Compilation pipeline visualization
- Generated code preview with syntax highlighting
- Dependency graph display
- Error and warning notifications
- Build artifacts list

**Backend Implementation:**
```typescript
// app/api/workflow/compile/route.ts
interface CompilationRequest {
  workflowId: string;
  targetRuntime: 'webcontainer' | 'node' | 'docker';
  optimizations?: string[];
}

interface CompilationStatus {
  id: string;
  status: 'pending' | 'compiling' | 'completed' | 'failed';
  pipeline: CompilationStep[];
  artifacts: BuildArtifact[];
  errors: CompilationError[];
  warnings: CompilationWarning[];
}

// WebContainer API Integration
const webContainer = await WebContainer.boot();
await webContainer.mount(workflowFiles);
const process = await webContainer.spawn('npm', ['run', 'build']);
```

**Key Backend Services:**
- Workflow compiler service
- Code generation engine
- Dependency analyzer
- WebContainer API integration
- Build artifact management

### 2. Run Input Modal (02-run-input-modal.html)

**Frontend Components:**
- Dynamic form generation from workflow schema
- Input validation and type checking
- Saved configuration management
- Parameter preview and summary
- Connection selection (Gmail, Notion, etc.)

**Backend Implementation:**
```typescript
// app/api/workflow/[id]/run/route.ts
interface WorkflowExecution {
  workflowId: string;
  parameters: Record<string, any>;
  configuration: ExecutionConfig;
  connectionIds: string[];
}

interface ExecutionConfig {
  timeout: number;
  retryPolicy: RetryPolicy;
  errorHandling: 'fail-fast' | 'continue' | 'retry';
  debugging: boolean;
}

// Parameter validation
const schema = await getWorkflowParameterSchema(workflowId);
const validatedParams = validateParameters(parameters, schema);
```

**Key Backend Services:**
- Workflow parameter schema service
- Input validation engine
- Saved configuration management
- Connection verification service
- Execution queue management

### 3. Execution Monitor (03-execution-monitor.html)

**Frontend Components:**
- Real-time workflow canvas with step status
- Live progress indicators and metrics
- Current step detailed view
- Timeline visualization
- Performance gauges

**Backend Implementation:**
```typescript
// Server-Sent Events for real-time updates
// app/api/workflow/[id]/execution/[executionId]/stream/route.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const eventSource = new EventSource();
      
      eventSource.addEventListener('step-start', (event) => {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'step-start',
          stepId: event.data.stepId,
          timestamp: Date.now()
        })}\n\n`);
      });
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

// Workflow execution engine
interface ExecutionUpdate {
  type: 'step-start' | 'step-complete' | 'step-error' | 'execution-complete';
  executionId: string;
  stepId?: string;
  progress: number;
  metrics: ExecutionMetrics;
}
```

**Key Backend Services:**
- Workflow execution engine
- Real-time event streaming (SSE)
- Step progress tracking
- Metrics collection service
- WebContainer execution environment

### 4. History List (04-history-list.html)

**Frontend Components:**
- Execution history table with filtering
- Status indicators and progress bars
- Execution statistics dashboard
- Bulk action controls
- Export functionality

**Backend Implementation:**
```typescript
// app/api/workflow/executions/route.ts
interface ExecutionHistory {
  executions: WorkflowExecution[];
  pagination: PaginationInfo;
  statistics: ExecutionStatistics;
  filters: FilterOptions;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  itemsProcessed: number;
  itemsTotal: number;
  triggerType: 'manual' | 'scheduled' | 'api';
  errorCount: number;
}

// Database queries with filters
const executions = await db.executions.findMany({
  where: {
    workflowId,
    status: { in: statusFilters },
    createdAt: { gte: startDate, lte: endDate }
  },
  orderBy: { createdAt: 'desc' },
  include: { metrics: true }
});
```

**Key Backend Services:**
- Execution history database
- Statistics aggregation service
- Filtering and pagination engine
- Export service (CSV, JSON)
- Metrics calculation

### 5. Execution Detail (05-execution-detail.html)

**Frontend Components:**
- Detailed step breakdown and timeline
- Data flow visualization
- Processing result samples
- Performance analysis
- I/O data inspection

**Backend Implementation:**
```typescript
// app/api/workflow/execution/[id]/detail/route.ts
interface ExecutionDetail {
  execution: WorkflowExecution;
  steps: StepExecution[];
  dataFlow: DataFlowInfo[];
  samples: ProcessingSample[];
  metrics: DetailedMetrics;
}

interface StepExecution {
  stepId: string;
  status: 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime: Date;
  inputData: any;
  outputData: any;
  configuration: StepConfig;
  logs: LogEntry[];
}

// Detailed execution data retrieval
const executionDetail = await getExecutionWithSteps(executionId);
const dataFlowAnalysis = await analyzeDataFlow(executionDetail);
const processingSamples = await getProcessingSamples(executionId, limit);
```

**Key Backend Services:**
- Execution detail service
- Data flow analyzer
- Sample data extractor
- Log aggregation service
- Performance metrics calculator

### 6. Step Debugging (06-step-debugging.html)

**Frontend Components:**
- Interactive code debugger interface
- Breakpoint management
- Variable inspection and watch
- Call stack visualization
- Debug console

**Backend Implementation:**
```typescript
// app/api/workflow/debug/route.ts
interface DebugSession {
  sessionId: string;
  workflowId: string;
  currentStep: string;
  breakpoints: Breakpoint[];
  variables: VariableScope[];
  callStack: CallFrame[];
}

interface Breakpoint {
  id: string;
  stepId: string;
  line: number;
  condition?: string;
  enabled: boolean;
}

// Debug session management
class DebugSessionManager {
  async createSession(workflowId: string): Promise<DebugSession>;
  async setBreakpoint(sessionId: string, breakpoint: Breakpoint): Promise<void>;
  async stepOver(sessionId: string): Promise<StepResult>;
  async stepInto(sessionId: string): Promise<StepResult>;
  async continue(sessionId: string): Promise<void>;
  async evaluateExpression(sessionId: string, expression: string): Promise<any>;
}
```

**Key Backend Services:**
- Debug session manager
- Breakpoint management service
- Variable inspection engine
- Code execution controller
- Expression evaluator

### 7. Live Logs (07-live-logs.html)

**Frontend Components:**
- Real-time log streaming terminal
- Log level filtering and search
- Multi-source log aggregation
- Log export and archival
- Performance statistics

**Backend Implementation:**
```typescript
// app/api/workflow/logs/stream/route.ts
interface LogStream {
  subscribe(executionId: string): AsyncIterable<LogEntry>;
  filter(level: LogLevel, source?: string): LogStream;
  search(query: string): LogStream;
}

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, any>;
  executionId: string;
  stepId?: string;
}

// WebSocket log streaming
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');
  
  return new Response(
    new ReadableStream({
      start(controller) {
        const logSubscription = subscribeToLogs(executionId);
        
        logSubscription.on('log', (entry) => {
          controller.enqueue(`data: ${JSON.stringify(entry)}\n\n`);
        });
      }
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  );
}
```

**Key Backend Services:**
- Log aggregation service
- Real-time log streaming (WebSocket/SSE)
- Log filtering and search engine
- Log persistence and archival
- Performance monitoring

### 8. Error Handling (08-error-handling.html)

**Frontend Components:**
- Error dashboard with categorization
- Failure analysis and stack traces
- Recovery action suggestions
- Retry management interface
- Error pattern detection

**Backend Implementation:**
```typescript
// app/api/workflow/errors/route.ts
interface ErrorAnalysis {
  errors: WorkflowError[];
  categories: ErrorCategory[];
  recoveryOptions: RecoveryOption[];
  patterns: ErrorPattern[];
}

interface WorkflowError {
  id: string;
  executionId: string;
  stepId: string;
  type: string;
  message: string;
  stackTrace: string;
  context: ErrorContext;
  retryAttempts: number;
  recoverable: boolean;
}

interface RecoveryOption {
  type: 'retry' | 'skip' | 'modify' | 'manual';
  description: string;
  automated: boolean;
  confidence: number;
}

// Error analysis and recovery
class ErrorHandler {
  async analyzeError(error: WorkflowError): Promise<ErrorAnalysis>;
  async suggestRecovery(errorId: string): Promise<RecoveryOption[]>;
  async retryExecution(executionId: string, options?: RetryOptions): Promise<void>;
  async skipFailedItems(executionId: string, itemIds: string[]): Promise<void>;
}
```

**Key Backend Services:**
- Error analysis engine
- Recovery suggestion service
- Retry management system
- Error pattern detection
- Failure diagnostics

### 9. Performance Metrics (09-performance-metrics.html)

**Frontend Components:**
- Performance dashboard with real-time charts
- Resource usage monitoring
- API performance breakdown
- Throughput and latency metrics
- Optimization recommendations

**Backend Implementation:**
```typescript
// app/api/workflow/metrics/route.ts
interface PerformanceMetrics {
  execution: ExecutionMetrics;
  resources: ResourceMetrics;
  apis: ApiMetrics[];
  recommendations: OptimizationRecommendation[];
}

interface ExecutionMetrics {
  throughput: number; // items per minute
  averageLatency: number; // seconds
  successRate: number; // percentage
  totalDuration: number; // seconds
}

interface ResourceMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // bytes
  networkIO: NetworkMetrics;
  diskUsage: number; // bytes
}

// Metrics collection service
class MetricsCollector {
  async collectExecutionMetrics(executionId: string): Promise<ExecutionMetrics>;
  async collectResourceMetrics(): Promise<ResourceMetrics>;
  async analyzeApiPerformance(apis: string[]): Promise<ApiMetrics[]>;
  async generateRecommendations(metrics: PerformanceMetrics): Promise<OptimizationRecommendation[]>;
}
```

**Key Backend Services:**
- Metrics collection service
- Performance analyzer
- Resource monitoring system
- API performance tracker
- Optimization engine

### 10. Runtime Settings (10-runtime-settings.html)

**Frontend Components:**
- Configuration management interface
- Environment-specific settings
- Validation and preview tools
- Template management
- Settings export/import

**Backend Implementation:**
```typescript
// app/api/workflow/settings/route.ts
interface RuntimeConfiguration {
  execution: ExecutionSettings;
  ai: AiSettings;
  monitoring: MonitoringSettings;
  resources: ResourceSettings;
  security: SecuritySettings;
}

interface ExecutionSettings {
  maxConcurrentSteps: number;
  batchSize: number;
  workerThreads: number;
  globalTimeout: number; // seconds
  stepTimeout: number; // seconds
  memoryLimit: string; // e.g., "256MB"
  failFast: boolean;
  autoRetry: boolean;
  preservePartialResults: boolean;
}

interface AiSettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  requestTimeout: number;
  maxRetries: number;
  rateLimitStrategy: string;
}

// Configuration management
class ConfigurationManager {
  async getConfiguration(workflowId: string): Promise<RuntimeConfiguration>;
  async updateConfiguration(workflowId: string, config: Partial<RuntimeConfiguration>): Promise<void>;
  async validateConfiguration(config: RuntimeConfiguration): Promise<ValidationResult>;
  async exportConfiguration(workflowId: string): Promise<string>;
  async importConfiguration(workflowId: string, configJson: string): Promise<void>;
}
```

**Key Backend Services:**
- Configuration management service
- Settings validation engine
- Environment configuration
- Template management system
- Configuration versioning

## Integration Architecture

### WebContainer Integration

The runtime engine heavily leverages WebContainer API for isolated execution:

```typescript
// lib/webcontainer/workflow-runner.ts
class WorkflowRunner {
  private webContainer: WebContainer;
  
  async initialize() {
    this.webContainer = await WebContainer.boot();
  }
  
  async executeWorkflow(workflow: CompiledWorkflow, parameters: any) {
    // Mount workflow files
    await this.webContainer.mount(workflow.files);
    
    // Install dependencies
    await this.webContainer.spawn('npm', ['install']);
    
    // Execute workflow with parameters
    const process = await this.webContainer.spawn('node', ['main.js'], {
      env: { WORKFLOW_PARAMS: JSON.stringify(parameters) }
    });
    
    return this.streamOutput(process);
  }
}
```

### Mastra Framework Integration

Integration with Mastra for AI agent orchestration:

```typescript
// lib/mastra/workflow-agent.ts
import { Agent } from '@mastra/core';

class WorkflowAgent extends Agent {
  async executeStep(step: WorkflowStep, context: ExecutionContext) {
    const tools = await this.getAvailableTools(context.connections);
    
    return await this.run({
      messages: [{ content: step.instruction, role: 'user' }],
      tools,
      context
    });
  }
}
```

### Real-time Communication

Server-Sent Events for real-time updates:

```typescript
// lib/sse/execution-stream.ts
export class ExecutionStream {
  private subscribers = new Map<string, Response>();
  
  subscribe(executionId: string, response: Response) {
    this.subscribers.set(executionId, response);
  }
  
  broadcast(executionId: string, event: ExecutionEvent) {
    const subscriber = this.subscribers.get(executionId);
    if (subscriber) {
      subscriber.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  }
}
```

### Database Schema

Key database tables for runtime engine:

```sql
-- Workflow executions
CREATE TABLE workflow_executions (
  id VARCHAR PRIMARY KEY,
  workflow_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  parameters JSONB,
  configuration JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step executions
CREATE TABLE step_executions (
  id VARCHAR PRIMARY KEY,
  execution_id VARCHAR REFERENCES workflow_executions(id),
  step_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Execution logs
CREATE TABLE execution_logs (
  id VARCHAR PRIMARY KEY,
  execution_id VARCHAR REFERENCES workflow_executions(id),
  step_id VARCHAR,
  level VARCHAR NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE execution_metrics (
  id VARCHAR PRIMARY KEY,
  execution_id VARCHAR REFERENCES workflow_executions(id),
  metric_name VARCHAR NOT NULL,
  value NUMERIC,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

### Optimization Strategies

1. **Streaming Data**: Use Server-Sent Events for real-time updates
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Cache frequently accessed execution data
4. **Compression**: Compress large payloads (logs, metrics)
5. **Lazy Loading**: Load detailed data only when requested

### Scalability Features

1. **Horizontal Scaling**: Support multiple WebContainer instances
2. **Load Balancing**: Distribute executions across available resources
3. **Queue Management**: Use Redis for execution queue management
4. **Monitoring**: Comprehensive metrics and alerting system

This mapping provides the foundation for implementing a robust, scalable runtime engine that can handle complex workflow executions with comprehensive monitoring, debugging, and management capabilities.