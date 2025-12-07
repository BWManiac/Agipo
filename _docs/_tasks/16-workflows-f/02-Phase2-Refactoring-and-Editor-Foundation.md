# Phase 2: Refactoring and Editor Foundation

**Status:** ⏳ Planning  
**Date Started:** December 2025  
**Date Completed:** TBD

---

## Goal

0. **Create UXD Mockups** (NEW - Do First):
   - Create high-fidelity mockups for all UI components
   - Mockups inform implementation decisions
   - Store in `app/(pages)/workflows-f/UXD/` folder

1. **Refactor Phase 1 files** to follow domain-driven design patterns:
   - Break out routes into separate files by concern (retrieve, update, delete)
   - Reorganize types into `types/` folder with domain-driven structure (clearer names)
   - Break out storage into `storage/` folder with logical grouping (CRUD, generated-code, utils)

2. **Create editor foundation** with store slice pattern:
   - Study and implement store architecture from workflows A-E
   - Create initial slices for workflow state management (informed by existing implementations)
   - Sync workflow.json with store state

3. **Enhance create workflow UX**:
   - Add name workflow modal/popup before creation

4. **Cleanup**:
   - Remove `.gitkeep` file

---

## Store Slice Analysis (Based on Workflows A-E)

**Common Pattern Across All Implementations:**
- **Workflows A, E**: 8 slices (workflow, steps, mappings, ui, inputs, connections, tables, testing)
- **Workflows D**: 9 slices (same as A/E + chatSlice)

**Why These Slices Make Sense:**

1. **workflowSlice** - Core identity (id, name, description, isDirty, isLoading)
   - ✅ **Makes sense**: Workflow metadata is distinct from step data
   - ✅ **Pattern**: All implementations have this

2. **stepsSlice** - Step management (add, update, delete, reorder)
   - ✅ **Makes sense**: Steps are the core building blocks, need their own slice
   - ✅ **Pattern**: All implementations have this

3. **mappingsSlice** - Data flow between steps (DataMapping[])
   - ✅ **Makes sense**: Mappings are complex enough to warrant separate slice
   - ✅ **Pattern**: All implementations have this

4. **inputsSlice** - Runtime inputs + workflow configs
   - ✅ **Makes sense**: User-provided values at runtime + persistent configs
   - ✅ **Pattern**: All implementations have this (sometimes called "configsSlice" separately)

5. **connectionsSlice** - Required Composio integrations
   - ✅ **Makes sense**: Connection requirements are distinct from workflow logic
   - ✅ **Pattern**: All implementations have this

6. **tablesSlice** - Table requirements and bindings
   - ✅ **Makes sense**: Table integration is a distinct domain concern
   - ✅ **Pattern**: All implementations have this

7. **testingSlice** - Test execution state
   - ✅ **Makes sense**: Test runs are separate from workflow editing
   - ✅ **Pattern**: All implementations have this

8. **uiSlice** - Right side UI state (panels, view mode, selection)
   - ✅ **Makes sense**: UI state is separate from workflow data
   - ✅ **Pattern**: All implementations have this

9. **chatSlice** - Left side chat (messages, loading) - **NEW for Workflows F**
   - ✅ **Makes sense**: Chat is a distinct UI concern, separate from right-side panels
   - ✅ **Pattern**: Workflows D has this, Workflows E has `aiPanelExpanded` in uiSlice
   - ✅ **Decision**: Split into separate slice for clearer separation (left vs right)

**Informed Opinion:**
The proposed slices align with existing implementations. The split of `uiSlice` into `chatSlice` (left) and `uiSlice` (right) follows the pattern from Workflows D and provides better separation of concerns. All other slices match the proven pattern from Workflows A, E.

**Note on Missing Slices (Phase 2):**
For Phase 2, we're implementing the **core editing slices** only:
- workflowSlice, stepsSlice, mappingsSlice, persistenceSlice, chatSlice, uiSlice

**Future phases will add:**
- inputsSlice (runtime inputs + configs) - Phase 3
- connectionsSlice (required integrations) - Phase 4
- tablesSlice (table requirements) - Phase 5
- testingSlice (test execution) - Phase 6

This incremental approach allows us to build the foundation first, then add features progressively.

---

## Planned File Impact Analysis

