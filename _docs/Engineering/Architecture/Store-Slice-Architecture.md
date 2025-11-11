# Store-Slice Architecture: Zustand Pattern for Agipo

## Overview
This document captures the established architectural pattern for state management in Agipo using Zustand with a slice-based composition approach. This pattern provides clear separation of concerns, predictable data flow, and maintainable code structure.

## **🎯 The Slice Pattern Structure**

Every slice follows this exact same **4-part structure**:

### **1. State Interface** (What data we store)
```typescript
interface NodesSliceState {
  nodes: Node[]           // React Flow nodes
  edges: Edge[]           // React Flow edges  
  selectedNodeId: string | null
  nodeFiles: Map<string, string>  // Node ID → File path mapping
}
```

### **2. Actions Interface** (What we can do)
```typescript
interface NodesSliceActions {
  onNodesChange: (changes: NodeChange[]) => void
  addNode: (type: NodeType, position: XYPosition) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => Promise<void>
  setSelectedNodeId: (nodeId: string | null) => void
}
```

### **3. Initial State** (Starting values)
```typescript
const initialState: NodesSliceState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  nodeFiles: new Map()
}
```

### **4. Slice Creator** (The actual implementation)
```typescript
export const createNodesSlice: StateCreator<NodesSlice> = (set, get) => ({
  ...initialState,  // Start with initial state
  
  // Implement all the actions
  addNode: async (type, position) => {
    // 1. Do business logic (maybe call a service)
    // 2. Update state using set()
  },
  
  deleteNode: async (nodeId) => {
    // 1. Do business logic
    // 2. Update state using set()
  }
})
```

## **🔗 Store Composition Pattern**

### **The Main Store**
```typescript
// agipo.store.ts - The main store that combines everything
export const useAgipoStore = create<AgipoStore>()(
  persist(
    (...a) => ({
      // Combine all slices into one big store
      ...createNodesSlice(...a),      // React Flow state
      ...createExecutionSlice(...a),  // Code execution state  
      ...createWebContainerSlice(...a) // Container lifecycle
    }),
    { /* persistence config */ }
  )
)
```

### **Slice Integration**
```typescript
// Combined store interface
export type AgipoStore = NodesSlice & ExecutionSlice & WebContainerSlice;

// Each slice contributes its state and actions
interface NodesSlice extends NodesSliceState, NodesSliceActions {}
interface ExecutionSlice extends ExecutionSliceState, ExecutionSliceActions {}
interface WebContainerSlice extends WebContainerSliceState, WebContainerSliceActions {}
```

## **🏗️ Service Integration Pattern**

### **How Actions Call Services**
```typescript
// Inside a slice action - this is how we call services
addNode: async (type, position) => {
  // 1. Create React Flow node
  const newNode = { id, type, position, data }
  
  // 2. Call service (business logic)
  await FileSystemService.getInstance().createNodeFile(id, code)
  
  // 3. Update state
  set((state) => ({
    nodes: [...state.nodes, newNode],
    nodeFiles: new Map(state.nodeFiles).set(id, filePath)
  }))
}
```

### **Service Boundaries**
```typescript
// Clear service responsibilities
WebContainerService  // Core container lifecycle (boot, spawn, teardown)
FileSystemService    // File operations (create, read, update, delete)
ProcessService       // Code execution (spawn processes, capture output)
```

## **📊 Data Flow Architecture**

### **Predictable Data Flow**
```
UI Component → Store Action → Service → State Update → UI Re-renders
```

### **Example Flow**
```typescript
// 1. UI Component calls action
const store = useAgipoStore()
await store.executeNode(id, store.nodes)

// 2. Action calls service
executeNode: async (nodeId, nodes) => {
  const result = await ProcessService.getInstance().executeNodeCode(nodeId, code)
  set((state) => ({ nodeOutputs: new Map(state.nodeOutputs).set(nodeId, result.output) }))
}

// 3. UI automatically re-renders with new state
const output = store.getNodeOutput(id)
```

## **🎨 Component Integration Pattern**

### **Imperative Store Access**
```typescript
// ✅ PREFERRED: Get whole store, call methods
const store = useAgipoStore()
store.addNode('codeNode', position)
store.updateNodeData(id, { code: newCode })

// ❌ AVOID: Destructure specific methods
const { addNode, updateNodeData } = useAgipoStore()
addNode('codeNode', position)
updateNodeData(id, { code: newCode })
```

### **Why Imperative Style Works Better**
1. **Clear Source**: Always know where methods come from (`store.methodName`)
2. **Easy Debugging**: Can inspect entire store state
3. **Type Safety**: TypeScript provides better autocomplete
4. **Consistent Pattern**: Same approach across all components

## **🔧 Implementation Examples**

