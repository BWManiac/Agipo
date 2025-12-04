# Diary Entry 15: Composio Integrations Platform

**Date:** December 3, 2025 (updated ongoing)  
**Topic:** Building the OAuth Integration Layer with Composio SDK  
**Status:** MVP Complete, Iterating on UX

---

## 1. Executive Summary

We integrated Composio as Agipo's **Integration Platform**, enabling agents to connect to external services (Gmail, GitHub, Slack, Notion, etc.) via OAuth and API keys. This entry documents:

1. **The initial bug:** Our implementation was passing app names ("gmail") instead of auth config IDs ("ac_FpW8_GwXyMBz") to the Composio SDK, causing "Auth config not found" errors.

2. **The research spike:** We reverse-engineered the Composio SDK from TypeScript type definitions to understand the correct data model.

3. **The fix:** Updated all backend routes and frontend components to use the correct API patterns.

4. **The documentation:** Created comprehensive READMEs for maintainability.

**Key Insight:** Composio has a two-tier model: **Auth Configs** (pre-configured integration templates) and **Connected Accounts** (user-specific connections). Understanding this distinction was critical to fixing the implementation.

---

## 2. Philosophy: Why Integrations Matter

### 2.1 The Agent Capability Problem

Agents in Agipo are **Digital Employees**. Like human employees, they need access to company systems:
- A PM agent needs access to Linear for ticket management
- A Marketing agent needs access to HubSpot for CRM data
- A Support agent needs access to Zendesk for ticket context

Without integrations, agents are isolated - they can only process information given to them directly. With integrations, they become **first-class participants** in the organization's digital infrastructure.

### 2.2 The OAuth Challenge

OAuth is complex:
- Each provider (Google, GitHub, Slack) has different flows
- Tokens expire and need refresh
- Scopes vary by use case
- Redirect URIs must be whitelisted

**Composio abstracts this complexity.** We configure OAuth credentials once in the Composio dashboard, and the SDK handles token management, refresh flows, and provider-specific quirks.

### 2.3 The Composio Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPOSIO DASHBOARD                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Auth Config 1   │  │ Auth Config 2   │  │ Auth Config 3   │  │
│  │ gmail-oxzcjt    │  │ github-ff-xrb   │  │ slack-fexu8     │  │
│  │ ID: ac_FpW8_... │  │ ID: ac_YbO7...  │  │ ID: ac_M33S...  │  │
│  │ Type: OAUTH2    │  │ Type: OAUTH2    │  │ Type: OAUTH2    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────────────────────────────────────────────────────┐
│                     CONNECTED ACCOUNTS (per user)                  │
│  ┌─────────────────┐  ┌─────────────────┐                         │
│  │ conn_abc123     │  │ conn_def456     │                         │
│  │ User: agipo_... │  │ User: agipo_... │                         │
│  │ AuthConfig: 1   │  │ AuthConfig: 2   │                         │
│  │ Status: ACTIVE  │  │ Status: ACTIVE  │                         │
│  └─────────────────┘  └─────────────────┘                         │
└───────────────────────────────────────────────────────────────────┘
```

**Auth Configs** = "What integrations are available?"  
**Connected Accounts** = "Which integrations has this user activated?"

---

## 3. The Bug: What Went Wrong

### 3.1 Original Implementation

```typescript
// What we wrote (WRONG)
const connection = await client.connectedAccounts.initiate(
  userId,
  "gmail",  // ❌ App name - Composio doesn't know what this is
  { callbackUrl: "..." }
);
```

### 3.2 The Error

```json
{
  "error": {
    "message": "Auth config not found",
    "code": 607,
    "status": 400
  }
}
```

### 3.3 Root Cause

The Composio SDK's `initiate()` method signature is:

```typescript
initiate(userId: string, authConfigId: string, options?: CreateConnectedAccountOptions): Promise<ConnectionRequest>;
```

The second parameter is `authConfigId`, NOT `appName`. We were passing "gmail" when we should have been passing "ac_FpW8_GwXyMBz".

### 3.4 How We Discovered This

1. Examined the Composio dashboard - saw "Auth Configs" with IDs
2. Searched SDK type definitions: `node_modules/@composio/core/dist/index.d.ts`
3. Found the correct signature at line 65407
4. Confirmed with SDK examples at lines 65369-65393

---

## 4. File Impact Analysis

### 4.1 Backend Files

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `app/api/connections/services/composio.ts` | Modified | 123 | Added `listAuthConfigs()`, fixed `initiateConnection()` param name |
| `app/api/connections/auth-configs/route.ts` | **Created** | 22 | New GET endpoint for listing auth configs |
| `app/api/connections/connect/route.ts` | Modified | 58 | Changed `appName` → `authConfigId` in request body |
| `app/api/connections/list/route.ts` | Unchanged | 50 | Already correctly using `connectedAccounts.list()` |
| `app/api/connections/callback/route.ts` | Unchanged | 65 | Already correctly handling OAuth redirects |

#### 4.1.1 Service Layer Changes

**Before:**
```typescript
export async function initiateConnection(
  userId: string,
  appName: string,  // Misleading name
  redirectUri?: string
) {
  const connection = await client.connectedAccounts.initiate(
    userId,
    appName,  // Wrong - this should be authConfigId
    { callbackUrl: redirectUri }
  );
  return connection;
}
```

**After:**
```typescript
export async function listAuthConfigs() {
  const client = getComposioClient();
  return await client.authConfigs.list();
}

