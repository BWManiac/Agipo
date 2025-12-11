# Version Control - Frontend-Backend Mapping

## Overview
This document outlines the technical implementation mapping between frontend UXD mockups and backend system architecture for the Version Control feature.

## Core Entities

### Version Entity
```typescript
interface Version {
  id: string;
  slug: string;
  version: string;
  name: string;
  description: string;
  workflowId: string;
  branchName: string;
  commitHash: string;
  author: AuthorInfo;
  createdAt: Date;
  updatedAt: Date;
  parentVersionId?: string;
  tags: VersionTag[];
  changes: VersionChange[];
  metadata: VersionMetadata;
  status: VersionStatus;
}

interface AuthorInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface VersionTag {
  id: string;
  name: string;
  description?: string;
  color: string;
  type: 'release' | 'hotfix' | 'feature' | 'custom';
  createdAt: Date;
}

interface VersionChange {
  id: string;
  type: 'node_added' | 'node_removed' | 'node_modified' | 'connection_added' | 'connection_removed' | 'metadata_changed';
  nodeId?: string;
  connectionId?: string;
  before: any;
  after: any;
  path: string;
  description: string;
}

interface VersionMetadata {
  nodeCount: number;
  connectionCount: number;
  complexity: number;
  fileSize: number;
  checksum: string;
  validationResults: ValidationResult[];
}

enum VersionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}
```

### Branch Entity
```typescript
interface Branch {
  id: string;
  name: string;
  workflowId: string;
  isDefault: boolean;
  isProtected: boolean;
  parentBranchId?: string;
  headVersionId: string;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorInfo;
  description?: string;
  protection: BranchProtection;
  mergeStrategy: MergeStrategy;
}

interface BranchProtection {
  requirePullRequest: boolean;
  requireReviews: boolean;
  minReviewers: number;
  requireStatusChecks: boolean;
  restrictPushers: boolean;
  allowedPushers: string[];
  allowForcePush: boolean;
  allowDeletion: boolean;
}

enum MergeStrategy {
  MERGE = 'merge',
  SQUASH = 'squash',
  REBASE = 'rebase'
}
```

### PullRequest Entity
```typescript
interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  workflowId: string;
  sourceBranchId: string;
  targetBranchId: string;
  author: AuthorInfo;
  status: PullRequestStatus;
  reviews: Review[];
  comments: Comment[];
  commits: PullRequestCommit[];
  changes: VersionChange[];
  checks: StatusCheck[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  mergedAt?: Date;
  mergedBy?: AuthorInfo;
}

interface Review {
  id: string;
  reviewer: AuthorInfo;
  status: 'pending' | 'approved' | 'changes_requested' | 'dismissed';
  comment?: string;
  submittedAt?: Date;
  lineComments: LineComment[];
}

interface Comment {
  id: string;
  author: AuthorInfo;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  path?: string;
  lineNumber?: number;
  parentId?: string;
  reactions: Reaction[];
}

interface StatusCheck {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failure' | 'error';
  description?: string;
  targetUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

enum PullRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
  DRAFT = 'draft'
}
```

### Backup Entity
```typescript
interface Backup {
  id: string;
  workflowId: string;
  versionId: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  compressionRatio: number;
  filePath: string;
  checksum: string;
  encryption: EncryptionInfo;
  createdAt: Date;
  expiresAt?: Date;
  retentionPolicy: RetentionPolicy;
  metadata: BackupMetadata;
}

interface EncryptionInfo {
  encrypted: boolean;
  algorithm?: string;
  keyId?: string;
}

interface RetentionPolicy {
  type: 'days' | 'versions' | 'forever';
  value?: number;
  priority: 'low' | 'medium' | 'high';
}

interface BackupMetadata {
  originalSize: number;
  compressionTime: number;
  validationPassed: boolean;
  automaticCleanup: boolean;
  tags: string[];
}

enum BackupType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  EMERGENCY = 'emergency',
  PRE_DEPLOYMENT = 'pre_deployment'
}

enum BackupStatus {
  CREATING = 'creating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CORRUPTED = 'corrupted',
  EXPIRED = 'expired'
}
```

## API Endpoints

### Version History (01-version-history.html)

