# Template Marketplace - Frontend-Backend Mapping

## Overview
This document outlines the technical implementation mapping between frontend UXD mockups and backend system architecture for the Template Marketplace feature.

## Core Entities

### Template Entity
```typescript
interface Template {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  shortDescription: string;
  author: AuthorInfo;
  category: TemplateCategory;
  tags: string[];
  icon: string;
  screenshots: string[];
  downloadCount: number;
  rating: number;
  reviewCount: number;
  status: TemplateStatus;
  workflowData: WorkflowData;
  dependencies: Dependency[];
  pricing: PricingInfo;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metadata: TemplateMetadata;
}

interface AuthorInfo {
  id: string;
  displayName: string;
  email: string;
  verified: boolean;
  organizationId?: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
}

interface Dependency {
  id: string;
  type: 'integration' | 'workflow';
  name: string;
  version?: string;
  required: boolean;
}

interface PricingInfo {
  type: 'free' | 'paid' | 'pro_only';
  price?: number;
  currency?: string;
}

enum TemplateStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

interface TemplateMetadata {
  complexity: number;
  estimatedSetupTime: number;
  fileSize: number;
  nodeCount: number;
  securityScan: SecurityScanResult;
  performanceScore: number;
}
```

### Review Entity
```typescript
interface Review {
  id: string;
  templateId: string;
  authorId: string;
  rating: number;
  title: string;
  content: string;
  useCase?: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
  authorResponse?: AuthorResponse;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface AuthorResponse {
  content: string;
  createdAt: Date;
}
```

