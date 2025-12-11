# Workflow Analytics - Frontend-Backend Mapping

## Overview
This document outlines the technical implementation mapping between frontend UXD mockups and backend system architecture for the Workflow Analytics feature.

## Core Entities

### Analytics Metric Entity
```typescript
interface AnalyticsMetric {
  id: string;
  workflowId: string;
  metricType: MetricType;
  value: number;
  timestamp: Date;
  dimensions: Record<string, any>;
  tags: string[];
  source: MetricSource;
  aggregationLevel: AggregationLevel;
}

enum MetricType {
  EXECUTION_COUNT = 'execution_count',
  EXECUTION_TIME = 'execution_time',
  SUCCESS_RATE = 'success_rate',
  ERROR_RATE = 'error_rate',
  RESOURCE_USAGE = 'resource_usage',
  COST = 'cost',
  THROUGHPUT = 'throughput'
}

enum MetricSource {
  RUNTIME_ENGINE = 'runtime_engine',
  COST_TRACKER = 'cost_tracker',
  ERROR_MONITOR = 'error_monitor',
  USAGE_TRACKER = 'usage_tracker'
}

enum AggregationLevel {
  RAW = 'raw',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}
```

### Performance Analysis Entity
```typescript
interface PerformanceAnalysis {
  id: string;
  workflowId: string;
  analysisDate: Date;
  timeRange: TimeRange;
  metrics: PerformanceMetrics;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  trends: TrendAnalysis[];
  confidence: number;
}

interface PerformanceMetrics {
  averageExecutionTime: number;
  p50ExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  throughput: number;
  successRate: number;
  resourceUtilization: ResourceUtilization;
}

interface ResourceUtilization {
  cpu: {
    average: number;
    peak: number;
    utilization: number[];
  };
  memory: {
    average: number;
    peak: number;
    utilization: number[];
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    latency: number;
  };
}

interface Bottleneck {
  nodeId: string;
  type: BottleneckType;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Record<string, number>;
  suggestedActions: string[];
}

enum BottleneckType {
  CPU_INTENSIVE = 'cpu_intensive',
  MEMORY_LEAK = 'memory_leak',
  SLOW_API_CALL = 'slow_api_call',
  NETWORK_LATENCY = 'network_latency',
  DATABASE_QUERY = 'database_query',
  INEFFICIENT_ALGORITHM = 'inefficient_algorithm'
}
```

### Usage Pattern Entity
```typescript
interface UsagePattern {
  id: string;
  workflowId: string;
  patternType: PatternType;
  timeFrame: TimeRange;
  pattern: PatternData;
  users: UserUsageData[];
  geographicDistribution: GeographicData[];
  deviceTypes: DeviceUsageData[];
  confidence: number;
  predictions: PatternPrediction[];
}

enum PatternType {
  TEMPORAL = 'temporal',
  USER_BEHAVIOR = 'user_behavior',
  GEOGRAPHIC = 'geographic',
  SEASONAL = 'seasonal',
  FEATURE_ADOPTION = 'feature_adoption'
}

interface PatternData {
  hourlyDistribution: number[];
  dailyDistribution: number[];
  weeklyDistribution: number[];
  monthlyDistribution: number[];
  peakUsageWindows: PeakWindow[];
}

interface PeakWindow {
  startTime: string;
  endTime: string;
  averageLoad: number;
  peakLoad: number;
  duration: number;
  frequency: string;
}

interface UserUsageData {
  userId: string;
  userType: 'power_user' | 'regular_user' | 'occasional_user';
  executionCount: number;
  averageExecutionTime: number;
  preferredTimeSlots: string[];
  workflowComplexity: number;
}
```

