# Transpiler Services

Converts workflow definitions into executable Mastra TypeScript code.

## Architecture

```
transpiler/
├── index.ts           # Main orchestrator
├── types.ts           # TypeScript types
├── schema-generator.ts    # JSON Schema → Zod code
├── step-generator.ts      # createStep() declarations
├── mapping-generator.ts   # .map() data transformations
└── workflow-generator.ts  # Workflow composition chain
```

## Usage

```typescript
import { transpileWorkflow } from "./services/transpiler";

const result = transpileWorkflow(workflowDefinition, bindings);

if (result.errors.length === 0) {
  // Write result.code to workflow.ts
}
```

## Generated Code Structure

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// Step definitions
const step1 = createStep({ ... });
const step2 = createStep({ ... });

// Workflow composition
export const workflow = createWorkflow({ ... })
  .then(step1)
  .map(async ({ getStepResult }) => ({ ... }))
  .then(step2)
  .commit();

// Metadata
export const workflowMetadata = {
  requiredConnections: ["gmail", "browser_tool"],
  stepCount: 2
};
```

## Extension Points

Phase 10 will add control flow generators:
- `branch-generator.ts` - `.branch()` conditional routing
- `parallel-generator.ts` - `.parallel()` concurrent execution
- `loop-generator.ts` - `.dountil()` iteration
- `foreach-generator.ts` - `.foreach()` array processing

