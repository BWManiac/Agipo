# Planner System - API Specification

## Scheduled Jobs

### Create Job
```http
POST /api/workforce/[agentId]/planner/jobs
{
  "name": "Daily Report",
  "schedule": "0 9 * * *",
  "action": "chat",
  "template": "Generate daily report for {{date}}",
  "enabled": true
}
```

Response:
```json
{
  "success": true,
  "job": {
    "id": "job-123",
    "name": "Daily Report",
    "schedule": "0 9 * * *",
    "nextRun": "2024-01-16T09:00:00Z"
  }
}
```

### List Jobs
```http
GET /api/workforce/[agentId]/planner/jobs
```

### Update Job
```http
PATCH /api/workforce/[agentId]/planner/jobs/[jobId]
{
  "enabled": false
}
```

### Delete Job
```http
DELETE /api/workforce/[agentId]/planner/jobs/[jobId]
```

---

## Event Triggers

### Create Trigger
```http
POST /api/workforce/[agentId]/planner/triggers
{
  "name": "GitHub Issue Handler",
  "app": "github",
  "event": "issue.created",
  "action": "workflow",
  "workflowId": "workflow-456",
  "enabled": true
}
```

### List Triggers
```http
GET /api/workforce/[agentId]/planner/triggers
```

### Webhook Handler
```http
POST /api/workforce/triggers/webhook
Headers:
  x-composio-signature: <signature>
Body:
{
  "event": {
    "type": "issue.created",
    "data": { ... }
  },
  "metadata": {
    "agentId": "agent-123",
    "triggerId": "trigger-456"
  }
}
```

---

## Execution Endpoints

### Execute Chat
```http
POST /api/workforce/planner/execute/chat
{
  "agentId": "agent-123",
  "message": "Generate report",
  "variables": {
    "date": "2024-01-15"
  }
}
```

### Execute Workflow  
```http
POST /api/workforce/planner/execute/workflow
{
  "workflowId": "workflow-456",
  "input": { ... }
}
```