### Error Analysis Entity
```typescript
interface ErrorAnalysis {
  id: string;
  workflowId: string;
  analysisDate: Date;
  timeRange: TimeRange;
  totalErrors: number;
  errorRate: number;
  errorCategories: ErrorCategory[];
  rootCauseAnalysis: RootCause[];
  errorTrends: ErrorTrend[];
  resolutionMetrics: ResolutionMetrics;
  alerts: ErrorAlert[];
}

interface ErrorCategory {
  type: ErrorType;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: ErrorExample[];
  impactedNodes: string[];
  trends: ErrorTrendData;
}

enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  API_TIMEOUT = 'api_timeout',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  DATA_PROCESSING_ERROR = 'data_processing_error',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  CONFIGURATION_ERROR = 'configuration_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error'
}

interface RootCause {
  category: string;
  description: string;
  affectedComponents: string[];
  contributingFactors: string[];
  recommendations: string[];
  estimatedImpact: {
    errorReduction: number;
    performanceImprovement: number;
    costSavings: number;
  };
}

interface ResolutionMetrics {
  averageTimeToResolution: number;
  automaticRecoveryRate: number;
  manualInterventionRate: number;
  escalationRate: number;
  resolutionMethods: ResolutionMethod[];
}
```

### Cost Analysis Entity
```typescript
interface CostAnalysis {
  id: string;
  workflowId: string;
  analysisDate: Date;
  timeRange: TimeRange;
  totalCost: number;
  costPerExecution: number;
  costBreakdown: CostBreakdown;
  costTrends: CostTrend[];
  optimization: CostOptimization;
  forecasting: CostForecast;
  budgetAnalysis: BudgetAnalysis;
}

interface CostBreakdown {
  compute: number;
  storage: number;
  network: number;
  apiCalls: number;
  thirdPartyServices: number;
  overhead: number;
  breakdown: CostComponent[];
}

interface CostComponent {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  unit: string;
  unitPrice: number;
  quantity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface CostOptimization {
  potentialSavings: number;
  savingsPercentage: number;
  recommendations: OptimizationRecommendation[];
  quickWins: QuickWin[];
  longTermStrategies: Strategy[];
}

interface OptimizationRecommendation {
  type: OptimizationType;
  description: string;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timeToValue: string;
  riskLevel: 'low' | 'medium' | 'high';
  steps: string[];
}

enum OptimizationType {
  RESOURCE_RIGHTSIZING = 'resource_rightsizing',
  REQUEST_BATCHING = 'request_batching',
  CACHING = 'caching',
  SCHEDULING = 'scheduling',
  API_OPTIMIZATION = 'api_optimization',
  INFRASTRUCTURE_CHANGE = 'infrastructure_change'
}
```

### Real-time Monitoring Entity
```typescript
interface RealTimeMonitor {
  id: string;
  workflowId: string;
  timestamp: Date;
  activeExecutions: number;
  queuedExecutions: number;
  systemHealth: SystemHealth;
  alerts: Alert[];
  performance: RealTimePerformance;
  resources: RealTimeResources;
  events: MonitoringEvent[];
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  uptime: number;
  lastIncident?: Date;
  mttr: number; // Mean Time To Recovery
  mtbf: number; // Mean Time Between Failures
}

interface ComponentHealth {
  componentName: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  responseTime?: number;
  errorRate?: number;
  lastChecked: Date;
  healthScore: number;
}

interface RealTimePerformance {
  currentThroughput: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
}

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  status: AlertStatus;
  affectedComponents: string[];
  recommendations: string[];
  estimatedImpact: string;
}

enum AlertType {
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  ERROR_RATE_SPIKE = 'error_rate_spike',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  ANOMALY_DETECTION = 'anomaly_detection',
  SYSTEM_FAILURE = 'system_failure'
}

enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}
```

