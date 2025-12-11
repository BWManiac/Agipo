# Diary Entry 23: Workflows F - Context and Guidelines

**Date:** December 2025  
**Task:** 15.11-workflows-f-greenfield-plan.md  
**Status:** 🚧 In Progress  
**Approach:** Build from scratch, learn from A-E

---

## 0. Working Style Guidelines

**Important:** These guidelines ensure we build thoughtfully and maintain quality.

### For Each File We Create/Modify:

1. **Plan First, Implement Second**
   - **BEFORE implementing any code**, provide a complete file impact analysis in the format below
   - This analysis must be presented in chat for review and approval
   - Only after approval should implementation begin

2. **Required File Impact Analysis Format**

   For each file, provide:
   
   **File Impact:**
   - **Action:** Create / Modify / Delete
   - **Purpose:** **Product-focused description** - What problem it solves, what features it enables, what value it provides to users (not just technical description)
   - **Lines:** Estimated or actual line count
   
   **Purpose Description Guidelines:**
   - ❌ Bad: "WorkflowDefinition + validator"
   - ✅ Good: "Defines the complete workflow structure (steps, mappings, configs) that users build in the editor. Enables saving/loading workflows, generating executable code, and validating workflow data integrity."
   - ❌ Bad: "WorkflowSummary type"
   - ✅ Good: "Lightweight workflow metadata for list views. Enables the workflow list page to display workflow cards (name, description, step count) without loading full workflow definitions, improving performance and user experience."
   
   **Categorized File Impact Tables:**
   
   When documenting file impact in phase documents, organize files by category for clarity:
   
   ```markdown
   ### Overall File Impact
   
   #### Types
   | File | Action | Purpose | Part |
   |------|--------|---------|------|
   | `app/api/.../types/example.ts` | Create | Product-focused description | A |
   
   #### Backend / API
   | File | Action | Purpose | Part |
   |------|--------|---------|------|
   | `app/api/.../route.ts` | Create | Product-focused description | A |
   
   #### Backend / Services
   | File | Action | Purpose | Part |
   |------|--------|---------|------|
   | `app/api/.../services/example.ts` | Create | Product-focused description | A |
   
   #### Frontend / State
   | File | Action | Purpose | Part |
   |------|--------|---------|------|
   | `app/(pages)/.../store/slices/exampleSlice.ts` | Create | Product-focused description | A |
   
   #### Frontend / Components
   | File | Action | Purpose | Part |
   |------|--------|---------|------|
   | `app/(pages)/.../components/Example.tsx` | Create | Product-focused description | B |
   ```
   
   Common categories include:
   - **Types** - Shared type definitions
   - **Backend / API** - Route handlers
   - **Backend / Services** - Business logic and utilities
   - **Backend / Storage** - Data persistence
   - **Frontend / State** - Zustand slices and stores
   - **Frontend / Components** - React components (can be further sub-categorized)
   - **Config** - Configuration files
   - **Scripts** - Build or utility scripts
   
   Remove empty sections. Add categories as needed for the specific phase.
   
   **Acceptance Criteria:**
   - Which acceptance criteria (AC-X.X) it addresses
   - Which product requirements (PR-X) it supports
   - Why this file is necessary for the feature
   
   **Pseudocode:**
   - For routes (`app/api/**/route.ts`): Document the algorithm/flow in pseudocode format
   - For services (`app/api/**/services/*.ts`): Document complex functions with pseudocode
   - Similar to the Clippy.md example (lines 45-52)
   - Use tree structure format:
     ```
     functionName(input: Type): ReturnType
     ├── Step 1: Description
     ├── Step 2: Description
     │   ├── Sub-step 2a
     │   └── Sub-step 2b
     └── Return result
     ```
   
   **Why:**
   - Rationale for this approach
   - Why this file is necessary
   - Any design decisions

3. **Product Requirements Mapping**
   - For each file, explicitly state:
     - Which acceptance criteria it satisfies
     - Which product requirements it supports
     - Why this file is necessary for the feature

