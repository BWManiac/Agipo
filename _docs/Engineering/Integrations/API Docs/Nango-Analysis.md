# Nango Platform Analysis

**Version:** 1.0
**Date:** December 1, 2025
**Scope:** Evaluation of Nango as an alternative Integration Kernel for Agipo.

---

## 1. Overview

Nango is a "Unified API and Integration Platform" primarily focused on **B2B SaaS Integrations**. It excels at standardizing data models (e.g., making HubSpot and Salesforce look the same) and handling high-volume data synchronization.

**Key Value Prop:** "Ship integrations 10x faster. Unified API for B2B SaaS."

---

## 2. Deep Dive: Pros (The "Why you might switch")

### 1. Unified Data Models
**Claim:** Nango normalizes data from different providers into a single schema.
**Evidence:** They offer "Unified APIs" for categories like CRM, HRIS, and ATS.
> "Read and write data to any CRM with a single API... Standardized objects for Contacts, Accounts, Opportunities."
> — *Source: [Nango Unified API Docs](https://docs.nango.dev/unified-api/overview)*

### 2. Data Sync Focus (ETL)
**Claim:** Superior handling of ongoing data synchronization.
**Evidence:** Built-in "Syncs" feature that handles incremental fetching, rate limits, and pagination automatically.
> "Nango Syncs automatically fetch data from external APIs and keep it in sync with your database."
> — *Source: [Nango Syncs](https://docs.nango.dev/syncs/overview)*

### 3. Self-Hostable (Security)
**Claim:** You can run Nango in your own infrastructure.
**Evidence:** Nango provides a Docker image for self-hosting. This is a massive advantage for enterprise security requirements, as tokens never leave your VPC.
> — *Source: [Nango Self-Hosting Guide](https://docs.nango.dev/deploy/self-hosting)*

### 4. Custom Integrations
**Claim:** Write your own integration logic in TypeScript.
**Evidence:** You can define custom scripts that run on Nango's infrastructure to transform data or handle unique API quirks.
> — *Source: [Nango Custom Integrations](https://docs.nango.dev/custom-integrations/overview)*

### 5. Granular Auth Control
**Claim:** Low-level control over OAuth tokens.
**Evidence:** Nango exposes the raw access tokens and refresh tokens if you need them, allowing you to make direct API calls yourself if preferred.
> — *Source: [Nango Proxy & Raw Tokens](https://docs.nango.dev/concepts/proxy)*

### 6. Pricing Model
**Claim:** Often flatter pricing for high volume.
**Evidence:** Their pricing tends to be based on "Connected Accounts" rather than "Actions Executed," which can be cheaper for high-frequency polling.

### 7. Community & Maturity
**Claim:** Strong open-source community.
**Evidence:** Nango has a vibrant Discord and active GitHub repository with frequent releases focusing on developer experience.

### 8. Monitoring Dashboard
**Claim:** Better visibility into sync jobs.
**Evidence:** The dashboard provides detailed logs of every sync run, success/failure rates, and data throughput.

### 9. Language Agnostic
**Claim:** Pure API-based approach.
**Evidence:** Since Nango acts as a proxy/sync engine, it works equally well with Python, Node, Go, or any backend language.

### 10. Mature Sync Engine
**Claim:** Handles retries and rate limits robustly.
**Evidence:** The sync engine has built-in backoff strategies for 429 (Rate Limit) errors.

---

## 3. Deep Dive: Cons (Why we didn't choose it)

### 1. Not Agent-Native
**Concern:** Lacks "Tool" definitions for LLMs.
**Evidence:** Nango does **not** export JSON Schemas formatted for OpenAI/Vercel AI SDK. We would have to write a translation layer to convert Nango's API definitions into the `tools` array for our Agents.
> *Impact:* Significant extra engineering work to make it compatible with `AgentChat` and `Workflow-as-Code`.

### 2. Trigger Complexity
**Concern:** Triggers are focused on "Data Changed" (Sync) rather than "Event Occurred".
**Evidence:** Nango's "Webhooks" are typically about notifying you that a *Sync Job* finished, or that data *inside* Nango changed. It is less optimized for passing through raw real-time events like "Gmail New Email" directly to an Agent trigger.

### 3. More Boilerplate for Actions
**Concern:** "Write" actions require more setup.
**Evidence:** While Nango has "Proxy" capabilities, it doesn't have a pre-built library of 10,000+ atomic "Actions" (like Composio). You often have to define the API call structure yourself using their proxy.

### 4. No "Entity" Abstraction for Agents
**Concern:** User mapping is manual.
**Evidence:** Nango maps to a `connectionId`, but the concept of an "Agent" utilizing that connection is foreign to Nango. We'd have to build the logic to say "Agent X allows Access to Connection Y".

### 5. SDK Size & Scope
**Concern:** Heavy client SDKs.
**Evidence:** The Nango SDKs are designed for full-stack data syncing, which might be overkill for a lightweight `run.js` script that just wants to send an email.

### 6. UI Components
**Concern:** Less "drop-in" UI.
**Evidence:** Nango focuses on the backend infrastructure. While they have some UI helpers, Composio's "Auth Component" is more "plug-and-play" for the specific "Connect Tool" use case.

### 7. Learning Curve
**Concern:** Steeper ramp-up.
**Evidence:** Understanding Nango's "Syncs," "Models," and "Scripts" concepts is more complex than Composio's "Action" concept.

### 8. Documentation Focus
**Concern:** Docs prioritize Sync.
**Evidence:** Most documentation assumes you want to ETL data from Salesforce to your DB. Finding guides on "One-off Action Execution" takes more digging.

### 9. Over-engineering
**Concern:** Too much power for our needs.
**Evidence:** We don't need to sync 10,000 CRM records. We just need an Agent to say "Create Lead". Nango is a Ferrari for Sync; we need a ATV for Actions.

### 10. Action Library Gap
**Concern:** Fewer pre-built "Write" operations.
**Evidence:** Composio's catalog lists specific write actions (e.g. `SLACK_POST_MESSAGE`). Nango often expects you to use the Proxy to hit the `POST /chat.postMessage` endpoint yourself.

---

## 4. Conclusion

Nango is a superior tool for **Data Synchronization** (e.g., "Build a dashboard showing all my Hubspot Contacts"). However, for **Agentic Workflows** (e.g., "Read this specific email and reply to it"), it lacks the native tooling and JSON Schema exports that Composio provides. Using Nango would require us to build our own "Tool Definition" layer on top of their Proxy.



