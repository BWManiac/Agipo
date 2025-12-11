# Frontend-Backend Mapping: Authenticated Sessions

**Created:** December 2024  
**Status:** UXD Design Phase  
**Related UXD:** Current directory

---

## Overview

This document maps the UI components for Authenticated Sessions to their required backend APIs. The system enables persistent browser profiles with saved authentication state using Anchor Browser's native profile persistence.

---

## API Endpoints

### 1. Profile Management

#### `GET /api/browser-automation/profiles`
**UI Component:** `01-profile-dashboard.html` - Profile grid
**Description:** List all saved browser profiles

**Response:**
```typescript
{
  profiles: Array<{
    id: string;
    name: string;
    description?: string;
    service: 'linkedin' | 'indeed' | 'glassdoor' | 'custom';
    anchorProfileId: string;
    status: 'active' | 'needs_refresh' | 'expired' | 'in_use';
    createdAt: string;
    lastUsed: string;
    usageCount: number;
    metadata: {
      userEmail?: string;
      accountType?: string;
      customFields?: Record<string, unknown>;
    };
    sessions: {
      active: number;
      total: number;
    };
  }>;
  stats: {
    totalProfiles: number;
    activeProfiles: number;
    profilesByService: Record<string, number>;
  };
}
```

---

#### `POST /api/browser-automation/profiles`
**UI Component:** `02-create-profile-wizard.html` - Create button
**Description:** Create a new browser profile

**Request:**
```typescript
{
  name: string;
  description?: string;
  service: 'linkedin' | 'indeed' | 'glassdoor' | 'custom';
  customUrl?: string;
  browserSettings?: {
    viewport?: { width: number; height: number };
    userAgent?: string;
    locale?: string;
    timezone?: string;
  };
}
```

**Response:**
```typescript
{
  profileId: string;
  anchorProfileId: string;
  sessionUrl: string;        // WebSocket URL for live browser
  sessionId: string;
  status: 'initializing' | 'ready';
}
```

---

#### `PATCH /api/browser-automation/profiles/[profileId]`
**UI Component:** `08-profile-update-flow.html` - Update button
**Description:** Update profile metadata or refresh authentication

**Request:**
```typescript
{
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  action?: 'refresh_auth' | 'update_metadata';
}
```

**Response:**
```typescript
{
  success: boolean;
  profile: ProfileData;
  sessionUrl?: string;        // If refresh_auth action
}
```

---

#### `DELETE /api/browser-automation/profiles/[profileId]`
**UI Component:** Profile card - Delete button
**Description:** Delete a saved profile

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 2. Session Management with Profiles

#### `POST /api/browser-automation/sessions`
**UI Component:** `05-session-with-profile.html` - Start session
**Description:** Create a new browser session with optional profile

**Request:**
```typescript
{
  profileId?: string;         // Use existing profile
  persist?: boolean;          // Create new persistent profile
  name?: string;              // Session name
  url?: string;               // Starting URL
  options?: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    recordVideo?: boolean;
  };
}
```

**Response:**
```typescript
{
  sessionId: string;
  profileId?: string;
  websocketUrl: string;
  debuggerUrl: string;
  status: 'starting' | 'ready' | 'authenticated';
  authenticatedServices?: string[];
}
```

---

#### `POST /api/browser-automation/sessions/[sessionId]/save-profile`
**UI Component:** `03-manual-login-flow.html` - Save Profile button
**Description:** Save current session state as a new profile

**Request:**
```typescript
{
  profileName: string;
  description?: string;
  service: string;
  metadata?: {
    userEmail?: string;
    accountType?: string;
  };
}
```

**Response:**
```typescript
{
  profileId: string;
  anchorProfileId: string;
  success: boolean;
  savedState: {
    cookies: number;
    localStorage: boolean;
    sessionStorage: boolean;
  };
}
```

---

#### `GET /api/browser-automation/sessions/[sessionId]/auth-status`
**UI Component:** `03-manual-login-flow.html` - Status indicator
**Description:** Check authentication status for known services

**Response:**
```typescript
{
  authenticated: boolean;
  services: Array<{
    name: string;
    authenticated: boolean;
    userInfo?: {
      email?: string;
      name?: string;
      profileUrl?: string;
    };
  }>;
  suggestedProfileName?: string;
}
```

---

### 3. Profile Status & Validation

