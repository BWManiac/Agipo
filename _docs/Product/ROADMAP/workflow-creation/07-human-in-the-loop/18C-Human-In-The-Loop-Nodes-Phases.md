# Phases: Human-in-the-Loop Nodes

**Task:** `18A-Human-In-The-Loop-Nodes-Task.md`  
**Status:** Not Started  
**Last Updated:** 2025-12-11

---

## Phase 1: Suspension Node Types and Transpilation

### Goal
Implement suspension node types in the workflow editor and transpilation to Mastra's suspend/resume primitives.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `lib/workflow/types/suspension.ts` | ~100 | Suspension node type definitions |
| `lib/workflow/types/nodes.ts` | ~50 | Add suspension nodes to node types |
| `app/api/workflows/services/step-generator.ts` | ~150 | Add suspension transpilation |
| `app/api/workflows/services/suspension-schema.ts` | ~120 | Generate suspend/resume schemas |

### Implementation

#### 1. Define suspension node types

```typescript
// lib/workflow/types/suspension.ts
import { z } from 'zod';

export const ApprovalNodeSchema = z.object({
  type: z.literal('approval'),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  approvers: z.array(z.object({
    userId: z.string(),
    email: z.string(),
    role: z.string().optional()
  })),
  approvalStrategy: z.enum(['any_one', 'majority', 'all', 'specific_count']),
  requiredApprovals: z.number().optional(), // For 'specific_count'
  timeout: z.object({
    duration: z.number(), // milliseconds
    action: z.enum(['auto_approve', 'auto_reject', 'escalate'])
  }).optional(),
  contextData: z.array(z.object({
    field: z.string(),
    label: z.string(),
    required: z.boolean().default(false)
  })),
  rejectionHandling: z.enum(['stop_workflow', 'retry_step', 'alternate_path'])
});

export const DataReviewNodeSchema = z.object({
  type: z.literal('data_review'),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  reviewers: z.array(z.object({
    userId: z.string(),
    email: z.string()
  })),
  dataFields: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    editable: z.boolean().default(true),
    required: z.boolean().default(false),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.string()).optional()
    }).optional()
  })),
  allowModification: z.boolean().default(true),
  requireComment: z.boolean().default(false)
});

export const ChoiceNodeSchema = z.object({
  type: z.literal('choice'),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  assignedUsers: z.array(z.object({
    userId: z.string(),
    email: z.string()
  })),
  choices: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    nextSteps: z.array(z.string()) // Step IDs to execute
  })),
  defaultChoice: z.string().optional(),
  allowMultipleSelections: z.boolean().default(false)
});

export const SuspensionNodeSchema = z.union([
  ApprovalNodeSchema,
  DataReviewNodeSchema,
  ChoiceNodeSchema
]);

export type SuspensionNode = z.infer<typeof SuspensionNodeSchema>;
export type ApprovalNode = z.infer<typeof ApprovalNodeSchema>;
export type DataReviewNode = z.infer<typeof DataReviewNodeSchema>;
export type ChoiceNode = z.infer<typeof ChoiceNodeSchema>;
```

#### 2. Add suspension transpilation to step generator