### Installation Entity
```typescript
interface Installation {
  id: string;
  templateId: string;
  userId: string;
  status: InstallationStatus;
  configuration: any;
  customizations: any;
  dependencies: InstalledDependency[];
  createdAt: Date;
  completedAt?: Date;
  errorLogs?: string[];
}

enum InstallationStatus {
  PENDING = 'pending',
  CONFIGURING = 'configuring',
  INSTALLING_DEPENDENCIES = 'installing_dependencies',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

## API Endpoints

### Marketplace Browse (01-marketplace-home.html, 02-template-browse.html)

#### Get Featured Templates
```typescript
GET /api/marketplace/featured
Response: {
  featured: Template[];
  categories: TemplateCategory[];
  trending: Template[];
  newest: Template[];
  stats: MarketplaceStats;
}
```

#### Search Templates
```typescript
GET /api/marketplace/search
Query: {
  q?: string;
  category?: string;
  tags?: string[];
  pricing?: 'free' | 'paid' | 'all';
  rating?: number;
  sort?: 'popular' | 'newest' | 'rating' | 'name';
  page?: number;
  limit?: number;
}
Response: {
  templates: Template[];
  totalCount: number;
  facets: SearchFacets;
}
```

### Template Detail (03-template-detail.html)

#### Get Template Details
```typescript
GET /api/marketplace/templates/:id
Response: {
  template: Template;
  reviews: Review[];
  relatedTemplates: Template[];
  authorTemplates: Template[];
  installationInstructions: string;
  dependencies: DependencyDetails[];
}
```

#### Get Template Reviews
```typescript
GET /api/marketplace/templates/:id/reviews
Query: {
  sort?: 'newest' | 'oldest' | 'helpful' | 'rating';
  filter?: 'all' | 'verified' | 'with_response';
  page?: number;
}
Response: {
  reviews: Review[];
  totalCount: number;
  sentiment: SentimentAnalysis;
  commonTopics: string[];
}
```

### Installation Flow (04-template-installation.html, 05-dependency-management.html)

#### Start Installation
```typescript
POST /api/marketplace/templates/:id/install
Body: {
  workspaceName: string;
  folder?: string;
  configuration: TemplateConfiguration;
  customizations?: any;
}
Response: {
  installationId: string;
  status: InstallationStatus;
  nextSteps: InstallationStep[];
}
```

#### Configure Dependencies
```typescript
POST /api/marketplace/installations/:id/dependencies
Body: {
  connections: ConnectionConfig[];
  integrations: IntegrationConfig[];
}
Response: {
  status: InstallationStatus;
  validationResults: ValidationResult[];
  nextSteps: InstallationStep[];
}
```

#### Test Connections
```typescript
POST /api/marketplace/installations/:id/test-connections
Body: {
  connectionIds: string[];
}
Response: {
  results: ConnectionTestResult[];
  overallStatus: 'success' | 'partial' | 'failed';
}
```

### Customization (06-template-customization.html)

#### Save Template Customizations
```typescript
PUT /api/marketplace/installations/:id/customizations
Body: {
  workflowModifications: WorkflowModification[];
  nodeConfigurations: NodeConfiguration[];
  customPrompts: CustomPrompt[];
}
Response: {
  validationResults: ValidationResult[];
  previewData: WorkflowPreview;
  estimatedPerformance: PerformanceEstimate;
}
```

#### Test Customized Template
```typescript
POST /api/marketplace/installations/:id/test
Body: {
  sampleData: any;
  testConfiguration: TestConfiguration;
}
Response: {
  results: TestResult[];
  performance: PerformanceMetrics;
  recommendations: OptimizationRecommendation[];
}
```

### Reviews & Ratings (07-user-reviews.html)

#### Submit Review
```typescript
POST /api/marketplace/templates/:id/reviews
Body: {
  rating: number;
  title: string;
  content: string;
  useCase?: string;
}
Response: {
  review: Review;
  templateUpdatedRating: number;
}
```

#### Vote on Review Helpfulness
```typescript
POST /api/marketplace/reviews/:id/vote
Body: {
  helpful: boolean;
}
Response: {
  newHelpfulCount: number;
}
```

### Publishing (08-template-publishing.html)

#### Submit Template for Review
```typescript
POST /api/marketplace/templates
Body: {
  templateData: TemplateSubmission;
  assets: TemplateAssets;
  documentation: Documentation;
  metadata: SubmissionMetadata;
}
Response: {
  templateId: string;
  status: TemplateStatus;
  validationResults: ValidationResult[];
  estimatedReviewTime: string;
}
```

#### Update Template
```typescript
PUT /api/marketplace/templates/:id
Body: {
  templateData: Partial<TemplateSubmission>;
  versionNotes: string;
}
Response: {
  template: Template;
  validationResults: ValidationResult[];
}
```

### Author Dashboard (09-author-dashboard.html)

#### Get Author Dashboard Data
```typescript
GET /api/marketplace/author/dashboard
Response: {
  metrics: AuthorMetrics;
  templates: AuthorTemplate[];
  reviews: Review[];
  revenue: RevenueData;
  analytics: AnalyticsData;
  notifications: Notification[];
}
```

#### Get Template Analytics
```typescript
GET /api/marketplace/author/templates/:id/analytics
Query: {
  period?: '7d' | '30d' | '90d' | '1y';
  metrics?: string[];
}
Response: {
  downloads: TimeSeriesData;
  ratings: RatingDistribution;
  revenue: RevenueData;
  demographics: UserDemographics;
  performance: PerformanceMetrics;
}
```

### Admin Dashboard (10-marketplace-admin.html)

#### Get Admin Overview
```typescript
GET /api/admin/marketplace/overview
Response: {
  systemHealth: SystemHealth;
  pendingReviews: Template[];
  flaggedContent: FlaggedContent[];
  platformMetrics: PlatformMetrics;
  recentActivity: AdminActivity[];
}
```

#### Review Template Submission
```typescript
POST /api/admin/marketplace/templates/:id/review
Body: {
  decision: 'approve' | 'reject';
  feedback?: string;
  conditions?: string[];
}
Response: {
  template: Template;
  notification: NotificationSent;
}
```

## Database Schema

### Templates Table
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    short_description VARCHAR(300),
    author_id UUID REFERENCES users(id),
    category_id UUID REFERENCES template_categories(id),
    tags TEXT[] DEFAULT '{}',
    icon_url VARCHAR(500),
    screenshot_urls TEXT[] DEFAULT '{}',
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    status template_status DEFAULT 'draft',
    workflow_data JSONB NOT NULL,
    dependencies JSONB DEFAULT '[]',
    pricing_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_author ON templates(author_id);
CREATE INDEX idx_templates_rating ON templates(rating DESC);
CREATE INDEX idx_templates_downloads ON templates(download_count DESC);
CREATE INDEX idx_templates_published ON templates(published_at DESC);
```

### Reviews Table
```sql
CREATE TABLE template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    use_case TEXT,
    verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    sentiment VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    author_response JSONB
);

CREATE INDEX idx_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_reviews_rating ON template_reviews(rating DESC);
CREATE INDEX idx_reviews_helpful ON template_reviews(helpful_count DESC);
```

### Installations Table
```sql
CREATE TABLE template_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id),
    user_id UUID REFERENCES users(id),
    status installation_status DEFAULT 'pending',
    configuration JSONB DEFAULT '{}',
    customizations JSONB DEFAULT '{}',
    dependencies JSONB DEFAULT '[]',
    error_logs TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_installations_user ON template_installations(user_id);
CREATE INDEX idx_installations_template ON template_installations(template_id);
CREATE INDEX idx_installations_status ON template_installations(status);
```

## Real-time Features

### WebSocket Events
```typescript
// Installation progress updates
interface InstallationProgressEvent {
  type: 'installation_progress';
  installationId: string;
  status: InstallationStatus;
  progress: number;
  currentStep: string;
  logs?: string[];
}

// Template validation updates
interface ValidationUpdateEvent {
  type: 'validation_update';
  templateId: string;
  validationResults: ValidationResult[];
  status: 'validating' | 'completed' | 'failed';
}

// Admin notifications
interface AdminNotificationEvent {
  type: 'admin_notification';
  category: 'pending_review' | 'flagged_content' | 'system_alert';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
```