### Predictive Insights Entity
```typescript
interface PredictiveInsight {
  id: string;
  workflowId: string;
  predictionDate: Date;
  timeHorizon: string; // e.g., '7d', '30d', '90d'
  predictions: Prediction[];
  confidence: number;
  modelInfo: ModelInfo;
  anomalies: AnomalyDetection[];
  recommendations: PredictiveRecommendation[];
  capacityPlanning: CapacityPlan;
}

interface Prediction {
  metricType: MetricType;
  predictedValues: PredictedValue[];
  trend: TrendDirection;
  seasonality: SeasonalityInfo;
  confidence: number;
}

interface PredictedValue {
  timestamp: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

interface ModelInfo {
  modelType: string;
  version: string;
  trainedDate: Date;
  accuracy: number;
  features: string[];
  trainingDataSize: number;
  lastUpdateDate: Date;
}

interface AnomalyDetection {
  timestamp: Date;
  metricType: string;
  actualValue: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  possibleCauses: string[];
}

interface CapacityPlan {
  currentCapacity: CapacityMetrics;
  projectedDemand: DemandForecast[];
  recommendations: CapacityRecommendation[];
  scalingEvents: ScalingEvent[];
}
```

## API Endpoints

### Analytics Dashboard (01-analytics-dashboard.html)

#### Get Dashboard Overview
```typescript
GET /api/workflows/:id/analytics/dashboard
Query: {
  timeRange?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metrics?: string[];
}
Response: {
  overview: {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    totalCost: number;
    activeUsers: number;
  };
  trends: TrendData[];
  insights: Insight[];
  alerts: Alert[];
  topWorkflows: WorkflowSummary[];
}
```

### Performance Metrics (02-performance-metrics.html)

#### Get Performance Analysis
```typescript
GET /api/workflows/:id/analytics/performance
Query: {
  timeRange: string;
  includeBottlenecks?: boolean;
  includeRecommendations?: boolean;
}
Response: {
  performanceMetrics: PerformanceMetrics;
  executionTimeBreakdown: ExecutionBreakdown[];
  resourceUtilization: ResourceUtilization;
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  nodePerformance: NodePerformance[];
}
```

#### Get Performance Comparison
```typescript
GET /api/workflows/:id/analytics/performance/compare
Query: {
  baselineStart: string;
  baselineEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
}
Response: {
  baseline: PerformanceMetrics;
  comparison: PerformanceMetrics;
  improvements: PerformanceImprovement[];
  regressions: PerformanceRegression[];
}
```

### Usage Patterns (03-usage-patterns.html)

#### Get Usage Analytics
```typescript
GET /api/workflows/:id/analytics/usage
Query: {
  timeRange: string;
  patternTypes?: PatternType[];
  includeUserSegmentation?: boolean;
}
Response: {
  usageOverview: UsageOverview;
  temporalPatterns: TemporalPattern[];
  userBehavior: UserBehaviorAnalysis;
  geographicDistribution: GeographicUsage[];
  featureAdoption: FeatureUsage[];
  insights: UsageInsight[];
}
```

### Error Analysis (04-error-analysis.html)

#### Get Error Analytics
```typescript
GET /api/workflows/:id/analytics/errors
Query: {
  timeRange: string;
  severity?: string[];
  includeRootCause?: boolean;
}
Response: {
  errorSummary: ErrorSummary;
  errorCategories: ErrorCategory[];
  errorTrends: ErrorTrend[];
  rootCauseAnalysis: RootCause[];
  resolutionMetrics: ResolutionMetrics;
  recentCriticalErrors: CriticalError[];
}
```

#### Create Error Report
```typescript
POST /api/workflows/:id/analytics/errors/report
Body: {
  timeRange: TimeRange;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
}
Response: {
  reportId: string;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  estimatedTime: number;
}
```

### Cost Optimization (05-cost-optimization.html)

#### Get Cost Analysis
```typescript
GET /api/workflows/:id/analytics/costs
Query: {
  timeRange: string;
  granularity?: 'day' | 'week' | 'month';
  includeOptimizations?: boolean;
}
Response: {
  costSummary: CostSummary;
  costBreakdown: CostBreakdown;
  costTrends: CostTrend[];
  optimization: CostOptimization;
  budgetAnalysis: BudgetAnalysis;
  forecasting: CostForecast;
}
```

#### Apply Cost Optimization
```typescript
POST /api/workflows/:id/analytics/costs/optimize
Body: {
  optimizationIds: string[];
  applyImmediately?: boolean;
  scheduleTime?: Date;
}
Response: {
  optimizationJobId: string;
  estimatedSavings: number;
  implementationPlan: ImplementationStep[];
}
```

