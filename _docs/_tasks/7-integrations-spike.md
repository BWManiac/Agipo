# Task 7: Composio Integrations Spike (Backend Discovery)

**Status:** Complete
**Date:** December 2, 2025
**Goal:** Establish a "Source of Truth" for the Composio Node.js SDK integration.

---

## 1. Canonical Implementation Guide

This document serves as the definitive reference for integrating `@composio/core` into our codebase. It supersedes all previous notes.

### 1.1. Installation & Setup

**Package:**
We use the official Node.js SDK.
```bash
npm install @composio/core
```

**Initialization:**
Always initialize the client with your API key.
```typescript
import { Composio } from "@composio/core";

const client = new Composio({ 
    apiKey: process.env.COMPOSIO_API_KEY 
});
```

### 1.2. Connection Flow (The "Golden Path")

The `initiate` method requires **positional arguments**, NOT an object. This was the source of previous confusion (ZodErrors).

**Incorrect:**
```typescript
// ❌ DO NOT DO THIS
await client.connectedAccounts.initiate({
    entityId: "user-1",
    authConfigId: "gmail" 
});
```

**Correct:**
```typescript
// ✅ DO THIS
const connection = await client.connectedAccounts.initiate(
    "user-1",      // userId (entityId)
    "gmail",       // authConfigId (integration slug)
    {
        redirectUri: "http://localhost:3000/callback" // Optional config
    }
);
```

### 1.3. API Surface Reference

| Feature | Method | Notes |
| :--- | :--- | :--- |
| **List Integrations** | `client.toolkits.get()` | Returns array of available apps. |
| **Start Auth** | `client.connectedAccounts.initiate(u, a, opts)` | Returns `{ redirectUrl, connectionStatus }`. |
| **Check Status** | `client.connectedAccounts.list({ userIds: [...] })` | Use to poll for completion. |
| **Execute Tool** | `client.tools.execute(...)` | (Future) For running actions. |

---

## 2. Common Pitfalls & Errors

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `Module not found` | Wrong package import. | Use `@composio/core`, NOT `composio-core`. |
| `ZodError: authConfigIds.0 - Required` | Passing object to `initiate` instead of args. | Change to `initiate(userId, authConfigId)`. |
| `401 Invalid API key` | Typo or truncation. | Verify key matches Dashboard exactly. |

---

## 3. Validated Usage Script

See `_docs/_tasks/7-composio-spike.ts` for the executable proof-of-concept. This script has been successfully run and verified.