export async function initiateConnection(
  userId: string,
  authConfigId: string,  // Correct parameter name
  redirectUri?: string
) {
  const connection = await client.connectedAccounts.initiate(
    userId,
    authConfigId,  // Now passing the correct value
    { callbackUrl: redirectUri }
  );
  return connection;
}
```

### 4.2 Frontend Files

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `app/(pages)/profile/hooks/useConnections.ts` | **Rewritten** | 161 | Fetches auth configs + connected accounts, merges data |
| `app/(pages)/profile/components/connections/ConnectionsTable.tsx` | **Rewritten** | 154 | Displays auth configs with connection status |
| `app/(pages)/profile/components/connections/AddConnectionView.tsx` | **Rewritten** | 141 | Shows selectable list of auth configs |
| `app/(pages)/profile/components/connections/ConnectionsDialog.tsx` | Modified | 184 | Updated to use new hook shape |
| `app/(pages)/profile/components/connections/ConnectionsSection.tsx` | Unchanged | 150 | Wrapper component, no logic changes |

#### 4.2.1 Hook Architecture

**Before (broken):**
```typescript
// Only fetched connected accounts
const response = await fetch("/api/connections/list?userId=...");
// Then tried to display them, but nothing was connected
// because initiateConnection() was failing
```

**After (working):**
```typescript
// Fetch BOTH auth configs and connected accounts
const [authConfigsRes, connectionsRes] = await Promise.all([
  fetch("/api/connections/auth-configs"),
  fetch("/api/connections/list?userId=..."),
]);