### **Nodes Slice Example**
```typescript
// 1. State Interface
interface NodesSliceState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  nodeFiles: Map<string, string>
}

// 2. Actions Interface
interface NodesSliceActions {
  onNodesChange: (changes: NodeChange[]) => void
  addNode: (type: NodeType, position: XYPosition) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => Promise<void>
  setSelectedNodeId: (nodeId: string | null) => void
}

// 3. Initial State
const initialState: NodesSliceState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  nodeFiles: new Map()
}

// 4. Slice Creator
export const createNodesSlice: StateCreator<NodesSlice> = (set, get) => ({
  ...initialState,

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  addNode: async (type, position) => {
    const id = nanoid()
    const defaultCode = '// Write your code here\nconsole.log("Hello World");'
    
    console.log('📝 NodesSlice: Creating node:', id)
    
    const newNode: Node = {
      id,
      type: 'codeNode',
      position,
      data: { code: defaultCode }
    }

    try {
      await FileSystemService.getInstance().createNodeFile(id, defaultCode)
      set((state) => ({
        nodes: [...state.nodes, newNode],
        nodeFiles: new Map(state.nodeFiles).set(id, `nodes/code-${id}.js`)
      }))
      console.log('✅ NodesSlice: Node and file created successfully')
    } catch (error) {
      console.error('⚠️ NodesSlice: File creation failed, but node created in UI')
      set((state) => ({ nodes: [...state.nodes, newNode] }))
    }
  },

  deleteNode: async (nodeId) => {
    console.log('🗑️ NodesSlice: Deleting node:', nodeId)
    
    try {
      await FileSystemService.getInstance().deleteNodeFile(nodeId)
    } catch (error) {
      console.error('Failed to delete node file:', error)
    }

    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      nodeFiles: new Map([...state.nodeFiles].filter(([id]) => id !== nodeId))
    }))
  },

  updateNodeData: async (nodeId, data) => {
    console.log('📝 NodesSlice: Updating node data:', nodeId)
    
    try {
      if ('code' in data && data.code) {
        await FileSystemService.getInstance().updateNodeFile(nodeId, data.code)
      }
    } catch (error) {
      console.error('❌ NodesSlice: Failed to update node file:', nodeId, error)
    }

    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }))
  },

  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId })
  }
})
```

### **Execution Slice Example**
```typescript
// 1. State Interface
interface ExecutionSliceState {
  executingNodes: Set<string>
  nodeOutputs: Map<string, string>
  nodeErrors: Map<string, string>
}

// 2. Actions Interface
interface ExecutionSliceActions {
  executeNode: (nodeId: string, nodes: Node[]) => Promise<void>
  getNodeOutput: (nodeId: string) => string
  getNodeError: (nodeId: string) => string
  isNodeExecuting: (nodeId: string) => boolean
}

// 3. Initial State
const initialState: ExecutionSliceState = {
  executingNodes: new Set(),
  nodeOutputs: new Map(),
  nodeErrors: new Map()
}

// 4. Slice Creator
export const createExecutionSlice: StateCreator<ExecutionSlice> = (set, get) => ({
  ...initialState,

  executeNode: async (nodeId, nodes) => {
    console.log('🚀 Execution: Starting execution for node:', nodeId)
    
    set((state) => ({
      executingNodes: new Set([...state.executingNodes, nodeId]),
      nodeErrors: new Map(state.nodeErrors).set(nodeId, '')
    }))

    try {
      const node = nodes.find((n) => n.id === nodeId)
      const code = (node?.data as { code?: string })?.code || ''
      
      if (!code.trim()) {
        throw new Error('No code to execute')
      }

      const result = await ProcessService.getInstance().executeNodeCode(nodeId, code)
      
      set((state) => ({
        executingNodes: new Set([...state.executingNodes].filter(id => id !== nodeId)),
        nodeOutputs: new Map(state.nodeOutputs).set(nodeId, result.output || ''),
        nodeErrors: new Map(state.nodeErrors).set(nodeId, result.error || '')
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error'
      set((state) => ({
        executingNodes: new Set([...state.executingNodes].filter(id => id !== nodeId)),
        nodeErrors: new Map(state.nodeErrors).set(nodeId, errorMessage)
      }))
    }
  },

  getNodeOutput: (nodeId) => {
    const state = get()
    return state.nodeOutputs.get(nodeId) || ''
  },

  getNodeError: (nodeId) => {
    const state = get()
    return state.nodeErrors.get(nodeId) || ''
  },

  isNodeExecuting: (nodeId) => {
    return get().executingNodes.has(nodeId)
  }
})
```

## **🚫 What We DON'T Do**

### **❌ Bad: Direct Service Calls from UI**
```typescript
// DON'T do this in components
const service = WebContainerService.getInstance()
await service.boot()
```

### **✅ Good: Actions Through Store**
```typescript
// DO this in components
const store = useAgipoStore()
await store.initializeWebContainer()
```

## **🎯 Key Benefits of This Pattern**

### **1. Clear Separation of Concerns**
- **State**: What data we have
- **Actions**: What we can do with that data
- **Services**: Business logic (file operations, code execution)
- **Store**: Easy access to everything

