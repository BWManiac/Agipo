# Frontend-Backend Mapping - Node Decomposition

## API Endpoints

### Node Analysis

#### POST /api/workflow/analyze-complexity
Analyze node complexity and suggest decomposition candidates.

**Request:**
```typescript
{
  workflowId: string;
  nodeId?: string; // If not provided, analyze all nodes
  analysisDepth: 'shallow' | 'deep' | 'comprehensive';
  includeMetrics: string[]; // ['cyclomatic', 'cognitive', 'parametric', 'integration']
}
```

**Response:**
```typescript
{
  analysis: {
    overallComplexity: number;
    nodes: Array<{
      id: string;
      name: string;
      complexity: {
        overall: number;
        cyclomatic: number;
        cognitive: number;
        parametric: number;
        integration: number;
      };
      decompositionCandidate: boolean;
      recommendedStrategy?: 'functional' | 'logical' | 'process' | 'error-boundary';
      potentialReduction: number;
    }>;
  };
  recommendations: Array<{
    nodeId: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    estimatedEffort: 'low' | 'medium' | 'high';
  }>;
}
```

#### GET /api/workflow/:workflowId/complexity-history
Get complexity trends over time.

**Query Parameters:**
- `timeRange`: '7d' | '30d' | '90d'
- `nodeId`: Optional specific node

**Response:**
```typescript
{
  history: Array<{
    timestamp: string;
    nodeId?: string;
    complexity: number;
    metrics: ComplexityMetrics;
  }>;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    projectedComplexity: number;
  };
}
```

### Node Decomposition

#### POST /api/workflow/decompose
Initiate node decomposition process.

**Request:**
```typescript
{
  workflowId: string;
  nodeId: string;
  strategy: 'functional' | 'logical' | 'process' | 'error-boundary';
  maxDepth: number; // 2-5
  preserveParameters: boolean;
  autoOptimize: boolean;
  options: {
    generateTemplates: boolean;
    enableParallelExecution: boolean;
    addErrorHandling: boolean;
  };
}
```

**Response:**
```typescript
{
  decompositionId: string;
  status: 'initiated' | 'analyzing' | 'generating' | 'complete' | 'error';
  preview: {
    subWorkflows: Array<{
      id: string;
      name: string;
      description: string;
      estimatedComplexity: number;
      position: { x: number; y: number };
    }>;
    connections: Array<{
      from: string;
      to: string;
      parameterMapping: ParameterMapping;
    }>;
    improvements: {
      complexityReduction: number;
      performanceGain: number;
      maintainabilityIncrease: number;
    };
  };
}
```

#### GET /api/workflow/decompose/:decompositionId/status
Monitor decomposition progress via SSE.

**Response (SSE Stream):**
```typescript
data: {
  stage: 'analyzing' | 'generating' | 'optimizing' | 'validating';
  progress: number;
  currentAction: string;
  subWorkflowsCreated: number;
  errors?: string[];
}
```

#### PUT /api/workflow/decompose/:decompositionId/apply
Apply the decomposition to the workflow.

**Request:**
```typescript
{
  confirmChanges: boolean;
  modifiedMappings?: Array<{
    subWorkflowId: string;
    parameterMapping: ParameterMapping;
  }>;
  customizations?: Array<{
    subWorkflowId: string;
    name?: string;
    description?: string;
    config?: any;
  }>;
}
```

### Sub-workflow Management

#### GET /api/workflow/:workflowId/hierarchy
Get complete workflow hierarchy.

**Response:**
```typescript
{
  hierarchy: {
    rootWorkflowId: string;
    levels: Array<{
      level: number;
      workflows: Array<{
        id: string;
        name: string;
        parentNodeId?: string;
        children: string[];
        complexity: number;
        status: 'draft' | 'active' | 'deprecated';
        performance: {
          averageExecution: number;
          successRate: number;
          errorRate: number;
        };
      }>;
    }>;
    maxDepth: number;
    totalNodes: number;
  };
  dependencies: Array<{
    from: string;
    to: string;
    type: 'parameter' | 'execution' | 'data';
  }>;
}
```

#### POST /api/workflow/:workflowId/manage-dependencies
Update workflow dependencies.