### Real-time Monitoring (06-real-time-monitoring.html)

#### Get Real-time Status
```typescript
GET /api/workflows/:id/analytics/realtime
Response: {
  currentMetrics: RealTimeMetrics;
  systemHealth: SystemHealth;
  activeExecutions: ActiveExecution[];
  recentEvents: MonitoringEvent[];
  alerts: Alert[];
}
```

#### WebSocket Real-time Updates
```typescript
WS /api/workflows/:id/analytics/realtime/stream
Events:
- metric_update
- execution_started
- execution_completed
- alert_triggered
- system_health_changed
```

### Custom Reports (07-custom-reports.html)

#### Get Report Templates
```typescript
GET /api/analytics/report-templates
Response: {
  templates: ReportTemplate[];
  customTemplates: CustomTemplate[];
  categories: TemplateCategory[];
}
```

#### Create Custom Report
```typescript
POST /api/workflows/:id/analytics/reports
Body: {
  templateId?: string;
  name: string;
  description?: string;
  configuration: ReportConfiguration;
  schedule?: ReportSchedule;
  recipients?: string[];
}
Response: {
  reportId: string;
  status: 'generating' | 'scheduled';
  downloadUrl?: string;
}
```

#### Get Report Status
```typescript
GET /api/analytics/reports/:reportId/status
Response: {
  status: ReportStatus;
  progress: number;
  estimatedCompletion?: Date;
  downloadUrl?: string;
  error?: string;
}
```

### Comparison Analysis (08-comparison-analysis.html)

#### Create Comparison
```typescript
POST /api/workflows/:id/analytics/compare
Body: {
  comparisonType: 'versions' | 'environments' | 'time_periods' | 'ab_tests';
  baseline: ComparisonTarget;
  target: ComparisonTarget;
  metrics: string[];
  timeRange: TimeRange;
}
Response: {
  comparisonId: string;
  results: ComparisonResults;
  significance: StatisticalSignificance;
  recommendations: ComparisonRecommendation[];
}
```

### Predictive Insights (09-predictive-insights.html)

#### Get Predictions
```typescript
GET /api/workflows/:id/analytics/predictions
Query: {
  timeHorizon: string;
  metricTypes?: string[];
  includeAnomalies?: boolean;
}
Response: {
  predictions: Prediction[];
  modelInfo: ModelInfo;
  confidence: number;
  anomalies: AnomalyDetection[];
  recommendations: PredictiveRecommendation[];
  capacityPlanning: CapacityPlan;
}
```

#### Train Prediction Model
```typescript
POST /api/workflows/:id/analytics/predictions/train
Body: {
  trainingDataRange: TimeRange;
  features: string[];
  modelType?: string;
  hyperparameters?: Record<string, any>;
}
Response: {
  trainingJobId: string;
  status: 'started' | 'completed' | 'failed';
  estimatedTime: number;
}
```

### Export & Sharing (10-export-sharing.html)

#### Create Export
```typescript
POST /api/workflows/:id/analytics/export
Body: {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  dataTypes: string[];
  timeRange: TimeRange;
  configuration: ExportConfiguration;
}
Response: {
  exportId: string;
  status: 'generating';
  estimatedTime: number;
}
```

#### Share Dashboard
```typescript
POST /api/workflows/:id/analytics/share
Body: {
  type: 'public_link' | 'team_invite' | 'email';
  permissions: SharePermissions;
  recipients?: string[];
  expirationDate?: Date;
  password?: string;
}
Response: {
  shareId: string;
  shareUrl?: string;
  accessToken?: string;
  permissions: SharePermissions;
}
```

#### Get Analytics Data via API
```typescript
GET /api/v1/analytics/workflows/:id/metrics
Headers: {
  Authorization: 'Bearer api_key'
}
Query: {
  metrics: string[];
  start_date: string;
  end_date: string;
  granularity: string;
  format?: 'json' | 'csv';
}
Response: {
  data: MetricDataPoint[];
  metadata: QueryMetadata;
  pagination: PaginationInfo;
}
```

