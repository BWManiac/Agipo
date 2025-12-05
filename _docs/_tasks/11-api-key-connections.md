# Task 11: API Key Connections Feature

**Status:** Planning Complete  
**Date:** December 5, 2025  
**Goal:** Extend Connections feature to support API key authentication alongside OAuth

---

## 1. Executive Summary

Our Connections feature currently supports OAuth2 authentication (Gmail, Slack, GitHub, etc.). Many integrations in our Composio dashboard require **API key authentication** instead (Browserbase, ElevenLabs, Perplexity, HeyGen, etc.).

This task extends the existing Connections flow to:
1. Detect auth scheme (OAuth vs API Key) from auth config
2. Show an inline API key input modal instead of OAuth redirect
3. Create immediate connections without redirect flow
4. Surface these connections for use in Agent Capabilities

**End state:** User connects Browserbase via API key → assigns Browserbase tools to Agent → Agent can use browser automation.

---

## 2. Current State Analysis

### 2.1 Working OAuth Flow

```
User clicks Gmail → POST /api/connections/connect → Composio returns redirectUrl 
→ User redirected to Google OAuth → Callback → Connection created → Appears in list
```

### 2.2 Auth Config Response Structure

From `authConfigs.list()`, each item includes:

```typescript
{
  id: "ac_xyz123",           // Used for initiate()
  name: "browserbase-k63nl6",
  authScheme: "API_KEY",     // KEY FIELD: "API_KEY" | "OAUTH2" | "BASIC" | etc.
  expectedInputFields: [...], // Fields user needs to provide
  toolkit: { slug: "browserbase", name: "Browserbase", logo: "..." },
  status: "ENABLED"
}
```

### 2.3 Composio SDK Primitives

**OAuth (current):**
```typescript
const connection = await client.connectedAccounts.initiate(userId, authConfigId, { callbackUrl: "..." });
// Returns: { redirectUrl: "https://...", status: "INITIATED" }
```

**API Key (needed):**
```typescript
const connection = await client.connectedAccounts.initiate(userId, authConfigId, {
  config: { authScheme: "API_KEY", val: { generic_api_key: "bb_live_..." } }
});
// Returns: { id: "conn_...", status: "ACTIVE", redirectUrl: null }
```

| Aspect | OAuth | API Key |
|--------|-------|---------|
| Response `redirectUrl` | URL string | `null` |
| Response `status` | `INITIATED` | `ACTIVE` (immediate) |
| User action | Redirect to provider | Input in modal |

### 2.4 Validation Behavior

Composio validates API keys during `initiate()`:
- Valid key → `status: "ACTIVE"` immediately
- Invalid key → `status: "FAILED"` or error response

**No separate "test connection" primitive exists.** The connect flow IS the validation.

---

## 3. Acceptance Criteria

### Authentication Flow (5 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC1 | Selecting an `authScheme: "API_KEY"` integration shows API key input modal (no redirect) | Click Browserbase → modal appears |
| AC2 | Modal displays integration name and logo from auth config | Visual verification |
| AC3 | Valid API key creates `ACTIVE` connection immediately without page redirect | Submit key → appears in list |
| AC4 | Invalid/empty API key shows inline error message | Submit bad key → error shown |
| AC5 | Successful connection greys out integration in Add Connection view | Connect → card shows "Connected" |

### UI Consistency (3 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC6 | Connections table shows "API KEY" badge for API key connections | Visual verification |
| AC7 | No React console warnings in Connections dialog | Browser console clean |
| AC8 | Disconnect action works for API key connections | Click Disconnect → removed |

### Backwards Compatibility (2 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC9 | OAuth integrations (Gmail, Slack, GitHub) still redirect | Click Gmail → redirects to Google |
| AC10 | Existing OAuth connections unaffected | Gmail connection still works |

### Agent Integration (2 criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC11 | API key connection tools appear in Agent Capabilities | Connect Browserbase → tools visible |
| AC12 | Agent can be assigned API key connection tools | Select tools → save succeeds |

---

## 4. User Flows

### Flow 1: Connect API Key Integration (Happy Path)

```
1. User opens Connections dialog from Profile page
2. User clicks "Add Connection"
3. User sees integration grid with auth type badges
4. User clicks "Browserbase" (shows "API KEY" badge)
5. Modal: "Connect Browserbase - Enter your API key"
6. User pastes API key
7. User clicks "Connect"
8. Loading spinner (brief)
9. Modal closes
10. Browserbase appears in list with "Healthy" status
```

### Flow 2: Connect API Key Integration (Error Path)

```
1-6. Same as Flow 1
7. User clicks "Connect" with invalid key
8. Modal shows error: "Failed to connect. Please check your API key."
9. User can retry or cancel
```

### Flow 3: Update API Key (Delete + Reconnect)

```
1. User has existing Browserbase connection
2. User clicks "Disconnect"
3. Confirmation dialog
4. User confirms
5. Connection removed
6. User reconnects via Flow 1 with new key
```

### Flow 4: Assign API Key Tool to Agent

```
1. User has connected Browserbase
2. User opens Agent modal → Capabilities tab
3. User clicks "Manage" on Connection Tools
4. Browserbase tools appear as available
5. User selects tools
6. User saves
7. Agent has Browserbase capabilities
```

---

## 5. File Impact Analysis