**Request:**
```typescript
{
  action: 'add' | 'remove' | 'update';
  dependency: {
    from: string;
    to: string;
    type: 'parameter' | 'execution' | 'data';
    mapping?: ParameterMapping;
  };
}
```

#### GET /api/workflow/:workflowId/performance
Get performance metrics for nested workflows.

**Response:**
```typescript
{
  overall: {
    averageExecutionTime: number;
    throughput: number;
    errorRate: number;
    resourceUsage: number;
  };
  byWorkflow: Array<{
    workflowId: string;
    metrics: PerformanceMetrics;
    bottlenecks: string[];
    optimization: {
      opportunities: string[];
      estimatedGain: number;
    };
  }>;
  trends: {
    executionTime: TrendData;
    errorRate: TrendData;
    resourceUsage: TrendData;
  };
}
```

### Parameter Mapping

#### POST /api/workflow/parameter-mapping/validate
Validate parameter mappings between workflows.

**Request:**
```typescript
{
  parentWorkflowId: string;
  childWorkflowId: string;
  mappings: Array<{
    sourceParam: string;
    targetParam: string;
    transformation?: {
      type: 'direct' | 'transform' | 'aggregate' | 'filter';
      function?: string;
      config?: any;
    };
  }>;
}
```

**Response:**
```typescript
{
  valid: boolean;
  issues: Array<{
    type: 'type_mismatch' | 'missing_required' | 'circular_dependency' | 'invalid_transformation';
    sourceParam?: string;
    targetParam?: string;
    message: string;
    severity: 'error' | 'warning';
    autoFixable: boolean;
    suggestedFix?: string;
  }>;
  suggestions: Array<{
    action: 'auto_map' | 'add_transformation' | 'set_default';
    description: string;
    confidence: number;
  }>;
}
```

#### POST /api/workflow/parameter-mapping/auto-map
Automatically suggest parameter mappings.

**Request:**
```typescript
{
  parentWorkflowId: string;
  childWorkflows: string[];
  strategy: 'name_matching' | 'type_matching' | 'semantic_matching' | 'ml_prediction';
}
```

**Response:**
```typescript
{
  mappings: Array<{
    childWorkflowId: string;
    suggestions: Array<{
      sourceParam: string;
      targetParam: string;
      confidence: number;
      reasoning: string;
      transformation?: TransformationSuggestion;
    }>;
  }>;
  unmappedParameters: Array<{
    workflowId: string;
    parameters: string[];
    recommendations: string[];
  }>;
}
```

### AI-Powered Suggestions

#### POST /api/workflow/ai/analyze-refactoring
Get AI-powered refactoring suggestions.

**Request:**
```typescript
{
  workflowId: string;
  scope: 'current' | 'hierarchy' | 'selected_nodes';
  selectedNodeIds?: string[];
  analysisTypes: Array<'performance' | 'code_reuse' | 'simplification' | 'best_practices'>;
}
```

**Response:**
```typescript
{
  analysisId: string;
  status: 'analyzing' | 'complete';
  suggestions: Array<{
    id: string;
    type: 'performance' | 'code_reuse' | 'simplification' | 'best_practices';
    title: string;
    description: string;
    impact: {
      performance?: number;
      maintainability?: number;
      complexity?: number;
      cost?: number;
    };
    priority: 'high' | 'medium' | 'low';
    autoApplicable: boolean;
    estimatedEffort: 'low' | 'medium' | 'high';
    riskLevel: 'minimal' | 'low' | 'medium' | 'high';
    affectedNodes: string[];
    implementation: {
      steps: string[];
      estimatedTime: string;
      prerequisites: string[];
    };
    confidence: number;
  }>;
  overallScore: {
    current: number;
    potential: number;
    improvement: number;
  };
}
```

#### POST /api/workflow/ai/apply-suggestion
Apply a specific AI suggestion.

**Request:**
```typescript
{
  suggestionId: string;
  workflowId: string;
  customizations?: any;
  testMode: boolean;
}
```

#### GET /api/workflow/ai/suggestion-history
Get history of applied AI suggestions.

