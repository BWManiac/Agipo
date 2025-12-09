# Agent Workflow Bindings

> Manages workflow assignments for an agent, enabling users to assign workflows to agents with required connection bindings and validate that all connections are properly configured.

**Endpoint:** `GET /api/workforce/[agentId]/workflows` (get bindings)  
**Endpoint:** `POST /api/workforce/[agentId]/workflows` (save bindings)  
**Auth:** None

---

## Purpose

Enables users to assign workflows to agents and configure which connections each workflow should use. When users assign a workflow to an agent, they must also specify which connection to use for each required toolkit (e.g., Gmail workflow needs a Gmail connection). This endpoint validates that all required connections are bound before saving, ensuring workflows can execute successfully. This powers the workflow assignment UI in the agent modal's Capabilities tab.

---

## Approach

For GET requests, loads workflow bindings from the agent config. For POST requests, validates each workflow binding by checking that all required connections are provided, then saves the bindings to the agent config. Validation uses the workflow loader service to check required connections against what's provided in the binding.

---

## Pseudocode

```
GET(request, context): NextResponse
├── Extract agentId from route params
├── **Call `getWorkflowBindings(agentId)`** from agent-config service
└── Return { bindings: WorkflowBinding[] }

POST(request, context): NextResponse
├── Extract agentId from route params
├── Parse request body for bindings array
├── Validate bindings is an array
├── For each binding:
│   ├── **Call `validateWorkflowBinding(binding)`** from workflow-loader
│   └── If invalid: Return 400 with validation errors
├── **Call `updateWorkflowBindings(agentId, bindings)`** from agent-config service
└── Return { success: true }
```

---

## Input

**GET:** None

**POST:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bindings` | array | Yes | Array of WorkflowBinding objects |

**Example Request:**
```json
{
  "bindings": [
    {
      "workflowId": "wf-abc123",
      "connectionBindings": {
        "gmail": "ca_xyz789",
        "slack": "ca_def456"
      }
    }
  ]
}
```

---

## Output

**GET Response:**

| Field | Type | Description |
|-------|------|-------------|
| `bindings` | array | Array of workflow bindings |

**Example GET Response:**
```json
{
  "bindings": [
    {
      "workflowId": "wf-abc123",
      "connectionBindings": {
        "gmail": "ca_xyz789",
        "slack": "ca_def456"
      }
    }
  ]
}
```

**POST Response:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether bindings were saved successfully |

**Example POST Response:**
```json
{
  "success": true
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Capabilities Slice | `app/(pages)/workforce/components/agent-modal/store/slices/capabilitiesSlice.ts` | Fetch and save workflow bindings |
| Workflow Editor Panel | `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Assign workflows to agents |

---

## Related Docs

- Agent Config Service - `app/api/workforce/services/agent-config.ts`
- Workflow Loader Service - `app/api/workflows/services/workflow-loader.ts`
- `/api/workforce/[agentId]/workflows/available` - Lists workflows available for assignment

---

## Notes

Validation ensures that all required connections (from workflow metadata) are provided in the binding. NO_AUTH toolkits (like browser_tool) don't require connections and are excluded from validation. If validation fails, the error response includes which workflow failed and what connections are missing.

---

## Future Improvements

- [ ] Add partial update support (update single binding)
- [ ] Add connection validation (verify connections exist and are active)
- [ ] Add workflow execution test endpoint
