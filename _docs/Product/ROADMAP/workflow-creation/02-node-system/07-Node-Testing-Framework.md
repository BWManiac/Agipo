# Node Testing Framework

**Status:** Draft
**Priority:** P1
**North Star:** User generates custom code node, clicks "Test", inputs sample job posting data, and sees extracted requirements — all before deploying the workflow.

---

## Problem Statement

Currently, the only way to verify a workflow step works correctly is to run the entire workflow. This is:
1. **Slow** — Full execution for one step test
2. **Expensive** — Uses real API calls, tokens, connections
3. **Risky** — May affect real data or external systems
4. **Frustrating** — Hard to isolate which step failed

**The Gap:** No isolated testing for individual workflow nodes.

---

## User Value

- **Fast iteration** — Test a node in seconds, not minutes
- **Safe experimentation** — No real side effects during testing
- **Clear debugging** — See exactly what a node produces
- **Confidence before deploy** — Know the node works before running full workflow
- **Learning tool** — Understand how steps transform data

---

## User Flows

### Flow 1: Test Custom Code Node

```
1. User has custom code node with generated code
2. User clicks "Test" button on node
3. Test panel opens with:
   - Input data editor (pre-populated from schema)
   - Run button
   - Output area
4. User modifies sample input if needed
5. User clicks "Run Test"
6. System executes code in isolated environment
7. Results displayed:
   - Output data (JSON formatted)
   - Execution time
   - Console logs (if any)
8. User iterates: modify input, run again
```

### Flow 2: Test Composio Tool Node

```
1. User has Gmail "Send Email" node
2. User clicks "Test" with "Dry Run" option
3. Test panel shows:
   - Input fields (recipient, subject, body)
   - "Dry Run" toggle (default: ON)
4. User fills in test data
5. User clicks "Run Test"
6. Dry Run mode:
   - Validates inputs against schema
   - Returns mock response: { success: true, messageId: "test-123" }
   - Does NOT actually send email
7. User sees validation passed, output shape correct
```

### Flow 3: Test Browser Automation Node

```
1. User has "Extract Job Requirements" browser node
2. User clicks "Test"
3. Test panel shows:
   - URL input
   - "Live Preview" option
4. User enters job posting URL
5. User clicks "Run Test"
6. System:
   - Opens Anchor browser session (or headless)
   - Navigates to URL
   - Executes extraction
   - Returns extracted data
7. User sees extracted requirements
8. User can adjust extraction logic and re-test
```

### Flow 4: Test with Previous Step Data

```
1. User has multi-step workflow
2. User wants to test Step 3
3. User clicks "Test" on Step 3
4. System offers:
   - "Use sample data" (manual entry)
   - "Use previous run data" (from last execution)
   - "Generate sample data" (AI-generated)
5. User selects "Use previous run data"
6. System loads actual output from Step 2's last run
7. User can modify and run test
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/` | Workflow execution | `services/executor.ts` |
| `lib/packages/` | WebContainer execution | Package bundling |
| `app/api/browser-automation/` | Browser execution | Anchor integration |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution environment | WebContainer for code, mock for integrations | Isolation, speed |
| Integration testing | Dry run mode by default | Prevent accidental side effects |
| Browser testing | Optional live mode | Balance between accuracy and speed |
| Data persistence | Per-session test history | Quick iteration without clutter |
| AI node testing | Real API calls (user choice) | AI results need actual model |

---

## Architecture

### Test Execution Pipeline

```
Test Request (node, inputData, options)
              ↓
┌─────────────────────────────────────────┐
│         Node Type Router                │
│  - Custom code → WebContainer           │
│  - Composio tool → Mock or Live         │
│  - Browser → Headless or Live           │
│  - AI/LLM → Mock or Real API            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Execution Environment           │
│  - Isolated sandbox                     │
│  - Timeout enforcement                  │
│  - Output capture                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Result Processing               │
│  - Format output                        │
│  - Capture logs                         │
│  - Calculate metrics                    │
└─────────────────────────────────────────┘
              ↓
Test Result (output, logs, timing, status)
```

### Test Modes by Node Type

| Node Type | Default Mode | Alternative | Notes |
|-----------|-------------|-------------|-------|
| Custom Code | WebContainer | — | Always isolated |
| Composio Tool | Dry Run (mock) | Live | User confirms for live |
| Browser | Headless | Live preview | User can watch |
| LLM/AI | Real API | Mock | Mock uses cached responses |
| Records/Data | Live (read-only) | Mock | No writes in test |

### Mock Response System

```typescript
interface MockConfig {
  toolId: string;
  response: MockResponse;
  delay?: number;        // Simulate latency
  errorRate?: number;    // Simulate failures
}

interface MockResponse {
  successful: true;
  data: Record<string, any>;
} | {
  successful: false;
  error: string;
}

// Example mocks
const MOCK_RESPONSES: Record<string, MockResponse> = {
  'GMAIL_SEND_EMAIL': {
    successful: true,
    data: { messageId: 'test-msg-123', threadId: 'test-thread-456' }
  },
  'SLACK_POST_MESSAGE': {
    successful: true,
    data: { ts: '1234567890.123456', channel: 'C1234567890' }
  },
  // ... more mocks
};
```

---

## Constraints

- **Isolation** — Tests must not affect real data
- **Timeouts** — Max 60 seconds for test execution
- **Resource limits** — Memory and CPU constraints in WebContainer
- **API costs** — AI node tests use real tokens (user warned)
- **Connection requirements** — Some tests need active integrations

---

## Success Criteria

- [ ] Custom code nodes can be tested in isolation
- [ ] Composio tools have dry run mode
- [ ] Browser nodes support headless testing
- [ ] Test results show output, logs, and timing
- [ ] Previous run data can be used as test input
- [ ] AI-generated sample data option works
- [ ] Error states clearly displayed
- [ ] Test history available during session

---

## Out of Scope

- Automated test suites (CI/CD integration)
- Test coverage metrics
- Regression testing
- Performance benchmarking
- Multi-node integration tests

---

## Open Questions

- Should we cache AI responses for repeat testing?
- How do we handle tests that need authentication?
- Should test results persist across sessions?
- How do we generate realistic sample data?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Test Panel | Main testing UI | Input editor, run button, output |
| Mode Selector | Test mode options | Dry run, live, headless toggles |
| Results View | Test output display | JSON output, logs, timing |
| Error State | Failed test display | Error message, stack trace |
| Data Source | Input data options | Sample, previous, generated |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── node-testing/
│   ├── test-panel.html
│   ├── mode-selector.html
│   ├── results-view.html
│   ├── error-state.html
│   └── data-source.html
```

---

## References

- WebContainer: https://webcontainers.io/
- Composio tool mocking: Custom implementation
- Browser headless mode: Anchor API
