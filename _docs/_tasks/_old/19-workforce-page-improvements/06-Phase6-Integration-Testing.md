# Phase 6: Integration & Testing

**Status:** 📋 Planned  
**Depends On:** Phase 5  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Ensure all functionality works end-to-end, verify agent modal compatibility with newly created agents, test tool assignment and usage, and perform final polish. This phase validates that the complete system works together seamlessly.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Testing approach | Manual E2E testing + verification | Ensures real-world usage works correctly |
| Agent modal compatibility | Verify all tabs work | Critical for user experience - agents must be fully functional |
| Tool assignment verification | Test in agent modal | Ensures capabilities can be assigned and used |

### Pertinent Research

- **Agent Modal**: Existing component that works with agents - needs to work with new folder-based structure
- **Chat Service**: Uses agent-config.ts and memory.ts - already updated in Phase 2
- **Tool Assignment**: Uses agent-config.ts update functions - should work with folder structure

*Source: `app/(pages)/workforce/components/agent-modal/`, `app/api/workforce/services/agent-config.ts`*

### Overall File Impact

#### Files to Modify (if needed)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/` | Verify/Modify | Ensure compatibility with UUID-based agent IDs | A |
| Documentation | Update | Update any READMEs if needed | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-6.1 | Newly created agent works in agent modal (Chat tab) | Open agent, send message, verify response | A |
| AC-6.2 | Newly created agent works in agent modal (Capabilities tab) | Open agent, assign tools, verify they save | A |
| AC-6.3 | Tools can be assigned to new agent | Assign Gmail tools, verify they work in chat | A |
| AC-6.4 | Workflows can be assigned to new agent | Assign workflow, verify it's available | A |
| AC-6.5 | Memory database created on first use | Create agent, chat with it, verify memory.db created | A |
| AC-6.6 | All main acceptance criteria pass | Full test suite from Product Spec | B |

### User Flows (Phase Level)

#### Flow 1: End-to-End Agent Usage

```
1. Create agent with Gmail tools
2. Open agent modal
3. Verify Capabilities tab shows tools
4. Go to Chat tab
5. Ask agent to send email
6. Verify agent uses Gmail tool
7. Verify memory.db created
```

---

## Part A: Verify Agent Modal Compatibility

### Goal

Ensure agent modal works correctly with newly created agents that use UUID IDs and folder-based structure. Test all tabs and functionality.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/` | Verify | Test compatibility, modify if needed | TBD |

### Pseudocode

#### Agent Modal Compatibility Verification

```
Test Agent Modal with New Agent
├── Create agent via wizard
├── Open agent modal with new agent
├── Test Overview tab:
│   ├── Verify agent info displays
│   └── Verify status badge works
├── Test Chat tab:
│   ├── Send message
│   ├── Verify agent responds
│   └── Verify memory works
├── Test Capabilities tab:
│   ├── View current tools
│   ├── Assign new tools
│   ├── Verify tools save
│   └── Verify tools appear in chat
└── Test Workflows:
    ├── Assign workflow
    └── Verify workflow available
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.1 | Chat tab works with new agent | Open agent, send "Hello", verify response |
| AC-6.1 | Agent responds correctly | Verify agent uses systemPrompt and model |
| AC-6.2 | Capabilities tab loads correctly | Open tab, verify current tools displayed |
| AC-6.2 | Tool assignment works | Assign Gmail tool, verify it saves |
| AC-6.3 | Assigned tools work in chat | Ask agent to send email, verify Gmail tool called |
| AC-6.4 | Workflow assignment works | Assign workflow, verify it's available |
| AC-6.5 | Memory database created | Chat with agent, verify memory.db exists in agent folder |

### User Flows

#### Flow A.1: Complete Agent Usage

```
1. Create agent: "Test Agent", role: "Assistant", instructions: "You are helpful"
2. Assign Gmail tools in Step 3
3. Create agent
4. Open agent modal
5. Go to Capabilities tab
6. Verify Gmail tools listed
7. Go to Chat tab
8. Send: "Send an email to test@example.com"
9. Verify agent uses Gmail tool
10. Verify memory.db created in agent folder
```

#### Flow A.2: Assign Tools After Creation

```
1. Create agent without capabilities (skip Step 3)
2. Open agent modal
3. Go to Capabilities tab
4. Assign Gmail tools
5. Verify tools save
6. Go to Chat tab
7. Ask agent to send email
8. Verify agent can use Gmail tool
```

---

## Part B: End-to-End Testing

### Goal

Run complete test suite to verify all acceptance criteria from the Product Spec are met. Document any issues and ensure system is production-ready.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| Test documentation | Create | Document test results | TBD |

### Pseudocode

#### End-to-End Test Suite

```
Run Complete Test Suite
├── Test Legacy Cleanup (Phase 1)
│   ├── Verify all legacy files deleted
│   └── Verify index.ts cleaned
├── Test Service Updates (Phase 2)
│   ├── Verify agent-config.ts works
│   └── Verify memory.ts works
├── Test API Foundation (Phase 3)
│   ├── Test POST /api/workforce/create
│   └── Test GET /api/workforce
├── Test Basic UI (Phase 4)
│   ├── Test dialog opens
│   ├── Test Steps 1-2
│   └── Test success state
├── Test Complete Flow (Phase 5)
│   ├── Test Step 3
│   ├── Test sub-agents
│   └── Test error handling
└── Test Integration (Phase 6)
    ├── Test agent modal
    ├── Test tool assignment
    └── Test chat functionality
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.6 | All Product Spec acceptance criteria pass | Run full test suite, verify all ACs met |
| AC-6.6 | No regressions in existing functionality | Verify agent modal still works, chat still works |
| AC-6.6 | Error handling works in all scenarios | Test various error cases |

### User Flows

#### Flow B.1: Complete User Journey

```
1. User on workforce dashboard
2. User clicks "Hire new agent"
3. User fills Step 1: Name, role, avatar
4. User fills Step 2: Instructions, model, enables manager
5. User configures sub-agents
6. User fills Step 3: Selects tools, connections, workflows
7. User creates agent
8. Agent appears in roster
9. User opens agent modal
10. User assigns additional tools
11. User chats with agent
12. Agent uses tools correctly
13. Memory persists across conversations
```

---

## Out of Scope

- **Automated test suite** → Can be added later
- **Performance optimization** → Can be optimized if needed
- **Additional error scenarios** → Core error handling complete

---

## References

- **Product Spec:** `00-PRODUCT-SPEC.md` - All acceptance criteria
- **Implementation Plan:** `00-IMPLEMENTATION-PLAN.md` - Phase 6 details
- **Service Docs:** `app/api/workforce/services/agent-config.README.md`, `app/api/workforce/[agentId]/chat/services/memory.README.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | AI Assistant |

---

**Last Updated:** December 9, 2025