#### Get Version History
```typescript
GET /api/workflows/:id/versions
Query: {
  branch?: string;
  author?: string;
  since?: string;
  until?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
Response: {
  versions: Version[];
  totalCount: number;
  branches: Branch[];
  tags: VersionTag[];
  stats: VersionStats;
}
```

#### Create Version
```typescript
POST /api/workflows/:id/versions
Body: {
  name: string;
  description?: string;
  branchName: string;
  workflowData: any;
  tags?: string[];
  parentVersionId?: string;
}
Response: {
  version: Version;
  changes: VersionChange[];
}
```

### Branch Management (02-branch-management.html)

#### Get Branches
```typescript
GET /api/workflows/:id/branches
Response: {
  branches: Branch[];
  defaultBranch: string;
  protectedBranches: string[];
  conflicts: MergeConflict[];
}
```

#### Create Branch
```typescript
POST /api/workflows/:id/branches
Body: {
  name: string;
  description?: string;
  sourceBranch: string;
  sourceVersionId?: string;
}
Response: {
  branch: Branch;
  headVersion: Version;
}
```

#### Merge Branches
```typescript
POST /api/workflows/:id/branches/:name/merge
Body: {
  targetBranch: string;
  strategy: MergeStrategy;
  commitMessage?: string;
  deleteBranchAfter?: boolean;
}
Response: {
  mergeResult: MergeResult;
  conflicts?: MergeConflict[];
  newVersion?: Version;
}
```

### Diff Viewer (03-diff-viewer.html)

#### Get Version Diff
```typescript
GET /api/workflows/:id/versions/:fromId/compare/:toId
Query: {
  format?: 'unified' | 'split' | 'visual';
  context?: number;
}
Response: {
  changes: VersionChange[];
  summary: DiffSummary;
  fileTree: DiffFileTree[];
  visualization: VisualDiff;
}
```

#### Get File Content
```typescript
GET /api/workflows/:id/versions/:versionId/files/:path
Response: {
  content: string;
  encoding: string;
  size: number;
  lastModified: Date;
}
```

### Collaborative Editing (04-collaborative-editing.html)

#### Join Collaboration Session
```typescript
POST /api/workflows/:id/collaborate/join
Body: {
  branchName: string;
}
Response: {
  sessionId: string;
  participants: Participant[];
  permissions: Permission[];
}
```

#### Send Collaboration Event
```typescript
POST /api/collaborate/:sessionId/events
Body: {
  type: 'cursor_move' | 'selection_change' | 'edit_start' | 'edit_end' | 'comment';
  data: any;
  timestamp: Date;
}
Response: {
  acknowledged: boolean;
  sequenceId: number;
}
```

### Review Workflow (05-review-workflow.html)

#### Create Pull Request
```typescript
POST /api/workflows/:id/pull-requests
Body: {
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  reviewers?: string[];
}
Response: {
  pullRequest: PullRequest;
  changes: VersionChange[];
  checks: StatusCheck[];
}
```

#### Submit Review
```typescript
POST /api/pull-requests/:id/reviews
Body: {
  status: 'approve' | 'request_changes' | 'comment';
  comment?: string;
  lineComments?: LineComment[];
}
Response: {
  review: Review;
  pullRequestStatus: PullRequestStatus;
}
```

### Rollback Interface (06-rollback-interface.html)

#### Create Rollback Plan
```typescript
POST /api/workflows/:id/rollback/plan
Body: {
  targetVersionId: string;
  rollbackType: 'hard' | 'soft' | 'selective';
  selectedFiles?: string[];
}
Response: {
  plan: RollbackPlan;
  impact: ImpactAnalysis;
  validation: ValidationResult[];
}
```

#### Execute Rollback
```typescript
POST /api/workflows/:id/rollback/execute
Body: {
  planId: string;
  reason?: string;
  createBackup?: boolean;
  notifyTeam?: boolean;
}
Response: {
  rollbackId: string;
  status: 'started' | 'completed' | 'failed';
  newVersion?: Version;
}
```

### Backup Management (07-backup-management.html)

#### Get Backups
```typescript
GET /api/workflows/:id/backups
Query: {
  type?: BackupType;
  status?: BackupStatus;
  since?: string;
  limit?: number;
}
Response: {
  backups: Backup[];
  totalSize: number;
  storageQuota: StorageQuota;
  schedule: BackupSchedule;
}
```