```typescript
// app/api/workflows/services/step-generator.ts (additions)
import { SuspensionNode } from '@/lib/workflow/types/suspension';

class StepGenerator {
  // Existing methods...
  
  generateSuspensionStep(node: SuspensionNode): string {
    switch (node.type) {
      case 'approval':
        return this.generateApprovalStep(node);
      case 'data_review':
        return this.generateDataReviewStep(node);
      case 'choice':
        return this.generateChoiceStep(node);
      default:
        throw new Error(`Unknown suspension type: ${(node as any).type}`);
    }
  }
  
  private generateApprovalStep(node: ApprovalNode): string {
    const suspendSchema = this.generateApprovalSuspendSchema(node);
    const resumeSchema = this.generateApprovalResumeSchema(node);
    
    return `
  .step({
    id: '${node.id}',
    description: '${node.description}',
    execute: async (ctx) => {
      // Prepare approval context
      const approvalData = {
        workflowId: ctx.workflowId,
        stepId: '${node.id}',
        requestedBy: ctx.userId,
        requestedAt: new Date().toISOString(),
        contextData: {
          ${node.contextData.map(field => 
            `${field.field}: ctx.get('${field.field}')`
          ).join(',\n          ')}
        },
        approvers: ${JSON.stringify(node.approvers)},
        strategy: '${node.approvalStrategy}',
        ${node.requiredApprovals ? `requiredApprovals: ${node.requiredApprovals},` : ''}
        ${node.timeout ? `timeout: ${JSON.stringify(node.timeout)},` : ''}
      };
      
      // Create approval task
      await createApprovalTask(approvalData);
      
      // Suspend workflow
      return ctx.suspend({
        schema: ${suspendSchema},
        data: approvalData
      });
    }
  })
  .resume({
    schema: ${resumeSchema},
    handler: async (ctx, resumeData) => {
      const { approved, rejectedBy, comments, modifiedData } = resumeData;
      
      if (!approved) {
        ${this.generateRejectionHandling(node.rejectionHandling)}
      }
      
      // Store approval result
      ctx.set('${node.id}_result', {
        approved,
        approvedBy: resumeData.approvedBy,
        rejectedBy,
        comments,
        approvedAt: new Date().toISOString()
      });
      
      return { approved };
    }
  })`;
  }
  
  private generateDataReviewStep(node: DataReviewNode): string {
    const suspendSchema = this.generateDataReviewSuspendSchema(node);
    const resumeSchema = this.generateDataReviewResumeSchema(node);
    
    return `
  .step({
    id: '${node.id}',
    description: '${node.description}',
    execute: async (ctx) => {
      const reviewData = {
        workflowId: ctx.workflowId,
        stepId: '${node.id}',
        requestedBy: ctx.userId,
        requestedAt: new Date().toISOString(),
        dataToReview: {
          ${node.dataFields.map(field => 
            `${field.field}: ctx.get('${field.field}')`
          ).join(',\n          ')}
        },
        reviewers: ${JSON.stringify(node.reviewers)},
        allowModification: ${node.allowModification},
        requireComment: ${node.requireComment}
      };
      
      await createReviewTask(reviewData);
      
      return ctx.suspend({
        schema: ${suspendSchema},
        data: reviewData
      });
    }
  })
  .resume({
    schema: ${resumeSchema},
    handler: async (ctx, resumeData) => {
      const { approved, modifiedData, comments } = resumeData;
      
      if (!approved) {
        ctx.bail(new Error('Data review rejected: ' + comments));
      }
      
      // Update context with reviewed/modified data
      ${node.dataFields.map(field => 
        field.editable 
          ? `if (modifiedData.${field.field} !== undefined) {
               ctx.set('${field.field}', modifiedData.${field.field});
             }`
          : ''
      ).filter(Boolean).join('\n      ')}
      
      ctx.set('${node.id}_result', {
        approved,
        reviewedBy: resumeData.reviewedBy,
        comments,
        reviewedAt: new Date().toISOString(),
        modificationsCount: Object.keys(modifiedData).length
      });
      
      return { approved, modifiedData };
    }
  })`;
  }
  
  private generateChoiceStep(node: ChoiceNode): string {
    const suspendSchema = this.generateChoiceSuspendSchema(node);
    const resumeSchema = this.generateChoiceResumeSchema(node);
    
    return `
  .step({
    id: '${node.id}',
    description: '${node.description}',
    execute: async (ctx) => {
      const choiceData = {
        workflowId: ctx.workflowId,
        stepId: '${node.id}',
        requestedBy: ctx.userId,
        requestedAt: new Date().toISOString(),
        choices: ${JSON.stringify(node.choices)},
        assignedUsers: ${JSON.stringify(node.assignedUsers)},
        allowMultipleSelections: ${node.allowMultipleSelections},
        ${node.defaultChoice ? `defaultChoice: '${node.defaultChoice}',` : ''}
        contextData: ctx.getAll()
      };
      
      await createChoiceTask(choiceData);
      
      return ctx.suspend({
        schema: ${suspendSchema},
        data: choiceData
      });
    }
  })
  .resume({
    schema: ${resumeSchema},
    handler: async (ctx, resumeData) => {
      const { selectedChoices, selectedBy, comments } = resumeData;
      
      ctx.set('${node.id}_result', {
        selectedChoices,
        selectedBy,
        comments,
        selectedAt: new Date().toISOString()
      });
      
      // Return choices for workflow routing
      return { 
        choices: selectedChoices,
        nextSteps: selectedChoices.flatMap(choiceId => {
          const choice = ${JSON.stringify(node.choices)}.find(c => c.id === choiceId);
          return choice?.nextSteps || [];
        })
      };
    }
  })`;
  }
  
  private generateRejectionHandling(handling: string): string {
    switch (handling) {
      case 'stop_workflow':
        return `ctx.bail(new Error('Approval rejected by ' + rejectedBy));`;
      case 'retry_step':
        return `
        // Mark for retry (implementation depends on retry mechanism)
        ctx.set('retryRequested', true);
        return { approved: false, retry: true };`;
      case 'alternate_path':
        return `
        ctx.set('alternatePathRequired', true);
        return { approved: false, useAlternatePath: true };`;
      default:
        return `ctx.bail(new Error('Approval rejected'));`;
    }
  }
}
```

