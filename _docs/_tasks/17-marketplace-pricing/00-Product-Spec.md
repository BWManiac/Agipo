# Task 17: Marketplace Pricing Model — Product Spec

**Status:** Planning
**Date:** December 8, 2025
**Goal:** Implement frontend UI for tiered subscription-based marketplace pricing

---

## How to Use This Document

This document defines **what to build** for the marketplace pricing model. It covers requirements, acceptance criteria, user flows, and design decisions for the frontend implementation.

**Informed by:**
- UXD mockups in `_docs/UXD/Pages/marketplace/pricing-model-v2/v2-minimal/`
- Pricing model summary in `PRICING-MODEL-SUMMARY.md`
- User feedback on design (minimal shadcn/ui, no gradients)

**This document informs:**
- Phase-by-phase implementation plans
- Component architecture decisions
- Testing and validation approach

---

## 1. Executive Summary

### Problem
The current marketplace lacks a sustainable business model. Users can browse agents but cannot "hire" them. There's no pricing display, no subscription management, and no clear path to monetization.

### Solution
Implement a tiered subscription pricing model where users "hire" AI agents like employees. Users pay monthly fees based on usage quotas (workflow runs, tool calls) rather than per-execution costs.

### End State
Users can browse agents with pricing, view detailed capabilities and pricing tiers, subscribe with 7-day free trials, connect required integrations before payment, and manage subscriptions with real-time usage tracking.

**Who Benefits:**
- **Users:** Predictable costs, try before you buy, clear value proposition
- **Builders:** Recurring revenue, 70% revenue share, transparent platform economics
- **Agipo:** Sustainable business model, 30% platform fee, growth incentives

---

## 2. Product Requirements

### 2.1 Agent Discovery (Browse Page)

**Definition:** The marketplace landing page where users discover agents

**Why it matters:** First impression drives conversion. Users need to quickly understand value and find relevant agents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Display featured agents in a carousel (not static cards) | P0 |
| PR-1.2 | Show agent cards with pricing ("From $X/mo"), rating, user count | P0 |
| PR-1.3 | Filter agents by category, pricing range, rating | P1 |
| PR-1.4 | Search agents by name or description | P1 |
| PR-1.5 | Click agent card navigates to agent detail page | P0 |
| PR-1.6 | Remove "Add to workspace" action (use "View Details" instead) | P0 |
| PR-1.7 | Match minimal shadcn/ui design (no colorful gradients) | P0 |

### 2.2 Agent Detail Page

**Definition:** Detailed view of a single agent with capabilities and pricing

**Why it matters:** Users need to understand exactly what they're buying before committing

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Show agent header: name, creator, verified badge, stats (rating, users, success rate) | P0 |
| PR-2.2 | Display capabilities in three sections: Custom Tools, Workflows, Connection Tools | P0 |
| PR-2.3 | Show actual tool/workflow names (not generic descriptions) | P0 |
| PR-2.4 | Display 3 pricing tiers with quotas (Starter, Professional, Enterprise) | P0 |
| PR-2.5 | Highlight "Most Popular" tier | P1 |
| PR-2.6 | Show sticky pricing sidebar with selected tier and CTA | P0 |
| PR-2.7 | Include reviews section with rating distribution | P1 |
| PR-2.8 | "Start Free Trial" button navigates to checkout | P0 |

### 2.3 Checkout Flow

**Definition:** Multi-step purchase flow with integration connection

**Why it matters:** Prevents failed subscriptions by ensuring integrations work before payment

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Display 4-step progress: Select Plan → Integrations → Payment → Done | P0 |
| PR-3.2 | Show required integrations (must connect) vs optional integrations | P0 |
| PR-3.3 | Integration cards show connection status (Not Connected / Connected ✓) | P0 |
| PR-3.4 | "Connect" buttons trigger OAuth flow (placeholder for now) | P0 |
| PR-3.5 | Disable payment form until all required integrations connected | P0 |
| PR-3.6 | Show order summary sidebar: agent, tier, price, trial notice, quotas | P0 |
| PR-3.7 | Display "$0 due today" for 7-day trial | P0 |
| PR-3.8 | Show revenue split transparency (70% creator, 30% platform) | P1 |

