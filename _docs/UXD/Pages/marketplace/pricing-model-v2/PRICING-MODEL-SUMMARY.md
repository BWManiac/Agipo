# Agipo Marketplace Pricing Model - Summary

**Date:** December 8, 2025
**Status:** Design Phase - High-Fidelity Mockups Complete

---

## 1. Executive Summary

This document outlines the **tiered subscription pricing model** for the Agipo agent marketplace, where users "hire" AI agents through predictable monthly subscriptions rather than pay-per-execution fees.

### Core Principle
**Agents are employees, not API calls.** Users should think "I pay $99/month for my PM agent" (like a SaaS subscription) rather than "I pay $0.50 per task" (like AWS billing).

---

## 2. The Pricing Model

### Model Choice: **Builder-Defined Tiered Subscriptions with Usage Quotas**

This is a hybrid approach (Option 4 from original discussion) that balances:
- **User predictability**: Fixed monthly cost
- **Builder protection**: Usage caps prevent abuse
- **Flexibility**: Builders set their own tiers and pricing

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PM Agent by Sarah Chen                    │
├─────────────────────────────────────────────────────────────┤
│  Starter: $29/mo                                            │
│  • 100 workflow runs per month                              │
│  • 500 tool calls included                                  │
│  • Email support                                            │
│                                                              │
│  Professional: $99/mo ⭐ MOST POPULAR                       │
│  • 500 workflow runs per month                              │
│  • 2,500 tool calls included                                │
│  • Priority support + Advanced analytics                    │
│                                                              │
│  Enterprise: $299/mo                                        │
│  • Unlimited workflow runs                                  │
│  • Unlimited tool calls                                     │
│  • Dedicated support + Custom SLA                           │
└─────────────────────────────────────────────────────────────┘
```

### Revenue Split
- **Creator receives**: 70% of subscription fee
- **Platform takes**: 30% platform fee
- **Creator pays**: Pass-through costs for Composio API calls & LLM usage

**Example:** Professional tier at $99/month
- Creator receives: $69.30/month
- Platform fee: $29.70/month
- Creator's costs: ~$4-8/month (Composio + LLM)
- Creator's net profit: ~$61-65/month per subscriber

---

## 3. Key UX Principles

### Transparent Usage Tracking
Users see real-time usage against their quota:
```
Workflow Runs: 45 / 500 (9% used)
Tool Calls: 234 / 2,500 (9% used)
```

### Smart Upgrade Prompts
When users approach 80% quota:
```
⚠️ Approaching quota limit
You've used 438/500 runs. Consider upgrading to
Enterprise for unlimited access.
```

### 7-Day Free Trial
- No credit card required to start
- Full access to selected tier
- Clear communication: "Trial ends Dec 15 • $99/month after"

### Prorated Upgrades
If user upgrades mid-month:
```
You'll be charged $50 today (prorated for 15 days remaining).
Starting next billing cycle, you'll be charged $149/month.
```

---

## 4. User Flows

### Flow A: Discovery → Subscribe
1. Browse marketplace
2. Click agent card → View detail page
3. Review pricing tiers and features
4. Select tier → Click "Start 7-Day Free Trial"
5. Connect required integrations (Gmail, Linear, etc.)
6. Enter payment info (not charged during trial)
7. Success → Redirected to agent chat

### Flow B: Managing Subscription
1. Navigate to "My Subscriptions"
2. View all subscribed agents with usage stats
3. See approaching quota warnings
4. Click "Upgrade Plan" → Modal with tier options
5. Confirm upgrade → Prorated billing

### Flow C: Builder Publishing Agent
1. Create agent in Workflow Editor
2. Click "Publish to Marketplace"
3. Configure pricing tiers (use templates or custom)
4. Set tier names, quotas, and monthly prices
5. Submit for review → Platform approves
6. Agent goes live → Earnings dashboard available

---

## 5. Mockups Created

### 1. `agent-detail-pricing.html`
**What it shows:**
- Agent overview with stats (rating, active users, success rate)
- Pricing tier selector (3 tiers with radio button selection)
- Tier comparison table
- Reviews section with rating distribution
- "Start 7-Day Free Trial" CTA

**Key features:**
- Sticky pricing card that follows scroll
- Visual tier selection with "Most Popular" badge
- Usage recommendations: "💡 Most users with 2-3 projects choose Professional"
- Transparent platform fee disclosure

### 2. `checkout-flow.html`
**What it shows:**
- 4-step progress indicator (Select Plan → Integrations → Payment → Get Started)
- Selected tier summary
- Integration connection UI (Gmail, Linear, Notion, Slack)
- Payment form (credit card fields)
- Order summary sidebar with trial details

**Key features:**
- Shows "$0.00 Due Today" during trial
- Clear trial end date: "Starting Dec 15, 2025: $99.00/month"
- Revenue split transparency: "Creator receives: $69.30 (70%)"
- Cancel anytime guarantee badge

### 3. `my-subscriptions.html`
**What it shows:**
- Dashboard overview with total stats
- List of subscribed agents with usage bars
- Per-agent quota tracking (runs + tool calls)
- Trial vs. Active status badges
- Upgrade/downgrade/cancel actions

**Key features:**
- Color-coded usage bars (green < 50%, yellow 50-80%, red > 80%)
- Warning for agents approaching quota: "⚠️ Approaching quota limit"
- Upgrade modal with tier comparison
- Next billing date + amount

### 4. `builder-dashboard.html`
**What it shows:**
- Revenue overview cards (total revenue, active subscribers, ARPU, conversion rate)
- Pricing tier management (subscribers per tier)
- Recent subscriber list with usage indicators
- Payout schedule ($24,255 next payout on Dec 31)
- Platform costs breakdown (Composio, LLM, storage)

**Key features:**
- Pricing recommendations: "💡 Consider adding $149 tier for 1,000 runs"
- Subscriber usage tracking to help optimize pricing
- Transparent cost breakdown (API calls, LLM, storage)
- Profit margin calculation (94% in example)

---

## 6. Design Decisions & Rationale

### Why Tiered Subscriptions?
✅ **Predictable costs** - Users can budget monthly expenses
✅ **Matches SaaS mental model** - Familiar to enterprise buyers
✅ **Enables value-based pricing** - Builders charge for outcomes, not API calls
✅ **Reduces friction** - No mental math before each agent interaction
✅ **Supports enterprise sales** - CIOs approve fixed budgets easier than variable costs

### Why Usage Quotas?
✅ **Protects builders** - Prevents power users from abusing unlimited usage
✅ **Creates upgrade incentive** - Natural path to higher tiers
✅ **Fair resource allocation** - Heavy users pay more
✅ **Transparent limits** - Users know what they're getting

### Why 70/30 Revenue Split?
✅ **Industry standard** - App stores typically take 30%
✅ **Covers platform costs** - Infrastructure, hosting, payment processing
✅ **Attractive to creators** - 70% is generous compared to alternatives
✅ **Sustainable for platform** - 30% supports marketplace operations

### Why 7-Day Free Trial?
✅ **Reduces purchase friction** - Try before you buy
✅ **No credit card required** - Lower barrier to entry
✅ **High conversion rates** - Users who trial typically convert
✅ **Demonstrates value** - Agents prove themselves during trial

---

## 7. Open Design Questions

### 1. What happens when user hits quota mid-month?
**Option A:** Agent stops working, prompt to upgrade
**Option B:** Throttle performance (slower responses)
**Option C:** Overflow at pay-per-call rate

**Recommendation:** Option A with graceful degradation. Show warning at 80%, hard stop at 100% with prominent upgrade CTA.

### 2. How do creators set optimal pricing?
**Solution:** Platform provides:
- Usage analytics across all subscribers
- Recommended quotas based on typical usage patterns
- Tier templates (e.g., "Most PM agents price at $49-$149")
- Real-time suggestions: "Users averaging 420 runs → add $149 tier"

### 3. Should there be a free tier?
**Recommendation:** No true free tier, but:
- Free trials (7 days)
- Freemium agents (platform-provided, limited functionality)
- Scholarship/education program

### 4. How to handle annual subscriptions?
**Recommendation:** Offer annual plans with discount:
- Monthly: $99/month = $1,188/year
- Annual: $999/year (16% discount)
- Simplifies billing, improves retention

### 5. What if builder's costs exceed revenue?
**Scenario:** Enterprise user on $299/mo unlimited plan runs agent 24/7

**Solution:** Platform monitors cost/revenue ratio per subscriber. If costs exceed 80% of subscription fee:
1. Alert builder via email
2. Suggest increasing Enterprise tier price
3. Platform reserves right to throttle extreme outliers
4. Consider adding "fair use policy" to Enterprise terms

---

## 8. Competitive Analysis

### How Others Price AI Agents/Automation

| Platform | Pricing Model | Pros | Cons |
|----------|---------------|------|------|
| **Zapier** | Tiered subscriptions by task count | Predictable, familiar | Task counting is opaque |
| **Make.com** | Operations-based tiers | Granular control | Confusing for beginners |
| **n8n** | Self-hosted free, cloud tiered | Flexible | Requires technical setup |
| **Clay** | Credits + seats | Flexible | Credits expire, unpredictable |
| **Retool** | Per-seat pricing | Simple for teams | Doesn't scale with usage |

**Agipo's differentiation:** Combines predictable subscription pricing (like Zapier) with transparent usage quotas (like Make) while emphasizing the "hiring an employee" mental model.

---

## 9. Success Metrics

### For End Users
- **Subscription conversion rate**: % of trial users who convert to paid
- **Upgrade rate**: % of users who upgrade tiers within 90 days
- **Churn rate**: % of subscribers who cancel per month
- **NPS**: Net Promoter Score for marketplace experience

### For Builders
- **Average revenue per agent**: Total monthly revenue ÷ number of published agents
- **Subscriber growth rate**: Month-over-month subscriber increases
- **Trial-to-paid conversion**: % of trial starts that become paid subscribers
- **Creator retention**: % of builders who publish 2+ agents

### For Platform
- **Marketplace GMV**: Gross Merchandise Value (total subscriptions)
- **Take rate**: Platform fee as % of GMV (target: 30%)
- **Payout accuracy**: % of payouts processed on time without errors
- **Cost per acquisition**: Marketing spend ÷ new subscribers

---

## 10. Implementation Roadmap

### Phase 1: MVP (4-6 weeks)
- [ ] Agent detail page with tier selection
- [ ] Checkout flow with Stripe integration
- [ ] 7-day trial logic and reminder emails
- [ ] Basic usage tracking (runs + tool calls)
- [ ] "My Subscriptions" dashboard

### Phase 2: Builder Tools (3-4 weeks)
- [ ] Builder dashboard (revenue, subscribers, analytics)
- [ ] Tier configuration UI (set prices, quotas)
- [ ] Automatic quota enforcement
- [ ] Payout system (integrate with Stripe Connect)
- [ ] Usage recommendations for builders

### Phase 3: Growth Features (4-6 weeks)
- [ ] Rating and review system
- [ ] Featured/promoted listings (paid marketplace placement)
- [ ] Usage-based upgrade prompts
- [ ] Annual subscription option
- [ ] Enterprise custom pricing flow

### Phase 4: Advanced (8-10 weeks)
- [ ] Team accounts (multi-seat subscriptions)
- [ ] White-label agent deployments
- [ ] Creator marketplace analytics (benchmarks)
- [ ] Agent versioning (users stay on stable versions)
- [ ] Affiliate/referral program

---

## 11. Pricing Psychology Applied

### Anchoring
The Enterprise tier ($299) makes Professional ($99) seem reasonable by comparison.

### Social Proof
"⭐ Most Popular" badge on Professional tier guides decision-making.

### Loss Aversion
Trial ending countdown ("5 days remaining") creates urgency to convert.

### Decoy Effect
Starter tier exists partly to make Professional look like better value.

### Transparency Builds Trust
Showing "Creator receives 70%" and platform costs builds confidence in fair marketplace.

---

## 12. Next Steps

1. **User Testing** - Show mockups to 5-10 potential customers, gather feedback on pricing model
2. **Builder Interviews** - Talk to potential agent creators about 70/30 split and cost pass-through
3. **Technical Spike** - Validate quota enforcement architecture (can we track runs/calls accurately?)
4. **Stripe Integration** - Research Stripe Connect for marketplace payouts
5. **Legal Review** - Terms of service for marketplace, refund policy, creator agreements

---

## 13. Conclusion

The tiered subscription model with usage quotas strikes the right balance between:
- **User experience**: Predictable costs, clear value proposition
- **Builder success**: Fair compensation, protection from abuse
- **Platform sustainability**: 30% fee supports operations, transparent costs

This model positions Agipo as a **marketplace for hiring AI employees** rather than just another API automation tool. The emphasis on subscriptions over pay-per-call aligns with how companies budget for software and people, making enterprise adoption more likely.

**Key Insight:** Pricing isn't just about revenue—it shapes how users think about the product. By charging monthly subscriptions, we reinforce that agents are long-term team members, not disposable utilities.

---

## Appendix: File Locations

All mockups are located in:
```
/Users/zen/Desktop/Code/agipo/_docs/UXD/Pages/marketplace/
```

Files created:
1. `agent-detail-pricing.html` - Main product detail page with pricing tiers
2. `checkout-flow.html` - Multi-step subscription checkout
3. `my-subscriptions.html` - User dashboard for managing subscriptions
4. `builder-dashboard.html` - Creator analytics and earnings

Previous planning documents:
1. `marketplace-page-plan.md` - Original marketplace browse page plan
2. `agent-detail-page-plan.md` - Original detail page requirements
3. `marketplace.html` - Original marketplace browse mockup (1673 lines)
