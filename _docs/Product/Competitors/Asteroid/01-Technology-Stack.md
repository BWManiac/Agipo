Asteroid.ai Technology Stack
=============================

> **Note**: This document distinguishes between **CONFIRMED** technologies (direct evidence) and **SPECULATED** technologies (inferred from patterns/UI). Only technologies with direct evidence are marked as confirmed.

---

## CONFIRMED Technologies

### 1. Playwright ✅ **CONFIRMED**

**Direct Evidence:**

- Agent Builder workflow diagram explicitly shows **"Playwright Script"** node
- Feature list states: **"Playwright logic with selector-based guardrails"**
- Workflow diagram demonstrates Playwright as execution path in graph-based builder

**Where We Saw It:**
- Agent Builder UI showing "Playwright Script" node
- Feature documentation page listing Playwright as core feature

---

### 2. Anchor Browser ✅ **CONFIRMED**

**Direct Evidence:**
- Network tab shows WebSocket connection: `wss://connect.anchorbrowser.io//vnc/?sessionId=8f33ba99-e7b8-4215-93cb-a0861f2a3468`
- Origin domain: `https://live.anchorbrowser.io`
- Protocol: **VNC** (Virtual Network Computing) over WebSocket

**Where We Saw It:**
- Chrome DevTools → Network tab during agent execution
- WebSocket connection to `connect.anchorbrowser.io`
- VNC protocol in connection URL

**What This Confirms:**
- They use Anchor Browser for browser infrastructure
- VNC protocol for real-time browser viewing
- Session-based browser management
- Managed browser infrastructure (not self-hosted)

---

### 3. rrweb ✅ **CONFIRMED**

**Direct Evidence:**
- Browser console shows: `rrweb-plugin-console-record.js:2447`
- This is the console recording plugin from the rrweb library

**Where We Saw It:**
- Browser console during agent execution
- Execution dashboard while viewing agent runs

---

### 4. PostHog ✅ **CONFIRMED**

**Direct Evidence:**
- Source code found: `autocapture-utils.ts` (PostHog's autocapture utility)
- PostHog's `Autocapture` class found in their codebase

**Note**: This appears to be for their **own platform analytics**, not the browser automation engine.

---

## SPECULATED Technologies (Inferred from Evidence)

### Browser Automation Engines

**Speculation** (Not Confirmed):
According to their blog post, they mention supporting "Playwright, Selenium, or CDP commands", but we only have direct evidence for **Playwright**.

- **Playwright**: ✅ Confirmed (see above)
- **Selenium**: ⚠️ Mentioned in blog, no direct evidence found
- **CDP**: ⚠️ Mentioned in blog, no direct evidence found

**Inference**: They may support multiple engines, but we can only confirm Playwright.

### Cookie API Structure

**Evidence** (Inferred from UI):
- Cookie management UI fields match Playwright's cookie API structure
- Fields: domain, SameSite, Secure, HttpOnly align with Playwright's interface

**Inference**: This strongly suggests Playwright, but cookie APIs are similar across automation tools, so this is supporting evidence rather than direct proof.

---

### Browser Engine (Chromium/Firefox/WebKit)

**Speculation**: Playwright supports Chromium, Firefox, and WebKit, but we don't know which one(s) Asteroid uses.

**Most Likely**: Headless Chromium (standard default for Playwright)

**Evidence**: None - this is pure inference from Playwright being the engine.

---

### Encryption Implementation

**Evidence** (UI Statement):
> "All credentials are encrypted in transit and at rest."

**Speculation**:
- Likely uses Node.js `crypto` module (AES-256-GCM)
- Possibly AWS KMS or HashiCorp Vault for key management
- TLS/HTTPS for transit encryption

**Note**: We know encryption happens, but not the implementation details.

---

### TOTP Library

**Evidence** (UI Feature):
- "TOTP Secrets" section in Vault tab
- Support for 2FA authentication

**Speculation**:
- Likely `otplib` or similar library
- Standard TOTP (RFC 6238) implementation

**Note**: We know TOTP is supported, but not which library.

---

### CAPTCHA Solving Service

**Evidence** (UI Feature):
- "Captcha Solver" toggle in UI
- "Automated CAPTCHA handling" mentioned in features

**Speculation**:
- Could be 2Captcha, AntiCaptcha, Capsolver, or another service
- Standard API integration pattern

**Note**: We know CAPTCHA solving exists, but not which service.

---

### Stealth/Anti-Detection Libraries

**Evidence** (UI Feature):
- "Extra Stealth" toggle in UI
- Proxy and fingerprinting features

**Speculation**:
- Could use `puppeteer-extra-plugin-stealth` patterns
- Could be custom scripts
- Standard fingerprinting evasion techniques

**Note**: We know stealth features exist, but not the implementation.

---

### Real-Time Viewing Technology

**Confirmed**: Uses Anchor Browser with VNC protocol (see Anchor Browser section above)

**Speculation**:
- May also use rrweb for session replay (separate from live viewing)
- Screenshot streaming possible but not confirmed
- WebSocket connections confirmed (network evidence)

---

## Architecture Pattern (Confirmed + Inferred)

Based on **confirmed evidence**, their stack includes:

```
┌─────────────────────────────────────┐
│  Custom: Visual Builder (Astro)    │
│  Custom: Graph-based Workflow      │
│  Custom: AI Reasoning Layer        │
│  Custom: Hybrid DOM/Vision Router  │
├─────────────────────────────────────┤
│  Playwright (✅ CONFIRMED)         │
├─────────────────────────────────────┤
│  Anchor Browser (✅ CONFIRMED)     │
│    - VNC streaming for live view   │
│    - Session-based browsers        │
│    - Managed infrastructure        │
├─────────────────────────────────────┤
│  Supporting Libraries              │
│  - rrweb (✅ CONFIRMED)            │
│  - PostHog (✅ CONFIRMED)          │
└─────────────────────────────────────┘
```

**Note**: Other components (Selenium/CDP support, specific libraries, browser engine) are **inferred** from UI/features but not directly confirmed.

---

## Summary: Confirmed vs Speculated

| Technology | Status | Evidence Type |
|-----------|--------|---------------|
| **Playwright** | ✅ CONFIRMED | Direct UI references |
| **Anchor Browser** | ✅ CONFIRMED | Network traffic |
| **rrweb** | ✅ CONFIRMED | Console logs |
| **PostHog** | ✅ CONFIRMED | Source code |
| **Chromium/Firefox/WebKit** | ⚠️ SPECULATED | Inferred from Playwright |
| **Encryption library** | ⚠️ SPECULATED | Inferred from UI statements |
| **TOTP library** | ⚠️ SPECULATED | Inferred from feature |
| **CAPTCHA service** | ⚠️ SPECULATED | Inferred from feature |
| **Stealth library** | ⚠️ SPECULATED | Inferred from feature |

---

## Key Takeaway

**Confirmed**: They use managed browser infrastructure (Anchor Browser) with Playwright automation. They're building an intelligent orchestration layer on top of proven technologies, not reinventing browser automation.

**Their innovation is likely in:**
1. AI-powered reasoning and planning (speculated)
2. Hybrid DOM + vision approach (mentioned in blog)
3. Graph-based workflow execution (confirmed via UI)
4. Enterprise-grade credential management (confirmed via UI)
5. Real-time streaming via VNC (confirmed via Anchor Browser)