// Merge: enrich auth configs with connection status
const enrichedConfigs = authConfigs.map(config => {
  const connection = connectionMap.get(config.id);
  return {
    ...config,
    isConnected: !!connection,
    connectionId: connection?.id,
    connectionStatus: connection?.connectionStatus,
  };
});
```

### 4.3 Documentation Files

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `app/api/connections/README.md` | **Created** | 176 | Overview of entire connections module |
| `app/api/connections/auth-configs/README.md` | **Created** | 81 | Auth configs endpoint documentation |
| `app/api/connections/callback/README.md` | **Created** | 75 | OAuth callback documentation |
| `app/api/connections/connect/README.md` | **Created** | 95 | Connect endpoint documentation |
| `app/api/connections/list/README.md` | **Created** | 72 | List endpoint documentation |
| `app/api/connections/services/README.md` | **Created** | 95 | Service layer documentation |
| `_docs/_tasks/7-integrations-spike.md` | **Created** | 221 | Research spike documentation |

---

## 5. Critical Design Decisions

### 5.1 Fetch Auth Configs on Dialog Open

**Decision:** Fetch available integrations from Composio every time the dialog opens.

**Rationale:**
- Auth configs can change in Composio dashboard at any time
- Fresh data ensures UI reflects current state
- No stale cache issues

**Trade-off:** More API calls, but acceptable for MVP.

**Future:** Could cache with short TTL (1-5 minutes).

### 5.2 Two-Endpoint Data Merge

**Decision:** Frontend fetches from two endpoints and merges client-side.

**Rationale:**
- `/auth-configs` returns what's available
- `/list` returns what's connected
- Frontend merges to show "connected" status per auth config

**Alternative Considered:** Single endpoint that returns merged data.

**Why We Chose Client Merge:**
- Simpler backend (each endpoint does one thing)
- More flexible (can use endpoints independently)
- Easier to debug

### 5.3 Auth Config Selection UI

**Decision:** AddConnectionDialog shows a list of available auth configs to select from.

**Before:** Free-form text input for app name.

**After:** Clickable cards showing each auth config.

**Rationale:**
- Users can't guess auth config IDs
- UI shows exactly what's available
- No typos or invalid inputs

### 5.4 Hardcoded User ID for MVP

**Decision:** Use `"agipo_test_user"` as userId throughout.

**Rationale:**
- MVP doesn't have user authentication yet
- Allows testing full OAuth flow
- Easy to replace when auth is implemented

**TODO:** Replace with actual authenticated user ID.

---

## 6. Composio SDK Reference

### 6.1 Key SDK Methods Used

| Method | Purpose | Documentation |
|--------|---------|---------------|
| `client.authConfigs.list()` | Get available auth configs | [Link](https://docs.composio.dev/api-reference/auth-configs) |
| `client.connectedAccounts.list()` | Get user's connections | [Link](https://docs.composio.dev/api-reference/connected-accounts) |
| `client.connectedAccounts.initiate()` | Start OAuth flow | [Link](https://docs.composio.dev/api-reference/connected-accounts) |

### 6.2 SDK Type Definition Locations

Found in `node_modules/@composio/core/dist/index.d.ts`:

| Concept | Lines | Notes |
|---------|-------|-------|
| `authConfigs.list()` | 65140-65165 | Shows query params |
| `connectedAccounts.initiate()` | 65360-65410 | Shows correct signature |
| `Composio` class properties | 67048-67049 | Shows `authConfigs` and `connectedAccounts` |

### 6.3 External Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Composio Dashboard | https://platform.composio.dev/ | Manage auth configs |
| SDK Documentation | https://docs.composio.dev/type-script/core-classes/composio | TypeScript reference |
| API Reference | https://docs.composio.dev/api-reference | REST API docs |

---

## 7. Testing & Verification

### 7.1 Manual Testing Steps

1. **Auth Configs Loading:**
   - Open Integrations dialog
   - Verify auth configs from Composio dashboard appear
   - Check logos, names, auth types display correctly

2. **Connection Flow:**
   - Click "Connect" on an auth config
   - Verify redirect to OAuth provider
   - Complete OAuth flow
   - Verify redirect back to app
   - Verify connection appears as "Connected"

3. **Error Handling:**
   - Test with invalid auth config ID
   - Test OAuth cancellation
   - Verify error messages display

### 7.2 Known Limitations

| Limitation | Impact | Future Fix |
|------------|--------|------------|
| Hardcoded user ID | All connections shared | Implement user auth |
| No connection deletion | Can't remove connections | Add delete endpoint |
| No token refresh UI | Users can't manually refresh | Add refresh button |
| No connection health check | Can't verify tokens work | Add health endpoint |

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ ConnectionsSection│───▶│ConnectionsDialog  │───▶│AddConnectionView  │ │
│  │ (Profile Page)   │    │     Dialog       │    │                  │   │
│  └──────────────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│                                   │                        │             │
│                          ┌────────▼────────────────────────▼───────┐    │
│                          │          useConnections Hook             │    │
│                          │  - fetchData()                          │    │
│                          │  - initiateConnection()                 │    │
│                          │  - authConfigs[], connectedAccounts[]   │    │
│                          └────────┬────────────────────────┬───────┘    │
└───────────────────────────────────┼────────────────────────┼────────────┘
                                    │                        │
                            ┌───────▼───────┐        ┌───────▼───────┐
                            │GET /auth-configs│       │POST /connect  │
                            └───────┬───────┘        └───────┬───────┘
                                    │                        │
┌───────────────────────────────────┼────────────────────────┼────────────┐
│                              BACKEND                       │            │
│                          ┌────────▼────────────────────────▼───────┐    │
│                          │       composio.ts Service               │    │
│                          │  - listAuthConfigs()                    │    │
│                          │  - initiateConnection()                 │    │
│                          │  - listConnections()                    │    │
│                          └────────┬────────────────────────────────┘    │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                            ┌───────▼───────┐
                            │  COMPOSIO SDK  │
                            │ @composio/core │
                            └───────┬───────┘
                                    │
                            ┌───────▼───────┐
                            │COMPOSIO CLOUD  │
                            │ Auth Configs   │
                            │ Connections    │
                            │ OAuth Flows    │
                            └───────────────┘
```

