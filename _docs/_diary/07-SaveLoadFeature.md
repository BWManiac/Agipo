# Diary Entry 7: Implementing Local-First "Save & Load" for Workflows

## 1. Overview & Goal

This entry documents the architectural decisions and implementation details for the "Save & Load" feature in the workflow generator. The primary goal was to allow users to persist their work, close the editor, and resume later, without setting up a full database infrastructure like Supabase.

We achieved this by implementing a **local-first persistence strategy**, using the server's file system as a stand-in for a real database.

## 2. The "Dual-Purpose Save" Requirement

A critical requirement that shaped the architecture is the concept of a "dual-purpose save." The "Save" button in the editor needs to fulfill two distinct needs:

1.  **Save for Editing (Implemented):** This is like saving a project file (e.g., a `.psd` or `.docx`). It captures the *entire state of the editor*—including node positions, UI states, and the contents of all tabs (`Flow`, `Spec`, `Code`)—into a JSON file. This allows a user to reload the editor and find it in the exact state they left it. This is what we have just built.
2.  **Save for Execution (Future Work):** This is like compiling a program or exporting a PDF. It involves a "transpilation" step that converts the visual workflow into a self-contained, portable, and executable script (a "Tool Bundle"). This bundle is what an AI agent or another service can run independently of the editor UI.

This distinction is key: the JSON file we save now is the *source code* for the editor, which will later be used as the input for the transpilation process.

## 3. Architecture Deep Dive: A Full-Stack Feature

The feature touched every layer of our application's architecture. This was necessary to ensure a clean separation of concerns and to adhere to the existing patterns in the codebase.

### 3.1. The Backend: Repository Pattern & API Routes

To avoid security risks and keep concerns separate, the client-side code never interacts with the file system directly. We created a secure bridge using a classic three-tier backend structure.

**a) The Repository (`app/workflows/repository/FileSystemWorkflowRepository.ts`)**
This server-side class is the lowest level of our persistence logic. It is the *only* part of the application that knows how to read from and write to the file system. It contains methods like `getWorkflows()`, `getWorkflowById(id)`, and `saveWorkflow(id, data)`, effectively acting as our database model.

**b) The API Routes (`app/api/workflows/` and `app/api/workflows/[id]/`)**
These files define our RESTful API. They act as the public-facing interface for our backend. When the client wants to save a workflow, it sends a `fetch` request to these endpoints. The API route handlers then call the appropriate methods on the `FileSystemWorkflowRepository`.

We used two separate routes to follow the standard RESTful pattern:
*   `/api/workflows`: Represents the **collection** of workflows. Used for `GET` (list all) and `POST` (create new).
*   `/api/workflows/[id]`: Represents a **specific** workflow. Used for `GET` (fetch one) and `PUT` (update one).

This structure makes our API predictable, scalable, and easy to replace with a real database later without changing any client-side code.

### 3.2. The Frontend: State, Logic, and UI

The frontend implementation strictly follows the existing architecture: `State (Slice) -> Logic (Hook) -> UI (Page/Component)`.

**a) State Slices (`canvasSlice.ts`, `executionSlice.ts`)**
This is the single source of truth. We added the necessary state here:
*   In `canvasSlice`: `currentWorkflowId` and `workflowName` to track what is being edited, and `loadCompleteWorkflow(data)` to hydrate the store with a saved file.
*   In `executionSlice`: `saveCurrentWorkflow()` to orchestrate the save operation and `isSaving` to track the loading state for the UI.

**b) Logic Hooks (`useCanvasState.ts`, `useExecution.ts`)**
These hooks act as the bridge, exposing the new state and actions from the slices to the UI layer. They ensure the page component itself remains simple and declarative.

**c) UI Layer (`page.tsx`, `ControlPanel.tsx`)**
The UI was modified to consume the new logic. The `page.tsx` now uses the `useSearchParams` hook to get the workflow ID from the URL and calls the load function. It then passes the save function and workflow name down as props to the `ControlPanel`, which contains the actual "Save" button and input field.

## 4. The User Flow in Code

1.  **Load Page:** A user navigates to `/workflows`. The `WorkflowsPage` component fetches data from `/api/workflows` and renders a list of `<WorkflowCard>` components.
2.  **Open Editor:** The user clicks a card, navigating to `app/(pages)/workflow-generator?id=my-workflow`.
3.  **Fetch Data:** The `page.tsx` component sees the `id` in the URL, triggers a `fetch` to `/api/workflows/my-workflow`, and receives the saved JSON data.
4.  **Hydrate Store:** The `loadCompleteWorkflow` action is called, which replaces the nodes, edges, and name in the `canvasSlice` with the loaded data. The UI re-renders, displaying the saved state.
5.  **Save Action:** The user changes the name in the `ControlPanel`'s input field, which calls `setWorkflowName`. They then click "Save."
6.  **Trigger Save:** The `onSave` prop calls the `saveCurrentWorkflow` action in the `executionSlice`.
7.  **API Call:** This action determines if it's a new or existing workflow and makes a `POST` or `PUT` request to the appropriate API route with the current nodes, edges, and name.
8.  **Persist Data:** The API route calls the `saveWorkflow` method on the `FileSystemWorkflowRepository`, which validates the data and writes it to a JSON file in the `_workflows` directory.

## 5. Next Steps & Planned Refinements

While the feature is functionally complete, the implementation process revealed areas for improvement:

*   **Refactor State Slices:** The line between `canvasSlice` and `executionSlice` has blurred. We should refactor to clarify their responsibilities. For instance, all save/load/reset logic should likely be consolidated into a single slice for better cohesion.
*   **Add Comments:** The new actions in the slices lack detailed comments explaining their purpose and side effects. This needs to be rectified for long-term maintainability.
*   **Fix Build Error:** A final, minor build error related to TypeScript types in the `chat-panel` hooks needs to be resolved.

This documentation provides a clear record of our progress and sets the stage for a targeted refactoring effort to improve the code's quality and readability.
