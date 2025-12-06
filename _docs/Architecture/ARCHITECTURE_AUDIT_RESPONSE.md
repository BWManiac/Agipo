# Architecture Audit Response

**Date:** December 6, 2025  
**Author:** Product Manager  
**In Response To:** ARCHITECTURE_AUDIT_2025-12-06.md

---

## 1. Domain Model Correction

The audit identified 2 domains (Tools, Workforce). **Correction: There are 4 domains:**

| Domain | API Route | Description |
|--------|-----------|-------------|
| **Connections** | `/api/connections/` | External integrations via Composio |
| **Records** | `/api/records/` | Data storage and manipulation |
| **Tools** | `/api/tools/` | Workflow builder and custom tools |
| **Workforce** | `/api/workforce/` | AI agents and chat |

Each domain has its own backend business logic. The frontend pages (`app/(pages)/`) are intentionally decoupled from backend domains—they consume APIs but are not "part of" the domain.

---

## 2. Frontend/Backend Separation Philosophy

**Key principle:** Frontend and backend are strictly separated.

- The frontend (`app/(pages)/profile/`) handles UI for connections
- The backend (`app/api/connections/`) handles business logic
- These are NOT fragmented—they're decoupled by design

When evaluating architecture issues, focus on:
- **Backend domain coherence** (services, routes, business logic)
- **Frontend component organization** (pages, components, hooks)
- **Not mixing the two**

---

## 3. AI Elements / UI Components - DO NOT TOUCH

The following directories contain **imported dependencies**, not our code:

| Directory | Source | Action |
|-----------|--------|--------|
| `components/ai-elements/` | [Vercel AI Elements](https://ai-sdk.dev/elements) | DO NOT MODIFY |
| `components/ui/` | [shadcn/ui](https://ui.shadcn.com) | DO NOT MODIFY |

These components are managed via CLI imports (`npx ai-elements@latest`, `npx shadcn@latest`).

**Follow-up task:** Re-import latest AI Elements to stay current with Vercel updates.

The audit incorrectly flagged `prompt-input.tsx` (1,432 lines) for decomposition. This is a Vercel AI Elements component—we don't own it.

---

## 4. Service Layer Placement - Open Question

Current pattern is mixed:
- Some services at domain root: `app/api/workforce/services/`
- Some services colocated with routes: `app/api/workforce/[agentId]/chat/services/`

**Hypothesis:** Services should be colocated with their route when specific, or at domain root when shared.

**To investigate:**
- Which pattern is more maintainable?
- Should we standardize on one approach?

---

## 5. Agent Modal State Management - Opportunity

The workflow editor uses Zustand with 8 slices (excellent pattern). The Agent Modal uses scattered hooks:
- `useAgentDetails.ts`
- `useConnectionTools.ts`
- `useCustomTools.ts`

**Question:** Is there an opportunity to unify Agent Modal state under a Zustand store?

**To analyze:**
- What state is being managed?
- Is it complex enough to warrant a store?
- What would the slices look like?

---

## 6. Docs Structure - Low Priority

The following are not issues:
- `hooks/` - shadcn prerequisite
- `lib/` - utility functions
- `scripts/` - future use
- `public/` - static assets

**Action:** Move root `UXD/` folder into `_docs/UXD/` to consolidate.

---

## 7. Approved Recommendations

### High Priority (Do Now)
- [ ] Delete unused `ConnectionToolEditor.tsx`
- [ ] Delete unused `agent-modal-legacy/` folder
- [ ] Move `UXD/` → `_docs/UXD/Pages/records/`
- [ ] Rename `proxy.ts` → `middleware.ts`

### Medium Priority (Decomposition)
- [ ] Split `runtime.ts` into multiple focused files
- [ ] Split `composio.ts` into client, auth, connections, tools
- [ ] Extract business logic from `chat/route.ts` into service

### Low Priority (Future)
- [ ] Re-import latest Vercel AI Elements
- [ ] Evaluate Agent Modal state management
- [ ] Standardize service layer placement

---

## 8. Outstanding Questions

1. **Service placement:** Colocated with routes vs. domain root—which pattern to standardize?

2. **Agent Modal store:** Should we create a Zustand store for Agent Modal?

3. **Records domain:** Currently has minimal documentation. Is this a concern?

4. **Package cleanup:** Can we remove `@composio/mastra` and `@composio/vercel` from package.json?

---

*Next step: Generate file-based recommendations document.*