## Database Schema

### Analytics Metrics Table
```sql
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    dimensions JSONB DEFAULT '{}',
    tags TEXT[],
    source VARCHAR(50) NOT NULL,
    aggregation_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_metrics_workflow_time ON analytics_metrics(workflow_id, timestamp DESC);
CREATE INDEX idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX idx_analytics_metrics_source ON analytics_metrics(source);
CREATE INDEX idx_analytics_metrics_tags ON analytics_metrics USING GIN(tags);
```

### Performance Analysis Table
```sql
CREATE TABLE performance_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP DEFAULT NOW(),
    time_range_start TIMESTAMP NOT NULL,
    time_range_end TIMESTAMP NOT NULL,
    metrics JSONB NOT NULL,
    bottlenecks JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    trends JSONB DEFAULT '[]',
    confidence DECIMAL(5,4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_performance_analyses_workflow ON performance_analyses(workflow_id);
CREATE INDEX idx_performance_analyses_date ON performance_analyses(analysis_date DESC);
```

### Usage Patterns Table
```sql
CREATE TABLE usage_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL,
    time_frame_start TIMESTAMP NOT NULL,
    time_frame_end TIMESTAMP NOT NULL,
    pattern_data JSONB NOT NULL,
    user_data JSONB DEFAULT '[]',
    geographic_data JSONB DEFAULT '[]',
    confidence DECIMAL(5,4) DEFAULT 0.0,
    predictions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_patterns_workflow ON usage_patterns(workflow_id);
CREATE INDEX idx_usage_patterns_type ON usage_patterns(pattern_type);
```

### Error Analysis Table
```sql
CREATE TABLE error_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP DEFAULT NOW(),
    time_range_start TIMESTAMP NOT NULL,
    time_range_end TIMESTAMP NOT NULL,
    total_errors INTEGER NOT NULL,
    error_rate DECIMAL(8,6) NOT NULL,
    error_categories JSONB NOT NULL,
    root_cause_analysis JSONB DEFAULT '[]',
    error_trends JSONB DEFAULT '[]',
    resolution_metrics JSONB DEFAULT '{}',
    alerts JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_analyses_workflow ON error_analyses(workflow_id);
CREATE INDEX idx_error_analyses_date ON error_analyses(analysis_date DESC);
CREATE INDEX idx_error_analyses_rate ON error_analyses(error_rate DESC);
```

### Cost Analysis Table
```sql
CREATE TABLE cost_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP DEFAULT NOW(),
    time_range_start TIMESTAMP NOT NULL,
    time_range_end TIMESTAMP NOT NULL,
    total_cost DECIMAL(12,4) NOT NULL,
    cost_per_execution DECIMAL(10,6) NOT NULL,
    cost_breakdown JSONB NOT NULL,
    cost_trends JSONB DEFAULT '[]',
    optimization JSONB DEFAULT '{}',
    forecasting JSONB DEFAULT '{}',
    budget_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_analyses_workflow ON cost_analyses(workflow_id);
CREATE INDEX idx_cost_analyses_date ON cost_analyses(analysis_date DESC);
CREATE INDEX idx_cost_analyses_cost ON cost_analyses(total_cost DESC);
```

### Real-time Monitoring Table
```sql
CREATE TABLE realtime_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    active_executions INTEGER NOT NULL,
    queued_executions INTEGER NOT NULL,
    system_health JSONB NOT NULL,
    alerts JSONB DEFAULT '[]',
    performance JSONB NOT NULL,
    resources JSONB NOT NULL,
    events JSONB DEFAULT '[]'
);

-- Partition by time for performance
CREATE INDEX idx_realtime_monitoring_workflow_time ON realtime_monitoring(workflow_id, timestamp DESC);
CREATE INDEX idx_realtime_monitoring_timestamp ON realtime_monitoring(timestamp DESC);
```

