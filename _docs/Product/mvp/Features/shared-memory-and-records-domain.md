# Feature: Shared Memory & Records Domain

**Status:** Planning
**Date:** November 30, 2025

---

## 1. The Philosophy: "Records are the Interface"

As Agipo matures from a prototype into an operating system for work, we are elevating **Records** to be a first-class citizen, equal in stature to **Agents** and **Tools**.

We are moving away from "Agents as Chatbots" and toward "Agents as Analysts." To achieve this, agents need **Long-term, Shared Memory**.

### 5 First Principles

1.  **Records are the Interface:** The primary interface between a human and an agent is not just the chat window; it is the records they both observe. A table acts as a shared whiteboard where intent is made visible.
2.  **Inspectability = Trust:** Users will only trust an agent to perform high-stakes actions (like posting to LinkedIn) if they can see the planned records in a structured, inspectable format *before* execution.
3.  **Determinism via Structure:** Tools cannot operate on guesswork. They require contracts. A **Schema** is a contract that guarantees a "Scheduler" tool produces exactly what a "Poster" tool consumes.
4.  **Agents are Analysts:** Agents do not just move data; they understand it. By giving agents query capabilities (SQL/Polars), we empower them to answer higher-order questions ("Which posts performed best on Tuesdays?") rather than just executing linear tasks.
5.  **Files are the Source of Truth:** We maintain our GitOps philosophy. User records live in transparent, portable files (JSON/Parquet), not hidden in opaque cloud databases. The UI is merely a lens on these files.

---

## 2. Feature Overview: The "Records" Tab

We are introducing a new top-level domain: **Records** (`app/(pages)/records`). This will be a "Google Sheets-like" experience that allows users to view, edit, and manage the tables that their agents use.

### Key Components
1.  **The Catalog:** A central registry of all defined tables (e.g., "LinkedIn Posts", "Leads", "Calendar").
2.  **The Grid:** A high-performance, editable data grid for interacting with table content.
3.  **The Schema:** A rigid definition (Zod) that enforces the shape of every row.

---

## 3. Acceptance Criteria (The "Sheets" Experience)

These criteria define the Minimum Viable Product (MVP) for the Records domain.

1.  **Catalog View:** Visiting the `/records` route displays a card-based list of all available tables, showing metadata like "Name", "Description", and "Row Count".
2.  **Schema-Driven Grid:** Clicking on a table opens a detailed grid view where the columns strictly match the defined `schema.json`. (e.g., A "Date" column renders a date picker; a "Select" column renders a dropdown).
3.  **Direct Manipulation (CRUD):** Users can add a new row manually, type data into cells, and have that data persist to the backend JSON file immediately upon blur or "Enter".
4.  **Type Safety & Validation:** If a user attempts to enter invalid data (e.g., text into a numeric column), the interface visualizes the error (red cell) and prevents the save, ensuring the data file remains pristine.
5.  **Sorting & Filtering:** Users can click column headers to Sort (ASC/DESC) or Filter (e.g., "Contains 'Launch'"). These operations are executed on the backend (via Polars) to support scaling.
6.  **Agent Attribution:** The system tracks *who* touched a row. A reserved, read-only "Modified By" column automatically updates to show "User" or "Agent [Name]" whenever a row changes.
7.  **Live Reactivity:** If an agent running in the background adds a row to a table (via the runtime API), the user's grid view updates automatically without requiring a full page reload.

---

## 4. Technical Implementation Plan

We will implement this using **Path A: The Lightweight & Custom Approach**.

### Technology Stack
*   **Backend Service:** `nodejs-polars`
    *   *Role:* The heavy lifting. Handles reading/writing JSON files, executing SQL-like queries, and ensuring performant I/O.
*   **Frontend Grid:** **TanStack Table (React Table)** + **ShadCN UI**
    *   *Role:* The presentation layer. TanStack provides the "headless" logic (sorting, filtering, state), while we build the UI using our existing ShadCN design system to maintain visual consistency (rather than dropping in an alien-looking spreadsheet library).
*   **Schema Engine:** **Zod**
    *   *Role:* The "Contract." Shared types that validate data both in the browser (before send) and in the Node runtime (before write).

### Roadmap

#### Phase 1: The Foundation (Backend)
*   [ ] Install `nodejs-polars` and `zod`.
*   [ ] Create `_tables/schemas/` directory and define the first schema (`posts.json`).
*   [ ] Implement `RecordsService` in `app/api/records/services/records.ts` to wrap Polars interactions.

#### Phase 2: The Interface (Frontend)
*   [ ] Scaffold `app/(pages)/records/page.tsx`.
*   [ ] Implement the `RecordsTable` component using TanStack Table.
*   [ ] Connect the table to the `RecordsService` via Next.js Server Actions or API routes.

#### Phase 3: The Integration (Workforce)
*   [ ] Inject Table Schemas into Agent System Prompts.
*   [ ] Create `TableNode` for the Workflow Editor.
*   [ ] Implement `sys_table_*` tools for the runtime.

---

## 5. Future Considerations
*   **SQL Interface:** Exposing a raw SQL console for power users/agents to run complex queries.
*   **Parquet Support:** migrating from `.json` to `.parquet` when tables exceed ~50k rows for performance.
*   **Joins:** Allowing agents to query across multiple tables (e.g., "Join `Leads` with `Emails`").