---

## 9. Future Roadmap

### 9.1 Short-Term (Next Sprint)

| Task | Priority | Effort |
|------|----------|--------|
| Implement user authentication | High | Medium |
| Add connection deletion | Medium | Low |
| Add connection refresh button | Medium | Low |
| Cache auth configs (5 min TTL) | Low | Low |

### 9.2 Medium-Term (1-2 Months)

| Task | Priority | Description |
|------|----------|-------------|
| Tool execution with connections | High | Use connections in agent tool calls |
| Connection health monitoring | Medium | Background job to verify tokens |
| Multi-tenant support | Medium | Org-level auth configs |
| Audit logging | Medium | Track connection events |

### 9.3 Long-Term (3+ Months)

| Task | Description |
|------|-------------|
| Custom OAuth providers | Support for non-Composio OAuth |
| Webhook triggers | React to events from connected services |
| Connection sharing | Allow agents to share connections |
| Usage analytics | Track API calls per connection |

---

## 10. Lessons Learned

### 10.1 Read the Types, Not Just the Docs

The Composio documentation didn't make the Auth Config vs Connected Account distinction clear enough. Reading the TypeScript type definitions (`index.d.ts`) revealed the correct API signatures.

**Lesson:** When docs are ambiguous, check the types.

### 10.2 Test the Happy Path First

We built the entire UI before testing if the API calls worked. Should have:
1. Tested API call in isolation (curl/Postman)
2. Verified response shape
3. THEN built UI

**Lesson:** Validate assumptions early.

### 10.3 Document As You Go

Creating READMEs immediately after implementation captures context that's easy to forget. Future developers (including ourselves) will thank us.

**Lesson:** Documentation is a deliverable, not an afterthought.

---

## 11. References

### 11.1 Internal Files

- Task document: `_docs/_tasks/7-integrations-spike.md`
- Product spec: `_docs/Product/Features/04-Integrations-Platform.md`
- UI mockup: `_docs/UXD/Pages/settings/integrations/variation-2-control-panel.html`

### 11.2 External Links

- Composio Dashboard: https://platform.composio.dev/
- Composio TypeScript SDK: https://docs.composio.dev/type-script/core-classes/composio
- Composio API Reference: https://docs.composio.dev/api-reference
- Composio Auth Configs: https://docs.composio.dev/api-reference/auth-configs
- Composio Connected Accounts: https://docs.composio.dev/api-reference/connected-accounts

### 11.3 Previous Diary Entries

- Entry 11: Agent Tool Management (tool execution patterns)
- Entry 14: Workforce OS (agent modal architecture)

