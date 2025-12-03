# Task 7: Composio Integrations Research Spike

**Status:** Research Complete  
**Date:** December 2025  
**Goal:** Understand Composio's data model and fix our integrations implementation

---

## 1. Problem Statement

Our Integrations dialog is failing with:
```
400 {"error":{"message":"Auth config not found","code":607,"status":400}}
```

The frontend UI is built (IntegrationSettingsDialog, IntegrationTable, etc.) but the backend API calls are not returning data correctly.

## 2. Research Findings

### 2.1 Composio Data Model (Confirmed from SDK Type Definitions)

Composio has **two distinct concepts**:

1. **Auth Configs** (`authConfigs`) - Pre-configured authentication templates
   - Created in Composio dashboard or via API
   - Define HOW to authenticate with a service (OAuth2, API Key, Basic, etc.)
   - Have IDs like `ac_FpW8_GwXyMBz` or `auth_abc123`
   - Include: name, toolkit, auth scheme, credentials, scopes, status
   - Example: "gmail-oxzcjt" with OAuth2

2. **Connected Accounts** (`connectedAccounts`) - Actual user connections
   - Created when a user authorizes access using an Auth Config
   - Link a specific user to a specific Auth Config
   - Have IDs like `conn_abc123`
   - Include: userId, authConfigId, status, credentials

### 2.2 API Methods (from SDK type definitions)

**Auth Configs API** (`composio.authConfigs`):
```typescript
// List all auth configs (what we need for "available integrations")
const allConfigs = await composio.authConfigs.list();

// List auth configs for a specific toolkit
const githubConfigs = await composio.authConfigs.list({ toolkit: 'github' });

// Get a specific auth config
const authConfig = await composio.authConfigs.get('auth_abc123');
```

**Connected Accounts API** (`composio.connectedAccounts`):
```typescript
// List all connected accounts for a user
const userAccounts = await composio.connectedAccounts.list({ userIds: ['user_123'] });

// INITIATE REQUIRES AUTH CONFIG ID, NOT APP NAME!
const connectionRequest = await composio.connectedAccounts.initiate(
  'user_123',           // userId
  'auth_config_123',    // authConfigId (NOT app name!)
  {
    callbackUrl: 'https://your-app.com/callback',
  }
);
```

### 2.3 Root Cause of Our Bug

**Our code is wrong:**
```typescript
// WRONG - passing appName as authConfigId
await client.connectedAccounts.initiate(userId, appName, {...})
```

**Should be:**
```typescript
// CORRECT - need to pass actual auth config ID
await client.connectedAccounts.initiate(userId, 'ac_FpW8_GwXyMBz', {...})
```

The second parameter to `initiate()` is `authConfigId`, not `appName`. Composio returns "Auth config not found" because "gmail" is not a valid auth config ID.

---

## 3. Correct Implementation Flow

### 3.1 Listing Available Integrations

To show "available integrations" in our UI, we need to:

1. Call `composio.authConfigs.list()` to get all pre-configured auth configs
2. Display each auth config with its name, toolkit, auth type, status
3. This corresponds to what we see in Composio dashboard's "Auth Configs" page

### 3.2 Initiating a New Connection

To connect a user to an integration:

1. User selects an auth config from the list (e.g., "gmail-oxzcjt")
2. Call `composio.connectedAccounts.initiate(userId, authConfigId, { callbackUrl })`
3. Redirect user to OAuth flow (for OAuth2) or directly create connection (for API Key)
4. On callback, the connection is now active

### 3.3 Listing User's Connections

To show a user's active connections:

1. Call `composio.connectedAccounts.list({ userIds: [userId] })`
2. Each connection has an `authConfigId` - can look up auth config details
3. Display status, last activity, etc.

---

## 4. Proposed Backend Changes

### 4.1 Add New Endpoint: List Auth Configs

**File:** `app/api/integrations/auth-configs/route.ts` (new)

```typescript
export async function GET() {
  const client = getComposioClient();
  const authConfigs = await client.authConfigs.list();
  return NextResponse.json(authConfigs);
}
```

### 4.2 Fix: Connect Endpoint

**File:** `app/api/integrations/connect/route.ts` (modify)

Change request body from `appName` to `authConfigId`:

```typescript
type ConnectRequest = {
  authConfigId: string;  // Changed from appName
  userId?: string;
  redirectUri?: string;
};
```

### 4.3 Fix: Composio Service

**File:** `app/api/integrations/services/composio.ts` (modify)

```typescript
// Add new function
export async function listAuthConfigs() {
  const client = getComposioClient();
  return await client.authConfigs.list();
}

// Fix existing function - rename parameter for clarity
export async function initiateConnection(
  userId: string,
  authConfigId: string,  // Was 'appName' - now correctly named
  redirectUri?: string
) {
  const client = getComposioClient();
  const connection = await client.connectedAccounts.initiate(
    userId,
    authConfigId,  // This must be an actual auth config ID!
    { callbackUrl: redirectUri || "..." }
  );
  return connection;
}
```

