# Task 17: Marketplace Pricing - Context and Guidelines

**Date:** December 8, 2025
**Task:** Marketplace Pricing Model Implementation
**Status:** 🚧 Planning
**Approach:** Frontend-first, pure UI implementation

---

## 0. Working Style Guidelines

**Important:** These guidelines ensure we build thoughtfully and maintain quality.

### For Each File We Create/Modify:

1. **Plan First, Implement Second**
   - **BEFORE implementing any code**, provide a complete file impact analysis
   - This analysis must be presented in chat for review and approval
   - Only after approval should implementation begin

2. **Required File Impact Analysis Format**

   For each file, provide:

   **File Impact:**
   - **Action:** Create / Modify / Delete
   - **Purpose:** **Product-focused description** - What problem it solves, what features it enables, what value it provides to users
   - **Lines:** Estimated or actual line count

   **Purpose Description Guidelines:**
   - ❌ Bad: "AgentCard component"
   - ✅ Good: "Agent card showing pricing, rating, and capabilities. Enables users to browse marketplace agents and compare pricing tiers at a glance before clicking for details."
   - ❌ Bad: "Checkout page"
   - ✅ Good: "Multi-step checkout flow ensuring users connect required integrations BEFORE payment. Prevents disappointment and failed subscriptions by validating OAuth connections upfront."

   **Categorized File Impact Tables:**

   Organize files by category for clarity:

   ```markdown
   ### Overall File Impact

   #### Types
   | File | Action | Purpose | Phase |
   |------|--------|---------|-------|
   | `app/(pages)/marketplace/types.ts` | Create | Product-focused description | 1 |

   #### Data / Mock Data
   | File | Action | Purpose | Phase |
   |------|--------|---------|-------|
   | `app/(pages)/marketplace/data/mock-pricing-data.ts` | Create | Product-focused description | 1 |

   #### Pages
   | File | Action | Purpose | Phase |
   |------|--------|---------|-------|
   | `app/(pages)/marketplace/page.tsx` | Modify | Product-focused description | 2 |

   #### Components - Browse
   | File | Action | Purpose | Phase |
   |------|--------|---------|-------|
   | `app/(pages)/marketplace/components/browse/AgentCard.tsx` | Create | Product-focused description | 2 |

   #### Components - Agent Detail
   | File | Action | Purpose | Phase |
   |------|--------|---------|-------|
   | `app/(pages)/marketplace/components/agent-detail/PricingTierSelector.tsx` | Create | Product-focused description | 3 |
   ```

   **Acceptance Criteria:**
   - Which acceptance criteria (AC-X.X) it addresses
   - Which product requirements (PR-X) it supports
   - Why this file is necessary for the feature

3. **Product Requirements Mapping**
   - For each file, explicitly state:
     - Which acceptance criteria it satisfies
     - Which product requirements it supports
     - Why this file is necessary for the feature

4. **TypeScript-First Type Definitions**
   - Define clear TypeScript interfaces
   - Keep types co-located with related code
   - Pattern:
     ```typescript
     export interface PricingTier {
       id: string;
       name: string;
       priceMonthly: number;
       // ... more fields
     }
     ```

5. **UXD Mockups Guide Implementation**
   - V2 minimal mockups already exist in `_docs/UXD/Pages/marketplace/pricing-model-v2/v2-minimal/`
   - Mockups show: layout, components, interactions, states
   - Implementation should match mockups pixel-perfect (within shadcn/ui constraints)

6. **ShadCN Design System**
   - Use existing shadcn/ui components (Button, Card, Badge, Carousel, etc.)
   - Minimal custom styling
   - Match existing Agipo style (workforce pages as reference)
   - No colorful gradients - keep it clean and minimal

7. **Frontend Only (No Backend)**
   - All data from mock files (`mock-pricing-data.ts`)
   - Client-side state management only
   - No API calls (placeholder functions for later)
   - Forms functional but don't submit

8. **Slow and Methodical**
   - One phase at a time
   - Plan → Review → Implement → Verify
   - Don't rush ahead

---

## 1. Context

### Background

After creating high-fidelity mockups for the marketplace pricing model (V2 minimal design), we're ready to implement the frontend UI. The pricing model shifts from "pay-per-use" to "tiered subscriptions" where users "hire" agents like employees.

**Key Insights:**
- Users should think "$99/month for my PM agent" not "$0.50 per task"
- Connect integrations BEFORE payment to prevent disappointment
- Show capabilities explicitly (tools, workflows, connections)
- Minimal design matching existing Agipo shadcn/ui style

### What Exists