#### 3. Create suspension schema generator

```typescript
// app/api/workflows/services/suspension-schema.ts
import { z } from 'zod';
import { ApprovalNode, DataReviewNode, ChoiceNode } from '@/lib/workflow/types/suspension';

export class SuspensionSchemaGenerator {
  generateApprovalSuspendSchema(node: ApprovalNode): string {
    const schema = z.object({
      workflowId: z.string(),
      stepId: z.string(),
      requestedBy: z.string(),
      requestedAt: z.string(),
      contextData: z.object(
        Object.fromEntries(
          node.contextData.map(field => [
            field.field,
            field.required ? z.any() : z.any().optional()
          ])
        )
      ),
      approvers: z.array(z.object({
        userId: z.string(),
        email: z.string(),
        role: z.string().optional()
      })),
      strategy: z.string(),
      requiredApprovals: z.number().optional(),
      timeout: z.object({
        duration: z.number(),
        action: z.string()
      }).optional()
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  generateApprovalResumeSchema(node: ApprovalNode): string {
    const schema = z.object({
      approved: z.boolean(),
      approvedBy: z.array(z.string()).optional(),
      rejectedBy: z.string().optional(),
      comments: z.string().optional(),
      approvedAt: z.string().optional(),
      rejectedAt: z.string().optional()
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  generateDataReviewSuspendSchema(node: DataReviewNode): string {
    const dataFieldsSchema = Object.fromEntries(
      node.dataFields.map(field => [
        field.field,
        this.getFieldSchema(field)
      ])
    );
    
    const schema = z.object({
      workflowId: z.string(),
      stepId: z.string(),
      requestedBy: z.string(),
      requestedAt: z.string(),
      dataToReview: z.object(dataFieldsSchema),
      reviewers: z.array(z.object({
        userId: z.string(),
        email: z.string()
      })),
      allowModification: z.boolean(),
      requireComment: z.boolean()
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  generateDataReviewResumeSchema(node: DataReviewNode): string {
    const modifiedDataSchema = Object.fromEntries(
      node.dataFields
        .filter(field => field.editable)
        .map(field => [field.field, z.any().optional()])
    );
    
    const schema = z.object({
      approved: z.boolean(),
      reviewedBy: z.string(),
      comments: node.requireComment ? z.string() : z.string().optional(),
      reviewedAt: z.string(),
      modifiedData: z.object(modifiedDataSchema)
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  generateChoiceSuspendSchema(node: ChoiceNode): string {
    const schema = z.object({
      workflowId: z.string(),
      stepId: z.string(),
      requestedBy: z.string(),
      requestedAt: z.string(),
      choices: z.array(z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
        nextSteps: z.array(z.string())
      })),
      assignedUsers: z.array(z.object({
        userId: z.string(),
        email: z.string()
      })),
      allowMultipleSelections: z.boolean(),
      defaultChoice: z.string().optional(),
      contextData: z.record(z.any())
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  generateChoiceResumeSchema(node: ChoiceNode): string {
    const schema = z.object({
      selectedChoices: node.allowMultipleSelections 
        ? z.array(z.string())
        : z.array(z.string()).length(1),
      selectedBy: z.string(),
      comments: z.string().optional(),
      selectedAt: z.string()
    });
    
    return `z.object(${JSON.stringify(schema.shape, null, 2)})`;
  }
  
  private getFieldSchema(field: any): any {
    let baseSchema;
    
    switch (field.type) {
      case 'string':
        baseSchema = z.string();
        if (field.validation?.pattern) {
          baseSchema = baseSchema.regex(new RegExp(field.validation.pattern));
        }
        if (field.validation?.min) {
          baseSchema = baseSchema.min(field.validation.min);
        }
        if (field.validation?.max) {
          baseSchema = baseSchema.max(field.validation.max);
        }
        break;
      case 'number':
        baseSchema = z.number();
        if (field.validation?.min !== undefined) {
          baseSchema = baseSchema.min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          baseSchema = baseSchema.max(field.validation.max);
        }
        break;
      case 'boolean':
        baseSchema = z.boolean();
        break;
      case 'array':
        baseSchema = z.array(z.any());
        break;
      default:
        baseSchema = z.any();
    }
    
    return field.required ? baseSchema : baseSchema.optional();
  }
}
```