**Response:**
```typescript
{
  history: Array<{
    suggestionId: string;
    appliedAt: string;
    type: string;
    impact: {
      measuredImprovement: number;
      expectedImprovement: number;
      variance: number;
    };
    rollbackAvailable: boolean;
  }>;
}
```

### Complexity Analysis

#### POST /api/workflow/complexity/compare
Compare complexity before and after changes.

**Request:**
```typescript
{
  workflowId: string;
  comparison: 'before_after_decomposition' | 'scenario_comparison' | 'historical_trend';
  timeRange?: string;
  scenarios?: Array<{
    name: string;
    configuration: any;
  }>;
}
```

**Response:**
```typescript
{
  comparison: {
    baseline: ComplexityMetrics;
    current: ComplexityMetrics;
    scenarios?: Array<{
      name: string;
      metrics: ComplexityMetrics;
    }>;
    improvements: {
      overall: number;
      byCategory: Record<string, number>;
      significance: 'minor' | 'moderate' | 'major';
    };
  };
  recommendations: string[];
}
```

#### POST /api/workflow/complexity/set-thresholds
Configure complexity thresholds and alerts.

**Request:**
```typescript
{
  workflowId: string;
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  alerts: {
    emailNotifications: boolean;
    webhookUrl?: string;
    thresholdBreach: boolean;
    trendDetection: boolean;
  };
}
```

## WebSocket Events

### Real-time Decomposition Updates
**URL:** `ws://localhost:3000/ws/workflow/decomposition`

#### Client Events:
- `decomposition:start` - Start decomposition process
- `decomposition:cancel` - Cancel ongoing decomposition
- `parameter_mapping:update` - Update parameter mappings
- `preview:request` - Request decomposition preview

#### Server Events:
- `decomposition:progress` - Progress updates during decomposition
- `decomposition:complete` - Decomposition finished
- `decomposition:error` - Error during decomposition
- `mapping:validation` - Parameter mapping validation results
- `complexity:update` - Complexity metrics updated

### Performance Monitoring
**URL:** `ws://localhost:3000/ws/workflow/performance`

#### Server Events:
- `performance:metrics` - Real-time performance data
- `performance:alert` - Performance threshold alerts
- `bottleneck:detected` - Performance bottleneck identified
- `optimization:suggestion` - New optimization opportunity

## Data Models

### NodeDecomposition
```typescript
interface NodeDecomposition {
  id: string;
  parentNodeId: string;
  strategy: 'functional' | 'logical' | 'process' | 'error-boundary';
  subWorkflows: Array<{
    id: string;
    name: string;
    description: string;
    complexity: ComplexityMetrics;
    dependencies: string[];
  }>;
  parameterMappings: Array<ParameterMapping>;
  improvements: {
    complexityReduction: number;
    performanceGain: number;
    maintainabilityIncrease: number;
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    decompositionReason: string;
    aiSuggested: boolean;
  };
}
```

### ComplexityMetrics
```typescript
interface ComplexityMetrics {
  overall: number;
  cyclomatic: number; // Decision points and branches
  cognitive: number; // Mental load to understand
  parametric: number; // Input/output complexity
  integration: number; // External dependencies
  halstead?: { // Optional: Halstead complexity metrics
    volume: number;
    difficulty: number;
    effort: number;
  };
  maintainability: number; // Maintainability index
}
```

### ParameterMapping
```typescript
interface ParameterMapping {
  sourceWorkflowId: string;
  targetWorkflowId: string;
  mappings: Array<{
    sourceParam: string;
    targetParam: string;
    transformation?: {
      type: 'direct' | 'transform' | 'aggregate' | 'filter';
      function: string;
      config: any;
    };
    defaultValue?: any;
    required: boolean;
    validation?: {
      type: string;
      rules: any[];
    };
  }>;
}
```

### HierarchyNode
```typescript
interface HierarchyNode {
  id: string;
  workflowId: string;
  name: string;
  level: number;
  parentId?: string;
  children: string[];
  complexity: ComplexityMetrics;
  performance: {
    averageExecutionTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
  dependencies: Array<{
    dependsOn: string;
    type: 'parameter' | 'execution' | 'data';
  }>;
  status: 'draft' | 'active' | 'deprecated';
}
```

