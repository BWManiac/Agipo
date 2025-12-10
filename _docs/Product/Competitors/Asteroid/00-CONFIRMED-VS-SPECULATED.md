Confirmed vs Speculated Technologies
======================================

## Overview

This document provides a clear breakdown of what we **KNOW FOR CERTAIN** about Asteroid.ai's technology stack versus what we've **INFERRED or SPECULATED**.

---

## ✅ CONFIRMED Technologies (Direct Evidence)

### 1. Playwright
**Status**: ✅ **CONFIRMED**  
**Evidence Type**: Direct UI references  
**Where We Saw It**:
- Agent Builder workflow diagram shows "Playwright Script" node
- Feature list states "Playwright logic with selector-based guardrails"

**Confidence**: **Very High** - Explicit UI references, no inference needed

---

### 2. Anchor Browser
**Status**: ✅ **CONFIRMED**  
**Evidence Type**: Network traffic analysis  
**Where We Saw It**:
- Chrome DevTools → Network tab during agent execution
- WebSocket connection: `wss://connect.anchorbrowser.io//vnc/?sessionId=8f33ba99-e7b8-4215-93cb-a0861f2a3468`
- Origin: `https://live.anchorbrowser.io`
- Protocol: VNC (Virtual Network Computing)

**Confidence**: **Very High** - Direct network evidence, cannot be disputed

**What This Confirms**:
- They use Anchor Browser for browser infrastructure
- VNC protocol for real-time browser viewing
- Managed browser infrastructure (not self-hosted)

---

### 3. rrweb
**Status**: ✅ **CONFIRMED**  
**Evidence Type**: Browser console logs  
**Where We Saw It**:
- Browser console during agent execution
- Console log: `rrweb-plugin-console-record.js:2447`

**Confidence**: **Very High** - Direct console evidence

**Note**: We confirmed rrweb exists, but exact usage (live viewing vs replay vs analytics) is inferred.

---

### 4. PostHog
**Status**: ✅ **CONFIRMED**  
**Evidence Type**: Source code inspection  
**Where We Saw It**:
- Source code file: `autocapture-utils.ts` (PostHog's utility)
- PostHog's `Autocapture` class found in codebase

**Confidence**: **Very High** - Direct source code evidence

**Note**: Used for platform analytics, not browser automation.

---

### 5. VNC Protocol
**Status**: ✅ **CONFIRMED**  
**Evidence Type**: Network traffic  
**Where We Saw It**:
- WebSocket URL contains `/vnc/?sessionId=...`
- Protocol explicitly VNC

**Confidence**: **Very High** - Part of Anchor Browser confirmation

---

## ⚠️ SPECULATED Technologies (Inferred)

### Browser Engine (Chromium/Firefox/WebKit)
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: Inference from Playwright  
**Reasoning**: Playwright supports all three, but we don't know which one(s) Asteroid uses

**Confidence**: **Unknown** - No direct evidence

---

### Headless vs Headed Mode
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: Inference from patterns  
**Reasoning**: Anchor Browser abstracts this detail, we can't determine from network traffic

**Confidence**: **Unknown** - Anchor Browser implementation is opaque

---

### Encryption Library
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: UI statements  
**Confirmed**: Encryption happens  
**Unknown**: Which library/method

**Possible Options**:
- Node.js `crypto` module (AES-256-GCM)
- AWS KMS
- HashiCorp Vault
- Other

**Confidence**: **Low** - We know the feature exists, not the implementation

---

### TOTP Library
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: UI feature  
**Confirmed**: TOTP/2FA support exists  
**Unknown**: Which library

**Possible Options**:
- `otplib`
- Custom implementation
- Other

**Confidence**: **Low** - Feature confirmed, implementation unknown

---

### CAPTCHA Solving Service
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: UI feature  
**Confirmed**: CAPTCHA solving feature exists  
**Unknown**: Which service

**Possible Options**:
- 2Captcha
- AntiCaptcha
- Capsolver
- Other

**Confidence**: **Low** - Feature confirmed, service unknown

---

### Stealth/Anti-Detection Library
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: UI feature  
**Confirmed**: "Extra Stealth" feature exists  
**Unknown**: Implementation method

**Possible Options**:
- `puppeteer-extra-plugin-stealth` patterns
- Custom scripts
- Anchor Browser-provided features
- Other

**Confidence**: **Low** - Feature confirmed, implementation unknown

---

### Hybrid DOM + Vision Approach
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: Blog post  
**Source**: ["When will browser agents do real work?"](https://asteroid.ai/blog/when-will-browser-agents-do-real-work/)

**What They Say**: They describe using both DOM-based and vision-based approaches

**Confidence**: **Medium** - Described in blog, but no technical confirmation

---

### Selenium/CDP Support
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: Blog post mention  
**Source**: Blog mentions supporting "Playwright, Selenium, or CDP commands"

**Confidence**: **Low** - Mentioned but no direct evidence of actual usage

---

### Screenshot Streaming
**Status**: ⚠️ **SPECULATED**  
**Evidence Type**: Inference from patterns  
**Reasoning**: Common pattern, but VNC could handle all viewing needs

**Confidence**: **Very Low** - Pure speculation, no evidence

---

## Summary Table

| Technology | Status | Evidence Quality | Confidence |
|-----------|--------|------------------|------------|
| Playwright | ✅ CONFIRMED | Direct UI | Very High |
| Anchor Browser | ✅ CONFIRMED | Network traffic | Very High |
| rrweb | ✅ CONFIRMED | Console logs | Very High |
| PostHog | ✅ CONFIRMED | Source code | Very High |
| VNC Protocol | ✅ CONFIRMED | Network traffic | Very High |
| Browser Engine | ⚠️ SPECULATED | Inference | Unknown |
| Headless/Headed | ⚠️ SPECULATED | Inference | Unknown |
| Encryption Library | ⚠️ SPECULATED | UI statement | Low |
| TOTP Library | ⚠️ SPECULATED | UI feature | Low |
| CAPTCHA Service | ⚠️ SPECULATED | UI feature | Low |
| Stealth Library | ⚠️ SPECULATED | UI feature | Low |
| Hybrid DOM+Vision | ⚠️ SPECULATED | Blog post | Medium |
| Selenium/CDP | ⚠️ SPECULATED | Blog mention | Low |

---

## Key Principles

1. **Confirmed** = Direct technical evidence that cannot be disputed
   - UI screenshots showing technology names
   - Network traffic showing connections
   - Console logs showing library usage
   - Source code files found

2. **Speculated** = Inferred from patterns, features, or descriptions
   - UI features that suggest functionality
   - Blog posts describing approaches
   - Inferences from confirmed technologies
   - Common industry patterns

3. **When in doubt, mark as speculated** - It's better to be accurate than confident

---

## How Evidence Was Collected

### Direct Evidence Methods:
- ✅ UI inspection (screenshots, feature lists)
- ✅ Network traffic analysis (DevTools Network tab)
- ✅ Console log inspection (browser console)
- ✅ Source code inspection (found in codebase)

### Indirect Evidence Methods:
- ⚠️ Feature inference (UI shows feature exists)
- ⚠️ Pattern matching (common industry patterns)
- ⚠️ Blog post descriptions (what they say they do)
- ⚠️ Logical inference (from confirmed technologies)

---

## Updates to This Document

As new evidence is discovered, this document should be updated:

- **New Confirmed**: Move from speculated to confirmed with evidence
- **New Speculated**: Add to speculated list with reasoning
- **Disproven**: Move from speculated to "Disproven" if evidence contradicts

Last Updated: Based on network traffic evidence showing Anchor Browser (December 2024)


