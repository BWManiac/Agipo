# Component Principles

> **Core Philosophy:** Components should be composable, predictable, and built on shadcn/ui primitives. State lives in Zustand stores, not in component hooks. The UI structure should communicate component relationships through organization alone.

---

## 1. shadcn/ui First

**Principle:** Use shadcn/ui components from `components/ui/` for all UI primitives. Don't customize them.

**Rule:** Before creating a custom component, check if `components/ui/` has what you need.

**Guidelines:**
- ✅ Use `Button`, `Card`, `Dialog`, `Input`, etc. from `components/ui/`
- ✅ Compose shadcn components to build feature components
- ❌ Don't modify shadcn components (they're meant to be updated via CLI)
- ❌ Don't create custom versions of shadcn components
- ❌ Don't add custom styling that breaks shadcn's design system

**Rationale:** shadcn/ui provides a consistent, accessible, and maintainable design system. Customizing breaks the ability to update components and creates visual inconsistency.

---

## 2. Meaningful Granularity

**Principle:** Break components down meaningfully—not too much, not too little. Aim for single responsibility without over-engineering.

**When to Split:**
- Component is > 200 lines
- Component handles multiple distinct concerns (data fetching + rendering + state)
- Component is reused in 2+ places
- Component has complex internal state that could be isolated

**When to Keep Together:**
- Component is < 100 lines and cohesive
- Splitting would create unnecessary prop drilling
- Component is only used in one place and unlikely to be reused

**Example Structure:**
```
components/
├── AgentCard.tsx          ← Single responsibility: display agent info
├── AgentCardActions.tsx   ← Split out: action buttons (reused elsewhere)
└── AgentCardMetrics.tsx   ← Split out: metrics display (complex logic)
```

**Rule:** If you're unsure, start with one component and split when you see clear boundaries emerge.

---

## 3. Component Organization

**Principle:** Components should be co-located with their primary consumer. Organization should reflect feature boundaries, not technical layers.

### Structure

```
app/(pages)/
├── [feature]/
│   ├── components/        ← Feature-specific components
│   │   ├── FeatureCard.tsx
│   │   └── FeatureList.tsx
│   ├── page.tsx
│   └── store/             ← Feature-specific store (if needed)
│
components/                 ← Shared components
├── ui/                    ← shadcn/ui primitives (don't modify)
├── layout/                ← Layout components (TopNav, etc.)
└── ai-elements/           ← AI-specific components
```

### Co-location Rules

**Rule 1: Feature Components**
- If component is only used in one feature → Place in `app/(pages)/[feature]/components/`
- Example: `app/(pages)/workforce/components/AgentModal.tsx`

**Rule 2: Shared Components**
- If component is used across 2+ features → Place in `components/`
- Example: `components/layout/TopNav.tsx`

**Rule 3: UI Primitives**
- All shadcn/ui components → `components/ui/`
- Never modify these files directly

**Rule 4: Nested Organization**
- For complex features, use subfolders: `components/agent-modal/components/tabs/`
- Keep nesting shallow (max 2-3 levels)

---

## 4. State Management: Store Slices, Not Hooks

**Principle:** State lives in Zustand store slices. Components should be presentational. Hooks should be avoided unless completely unavoidable.

**Data Flow:**
```
Component → Store Action → Service/API → Store Update → Component Re-renders
```

**Component Pattern:**
```typescript
// ✅ GOOD: Component reads from store, calls store actions
export function AgentCard({ agentId }: { agentId: string }) {
  const store = useAgentStore();
  const agent = store.getAgent(agentId);
  
  return (
    <Card>
      <CardHeader>{agent.name}</CardHeader>
      <CardContent>
        <Button onClick={() => store.selectAgent(agentId)}>
          Select
        </Button>
      </CardContent>
    </Card>
  );
}
```

**What NOT to Do:**
```typescript
// ❌ BAD: Component manages state with hooks
export function AgentCard({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Fetch logic here...
  }, [agentId]);
  
  // ...
}
```

**When Hooks Are Acceptable:**
- Third-party library hooks (e.g., `useChat` from `@ai-sdk/react`)
- React built-in hooks for local UI state (e.g., `useState` for modal open/close)
- Form libraries that require hooks (e.g., `react-hook-form`)

**Rule:** If you find yourself creating a custom hook for data fetching or business logic, move it to a store slice instead.

---

## 5. Naming Conventions

**Principle:** Consistent naming makes code predictable and discoverable.

### File Names

**Component Files:**
- Use PascalCase: `AgentCard.tsx`, `WorkflowEditor.tsx`
- Match component name exactly: `export function AgentCard` → `AgentCard.tsx`
- Use descriptive names: `AgentCard.tsx` not `Card.tsx`

**Folder Names:**
- Use kebab-case for folders: `agent-modal/`, `workflow-editor/`
- Use descriptive names: `components/agent-modal/` not `components/modal/`

### Component Names

**Export Names:**
- Use PascalCase: `export function AgentCard`
- Be specific: `AgentCard` not `Card`
- Match file name: `AgentCard.tsx` exports `AgentCard`

**Props Interfaces:**
- Use descriptive names: `AgentCardProps` not `Props`
- Include component name: `AgentCardProps` not `CardProps`

### Store Integration

**Store Hooks:**
- Pattern: `use[Feature]Store`
- Examples: `useWorkflowStore`, `useAgentStore`, `useRecordsStore`

**Store Actions:**
- Use verb-noun pattern: `selectAgent`, `createWorkflow`, `updateStep`
- Be specific: `selectAgent` not `select`

---