### 2.4 Subscription Management

**Definition:** Dashboard for managing active subscriptions and tracking usage

**Why it matters:** Users need visibility into what they're paying for and when to upgrade

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Show top-level stats: active subscriptions count, total monthly spend | P0 |
| PR-4.2 | Display subscription cards for each active agent | P0 |
| PR-4.3 | Show usage bars for workflow runs and tool calls with percentages | P0 |
| PR-4.4 | Color-code usage: green (<50%), yellow (50-80%), red (>80%) | P0 |
| PR-4.5 | Display warning when usage > 80%: "⚠️ Approaching quota limit" | P0 |
| PR-4.6 | Show trial status and end date for trial subscriptions | P0 |
| PR-4.7 | Include actions: "Open Agent", "Upgrade Plan", "Cancel" | P0 |
| PR-4.8 | "Upgrade Plan" shows upgrade options (placeholder for now) | P1 |

### 2.5 Design System Compliance

**Definition:** Match existing Agipo design patterns

**Why it matters:** Consistent user experience, maintainable codebase

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Use shadcn/ui components only (Button, Card, Badge, Carousel, etc.) | P0 |
| PR-5.2 | Use slate-900 for primary text (not blue-600) | P0 |
| PR-5.3 | White/gray-50 card backgrounds (no colorful gradients) | P0 |
| PR-5.4 | Minimal shadows (hover only) | P0 |
| PR-5.5 | Match workforce page styling patterns | P0 |
| PR-5.6 | Reuse existing ToolCard, WorkflowCard, ConnectionToolCard components | P0 |

### 2.6 Responsive Design

**Definition:** Works on all device sizes

**Why it matters:** Users browse on mobile, desktop, and tablets

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-6.1 | Mobile: 1-column layout | P0 |
| PR-6.2 | Tablet: 2-column grid for agent cards | P0 |
| PR-6.3 | Desktop: 3-column grid for agent cards | P0 |
| PR-6.4 | Agent detail sidebar stacks on mobile, sticky on desktop | P0 |

---

## 3. Acceptance Criteria

### Agent Discovery (7 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1.1 | Featured agents carousel displays and allows left/right navigation | Manual: Click carousel arrows, verify agents change |
| AC-1.2 | Agent cards show pricing "From $X/mo" | Visual: Verify pricing visible on all cards |
| AC-1.3 | Clicking agent card navigates to `/marketplace/[agentId]` | Manual: Click card, verify URL change |
| AC-1.4 | No "Add to workspace" button visible | Visual: Verify button doesn't exist |
| AC-1.5 | Search bar filters agents by name/description | Manual: Type search query, verify results filter |
| AC-1.6 | Category filters update agent grid | Manual: Click category, verify grid updates |
| AC-1.7 | Page uses minimal design (white cards, no gradients) | Visual: Compare to V2 mockup |

### Agent Detail (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-2.1 | Agent header shows name, creator, verified badge, rating, user count | Visual: Verify all elements present |
| AC-2.2 | Capabilities section shows three subsections: Custom Tools, Workflows, Connection Tools | Visual: Verify all three sections exist |
| AC-2.3 | Each tool/workflow shows actual name (e.g., "create_roadmap_draft") | Visual: Verify specific names, not generic descriptions |
| AC-2.4 | Pricing tiers show Starter, Professional, Enterprise with quotas | Visual: Verify 3 tiers with run/call limits |
| AC-2.5 | "Most Popular" tier has highlighted border | Visual: Verify Professional tier highlighted |
| AC-2.6 | Sticky sidebar shows selected tier and "Start Free Trial" button | Manual: Scroll page, verify sidebar stays visible |
| AC-2.7 | Clicking "Start Free Trial" navigates to `/marketplace/checkout?agentId=X&tierId=Y` | Manual: Click button, verify URL includes query params |
| AC-2.8 | Reviews section shows rating distribution bars | Visual: Verify review bars present |