### **2. Predictable Data Flow**
- UI components never call services directly
- All data changes go through store actions
- State updates trigger automatic UI re-renders
- Clear debugging path when things go wrong

### **3. Easy Testing**
- Test actions independently
- Test services independently  
- Mock services in action tests
- Test UI components with mock stores

### **4. Type Safety**
- TypeScript knows exactly what state and actions are available
- IDE autocomplete works perfectly
- Compile-time error detection
- Clear contracts between components and store

### **5. Maintainability**
- Consistent structure across all slices
- Easy to add new features
- Easy to refactor existing code
- Clear boundaries between concerns

## **🔍 Debugging Patterns**

### **Console Logging Strategy**
```typescript
// Use emojis for quick visual identification
console.log('🚀 Execution: Starting execution for node:', nodeId)
console.log('💾 FileSystem: Creating file:', filePath)
console.log('✅ FileSystem: File created successfully:', filePath)
console.log('❌ Execution: Failed for node:', nodeId, error)
```

### **State Inspection**
```typescript
// In browser console
const store = useAgipoStore.getState()
console.log('Current nodes:', store.nodes)
console.log('Execution state:', store.nodeOutputs)
console.log('WebContainer ready:', store.isReady)
```

## **📋 Best Practices**

### **1. Always Use React Flow Utilities**
```typescript
// ✅ CORRECT - Use React Flow utilities
onNodesChange: (changes) => {
  set((state) => ({
    nodes: applyNodeChanges(changes, state.nodes),
  }));
},

// ❌ WRONG - Manual implementation
onNodesChange: (changes) => {
  set((state) => {
    const updatedNodes = changes.reduce((acc, change) => {
      // Manual logic - don't do this!
    }, state.nodes)
    return { nodes: updatedNodes }
  })
}
```

### **2. Keep Node Data Minimal**
```typescript
// ✅ CORRECT - Minimal data
const newNode = {
  id: nanoid(),
  type: 'codeNode',
  position,
  data: { code: '// Write your code here' }
}

// ❌ WRONG - Complex data
const newNode = {
  id: nanoid(),
  type: 'codeNode',
  position,
  data: {
    id: nanoid(), // Redundant
    type: 'codeNode', // Redundant
    code: 'console.log("Hello")',
    position: { x: 0, y: 0 }, // Redundant
    // ... lots of other properties
  }
}
```

### **3. Use Atomic State Updates**
```typescript
// ✅ CORRECT - Atomic updates
set((state) => ({
  nodes: [...state.nodes, newNode],
  nodeFiles: new Map(state.nodeFiles).set(id, filePath)
}))

// ❌ WRONG - Multiple separate updates
set((state) => ({ nodes: [...state.nodes, newNode] }))
set((state) => ({ nodeFiles: new Map(state.nodeFiles).set(id, filePath) }))
```

### **4. Handle Errors Gracefully**
```typescript
// ✅ CORRECT - Graceful error handling
try {
  await FileSystemService.getInstance().createNodeFile(id, defaultCode)
  console.log('✅ FileSystem: File created successfully:', filePath)
} catch (error) {
  console.log('⚠️ NodeSlice: File creation failed, but node created in UI')
  // Still create the React Flow node even if file creation fails
}
```

## **🎯 Success Metrics**

### **Technical Success**
- ✅ No direct service calls from UI components
- ✅ All state changes go through store actions
- ✅ Clear separation between state, actions, and services
- ✅ TypeScript provides full type safety
- ✅ Console logs are clear and consistent

### **Developer Experience Success**
- ✅ Easy to add new features
- ✅ Easy to debug issues
- ✅ Easy to test components
- ✅ Easy to understand code structure
- ✅ IDE autocomplete works perfectly

### **User Experience Success**
- ✅ UI responds immediately to user actions
- ✅ State updates are predictable
- ✅ Error handling is graceful
- ✅ Performance is good
- ✅ No unexpected behavior

## **🚀 Next Steps**

### **Adding New Slices**
1. **Define state interface** (what data to store)
2. **Define actions interface** (what operations to support)
3. **Create initial state** (starting values)
4. **Implement slice creator** (actual logic)
5. **Add to main store** (compose with other slices)

### **Adding New Services**
1. **Create service class** with singleton pattern
2. **Define clear responsibilities** (one service, one concern)
3. **Add to slice actions** (call service from actions)
4. **Add error handling** (graceful degradation)
5. **Add console logging** (for debugging)

### **Extending Existing Slices**
1. **Add to state interface** (new data to store)
2. **Add to actions interface** (new operations)
3. **Update initial state** (default values)
4. **Implement in slice creator** (actual logic)
5. **Update TypeScript types** (maintain type safety)

This architecture provides a solid foundation for building complex applications while maintaining simplicity and clarity. The consistent patterns make it easy for developers to understand and extend the codebase.

---

*This pattern has been successfully used in the Agipo project to manage React Flow state, WebContainer integration, and code execution state with excellent results.*
