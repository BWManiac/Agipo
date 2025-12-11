# Task: Node Testing Framework

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/02-node-system/07-Node-Testing-Framework.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Build an isolated testing framework for workflow nodes. Users can test individual nodes with sample data before running the full workflow, with support for different test modes (dry run, live, headless) depending on node type.

### Relevant Research

The workflow system executes steps in sequence, with each step receiving input from the previous step. Testing needs to:
1. Execute a single node in isolation
2. Provide mock or sample input data
3. Capture and display output
4. Support different execution modes for different node types

Key integration points:
- WebContainer for custom code execution
- Composio API for integration testing
- Anchor API for browser automation testing
- AI SDK for LLM node testing

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/testing.ts` | Create | Testing types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/test/route.ts` | Create | Test execution endpoint | A |
| `app/api/workflows/test/sample/route.ts` | Create | Generate sample data | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/test-executor.ts` | Create | Test execution coordinator | A |
| `app/api/workflows/services/mock-provider.ts` | Create | Mock responses for integrations | A |
| `app/api/workflows/services/sample-generator.ts` | Create | AI sample data generation | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/testing-slice.ts` | Create | Test state management | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/NodeTestPanel.tsx` | Create | Main test panel | B |
| `app/(pages)/workflows/editor/components/TestInputEditor.tsx` | Create | Input data editor | B |
| `app/(pages)/workflows/editor/components/TestResultView.tsx` | Create | Result display | B |
| `app/(pages)/workflows/editor/components/TestModeSelector.tsx` | Create | Mode selection | B |

---

## Part A: Backend Test Execution System

### Goal

Build services for executing node tests with different modes and generating sample data.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/testing.ts` | Create | Types | ~100 |
| `app/api/workflows/test/route.ts` | Create | Endpoint | ~100 |
| `app/api/workflows/test/sample/route.ts` | Create | Sample endpoint | ~60 |
| `app/api/workflows/services/test-executor.ts` | Create | Executor | ~250 |
| `app/api/workflows/services/mock-provider.ts` | Create | Mocks | ~200 |
| `app/api/workflows/services/sample-generator.ts` | Create | Sample gen | ~150 |

### Pseudocode

#### `app/api/workflows/types/testing.ts`

```typescript
interface TestRequest {
  nodeId: string;
  nodeType: NodeType;
  nodeConfig: NodeConfig;
  inputData: Record<string, any>;
  testMode: TestMode;
  options?: TestOptions;
}

type TestMode =
  | 'isolated'      // WebContainer, no external calls
  | 'dry-run'       // Validate + mock response
  | 'live'          // Real execution
  | 'headless';     // Browser without UI

interface TestOptions {
  timeout?: number;           // Max execution time (ms)
  captureConsole?: boolean;   // Capture console.log
  previousRunId?: string;     // Use data from previous run
}

interface TestResult {
  success: boolean;
  output?: Record<string, any>;
  error?: TestError;
  logs: LogEntry[];
  metrics: TestMetrics;
  mode: TestMode;
}

interface TestError {
  message: string;
  stack?: string;
  line?: number;
  column?: number;
}

interface LogEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

interface TestMetrics {
  executionTime: number;      // ms
  memoryUsage?: number;       // bytes
  tokenUsage?: {              // for AI nodes
    prompt: number;
    completion: number;
  };
}

interface SampleDataRequest {
  schema: JSONSchema;
  nodeType: NodeType;
  nodeDescription?: string;
  count?: number;
}

interface SampleDataResponse {
  samples: Record<string, any>[];
  explanation?: string;
}
```

#### `app/api/workflows/services/test-executor.ts`

```
class TestExecutor {
  async execute(request: TestRequest): Promise<TestResult>
  ├── Validate request
  │   ├── Check nodeType is supported
  │   ├── Validate inputData against schema
  │   └── Check testMode is appropriate for nodeType
  ├── Route to appropriate executor
  │   ├── custom code → executeCustomCode()
  │   ├── composio tool → executeComposioTool()
  │   ├── browser → executeBrowserNode()
  │   └── llm/ai → executeLlmNode()
  ├── Wrap with timeout
  │   └── Enforce options.timeout (default 60s)
  ├── Capture logs and metrics
  └── Return TestResult

  async executeCustomCode(request: TestRequest): Promise<TestResult>
  ├── Get code from nodeConfig
  ├── Use code-executor service (from bespoke code)
  ├── Execute in WebContainer with inputData
  ├── Capture output and logs
  └── Return result

  async executeComposioTool(request: TestRequest): Promise<TestResult>
  ├── If testMode === 'dry-run'
  │   ├── Validate inputs against tool schema
  │   ├── Get mock response from mockProvider
  │   └── Return mock result
  ├── If testMode === 'live'
  │   ├── Warn: "This will execute a real action"
  │   ├── Get user's connection for tool
  │   ├── Execute via Composio
  │   └── Return real result
  └── Return result

  async executeBrowserNode(request: TestRequest): Promise<TestResult>
  ├── If testMode === 'headless'
  │   ├── Create headless Anchor session
  │   ├── Execute browser action
  │   ├── Capture result
  │   └── Close session
  ├── If testMode === 'live'
  │   ├── Create visible Anchor session
  │   ├── Return debugUrl to user
  │   ├── Execute action
  │   └── Return result
  └── Return result

  async executeLlmNode(request: TestRequest): Promise<TestResult>
  ├── If testMode === 'dry-run'
  │   ├── Get cached response if available
  │   └── Return cached or mock
  ├── If testMode === 'live'
  │   ├── Execute real LLM call
  │   ├── Track token usage
  │   ├── Cache response for re-testing
  │   └── Return result
  └── Return result
}
```

