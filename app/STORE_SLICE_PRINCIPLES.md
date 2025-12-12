# Store Slice Principles

> **Core Philosophy:** State lives in Zustand store slices, not in component hooks. Components are presentational—they read from stores and trigger actions. This pattern provides predictable data flow, clear separation of concerns, and maintainable code structure.

---

## 1. Why Store Slices?

**Principle:** Centralized state management through composable slices provides better predictability, testability, and maintainability than scattered component state or custom hooks.

**Problems This Solves:**
- **Prop Drilling:** State can be accessed from any component without passing props
- **State Synchronization:** Multiple components can react to the same state changes
- **Testability:** Store actions can be tested independently of components
- **Debugging:** Single source of truth makes state inspection straightforward
- **Code Organization:** Business logic lives in stores, not components

**When to Use Store Slices:**
- State is shared across multiple components
- State requires complex business logic
- State needs to persist or be synchronized
- State changes trigger side effects (API calls, file operations)

**When NOT to Use Store Slices:**
- Truly local UI state (modal open/close, input focus)
- Third-party library state (form libraries, chart libraries)
- Temporary component-only state that doesn't need to persist

---

## 2. The Slice Pattern Structure

**Principle:** Every slice follows the same 4-part structure. This consistency makes slices predictable and easy to understand.

### Structure Overview

Every slice consists of:

1. **File-level Documentation** - What the slice manages
2. **State Interface** - What data we store (with comments)
3. **Actions Interface** - What operations we can perform (with comments)
4. **Combined Slice Type** - Type composition
5. **Initial State** - Starting values (with comments explaining defaults)
6. **Slice Creator** - The implementation

### File-Level Documentation

Every slice file should start with a JSDoc comment explaining what the slice manages:

```typescript
/**
 * Catalog Slice
 * 
 * Manages document list state and catalog operations.
 * Handles fetching, creating, and deleting documents.
 */
```

**Guidelines:**
- Use JSDoc format (`/** */`)
- First line: Slice name
- Second line: Blank
- Remaining lines: Brief description of what the slice manages and its key responsibilities

### 1. State Interface

```typescript
// 1. State Interface
export interface CatalogSliceState {
  /** List of all documents */
  documents: DocumentListItem[];
  
  /** Loading state for catalog operations */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
}
```

**Guidelines:**
- Use numbered section comment: `// 1. State Interface`
- Comment every state property with JSDoc (`/** */`)
- Comments should explain what the property represents, not just restate the name
- Use descriptive names
- Prefer Maps/Sets for keyed collections
- Keep state minimal—don't store derived data

**Comment Examples:**
- ✅ `/** List of all documents */` - Clear what it contains
- ✅ `/** Loading state for catalog operations */` - Explains when it's used
- ✅ `/** Error state */` - Simple but clear
- ❌ `/** documents */` - Just restates the name
- ❌ `/** The documents */` - Too vague

### 2. Actions Interface

```typescript
// 2. Actions Interface
export interface CatalogSliceActions {
  /** Fetch all documents from the API */
  fetchDocuments: () => Promise<void>;
  
  /** Create a new document */
  createDocument: (title?: string) => Promise<string | null>;

  /** Delete a document by ID */
  deleteDocument: (docId: string) => Promise<boolean>;
}
```

**Guidelines:**
- Use numbered section comment: `// 2. Actions Interface`
- Comment every action with JSDoc (`/** */`)
- Comments should explain what the action does, not just restate the name
- Use verb-noun naming: `addNode`, `deleteNode`, `updateNodeData`
- Make async actions return `Promise<void>` or appropriate return type
- Keep actions focused—one action, one responsibility
- Use `set` prefix for simple state setters: `setSelectedNodeId`

**Comment Examples:**
- ✅ `/** Fetch all documents from the API */` - Explains what it does and where data comes from
- ✅ `/** Create a new document */` - Clear action description
- ✅ `/** Delete a document by ID */` - Explains what parameter is used
- ❌ `/** fetchDocuments */` - Just restates the name
- ❌ `/** Gets documents */` - Too vague

### 3. Combined Slice Type

```typescript
// 3. Combined Slice Type
export type CatalogSlice = CatalogSliceState & CatalogSliceActions;
```

**Guidelines:**
- Use numbered section comment: `// 3. Combined Slice Type`
- Combine state and actions into a single type
- Export this type for use in store composition

### 4. Initial State

```typescript
// 4. Initial State
const initialState: CatalogSliceState = {
  // Empty array - no documents loaded yet
  documents: [],
  
  // Not loading initially - will be set to true when fetch starts
  isLoading: false,
  
  // No errors initially - will be set to error message if fetch fails
  error: null,
};
```

