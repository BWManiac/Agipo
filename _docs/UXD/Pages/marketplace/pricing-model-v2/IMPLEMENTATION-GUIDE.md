# Marketplace Pricing Implementation Guide

**Quick reference for engineering team implementing the tiered subscription model**

---

## Data Models

### Agent Pricing Configuration
```typescript
interface PricingTier {
  id: string;
  agentId: string;
  name: string; // "Starter", "Professional", "Enterprise"
  priceMonthly: number; // in cents: 2900, 9900, 29900
  quotas: {
    workflowRuns: number | null; // null = unlimited
    toolCalls: number | null; // null = unlimited
  };
  features: string[]; // ["Priority support", "Advanced analytics"]
  isPopular: boolean; // Show "Most Popular" badge
  displayOrder: number; // 1, 2, 3 for sorting
}

interface AgentSubscription {
  id: string;
  userId: string;
  agentId: string;
  tierId: string;
  status: "trial" | "active" | "past_due" | "canceled" | "paused";
  trialEndsAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;

  // Usage tracking
  currentUsage: {
    workflowRuns: number;
    toolCalls: number;
    lastResetAt: Date; // Reset monthly
  };
}

interface CreatorPayout {
  id: string;
  creatorId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number; // Gross subscription revenue
  platformFee: number; // 30%
  creatorEarnings: number; // 70%
  platformCosts: number; // Pass-through costs (Composio, LLM)
  netPayout: number; // creatorEarnings - platformCosts
  status: "pending" | "processing" | "paid" | "failed";
  paidAt: Date | null;
  stripeTransferId: string | null;
}
```

---

## API Endpoints

### User Flows

#### 1. Subscribe to Agent
```
POST /api/marketplace/subscriptions
Body: {
  agentId: string;
  tierId: string;
  paymentMethodId?: string; // Optional for trial
}

Response: {
  subscriptionId: string;
  status: "trial" | "active";
  trialEndsAt: Date | null;
  nextBillingDate: Date;
  amount: number;
}
```

#### 2. Get My Subscriptions
```
GET /api/marketplace/subscriptions?userId={userId}

Response: {
  subscriptions: Array<{
    id: string;
    agent: { id, name, avatar, creator };
    tier: { name, price, quotas };
    status: "trial" | "active" | ...;
    usage: { workflowRuns, toolCalls };
    nextBillingDate: Date;
    amount: number;
  }>;
}
```

#### 3. Upgrade/Downgrade Subscription
```
PATCH /api/marketplace/subscriptions/{subscriptionId}
Body: {
  newTierId: string;
}

Response: {
  subscriptionId: string;
  proratedCharge: number; // Amount charged today
  newMonthlyAmount: number; // Starting next cycle
  effectiveDate: Date;
}
```

#### 4. Cancel Subscription
```
DELETE /api/marketplace/subscriptions/{subscriptionId}
Query: ?cancelImmediately=false // Default: cancel at period end

Response: {
  subscriptionId: string;
  status: "canceled";
  accessUntil: Date; // End of current billing period
}
```

#### 5. Check Usage
```
GET /api/marketplace/subscriptions/{subscriptionId}/usage

Response: {
  quotas: {
    workflowRuns: { used: 45, limit: 500, percentage: 9 };
    toolCalls: { used: 234, limit: 2500, percentage: 9 };
  };
  resetDate: Date; // Next quota reset (start of next billing period)
}
```

### Builder Flows

#### 6. Configure Agent Pricing
```
POST /api/marketplace/agents/{agentId}/pricing
Body: {
  tiers: Array<{
    name: string;
    priceMonthly: number;
    quotas: { workflowRuns: number | null, toolCalls: number | null };
    features: string[];
    isPopular?: boolean;
  }>;
}

Response: {
  agentId: string;
  tiers: Array<PricingTier>;
}
```