### Part 0: UXD Mockups (Do First)

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/UXD/editor-layout.html` | **Create** | High-fidelity mockup of editor page (3-panel layout: chat left, workflow center, settings right). Shows layout, component placement, and visual hierarchy. Enables alignment on editor structure before implementation. | ~200 | ⏳ Pending |
| `app/(pages)/workflows-f/UXD/create-workflow-modal.html` | **Create** | High-fidelity mockup of create workflow modal. Shows form fields (name, description), button placement, and modal styling. Enables alignment on create workflow UX before implementation. | ~100 | ⏳ Pending |
| `app/(pages)/workflows-f/UXD/workflow-list-page.html` | **Create** | High-fidelity mockup of workflow list page (already exists, but document it). Shows card layout, empty state, and interactions. Reference for maintaining consistency. | ~150 | ⏳ Pending |

**Part 0 Total:** ~450 lines (mockups)

**Note:** These mockups will inform implementation decisions in Parts A, B, and C.

---

### Part A: Refactoring Phase 1 Files

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| **Routes Refactoring** | | | | |
| `app/api/workflows-f/[workflowId]/route.ts` | **Delete** | Remove monolithic route | -132 | ⏳ Pending |
| `app/api/workflows-f/[workflowId]/retrieve/route.ts` | **Create** | Enables editor to load workflow when user opens it. Retrieves complete workflow definition from workflow.json so users can continue editing. Essential for "open workflow" user flow. | ~40 | ⏳ Pending |
| `app/api/workflows-f/[workflowId]/update/route.ts` | **Create** | Enables users to save workflow changes. Updates workflow.json with modified steps, mappings, configs. Powers "Save" button, ensuring user work is persisted. Validates structure before saving. | ~50 | ⏳ Pending |
| `app/api/workflows-f/[workflowId]/delete/route.ts` | **Create** | Enables users to delete workflows they no longer need. Removes workflow folder and all files. Powers "Delete" action in list page, allowing users to clean up their workflow library. | ~40 | ⏳ Pending |
| **Types Refactoring** | | | | |
| `app/api/workflows-f/services/types.ts` | **Delete** | Remove monolithic re-export | -3 | ⏳ Pending |
| `app/api/workflows-f/types/index.ts` | **Create** | Provides single import point for all workflow types. Simplifies imports across codebase, improves maintainability, makes refactoring easier. | ~10 | ⏳ Pending |
| `app/api/workflows-f/types/workflow.ts` | **Create** | Defines complete workflow structure (steps, mappings, configs) that users build in editor. Enables saving/loading workflows, generating executable code, validating data integrity. Includes WorkflowSummary for list views and factory functions. Uses Zod-first approach. | ~80 | ⏳ Pending |
| `app/api/workflows-f/types/workflow-step.ts` | **Create** | Defines individual workflow steps (Composio tools, custom code, control flow) that users add to workflows. Enables editor to manage steps (add, update, delete, reorder) and display step information. Each step represents one action users can configure. Uses Zod-first approach. | ~80 | ⏳ Pending |
| `app/api/workflows-f/types/step-connections.ts` | **Create** | Defines how data flows from one step's output to another step's input. Enables users to map fields between steps (e.g., "use step 1's 'title' as step 2's 'subject'"). Powers data mapping UI where users configure how steps connect and share data. Essential for multi-step workflows. Uses Zod-first approach. | ~40 | ⏳ Pending |
| `app/api/workflows-f/types/execution-flow.ts` | **Create** | Defines advanced workflow execution patterns (branching, parallel, loops). Enables users to create conditional workflows ("if X, do Y"), run steps in parallel for performance, and loop through data. Powers advanced workflow features beyond simple sequential execution. Essential for complex automation. Uses Zod-first approach. | ~50 | ⏳ Pending |
| `app/api/workflows-f/types/workflow-settings.ts` | **Create** | Defines user-configurable settings for workflows. RuntimeInputConfig enables users to provide values when running workflows (e.g., "job URL" input). WorkflowConfig enables persistent settings users set once (e.g., "resume template"). Powers settings panels where users configure workflow behavior. Uses Zod-first approach. | ~50 | ⏳ Pending |
| `app/api/workflows-f/types/table-requirements.ts` | **Create** | Defines how workflows integrate with structured data tables (Records feature). Enables users to specify that workflow needs to read from or write to a table (e.g., "store scraped job listings in a table"). Powers table integration UI where users connect workflows to data tables. Essential for workflows working with structured data. Uses Zod-first approach. | ~50 | ⏳ Pending |
| `app/api/workflows-f/types/schemas.ts` | **Create** | Defines JSON Schema format for step input/output definitions. Enables editor to display what data each step expects and produces (e.g., "this step needs a URL string and returns an object with title and content"). Powers step inspector UI where users see step requirements and outputs. Foundation for type checking and data mapping validation. Uses Zod-first approach. | ~30 | ⏳ Pending |
| **Storage Refactoring** | | | | |
| `app/api/workflows-f/services/storage.ts` | **Delete** | Remove monolithic storage | -165 | ⏳ Pending |
| `app/api/workflows-f/storage/index.ts` | **Create** | Provides single import point for all storage operations. Simplifies imports across routes and services, improves maintainability. | ~10 | ⏳ Pending |
| `app/api/workflows-f/storage/crud.ts` | **Create** | Core CRUD operations for workflow persistence. Enables reading workflows (for editor loading), writing workflows (for saving changes), listing workflows (for list page), creating workflows (for "New Workflow" button), deleting workflows (for cleanup), and checking existence. All operations validate data and handle errors. Powers all workflow persistence needs. | ~150 | ⏳ Pending |
| `app/api/workflows-f/storage/generated-code.ts` | **Create** | Stores and retrieves generated TypeScript code that executes workflows. When users save a workflow, system generates executable Mastra code and stores it in workflow.ts. Enables workflows to be executed by agents and other systems. Separate from workflow.json (editor state) because generated code is derived from definition. | ~30 | ⏳ Pending |
| `app/api/workflows-f/storage/utils.ts` | **Create** | Shared utility functions for storage operations. Ensures workflow directories exist before file operations, builds file paths, checks file existence. Used by all storage operations to maintain consistent file system structure. Prevents errors from missing directories. | ~40 | ⏳ Pending |
| **Services Update** | | | | |
| `app/api/workflows-f/services/index.ts` | **Modify** | Update exports for new structure | ~15 | ⏳ Pending |
| `app/api/workflows-f/create/route.ts` | **Modify** | Update imports for new storage structure | ~5 | ⏳ Pending |
| `app/api/workflows-f/list/route.ts` | **Modify** | Update imports for new storage structure | ~5 | ⏳ Pending |

**Part A Total:** ~600 lines (refactoring - less granular grouping)

### Part B: Editor Foundation

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| **Editor Page** | | | | |
| `app/(pages)/workflows-f/editor/page.tsx` | **Create** | Main entry point for workflow editor. Provides 3-panel layout (chat left, workflow center, settings right) where users build workflows. Loads workflow data, manages editor state, coordinates between panels. Uses ShadCN components for consistent styling. Placeholder structure allows incremental development. | ~50 | ⏳ Pending |
| **Store Structure** | | | | |
| `app/(pages)/workflows-f/editor/store/index.ts` | **Create** | Composes all store slices into single Zustand store. Provides useWorkflowStore() hook that components use to access workflow state and actions. Enables components to read workflow data (steps, mappings, configs) and trigger actions (add step, save workflow) without prop drilling. Foundation for editor state management. | ~30 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/types.ts` | **Create** | Defines TypeScript types for combined store and shared types used across slices. Ensures type safety when accessing store state and actions. Provides autocomplete and compile-time error checking for store operations. Central type definition for editor state. | ~40 | ⏳ Pending |
| **Store Slices** | | | | |
| `app/(pages)/workflows-f/editor/store/slices/workflowSlice.ts` | **Create** | Manages workflow identity and metadata (id, name, description). Enables editor header to display workflow name, track if workflow has unsaved changes (isDirty), handle loading/error states. Powers "Save" button state and workflow title display. Essential for workflow identity management. | ~60 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/stepsSlice.ts` | **Create** | Manages workflow steps that users add, configure, and arrange. Enables users to add steps (Composio tools, custom code), update step configuration, delete steps, reorder steps. Powers step timeline/list view and canvas view where users build their workflow. Core functionality for workflow editing. | ~100 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/mappingsSlice.ts` | **Create** | Manages how data flows between workflow steps. Enables users to configure field mappings (e.g., "map step 1's 'title' output to step 2's 'subject' input"). Powers data mapping UI where users connect step outputs to step inputs. Essential for building workflows that pass data between actions. | ~80 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/persistenceSlice.ts` | **Create** | Handles saving and loading workflows to/from workflow.json. Enables users to save their work (syncs store state to file) and load existing workflows (syncs file to store state). Powers "Save" button and workflow loading on editor open. Manages save state (isSaving, lastSaved) for user feedback. | ~80 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/chatSlice.ts` | **Create** | Manages left-side AI chat panel state (messages, loading state). Enables users to interact with AI assistant for help building workflows. Powers chat UI where users ask questions and get workflow-building guidance. Separate from right-side UI for clear separation of concerns. | ~50 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/store/slices/uiSlice.ts` | **Create** | Manages right-side UI state (panels, sidebar, view mode, selection). Enables users to switch between list/canvas views, open different panels (palette, inputs, config, connections, test), select steps for editing. Powers settings sidebar and view toggles. Uses ShadCN components for consistent styling. | ~60 | ⏳ Pending |
| **Hooks** | | | | |
| `app/(pages)/workflows-f/editor/hooks/useWorkflowStore.ts` | **Create** | Convenience hook for components to access workflow store. Provides easy access to all workflow state and actions without importing store directly. Simplifies component code and follows React hooks patterns. | ~20 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/hooks/usePersistence.ts` | **Create** | Convenience hook for save/load operations. Provides saveWorkflow(), loadWorkflow(), and save state (isSaving, lastSaved) to components. Simplifies persistence logic in components and follows React hooks patterns. | ~40 | ⏳ Pending |
| `app/(pages)/workflows-f/editor/hooks/useWorkflowLoader.ts` | **Create** | Handles loading workflow data when editor page mounts. Fetches workflow from API and syncs to store. Manages loading and error states for editor. Enables users to open existing workflows and see their data immediately. | ~50 | ⏳ Pending |