### Checkout Flow (9 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-3.1 | Progress bar shows 4 steps with current step highlighted | Visual: Verify step indicator |
| AC-3.2 | Step 2 shows required integrations (Gmail, Linear) marked as "Required" | Visual: Verify required badge |
| AC-3.3 | Step 2 shows optional integrations (Notion, Slack) marked as "Optional" | Visual: Verify optional badge |
| AC-3.4 | Integration cards show "Not Connected" status initially | Visual: Verify initial state |
| AC-3.5 | Clicking "Connect" button simulates OAuth (changes to "Connected ✓") | Manual: Click connect, verify status change |
| AC-3.6 | Payment form is disabled when required integrations not connected | Manual: Verify inputs disabled, button disabled |
| AC-3.7 | Payment form enables after all required integrations connected | Manual: Connect all required, verify form enables |
| AC-3.8 | Order summary shows "$0 due today" for trial | Visual: Verify trial notice |
| AC-3.9 | Order summary shows quota details (500 runs, 2,500 calls) | Visual: Verify quota numbers match tier |

### Subscription Management (7 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-4.1 | Dashboard shows total active subscriptions count | Visual: Verify count matches number of cards |
| AC-4.2 | Dashboard shows total monthly spend | Visual: Verify sum of all subscription costs |
| AC-4.3 | Each subscription card shows agent name, tier, monthly price | Visual: Verify all info present |
| AC-4.4 | Usage bars show percentage and color-code correctly | Manual: Verify green (<50%), yellow (50-80%), red (>80%) |
| AC-4.5 | Warning icon and text appear when usage > 80% | Visual: Verify warning on high-usage cards |
| AC-4.6 | Trial subscriptions show "Trial" badge and end date | Visual: Verify trial status visible |
| AC-4.7 | Action buttons (Open Agent, Upgrade, Cancel) are functional | Manual: Click buttons, verify navigation/modal |

### Design System Compliance (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-5.1 | All components use shadcn/ui primitives | Code review: No custom components |
| AC-5.2 | Primary text uses slate-900 (not blue-600) | Visual: Inspect computed styles |
| AC-5.3 | Cards use white/gray-50 backgrounds | Visual: No gradient backgrounds |
| AC-5.4 | Shadows only appear on hover | Manual: Hover cards, verify shadow appears |
| AC-5.5 | Styling matches workforce pages | Visual: Compare side-by-side |

### Backwards Compatibility (2 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-6.1 | Existing workforce pages still render correctly | Manual: Navigate to /workforce, verify no breakage |
| AC-6.2 | Shared components (ToolCard, WorkflowCard) work in both contexts | Manual: Check workforce agent modal and marketplace agent detail |

---

## 4. User Flows

### Flow 1: Discover and Subscribe to Agent (Happy Path)

```
1. User lands on /marketplace
2. System shows featured agents carousel and agent grid
3. User browses carousel using left/right arrows
4. User clicks on "PM Agent" card
5. System navigates to /marketplace/pm-agent
6. User sees agent details: capabilities (4 tools, 2 workflows, 5 connections), 3 pricing tiers
7. User selects "Professional" tier ($99/mo)
8. User clicks "Start Free Trial"
9. System navigates to /marketplace/checkout?agentId=pm-agent&tierId=professional
10. User sees step 2: Integrations (Gmail and Linear required)
11. User clicks "Connect" on Gmail
12. System simulates OAuth flow (status changes to "Connected ✓")
13. User clicks "Connect" on Linear
14. System simulates OAuth flow (status changes to "Connected ✓")
15. Payment form enables
16. User enters credit card details (form active but doesn't submit)
17. User clicks "Start Trial"
18. System shows success message: "Trial started! Check your subscriptions."
19. User navigates to /marketplace/subscriptions
20. User sees new subscription card: PM Agent, Professional, Trial (ends Dec 15), 0% usage
```

### Flow 2: Browse and Filter Agents

```
1. User lands on /marketplace
2. User types "data" in search bar
3. System filters agent grid to show only data-related agents
4. User clears search
5. User clicks "Finance" category filter
6. System shows only finance category agents
7. User adjusts pricing filter to "$0-$50/mo"
8. System filters to show only agents with tiers in that range
9. User clears all filters
10. System shows all agents again
```