### Testing

```bash
# Test suspension node transpilation
npm run test -- --grep "suspension transpilation"

# Test schema generation
npm run test -- --grep "suspension schemas"

# Test Mastra integration
npm run test -- --grep "suspend resume"
```

### Success Metrics

- [ ] Suspension nodes transpile to valid Mastra suspend/resume code
- [ ] Generated schemas validate suspension and resume data correctly
- [ ] Approval workflows can suspend and resume properly
- [ ] Data review workflows preserve context during suspension
- [ ] Choice nodes route workflow execution correctly
- [ ] Error handling works for rejection and timeout scenarios

---

## Phase 2: Human Task Management Interface

### Goal
Create the task management interface for humans to respond to suspended workflows.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/api/tasks/route.ts` | ~80 | Task CRUD endpoints |
| `app/api/tasks/[taskId]/approve/route.ts` | ~60 | Approval endpoint |
| `app/api/tasks/[taskId]/review/route.ts` | ~80 | Data review endpoint |
| `app/api/tasks/[taskId]/choose/route.ts` | ~60 | Choice selection endpoint |
| `app/api/tasks/services/task-manager.ts` | ~200 | Task creation and management |
| `app/api/tasks/services/notification-service.ts` | ~100 | Task notifications |

### Implementation

#### 1. Task management API

```typescript
// app/api/tasks/services/task-manager.ts
import { z } from 'zod';
import { ApprovalNode, DataReviewNode, ChoiceNode } from '@/lib/workflow/types/suspension';

export interface PendingTask {
  id: string;
  workflowId: string;
  workflowRunId: string;
  stepId: string;
  type: 'approval' | 'data_review' | 'choice';
  assignedTo: string[];
  createdAt: Date;
  dueAt?: Date;
  status: 'pending' | 'completed' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any; // Type-specific task data
  result?: any; // Completion result
  completedBy?: string;
  completedAt?: Date;
}

export class TaskManager {
  async createApprovalTask(data: any): Promise<string> {
    const task: PendingTask = {
      id: crypto.randomUUID(),
      workflowId: data.workflowId,
      workflowRunId: data.workflowRunId,
      stepId: data.stepId,
      type: 'approval',
      assignedTo: data.approvers.map((a: any) => a.userId),
      createdAt: new Date(),
      dueAt: data.timeout ? new Date(Date.now() + data.timeout.duration) : undefined,
      status: 'pending',
      priority: this.inferPriority(data),
      data
    };
    
    await this.saveTask(task);
    await this.sendNotifications(task);
    
    return task.id;
  }
  
