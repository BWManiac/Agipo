# Tools Services

**Domain:** Tools  
**Last Updated:** December 6, 2025

---

## Overview

This directory contains services for tool loading and execution. Tools are divided into two categories:

1. **Custom Tools** - User-defined workflow tools stored in `_tables/tools/`
2. **Composio Tools** - External integration tools via Composio SDK (Gmail, Slack, etc.)

---

## File Structure

```
services/
├── index.ts              # Barrel exports
├── runtime.ts            # Unified tool loading (re-exports from below)
├── custom-tools.ts       # Custom workflow tool loading
├── composio-tools.ts     # Composio tool schema conversion & execution
├── storage.ts            # Tool storage/persistence
├── transpiler.ts         # Workflow-to-tool transpilation
├── RUNTIME.md            # Detailed documentation on known issues
└── README.md             # This file
```

---

## Usage

```typescript
import { 
  getExecutableToolById,       // Get any tool by ID
  getExecutableTools,          // List all custom tools
  getConnectionToolExecutable, // Build Composio tool with auth
  clearToolCache,              // Clear custom tool cache
} from "@/app/api/tools/services";
```

---

## Key Exports

| Export | Source | Purpose |
|--------|--------|---------|
| `getExecutableToolById(id, userId?)` | runtime.ts | Get tool by ID (custom or Composio) |
| `getExecutableTools()` | custom-tools.ts | Load all custom tools |
| `getConnectionToolExecutable(userId, binding)` | composio-tools.ts | Build Composio tool for agent |
| `clearToolCache()` | custom-tools.ts | Force reload custom tools |
| `convertComposioSchemaToZod(params)` | composio-tools.ts | JSON Schema → Zod conversion |

---

## Architecture

```
Agent Chat
    │
    ├── Custom Tools ───────── custom-tools.ts
    │   └── File system loading from _tables/tools/
    │
    └── Connection Tools ───── composio-tools.ts
        ├── Schema conversion (JSON Schema → Zod)
        ├── Context filtering (Mastra runtime injection)
        └── Result truncation (10K chars)
```

---

## Known Issues

See `RUNTIME.md` for detailed documentation on:

1. **Mastra Context Leak** - Runtime context filtering
2. **Composio Provider Incompatibility** - Manual schema conversion workaround
3. **Large Tool Results** - Truncation strategy
4. **Custom Tool Import Failures** - Turbopack dynamic imports

---

## Related Files

- `@/_tables/tools/` - Custom tool definitions
- `@/app/api/connections/services/composio.ts` - Composio client
- `@/app/api/workforce/[agentId]/chat/route.ts` - Chat API that uses tools