---

## 5. Proposed Frontend Changes

### 5.1 Update useIntegrations Hook

Change data fetching to:
1. Fetch auth configs (available integrations)
2. Fetch connected accounts (user's connections)
3. Merge data to show "available" and "connected" states

### 5.2 Update AddConnectionDialog

Instead of free-form app name input, show:
- Dropdown/list of available auth configs
- Each with its name, toolkit, auth type
- User selects one to initiate connection

---

## 6. Implementation Order

1. **Backend first:**
   - [ ] Add `listAuthConfigs()` to composio service
   - [ ] Create new `/api/integrations/auth-configs` route
   - [ ] Fix `/api/integrations/connect` to accept `authConfigId`
   - [ ] Test endpoints directly

2. **Frontend second:**
   - [ ] Update `useIntegrations` hook to fetch auth configs
   - [ ] Update `IntegrationTable` to show auth configs
   - [ ] Update `AddConnectionDialog` to select from available auth configs
   - [ ] Test full OAuth flow

---

## 7. Success Criteria

1. `GET /api/integrations/auth-configs` returns list of available auth configs
2. UI shows all available integrations (gmail, github, slack, etc.)
3. User can select an auth config and initiate OAuth flow
4. OAuth callback completes successfully
5. Connected account appears in user's list
6. No more "Auth config not found" errors

---

## 8. Phase 2: Tools & Triggers Discovery

### 8.1 Research Findings (December 3, 2025)

Beyond auth configs and connected accounts, Composio provides APIs to discover **what capabilities** each integration unlocks.

**Toolkits API** (`composio.toolkits`):
```typescript
// Get a specific toolkit with full details
const githubToolkit = await composio.toolkits.get('github');

// List all toolkits
const allToolkits = await composio.toolkits.get({});

// List by category
const devToolkits = await composio.toolkits.get({ category: 'developer-tools' });

// List all categories
const categories = await composio.toolkits.listCategories();

// Authorize a user (creates auth config + initiates connection)
const connectionRequest = await composio.toolkits.authorize(userId, 'github');
```

**Tools API** (`composio.tools`):
```typescript
// List tools for a toolkit
const githubTools = await composio.tools.getRawComposioTools({
  toolkits: ['github'],
  limit: 10
});

// Get a specific tool
const tool = await composio.tools.getRawComposioToolBySlug('GMAIL_SEND_EMAIL');

// Search tools
const searchResults = await composio.tools.getRawComposioTools({
  search: 'send email'
});
```

**Triggers API** (`composio.triggers`):
```typescript
// List all trigger types
const triggerTypes = await composio.triggers.listTypes();

// Get a specific trigger type
const trigger = await composio.triggers.getType('GMAIL_NEW_GMAIL_MESSAGE');

// List all available trigger enums
const triggerEnums = await composio.triggers.listEnum();

// Create a trigger for a user
const trigger = await composio.triggers.create(
  'user_123',
  'GMAIL_NEW_GMAIL_MESSAGE',
  { triggerConfig: { labelIds: 'INBOX', interval: 1 } }
);
```

### 8.2 UX Design: Integration Detail View

Created mockup at: `_docs/UXD/Pages/settings/integrations/variation-2/integration-detail.html`

**Design decisions:**
1. **Nested modal** - Opens on top of the Integrations table (popup in popup)
2. **Header** - Integration icon, name, description, status, categories
3. **Connected Accounts** - List of user's connections with status
4. **Available Tools** - Grid of tool cards showing what agents can do
5. **Available Triggers** - List of events that can start workflows
6. **Documentation link** - Link to Composio docs for full reference

### 8.3 Implementation Plan (Phase 3 - Pending Review)

**New backend endpoints needed:**
- `GET /api/integrations/toolkits/:slug` - Get toolkit details
- `GET /api/integrations/toolkits/:slug/tools` - List tools for a toolkit
- `GET /api/integrations/toolkits/:slug/triggers` - List triggers for a toolkit

**New frontend components needed:**
- `IntegrationDetailModal` - The nested detail view
- `ToolCard` - Display a single tool with name, description
- `TriggerCard` - Display a single trigger with config info

---

## 9. References

- Composio TypeScript SDK types: `node_modules/@composio/core/dist/index.d.ts`
- SDK documentation: https://docs.composio.dev/type-script/core-classes/composio
- Composio Platform: https://platform.composio.dev/
- Our backend service: `app/api/integrations/services/composio.ts`
- Integration Detail Mockup: `_docs/UXD/Pages/settings/integrations/variation-2/integration-detail.html`