**Mockups:** `_docs/UXD/Pages/marketplace/pricing-model-v2/v2-minimal/`
- `agent-detail-pricing.html` - Agent detail with pricing tiers
- `checkout-flow.html` - Multi-step checkout with integration connection
- `my-subscriptions.html` - Subscription dashboard with usage tracking
- `marketplace-browse.html` - Discovery page with featured carousel

**Current Marketplace:** `app/(pages)/marketplace/`
- Basic marketplace page with collections and agent grid
- Uses colorful gradients (needs to be replaced with minimal design)
- No pricing display or subscription model

**Design System:**
- shadcn/ui components in `components/ui/`
- Existing `carousel.tsx` (Embla Carousel)
- Workforce pages as reference for minimal styling

### What We're Building

**Goal:** Create a pricing-enabled marketplace with:
1. Agent discovery with featured carousel
2. Agent detail pages showing pricing tiers and capabilities
3. Checkout flow with integration connection before payment
4. Subscription management dashboard with usage tracking

**Approach:**
- Pure frontend implementation (no backend)
- Mock data for all content
- Reuse existing components from workforce where possible
- Match V2 minimal mockups

---

## 2. References

### Documentation
- **Product Spec:** `00-Product-Spec.md` (this task)
- **Implementation Plans:** `01-Phase1-Foundation.md`, `02-Phase2-Browse.md`, etc.
- **UXD Mockups:** `_docs/UXD/Pages/marketplace/pricing-model-v2/`
- **Pricing Model Summary:** `_docs/UXD/Pages/marketplace/pricing-model-v2/PRICING-MODEL-SUMMARY.md`

### Codebase References
- **Existing Marketplace:** `app/(pages)/marketplace/`
- **Workforce Components:** `app/(pages)/workforce/components/`
  - `ToolCard.tsx`, `WorkflowCard.tsx`, `ConnectionToolCard.tsx` (to reuse)
- **Design System:** `components/ui/`, `app/globals.css`

### Templates
- `_docs/_tasks/_templates/_PRODUCT_SPEC.md`
- `_docs/_tasks/_templates/_IMPLEMENTATION_PLAN.md`
- `_docs/_tasks/_templates/_PHASE_TEMPLATE.md`

---

## 3. Principles We're Following

1. **Design First** - Mockups guide implementation, not the other way around
2. **Frontend Only** - No backend until UI is complete and validated
3. **Component Reuse** - Leverage existing workforce components
4. **Minimal Styling** - Match shadcn/ui patterns, no colorful gradients
5. **Incremental Implementation** - Phase by phase, test after each
6. **Type Safety** - TypeScript for all data structures
7. **Responsive Design** - Mobile-first, works on all screen sizes

---

## 4. Phase Overview

### Phase 1: Foundation
- Create type definitions
- Build mock pricing data
- Set up folder structure

### Phase 2: Browse Page
- Featured agents carousel
- Agent cards with pricing
- Clean, minimal layout

### Phase 3: Agent Detail
- Agent header and stats
- Capabilities section (tools/workflows/connections)
- Pricing tier selector
- Sticky pricing sidebar

### Phase 4: Checkout Flow
- Multi-step progress
- Integration connection UI
- Payment form (disabled until integrations connected)
- Order summary

### Phase 5: Subscriptions Dashboard
- Dashboard stats
- Subscription cards with usage bars
- Color-coded usage tracking (green/yellow/red)

---

## 5. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Carousel for Featured Agents | Use existing `carousel.tsx` | Already in codebase, well-maintained Embla Carousel |
| Capabilities Display | Reuse workforce components | `ToolCard`, `WorkflowCard`, `ConnectionToolCard` already match design |
| Page Routing | Dynamic routes `[agentId]` | Follows Next.js conventions, easy to add backend later |
| Mock Data Location | Co-located with components | Easy to find, replace with API calls later |
| State Management | React useState only | Simple client-side, no need for Zustand yet |

---

## 6. Out of Scope (For Now)

**Not in this task:**
- Backend API implementation
- Database schema
- Stripe integration
- OAuth flows for integration connection
- Actual payment processing
- Agent publishing workflow
- Builder dashboard (revenue tracking)

**Future tasks:**
- Task 18: Marketplace Pricing Backend
- Task 19: Stripe Connect Integration
- Task 20: Builder Dashboard

---

## 7. Success Criteria

✅ All mockup pages implemented with React components
✅ Navigation between pages works smoothly
✅ Components match V2 minimal design pixel-perfect
✅ No colorful gradients or marketing fluff
✅ Capabilities shown explicitly (tools/workflows/connections)
✅ Carousel functional for featured agents
✅ Responsive on mobile, tablet, desktop
✅ Type-safe with TypeScript
✅ Ready for backend integration (clear data contracts)

---

**Last Updated:** December 8, 2025
