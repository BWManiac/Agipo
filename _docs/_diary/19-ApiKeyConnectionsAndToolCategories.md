# Diary Entry 19: API Key Connections & Tool Categories

**Date:** December 5, 2025  
**Focus:** Extending Connections to support API key auth, discovering tool category gaps

---

## Summary

Extended the Connections feature to support API key authentication (in addition to OAuth), successfully connected Browserbase, and discovered architectural insights about tool categories that will guide future platform development.

---

## What We Built

### Phase 1: Backend API Key Support

Added ability for `/api/connections/connect` to accept API keys directly:

**File:** `app/api/connections/services/composio.ts`
```typescript
export async function initiateApiKeyConnection(
  userId: string,
  authConfigId: string,
  apiKey: string
) {
  const client = getComposioClient();
  const connection = await client.connectedAccounts.initiate(
    userId,
    authConfigId,
    {
      config: {
        authScheme: "API_KEY",
        val: { generic_api_key: apiKey },
      },
    }
  );
  return connection;
}
```

**File:** `app/api/connections/connect/route.ts`
- Added `apiKey` parameter to request body
- Branches between OAuth (redirect) and API key (immediate) flows
- Returns `{ success: true, connectionId, status: "ACTIVE" }` for API key connections

### Phase 2: Frontend API Key Modal

**File:** `app/(pages)/profile/components/connections/ApiKeyModal.tsx` (new)
- Modal component for entering API keys
- Shows integration name/logo
- Handles loading, error, and success states
- Validates input before submission

**File:** `app/(pages)/profile/components/connections/AddConnectionView.tsx`
- Detects `authScheme === "API_KEY"` on card click
- Opens `ApiKeyModal` instead of redirecting
- On success, refreshes connections and returns to list

**File:** `app/(pages)/profile/hooks/useConnections.ts`
- Added `initiateApiKeyConnection(authConfigId, apiKey)` function
- Returns boolean success instead of redirect URL

---

## Discovery: Browserbase vs Browserless

After connecting Browserbase, we discovered its Composio tools are **infrastructure-level**:

| Browserbase Tools (Connected) | What They Do |
|------------------------------|--------------|
| Create Browser Session | Spins up a remote browser instance |
| List Browser Sessions | Lists all sessions |
| Retrieve Session Logs | Gets network/action logs |
| Download Session Artifacts | Downloads files from session |

These are useful for **managing browser infrastructure** but don't include high-level automation like:
- Navigate to URL
- Click element
- Take screenshot
- Extract content

**Browserless** (different toolkit) has these automation tools, but requires separate connection.

---

## Architectural Insight: Three Tool Categories

This led to recognizing three distinct tool categories:

| Category | Source | Auth | Example |
|----------|--------|------|---------|
| **Custom Tools** | User-defined workflows | None | Draft Release Notes |
| **Connection Tools** | Composio (user auth) | OAuth/API Key | Gmail, Browserbase |
| **First-class Integration Tools** | Platform-built | Platform-managed | Browser automation (planned) |

### Why First-class Integration Tools?

Some capabilities are fundamental enough that users shouldn't need to:
1. Find the right provider (Browserbase vs Browserless vs Hyperbrowser)
2. Create accounts and manage API keys
3. Understand provider-specific tool semantics

The platform should provide these "batteries included" with a consistent interface.

**Candidates for first-class tools:**
- Browser automation (navigate, screenshot, scrape)
- Web search
- File operations
- HTTP requests

---

## Fixed: Modal-in-Modal Pattern

The `ConnectionToolEditor` was opening as a Dialog inside the Agent Modal, creating a nested modal (bad UX).

**Solution:** Created `ConnectionToolEditorPanel` - a full-width panel that replaces the tab content instead of overlaying.

### New Component: `ConnectionToolEditorPanel.tsx`

Key features:
- Full-width panel view (no modal)
- **Collapsible sections** by toolkit (click header to expand/collapse)
- Shows selection count per toolkit ("3 / 12 selected")
- Back button returns to capabilities list
- Same save/cancel functionality

### Updated: `CapabilitiesTab.tsx`

- Added `ViewState` type: `"list" | "connection-editor"`
- Clicking "Manage" on Connection Tools → switches to panel view
- Panel's "Back" button → returns to list view

---

## Files Changed

| File | Change |
|------|--------|
| `app/api/connections/services/composio.ts` | Added `initiateApiKeyConnection()` |
| `app/api/connections/connect/route.ts` | Accept `apiKey`, branch logic |
| `app/(pages)/profile/components/connections/ApiKeyModal.tsx` | New component |
| `app/(pages)/profile/components/connections/AddConnectionView.tsx` | Branch on `authScheme` |
| `app/(pages)/profile/hooks/useConnections.ts` | Added `initiateApiKeyConnection()` |
| `app/(pages)/profile/components/connections/ConnectionsDialog.tsx` | Pass new prop |
| `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx` | **New** - Full panel editor |
| `app/(pages)/workforce/components/agent-modal/.../CapabilitiesTab.tsx` | Use panel instead of modal |

---

## Next Steps

1. **Fix modal pattern** - Convert ConnectionToolEditor to panel view
2. **Plan first-class integration tools** - Define architecture for platform-provided tools
3. **Browser automation spike** - Evaluate Browserless/Hyperbrowser/Stagehand for platform integration

---

## References

- Task document: `_docs/_tasks/11-api-key-connections.md`
- Composio Browserless docs: https://docs.composio.dev/toolkits/browserless
- Browserbase docs: https://docs.browserbase.com