### Predictive Insights Table
```sql
CREATE TABLE predictive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    prediction_date TIMESTAMP DEFAULT NOW(),
    time_horizon VARCHAR(20) NOT NULL,
    predictions JSONB NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    model_info JSONB NOT NULL,
    anomalies JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    capacity_planning JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictive_insights_workflow ON predictive_insights(workflow_id);
CREATE INDEX idx_predictive_insights_date ON predictive_insights(prediction_date DESC);
```

### Analytics Reports Table
```sql
CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID,
    configuration JSONB NOT NULL,
    schedule JSONB,
    recipients TEXT[],
    status VARCHAR(50) DEFAULT 'draft',
    file_path VARCHAR(500),
    file_size BIGINT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_reports_workflow ON analytics_reports(workflow_id);
CREATE INDEX idx_analytics_reports_status ON analytics_reports(status);
CREATE INDEX idx_analytics_reports_created ON analytics_reports(created_at DESC);
```

### Analytics Shares Table
```sql
CREATE TABLE analytics_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    share_type VARCHAR(50) NOT NULL,
    permissions JSONB NOT NULL,
    recipients TEXT[],
    expiration_date TIMESTAMP,
    password_hash VARCHAR(255),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_shares_workflow ON analytics_shares(workflow_id);
CREATE INDEX idx_analytics_shares_token ON analytics_shares(share_token);
CREATE INDEX idx_analytics_shares_expiration ON analytics_shares(expiration_date);
```

## Real-time Features

### WebSocket Events
```typescript
// Real-time metric updates
interface MetricUpdateEvent {
  type: 'metric_update';
  workflowId: string;
  metric: AnalyticsMetric;
  timestamp: Date;
}

// Execution lifecycle events
interface ExecutionEvent {
  type: 'execution_started' | 'execution_completed' | 'execution_failed';
  workflowId: string;
  executionId: string;
  metrics?: ExecutionMetrics;
  timestamp: Date;
}

// Alert events
interface AlertEvent {
  type: 'alert_triggered' | 'alert_resolved';
  workflowId: string;
  alert: Alert;
  timestamp: Date;
}

// Anomaly detection events
interface AnomalyEvent {
  type: 'anomaly_detected';
  workflowId: string;
  anomaly: AnomalyDetection;
  timestamp: Date;
}
```

### Server-Sent Events
```typescript
// Analytics stream endpoint
GET /api/workflows/:id/analytics/stream
Events:
- analytics.metric_update
- analytics.alert_triggered
- analytics.anomaly_detected
- analytics.performance_degradation
- analytics.cost_threshold_exceeded
```

## Background Jobs

### Analytics Processing Jobs
```typescript
// Metric aggregation jobs
interface MetricAggregationJob {
  type: 'aggregate_metrics';
  workflowId: string;
  timeRange: TimeRange;
  aggregationLevels: AggregationLevel[];
  priority: number;
}

// Performance analysis jobs
interface PerformanceAnalysisJob {
  type: 'analyze_performance';
  workflowId: string;
  timeRange: TimeRange;
  includeBottlenecks: boolean;
  includeRecommendations: boolean;
}

// Prediction model training jobs
interface ModelTrainingJob {
  type: 'train_prediction_model';
  workflowId: string;
  trainingData: TrainingDataSpec;
  modelConfiguration: ModelConfig;
  schedule?: string;
}

// Report generation jobs
interface ReportGenerationJob {
  type: 'generate_report';
  reportId: string;
  configuration: ReportConfiguration;
  recipients?: string[];
}
```

### Scheduled Analytics Tasks
```typescript
// Automated analysis schedules
interface AnalyticsSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  analysisTypes: string[];
  alertThresholds: AlertThreshold[];
  reportGeneration: boolean;
}

// Data retention policies
interface DataRetentionPolicy {
  rawMetrics: {
    retentionDays: number;
    archiveAfterDays: number;
  };
  aggregatedMetrics: {
    minuteLevel: number; // days
    hourLevel: number;   // days
    dayLevel: number;    // days
    monthLevel: number;  // months
  };
  reports: {
    retentionDays: number;
    maxFileSize: number;
  };
}
```