**Part B Total:** ~610 lines (includes chatSlice)

### Part C: Create Workflow UX Enhancement

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `app/(pages)/workflows-f/components/CreateWorkflowModal.tsx` | **Create** | Modal dialog for users to name their workflow before creation. Enables users to provide meaningful name and description when creating new workflows, avoiding "Untitled Workflow" defaults. Uses ShadCN Dialog component for consistent styling. Powers "New Workflow" button flow. | ~80 | ⏳ Pending |
| `app/(pages)/workflows-f/page.tsx` | **Modify** | Integrates CreateWorkflowModal into create workflow flow. Shows modal when user clicks "New Workflow", collects name/description, then creates workflow with provided values. Improves UX by prompting for workflow name upfront instead of defaulting to "Untitled Workflow". | ~20 | ⏳ Pending |

**Part C Total:** ~100 lines

### Part D: Cleanup

| File | Action | Purpose | Lines (Est.) | Status |
|------|--------|---------|--------------|--------|
| `_tables/workflows-f/.gitkeep` | **Delete** | No longer needed | -5 | ⏳ Pending |

**Part D Total:** -5 lines

---

## Total Phase 2

**Files Created:** ~35  
**Files Modified:** ~4  
**Files Deleted:** ~4  
**Total Lines:** ~1,405 lines

---

## Acceptance Criteria

- [ ] Routes separated by concern (GET, PATCH, DELETE in separate files)
- [ ] Types organized in domain-driven structure (`types/` folder)
- [ ] Storage operations separated into individual files (`storage/` folder)
- [ ] Store slice pattern implemented (following tools/editor pattern)
- [ ] Editor page placeholder created
- [ ] Workflow state synced with workflow.json
- [ ] Create workflow modal prompts for name before creation
- [ ] `.gitkeep` file removed

---

## Detailed File Review

### Part A: Refactoring Phase 1 Files

#### A1. Routes Refactoring

**1. `app/api/workflows-f/[workflowId]/retrieve/route.ts`**

**File Impact:**
- **Action:** Create (replaces old monolithic route)
- **Purpose:** Enables the editor to load a workflow when user opens it. Retrieves the complete workflow definition (steps, mappings, configs) from `workflow.json` so users can continue editing their workflows. Essential for the "open workflow" user flow.
- **Lines:** ~40

**Acceptance Criteria:**
- **AC-15.1** (indirect): Enables fetching workflow for editor
- **Architecture:** Separation of concerns - single responsibility

**Pseudocode:**
```
GET /api/workflows-f/[workflowId]/retrieve
├── Extract workflowId from route params
├── Call readWorkflow(workflowId)
│   ├── Read _tables/workflows-f/{id}/workflow.json
│   ├── Parse JSON
│   └── Validate with WorkflowDefinitionValidator
├── If workflow not found:
│   └── Return 404
└── Return 200 with full WorkflowDefinition
```

**Why:** Single responsibility principle. GET operations are read-only and should be separate from mutations. Named route (`retrieve`) makes intent explicit.

---