#### 7. Get Builder Analytics
```
GET /api/marketplace/creators/{creatorId}/analytics?agentId={agentId}

Response: {
  revenue: {
    totalRevenue: number;
    creatorEarnings: number;
    platformCosts: number;
    netPayout: number;
  };
  subscribers: {
    total: number;
    byTier: { tierId: string, tierName: string, count: number }[];
    growth: { month: string, count: number }[];
  };
  usage: {
    avgWorkflowRuns: number;
    avgToolCalls: number;
    topUsagePercentile: number; // P95 usage
  };
  recommendations: Array<{
    type: "add_tier" | "adjust_quota" | "increase_price";
    message: string;
    suggestedAction: object;
  }>;
}
```

#### 8. Get Payout History
```
GET /api/marketplace/creators/{creatorId}/payouts

Response: {
  payouts: Array<{
    id: string;
    periodStart: Date;
    periodEnd: Date;
    totalRevenue: number;
    platformFee: number;
    creatorEarnings: number;
    platformCosts: number;
    netPayout: number;
    status: "pending" | "processing" | "paid";
    paidAt: Date | null;
  }>;
  nextPayout: {
    estimatedDate: Date;
    estimatedAmount: number;
  };
}
```

---

## Usage Tracking Hooks

### Agent Execution Wrapper
```typescript
// In agent runtime (app/api/workforce/[agentId]/chat/route.ts)

export async function POST(request: Request, { params }: { params: { agentId: string } }) {
  const { userId } = await auth();

  // 1. Check if user has active subscription
  const subscription = await getActiveSubscription(userId, params.agentId);
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription" }, { status: 402 });
  }

  // 2. Check quota before execution
  const usage = await getCurrentUsage(subscription.id);
  const tier = await getTier(subscription.tierId);

  if (tier.quotas.workflowRuns !== null && usage.workflowRuns >= tier.quotas.workflowRuns) {
    return NextResponse.json({
      error: "Workflow run quota exceeded",
      usage: usage,
      quota: tier.quotas.workflowRuns,
      upgradeUrl: `/marketplace/agents/${params.agentId}/upgrade`
    }, { status: 429 });
  }

  // 3. Execute agent
  const result = await executeAgent(/* ... */);

  // 4. Track usage
  await incrementUsage(subscription.id, {
    workflowRuns: 1,
    toolCalls: result.toolCallsCount
  });

  // 5. Track costs for creator billing
  await trackPlatformCosts(subscription.id, {
    composioApiCalls: result.composioCost,
    llmTokens: result.llmCost
  });

  return result;
}
```

---

## Stripe Integration

### Setup Stripe Connect for Marketplace

```typescript
// 1. Onboard creator
async function onboardCreator(creatorId: string) {
  const account = await stripe.accounts.create({
    type: 'express', // or 'standard' for more control
    country: 'US',
    email: creator.email,
    capabilities: {
      transfers: { requested: true },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${baseUrl}/creator/onboarding/refresh`,
    return_url: `${baseUrl}/creator/dashboard`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, onboardingUrl: accountLink.url };
}

