# Task 8: Composio Backend Integration

**Status:** Complete  
**Date:** December 2025  
**Goal:** Integrate Composio SDK into backend for OAuth connection management and tool execution.

---

## 1. Overview

This task implements the backend infrastructure for Composio integration, enabling:
- OAuth connection initiation for users
- Listing connected accounts
- Dynamic tool loading from Composio (in addition to local workflow tools)

## 2. Implementation Summary

### Files Created

1. **`app/api/integrations/services/composio.ts`**
   - Core service wrapper for `@composio/core` SDK
   - Provides singleton client initialization
   - Helper functions: `initiateConnection`, `listConnections`, `getToolAction`, `getAvailableTools`

2. **`app/api/integrations/connect/route.ts`**
   - POST endpoint: `/api/integrations/connect`
   - Accepts `{ appName, userId?, redirectUri? }`
   - Returns `{ redirectUrl, connectionStatus }`
   - Initiates OAuth flow for connecting apps

3. **`app/api/integrations/list/route.ts`**
   - GET endpoint: `/api/integrations/list?userId=...`
   - Returns array of connected accounts
   - Each item contains: `id`, `appName`, `status`, `createdAt`, `updatedAt`

### Files Modified

1. **`app/api/tools/services/runtime.ts`**
   - Enhanced `getExecutableToolById()` to support Composio tools
   - Detects `composio-` prefixed tool IDs
   - Fetches tool schemas from Composio SDK
   - Converts Composio tools to Vercel AI SDK `ToolDefinition` format
   - Maintains backward compatibility with local workflow tools

## 3. Architecture Decisions

### Tool ID Convention

- **Local tools:** `workflow-{name}` (existing convention)
- **Composio tools:** `composio-{action_name}` (e.g., `composio-gmail_send_email`)

The runtime automatically detects the prefix and routes to the appropriate loader.

### User Identity (MVP)

For MVP, we use a simple approach:
- `userId` can be provided in request body/query params
- Defaults to `"agipo_test_user"` if not provided
- **Future:** Replace with actual authentication middleware

This aligns with the "User-Centric" auth model (Phase 1) from `05-Integration-Auth-Models.md`.

### Tool Schema Conversion

Composio tools have their own parameter schema format. We convert them to Zod schemas compatible with Vercel AI SDK:

```typescript
// Composio tool -> Zod schema -> Vercel AI SDK tool()
const zodSchema = convertComposioSchemaToZod(composioTool.parameters);
const vercelTool = tool({
  description: composioTool.description,
  inputSchema: zodSchema,
  execute: async (input) => {
    return await client.tools.execute(userId, actionName, input);
  },
});
```

## 4. API Reference

### POST /api/integrations/connect

**Request:**
```json
{
  "appName": "gmail",
  "userId": "user_123",  // optional, defaults to test user
  "redirectUri": "http://localhost:3000/callback"  // optional
}
```

**Response:**
```json
{
  "redirectUrl": "https://composio.dev/oauth/...",
  "connectionStatus": "PENDING"
}
```

### GET /api/integrations/list

**Query Params:**
- `userId` (optional): defaults to test user

**Response:**
```json
[
  {
    "id": "conn_abc123",
    "appName": "gmail",
    "status": "CONNECTED",
    "createdAt": "2025-12-01T00:00:00Z",
    "updatedAt": "2025-12-01T00:00:00Z"
  }
]
```

## 5. Tool Runtime Integration

The tool runtime (`app/api/tools/services/runtime.ts`) now supports hybrid tool loading:

1. **Local Tools:** Loaded from `_tables/tools/` directories (existing behavior)
2. **Composio Tools:** Fetched dynamically from Composio SDK when ID starts with `composio-`

**Example Flow:**
```typescript
// Agent has toolIds: ["workflow-quick-summary", "composio-gmail_send_email"]

for (const toolId of agent.toolIds) {
  const toolDef = await getExecutableToolById(toolId, userId);
  // toolDef.run is a Vercel AI SDK tool() instance
  toolMap[toolId] = toolDef.run;
}
```

## 6. Testing

### Manual Testing with curl

**Test 1: Initiate Connection**
```bash
curl -X POST http://localhost:3000/api/integrations/connect \
  -H "Content-Type: application/json" \
  -d '{"appName":"gmail"}'
```

**Test 2: List Connections**
```bash
curl http://localhost:3000/api/integrations/list?userId=test_user
```

**Test 3: Tool Loading (via agent route)**
```bash
# Add composio-gmail_send_email to agent.toolIds, then test agent chat
curl -X POST http://localhost:3000/api/workforce/pm/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[...]}'
```

## 7. Environment Variables

Required:
- `COMPOSIO_API_KEY`: Your Composio API key (get from Composio dashboard)

## 8. Known Limitations & Future Work

1. **User Authentication:** Currently uses test user ID. Need to integrate with actual auth system.
2. **Tool Schema Conversion:** Simplified converter - may not handle all Composio schema types perfectly.
3. **Error Handling:** Basic error handling - could be more robust.
4. **Tool Discovery:** `tools/list` route doesn't yet merge Composio tools (optional enhancement).
5. **Caching:** Composio tools are fetched on-demand - could benefit from caching.

## 9. Acceptance Criteria Status

✅ **AC-1:** API - Initiate Connection Success  
✅ **AC-2:** API - Initiate Connection Validation  
✅ **AC-3:** API - List Connections Success  
✅ **AC-4:** API - List Connections Structure  
✅ **AC-5:** Service - Client Initialization  
✅ **AC-6:** Runtime - Local Tool Regression  
✅ **AC-7:** Runtime - Composio ID Detection  
✅ **AC-8:** Runtime - Composio Tool Fetch  
✅ **AC-9:** Runtime - Tool Structure Adaptation  
✅ **AC-10:** Runtime - Error Handling  

All acceptance criteria have been met through implementation.

## 10. References

- **Composio Docs:** https://docs.composio.dev/docs/fetching-tools
- **Spike Script:** `_docs/_tasks/7-composio-spike.ts`
- **Auth Model:** `_docs/Product/Features/05-Integration-Auth-Models.md`
- **Vercel AI SDK Guide:** https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk

