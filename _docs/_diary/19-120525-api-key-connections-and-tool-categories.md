# Diary Entry 19: API Key Connections & Tool Categories

**Date:** 2025-12-05  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

Extended the Connections feature to support API key authentication (in addition to OAuth), successfully connected Browserbase, and discovered architectural insights about tool categories that will guide future platform development.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/connections/services/composio.ts` | Modify | Added `initiateApiKeyConnection()` function | ~30 |
| `app/api/connections/connect/route.ts` | Modify | Added `apiKey` parameter, branches between OAuth and API key flows | ~20 |
| `app/(pages)/profile/components/connections/ApiKeyModal.tsx` | Create | Modal component for entering API keys | ~80 |
| `app/(pages)/profile/components/connections/AddConnectionView.tsx` | Modify | Detects `authScheme === "API_KEY"`, opens ApiKeyModal | ~20 |
| `app/(pages)/profile/hooks/useConnections.ts` | Modify | Added `initiateApiKeyConnection()` function | ~15 |

### Phase 1: Backend API Key Support

Added ability for `/api/connections/connect` to accept API keys directly:

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

### Phase 2: Frontend API Key Modal

- Modal component for entering API keys
- Shows integration name/logo
- Handles loading, error, and success states
- Validates input before submission

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Scheme Detection | Check `authScheme === "API_KEY"` | Determines which flow to use |
| API Key Storage | Passed directly to Composio | Composio handles secure storage |
| UX Pattern | Modal instead of redirect | Immediate feedback for API key connections |

---

## 4. Technical Deep Dive

### Discovery: Browserbase vs Browserless

After connecting Browserbase, we discovered its Composio tools are **infrastructure-level**:
- Create Browser Session
- List Browser Sessions
- Retrieve Session Logs
- Download Session Artifacts

These are useful for **managing browser infrastructure** but don't include high-level automation like navigate, click, screenshot, extract content.

**Browserless** (different toolkit) has these automation tools, but requires separate connection.

### Architectural Insight: Three Tool Categories

This led to recognizing three distinct tool categories:

| Category | Source | Auth | Example |
|----------|--------|------|---------|
| **Custom Tools** | User-defined workflows | None | Draft Release Notes |
| **Connection Tools** | Composio (user auth) | OAuth/API Key | Gmail, Browserbase |
| **First-class Integration Tools** | Platform-built | Platform-managed | Browser automation (planned) |

**Why First-class Integration Tools?**
Some capabilities are fundamental enough that users shouldn't need to:
1. Find the right provider (Browserbase vs Browserless vs Hyperbrowser)
2. Manage API keys
3. Understand infrastructure vs automation differences

---

## 5. Lessons Learned

- **API key auth is simpler:** No redirect flow, immediate connection
- **Tool categories matter:** Infrastructure vs automation tools serve different purposes
- **First-class integrations:** Some capabilities should be platform-provided, not user-configured

---

## 6. Next Steps

- [ ] Implement first-class browser automation tools
- [ ] Add more API key integrations
- [ ] Improve tool category discovery
- [ ] Document tool category patterns

---

## References

- **Related Diary:** `15-ComposioIntegrationsPlatform.md` - Initial implementation
- **Related Diary:** `20-ComposioToolkitAuthModes.md` - Auth mode discovery

---

**Last Updated:** 2025-12-05
