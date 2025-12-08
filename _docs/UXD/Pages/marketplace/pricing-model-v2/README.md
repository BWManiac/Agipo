# Marketplace Pricing Model - File Organization

**Last Updated:** December 8, 2025

## Folder Structure

```
pricing-model-v2/
├── v1-colorful/              # Original designs with gradients
│   ├── agent-detail-pricing.html
│   ├── checkout-flow.html
│   ├── my-subscriptions.html
│   └── builder-dashboard.html
├── v2-minimal/               # Updated designs matching Agipo style
│   ├── agent-detail-pricing.html
│   ├── checkout-flow.html
│   ├── my-subscriptions.html
│   └── marketplace-browse.html
├── PRICING-MODEL-SUMMARY.md  # Full pricing model documentation
├── IMPLEMENTATION-GUIDE.md   # Technical implementation details
└── README.md                 # This file
```

---

## Version Comparison

### V1: Colorful (Original)
**Design characteristics:**
- Colorful gradients (blue, purple, yellow)
- Heavy shadows and depth effects
- Custom CSS with CSS variables
- Vibrant badges and accents
- More visual "pop"

**Use case:** Initial concept exploration, client presentations

### V2: Minimal (Production-Ready)
**Design characteristics:**
- Matches Agipo's shadcn/ui design system
- Minimal styling: white cards, simple borders
- Slate-900 primary color (no bright blues)
- Subtle shadows (hover only)
- Clean, professional aesthetic

**Use case:** Production implementation, actual codebase

---

## V2 Files (Minimal Design)

### 1. agent-detail-pricing.html
**What it shows:**
- Agent overview with stats (rating, users, success rate)
- **Capabilities section** - Major improvement:
  - Custom Tools (4) - Shows actual tool names like `create_roadmap_draft`
  - Workflows (2) - Shows workflow names like "Weekly Voice of Customer Digest"
  - Connection Tools (5) - Shows integration tools like `GMAIL_SEND_EMAIL`
- Pricing tier selector (Starter $29, Professional $99, Enterprise $299)
- Reviews section with rating distribution
- Sticky pricing sidebar

**Key feature:** Clear separation of tools, workflows, and connection tools - matches CapabilitiesTab.tsx UI

### 2. checkout-flow.html
**What it shows:**
- 4-step progress indicator (Select Plan → Integrations → Payment → Done)
- Integration connection UI with status indicators
  - Required integrations: Gmail, Linear
  - Optional integrations: Notion, Slack
  - "Connect" buttons with OAuth flow
- Payment form (disabled until integrations connected)
- Order summary sidebar with:
  - Agent details (PM Agent, Professional $99/mo)
  - 7-day trial notice ($0 due today)
  - Quota summary (500 runs, 2,500 calls)
  - Revenue split transparency (70% creator, 30% platform)

**Key feature:** Users connect integrations BEFORE payment to avoid disappointment

### 3. my-subscriptions.html
**What it shows:**
- Dashboard stats (3 active subscriptions, $197/mo spend)
- List of subscribed agents with usage tracking
- Color-coded usage bars:
  - Green (< 50%): Healthy usage
  - Yellow (50-80%): Moderate usage
  - Red (> 80%): Approaching limit with upgrade prompt
- Example subscriptions:
  - PM Agent (Trial, 9% usage, trial ends Dec 15)
  - Data Ops Agent (Active, 85% usage, ⚠️ upgrade warning)
  - Content Agent (Active, 23% usage, healthy)
- Actions: Open Agent, Upgrade Plan, Cancel

**Key feature:** Real-time usage visualization encourages upgrades at right time

### 4. marketplace-browse.html
**What it shows:**
- Search bar and category filters
- Featured agents section (2 large cards)
- Agent grid (6+ agents in 3-column layout)
- Each card displays:
  - Agent icon + name
  - Creator
  - Rating (4.8 ★) + user count (500+)
  - Category badge
  - Pricing ("From $29/mo")
  - "View Details" button
- Pagination and sorting

**Key feature:** Browse marketplace before drilling into specific agent details

---

## What Changed from V1 to V2

### 1. Capabilities Display
**V1:** Generic bullet points
```
What This Agent Can Do
• Weekly Voice of Customer digest
• Launch-critical risk tracker
```

**V2:** Explicit tool/workflow cards
```
Custom Tools (4)
├─ create_roadmap_draft
├─ analyze_ticket_priority
└─ ...

Workflows (2)
├─ Weekly Voice of Customer Digest
└─ Launch-Critical Risk Tracker

Connection Tools (5)
├─ GMAIL_SEND_EMAIL (Gmail)
└─ ...
```

### 2. Visual Style
**V1:**
- Blue gradients
- Heavy shadows
- Colorful badges

**V2:**
- Solid white/gray
- Minimal shadows
- Muted colors

### 3. Component Alignment
**V1:** Custom CSS

**V2:** Matches codebase:
- `components/ui/card.tsx`
- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `ToolCard.tsx`, `WorkflowCard.tsx`

---

## Design System (V2)

### Colors
```
Primary: rgb(15 23 42)     /* slate-900 */
Secondary: rgb(243 244 246) /* gray-100 */
Muted: rgb(107 114 128)     /* gray-500 */
Border: rgb(229 231 235)    /* gray-200 */
```

### Components
```html
<!-- Card -->
<div class="bg-white rounded-xl border p-6">

<!-- Button -->
<button class="h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-md">

<!-- Badge -->
<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
```

---

## Next Steps

1. **Review in browser** - Open v2-minimal/*.html files
2. **Compare with Agipo pages** - Check /workforce, /profile for consistency
3. **Convert to React** - Use actual shadcn/ui components
4. **Integrate data** - Connect to agent configs from _tables/

---

## Documentation

- **PRICING-MODEL-SUMMARY.md** - Complete pricing model, user flows, revenue split
- **IMPLEMENTATION-GUIDE.md** - API endpoints, database schema, Stripe integration

---

The goal: V2 should feel like a natural extension of existing Agipo UI.