**Guidelines:**
- Use numbered section comment: `// 4. Initial State`
- Comment each initial value explaining what it means and when it changes
- Match state interface exactly
- Use appropriate defaults (empty arrays, null, empty Maps, false for booleans)
- Keep it simple—no complex initialization logic here
- Comments should explain the semantic meaning of the default value

**Comment Examples:**
- ✅ `// Empty array - no documents loaded yet` - Explains what empty means
- ✅ `// Not loading initially - will be set to true when fetch starts` - Explains lifecycle
- ✅ `// No errors initially - will be set to error message if fetch fails` - Explains when it changes
- ❌ `// documents: []` - No comment
- ❌ `// documents` - Just restates the property name

### 5. Slice Creator

```typescript
// 5. Slice Creator
export const createCatalogSlice: StateCreator<
  DocsStore,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  ...initialState,

  fetchDocuments: async () => {
    console.log("[CatalogSlice] Fetching documents");
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch("/api/docs");
      if (!response.ok) throw new Error("Failed to fetch documents");
      
      const data = await response.json();
      set({ documents: data.documents, isLoading: false });
      
      console.log("[CatalogSlice] Documents fetched successfully");
    } catch (error) {
      console.error("[CatalogSlice] Error fetching documents:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch documents";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // ... other actions
});
```

**Guidelines:**
- Use numbered section comment: `// 5. Slice Creator`
- Spread `initialState` first
- Use `set()` for state updates
- Use `get()` to read current state within actions
- Keep actions focused and testable
- Use console logging with slice name prefix: `[CatalogSlice]` for debugging
- Handle errors gracefully and set error state

**Reference Example:**
See `app/(pages)/docs/store/slices/catalogSlice.ts` for a complete example of well-commented slice structure.

---

## 3. Store Composition

**Principle:** Stores are composed from multiple slices. Each slice handles a distinct concern, and slices are combined into a single store.

### Store Structure

```typescript
// store/index.ts
import { create } from "zustand";
import { createNodesSlice } from "./slices/nodesSlice";
import { createExecutionSlice } from "./slices/executionSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { WorkflowStore } from "./types";

export const useWorkflowStore = create<WorkflowStore>()(
  (...args) => ({
    ...createNodesSlice(...args),
    ...createExecutionSlice(...args),
    ...createUiSlice(...args),
  })
);
```

### Type Composition

```typescript
// store/types.ts
import type { NodesSlice } from "./slices/nodesSlice";
import type { ExecutionSlice } from "./slices/executionSlice";
import type { UiSlice } from "./slices/uiSlice";

export type WorkflowStore = NodesSlice & ExecutionSlice & UiSlice;
```

**Guidelines:**
- One store per feature/domain
- Compose slices using spread operator
- Export combined type for type safety
- Keep store composition file minimal (just wiring)

---

## 4. Data Flow Pattern

**Principle:** Data flows in one direction: Component → Store Action → Service/API → Store Update → Component Re-render.

### Flow Diagram

```
User Interaction
    ↓
Component calls store action
    ↓
Store action executes business logic
    ↓
Store action calls service/API (if needed)
    ↓
Store action updates state via set()
    ↓
Store notifies subscribers
    ↓
Components re-render with new state
```

### Implementation Pattern

```typescript
// Component
export function AgentList() {
  const store = useAgentStore();
  
  useEffect(() => {
    store.loadAgents(); // Trigger action
  }, []);
  
  return (
    <div>
      {store.agents.map(agent => (
        <AgentCard key={agent.id} agentId={agent.id} />
      ))}
    </div>
  );
}

// Store Action
loadAgents: async () => {
  set({ isLoading: true });
  try {
    const agents = await fetchAgents(); // Service call
    set({ agents, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

**Rule:** Components never call services directly. All service calls go through store actions.

---

## 5. Service Integration

**Principle:** Store actions call services for business logic and I/O operations. Services handle external concerns (API calls, file operations, etc.).

### Service Call Pattern

```typescript
addNode: async (type, position) => {
  // 1. Prepare data
  const id = nanoid();
  const newNode = { id, type, position, data: {} };
  
  // 2. Call service (business logic)
  await FileSystemService.getInstance().createNodeFile(id, code);
  
  // 3. Update state
  set((state) => ({
    nodes: [...state.nodes, newNode],
    nodeFiles: new Map(state.nodeFiles).set(id, filePath)
  }));
}
```

**Guidelines:**
- Services handle I/O and external operations
- Store actions orchestrate services and update state
- Keep services stateless and focused
- Handle errors in store actions, not services

---

## 6. Component Integration

**Principle:** Components access stores imperatively. Get the whole store, call methods directly. Don't destructure actions.

### Preferred Pattern

```typescript
// ✅ GOOD: Imperative store access
export function AgentCard({ agentId }: { agentId: string }) {
  const store = useAgentStore();
  
  return (
    <Card>
      <CardHeader>{store.getAgent(agentId)?.name}</CardHeader>
      <Button onClick={() => store.selectAgent(agentId)}>
        Select
      </Button>
    </Card>
  );
}
```

### Avoid

```typescript
// ❌ BAD: Destructured actions
const { selectAgent, getAgent } = useAgentStore();
```

**Rationale:**
- **Clear Source:** Always know where methods come from (`store.methodName`)
- **Easy Debugging:** Can inspect entire store state
- **Type Safety:** Better TypeScript autocomplete
- **Consistent Pattern:** Same approach across all components

---

## 7. State Updates

**Principle:** State updates should be atomic and predictable. Use functional updates to ensure consistency.

### Atomic Updates

```typescript
// ✅ GOOD: Atomic update
set((state) => ({
  nodes: [...state.nodes, newNode],
  nodeFiles: new Map(state.nodeFiles).set(id, filePath)
}));