**2. `app/api/workflows-f/[workflowId]/update/route.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Enables users to save their workflow changes. Updates the `workflow.json` file with modified steps, mappings, configs, and metadata. Powers the "Save" button in the editor, ensuring user work is persisted. Validates workflow structure before saving to prevent corrupted data.
- **Lines:** ~50

**Acceptance Criteria:**
- **AC-15.1** (indirect): Enables saving workflow changes
- **Architecture:** Separation of concerns - update operations

**Pseudocode:**
```
PATCH /api/workflows-f/[workflowId]/update
├── Extract workflowId from route params
├── Call readWorkflow(workflowId) to get existing workflow.json
├── If not found: Return 404
├── Parse request body (partial updates)
├── Merge: { ...existing, ...body, id: workflowId }
│   └── Ensure ID cannot be changed
├── Validate merged result with WorkflowDefinitionValidator
├── Call writeWorkflow(validated)
│   ├── Update lastModified timestamp
│   └── Write to _tables/workflows-f/{id}/workflow.json (persists user changes)
├── Return 200 with saved workflow
└── Error handling:
    ├── If ZodError: Return 400 with validation issues
    └── If other error: Return 500
```

**Why:** Update operations have different concerns than read operations. Separate file makes intent clear.

---

**3. `app/api/workflows-f/[workflowId]/delete/route.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Enables users to delete workflows they no longer need. Removes the workflow folder and all associated files (`workflow.json`, `workflow.ts`). Powers the "Delete" action in the workflow list page, allowing users to clean up their workflow library.
- **Lines:** ~40

**Acceptance Criteria:**
- **AC-15.1** (indirect): Enables deleting workflows
- **Architecture:** Separation of concerns - delete operations

**Pseudocode:**
```
DELETE /api/workflows-f/[workflowId]/delete
├── Extract workflowId from route params
├── Call readWorkflow(workflowId) to verify exists
├── If not found: Return 404
├── Call deleteWorkflow(workflowId)
│   └── Recursively delete _tables/workflows-f/{id}/ directory
├── If deletion failed: Return 500
└── Return 200 with success message
```

**Why:** Delete operations are destructive and should be clearly separated. Makes it easier to add confirmation logic later.

---

#### A2. Types Refactoring

**4. `app/api/workflows-f/types/index.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Provides a single import point for all workflow types. Simplifies imports across the codebase (components, routes, services) by allowing `import { WorkflowDefinition } from '@/app/api/workflows-f/types'` instead of deep paths. Improves maintainability and makes refactoring easier.
- **Lines:** ~10

**Acceptance Criteria:**
- **Architecture:** Clean import paths for types

**Pseudocode:**
```
N/A (Barrel export file)
```

**Why:** Single entry point for all types. Components import from `@/app/api/workflows-f/types` instead of deep paths.

---

**5. `app/api/workflows-f/types/workflow-definition.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** WorkflowDefinition type + validator
- **Lines:** ~50

**Acceptance Criteria:**
- **Architecture:** Core workflow type definition

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- WorkflowDefinition interface
- WorkflowDefinitionValidator (Zod schema)
```

**Why:** Core type. Should be in its own file for clarity. Re-exports from base `workflows/services/types.ts` to maintain single source of truth.

---

**6. `app/api/workflows-f/types/workflow-step.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines individual workflow steps (Composio tools, custom code, control flow, table operations) that users add to their workflows. Enables the editor to manage steps (add, update, delete, reorder) and display step information (input/output schemas, tool details). Each step represents one action in the workflow that users can configure and connect. Uses Zod-first approach.
- **Lines:** ~80

**Acceptance Criteria:**
- **Architecture:** Summary type for list operations

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- WorkflowSummary interface
```

**Why:** Summary type is used by list operations. Separate file makes it clear this is a lightweight view of workflow data.

---

**Note:** WorkflowSummary is now included in `workflow.ts` (grouped with WorkflowDefinition and factories for logical cohesion).

**Acceptance Criteria:**
- **Architecture:** Step-related type definitions

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- WorkflowStep interface
- WorkflowStepType type
- WorkflowStepValidator (Zod schema)
```

**Why:** Steps are a core domain concept. Grouping step-related types together follows domain-driven design.

---

**7. `app/api/workflows-f/types/step-connections.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines how data flows from one step's output to another step's input. Enables users to map fields between steps (e.g., "use the 'title' from step 1 as the 'subject' for step 2"). Powers the data mapping UI where users configure how workflow steps connect and share data. Essential for building multi-step workflows that pass data between actions. Uses Zod-first approach.
- **Lines:** ~40

**Acceptance Criteria:**
- **Architecture:** Data mapping type definitions

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- DataMapping interface
- FieldMapping interface
- DataMappingValidator (Zod schema)
```

**Why:** "step-connections" clearly indicates this is about how data flows between steps. More descriptive than "data-mapping".

---

**8. `app/api/workflows-f/types/execution-flow.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines advanced workflow execution patterns (branching, parallel execution, loops). Enables users to create conditional workflows ("if X, do Y"), run steps in parallel for performance, and loop through data. Powers advanced workflow features that go beyond simple sequential execution. Essential for complex automation scenarios. Uses Zod-first approach.
- **Lines:** ~50

**Acceptance Criteria:**
- **Architecture:** Control flow type definitions

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- ControlFlowConfig interface
- BranchConfig interface
- ParallelConfig interface
- LoopConfig interface
```

**Why:** "execution-flow" clearly indicates this is about how steps execute (branching, parallel, loops). More descriptive than "control-flow".

---

**9. `app/api/workflows-f/types/workflow-settings.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines user-configurable settings for workflows. RuntimeInputConfig enables users to provide values when running workflows (e.g., "job URL" input). WorkflowConfig enables persistent settings that users set once (e.g., "resume template"). Powers the settings panels where users configure workflow behavior and inputs. Uses Zod-first approach.
- **Lines:** ~50

**Acceptance Criteria:**
- **Architecture:** Runtime configuration type definitions

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- RuntimeInputConfig interface
- WorkflowConfig interface
```

**Why:** "workflow-settings" clearly indicates this contains both user inputs (runtime) and workflow configs (persistent settings). More descriptive than "runtime-config".

---

