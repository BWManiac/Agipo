# Agent Workflow Bindings

> Enables users to assign workflows to agents with connection bindings.

**Endpoint:** `GET/POST /api/workforce/[agentId]/workflows`  
**Auth:** Not required (agent scoped)

---

## Purpose

Manages workflow assignments for agents. When a workflow is assigned to an agent, the user must bind their connections (Gmail, Slack, etc.) to the workflow's required toolkits. This endpoint handles fetching and saving these bindings, which are persisted per agent in the agent's config file.

---

## Approach

Workflow bindings are stored in the agent's config file (`_tables/agents/{filename}.ts`) under the `workflowBindings` field. Each binding maps a workflow ID to connection IDs for required toolkits. Bindings are validated before saving to ensure all required connections are provided.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Extract agentId from params
├── Call getWorkflowBindings(agentId)
├── Return { bindings: WorkflowBinding[] }
└── Handle errors gracefully
```

**POST:**
```
POST(request, { params }): NextResponse
├── Extract agentId from params
├── Parse body: { bindings: WorkflowBinding[] }
├── Validate each binding:
│   ├── Check workflow exists
│   ├── Verify all requiredConnections are bound
│   └── Return errors if invalid
├── Call updateWorkflowBindings(agentId, bindings)
├── Return { success: true }
└── Handle errors gracefully
```

---

## Input

**POST Body:**
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
```json
{
  "success": true
}
```

**POST Error (400):**
```json
{
  "error": "Invalid binding for workflow wf-abc123: Missing connection binding for gmail"
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| WorkflowEditorPanel | `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Fetch current bindings, save new assignments |
| useAgentDetails | `app/(pages)/workforce/components/agent-modal/hooks/useAgentDetails.ts` | Load bindings for CapabilitiesTab display |

---

## Related Docs

- Phase 10: Agent Integration - `_docs/_tasks/16-workflows-f/10-Phase10-Agent-Integration.md`
- Workflow Loader Service - `app/api/workflows/services/workflow-loader.ts`
- Agent Config Service - `app/api/workforce/services/agent-config.ts`

---

## Notes

- Only transpiled workflows can be assigned (workflow.ts must exist)
- Bindings are validated against workflow metadata to ensure all required connections are provided
- Each agent has independent workflow bindings (same workflow, different agents = different connections)

