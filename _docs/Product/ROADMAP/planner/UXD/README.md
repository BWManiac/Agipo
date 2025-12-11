# Planner System UXD

**Created:** December 2024  
**Status:** UXD Design Phase  
**Related Roadmap:** `../01-Planner-System.md`

---

## Overview

The Planner System enables agents to perform automated tasks through scheduled jobs and event-driven triggers. Users can create recurring tasks (e.g., "Check job boards every Monday") and reactive behaviors (e.g., "When I receive an email, analyze and respond"). This transforms agents from reactive to proactive assistants.

### Design Philosophy

- **Automation First** - Reduce manual intervention through smart scheduling
- **Event-Driven Intelligence** - Agents react to real-world events automatically
- **Dual Execution Modes** - Choose between starting conversations or executing workflows
- **Visual Scheduling** - Intuitive cron expression creation and management
- **Background Intelligence** - Jobs run seamlessly without user presence
- **Integration Native** - Built on Inngest (scheduling) and Composio (events)

---

## UXD File Manifest

| # | File | Description | Priority |
|---|------|-------------|----------|
| 01 | `01-planner-dashboard.html` | Main planner interface with job/trigger overview | Core |
| 02 | `02-create-scheduled-job.html` | Create and configure recurring scheduled jobs | Core |
| 03 | `03-create-event-trigger.html` | Set up event-driven automation triggers | Core |
| 04 | `04-job-execution-modes.html` | Choose chat template vs workflow execution | Core |
| 05 | `05-cron-schedule-picker.html` | Visual cron expression builder and presets | Core |
| 06 | `06-template-variable-editor.html` | Chat template editor with variable support | Core |
| 07 | `07-execution-monitoring.html` | Monitor active jobs and trigger executions | Important |
| 08 | `08-planner-error-handling.html` | Handle job failures and retry logic | Important |
| 09 | `09-job-history-logs.html` | View execution history and performance | Nice to have |
| 10 | `10-bulk-job-management.html` | Manage multiple jobs and triggers efficiently | Nice to have |
| -- | `Frontend-Backend-Mapping.md` | API endpoint documentation | Core |

---

## Key Features to Demonstrate

### 1. Planner Dashboard (`01-planner-dashboard.html`)
- Overview of all scheduled jobs and triggers
- Visual status indicators (active, paused, error)
- Next execution times and recent activity
- Quick action controls (pause, edit, delete)
- Performance metrics and success rates

### 2. Scheduled Job Creation (`02-create-scheduled-job.html`)
- Job type selection (chat template or workflow)
- Schedule configuration with cron expressions
- Template message creation with variables
- Workflow selection and parameter mapping
- Preview and validation before creation

### 3. Event Trigger Setup (`03-create-event-trigger.html`)
- Integration source selection (Gmail, Slack, etc.)
- Event type filtering and conditions
- Action configuration (chat or workflow)
- Webhook setup and connection testing
- Security and permission management

### 4. Execution Mode Selection (`04-job-execution-modes.html`)
- Compare chat template vs workflow execution
- Template variable system demonstration
- Workflow input mapping interface
- Execution context and data flow
- Preview of expected outcomes

### 5. Schedule Configuration (`05-cron-schedule-picker.html`)
- Visual cron expression builder
- Common schedule presets (daily, weekly, monthly)
- Timezone handling and DST considerations
- Schedule conflict detection
- Human-readable schedule descriptions

---

## Planner System Components

### Scheduled Jobs
- **Daily Tasks** - Morning reports, data syncing, health checks
- **Weekly Reviews** - Performance summaries, trend analysis
- **Monthly Operations** - Backup routines, compliance checks
- **Custom Intervals** - User-defined frequencies and patterns

### Event Triggers
- **Email Events** - New messages, specific senders, keywords
- **Calendar Events** - Meeting reminders, deadline alerts
- **Integration Events** - CRM updates, task completions
- **System Events** - Error notifications, performance thresholds

### Execution Actions
- **Chat Templates** - Start conversations with pre-filled context
- **Workflow Execution** - Run predefined automation workflows
- **Hybrid Approaches** - Complex multi-step automated processes
- **Notification Systems** - Alert users about important events

---

## Template Variable System

### Available Variables (Scheduled Jobs)
```typescript
interface ScheduledJobVariables {
  // Time-based variables
  date: string;           // Current date (YYYY-MM-DD)
  time: string;           // Current time (HH:MM:SS)
  dayOfWeek: string;      // Day name (Monday, Tuesday, etc.)
  
  // User context
  userName: string;       // User's display name
  userEmail: string;      // User's email address
  
  // Agent context
  agentName: string;      // Agent's name
  agentRole: string;      // Agent's configured role
  
  // Custom variables (user-defined)
  [key: string]: any;     // Custom variables from agent config
}
```