| File | Action | Description |
|------|--------|-------------|
| `app/api/connections/services/composio.ts` | Modify | Add `initiateApiKeyConnection()` function |
| `app/api/connections/connect/route.ts` | Modify | Accept optional `apiKey` in request body |
| `app/(pages)/profile/hooks/useConnections.ts` | Modify | Handle both redirect and immediate success responses |
| `app/(pages)/profile/components/connections/AddConnectionView.tsx` | Modify | Branch on `authScheme`, trigger modal for API_KEY |
| `app/(pages)/profile/components/connections/ConnectionDetailView.tsx` | Modify | Show API key connect option for API_KEY auth |
| `app/(pages)/profile/components/connections/ApiKeyModal.tsx` | **Create** | New modal component for API key input |
| `app/(pages)/profile/components/connections/ConnectionsTable.tsx` | **Fixed** ✅ | React key warning resolved |

### 5.1 UX Mockups

| Mockup | Location | Description |
|--------|----------|-------------|
| API Key Modal | `_docs/UXD/Pages/settings/connections/variation-2/api-key-modal.html` | Modal for entering API key with validation states |

---

## 6. Implementation Phases

### Phase 1: Backend Foundation

**Goal:** API can accept and process API key connections.

**Changes:**
1. Add `initiateApiKeyConnection()` to `composio.ts` service
2. Modify `/connect` route to accept `apiKey` in request body
3. Return `{ success, connectionId, status }` for API key flow

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | `POST /api/connections/connect` with `apiKey` creates connection | cURL/Postman test |
| P1.2 | Response includes `{ success: true, connectionId, status: "ACTIVE" }` | Response inspection |
| P1.3 | Connection appears in `GET /api/connections/list` | API call |
| P1.4 | Invalid API key returns error response | Send bad key |
| P1.5 | OAuth flow (no `apiKey` param) still returns `redirectUrl` | Test Gmail connect |

**Phase 1 Test Flow:**
```bash
# Test API key connection
curl -X POST http://localhost:3000/api/connections/connect \
  -H "Content-Type: application/json" \
  -d '{"authConfigId": "ac_browserbase_xxx", "apiKey": "bb_live_test123"}'

# Expected: { "success": true, "connectionId": "conn_xxx", "status": "ACTIVE" }

# Test OAuth still works
curl -X POST http://localhost:3000/api/connections/connect \
  -H "Content-Type: application/json" \
  -d '{"authConfigId": "ac_gmail_xxx"}'

# Expected: { "redirectUrl": "https://...", "connectionStatus": "INITIATED" }
```

---

### Phase 2: Frontend Modal

**Goal:** UI shows API key input modal for API_KEY integrations.

**Changes:**
1. Create `ApiKeyModal.tsx` component
2. Modify `AddConnectionView.tsx` to detect `authScheme` and show modal
3. Update `useConnections.ts` to handle immediate success response

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | Clicking Browserbase opens ApiKeyModal (not redirect) | Manual UI test |
| P2.2 | Modal shows integration name and logo | Visual check |
| P2.3 | Submit with valid key closes modal, shows success | Enter real key |
| P2.4 | Submit with invalid key shows inline error | Enter bad key |
| P2.5 | Cancel button closes modal without action | Click cancel |
| P2.6 | Clicking Gmail still redirects to OAuth | Click Gmail |

**Phase 2 Test Flow:**
```
1. Open Connections dialog
2. Click "Add Connection"
3. Click Browserbase card
4. Verify modal appears (not redirect)
5. Enter invalid key → verify error
6. Enter valid key → verify success, modal closes
7. Verify connection in list
8. Click Gmail → verify redirect to Google
```

---

### Phase 3: Polish & Integration

**Goal:** Full integration with Agent Capabilities, edge cases handled.

**Changes:**
1. Update `ConnectionDetailView.tsx` for API_KEY display
2. Verify connection tools appear in Agent Capabilities
3. Handle edge cases (loading states, network errors)

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | API key connection shows in ConnectionDetailView correctly | Click connection row |
| P3.2 | Browserbase tools appear in Agent Capabilities after connection | Open agent → Capabilities |
| P3.3 | Agent can be assigned Browserbase tools | Select and save |
| P3.4 | Disconnect works for API key connections | Click Disconnect |
| P3.5 | All 12 main acceptance criteria pass | Full test suite |

**Phase 3 Test Flow (End-to-End):**
```
1. Connect Browserbase via API key modal
2. Verify appears in Connections list
3. Open Agent (e.g., Mira Patel) → Capabilities tab
4. Click "Manage" on Connection Tools
5. Verify Browserbase tools are available
6. Select "Navigate to URL" tool
7. Save
8. Verify tool appears in agent's assigned tools
9. Disconnect Browserbase
10. Verify tools removed from agent capabilities
```

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Default to OAuth for dual-auth integrations | Simpler UX, OAuth is more common |
| No "test connection" button | Composio validates during `initiate()` |
| Edit = Delete + Reconnect | No Composio API for updating credentials |
| API key expiry out of scope | Future enhancement |

---

## 8. Out of Scope

- API key expiry handling/notifications
- Choosing between OAuth/API Key for dual-auth integrations
- Multi-field auth configs (API key + base URL)
- Editing existing API keys in-place

---

## 9. References

- **Diary Entry 15:** Composio Integrations Platform
- **Diary Entry 15.1:** Connections Page Refinement
- **Task 7:** Integrations Research Spike
- **Composio Docs:** https://docs.composio.dev/docs/custom-auth-configs
- **UX Mockup:** `_docs/UXD/Pages/settings/connections/variation-2/api-key-modal.html`

---

## 10. Completed Work

### Bug Fix: React Key Warning ✅

**Issue:** Console warning in `ConnectionsTable.tsx` line 138-139

**Fix:** Changed `<>` to `<Fragment key={...}>`

**Status:** Complete
