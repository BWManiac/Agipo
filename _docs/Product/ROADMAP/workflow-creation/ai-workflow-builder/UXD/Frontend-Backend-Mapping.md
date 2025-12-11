# Frontend-Backend Mapping - AI Workflow Builder

## API Endpoints

### Workflow Generation

#### POST /api/workflow/generate
Generates a workflow from natural language description.

**Request:**
```typescript
{
  prompt: string;
  context?: {
    availableIntegrations: string[];
    recentWorkflows: string[];
    userPreferences: {
      complexity: 'simple' | 'moderate' | 'advanced';
      includeErrorHandling: boolean;
      optimizeForPerformance: boolean;
    };
  };
}
```

**Response:**
```typescript
{
  workflowId: string;
  status: 'generating' | 'complete' | 'error';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  workflow?: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata: WorkflowMetadata;
  };
  suggestions?: AISuggestion[];
  errors?: ValidationError[];
}
```

#### GET /api/workflow/generate/:sessionId
Get generation progress via SSE (Server-Sent Events).

**Response (SSE Stream):**
```typescript
data: {
  stage: 'parsing' | 'identifying' | 'building' | 'logic' | 'optimizing';
  progress: number;
  currentAction: string;
  partialWorkflow: WorkflowNode[];
}
```

### Template Recognition

#### POST /api/workflow/match-templates
Find similar templates based on workflow structure.

**Request:**
```typescript
{
  prompt?: string;
  workflow?: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}
```

**Response:**
```typescript
{
  matches: Array<{
    templateId: string;
    name: string;
    description: string;
    matchScore: number;
    differences: string[];
    advantages: string[];
  }>;
}
```

### AI Suggestions

#### POST /api/workflow/suggestions
Get AI-powered suggestions for workflow improvement.

**Request:**
```typescript
{
  workflowId: string;
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}
```

**Response:**
```typescript
{
  suggestions: Array<{
    id: string;
    type: 'error' | 'warning' | 'optimization' | 'security';
    nodeId?: string;
    title: string;
    description: string;
    fix?: {
      action: string;
      params: any;
    };
    impact: 'critical' | 'high' | 'medium' | 'low';
  }>;
}
```

#### POST /api/workflow/apply-suggestion
Apply a specific suggestion to the workflow.

**Request:**
```typescript
{
  workflowId: string;
  suggestionId: string;
}
```

### Validation

#### POST /api/workflow/validate
Validate workflow structure and configuration.

**Request:**
```typescript
{
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}
```

**Response:**
```typescript
{
  valid: boolean;
  errors: Array<{
    nodeId?: string;
    edgeId?: string;
    type: string;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
  }>;
}
```

### Context Integration

#### GET /api/user/integrations
Get user's connected integrations.

**Response:**
```typescript
{
  integrations: Array<{
    id: string;
    provider: string;
    name: string;
    icon: string;
    status: 'connected' | 'expired' | 'error';
    capabilities: string[];
  }>;
}
```

#### GET /api/user/workflows
Get user's recent workflows for reuse.

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)

**Response:**
```typescript
{
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    lastModified: string;
    nodes: number;
    reusable: boolean;
  }>;
}
```

### Export Operations

#### POST /api/workflow/save
Save workflow to user's workspace.

**Request:**
```typescript
{
  workflow: {
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  options: {
    visibility: 'private' | 'team' | 'public';
    tags: string[];
  };
}
```

#### POST /api/workflow/export
Export workflow in various formats.

**Request:**
```typescript
{
  workflowId: string;
  format: 'typescript' | 'javascript' | 'json' | 'python';
  options: {
    includeComments: boolean;
    includeTypes: boolean;
    module: 'es6' | 'commonjs';
  };
}
```

**Response:**
```typescript
{
  code: string;
  filename: string;
  mimeType: string;
}
```

#### POST /api/workflow/publish-template
Publish workflow as a template to marketplace.

**Request:**
```typescript
{
  workflowId: string;
  template: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    pricing: 'free' | 'paid';
    documentation: string;
  };
}
```

#### POST /api/workflow/generate-api
Generate API endpoint for workflow execution.

**Request:**
```typescript
{
  workflowId: string;
  config: {
    authentication: 'apiKey' | 'jwt' | 'none';
    rateLimit: number;
    timeout: number;
  };
}
```

**Response:**
```typescript
{
  endpoint: string;
  apiKey?: string;
  documentation: string;
  example: {
    curl: string;
    javascript: string;
    python: string;
  };
}
```

## WebSocket Events

### Workflow Generation WebSocket
**URL:** `ws://localhost:3000/ws/workflow/generate`

#### Client Events:
- `generate:start` - Start generation with prompt
- `generate:cancel` - Cancel ongoing generation
- `suggestion:apply` - Apply suggestion in real-time
- `validation:request` - Request validation

#### Server Events:
- `generation:progress` - Generation stage updates
- `generation:complete` - Final workflow ready
- `generation:error` - Generation failed
- `suggestion:available` - New suggestion detected
- `validation:result` - Validation results

## Data Models

### WorkflowNode
```typescript
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'integration';
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    config: Record<string, any>;
    integration?: string;
    error?: string;
  };
}
```

### WorkflowEdge
```typescript
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'conditional';
  data?: {
    condition?: string;
    label?: string;
  };
}
```

### AISuggestion
```typescript
interface AISuggestion {
  id: string;
  type: 'error' | 'warning' | 'optimization' | 'security' | 'alternative';
  title: string;
  description: string;
  nodeId?: string;
  edgeId?: string;
  fix?: {
    type: 'auto' | 'manual';
    action: string;
    params: any;
  };
  impact: {
    performance?: number;
    cost?: number;
    reliability?: number;
  };
}
```

## State Management

### Frontend State (Zustand)
```typescript
interface AIWorkflowBuilderStore {
  // Generation State
  prompt: string;
  isGenerating: boolean;
  generationProgress: GenerationProgress;
  
  // Workflow State
  workflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Suggestions
  suggestions: AISuggestion[];
  appliedSuggestions: string[];
  
  // Validation
  validationErrors: ValidationError[];
  isValid: boolean;
  
  // Actions
  generateWorkflow: (prompt: string) => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  validateWorkflow: () => Promise<void>;
  exportWorkflow: (format: string) => Promise<void>;
}
```

## Error Handling

### Error Codes
- `GENERATION_TIMEOUT` - Generation took too long
- `INVALID_PROMPT` - Prompt cannot be processed
- `MISSING_INTEGRATION` - Required integration not connected
- `VALIDATION_FAILED` - Workflow validation failed
- `EXPORT_FAILED` - Export operation failed
- `TEMPLATE_NOT_FOUND` - Template match not found
- `QUOTA_EXCEEDED` - User exceeded generation quota

### Error Response Format
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
}
```

## Performance Considerations

### Caching
- Cache template matches for similar prompts
- Store generated workflow drafts for 24 hours
- Cache integration capabilities for 1 hour

### Rate Limiting
- Workflow generation: 10 per minute
- Template matching: 20 per minute  
- Suggestion generation: 30 per minute
- Export operations: 5 per minute

### Optimization
- Stream generation progress via SSE
- Batch validation checks
- Lazy load template previews
- Virtualize large workflow node lists

## Security

### Authentication
All endpoints require authentication via JWT token in Authorization header.

### Authorization
- Users can only access their own workflows
- Template publishing requires verified account
- API generation requires Pro subscription

### Input Validation
- Sanitize prompt input to prevent injection
- Validate workflow structure before processing
- Check file size limits for exports
- Rate limit by user ID