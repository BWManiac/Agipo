# Diary Entry 15: Composio Integrations Platform

**Date:** 2025-12-03  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

We integrated Composio as Agipo's **Integration Platform**, enabling agents to connect to external services (Gmail, GitHub, Slack, Notion, etc.) via OAuth and API keys. This entry documents:

1. **The initial bug:** Our implementation was passing app names ("gmail") instead of auth config IDs ("ac_FpW8_GwXyMBz") to the Composio SDK, causing "Auth config not found" errors.

2. **The research spike:** We reverse-engineered the Composio SDK from TypeScript type definitions to understand the correct data model.

3. **The fix:** Updated all backend routes and frontend components to use the correct API patterns.

4. **The documentation:** Created comprehensive READMEs for maintainability.

**Key Insight:** Composio has a two-tier model: **Auth Configs** (pre-configured integration templates) and **Connected Accounts** (user-specific connections). Understanding this distinction was critical to fixing the implementation.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/connections/services/client.ts` | Create | Composio client factories | ~80 |
| `app/api/connections/services/auth.ts` | Create | OAuth & API key flows | ~70 |
| `app/api/connections/services/connections.ts` | Create | List connections & auth configs | ~34 |
| `app/api/connections/services/tools.ts` | Create | Tool/toolkit fetching | ~268 |
| `app/api/connections/connect/route.ts` | Modify | Fixed to use authConfigId instead of app name | ~60 |
| `app/api/connections/list/route.ts` | Modify | Fixed to use correct Composio API patterns | ~40 |

### Philosophy: Why Integrations Matter

**The Agent Capability Problem:**
Agents in Agipo are **Digital Employees**. Like human employees, they need access to company systems:
- A PM agent needs access to Linear for ticket management
- A Marketing agent needs access to HubSpot for CRM data
- A Support agent needs access to Zendesk for ticket context

Without integrations, agents are isolated. With integrations, they become **first-class participants** in the organization's digital infrastructure.

### The Composio Model

**Auth Configs** = "What integrations are available?"  
**Connected Accounts** = "Which integrations has this user activated?"

```
Auth Configs (Dashboard)
  ↓
Connected Accounts (per user)
  ↓
Tools (executable capabilities)
```

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration Platform | Composio | Abstracts OAuth complexity, handles token management |
| Data Model | Two-tier (Auth Configs + Connected Accounts) | Matches Composio's architecture |
| Service Decomposition | Split composio.ts into 4 files | Better separation of concerns |
| API Pattern | Use authConfigId, not app name | Required by Composio SDK |

---

## 4. Technical Deep Dive

### The Bug: What Went Wrong

**Original Implementation:**
```typescript
// What we wrote (WRONG)
const connection = await client.connectedAccounts.initiate(
  userId,
  "gmail",  // ❌ App name - Composio doesn't know what this is
  { callbackUrl: "..." }
);
```

**The Error:**
```json
{
  "error": {
    "message": "Auth config not found",
    "code": 607,
    "status": 400
  }
}
```

**The Fix:**
```typescript
// What we should have written
const connection = await client.connectedAccounts.initiate(
  userId,
  "ac_FpW8_GwXyMBz",  // ✅ Auth config ID
  { callbackUrl: "..." }
);
```

### Service Layer Decomposition

**Original:** `composio.ts` (422 lines)

**After:**
- `composio.ts` (39 lines) - Barrel exports
- `client.ts` (80 lines) - Composio client factories
- `auth.ts` (70 lines) - OAuth & API key flows
- `connections.ts` (34 lines) - List connections & auth configs
- `tools.ts` (268 lines) - Tool/toolkit fetching

---

## 5. Lessons Learned

- **Read the SDK carefully:** Auth config IDs are required, not app names
- **Two-tier model matters:** Auth Configs vs Connected Accounts are distinct concepts
- **Service decomposition helps:** Smaller files are easier to maintain
- **Documentation is critical:** READMEs help future developers understand the integration

---

## 6. Next Steps

- [ ] Add more integration types
- [ ] Improve error handling
- [ ] Add connection status monitoring
- [ ] Implement token refresh flows

---

## References

- **Related Diary:** `15.1-ConnectionsPageRefinement.md` - UX improvements
- **Related Diary:** `16-ClerkAuthenticationIntegration.md` - User authentication
- **Related Diary:** `17-ConnectionToolsIntegration.md` - Tool integration

---

**Last Updated:** 2025-12-03