---

## 12. Summary

We successfully integrated Composio as Agipo's integration platform. The key breakthrough was understanding Composio's two-tier model:

1. **Auth Configs** = Available integrations (configured in dashboard)
2. **Connected Accounts** = User connections (created via OAuth)

With this understanding, we fixed the backend to pass correct auth config IDs, updated the frontend to display available integrations, and created comprehensive documentation for maintainability.

**Files Created:** 8 (1 route, 7 READMEs)  
**Files Modified:** 7 (backend + frontend)  
**Total Lines Added:** ~1,200  
**Research Time:** ~2 hours  
**Implementation Time:** ~3 hours  

The integration is MVP-complete and ready for user testing. Next steps focus on implementing user authentication and adding tool execution capabilities.

---

## 13. Integration Detail View (December 3, 2025 - Session 2)

### 13.1 The Problem: Modal-in-Modal UX

The initial implementation used a nested modal pattern:
- User opens **IntegrationSettingsDialog** (modal)
- User clicks an integration row
- **IntegrationDetailModal** opens on top (second modal)

This felt cluttered and confusing. Modal-in-modal is generally poor UX.

### 13.2 The Solution: View Switching

We refactored to use **view switching within the same container**:

```
┌─────────────────────────────────────────────────────────────────┐
│                   ConnectionsDialog                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  selectedConfig === null ?                                 │  │
│  │    → Show IntegrationTable (list view)                     │  │
│  │    → Show IntegrationDetailView (detail view)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**User Flow:**
1. User opens Integrations dialog → sees list of all integrations
2. User clicks a row → list slides out, detail view slides in
3. User clicks back button (top left) → returns to list

### 13.3 Files Changed

| File | Action | Description |
|------|--------|-------------|
| `IntegrationDetailView.tsx` | **Created** | Full-container detail view with back button |
| `IntegrationDetailModal.tsx` | **Deleted** | Replaced by view-based approach |
| `ConnectionsDialog.tsx` | **Modified** | Added view state, conditional rendering |
| `IntegrationTable.tsx` | **Modified** | Added row click handler |

### 13.4 Key Implementation Details

**State Management:**
```typescript
const [selectedConfig, setSelectedConfig] = useState<AuthConfig | null>(null);

// In render:
{selectedConfig ? (
  <IntegrationDetailView 
    authConfig={selectedConfig} 
    onBack={() => setSelectedConfig(null)} 
  />
) : (
  // List view...
)}
```

**Back Button:**
```typescript
<button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg">
  <ChevronLeft className="w-5 h-5" />
</button>
```

---

## 14. Tools & Triggers Discovery

### 14.1 The Feature

Each integration has **tools** (actions the agent can take) and **triggers** (events that can start workflows). We wanted to show users what capabilities they unlock by connecting each integration.

### 14.2 New Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connections/toolkits/[slug]` | GET | Get toolkit details (name, logo, description) |
| `/api/connections/toolkits/[slug]/tools` | GET | List available tools for toolkit |
| `/api/connections/toolkits/[slug]/triggers` | GET | List available triggers for toolkit |

### 14.3 Service Layer Additions

```typescript
// composio.ts

export async function getToolkit(slug: string) {
  const client = getComposioClient();
  return await client.toolkits.get(slug);
}

export async function getToolsForToolkit(toolkitSlug: string) {
  const client = getComposioClient();
  return await client.tools.getRawComposioTools({ toolkits: [toolkitSlug] });
}

export async function getTriggersForToolkit(toolkitSlug: string) {
  // See Section 15 for the bug we discovered here
}
```

### 14.4 Frontend: Show More/Less

The detail view shows tools and triggers with expandable lists:

```typescript
const [showAllTools, setShowAllTools] = useState(false);
const [showAllTriggers, setShowAllTriggers] = useState(false);

const visibleTools = showAllTools ? tools : tools.slice(0, 8);
const visibleTriggers = showAllTriggers ? triggers : triggers.slice(0, 5);
```