### Flow 3: Upgrade Subscription (Approaching Quota)

```
1. User navigates to /marketplace/subscriptions
2. User sees "Data Ops Agent" card with 85% usage (red bar)
3. System shows warning: "⚠️ Approaching quota limit"
4. User clicks "Upgrade Plan" button
5. System shows modal with available tiers (placeholder for now)
6. User selects "Enterprise" tier
7. User clicks "Confirm Upgrade"
8. System simulates upgrade (closes modal, updates card)
9. User sees updated card: Data Ops Agent, Enterprise, $299/mo, 45% usage (yellow bar)
```

### Flow 4: Integration Connection Failure (Error Case)

```
1. User in checkout flow, step 2: Integrations
2. User clicks "Connect" on Gmail
3. System simulates OAuth error (user denies permission)
4. System shows error message: "Connection failed. Please try again."
5. Integration card remains "Not Connected"
6. Payment form remains disabled
7. User clicks "Connect" again
8. System simulates successful connection
9. Integration card shows "Connected ✓"
10. User continues to Linear connection
```

### Flow 5: Cancel Subscription

```
1. User navigates to /marketplace/subscriptions
2. User sees "Content Agent" card (Active, 23% usage)
3. User clicks "Cancel" button
4. System shows confirmation dialog: "Are you sure? Your subscription will remain active until [date]"
5. User clicks "Confirm Cancellation"
6. System updates card status to "Canceling (active until Dec 31)"
7. User sees notice: "You can still use this agent until your billing period ends."
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Featured agents: static or auto-rotate carousel? | A: Manual only, B: Auto-rotate with pause | A (manual) | ❌ |
| DD-2 | Agent detail: single pricing tier selection or compare view? | A: Single select, B: Comparison table | A (single) | ✅ |
| DD-3 | Checkout: show revenue split in summary? | A: Show transparency, B: Hide | A (show) | ✅ |
| DD-4 | Subscriptions: show cancel immediately or only on hover? | A: Always visible, B: Hover only | A (visible) | ✅ |
| DD-5 | Mock OAuth: instant or simulate 2-second delay? | A: Instant, B: Delay with loading state | B (realistic) | ❌ |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| Dec 8 | DD-2: Pricing tier selection | Single select (A) | Simplifies UX, reduces cognitive load. Comparison can be future enhancement. |
| Dec 8 | DD-3: Revenue split transparency | Show in summary (A) | Builds trust with users and creators. Transparency is Agipo value. |
| Dec 8 | DD-4: Cancel button visibility | Always visible (A) | User control, no dark patterns. Easy to find when needed. |

---

## 6. UXD Requirements

### Required Mockups

All mockups already exist in `_docs/UXD/Pages/marketplace/pricing-model-v2/v2-minimal/`:

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| `marketplace-browse.html` | Discovery page | Featured carousel, agent cards with pricing, filters, search |
| `agent-detail-pricing.html` | Agent detail | Capabilities (tools/workflows/connections), pricing tiers, reviews, sticky sidebar |
| `checkout-flow.html` | Purchase flow | 4-step progress, integration connection UI, payment form, order summary |
| `my-subscriptions.html` | Dashboard | Stats, subscription cards, usage bars (color-coded), actions |

### Mockup Location

```
_docs/UXD/Pages/marketplace/pricing-model-v2/
├── v1-colorful/              # Original designs (reference only)
├── v2-minimal/               # Production designs (implementation source)
│   ├── agent-detail-pricing.html
│   ├── checkout-flow.html
│   ├── my-subscriptions.html
│   └── marketplace-browse.html
├── PRICING-MODEL-SUMMARY.md
├── IMPLEMENTATION-GUIDE.md
└── README.md
```

### Exit Criteria for UXD Phase

- [x] All required mockups complete
- [x] Each mockup shows all P0 requirements
- [x] Stakeholder review complete
- [x] Preferred direction chosen (V2 minimal)

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Users can browse agents and see pricing | Manual test: Navigate /marketplace, verify pricing visible | P0 |
| Users can view agent details and capabilities | Manual test: Click agent, verify capabilities shown explicitly | P0 |
| Users can select pricing tier and start trial | Manual test: Select tier, click CTA, reach checkout | P0 |
| Checkout flow enforces integration connection before payment | Manual test: Verify payment disabled until integrations connected | P0 |
| Users can view subscriptions and track usage | Manual test: Navigate /subscriptions, verify usage bars color-coded | P0 |
| Design matches V2 mockups pixel-perfect | Visual comparison: Side-by-side mockup vs implementation | P0 |
| No colorful gradients or marketing fluff | Visual inspection: No blue/purple gradients, minimal shadows | P0 |
| Responsive on mobile, tablet, desktop | Manual test: Resize browser, verify layouts adapt | P0 |
| All components use shadcn/ui | Code review: Verify imports from `@/components/ui/` | P0 |
| Ready for backend integration | Code review: Verify clear data contracts, placeholder API functions | P1 |

**North Star:** A user can discover an agent, understand its value (capabilities + pricing), start a free trial, and manage their subscription—all with a clean, minimal, predictable UI that feels like a natural extension of Agipo.

---

## 8. Out of Scope

**Not in this task:**
- Backend API implementation (`/api/marketplace/*`)
- Database schema for pricing tiers and subscriptions
- Stripe integration for payment processing
- OAuth flows for integration connections (real)
- Quota enforcement and usage tracking (real)
- Agent publishing workflow
- Builder dashboard (revenue tracking, analytics)
- Email notifications (trial ending, quota warnings)
- Admin panel for managing featured agents

**Future enhancements (P1, not blocking):**
- Tier comparison table view
- Agent reviews and rating system (user-submitted)
- Favorite/bookmark agents
- Recommended agents based on user behavior
- Advanced search (tags, capabilities)
- Pricing filter with slider
- "Ask before canceling" survey

---

## 9. Related Documents

- **Context & Guidelines:** `00-Context-and-Guidelines.md`
- **Implementation Plans:**
  - `01-Phase1-Foundation.md`
  - `02-Phase2-Browse.md`
  - `03-Phase3-Agent-Detail.md`
  - `04-Phase4-Checkout.md`
  - `05-Phase5-Subscriptions.md`
- **UXD Mockups:** `_docs/UXD/Pages/marketplace/pricing-model-v2/`
- **Pricing Model Summary:** `_docs/UXD/Pages/marketplace/pricing-model-v2/PRICING-MODEL-SUMMARY.md`
- **Implementation Guide:** `_docs/UXD/Pages/marketplace/pricing-model-v2/IMPLEMENTATION-GUIDE.md`
- **Previous Task:** Task 16 - Workflows F
- **Feature Doc:** N/A (this is a new feature)

---

## Notes

### User Feedback on Design (Dec 8)

> "none of this really follows our design guidelines set in place... it's really mostly just bare shadcn, you know. Without any of this colorful fluff"

**Action:** V2 minimal mockups created to match existing Agipo style. Implementation must follow V2, not V1.

> "needs to be made exceptionally clear with these agents... we need to more directly tie it to the tools and the workflows"

**Action:** Capabilities section shows explicit tool/workflow cards, not generic bullet points. Reuse workforce `ToolCard`, `WorkflowCard`, `ConnectionToolCard` components.

> "the featured agents should probably be a carousel, not just two of them"

**Action:** Use existing `carousel.tsx` component for featured agents. Show 3-5 featured agents with left/right navigation.

### Open Questions

1. **DD-1:** Should featured carousel auto-rotate or manual only?
   - Leaning toward manual to reduce distraction
   - Need to test with users

2. **DD-5:** Should mock OAuth connection be instant or simulate delay?
   - Leaning toward 2-second delay with loading spinner to feel realistic
   - Helps test loading states

### Implementation Notes

- Start with Phase 1 (types, mock data)
- Each phase should be fully testable before moving to next
- Follow file impact analysis format from `00-Context-and-Guidelines.md`
- Reference V2 mockups constantly during implementation
- Test responsive layouts at each phase

---

**Last Updated:** December 8, 2025