#### `app/api/workflows/services/mock-provider.ts`

```
class MockProvider {
  private mocks: Map<string, MockConfig>

  constructor()
  ├── Load mock configurations
  └── Initialize with common tool mocks

  getMock(toolId: string): MockResponse
  ├── Look up in mocks map
  ├── If found, return configured response
  ├── If not found, generate generic success response
  │   └── { successful: true, data: { result: "mock" } }
  └── Return mock

  registerMock(toolId: string, config: MockConfig): void
  └── Add to mocks map

  // Pre-configured mocks
  private readonly DEFAULT_MOCKS = {
    // Email
    'GMAIL_SEND_EMAIL': {
      successful: true,
      data: { messageId: 'test-123', threadId: 'test-thread-456', labelIds: ['SENT'] }
    },
    'GMAIL_LIST_EMAILS': {
      successful: true,
      data: {
        emails: [
          { id: '1', subject: 'Test Email 1', from: 'test@example.com' },
          { id: '2', subject: 'Test Email 2', from: 'sender@example.com' }
        ]
      }
    },

    // Slack
    'SLACK_POST_MESSAGE': {
      successful: true,
      data: { ts: '1234567890.123456', channel: 'C1234567890' }
    },

    // Calendar
    'GOOGLE_CALENDAR_CREATE_EVENT': {
      successful: true,
      data: { eventId: 'event-test-123', htmlLink: 'https://calendar.google.com/...' }
    },

    // GitHub
    'GITHUB_CREATE_ISSUE': {
      successful: true,
      data: { number: 42, url: 'https://github.com/user/repo/issues/42' }
    },

    // Browser
    'BROWSER_TOOL_NAVIGATE': {
      successful: true,
      data: { url: 'https://example.com', title: 'Example Domain' }
    },
    'BROWSER_TOOL_FETCH_WEBPAGE': {
      successful: true,
      data: {
        title: 'Test Page',
        content: 'This is test content from the webpage.',
        url: 'https://example.com'
      }
    },
  };
}
```

#### `app/api/workflows/services/sample-generator.ts`

```
class SampleGenerator {
  async generateSample(request: SampleDataRequest): Promise<SampleDataResponse>
  ├── If schema is simple
  │   └── Generate deterministic sample
  ├── If schema is complex or nodeDescription provided
  │   └── Use AI to generate realistic sample
  └── Return samples

  generateDeterministic(schema: JSONSchema): Record<string, any>
  ├── For each property in schema
  │   ├── string → "sample_" + propertyName
  │   ├── number → 42
  │   ├── boolean → true
  │   ├── array → [generateDeterministic(items)]
  │   ├── object → recurse
  │   └── enum → first value
  └── Return generated object

  async generateWithAI(
    schema: JSONSchema,
    description: string,
    count: number
  ): Promise<Record<string, any>[]>
  ├── Build prompt
  │   ├── "Generate {count} realistic sample(s) matching this schema:"
  │   ├── Include schema definition
  │   ├── Include description context
  │   └── "Make the data realistic and varied"
  ├── Call LLM with structured output
  │   └── Schema: z.array(zodFromJsonSchema(schema))
  └── Return generated samples
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Custom code executes | Test custom node, verify output |
| AC-A.2 | Dry run returns mock | Test Composio tool in dry-run, verify mock |
| AC-A.3 | Live mode warns user | Request live mode, verify warning |
| AC-A.4 | Timeout enforced | Run slow code, verify timeout error |
| AC-A.5 | Logs captured | Test code with console.log, verify in logs |
| AC-A.6 | Sample data generates | Request sample for schema, verify valid JSON |

---

## Part B: Frontend Test UI

### Goal

Create UI components for testing nodes with input editors, result views, and mode selection.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/testing-slice.ts` | Create | State | ~80 |
| `app/(pages)/workflows/editor/components/NodeTestPanel.tsx` | Create | Main panel | ~200 |
| `app/(pages)/workflows/editor/components/TestInputEditor.tsx` | Create | Input editor | ~150 |
| `app/(pages)/workflows/editor/components/TestResultView.tsx` | Create | Results | ~120 |
| `app/(pages)/workflows/editor/components/TestModeSelector.tsx` | Create | Mode select | ~80 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/NodeTestPanel.tsx`

```
NodeTestPanel({ nodeId, onClose })
├── Fetch node data
├── State: inputData, testMode, result, isRunning
├── Layout
│   ├── Header
│   │   ├── "Test: {nodeName}"
│   │   ├── TestModeSelector
│   │   └── Close button
│   ├── Input section
│   │   ├── TestInputEditor
│   │   └── Data source options
│   │       ├── "Sample data" (default)
│   │       ├── "Previous run" (if available)
│   │       └── "Generate with AI"
│   ├── Run button
│   │   ├── Primary action
│   │   ├── Loading state when running
│   │   └── Keyboard shortcut (Cmd+Enter)
│   └── Results section
│       └── TestResultView
├── On run
│   ├── Validate inputData
│   ├── Set isRunning
│   ├── Call POST /api/workflows/test
│   ├── Update result
│   └── Clear isRunning
└── On mode change
    └── Update testMode, show mode-specific options