**11. `app/api/workflows-f/types/table-requirements.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** TableRequirement + TableBinding types
- **Lines:** ~50

**Acceptance Criteria:**
- **Architecture:** Table requirement type definitions

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- TableRequirement interface
- TableBinding interface
- ColumnRequirement interface
```

**Why:** Table requirements are a distinct domain concept. Separate file groups related types.

---

**11. `app/api/workflows-f/types/schemas.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines JSON Schema format for step input/output definitions. Enables the editor to display what data each step expects and produces (e.g., "this step needs a URL string and returns an object with title and content"). Powers the step inspector UI where users see step requirements and outputs. Foundation for type checking and data mapping validation. Uses Zod-first approach.
- **Lines:** ~30

**Acceptance Criteria:**
- **Architecture:** JSON Schema type definition

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- JSONSchema interface
- JSONSchemaValidator (Zod schema)
```

**Why:** "schemas" is clearer than "json-schema" - it's about input/output schemas for steps and workflows. Shorter, more intuitive name.

---

**Note:** Factory functions are now included in `workflow.ts` (grouped with WorkflowDefinition for logical cohesion).

**Acceptance Criteria:**
- **Architecture:** Factory functions for creating workflow instances

**Pseudocode:**
```
createEmptyWorkflow(id: string, name: string): WorkflowDefinition
├── Create timestamp: new Date().toISOString()
├── Return WorkflowDefinition with:
│   ├── id, name, description: ""
│   ├── Empty inputSchema, outputSchema
│   ├── Empty steps, mappings, configs
│   ├── Default controlFlow: { type: "sequential", order: [] }
│   ├── Empty connections, tableRequirements, tables
│   ├── Timestamps (createdAt, lastModified)
│   └── published: false
└── Return workflow
```

**Why:** Factory functions are a distinct concern. Separate file groups creation logic.

---

#### A3. Storage Refactoring

**12. `app/api/workflows-f/storage/index.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Provides a single import point for all storage operations. Simplifies imports across routes and services by allowing `import { readWorkflow, writeWorkflow } from '@/app/api/workflows-f/storage'` instead of deep paths. Improves maintainability.
- **Lines:** ~10

**Acceptance Criteria:**
- **Architecture:** Clean import paths for storage

**Pseudocode:**
```
N/A (Barrel export file)
```

**Why:** Single entry point for all storage operations. Routes import from `@/app/api/workflows-f/storage`.

---

**13. `app/api/workflows-f/storage/utils.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Shared utility functions for storage operations. Ensures workflow directories exist before file operations, builds file paths, and checks file existence. Used by all storage operations to maintain consistent file system structure. Prevents errors from missing directories.
- **Lines:** ~20

**Acceptance Criteria:**
- **Architecture:** Shared storage utilities

**Pseudocode:**
```
ensureDir(): Promise<void>
├── Ensure _tables/workflows-f/ directory exists
└── Create if missing (recursive: true)

getWorkflowDir(id: string): string
├── Build path: _tables/workflows-f/{id}
└── Return path string
```

**Why:** Shared utilities used by all storage operations. Separate file avoids duplication.

---

**14. `app/api/workflows-f/storage/crud.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Core CRUD operations for workflow persistence. Enables reading workflows from `workflow.json` (for editor loading), writing workflows (for saving user changes), listing all workflows (for list page), creating new workflows (for "New Workflow" button), deleting workflows (for cleanup), and checking workflow existence. All operations validate data and handle errors gracefully. Powers all workflow persistence needs.
- **Lines:** ~150

**Acceptance Criteria:**
- **AC-15.1** (indirect): Enables all workflow persistence operations
- **Architecture:** Grouped CRUD operations for logical cohesion

**Pseudocode:**

**readWorkflow(id):**
```
readWorkflow(id: string): Promise<WorkflowDefinition | null>
├── Build path: _tables/workflows-f/{id}/workflow.json
├── Read file (UTF-8)
├── Parse JSON
├── Validate with WorkflowDefinitionValidator
└── Return validated WorkflowDefinition
    └── If file missing or invalid: Return null
```

**writeWorkflow(workflow):**
```
writeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>
├── Ensure _tables/workflows-f/ directory exists
├── Ensure _tables/workflows-f/{workflow.id}/ directory exists
├── Update workflow.lastModified = new Date().toISOString()
├── Write JSON.stringify(workflow, null, 2) to workflow.json
└── Return updated workflow
```

**listWorkflows():**
```
listWorkflows(): Promise<WorkflowSummary[]>
├── Ensure _tables/workflows-f/ directory exists
├── Read directory entries (withFileTypes: true)
├── Filter to directories (not files, not hidden)
├── For each directory:
│   ├── Call readWorkflow(directory.name)
│   └── Transform to WorkflowSummary
│       ├── id, name, description
│       ├── lastModified
│       ├── stepCount: workflow.steps.length
│       └── published
├── Filter out nulls (invalid workflows)
└── Return array of WorkflowSummary
```

**deleteWorkflow(id):**
```
deleteWorkflow(id: string): Promise<boolean>
├── Build path: _tables/workflows-f/{id}
├── Recursively delete directory (force: true)
└── Return true if successful, false on error
```

**createWorkflow(name?):**
```
createWorkflow(name?: string): Promise<WorkflowDefinition>
├── Ensure _tables/workflows-f/ directory exists
├── Generate unique ID: `wf-${nanoid(12)}`
├── Use name or "Untitled Workflow" as default
├── Call createEmptyWorkflow(id, name)
│   └── Returns WorkflowDefinition with:
│       ├── Empty steps, mappings, configs
│       ├── Default input/output schemas
│       └── Timestamps (createdAt, lastModified)
├── Call writeWorkflow(workflow)
└── Return saved workflow
```

**workflowExists(id):**
```
workflowExists(id: string): Promise<boolean>
├── Build path: _tables/workflows-f/{id}/workflow.json
├── Check if file exists (fs.access)
└── Return true if exists, false otherwise
```

**Why:** All CRUD operations share common patterns (directory management, validation, error handling). Grouping them in one file provides logical cohesion while keeping the file focused on core persistence operations.

---

**15. `app/api/workflows-f/storage/generated-code.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** writeGeneratedCode + readGeneratedCode functions (TypeScript code storage)
- **Lines:** ~30