## Search & Analytics

### Elasticsearch Integration
```typescript
// Template search index
interface TemplateSearchDocument {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  tags: string[];
  category: string;
  authorName: string;
  rating: number;
  downloadCount: number;
  publishedAt: Date;
  complexity: number;
  searchKeywords: string[];
}

// Search aggregations
interface SearchFacets {
  categories: { name: string; count: number; }[];
  tags: { name: string; count: number; }[];
  ratings: { rating: number; count: number; }[];
  pricing: { type: string; count: number; }[];
  complexity: { level: string; count: number; }[];
}
```

### Analytics Events
```typescript
// Template interaction tracking
interface TemplateAnalyticsEvent {
  eventType: 'view' | 'download' | 'install' | 'search' | 'review';
  templateId: string;
  userId?: string;
  sessionId: string;
  metadata: any;
  timestamp: Date;
}

// Search analytics
interface SearchAnalyticsEvent {
  query: string;
  filters: any;
  resultsCount: number;
  clickedResults: string[];
  sessionId: string;
  timestamp: Date;
}
```

## Security & Validation

### Template Validation Pipeline
```typescript
interface ValidationPipeline {
  securityScan: SecurityScanResult;
  codeQuality: CodeQualityResult;
  performanceTest: PerformanceTestResult;
  dependencyCheck: DependencyCheckResult;
  contentModeration: ContentModerationResult;
}

interface SecurityScanResult {
  passed: boolean;
  vulnerabilities: SecurityVulnerability[];
  riskScore: number;
  recommendations: string[];
}
```

### Content Moderation
```typescript
interface ContentModerationResult {
  passed: boolean;
  flaggedContent: FlaggedContent[];
  sentiment: number;
  toxicity: number;
  spam: number;
}

interface FlaggedContent {
  field: string;
  reason: string;
  confidence: number;
  suggestion?: string;
}
```

## Caching Strategy

### Redis Cache Keys
```typescript
// Template data caching
const TEMPLATE_CACHE_KEY = 'template:{id}';
const TEMPLATE_SEARCH_CACHE_KEY = 'search:{hash}';
const FEATURED_TEMPLATES_KEY = 'featured:templates';
const CATEGORY_TEMPLATES_KEY = 'category:{categoryId}:templates';

// User-specific caching
const USER_TEMPLATES_KEY = 'user:{userId}:templates';
const USER_INSTALLATIONS_KEY = 'user:{userId}:installations';
const AUTHOR_DASHBOARD_KEY = 'author:{authorId}:dashboard';

// Analytics caching
const TEMPLATE_ANALYTICS_KEY = 'analytics:template:{id}:{period}';
const PLATFORM_METRICS_KEY = 'metrics:platform:{period}';
```

## File Storage

### Asset Management
```typescript
// Template assets storage paths
const TEMPLATE_ICON_PATH = 'templates/{templateId}/icon.{ext}';
const TEMPLATE_SCREENSHOTS_PATH = 'templates/{templateId}/screenshots/';
const TEMPLATE_DOCUMENTATION_PATH = 'templates/{templateId}/docs/';
const TEMPLATE_WORKFLOW_PATH = 'templates/{templateId}/workflow.json';

// User uploaded assets
const USER_UPLOADS_PATH = 'uploads/{userId}/{timestamp}/';
```

## Background Jobs

### Queue Processing
```typescript
// Template processing jobs
interface TemplateProcessingJob {
  type: 'validate_template' | 'publish_template' | 'update_metrics';
  templateId: string;
  priority: number;
  data: any;
}

// Analytics processing jobs
interface AnalyticsJob {
  type: 'update_download_count' | 'calculate_ratings' | 'generate_report';
  entityId: string;
  period?: string;
  data: any;
}

// Notification jobs
interface NotificationJob {
  type: 'template_approved' | 'review_received' | 'installation_complete';
  recipientId: string;
  templateData: any;
}
```

## Performance Considerations

### Database Optimization
- Index optimization for search queries
- Partitioning for analytics tables
- Read replicas for marketplace browse
- Connection pooling for high concurrency

### Caching Strategy
- Template metadata in Redis
- Search results caching with TTL
- CDN for static assets
- Browser caching for UI components

### API Rate Limiting
- Search API: 100 requests/minute per user
- Installation API: 10 requests/minute per user
- Publishing API: 5 requests/hour per author
- Admin API: No limits for verified admins

This mapping provides a comprehensive technical foundation for implementing the Template Marketplace feature, ensuring all UXD mockups are properly backed by scalable backend systems.