### Available Variables (Event Triggers)
```typescript
interface EventTriggerVariables {
  // Event metadata
  eventType: string;      // Type of event (email, calendar, etc.)
  eventSource: string;    // Source system (Gmail, Slack, etc.)
  eventTime: string;      // When event occurred
  
  // Event-specific data (varies by event type)
  // Email events
  emailSubject?: string;  // Email subject line
  emailFrom?: string;     // Sender email address
  emailBody?: string;     // Email content
  
  // Calendar events
  meetingTitle?: string;  // Meeting subject
  meetingTime?: string;   // Meeting start time
  attendees?: string[];   // Meeting participants
  
  // Generic event payload
  eventData: any;         // Full event payload from source
}
```

---

## Integration Architecture

### Inngest Integration (Scheduled Jobs)
- **Background Execution** - Jobs run without user sessions
- **Cron Scheduling** - Flexible time-based triggers
- **Retry Logic** - Automatic failure recovery
- **Observability** - Built-in monitoring and logging

### Composio Integration (Event Triggers)
- **Webhook Management** - Automatic webhook registration
- **Event Filtering** - Advanced condition matching
- **Security** - Signature verification and authentication
- **Multi-Platform** - Support for 100+ integrations

### Agent Integration
- **Chat Service** - Programmatic conversation starting
- **Workflow Engine** - Direct workflow execution
- **Context Injection** - Variable replacement and data passing
- **State Management** - Persistent execution context

---

## Error Handling Patterns

### Job Execution Errors
- **Temporary Failures** - Automatic retry with exponential backoff
- **Persistent Issues** - Alert user and provide diagnostic information
- **Network Problems** - Queue execution for later retry
- **Configuration Errors** - Validation before job creation

### Event Trigger Errors
- **Webhook Failures** - Retry mechanism for missed events
- **Authentication Issues** - Connection refresh and re-authorization
- **Rate Limiting** - Intelligent backoff and queueing
- **Invalid Data** - Graceful handling of malformed events

### User Experience Errors
- **Clear Error Messages** - Explain what went wrong and how to fix
- **Recovery Suggestions** - Actionable steps to resolve issues
- **Fallback Options** - Alternative approaches when primary method fails
- **Support Context** - Detailed information for troubleshooting

---

## Performance Considerations

### Scalability
- **Job Queuing** - Handle high volumes of scheduled executions
- **Resource Management** - Prevent resource exhaustion
- **Parallel Processing** - Efficient concurrent job execution
- **Priority Queues** - Critical jobs execute first

### Optimization
- **Template Caching** - Pre-compile frequently used templates
- **Connection Pooling** - Reuse integration connections
- **Batch Operations** - Group related operations together
- **Smart Scheduling** - Avoid peak load times

### Monitoring
- **Execution Metrics** - Success rates, duration, resource usage
- **Health Checks** - System status and availability monitoring
- **Performance Alerts** - Notification of degraded performance
- **Capacity Planning** - Predict and prepare for growth

---

## Security and Privacy

### Access Control
- **Job Ownership** - Users only see their own jobs and triggers
- **Permission Scoping** - Limit integration access appropriately
- **Audit Logging** - Track all job and trigger operations
- **Data Isolation** - Prevent cross-user data leakage

### Data Protection
- **Template Sanitization** - Prevent script injection attacks
- **Webhook Security** - Verify incoming webhook signatures
- **Encryption** - Protect sensitive job configuration data
- **Retention Policies** - Automatic cleanup of old execution data

### Integration Security
- **OAuth Management** - Secure token storage and refresh
- **Scope Limitation** - Request minimal necessary permissions
- **Connection Monitoring** - Detect and respond to security events
- **Compliance** - Meet data protection regulations

---

## Future Enhancements

### Advanced Features
- **Conditional Logic** - Complex if-then-else job execution
- **Job Dependencies** - Sequential execution chains
- **Dynamic Scheduling** - Adjust schedules based on conditions
- **ML-Powered Optimization** - Learn optimal execution times

### Enterprise Features
- **Team Collaboration** - Shared jobs and triggers across teams
- **Approval Workflows** - Review and approve automated tasks
- **Compliance Monitoring** - Track adherence to business rules
- **Advanced Analytics** - Deep insights into automation performance

### Integration Expansion
- **Custom Webhooks** - Support for any webhook-enabled service
- **API Integrations** - Direct API polling for non-webhook services
- **IoT Events** - Respond to sensor data and device events
- **Business Intelligence** - Trigger on data thresholds and KPIs