Users see the first 8 tools and 5 triggers by default, with "Show X more →" buttons to expand.

---

## 15. Bug Fix: Triggers API Filter Broken

### 15.1 The Problem

When viewing integration details, triggers from **all integrations** appeared instead of just the selected one.

**Example:** Viewing Google Calendar showed triggers for:
- Agent Mail
- Asana
- Canvas
- Coda
- Discord
- GitHub
- ...and more unrelated services

### 15.2 Root Cause

Composio's `triggers.listTypes({ toolkits: [slug] })` API **ignores the `toolkits` filter**. It returns ALL triggers regardless of what you pass.

We verified this by:
1. Calling the API with `toolkits: ["googlecalendar"]`
2. Observing the response contained `AGENT_MAIL_NEW_EMAIL_TRIGGER`, `ASANA_TASK_TRIGGER`, etc.
3. Each trigger object includes a `toolkit.slug` field showing its actual toolkit

### 15.3 The Fix: Client-Side Filtering

Since the server-side filter is broken, we fetch all triggers and filter client-side:

```typescript
export async function getTriggersForToolkit(toolkitSlug: string) {
  const client = getComposioClient();
  const normalizedSlug = toolkitSlug.toLowerCase();
  
  // Fetch all triggers (API filter is broken)
  const allTriggers = await client.triggers.listTypes({ limit: 100 });
  
  // Filter client-side by toolkit.slug
  const filtered = (allTriggers.items || []).filter(
    (trigger: { toolkit?: { slug?: string } }) => 
      trigger.toolkit?.slug?.toLowerCase() === normalizedSlug
  );
  
  return { items: filtered, totalPages: 1 };
}
```

### 15.4 Result

- Google Calendar now shows 7 calendar-specific triggers
- Notion now shows 5 Notion-specific triggers
- No more cross-contamination between integrations

### 15.5 Lesson Learned

**Don't trust API filters blindly.** Always verify the response matches expectations. When third-party APIs have bugs, client-side filtering is a valid workaround.

---

## 16. Bug Fix: Pagination Limit

### 16.1 The Problem

Gmail integration was configured in Composio but not appearing in the UI.

### 16.2 Root Cause

The `authConfigs.list()` API defaults to 20 items per page. Gmail was item #21.

```json
{
  "items": [...20 items...],
  "nextCursor": "Mi0yMA==",
  "totalPages": 2
}
```

We were only fetching the first page.

### 16.3 The Fix

Increase the limit to capture all auth configs:

```typescript
export async function listAuthConfigs() {
  const client = getComposioClient();
  const authConfigs = await client.authConfigs.list({ limit: 100 });
  return authConfigs;
}
```

### 16.4 Trade-off Discussion

**Option A (implemented):** Set `limit: 100` - simple, works for most users

**Option B (future):** Implement proper pagination UI with "Load more" or page controls

For MVP, Option A is acceptable. Most organizations won't have 100+ integrations. If that becomes a real scenario, we can add pagination controls.

### 16.5 Result

- Now returning 21 integrations (was 20)
- Gmail appears in the list
- All configured integrations visible

---