#### `POST /api/browser-automation/profiles/[profileId]/validate`
**UI Component:** `07-profile-status-indicators.html` - Refresh icon
**Description:** Check if profile authentication is still valid

**Response:**
```typescript
{
  valid: boolean;
  status: 'active' | 'needs_refresh' | 'expired';
  details: {
    cookiesValid: boolean;
    sessionActive: boolean;
    lastChecked: string;
    expiresAt?: string;
  };
  services: Array<{
    name: string;
    authenticated: boolean;
    error?: string;
  }>;
}
```

---

#### `GET /api/browser-automation/profiles/[profileId]/sessions`
**UI Component:** `09-profile-details-modal.html` - History tab
**Description:** Get session history for a profile

**Query Parameters:**
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```typescript
{
  sessions: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
    duration: number;
    status: 'completed' | 'failed' | 'active';
    tasksExecuted: number;
    pagesVisited: number;
    errors?: string[];
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

### 4. Profile Templates

#### `GET /api/browser-automation/templates`
**UI Component:** Profile wizard - Template selection
**Description:** Get predefined profile templates

**Response:**
```typescript
{
  templates: Array<{
    id: string;
    name: string;
    description: string;
    service: string;
    icon: string;
    settings: {
      startUrl: string;
      viewport: { width: number; height: number };
      userAgent?: string;
    };
    requiredFields: Array<{
      name: string;
      type: 'text' | 'email' | 'password';
      label: string;
      placeholder?: string;
    }>;
  }>;
}
```

---

### 5. Live Browser Control

#### WebSocket: `/api/browser-automation/sessions/[sessionId]/ws`
**UI Component:** `03-manual-login-flow.html` - Browser viewport
**Description:** Live browser control and viewport streaming

**Client → Server Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `navigate` | `{ url: string }` | Navigate to URL |
| `click` | `{ x: number, y: number }` | Click at coordinates |
| `type` | `{ text: string }` | Type text |
| `screenshot` | `{}` | Request screenshot |
| `save_profile` | `{ name: string }` | Save current state |

**Server → Client Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `viewport_update` | `{ imageData: string }` | Base64 viewport image |
| `page_loaded` | `{ url: string, title: string }` | Page navigation complete |
| `auth_detected` | `{ service: string, authenticated: boolean }` | Auth status changed |
| `profile_saved` | `{ profileId: string }` | Profile save complete |
| `error` | `{ message: string }` | Error occurred |

---

## Data Models

### Profile Storage

Located at: `/tmp/anchor-profiles/[profile-name]/`

```typescript
export interface ProfileMetadata {
  id: string;
  name: string;
  description?: string;
  service: string;
  anchorProfileId: string;
  created: string;
  lastUsed: string;
  usageCount: number;
  browserSettings: {
    viewport?: { width: number; height: number };
    userAgent?: string;
  };
  authMetadata?: {
    userEmail?: string;
    accountType?: string;
    lastValidated?: string;
  };
}
```

### Session-Profile Association

```typescript
export interface SessionProfile {
  sessionId: string;
  profileId?: string;
  startedAt: string;
  persist: boolean;
  status: 'active' | 'completed' | 'failed';
}
```

---

## Implementation Priority

### Phase 1: Core Profile Creation
1. `POST /api/browser-automation/profiles`
2. `POST /api/browser-automation/sessions` (with persist flag)
3. `POST /api/browser-automation/sessions/[sessionId]/save-profile`
4. WebSocket browser control

### Phase 2: Profile Usage
1. `GET /api/browser-automation/profiles`
2. `POST /api/browser-automation/sessions` (with profileId)
3. `GET /api/browser-automation/sessions/[sessionId]/auth-status`

### Phase 3: Profile Management
1. `PATCH /api/browser-automation/profiles/[profileId]`
2. `POST /api/browser-automation/profiles/[profileId]/validate`
3. `DELETE /api/browser-automation/profiles/[profileId]`

### Phase 4: Advanced Features
1. `GET /api/browser-automation/templates`
2. `GET /api/browser-automation/profiles/[profileId]/sessions`
3. Multi-profile management

---

## Notes

- **Anchor Integration**: All persistent profiles use Anchor Browser's native profile persistence
- **Security**: Profile data contains sensitive auth state - encrypted at rest
- **Expiration**: Profiles may expire based on service session timeout
- **Concurrency**: One profile can be used by multiple sessions (read-only)
- **Updates**: Profile updates require exclusive access (lock mechanism)