4. **Zod-First Type Definitions**
   - Define types with Zod schemas first
   - Use `z.infer<typeof schemaName>` to derive TypeScript types
   - Pattern:
     ```typescript
     export const WorkflowDefinitionSchema = z.object({
       id: z.string(),
       name: z.string(),
       // ... more fields
     });
     
     export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
     ```
   - This ensures runtime validation and type safety from a single source of truth

5. **UXD Mockups Before Implementation**
   - Create high-fidelity mockups for UI components before coding
   - Mockups inform implementation decisions
   - Store mockups in `app/(pages)/workflows-f/UXD/` folder
   - Mockups should show: layout, components, interactions, states (loading, error, empty)

6. **ShadCN Design System**
   - Use ShadCN components throughout (Button, Card, Dialog, etc.)
   - Minimal custom styling (polish later)
   - Consistent with existing patterns in the codebase
   - Follow ShadCN component patterns for consistency

7. **Slow and Methodical**
   - One file at a time (or small related group)
   - Plan → Review → Implement → Verify
   - Don't rush ahead

**Note:** Phase 1 was implemented too quickly without proper planning. Going forward, we'll follow these guidelines for each file.

---

## 1. Context

After 5 implementation attempts (Workflows A through E), we've learned:
- **What works:** Code generator patterns, execution service architecture, component organization
- **What doesn't:** Inconsistent type systems, copy-paste duplication, incomplete implementations
- **What we need:** Clean architecture from day one, single source of truth, incremental implementation

**Decision:** Build **Workflows F** from scratch, using A-E as inspiration (not copying).

**Goal:** Create a production-ready workflow editor that:
- Generates Mastra-native workflow code
- Supports visual editing (list + canvas views)
- Includes all features from A-E (best versions)
- Has unique features (abstraction levels, command palette, undo/redo)
- Meets all 81 acceptance criteria

---

## 2. References

- **Planning Doc:** `15.11-workflows-f-greenfield-plan.md`
- **Product Spec:** `15-workflow-editor.md`
- **Research:** `15.1-workflow-research.md`, `15.2-workflow-research.md`
- **Analysis:** `15.9-workflow-implementation-deep-analysis.md`
- **Line Counts:** `15.10-workflow-line-counts.md`

---

## 3. Study Guide (What to Study, Not Copy)

### From Workflows A
- **Code Generator** - `app/api/workflows/services/generator.ts`
  - Study: How it handles step types, mappings, placeholders
  - Write F's version with improvements
  
- **Execution Service** - `app/api/workflows/services/execution.ts`
  - Study: Runtime interpretation, step-by-step tracking
  - Write F's version with improvements

- **Component Structure** - `app/(pages)/workflows/editor/components/`
  - Study: Organization (canvas/, list/, inspector/, panels/)
  - Write F's version with clearer structure

### From Workflows C
- **Command Palette** - `app/(pages)/workflows-c/editor/components/CommandPalette.tsx`
  - Study: UI/UX pattern, command structure
  - Write F's version with better integration

### From Workflows D
- **Undo/Redo** - `app/(pages)/workflows-d/editor/hooks/useUndoRedo.ts`
  - Study: History management, state tracking
  - Write F's version integrated with store

### From Workflows E
- **Store Architecture** - `app/(pages)/workflows-e/editor/store/slices/`
  - Study: Slice organization, action patterns
  - Write F's version with improvements

---

## 4. Principles We're Following

1. **Single Source of Truth** - One type system, one storage service
2. **Incremental Implementation** - Phase by phase, ship after each
3. **Best Practices from Day One** - Error boundaries, loading states, type safety
4. **Learn, Don't Copy** - Study existing code, write F's version
5. **Document as We Go** - This diary tracks everything

---

## 5. Open Questions

*Questions will be added as they arise during implementation.*

---

**Last Updated:** December 2025