// ❌ BAD: Multiple separate updates
set((state) => ({ nodes: [...state.nodes, newNode] }));
set((state) => ({ nodeFiles: new Map(state.nodeFiles).set(id, filePath) }));
```

**Guidelines:**
- Use functional updates: `set((state) => ({ ... }))`
- Update related state together in one call
- Don't mutate state directly—always return new objects/arrays
- Use Maps/Sets efficiently (create new instances, don't mutate)

---

## 8. Error Handling

**Principle:** Store actions should handle errors gracefully. Set error state in the store, don't throw from actions.

### Error Pattern

```typescript
loadAgents: async () => {
  set({ isLoading: true, error: null });
  try {
    const agents = await fetchAgents();
    set({ agents, isLoading: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    set({ error: message, isLoading: false });
  }
}
```

**Guidelines:**
- Always clear previous errors when starting new operations
- Set error state, don't throw
- Components read error state from store
- Provide retry mechanisms where appropriate

---

## 9. Loading States

**Principle:** Loading states should be explicit and managed in the store. Components read loading state to show UI feedback.

### Loading Pattern

```typescript
loadAgents: async () => {
  set({ isLoading: true });
  try {
    const agents = await fetchAgents();
    set({ agents, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

**Guidelines:**
- Set loading state at the start of async actions
- Clear loading state in both success and error cases
- Use separate loading flags for different operations if needed
- Components check loading state before rendering

---

## 10. Slice Boundaries

**Principle:** Slices should represent distinct concerns. Each slice handles one aspect of the feature's state.

### When to Create a New Slice

- **Different Concern:** State represents a different aspect (UI state vs data state)
- **Independent Lifecycle:** State can be loaded/cleared independently
- **Different Update Patterns:** State updates follow different patterns
- **Reusability:** Slice could be reused in other stores

### Slice Examples

```typescript
// UI Slice - UI state (modals, panels, selections)
interface UiSlice {
  isModalOpen: boolean;
  selectedTab: string;
  openModal: () => void;
  closeModal: () => void;
}

// Data Slice - Business data
interface AgentsSlice {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  loadAgents: () => Promise<void>;
}

// Feature Slice - Feature-specific state
interface ChatSlice {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
}
```

**Rule:** If you're unsure whether to create a new slice, start with one and split when boundaries become clear.

---

## Design Decisions

### Why Zustand Over Redux?

**Decision:** Use Zustand for state management instead of Redux.

**Rationale:**
- Less boilerplate—no actions, reducers, or action creators
- Simpler API—just create store and use it
- Better TypeScript support—type inference works naturally
- Smaller bundle size
- Easier to learn and maintain

**Trade-offs:**
- Less ecosystem/tooling than Redux
- No time-travel debugging (though Zustand DevTools exist)
- Less opinionated structure (can be good or bad)

### Why Slices Over Single Store?

**Decision:** Compose stores from multiple slices instead of one monolithic store.

**Rationale:**
- **Separation of Concerns:** Each slice handles one aspect
- **Maintainability:** Easier to find and modify specific state
- **Testability:** Can test slices independently
- **Reusability:** Slices can be composed differently
- **Code Organization:** Clear boundaries between concerns

**Trade-offs:**
- More files to manage
- Need to understand composition pattern
- Slightly more setup code

### Why Store Actions Over Component Logic?

**Decision:** Put business logic in store actions, not components.

**Rationale:**
- **Testability:** Actions can be tested without components
- **Reusability:** Actions can be called from multiple components
- **Debugging:** Single place to inspect state changes
- **Consistency:** Same logic used everywhere

**Trade-offs:**
- More indirection (component → action → service)
- Requires understanding store pattern
- Can feel heavy for very simple operations

---

## Implementation Guidelines

### Creating a New Slice

1. **File-level Documentation** - Add JSDoc comment explaining what the slice manages
2. **Define State Interface** - What data we store (with JSDoc comments on each property)
3. **Define Actions Interface** - What operations we can perform (with JSDoc comments on each action)
4. **Create Combined Type** - Combine state and actions
5. **Create Initial State** - Default values (with inline comments explaining what each default means)
6. **Implement Slice Creator** - Business logic with console logging
7. **Add to Store** - Compose with other slices
8. **Update Types** - Add slice type to store type

### Commenting Best Practices

**File-Level Comment:**
```typescript
/**
 * Catalog Slice
 * 
 * Manages document list state and catalog operations.
 * Handles fetching, creating, and deleting documents.
 */
```

**State Properties:**
```typescript
/** List of all documents */
documents: DocumentListItem[];

/** Loading state for catalog operations */
isLoading: boolean;
```

**Actions:**
```typescript
/** Fetch all documents from the API */
fetchDocuments: () => Promise<void>;

/** Create a new document */
createDocument: (title?: string) => Promise<string | null>;
```

**Initial State Values:**
```typescript
// Empty array - no documents loaded yet
documents: [],

// Not loading initially - will be set to true when fetch starts
isLoading: false,

// No errors initially - will be set to error message if fetch fails
error: null,
```

**Key Principles:**
- **State comments** explain what the property represents, not just restate the name
- **Action comments** explain what the action does and where data comes from/goes
- **Initial state comments** explain the semantic meaning of the default value and when it changes
- Use JSDoc format (`/** */`) for interfaces, inline comments (`//`) for initial state
- Numbered section comments (`// 1. State Interface`) help navigate the file structure

**Reference:**
See `app/(pages)/docs/store/slices/catalogSlice.ts` for a complete example of well-commented slice structure.

### Naming Conventions

**Slice Files:**
- Pattern: `[feature]Slice.ts` or `[concern]Slice.ts`
- Examples: `nodesSlice.ts`, `uiSlice.ts`, `chatSlice.ts`

**Store Hooks:**
- Pattern: `use[Feature]Store`
- Examples: `useWorkflowStore`, `useAgentStore`

**Actions:**
- Pattern: `verbNoun` or `verbNounNoun`
- Examples: `addNode`, `deleteNode`, `updateNodeData`, `setSelectedNodeId`

**State Properties:**
- Use descriptive names: `selectedNodeId` not `selected`
- Use boolean flags: `isLoading` not `loading`
- Use nullable types: `error: string | null` not `error?: string`

---

## Best Practices

### 1. Keep State Minimal

Don't store derived data. Compute it when needed or use selectors.

```typescript
// ✅ GOOD: Store source data
interface State {
  agents: Agent[];
}

// Compute in component or selector
const activeAgents = agents.filter(a => a.status === 'active');

// ❌ BAD: Store derived data
interface State {
  agents: Agent[];
  activeAgents: Agent[]; // Redundant
}
```

### 2. Use Functional Updates

Always use functional updates to ensure you're working with latest state.

```typescript
// ✅ GOOD: Functional update
set((state) => ({ count: state.count + 1 }));

// ❌ BAD: Direct state access
set({ count: get().count + 1 }); // May be stale
```

### 3. Handle Async Actions Properly

Set loading/error state, handle errors gracefully.

```typescript
// ✅ GOOD: Proper async handling
loadData: async () => {
  set({ isLoading: true, error: null });
  try {
    const data = await fetchData();
    set({ data, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### 4. Use Maps/Sets for Keyed Collections

Maps and Sets provide better performance and clearer intent.

```typescript
// ✅ GOOD: Map for keyed data
nodeFiles: Map<string, string>

// ❌ BAD: Array of objects
nodeFiles: Array<{ nodeId: string; path: string }>
```

---

## Related Docs

- [Component Principles](./COMPONENT_PRINCIPLES.md) - How components use stores
- [API Domain Principles](./api/DOMAIN_PRINCIPLES.md) - Backend API patterns
- [Store Slice Architecture](../_docs/Engineering/Architecture/Store-Slice-Architecture.md) - Detailed implementation guide
- [Zustand Documentation](https://docs.pmnd.rs/zustand) - Framework reference

---

## Examples

See existing implementations for reference:

- `app/(pages)/docs/store/slices/catalogSlice.ts` - **Best example** of well-commented slice structure
- `app/(pages)/docs/store/slices/editorSlice.ts` - Good example of state and action comments
- `app/(pages)/workflows/editor/store/` - Workflow editor store
- `app/(pages)/workforce/components/agent-modal/store/` - Agent modal store
- `app/(pages)/records/store/` - Records domain store

Each follows the same pattern but handles different concerns, demonstrating how the pattern scales to different use cases. The `catalogSlice.ts` is the best reference for commenting patterns.