## Performance Optimization

### Caching Strategy
```typescript
// Redis cache keys for analytics
const ANALYTICS_CACHE_KEYS = {
  dashboardOverview: 'analytics:dashboard:{workflowId}:{timeRange}',
  performanceMetrics: 'analytics:performance:{workflowId}:{timeRange}',
  usagePatterns: 'analytics:usage:{workflowId}:{timeRange}',
  errorAnalysis: 'analytics:errors:{workflowId}:{timeRange}',
  costAnalysis: 'analytics:costs:{workflowId}:{timeRange}',
  predictions: 'analytics:predictions:{workflowId}:{timeHorizon}',
  realtimeMetrics: 'analytics:realtime:{workflowId}',
  aggregatedMetrics: 'analytics:aggregated:{metricType}:{workflowId}:{level}:{timestamp}'
};

// Cache TTL configuration
const ANALYTICS_CACHE_TTL = {
  dashboardOverview: 300,    // 5 minutes
  performanceMetrics: 600,   // 10 minutes
  usagePatterns: 1800,       // 30 minutes
  errorAnalysis: 900,        // 15 minutes
  costAnalysis: 3600,        // 1 hour
  predictions: 7200,         // 2 hours
  realtimeMetrics: 30,       // 30 seconds
  aggregatedMetrics: 86400   // 24 hours
};
```

### Database Optimization
```typescript
// Time-series partitioning for metrics
CREATE TABLE analytics_metrics_y2024m12 PARTITION OF analytics_metrics
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

// Materialized views for common aggregations
CREATE MATERIALIZED VIEW daily_performance_metrics AS
SELECT 
    workflow_id,
    DATE_TRUNC('day', timestamp) as date,
    AVG(value) FILTER (WHERE metric_type = 'execution_time') as avg_execution_time,
    COUNT(*) FILTER (WHERE metric_type = 'execution_count') as total_executions,
    AVG(value) FILTER (WHERE metric_type = 'success_rate') as success_rate
FROM analytics_metrics
WHERE metric_type IN ('execution_time', 'execution_count', 'success_rate')
GROUP BY workflow_id, DATE_TRUNC('day', timestamp);

// Indexes for performance
CREATE INDEX CONCURRENTLY idx_analytics_metrics_workflow_type_time 
    ON analytics_metrics(workflow_id, metric_type, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_analytics_metrics_dimensions 
    ON analytics_metrics USING GIN(dimensions);
```

## Machine Learning Pipeline

### Model Training Pipeline
```typescript
interface MLPipeline {
  dataCollection: DataCollectionConfig;
  featureEngineering: FeatureConfig;
  modelTraining: TrainingConfig;
  evaluation: EvaluationConfig;
  deployment: DeploymentConfig;
}

interface FeatureConfig {
  temporalFeatures: string[];
  workflowFeatures: string[];
  userFeatures: string[];
  externalFeatures: string[];
  engineeringSteps: FeatureEngineeringStep[];
}

interface TrainingConfig {
  modelType: 'time_series' | 'regression' | 'classification' | 'anomaly_detection';
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  validationSplit: number;
  crossValidation: boolean;
}
```

### Prediction Serving
```typescript
interface PredictionService {
  loadModel(modelId: string): Promise<Model>;
  predict(features: FeatureVector): Promise<PredictionResult>;
  batchPredict(features: FeatureVector[]): Promise<PredictionResult[]>;
  explainPrediction(features: FeatureVector): Promise<Explanation>;
}

interface PredictionResult {
  value: number;
  confidence: number;
  bounds: {
    lower: number;
    upper: number;
  };
  explanation?: Explanation;
}
```

This comprehensive mapping provides the foundation for implementing a robust workflow analytics system that supports real-time monitoring, predictive insights, cost optimization, and comprehensive reporting capabilities.