# Diary Entry 17: Connection Tools Integration

**Date:** 2025-12-04  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

Building on the Composio Integrations Platform (Entry 15) and Clerk Authentication (Entry 16), we implemented **Connection Tools** - the ability for agents to use tools from a user's connected accounts (e.g., sending emails via a connected Gmail account).

**The key challenge:** Multi-account handling - when a user has multiple Gmail accounts, which one should the agent use?

**The solution:** `ConnectionToolBinding` - an explicit link between a tool, a specific connection, and an agent.

**Key Insight:** Unlike custom tools (local workflows), connection tools require **user context** at runtime. The same "GMAIL_SEND_EMAIL" tool behaves differently depending on which connected Gmail account is bound to the agent.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Added `ConnectionToolBinding` type | ~10 |
| `app/api/workforce/[agentId]/tools/custom/route.ts` | Create | GET/POST agent's custom tools | ~50 |
| `app/api/workforce/[agentId]/tools/connection/route.ts` | Create | GET/POST agent's connection bindings | ~60 |
| `app/api/workforce/services/agent-config.ts` | Modify | Added connection tool binding methods | ~40 |
| `app/(pages)/workforce/components/ConnectionToolEditor.tsx` | Create | Dialog for managing connection tool assignments | ~200 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Split into Custom Tools + Connection Tools sections | ~80 |

### Philosophy: Two Types of Agent Tools

**Custom Tools (Existing):**
- Local workflows defined in `_tables/tools/`
- User-agnostic (no OAuth required)
- Defined as TypeScript files with Zod schemas
- Executed entirely within Agipo

**Connection Tools (New):**
- Composio-provided tools from connected services
- User-specific (require OAuth connection)
- Defined by Composio SDK
- Execute via Composio Cloud with user's credentials

**The Binding Problem:**
When a user has multiple Gmail accounts, which one should the agent use?

**Solution:** `ConnectionToolBinding` explicitly links:
```typescript
{
  toolId: "GMAIL_SEND_EMAIL",      // The Composio tool
  connectionId: "ca_abc123",       // Which specific account
  toolkitSlug: "gmail"             // For display/grouping
}
```

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Binding Model | Explicit `ConnectionToolBinding` | Supports multi-account scenarios |
| API Structure | Separate routes for custom vs connection | Clear separation of concerns |
| Backwards Compatibility | Optional `connectionToolBindings` field | Existing agents work without changes |
| UI Organization | Split CapabilitiesTab into sections | Clear visual distinction |

---

## 4. Technical Deep Dive

### Implementation Plan Overview

The implementation was divided into 7 verifiable stages:

1. **Data Model:** `ConnectionToolBinding` type, `AgentConfig` extension
2. **Custom Tools API:** Refactored routes under `/tools/custom/`
3. **Connection Tools API:** New routes under `/tools/connection/`
4. **Frontend Hooks:** `useCustomTools`, `useConnectionTools`
5. **ConnectionToolEditor:** Dialog for managing connection tool assignments
6. **CapabilitiesTab Refactor:** Split into Custom Tools + Connection Tools sections
7. **Chat Execution:** Runtime integration with Clerk auth and bindings

### Data Model Foundation

**New Type: ConnectionToolBinding**
```typescript
type ConnectionToolBinding = {
  toolId: string;        // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string;  // e.g., "ca_abc123"
  toolkitSlug: string;   // e.g., "gmail"
};
```

**Extended AgentConfig**
```typescript
type AgentConfig = {
  toolIds: string[];                           // Custom tools (existing)
  connectionToolBindings?: ConnectionToolBinding[];  // Connection tools (new)
};
```

---

## 5. Lessons Learned

- **Multi-account support requires explicit bindings:** Can't assume single connection per service
- **User context matters:** Connection tools are user-specific, unlike custom tools
- **API separation clarifies intent:** Custom vs Connection tools have different patterns
- **Backwards compatibility:** Optional fields allow gradual migration

---

## 6. Next Steps

- [ ] Add tool execution error handling
- [ ] Show tool execution status in chat UI
- [ ] Add more integration types beyond Gmail
- [ ] Implement tool health checks

---

## References

- **Related Diary:** `15-ComposioIntegrationsPlatform.md` - Initial implementation
- **Related Diary:** `16-ClerkAuthenticationIntegration.md` - User authentication
- **Related Diary:** `17.1-ConnectionToolExecutionFix.md` - Tool ID fix
- **Related Diary:** `17.2-ConnectionToolSchemaFix.md` - Schema fix

---

**Last Updated:** 2025-12-04