  async createReviewTask(data: any): Promise<string> {
    const task: PendingTask = {
      id: crypto.randomUUID(),
      workflowId: data.workflowId,
      workflowRunId: data.workflowRunId,
      stepId: data.stepId,
      type: 'data_review',
      assignedTo: data.reviewers.map((r: any) => r.userId),
      createdAt: new Date(),
      status: 'pending',
      priority: 'medium',
      data
    };
    
    await this.saveTask(task);
    await this.sendNotifications(task);
    
    return task.id;
  }
  
  async createChoiceTask(data: any): Promise<string> {
    const task: PendingTask = {
      id: crypto.randomUUID(),
      workflowId: data.workflowId,
      workflowRunId: data.workflowRunId,
      stepId: data.stepId,
      type: 'choice',
      assignedTo: data.assignedUsers.map((u: any) => u.userId),
      createdAt: new Date(),
      status: 'pending',
      priority: 'medium',
      data
    };
    
    await this.saveTask(task);
    await this.sendNotifications(task);
    
    return task.id;
  }
  
  async approveTask(taskId: string, userId: string, decision: {
    approved: boolean;
    comments?: string;
  }): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || !task.assignedTo.includes(userId)) {
      throw new Error('Task not found or user not authorized');
    }
    
    const approvalData = task.data;
    const strategy = approvalData.strategy;
    
    // Check if this approval satisfies the strategy
    const isComplete = await this.checkApprovalStrategy(task, userId, decision, strategy);
    
    if (isComplete) {
      // Resume the workflow
      await this.completeTask(task, {
        approved: decision.approved,
        approvedBy: userId,
        comments: decision.comments,
        approvedAt: new Date().toISOString()
      });
      
      await this.resumeWorkflow(task.workflowRunId, task.stepId, {
        approved: decision.approved,
        approvedBy: userId,
        comments: decision.comments
      });
    } else {
      // Store partial approval, wait for more
      await this.recordPartialApproval(task, userId, decision);
    }
  }
  
  async reviewData(taskId: string, userId: string, review: {
    approved: boolean;
    modifiedData?: Record<string, any>;
    comments?: string;
  }): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || !task.assignedTo.includes(userId)) {
      throw new Error('Task not found or user not authorized');
    }
    
    await this.completeTask(task, {
      approved: review.approved,
      reviewedBy: userId,
      comments: review.comments,
      reviewedAt: new Date().toISOString(),
      modifiedData: review.modifiedData || {}
    });
    
    await this.resumeWorkflow(task.workflowRunId, task.stepId, {
      approved: review.approved,
      reviewedBy: userId,
      comments: review.comments,
      modifiedData: review.modifiedData
    });
  }
  
  async makeChoice(taskId: string, userId: string, choice: {
    selectedChoices: string[];
    comments?: string;
  }): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || !task.assignedTo.includes(userId)) {
      throw new Error('Task not found or user not authorized');
    }
    
    await this.completeTask(task, {
      selectedChoices: choice.selectedChoices,
      selectedBy: userId,
      comments: choice.comments,
      selectedAt: new Date().toISOString()
    });
    
    await this.resumeWorkflow(task.workflowRunId, task.stepId, {
      selectedChoices: choice.selectedChoices,
      selectedBy: userId,
      comments: choice.comments
    });
  }
  
  private async checkApprovalStrategy(task: PendingTask, userId: string, decision: any, strategy: string): Promise<boolean> {
    const existingApprovals = await this.getTaskApprovals(task.id);
    const allApprovals = [...existingApprovals, { userId, approved: decision.approved }];
    
    switch (strategy) {
      case 'any_one':
        return allApprovals.some(a => a.approved);
      case 'all':
        return allApprovals.length === task.assignedTo.length && allApprovals.every(a => a.approved);
      case 'majority':
        const approvedCount = allApprovals.filter(a => a.approved).length;
        return approvedCount > task.assignedTo.length / 2;
      case 'specific_count':
        const required = task.data.requiredApprovals || 1;
        return allApprovals.filter(a => a.approved).length >= required;
      default:
        return true;
    }
  }
  
  private async resumeWorkflow(workflowRunId: string, stepId: string, data: any): Promise<void> {
    // Call Mastra resume API
    await fetch(`/api/workflows/runs/${workflowRunId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId,
        data
      })
    });
  }
}
```

#### 2. Task API endpoints

```typescript
// app/api/tasks/[taskId]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { TaskManager } from '../../services/task-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { approved, comments } = await request.json();
    const taskManager = new TaskManager();
    
    await taskManager.approveTask(params.taskId, userId, {
      approved,
      comments
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Approval failed' 
    }, { status: 400 });
  }
}
```

#### 3. Notification service

```typescript
// app/api/tasks/services/notification-service.ts
import { PendingTask } from './task-manager';

export class NotificationService {
  async sendTaskNotifications(task: PendingTask): Promise<void> {
    const notifications = await Promise.all([
      this.sendEmailNotifications(task),
      this.sendInAppNotifications(task),
      this.sendSlackNotifications(task) // If Slack integration enabled
    ]);
    
    console.log(`Sent ${notifications.flat().length} notifications for task ${task.id}`);
  }
  
  private async sendEmailNotifications(task: PendingTask): Promise<string[]> {
    const users = await this.getUsersById(task.assignedTo);
    const subject = this.getEmailSubject(task);
    const body = this.getEmailBody(task);
    
    const sent = await Promise.all(
      users.map(async (user) => {
        await this.sendEmail({
          to: user.email,
          subject,
          html: body,
          metadata: {
            taskId: task.id,
            workflowId: task.workflowId,
            type: task.type
          }
        });
        return user.id;
      })
    );
    
    return sent;
  }
  
  private async sendInAppNotifications(task: PendingTask): Promise<string[]> {
    const notifications = await Promise.all(
      task.assignedTo.map(async (userId) => {
        await this.createInAppNotification({
          userId,
          type: 'task_assigned',
          title: this.getNotificationTitle(task),
          message: this.getNotificationMessage(task),
          actionUrl: `/tasks/${task.id}`,
          metadata: {
            taskId: task.id,
            workflowId: task.workflowId,
            priority: task.priority
          }
        });
        return userId;
      })
    );
    
    return notifications;
  }
  
  private getEmailSubject(task: PendingTask): string {
    switch (task.type) {
      case 'approval':
        return `Approval Required: ${task.data.description || 'Workflow Step'}`;
      case 'data_review':
        return `Data Review Required: ${task.data.description || 'Workflow Step'}`;
      case 'choice':
        return `Decision Required: ${task.data.description || 'Workflow Step'}`;
      default:
        return 'Workflow Task Requires Your Attention';
    }
  }
  
  private getEmailBody(task: PendingTask): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.agipo.com';
    const taskUrl = `${baseUrl}/tasks/${task.id}`;
    
    return `
      <h2>${this.getEmailSubject(task)}</h2>
      <p>A workflow requires your attention:</p>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <strong>Workflow:</strong> ${task.workflowId}<br/>
        <strong>Type:</strong> ${task.type}<br/>
        <strong>Priority:</strong> ${task.priority}<br/>
        ${task.dueAt ? `<strong>Due:</strong> ${task.dueAt.toLocaleString()}<br/>` : ''}
      </div>
      
      <p><a href="${taskUrl}" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Task</a></p>
      
      <p>This task was created automatically by Agipo. If you believe this is an error, please contact your workflow administrator.</p>
    `;
  }
}
```

### Testing

```bash
# Test task creation
npm run test -- --grep "task creation"

# Test approval flow
npm run test -- --grep "approval task"

# Test notification delivery
npm run test -- --grep "task notifications"
```

### Success Metrics

- [ ] Tasks are created when workflows suspend
- [ ] Assigned users receive notifications via email and in-app
- [ ] Approval strategies work correctly (any_one, all, majority, etc.)
- [ ] Data review allows modification and validation
- [ ] Choice selection routes workflow execution
- [ ] Task timeouts are handled appropriately
- [ ] Task status updates in real-time

---

## Phase 3: Human Task User Interface

### Goal
Build the user interface for humans to view, respond to, and manage workflow tasks.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/tasks/page.tsx` | ~100 | Task dashboard page |
| `app/(pages)/tasks/[taskId]/page.tsx` | ~150 | Individual task page |
| `app/(pages)/tasks/components/TaskList.tsx` | ~120 | Task list component |
| `app/(pages)/tasks/components/ApprovalForm.tsx` | ~100 | Approval interface |
| `app/(pages)/tasks/components/DataReviewForm.tsx` | ~150 | Data review interface |
| `app/(pages)/tasks/components/ChoiceForm.tsx` | ~100 | Choice selection interface |

### Implementation

#### 1. Task dashboard

```tsx
// app/(pages)/tasks/page.tsx
import { Suspense } from 'react';
import { TaskList } from './components/TaskList';
import { TaskFilters } from './components/TaskFilters';
import { TaskStats } from './components/TaskStats';

export default function TasksPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <TaskStats />
      </div>
      
      <TaskFilters />
      
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList />
      </Suspense>
    </div>
  );
}
```

#### 2. Task list component

```tsx
// app/(pages)/tasks/components/TaskList.tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  workflowId: string;
  type: 'approval' | 'data_review' | 'choice';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueAt?: string;
  status: 'pending' | 'completed' | 'expired';
  data: any;
}

