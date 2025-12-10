Asteroid.ai Competitive Analysis
=================================

## Overview

Asteroid.ai is a browser automation and AI agent platform that enables users to build and deploy AI-powered browser agents for automating complex, multi-step web-based tasks. They focus on enterprise use cases, particularly in healthcare and insurance.

## Key Resources

- **Website**: https://asteroid.ai
- **Blog**: https://asteroid.ai/blog
- **Docs**: https://docs.asteroid.ai

## Document Index

1. **[Technology Stack](./01-Technology-Stack.md)** - Core underlying technologies identified
2. **[Browser Automation Architecture](./02-Browser-Automation-Architecture.md)** - DOM-based vs vision-based approaches
3. **[Credential Management](./03-Credential-Management.md)** - Vault, credentials, cookies, TOTP, security
4. **[Session Recording & Replay](./04-Session-Recording-Replay.md)** - Live viewing, rrweb, real-time streaming
5. **[Stealth & Anti-Detection](./05-Stealth-Anti-Detection.md)** - Proxy, fingerprinting, CAPTCHA solving
6. **[Product Features & UI](./06-Product-Features-UI.md)** - What we learned from their interface
7. **[Key Inferences & Learnings](./07-Key-Inferences.md)** - Summary conclusions and takeaways
8. **[UI Evidence: Playwright & rrweb](./08-UI-Evidence-Playwright-rrweb.md)** - Direct UI evidence confirming technologies
9. **[Headless Browser Technology](./09-Headless-Browser-Technology.md)** - Chromium, Firefox, WebKit - what they likely use

## Executive Summary

Asteroid.ai uses a **hybrid DOM + vision approach** for browser automation, built on top of standard browser automation engines (Playwright/Puppeteer/Selenium/CDP). Their key innovations are:

1. **Orchestration Layer**: Graph-based workflow engine with AI reasoning
2. **Hybrid Automation**: DOM-first with vision fallback
3. **Session Recording**: rrweb for live viewing and replay
4. **Credential Management**: Secure vault with encryption at rest/transit
5. **Enterprise Features**: Proxy management, CAPTCHA solving, stealth capabilities

They are **NOT** building bespoke browser automation - they're building intelligent orchestration on top of proven engines.