**Acceptance Criteria:**
- **AC-13.2** (indirect): Enables storing generated workflow code
- **Architecture:** Single responsibility - code storage

**Pseudocode:**
```
writeGeneratedCode(id: string, code: string): Promise<void>
├── Ensure _tables/workflows-f/{id}/ directory exists
├── Build path: _tables/workflows-f/{id}/workflow.ts
└── Write code to file

readGeneratedCode(id: string): Promise<string | null>
├── Build path: _tables/workflows-f/{id}/workflow.ts
├── Read file (UTF-8)
└── Return code string
    └── If file missing: Return null
```

**Why:** "generated-code" clearly indicates this stores the TypeScript code generated from workflow.json. More descriptive than just "code".

---

### Part B: Editor Foundation

#### B1. Editor Page

**16. `app/(pages)/workflows-f/editor/page.tsx`**

**File Impact:**
- **Action:** Create
- **Purpose:** Main editor page (placeholder for now)
- **Lines:** ~50

**Acceptance Criteria:**
- **AC-15.1** (indirect): Entry point for workflow editor
- **Architecture:** Editor shell structure

**Pseudocode:**
```
WorkflowEditorPage()
├── Extract workflowId from search params
├── useWorkflowLoader(workflowId)
│   ├── Load workflow from API
│   └── Sync to store
├── usePersistence()
│   ├── Save workflow on changes
│   └── Handle save state
└── Render:
    ├── Editor header (name, save button)
    ├── Editor main area (placeholder)
    └── Editor sidebar (placeholder)
```

**Why:** Editor entry point. Placeholder structure allows incremental development.

---

#### B2. Store Structure

**17. `app/(pages)/workflows-f/editor/store/index.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Composes all store slices into a single Zustand store. Provides `useWorkflowStore()` hook that components use to access workflow state and actions. Enables components to read workflow data (steps, mappings, configs) and trigger actions (add step, save workflow) without prop drilling. Foundation for editor state management.
- **Lines:** ~30

**Acceptance Criteria:**
- **Architecture:** Central store composition following tools/editor pattern

**Pseudocode:**
```
N/A (Store composition file)
Composes:
- createWorkflowSlice
- createStepsSlice
- createMappingsSlice
- createPersistenceSlice
- createUiSlice
```

**Why:** Follows tools/editor pattern. Single hook (`useWorkflowStore`) exposes all state and actions.

---

**18. `app/(pages)/workflows-f/editor/store/types.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Defines TypeScript types for the combined store and shared types used across slices. Ensures type safety when accessing store state and actions. Provides autocomplete and compile-time error checking for store operations. Central type definition for editor state.
- **Lines:** ~40

**Acceptance Criteria:**
- **Architecture:** Type definitions for store

**Pseudocode:**
```
N/A (Type definition file)
Exports:
- WorkflowStore type (combination of all slices)
- Shared types used across slices
```

**Why:** Central type definition. Follows tools/editor pattern.

---

#### B3. Store Slices

**19. `app/(pages)/workflows-f/editor/store/slices/workflowSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Manages workflow identity and metadata (id, name, description). Enables the editor header to display workflow name, track if workflow has unsaved changes (isDirty), and handle loading/error states. Powers the "Save" button state and workflow title display. Essential for workflow identity management.
- **Lines:** ~60

**Acceptance Criteria:**
- **Architecture:** Workflow identity management

**Pseudocode:**
```
// 1. State Interface
interface WorkflowSliceState {
  id: string | null
  name: string
  description: string
}

// 2. Actions Interface
interface WorkflowSliceActions {
  setWorkflowId: (id: string | null) => void
  setWorkflowName: (name: string) => void
  setWorkflowDescription: (description: string) => void
  loadWorkflow: (workflow: WorkflowDefinition) => void
}

// 3. Initial State
const initialState: WorkflowSliceState = {
  id: null,
  name: "",
  description: ""
}

// 4. Slice Creator
createWorkflowSlice: StateCreator<WorkflowStore> = (set) => ({
  ...initialState,
  setWorkflowId: (id) => set({ id }),
  setWorkflowName: (name) => set({ name }),
  setWorkflowDescription: (description) => set({ description }),
  loadWorkflow: (workflow) => set({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description
  })
})
```

**Why:** Workflow identity is a distinct concern. Separate slice follows tools/editor pattern.

---

**20. `app/(pages)/workflows-f/editor/store/slices/stepsSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Manages the workflow steps that users add, configure, and arrange. Enables users to add steps (Composio tools, custom code), update step configuration, delete steps, and reorder steps. Powers the step timeline/list view and canvas view where users build their workflow. Core functionality for workflow editing.
- **Lines:** ~100

**Acceptance Criteria:**
- **AC-2.1, AC-2.2** (indirect): Enables managing workflow steps
- **Architecture:** Step management

**Pseudocode:**
```
// 1. State Interface
interface StepsSliceState {
  steps: WorkflowStep[]
  selectedStepId: string | null
}

// 2. Actions Interface
interface StepsSliceActions {
  addStep: (step: WorkflowStep) => void
  updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void
  deleteStep: (stepId: string) => void
  reorderSteps: (stepIds: string[]) => void
  setSelectedStepId: (stepId: string | null) => void
  loadSteps: (steps: WorkflowStep[]) => void
}

// 3. Initial State
const initialState: StepsSliceState = {
  steps: [],
  selectedStepId: null
}

// 4. Slice Creator
createStepsSlice: StateCreator<WorkflowStore> = (set, get) => ({
  ...initialState,
  addStep: (step) => set((state) => ({
    steps: [...state.steps, step]
  })),
  updateStep: (stepId, updates) => set((state) => ({
    steps: state.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
  })),
  deleteStep: (stepId) => set((state) => ({
    steps: state.steps.filter(s => s.id !== stepId)
  })),
  reorderSteps: (stepIds) => {
    const steps = get().steps
    const ordered = stepIds.map(id => steps.find(s => s.id === id)).filter(Boolean)
    set({ steps: ordered })
  },
  setSelectedStepId: (stepId) => set({ selectedStepId: stepId }),
  loadSteps: (steps) => set({ steps })
})
```