// 2. Create subscription (with platform fee)
async function createSubscription(
  userId: string,
  agentId: string,
  tierId: string,
  paymentMethodId?: string
) {
  const tier = await getTier(tierId);
  const agent = await getAgent(agentId);
  const creator = await getCreator(agent.creatorId);

  // Create customer if doesn't exist
  let customer = await getStripeCustomer(userId);
  if (!customer) {
    customer = await stripe.customers.create({
      metadata: { userId },
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // Create subscription with 70/30 split
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${agent.name} - ${tier.name}`,
          metadata: { agentId, tierId },
        },
        recurring: { interval: 'month' },
        unit_amount: tier.priceMonthly, // in cents
      },
    }],
    trial_period_days: 7,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    application_fee_percent: 30, // Platform takes 30%
    transfer_data: {
      destination: creator.stripeAccountId, // Creator gets 70%
    },
    metadata: { userId, agentId, tierId },
  });

  return subscription;
}

// 3. Handle webhook events
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      // User subscribed
      await createSubscriptionRecord(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      // Send reminder email (3 days before trial ends)
      await sendTrialEndingEmail(event.data.object);
      break;

    case 'customer.subscription.updated':
      // User upgraded/downgraded
      await updateSubscriptionRecord(event.data.object);
      break;

    case 'customer.subscription.deleted':
      // Subscription canceled
      await markSubscriptionCanceled(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      // Payment went through
      await recordPayment(event.data.object);
      break;

    case 'invoice.payment_failed':
      // Payment failed - notify user
      await handleFailedPayment(event.data.object);
      break;
  }
}
```

---

## Quota Enforcement Logic

### Reset Quota Monthly
```typescript
// Cron job: Run daily at midnight
async function resetMonthlyQuotas() {
  const now = new Date();

  // Find all subscriptions where currentPeriodEnd is today
  const subscriptionsToReset = await db.query(`
    SELECT id FROM agent_subscriptions
    WHERE DATE(current_period_end) = DATE($1)
    AND status IN ('active', 'trial')
  `, [now]);

  for (const sub of subscriptionsToReset) {
    await db.query(`
      UPDATE agent_subscriptions
      SET current_usage = jsonb_build_object(
        'workflowRuns', 0,
        'toolCalls', 0,
        'lastResetAt', $1
      ),
      current_period_start = current_period_end,
      current_period_end = current_period_end + INTERVAL '1 month'
      WHERE id = $2
    `, [now, sub.id]);
  }
}
```

### Check Quota Before Execution
```typescript
async function checkQuota(subscriptionId: string): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getSubscription(subscriptionId);
  const tier = await getTier(subscription.tierId);

  // Unlimited tier
  if (tier.quotas.workflowRuns === null) {
    return { allowed: true };
  }

  // Check workflow runs
  if (subscription.currentUsage.workflowRuns >= tier.quotas.workflowRuns) {
    return {
      allowed: false,
      reason: `Workflow run quota exceeded (${subscription.currentUsage.workflowRuns}/${tier.quotas.workflowRuns})`
    };
  }

  return { allowed: true };
}
```

### Warn User at 80% Usage
```typescript
// Cron job: Run hourly
async function sendQuotaWarnings() {
  const subscriptions = await db.query(`
    SELECT s.*, t.quotas, u.email
    FROM agent_subscriptions s
    JOIN pricing_tiers t ON s.tier_id = t.id
    JOIN users u ON s.user_id = u.id
    WHERE s.status = 'active'
    AND s.quota_warning_sent_at IS NULL
    AND (
      (s.current_usage->>'workflowRuns')::int >= (t.quotas->>'workflowRuns')::int * 0.8
      OR (s.current_usage->>'toolCalls')::int >= (t.quotas->>'toolCalls')::int * 0.8
    )
  `);

  for (const sub of subscriptions) {
    await sendEmail({
      to: sub.email,
      subject: `Approaching usage limit for ${sub.agentName}`,
      template: 'quota-warning',
      data: {
        agentName: sub.agentName,
        usage: sub.currentUsage,
        quotas: sub.quotas,
        upgradeUrl: `${baseUrl}/marketplace/agents/${sub.agentId}/upgrade`
      }
    });

    await db.query(`
      UPDATE agent_subscriptions
      SET quota_warning_sent_at = NOW()
      WHERE id = $1
    `, [sub.id]);
  }
}
```

---

## Platform Cost Tracking

### Track Costs Per Execution
```typescript
interface PlatformCost {
  subscriptionId: string;
  executionId: string;
  timestamp: Date;
  costs: {
    composioApiCalls: number; // in cents
    llmTokens: number; // in cents
    storage: number; // in cents
  };
  total: number;
}

async function trackExecutionCosts(
  subscriptionId: string,
  executionId: string,
  costs: { composioApiCalls: number; llmTokens: number; storage: number }
) {
  const total = costs.composioApiCalls + costs.llmTokens + costs.storage;

  await db.query(`
    INSERT INTO platform_costs (subscription_id, execution_id, timestamp, costs, total)
    VALUES ($1, $2, NOW(), $3, $4)
  `, [subscriptionId, executionId, JSON.stringify(costs), total]);
}
```

### Calculate Creator Payout
```typescript
async function calculateMonthlyPayout(creatorId: string, month: Date) {
  // 1. Get all subscriptions for creator's agents
  const subscriptions = await db.query(`
    SELECT s.id, s.tier_id, t.price_monthly
    FROM agent_subscriptions s
    JOIN agents a ON s.agent_id = a.id
    JOIN pricing_tiers t ON s.tier_id = t.id
    WHERE a.creator_id = $1
    AND s.status IN ('active', 'trial')
    AND s.current_period_start >= DATE_TRUNC('month', $2)
    AND s.current_period_start < DATE_TRUNC('month', $2) + INTERVAL '1 month'
  `, [creatorId, month]);

  // 2. Sum total revenue
  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.price_monthly, 0);

  // 3. Calculate platform fee (30%)
  const platformFee = Math.floor(totalRevenue * 0.30);

  // 4. Calculate creator's 70%
  const creatorEarnings = totalRevenue - platformFee;

  // 5. Sum platform costs (pass-through to creator)
  const platformCosts = await db.query(`
    SELECT COALESCE(SUM(total), 0) as total_cost
    FROM platform_costs
    WHERE subscription_id IN (${subscriptions.map(s => s.id).join(',')})
    AND timestamp >= DATE_TRUNC('month', $1)
    AND timestamp < DATE_TRUNC('month', $1) + INTERVAL '1 month'
  `, [month]);

  // 6. Net payout = 70% - platform costs
  const netPayout = creatorEarnings - platformCosts.rows[0].total_cost;

  return {
    totalRevenue,
    platformFee,
    creatorEarnings,
    platformCosts: platformCosts.rows[0].total_cost,
    netPayout
  };
}
```

---

## Email Templates

### 1. Trial Ending Reminder (3 days before)
```
Subject: Your PM Agent trial ends in 3 days

Hi [User Name],

Your 7-day free trial of PM Agent (Professional plan) ends on December 15, 2025.

Current usage:
• Workflow runs: 45 / 500 (9%)
• Tool calls: 234 / 2,500 (9%)

After your trial ends, you'll be charged $99.00/month unless you cancel.

[Continue Subscription] [Cancel Trial]

Questions? Reply to this email.
```

### 2. Quota Warning (at 80%)
```
Subject: Approaching usage limit for PM Agent

Hi [User Name],

You've used 438 out of 500 workflow runs this month (88%).

To avoid hitting your limit, consider upgrading to Enterprise for unlimited usage.

[Upgrade to Enterprise] [View Usage Dashboard]
```

### 3. Quota Exceeded
```
Subject: PM Agent quota exceeded

Hi [User Name],

You've reached your monthly quota of 500 workflow runs.

Your agent will resume working on [Next Billing Date] when your quota resets, or you can upgrade now for immediate access.

[Upgrade Now] [View Plans]
```

---

## Database Schema

```sql
-- Pricing Tiers
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  quotas JSONB NOT NULL, -- { workflowRuns: 500, toolCalls: 2500 }
  features TEXT[] NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE agent_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL, -- trial, active, past_due, canceled, paused
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  current_usage JSONB NOT NULL DEFAULT '{"workflowRuns": 0, "toolCalls": 0, "lastResetAt": null}',
  quota_warning_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform Costs (pass-through to creators)
CREATE TABLE platform_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES agent_subscriptions(id) ON DELETE CASCADE,
  execution_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  costs JSONB NOT NULL, -- { composioApiCalls: 12, llmTokens: 45, storage: 2 }
  total INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_costs_subscription ON platform_costs(subscription_id, timestamp);

-- Creator Payouts
CREATE TABLE creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue INTEGER NOT NULL, -- in cents
  platform_fee INTEGER NOT NULL, -- 30%
  creator_earnings INTEGER NOT NULL, -- 70%
  platform_costs INTEGER NOT NULL, -- pass-through costs
  net_payout INTEGER NOT NULL, -- creator_earnings - platform_costs
  status VARCHAR(50) NOT NULL, -- pending, processing, paid, failed
  paid_at TIMESTAMP,
  stripe_transfer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_creator_payouts_creator ON creator_payouts(creator_id, period_start);
```

---

## Testing Checklist

### User Subscription Flow
- [ ] Can subscribe to agent with valid payment method
- [ ] Trial starts correctly (7 days, no charge)
- [ ] Trial ending reminder sent 3 days before
- [ ] Subscription converts to paid after trial
- [ ] Usage tracked correctly (workflow runs + tool calls)
- [ ] Quota enforcement works (blocked at limit)
- [ ] Warning sent at 80% usage
- [ ] Can upgrade tier mid-month (prorated billing)
- [ ] Can downgrade tier (takes effect next cycle)
- [ ] Can cancel subscription (access until period end)

### Builder Analytics
- [ ] Revenue dashboard shows correct totals
- [ ] Subscriber count accurate per tier
- [ ] Platform costs tracked correctly
- [ ] Payout calculation includes all subscriptions
- [ ] Payout deducts platform costs
- [ ] Can configure pricing tiers
- [ ] Can edit existing tiers
- [ ] Usage recommendations appear when relevant

### Edge Cases
- [ ] User hits quota exactly at limit
- [ ] User tries to use agent without subscription
- [ ] Subscription fails to renew (payment failed)
- [ ] Creator deletes agent with active subscribers
- [ ] User subscribes to same agent twice (should error)
- [ ] Prorated refunds when canceling mid-month
- [ ] Handling timezone differences in billing cycles

---

## Monitoring & Alerts

### Key Metrics to Track
1. **Subscription MRR** - Monthly Recurring Revenue
2. **Churn Rate** - % subscribers canceling per month
3. **Trial Conversion Rate** - % trials converting to paid
4. **Upgrade Rate** - % users upgrading tiers
5. **Quota Overage Rate** - % users hitting limits
6. **Failed Payments** - Count of failed renewals
7. **Payout Accuracy** - % payouts processed correctly

### Alerts to Configure
- Failed payment > 10 in last hour
- Churn rate > 10% in last 7 days
- Payout failed to process
- Stripe webhook not received in 5 minutes
- Usage tracking delay > 1 minute
- Creator cost ratio > 80% of revenue

---

## Security Considerations

1. **Quota Bypass Prevention**: Validate subscription status on every agent call, not just at start
2. **Payment Data**: Never store raw credit card info (Stripe handles this)
3. **Creator Isolation**: Ensure creator can only see their own agents' analytics
4. **User Isolation**: Users can only access their own subscriptions
5. **Webhook Verification**: Verify Stripe webhook signatures
6. **Rate Limiting**: Prevent abuse of free trials (1 per agent per email)

---

## Go-Live Checklist

- [ ] Stripe Connect configured for marketplace
- [ ] Webhook endpoints set up and tested
- [ ] Email templates created in SendGrid/Postmark
- [ ] Cron jobs scheduled (quota reset, warnings, payouts)
- [ ] Analytics dashboards created (Mixpanel/Amplitude)
- [ ] Error monitoring (Sentry)
- [ ] Load testing completed (handle 1000 concurrent subscriptions)
- [ ] Legal review of Terms of Service
- [ ] Creator agreement finalized
- [ ] Refund policy published
- [ ] Customer support trained on subscription flows
