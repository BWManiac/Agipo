Asteroid.ai Technology Stack
=============================

## Core Browser Automation

### Primary Engine: Playwright (Confirmed)

**Evidence:**

1. **Explicit UI References** (High Confidence):
   - Agent Builder workflow diagram explicitly shows **"Playwright Script"** node
   - Feature list states: **"Playwright logic with selector-based guardrails"**
   - Workflow diagram demonstrates Playwright as execution path in graph-based builder

2. **Cookie API Structure** (High Confidence):
   - Cookie management UI matches Playwright's cookie API structure exactly
   - Standard cookie fields (domain, SameSite, Secure, HttpOnly) align with Playwright's cookie interface

3. **Blog References** (High Confidence):
   - Mentions "accessibility snapshots (popularized by Microsoft's Playwright MCP server)" in their blog
   - Describes Playwright as one of the supported execution engines

**Code Pattern Match:**
```typescript
// Asteroid's cookie structure matches Playwright's API
interface Cookie {
  name: string        // Cookie Key (their UI)
  value: string       // Cookie Value
  domain: string      // Domain
  expires?: number    // Expiry
  httpOnly?: boolean  // HttpOnly checkbox
  secure?: boolean    // Secure checkbox
  sameSite?: 'Strict' | 'Lax' | 'None' // SameSite dropdown
}
```

### Alternative Engines Supported

According to their blog post ["When will browser agents do real work?"](https://asteroid.ai/blog/when-will-browser-agents-do-real-work/):

> "The agent compiles that knowledge into **deterministic scripts (Playwright, Selenium, or CDP commands)**"

**Inference**: They support multiple browser automation engines:
- **Playwright** (primary, based on evidence)
- **Selenium** (for legacy compatibility)
- **Chrome DevTools Protocol (CDP)** (direct browser control)

This suggests they have an abstraction layer over multiple engines.

---

## Session Recording & Replay

### rrweb

**About rrweb:**
[rrweb](https://www.rrweb.io/) is an open-source web session replay library that provides easy-to-use APIs to record user interactions and replay them remotely. It's trusted by companies like PostHog, Highlight, and Pendo.

**Evidence of Usage:**

1. **Console Logs** (Direct Evidence):
   - Browser console shows `rrweb-plugin-console-record.js:2447` during agent execution
   - This is the console recording plugin from rrweb

2. **UI References** (Direct Evidence):
   - References to `lazy-recorder.js` and `dead-clicks-autocapture.js` in source
   - These are related to rrweb's recording capabilities

3. **PostHog Integration** (Indirect Evidence):
   - PostHog source code found in their codebase
   - PostHog uses rrweb for session replay
   - Suggests they're using similar patterns

4. **Real-Time Browser View** (Functional Evidence):
   - Live browser viewing in execution dashboard
   - Action logs showing real-time DOM interactions
   - "Automatic recording and playback of every run" feature
   - These capabilities match rrweb's functionality exactly

**Where We Saw It:**
- **Browser Console**: `rrweb-plugin-console-record.js` appeared in console logs when viewing agent executions
- **Execution Dashboard**: Real-time browser view showing live agent interactions (powered by rrweb streaming)
- **Session Replay**: "Automatic recording and playback" feature uses rrweb for full session reconstruction

**Purpose:**
- Records DOM mutations and events
- Enables session replay
- Real-time streaming of browser state
- Pixel-perfect replay of user interactions

**Usage Pattern:**
```typescript
import { record } from 'rrweb'

record({
  emit(event) {
    // Stream events via WebSocket for live view
    // Store events for replay
  }
})
```

---

## Analytics & Session Tracking

### PostHog

**Evidence:**
- Found `autocapture-utils.ts` in their codebase (PostHog's autocapture utility)
- PostHog's `Autocapture` class found in source
- PostHog uses rrweb for session replay

**Purpose:**
- Analytics on their own platform
- Session replay for debugging
- User behavior tracking

**Note**: This is for their **own platform analytics**, not the browser automation engine.

---

## Authentication & Credentials

### Encryption Libraries

**Evidence from UI:**
> "All credentials are encrypted in transit and at rest. Credentials are only decrypted when an agent attempts to use them."

**Likely Technologies:**
- Node.js `crypto` module (AES-256-GCM encryption)
- AWS KMS or HashiCorp Vault (for key management)
- TLS/HTTPS for transit encryption

### TOTP Support

**Evidence from UI:**
- "TOTP Secrets" section in Vault tab
- Support for 2FA authentication

**Likely Technology:**
- `otplib` or similar library for TOTP generation

---

## Stealth & Anti-Detection

### Anti-Detection Libraries

**Evidence:**
- "Extra Stealth" toggle in UI
- Proxy and fingerprinting features

**Likely Technologies:**
- `puppeteer-extra-plugin-stealth` (if using Puppeteer)
- Custom fingerprinting evasion scripts (if using Playwright)
- User-agent rotation libraries

### CAPTCHA Solving

**Evidence:**
- "Captcha Solver" toggle in UI
- Mentions "automated CAPTCHA handling" in features

**Likely Integrations:**
- 2Captcha API
- AntiCaptcha API
- Capsolver API

---

## Real-Time Infrastructure

### WebSocket

**Evidence:**
- Real-time browser viewing functionality
- WebSocket connections to `odyssey.asteroid.ai` visible in console
- Live streaming of agent execution

**Usage:**
- Stream rrweb events in real-time
- Broadcast screenshots/viewport updates
- Real-time execution status

---

## Architecture Pattern

Based on all evidence, their stack looks like:

```
┌─────────────────────────────────────┐
│  Custom: Visual Builder (Astro)    │
│  Custom: Graph-based Workflow      │
│  Custom: AI Reasoning Layer        │
│  Custom: Hybrid DOM/Vision Router  │
├─────────────────────────────────────┤
│  Abstraction Layer                 │
│  (Supports Playwright/Selenium/CDP)│
├─────────────────────────────────────┤
│  Browser Automation Engines        │
│  - Playwright (primary)            │
│  - Selenium (legacy)               │
│  - CDP (direct control)            │
├─────────────────────────────────────┤
│  Supporting Libraries              │
│  - rrweb (session recording)       │
│  - PostHog (analytics)             │
│  - otplib (TOTP)                   │
│  - CAPTCHA APIs                    │
└─────────────────────────────────────┘
```

---

## Key Takeaway

**They are NOT building bespoke browser automation.** They're building an intelligent orchestration layer on top of proven, open-source browser automation engines. Their innovation is in:
1. AI-powered reasoning and planning
2. Hybrid DOM + vision approach
3. Graph-based workflow execution
4. Enterprise-grade credential management
5. Real-time streaming and observability

