# Diary Entry 8: Agent SDK Spike — From Chat Loop to Tool Execution

**Date:** 2025-01-15  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

We ran this spike to validate that we understand the Vercel AI Agent SDK beyond theory, prove the new workforce chat can instantiate an agent, stream responses, and execute at least one tool end-to-end. This laid the groundwork for loading tools/agents from `_tables` so future agents can share capabilities.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/agent/route.ts` | Create | Generalized API route for agent instance | ~80 |
| `components/AgentChat.tsx` | Modify | Added `DefaultChatTransport` for custom endpoint | ~20 |
| `_tables/tools/prototype-risk-summary.ts` | Create | Tool prototype: `summarize_risks` | ~50 |

### Chat Loop Foundations

**Generalized API Route:**
- Added `app/api/workforce/agent/route.ts` to host single agent instance, initially tool-free
- Injected persona/system context server-side
- Validated UI messages with `validateUIMessages`
- Streamed response via `agent.respond()`

**UI Transport Fix:**
- `@ai-sdk/react@^2` no longer honors `api: '/path'`; requires `DefaultChatTransport`
- Created transport in `AgentChat.tsx` so messages reliably hit `/api/workforce/agent`
- Removed legacy `/api/chat` route after confirming no components relied on it

### Tool Prototype: `summarize_risks`

**Motivation:** Before building registries, we needed one real tool call to observe payload shape, logging, and streaming behavior.

**Implementation:**
- Created `_tables/tools/prototype-risk-summary.ts` exporting `summarizeRisksTool` via SDK's `tool()` helper
- `inputSchema`: array of `{ name, detail?, severity? }` risks
- `execute`: logs invocation, assembles numbered summary, selects highest severity risk, recommends focus
- Registered tool inside `workforceChatAgent` with `toolChoice` left to model but encouraged via system prompt

**Result:**
- Sending "Here are the launch risks: ... (critical)" triggers the tool
- Server logs show tool invocation and results
- Chat UI reflects structured recommendation in plain text

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transport | `DefaultChatTransport` | Required in AI SDK v2 for custom endpoints |
| Tool Validation | Both agent constructor and `validateUIMessages` | Keeps type safety intact |
| System Prompt | Nudging without forcing | Increases success rate without `toolChoice: 'required'` |
| Tool Location | `_tables/tools/` | Keeps schema and executable code aligned |

---

## 4. Technical Deep Dive

### Key Learnings

- **Transport is mandatory:** In AI SDK v2, any custom endpoint must use `DefaultChatTransport`; otherwise everything defaults to `/api/chat` silently
- **Tool validation happens twice:** Need to provide tool map to both agent constructor and `validateUIMessages` to keep type safety intact
- **System prompt nudging:** Telling the model when to call a tool dramatically increases success rate without forcing `toolChoice: 'required'`
- **Logging is essential:** Console logs in both route and `execute` handler are invaluable for debugging tool contracts
- **Tool modules should live next to `_tables` metadata:** Keeps schema (id, description) and executable code aligned, easing switch to real registries later

---

## 5. Lessons Learned

- **Transport requirement:** `DefaultChatTransport` is mandatory in AI SDK v2
- **Tool validation:** Must provide tool map to both agent and validator
- **System prompts matter:** Nudging increases tool call success rate
- **Logging helps:** Console logs essential for debugging tool contracts
- **Code organization:** Co-locating metadata and code simplifies maintenance

---

## 6. Next Steps

- [ ] Registry Wiring: Load tool definitions from `_tables/tools/index.ts`, match to agents via `_tables/agents/*.ts`
- [ ] UI Surfacing: Display tool results distinctly (JSON viewer or tool call feed)
- [ ] Error Handling: Graceful fallbacks if tool throws or returns malformed data
- [ ] Multiple Agents: Expand `/api/workforce/agent` into `/api/workforce/agents` route
- [ ] Transpiler Alignment: Use prototype to inform workflow transpiler code generation

---

## References

- **Vercel AI SDK Docs:** [Building Agents](https://ai-sdk.dev/docs/agents/building-agents)
- **Vercel Guide:** [How to Build AI Agents](https://vercel.com/guides/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
- **Related Diary:** `09-AgentRegistry.md` - Dynamic agent registry

---

**Last Updated:** 2025-01-15