#### Create Backup
```typescript
POST /api/workflows/:id/backups
Body: {
  name?: string;
  description?: string;
  type: BackupType;
  compress?: boolean;
  encrypt?: boolean;
}
Response: {
  backup: Backup;
  estimatedTime: number;
}
```

#### Restore Backup
```typescript
POST /api/workflows/:id/backups/:backupId/restore
Body: {
  createBackupFirst?: boolean;
  targetBranch?: string;
  restoreType: 'full' | 'selective';
  selectedFiles?: string[];
}
Response: {
  restoreId: string;
  status: 'started';
  estimatedTime: number;
}
```

### Version Settings (08-version-settings.html)

#### Get Version Control Settings
```typescript
GET /api/workflows/:id/settings/version-control
Response: {
  general: GeneralSettings;
  versioning: VersioningSettings;
  backup: BackupSettings;
  collaboration: CollaborationSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
}
```

#### Update Settings
```typescript
PUT /api/workflows/:id/settings/version-control
Body: {
  section: string;
  settings: any;
}
Response: {
  updated: boolean;
  validation: ValidationResult[];
}
```

## Database Schema

### Versions Table
```sql
CREATE TABLE versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    commit_hash VARCHAR(64),
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    parent_version_id UUID REFERENCES versions(id),
    workflow_data JSONB NOT NULL,
    changes JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    status version_status DEFAULT 'draft'
);

CREATE INDEX idx_versions_workflow ON versions(workflow_id);
CREATE INDEX idx_versions_branch ON versions(branch_name);
CREATE INDEX idx_versions_created ON versions(created_at DESC);
CREATE INDEX idx_versions_author ON versions(author_id);
```

### Branches Table
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    is_protected BOOLEAN DEFAULT FALSE,
    parent_branch_id UUID REFERENCES branches(id),
    head_version_id UUID REFERENCES versions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    author_id UUID REFERENCES users(id),
    description TEXT,
    protection JSONB DEFAULT '{}',
    merge_strategy VARCHAR(20) DEFAULT 'merge',
    
    UNIQUE(workflow_id, name)
);

CREATE INDEX idx_branches_workflow ON branches(workflow_id);
CREATE INDEX idx_branches_default ON branches(workflow_id, is_default);
```

### Pull Requests Table
```sql
CREATE TABLE pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    source_branch_id UUID REFERENCES branches(id),
    target_branch_id UUID REFERENCES branches(id),
    author_id UUID REFERENCES users(id),
    status pull_request_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    merged_at TIMESTAMP,
    merged_by_id UUID REFERENCES users(id),
    
    UNIQUE(workflow_id, number)
);

CREATE INDEX idx_pull_requests_workflow ON pull_requests(workflow_id);
CREATE INDEX idx_pull_requests_status ON pull_requests(status);
CREATE INDEX idx_pull_requests_author ON pull_requests(author_id);
```

### Reviews Table
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pull_request_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    status review_status DEFAULT 'pending',
    comment TEXT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_pull_request ON reviews(pull_request_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
```

### Backups Table
```sql
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    version_id UUID REFERENCES versions(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type backup_type NOT NULL,
    status backup_status DEFAULT 'creating',
    size BIGINT,
    compression_ratio DECIMAL(5,4),
    file_path VARCHAR(500),
    checksum VARCHAR(64),
    encryption JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    retention_policy JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_backups_workflow ON backups(workflow_id);
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_expires ON backups(expires_at);
```

## Real-time Features

### WebSocket Events
```typescript
// Collaborative editing events
interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'cursor_moved' | 'selection_changed' | 'edit_started' | 'edit_completed' | 'conflict_detected';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

// Version control events
interface VersionEvent {
  type: 'version_created' | 'branch_created' | 'pull_request_opened' | 'review_submitted' | 'backup_completed';
  workflowId: string;
  data: any;
  timestamp: Date;
}

// Backup progress events
interface BackupProgressEvent {
  type: 'backup_progress' | 'restore_progress';
  backupId: string;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}
```

### Server-Sent Events
```typescript
// Real-time status updates
GET /api/workflows/:id/events
Events:
- version.created
- branch.updated
- pullrequest.review_requested
- backup.completed
- conflict.detected
- settings.updated
```