export function TaskList() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });
  
  if (isLoading) return <TaskListSkeleton />;
  
  const pendingTasks = tasks?.filter((task: Task) => task.status === 'pending') || [];
  const completedTasks = tasks?.filter((task: Task) => task.status === 'completed') || [];
  
  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Tasks ({pendingTasks.length})
        </h2>
        
        <div className="grid gap-4">
          {pendingTasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {pendingTasks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No pending tasks</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Recent Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recently Completed ({completedTasks.length})
          </h2>
          
          <div className="grid gap-4">
            {completedTasks.slice(0, 5).map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'bg-red-100 text-red-700', icon: AlertTriangle };
      case 'high':
        return { color: 'bg-orange-100 text-orange-700', icon: Clock };
      case 'medium':
        return { color: 'bg-blue-100 text-blue-700', icon: User };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: User };
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'approval': return 'Approval Required';
      case 'data_review': return 'Data Review';
      case 'choice': return 'Decision Required';
      default: return 'Task';
    }
  };
  
  const priorityConfig = getPriorityConfig(task.priority);
  const PriorityIcon = priorityConfig.icon;
  
  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date();
  
  return (
    <Card className={`transition-colors hover:bg-muted/50 ${
      isOverdue ? 'border-red-200 bg-red-50/50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PriorityIcon className="h-4 w-4" />
            {getTypeLabel(task.type)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={priorityConfig.color}>
              {task.priority}
            </Badge>
            {task.status === 'completed' && (
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Completed
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {task.data.description || 'Workflow task requiring your attention'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            {task.dueAt && (
              <span>Due {new Date(task.dueAt).toLocaleDateString()}</span>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button asChild size="sm">
              <Link href={`/tasks/${task.id}`}>
                {task.status === 'completed' ? 'View' : 'Review'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Approval form component

```tsx
// app/(pages)/tasks/components/ApprovalForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalFormProps {
  task: {
    id: string;
    data: {
      description: string;
      contextData: Record<string, any>;
      approvalStrategy: string;
      requiredApprovals?: number;
    };
  };
}

export function ApprovalForm({ task }: ApprovalFormProps) {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const queryClient = useQueryClient();
  
  const submitApproval = useMutation({
    mutationFn: async (approved: boolean) => {
      const response = await fetch(`/api/tasks/${task.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          comments: comments.trim() || undefined
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit approval');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      toast.success('Approval submitted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const handleSubmit = () => {
    if (decision === null) return;
    submitApproval.mutate(decision === 'approve');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Decision</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Context Data */}
        {Object.keys(task.data.contextData).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Context Information</h4>
            <div className="grid gap-3">
              {Object.entries(task.data.contextData).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="col-span-2">
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Decision Buttons */}
        <div>
          <h4 className="font-medium mb-3">Your Decision</h4>
          <div className="flex gap-3">
            <Button
              variant={decision === 'approve' ? 'default' : 'outline'}
              onClick={() => setDecision('approve')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            
            <Button
              variant={decision === 'reject' ? 'destructive' : 'outline'}
              onClick={() => setDecision('reject')}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
        
        {/* Comments */}
        <div>
          <h4 className="font-medium mb-3">Comments (Optional)</h4>
          <Textarea
            placeholder="Add any comments or reasoning for your decision..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />
        </div>
        
        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={decision === null || submitApproval.isPending}
          className="w-full"
        >
          {submitApproval.isPending ? 'Submitting...' : 'Submit Decision'}
        </Button>
        
        {/* Strategy Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
          <strong>Approval Strategy:</strong> {task.data.approvalStrategy}
          {task.data.requiredApprovals && (
            <span> (requires {task.data.requiredApprovals} approvals)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Testing

```bash
# Test task UI components
npm run test -- --grep "task components"

# Test form submissions
npm run test -- --grep "task form"

# E2E test task workflow
npx playwright test human-task-flow.spec.ts
```

### Success Metrics

- [ ] Task dashboard displays all pending and completed tasks
- [ ] Task filtering and sorting work correctly
- [ ] Approval forms submit decisions successfully
- [ ] Data review forms allow modification and validation
- [ ] Choice forms enable selection and submission
- [ ] Real-time task updates reflected in UI
- [ ] Mobile-responsive design for on-the-go approvals
- [ ] Notification badges show pending task count

---

## Validation & Testing

### Integration Tests

```typescript
describe('Human-in-the-Loop Nodes', () => {
  it('should suspend workflow and create approval task', async () => {
    // 1. Create workflow with approval node
    // 2. Execute workflow
    // 3. Verify workflow suspends at approval step
    // 4. Verify approval task is created
    // 5. Submit approval
    // 6. Verify workflow resumes
  });
  
  it('should handle data review with modifications', async () => {
    // 1. Create workflow with data review node
    // 2. Execute with test data
    // 3. Submit review with modifications
    // 4. Verify modified data propagates to subsequent steps
  });
  
  it('should route workflow based on human choice', async () => {
    // 1. Create workflow with choice node leading to different paths
    // 2. Execute workflow
    // 3. Submit choice selection
    // 4. Verify correct path is executed
  });
});
```

### Manual Testing Checklist

- [ ] Create approval node in workflow editor and configure approvers
- [ ] Execute workflow and verify suspension at approval step
- [ ] Receive notification via email and in-app
- [ ] Submit approval decision through task interface
- [ ] Verify workflow resumes and completes
- [ ] Test rejection scenario and alternate path handling
- [ ] Test data review with field modifications
- [ ] Test choice node with multiple options
- [ ] Test timeout handling for overdue tasks
- [ ] Test different approval strategies (any_one, all, majority)

### Performance Considerations

- [ ] Task notifications sent promptly (< 5 seconds)
- [ ] Task UI loads quickly with many pending tasks
- [ ] Database queries optimized for task filtering
- [ ] Real-time updates don't impact workflow performance
- [ ] Concurrent approvals handled correctly

---

## Future Enhancements

1. **Advanced Approval Workflows**: Multi-level approvals with escalation
2. **Approval Templates**: Reusable approval configurations
3. **Mobile App**: Native mobile app for task approvals
4. **Delegation**: Delegate approval authority to other users
5. **Audit Trail**: Complete history of all approval decisions
6. **Integration**: Slack/Teams bot for task notifications
7. **Analytics**: Approval time metrics and bottleneck analysis