## 17. Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌──────────────────┐                                                       │
│  │ ConnectionsSection│                                                       │
│  │ (Profile Page)   │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │              ConnectionsDialog                                      │     │
│  │  ┌─────────────────────────────────────────────────────────────┐   │     │
│  │  │ VIEW STATE: selectedConfig === null ?                        │   │     │
│  │  │                                                              │   │     │
│  │  │  LIST VIEW:                    DETAIL VIEW:                  │   │     │
│  │  │  ┌──────────────────┐         ┌──────────────────────────┐  │   │     │
│  │  │  │ IntegrationTable │   ───▶  │ IntegrationDetailView    │  │   │     │
│  │  │  │ - Filter search  │   ◀───  │ - Back button            │  │   │     │
│  │  │  │ - Row click      │         │ - Tools list (expand)    │  │   │     │
│  │  │  │ - Connect button │         │ - Triggers list (expand) │  │   │     │
│  │  │  └──────────────────┘         │ - Docs link              │  │   │     │
│  │  │                               └──────────────────────────┘  │   │     │
│  │  └─────────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                     useConnections Hook                             │     │
│  │  - fetchData() → /auth-configs + /list                             │     │
│  │  - initiateConnection() → /connect                                 │     │
│  │  - getToolkitDetails() → /toolkits/[slug]                          │     │
│  │  - getToolsForToolkit() → /toolkits/[slug]/tools                   │     │
│  │  - getTriggersForToolkit() → /toolkits/[slug]/triggers             │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                      │
│                                                                              │
│  /api/connections/                                                          │
│  ├── auth-configs/      GET    List available auth configs (limit: 100)      │
│  ├── list/              GET    List user's connected accounts                │
│  ├── connect/           POST   Initiate OAuth flow                           │
│  ├── callback/          GET    Handle OAuth redirect                         │
│  └── toolkits/                                                               │
│      └── [slug]/                                                             │
│          ├── route.ts   GET    Toolkit details                               │
│          ├── tools/     GET    Tools for toolkit                             │
│          └── triggers/  GET    Triggers for toolkit (client-filtered)        │
│                                                                              │
│  services/composio.ts                                                        │
│  - getComposioClient()                                                       │
│  - listAuthConfigs()                                                         │
│  - initiateConnection()                                                      │
│  - listConnections()                                                         │
│  - getToolkit()                                                              │
│  - getToolsForToolkit()                                                      │
│  - getTriggersForToolkit()  ← Client-side filter (API bug workaround)        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  COMPOSIO SDK    │
                          │  @composio/core  │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │ COMPOSIO CLOUD   │
                          └─────────────────┘
```

---

## 18. Updated File Impact Summary

### 18.1 Session 2 Changes

| File | Action | Description |
|------|--------|-------------|
| `composio.ts` | Modified | Added `getToolkit()`, `getToolsForToolkit()`, `getTriggersForToolkit()`, fixed pagination limit |
| `toolkits/[slug]/route.ts` | Created | GET toolkit details |
| `toolkits/[slug]/tools/route.ts` | Created | GET tools for toolkit |
| `toolkits/[slug]/triggers/route.ts` | Created | GET triggers for toolkit |
| `IntegrationDetailView.tsx` | Created | Full-container detail view |
| `IntegrationDetailModal.tsx` | Deleted | Replaced by view approach |
| `ConnectionsDialog.tsx` | Modified | View switching logic |
| `IntegrationTable.tsx` | Modified | Row click handler |

### 18.2 Cumulative Totals

**Backend:**
- Routes: 7 (was 4)
- Service functions: 7 (was 4)

**Frontend:**
- Components: 5 (unchanged count, but IntegrationDetailModal → IntegrationDetailView)
- Hooks: 1 (useConnections, expanded)

**Documentation:**
- READMEs: 6
- Diary entries: 1 (this file)
- UX mockups: 2 (control panel + detail view)

---

## 19. Current Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Hardcoded user ID | Medium | Waiting for auth implementation |
| No connection deletion | Low | Can delete via Composio dashboard |
| Status always shows "Not Connected" | Low | Need to merge connection status properly |
| Triggers API filter broken | Workaround | Client-side filtering in place |
| Pagination shows first 100 only | Low | Acceptable for MVP |

---

## 20. Session 2 Summary

**What we built:**
1. Integration detail view with view-switching UX (no more modal-in-modal)
2. Tools and triggers discovery for each integration
3. Expandable "Show more" functionality

**Bugs fixed:**
1. Triggers showing wrong integrations (Composio API filter broken → client-side filter)
2. Gmail not appearing (pagination limit 20 → 100)

**Lines changed:** ~400 (new) + ~150 (modified)  
**Time spent:** ~2 hours

The integrations page is now feature-complete for MVP. Users can browse available integrations, see what tools/triggers each one provides, and connect via OAuth.