### AIRefactoringSuggestion
```typescript
interface AIRefactoringSuggestion {
  id: string;
  type: 'performance' | 'code_reuse' | 'simplification' | 'best_practices';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  autoApplicable: boolean;
  impact: {
    performance?: number;
    maintainability?: number;
    complexity?: number;
    cost?: number;
  };
  implementation: {
    type: 'code_change' | 'structure_change' | 'configuration_change';
    changes: Array<{
      target: string;
      action: 'add' | 'modify' | 'remove';
      content: any;
    }>;
    rollbackPlan: string;
  };
  metadata: {
    analysisTimestamp: Date;
    basedOnPatterns: string[];
    similarCases: number;
  };
}
```

## State Management

### Frontend State (Zustand)
```typescript
interface NodeDecompositionStore {
  // Current State
  selectedWorkflow: string | null;
  decompositionMode: boolean;
  complexityAnalysis: ComplexityMetrics | null;
  
  // Decomposition State
  decompositionProgress: {
    stage: string;
    progress: number;
    estimatedCompletion: Date | null;
  };
  subWorkflows: SubWorkflow[];
  parameterMappings: ParameterMapping[];
  
  // Hierarchy State
  hierarchyView: {
    currentLevel: number;
    expandedNodes: Set<string>;
    selectedNode: string | null;
    viewMode: 'tree' | 'canvas' | 'table';
  };
  
  // AI Suggestions
  aiSuggestions: AIRefactoringSuggestion[];
  appliedSuggestions: Set<string>;
  suggestionFilters: {
    types: string[];
    impacts: string[];
    priorities: string[];
  };
  
  // Performance Monitoring
  performanceData: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  
  // Actions
  analyzeComplexity: (workflowId: string) => Promise<void>;
  startDecomposition: (nodeId: string, options: DecompositionOptions) => Promise<void>;
  updateParameterMapping: (mapping: ParameterMapping) => void;
  applyAISuggestion: (suggestionId: string) => Promise<void>;
  navigateHierarchy: (nodeId: string) => void;
  exportAnalysis: (format: 'pdf' | 'json' | 'csv') => Promise<void>;
}
```

## Error Handling

### Error Codes
- `DECOMPOSITION_FAILED` - Node decomposition process failed
- `COMPLEXITY_ANALYSIS_ERROR` - Error analyzing node complexity
- `PARAMETER_MAPPING_INVALID` - Invalid parameter mapping configuration
- `HIERARCHY_CIRCULAR_DEPENDENCY` - Circular dependency detected
- `AI_ANALYSIS_TIMEOUT` - AI analysis took too long
- `PERFORMANCE_MONITORING_ERROR` - Error collecting performance data
- `THRESHOLD_VALIDATION_FAILED` - Complexity threshold validation failed

### Error Response Format
```typescript
{
  error: {
    code: string;
    message: string;
    details: {
      nodeId?: string;
      workflowId?: string;
      stage?: string;
      suggestions?: string[];
    };
    recovery: {
      autoRetryable: boolean;
      userActions: string[];
      fallbackOptions: string[];
    };
  };
}
```

## Performance Considerations

### Caching Strategy
- Cache complexity analysis results for 1 hour
- Store decomposition previews for 24 hours
- Cache hierarchy data for 30 minutes
- Store AI suggestions for 7 days

### Rate Limiting
- Complexity analysis: 5 per minute per user
- Decomposition operations: 2 per minute per user
- AI suggestions: 10 per hour per user
- Performance monitoring: No limit (real-time)

### Optimization
- Stream large hierarchy data
- Paginate AI suggestions and analysis history
- Use WebSockets for real-time updates
- Compress complex analysis data
- Lazy load sub-workflow details

## Security

### Authorization
- Users can only access workflows they own or have permission to view
- Decomposition operations require edit permissions
- AI suggestions require advanced user role
- Performance monitoring data is user-scoped

### Data Validation
- Validate all parameter mappings for type safety
- Sanitize AI-generated suggestions
- Validate complexity threshold ranges
- Check for circular dependencies before applying changes

### Audit Trail
- Log all decomposition operations
- Track AI suggestion applications
- Monitor complexity threshold changes
- Record performance alert triggers