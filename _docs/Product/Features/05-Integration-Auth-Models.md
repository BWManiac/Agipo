# Feature: Integration Auth Models (User vs. Agent Identity)

**Status:** Planning
**Date:** December 1, 2025
**Owner:** Engineering
**Context:** Defining the security model for *who* an Agent is acting as when it uses an Integration.

---

## 1. The Core Question: "Whose Account is it?"

When an Agent executes a tool like `gmail_send_email`, whose Gmail account is it using?
Is it acting as the **User** who is chatting with it? Or is it acting as **Itself** (a Service Account)?

This distinction defines the security model of our "Workforce OS."

---

## 2. Model A: User-Centric (The Personal Assistant)

**Concept:** The Agent is an extension of **You**.
When you ask the Agent to "Check my calendar," it looks at *your* calendar. If your colleague asks the *same* Agent the same question, it looks at *their* calendar.

### Architecture
*   **Entity Mapping:** `Composio Entity ID` = `Agipo User ID`.
*   **Credential Ownership:** The User owns the token.
*   **Permission Model:** Implicit. If I can log into Agipo, I can use my own Gmail.

### UX Flow
1.  User goes to **Settings > Integrations**.
2.  User clicks "Connect Gmail".
3.  Agipo creates an Entity for `user_123` and initiates OAuth.
4.  When User runs an Agent, we inject `entity_id="user_123"`.

### Pros & Cons
*   ✅ **Secure by Default:** Agents can't access data the user doesn't already have.
*   ✅ **Simple Mental Model:** "It's just doing what I would do."
*   ❌ **Low Autonomy:** The Agent cannot work when you are asleep if the token expires or requires MFA.
*   ❌ **No Shared Context:** If a team shares an Agent, they can't use it to manage a *shared* mailbox (e.g., `support@company.com`) unless everyone connects that specific account.

---

## 3. Model B: Agent-Centric (The Digital Employee)

**Concept:** The Agent is a **Service Account**.
The Agent has its own identity. It has been "hired" and given a company laptop (credentials). When you ask it to "Check the calendar," it checks *its* assigned calendar.

### Architecture
*   **Entity Mapping:** `Composio Entity ID` = `Agipo Agent ID`.
*   **Credential Ownership:** The Agent (System) owns the token.
*   **Permission Model:** Explicit Delegation. An Admin connects the account, and then grants specific Users permission to *talk* to that Agent.

### UX Flow
1.  Admin opens **Agent Modal > Capabilities**.
2.  Admin clicks "Connect Support Email".
3.  Agipo creates an Entity for `agent_support_bot` and initiates OAuth.
4.  Admin logs in with `support@agipo.com`.
5.  When *any authorized user* runs this Agent, we inject `entity_id="agent_support_bot"`.

### Pros & Cons
*   ✅ **True Autonomy:** The Agent works independently of any specific human user.
*   ✅ **Shared Resources:** Perfect for shared inboxes, Slack bots, or team calendars.
*   ❌ **Security Risk:** "Prompt Injection" could allow a malicious employee to exfiltrate data from the shared account via the Agent.
*   ❌ **Complexity:** Requires a robust permission system to control *who* can access the Agent.

---

## 4. Strategic Decision: The Hybrid Path

For the **MVP (Phase 1)**, we will implement **Model A (User-Centric)**.
*   **Why:** It is the safest starting point. It builds trust because users know the Agent is only accessing *their* data.
*   **Implementation:** The `ToolLoader` service will strictly use `request.user.id` to fetch capabilities.

For **Future Phases**, we will introduce **Model B**.
*   **Why:** It enables the "Workforce" vision. A "Sales Representative" agent needs its own CRM login, not the CEO's login.
*   **Implementation:** We will add a "Run As" toggle in the Agent Config:
    *   `run_as: "user"` (Default)
    *   `run_as: "agent"` (Uses Agent's own Entity ID)

### Summary Table

| Feature | User-Centric (Phase 1) | Agent-Centric (Phase 2) |
| :--- | :--- | :--- |
| **Identity** | "I am acting as YOU." | "I am acting as MYSELF." |
| **Setup Location** | User Profile > Integrations | Agent Modal > Capabilities |
| **Data Access** | Private to User | Shared with Team |
| **Best For** | Personal productivity | Team automation, Support, Sales |