**Why:** Steps are a core domain concept. Separate slice follows tools/editor pattern.

---

**21. `app/(pages)/workflows-f/editor/store/slices/mappingsSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Manages how data flows between workflow steps. Enables users to configure field mappings (e.g., "map step 1's 'title' output to step 2's 'subject' input"). Powers the data mapping UI where users connect step outputs to step inputs. Essential for building workflows that pass data between actions.
- **Lines:** ~80

**Acceptance Criteria:**
- **AC-2.4** (indirect): Enables managing data mappings
- **Architecture:** Data mapping management

**Pseudocode:**
```
// 1. State Interface
interface MappingsSliceState {
  mappings: DataMapping[]
  activeMappingId: string | null
}

// 2. Actions Interface
interface MappingsSliceActions {
  addMapping: (mapping: DataMapping) => void
  updateMapping: (mappingId: string, updates: Partial<DataMapping>) => void
  deleteMapping: (mappingId: string) => void
  setActiveMappingId: (mappingId: string | null) => void
  loadMappings: (mappings: DataMapping[]) => void
}

// 3. Initial State
const initialState: MappingsSliceState = {
  mappings: [],
  activeMappingId: null
}

// 4. Slice Creator
createMappingsSlice: StateCreator<WorkflowStore> = (set) => ({
  ...initialState,
  addMapping: (mapping) => set((state) => ({
    mappings: [...state.mappings, mapping]
  })),
  updateMapping: (mappingId, updates) => set((state) => ({
    mappings: state.mappings.map(m => m.id === mappingId ? { ...m, ...updates } : m)
  })),
  deleteMapping: (mappingId) => set((state) => ({
    mappings: state.mappings.filter(m => m.id !== mappingId)
  })),
  setActiveMappingId: (mappingId) => set({ activeMappingId: mappingId }),
  loadMappings: (mappings) => set({ mappings })
})
```

**Why:** Data mappings are a distinct concern. Separate slice follows tools/editor pattern.

---

**22. `app/(pages)/workflows-f/editor/store/slices/persistenceSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Handles saving and loading workflows to/from `workflow.json`. Enables users to save their work (syncs store state to file) and load existing workflows (syncs file to store state). Powers the "Save" button and workflow loading on editor open. Manages save state (isSaving, lastSaved) for user feedback.
- **Lines:** ~80

**Acceptance Criteria:**
- **AC-13.1** (indirect): Enables saving workflow state
- **Architecture:** Persistence management

**Pseudocode:**
```
// 1. State Interface
interface PersistenceSliceState {
  isSaving: boolean
  isLoading: boolean
  lastSaved: string | null
}

// 2. Actions Interface
interface PersistenceSliceActions {
  saveWorkflow: () => Promise<void>
  loadWorkflow: (workflowId: string) => Promise<void>
  resetWorkflow: () => void
}

// 3. Initial State
const initialState: PersistenceSliceState = {
  isSaving: false,
  isLoading: false,
  lastSaved: null
}

// 4. Slice Creator
createPersistenceSlice: StateCreator<WorkflowStore> = (set, get) => ({
  ...initialState,
  saveWorkflow: async () => {
    set({ isSaving: true })
    const { id, name, description, steps, mappings } = get()
    
    const workflow: WorkflowDefinition = {
      id: id!,
      name,
      description,
      steps,
      mappings,
      // ... other fields from store
    }
    
    try {
      await fetch(`/api/workflows-f/${id}/update`, {
        method: "PATCH",
        body: JSON.stringify(workflow)
      })
      set({ lastSaved: new Date().toISOString() })
    } catch (error) {
      console.error("Failed to save workflow:", error)
    } finally {
      set({ isSaving: false })
    }
  },
  loadWorkflow: async (workflowId) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`/api/workflows-f/${workflowId}`)
      const workflow = await response.json()
      get().loadWorkflow(workflow)
      get().loadSteps(workflow.steps)
      get().loadMappings(workflow.mappings)
    } catch (error) {
      console.error("Failed to load workflow:", error)
    } finally {
      set({ isLoading: false })
    }
  },
  resetWorkflow: () => {
    get().loadWorkflow(createEmptyWorkflow("", ""))
    get().loadSteps([])
    get().loadMappings([])
  }
})
```

**Why:** Persistence is a distinct concern. Follows tools/editor pattern. Syncs store state with workflow.json.

---

**23. `app/(pages)/workflows-f/editor/store/slices/chatSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Manages the left-side AI chat panel state (messages, loading state). Enables users to interact with AI assistant for help building workflows. Powers the chat UI where users ask questions and get workflow-building guidance. Separate from right-side UI for clear separation of concerns.
- **Lines:** ~50

---

**24. `app/(pages)/workflows-f/editor/store/slices/uiSlice.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Manages right-side UI state (panels, sidebar, view mode, selection). Enables users to switch between list/canvas views, open different panels (palette, inputs, config, connections, test), and select steps for editing. Powers the settings sidebar and view toggles. Uses ShadCN components for consistent styling.
- **Lines:** ~60

**Acceptance Criteria:**
- **Architecture:** UI state management

**Pseudocode:**
```
// 1. State Interface
interface UiSliceState {
  viewMode: "list" | "canvas"
  activePanel: "palette" | "inputs" | "config" | "connections" | "test" | null
  sidebarExpanded: boolean
}

// 2. Actions Interface
interface UiSliceActions {
  setViewMode: (mode: "list" | "canvas") => void
  setActivePanel: (panel: string | null) => void
  setSidebarExpanded: (expanded: boolean) => void
}

// 3. Initial State
const initialState: UiSliceState = {
  viewMode: "list",
  activePanel: null,
  sidebarExpanded: true
}

// 4. Slice Creator
createUiSlice: StateCreator<WorkflowStore> = (set) => ({
  ...initialState,
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded })
})
```