```

#### `app/(pages)/workflows/editor/components/TestInputEditor.tsx`

```
TestInputEditor({ schema, value, onChange })
├── JSON editor based on schema
│   ├── Monaco editor with JSON mode
│   ├── Schema validation
│   └── Autocomplete from schema
├── Schema-aware form (alternative view)
│   ├── For each property
│   │   ├── Label with type hint
│   │   ├── Appropriate input control
│   │   │   ├── string → text input
│   │   │   ├── number → number input
│   │   │   ├── boolean → checkbox
│   │   │   ├── array → list builder
│   │   │   └── object → nested form
│   │   └── Required indicator
│   └── Toggle: "Raw JSON" / "Form"
├── Validation
│   ├── Real-time schema validation
│   ├── Error highlighting
│   └── Error messages
└── Actions
    ├── "Clear" button
    ├── "Generate sample" button
    └── "Load from previous" button
```

#### `app/(pages)/workflows/editor/components/TestResultView.tsx`

```
TestResultView({ result })
├── If no result yet
│   └── Empty state: "Run a test to see results"
├── If result.success
│   ├── Success indicator
│   ├── Output section
│   │   ├── JSON formatted output
│   │   ├── Copy button
│   │   └── Expand/collapse for large output
│   ├── Logs section (collapsible)
│   │   └── Scrollable log list
│   └── Metrics section
│       ├── Execution time
│       ├── Memory usage (if available)
│       └── Token usage (for AI nodes)
├── If !result.success
│   ├── Error indicator
│   ├── Error message
│   ├── Stack trace (collapsible)
│   ├── Line number link (if available)
│   └── Suggestions for common errors
└── Mode badge showing which mode was used
```

#### `app/(pages)/workflows/editor/components/TestModeSelector.tsx`

```
TestModeSelector({ nodeType, value, onChange })
├── Get available modes for nodeType
│   ├── custom: ['isolated']
│   ├── composio: ['dry-run', 'live']
│   ├── browser: ['headless', 'live']
│   └── llm: ['dry-run', 'live']
├── Radio group or segmented control
│   ├── For each available mode
│   │   ├── Mode label
│   │   ├── Brief description
│   │   └── Warning badge if live mode
│   └── Selected state
├── Live mode confirmation
│   ├── If selecting live mode
│   └── Show warning: "This will execute a real action"
└── On change
    └── Call onChange with selected mode
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Test panel opens | Click test on node, verify panel |
| AC-B.2 | Input editor validates | Enter invalid JSON, verify error |
| AC-B.3 | Run executes test | Click run, verify result appears |
| AC-B.4 | Results display correctly | Test successful node, verify output shown |
| AC-B.5 | Error displays clearly | Test failing node, verify error shown |
| AC-B.6 | Mode selector works | Change mode, verify test mode changes |
| AC-B.7 | Generate sample works | Click generate, verify realistic data |

---

## User Flows

### Flow 1: Test Custom Code Node

```
1. User clicks "Test" on custom code node
2. NodeTestPanel opens
3. Input schema displayed in TestInputEditor
4. User clicks "Generate sample"
5. Sample data populates editor
6. User clicks "Run Test"
7. Code executes in WebContainer
8. TestResultView shows output
9. User sees formatted JSON result
10. User can modify input and re-test
```

---

## Out of Scope

- Automated test suites
- Test coverage metrics
- Integration tests (multi-node)
- Performance benchmarking

---

## Open Questions

- [ ] Should we support test fixtures?
- [ ] How do we handle tests that need auth?
- [ ] Should test history persist?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