## 6. Component Composition

**Principle:** Build complex UIs by composing simple, focused components.

**Composition Pattern:**
```typescript
// ✅ GOOD: Compose shadcn components
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{agent.name}</CardTitle>
        <CardDescription>{agent.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <AgentStatus status={agent.status} />
        <AgentActions agentId={agent.id} />
      </CardContent>
    </Card>
  );
}
```

**Avoid:**
```typescript
// ❌ BAD: Monolithic component with everything inline
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3>{agent.name}</h3>
        <button onClick={...}>Select</button>
      </div>
      {/* 200 more lines... */}
    </div>
  );
}
```

**Rule:** If a component section is > 50 lines or handles a distinct concern, extract it to a separate component.

---

## 7. Props and Type Safety

**Principle:** Components should have clear, typed interfaces. Props should be minimal and focused.

**Props Pattern:**
```typescript
// ✅ GOOD: Clear, typed props
interface AgentCardProps {
  agentId: string;
  onSelect?: (agentId: string) => void;
  className?: string;
}

export function AgentCard({ agentId, onSelect, className }: AgentCardProps) {
  // ...
}
```

**Guidelines:**
- Always define props interface (don't use inline types)
- Use optional props for callbacks: `onSelect?` not `onSelect`
- Use `className?` for style overrides
- Keep props minimal—prefer store access over prop drilling

**When to Use Props vs Store:**
- **Props:** Component-specific data that changes per instance
- **Store:** Shared state, business logic, data fetching

---

## 8. Data Fetching Pattern

**Principle:** Components don't fetch data. Stores handle data fetching via actions.

**Pattern:**
```typescript
// ✅ GOOD: Store handles fetching
export function AgentList() {
  const store = useAgentStore();
  
  useEffect(() => {
    store.loadAgents(); // Store action handles fetch
  }, []);
  
  if (store.isLoading) return <Spinner />;
  if (store.error) return <Error message={store.error} />;
  
  return (
    <div>
      {store.agents.map(agent => (
        <AgentCard key={agent.id} agentId={agent.id} />
      ))}
    </div>
  );
}
```

**What NOT to Do:**
```typescript
// ❌ BAD: Component fetches data
export function AgentList() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/workforce').then(res => res.json()).then(data => {
      setAgents(data.agents);
    });
  }, []);
  
  // ...
}
```

**Rule:** If you need to fetch data, add a store action. Components should only read from store and trigger actions.

---

## 9. Error Handling

**Principle:** Components should handle errors gracefully. Error state lives in stores.

**Pattern:**
```typescript
export function AgentList() {
  const store = useAgentStore();
  
  if (store.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{store.error}</AlertDescription>
        <Button onClick={() => store.loadAgents()}>Retry</Button>
      </Alert>
    );
  }
  
  // ...
}
```

**Guidelines:**
- Use shadcn `Alert` component for errors
- Store actions should set error state
- Components should display errors from store
- Provide retry mechanisms where appropriate

---

## 10. Loading States

**Principle:** Loading states should be clear and consistent. Use shadcn components for loading indicators.

**Pattern:**
```typescript
export function AgentList() {
  const store = useAgentStore();
  
  if (store.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2">Loading agents...</span>
      </div>
    );
  }
  
  // ...
}
```

**Guidelines:**
- Use `Spinner` or `Skeleton` from `components/ui/`
- Store actions should set loading state
- Show loading state immediately (optimistic UI)

---

## Implementation Guidelines

### Component Checklist

Before creating a component, ask:
1. ✅ Can I use shadcn/ui components instead?
2. ✅ Is this component focused on a single responsibility?
3. ✅ Does state belong in a store slice, not a hook?
4. ✅ Is the component name clear and descriptive?
5. ✅ Are props minimal and well-typed?
6. ✅ Is the component co-located with its consumer?

### File Structure Example

```
app/(pages)/workforce/
├── components/
│   ├── AgentCard.tsx           ← Feature component
│   ├── AgentList.tsx           ← Feature component
│   └── agent-modal/            ← Complex feature, nested
│       ├── AgentModal.tsx
│       └── components/
│           └── tabs/
│               ├── ChatTab.tsx
│               └── CapabilitiesTab.tsx
├── store/                      ← Feature store
│   ├── index.ts
│   └── slices/
│       └── agentsSlice.ts
└── page.tsx
```

---

## Related Docs

- [Store Slice Architecture](../_docs/Engineering/Architecture/Store-Slice-Architecture.md) - State management patterns
- [API Domain Principles](./api/DOMAIN_PRINCIPLES.md) - Backend API patterns
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component reference

---

## Design Decisions

### Why shadcn/ui First?

**Decision:** Use shadcn/ui components without customization.

**Rationale:**
- Provides consistent, accessible design system
- Components can be updated via CLI
- Reduces maintenance burden
- Ensures visual consistency across app

**Trade-offs:**
- Less flexibility for custom designs
- Requires working within shadcn's design system
- May need to compose multiple components for complex UIs

### Why Store Slices Over Hooks?

**Decision:** Prefer Zustand store slices over custom hooks for state management.

**Rationale:**
- Centralized state is easier to debug
- Store actions provide clear data flow
- Reduces prop drilling
- Makes state testable independently

**Trade-offs:**
- More boilerplate for simple local state
- Requires understanding store slice pattern
- May feel heavy for very simple components

---

## Future Improvements

- [ ] Create component template/boilerplate generator
- [ ] Document common component patterns (forms, lists, modals)
- [ ] Establish design tokens/theme guidelines
- [ ] Create component library documentation