**Why:** UI state is a distinct concern. Separate slice follows tools/editor pattern.

---

#### B4. Hooks

**25. `app/(pages)/workflows-f/editor/hooks/useWorkflowStore.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Convenience hook for components to access the workflow store. Provides easy access to all workflow state and actions without importing the store directly. Simplifies component code and follows React hooks patterns.
- **Lines:** ~20

**Acceptance Criteria:**
- **Architecture:** Convenience hook for store access

**Pseudocode:**
```
useWorkflowStore()
├── Call useWorkflowStore() from store/index
└── Return entire store (state + actions)
```

**Why:** Follows tools/editor pattern. Provides convenient access to store.

---

**26. `app/(pages)/workflows-f/editor/hooks/usePersistence.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Convenience hook for save/load operations. Provides `saveWorkflow()`, `loadWorkflow()`, and save state (isSaving, lastSaved) to components. Simplifies persistence logic in components and follows React hooks patterns.
- **Lines:** ~40

**Acceptance Criteria:**
- **Architecture:** Convenience hook for persistence

**Pseudocode:**
```
usePersistence()
├── Get persistence slice from store
│   ├── isSaving, isLoading, lastSaved
│   ├── saveWorkflow, loadWorkflow, resetWorkflow
└── Return persistence state + actions
```

**Why:** Follows tools/editor pattern. Provides convenient access to persistence operations.

---

**27. `app/(pages)/workflows-f/editor/hooks/useWorkflowLoader.ts`**

**File Impact:**
- **Action:** Create
- **Purpose:** Handles loading workflow data when editor page mounts. Fetches workflow from API and syncs to store. Manages loading and error states for the editor. Enables users to open existing workflows and see their data immediately.
- **Lines:** ~50

**Acceptance Criteria:**
- **Architecture:** Workflow loading logic

**Pseudocode:**
```
useWorkflowLoader(workflowId: string | null)
├── useEffect(() => {
│   ├── If workflowId:
│   │   ├── Call loadWorkflow(workflowId)
│   │   └── Set loading state
│   └── Else:
│       └── Call resetWorkflow()
├── Return { isLoading, error }
└── Cleanup on unmount
```

**Why:** Encapsulates workflow loading logic. Follows tools/editor pattern.

---

### Part C: Create Workflow UX Enhancement

**28. `app/(pages)/workflows-f/components/CreateWorkflowModal.tsx`**

**File Impact:**
- **Action:** Create
- **Purpose:** Modal dialog for users to name their workflow before creation. Enables users to provide a meaningful name and description when creating new workflows, avoiding "Untitled Workflow" defaults. Uses ShadCN Dialog component for consistent styling. Powers the "New Workflow" button flow.
- **Lines:** ~80

**Acceptance Criteria:**
- **Architecture:** Better UX for workflow creation

**Pseudocode:**
```
CreateWorkflowModal({ open, onClose, onCreate })
├── State: name, description
├── Handle submit:
│   ├── Validate name (required)
│   ├── Call onCreate({ name, description })
│   └── Close modal
└── Render:
    ├── Dialog/Modal component
    ├── Input for name (required)
    ├── Input for description (optional)
    └── Buttons: Cancel, Create
```

**Why:** Better UX. User names workflow before creation, avoiding "Untitled Workflow" default.

---

**29. `app/(pages)/workflows-f/page.tsx` (Modify)**

**File Impact:**
- **Action:** Modify
- **Purpose:** Integrates CreateWorkflowModal into the create workflow flow. Shows modal when user clicks "New Workflow", collects name/description, then creates workflow with provided values. Improves UX by prompting for workflow name upfront instead of defaulting to "Untitled Workflow".
- **Lines:** +20

**Acceptance Criteria:**
- **Architecture:** Enhanced create workflow flow

**Pseudocode:**
```
WorkflowsFPage()
├── State: showCreateModal = false
├── handleCreateClick():
│   └── Set showCreateModal = true
├── handleCreateSubmit({ name, description }):
│   ├── POST /api/workflows-f/create
│   │   └── Body: { name, description }
│   ├── Receive workflow response
│   ├── Set showCreateModal = false
│   └── Navigate to /workflows-f/editor?id={workflow.id}
└── Render:
    ├── CreateWorkflowModal
    │   ├── open={showCreateModal}
    │   ├── onClose={() => setShowCreateModal(false)}
    │   └── onCreate={handleCreateSubmit}
    └── ... existing list UI
```

**Why:** Integrates modal into create flow. User names workflow before creation.

---

### Part D: Cleanup

**36. `_tables/workflows-f/.gitkeep` (Delete)**

**File Impact:**
- **Action:** Delete
- **Purpose:** No longer needed (directory will have workflows)
- **Lines:** -5

**Acceptance Criteria:**
- **Architecture:** Cleanup

**Pseudocode:**
```
N/A (File deletion)
```

**Why:** Directory will have workflows, so .gitkeep is no longer needed.

---

## Execution Summary

**Files Created:** ~35  
**Files Modified:** ~4  
**Files Deleted:** ~4  
**Total Lines:** ~1,405 lines

**Key Decisions:**
1. **Domain-Driven Structure** - Types and storage organized by domain concept
2. **Separation of Concerns** - Routes split by HTTP method/operation
3. **Store Slice Pattern** - Following tools/editor pattern exactly
4. **Incremental Development** - Editor page is placeholder, can be enhanced incrementally

**Blockers:**
- None

**Next Steps:**
- Implement Part A (Refactoring) first
- Then Part B (Editor Foundation)
- Then Part C (UX Enhancement)
- Finally Part D (Cleanup)

---

## Metrics

### Lines of Code

| Phase | Target | Actual | Status |
|-------|--------|--------|--------|
| Phase 2: Refactoring & Editor | ~1,405 | TBD | ⏳ Pending |

---

**Last Updated:** December 2025