## Storage & File Management

### Version Storage
```typescript
// File paths for version artifacts
const VERSION_STORAGE_PATHS = {
  workflow: 'workflows/{workflowId}/versions/{versionId}/workflow.json',
  metadata: 'workflows/{workflowId}/versions/{versionId}/metadata.json',
  changes: 'workflows/{workflowId}/versions/{versionId}/changes.json',
  assets: 'workflows/{workflowId}/versions/{versionId}/assets/',
  diffs: 'workflows/{workflowId}/versions/{versionId}/diffs/'
};

// Backup storage paths
const BACKUP_STORAGE_PATHS = {
  backup: 'backups/{workflowId}/{backupId}.tar.gz',
  metadata: 'backups/{workflowId}/{backupId}.metadata.json',
  index: 'backups/{workflowId}/index.json'
};
```

### Content Addressing
```typescript
interface ContentHash {
  algorithm: 'sha256' | 'blake3';
  hash: string;
  size: number;
}

interface ContentStore {
  put(content: string | Buffer): Promise<ContentHash>;
  get(hash: string): Promise<Buffer>;
  exists(hash: string): Promise<boolean>;
  delete(hash: string): Promise<void>;
}
```

## Background Jobs

### Job Processing
```typescript
// Version processing jobs
interface VersionJob {
  type: 'create_version' | 'merge_branches' | 'rollback_version';
  workflowId: string;
  data: any;
  priority: number;
  retries: number;
}

// Backup jobs
interface BackupJob {
  type: 'create_backup' | 'restore_backup' | 'cleanup_expired' | 'verify_integrity';
  workflowId: string;
  backupId?: string;
  data: any;
  schedule?: string;
}

// Notification jobs
interface NotificationJob {
  type: 'review_requested' | 'pull_request_merged' | 'backup_failed';
  recipientId: string;
  data: any;
  channels: string[];
}
```

### Scheduled Tasks
```typescript
// Automatic backup scheduling
interface BackupSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  time?: string;
  daysOfWeek?: number[];
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
}

// Cleanup tasks
interface CleanupSchedule {
  oldVersions: {
    enabled: boolean;
    olderThan: number; // days
    keepMinimum: number;
  };
  expiredBackups: {
    enabled: boolean;
    checkInterval: number; // hours
  };
}
```

## Security & Access Control

### Permission System
```typescript
interface VersionControlPermissions {
  view: boolean;
  edit: boolean;
  createVersions: boolean;
  manageBranches: boolean;
  reviewPullRequests: boolean;
  manageBackups: boolean;
  rollbackVersions: boolean;
  manageSettings: boolean;
}

interface BranchPermissions {
  push: boolean;
  merge: boolean;
  delete: boolean;
  forceUpdate: boolean;
  bypassReviews: boolean;
}
```

### Audit Logging
```typescript
interface AuditLog {
  id: string;
  workflowId: string;
  action: string;
  actor: AuthorInfo;
  target?: string;
  before?: any;
  after?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

## Performance Optimization

### Caching Strategy
```typescript
// Redis cache keys
const CACHE_KEYS = {
  version: 'version:{versionId}',
  versionList: 'workflow:{workflowId}:versions:{page}:{filters}',
  branchList: 'workflow:{workflowId}:branches',
  pullRequestList: 'workflow:{workflowId}:pulls:{status}',
  backupList: 'workflow:{workflowId}:backups',
  diff: 'diff:{fromId}:{toId}:{format}'
};

// Cache TTL configuration
const CACHE_TTL = {
  version: 3600, // 1 hour
  versionList: 300, // 5 minutes
  branches: 600, // 10 minutes
  pullRequests: 180, // 3 minutes
  diff: 1800 // 30 minutes
};
```

### Database Optimization
```typescript
// Partitioning strategy for versions table
CREATE TABLE versions_y2024m01 PARTITION OF versions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

// Indexing for performance
CREATE INDEX CONCURRENTLY idx_versions_workflow_created 
    ON versions(workflow_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_pull_requests_workflow_status 
    ON pull_requests(workflow_id, status) 
    WHERE status IN ('open', 'draft');
```

This comprehensive mapping provides the foundation for implementing a robust version control system that supports collaboration, backup management, and advanced workflow versioning capabilities.