# Diary Entry 8: Agent SDK Spike — From Chat Loop to Tool Execution

## 1. Why We Ran This Spike
- Validate that we understand the Vercel AI Agent SDK beyond theory (docs: [Building Agents](https://ai-sdk.dev/docs/agents/building-agents), [Vercel Guide](https://vercel.com/guides/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)).
- Prove the new workforce chat can instantiate an agent, stream responses, and execute at least one tool end-to-end.
- Lay the groundwork for loading tools/agents from `_tables` so future agents can share capabilities.

## 2. Chat Loop Foundations
### ✅ Generalized API Route
- Added `app/api/workforce/agent/route.ts` to host a single agent instance, initially tool-free.
- Injected persona/system context server-side, validated UI messages with `validateUIMessages`, and streamed the response via `agent.respond()`.
- Confirmed streaming works by wiring the workforce modal’s `AgentChat` to the new endpoint.

### ✅ UI Transport Fix
- `@ai-sdk/react@^2` no longer honors `api: '/path'`; it requires a `DefaultChatTransport`.
- Created a transport in `AgentChat.tsx` so messages reliably hit `/api/workforce/agent`.
- Removed the legacy `/api/chat` route after confirming no components relied on it.

## 3. Tool Prototype: `summarize_risks`
### Motivation
- Before building registries, we needed one real tool call to observe the payload shape, logging, and streaming behavior.

### Implementation
- Created `_tables/tools/prototype-risk-summary.ts` exporting `summarizeRisksTool` via the SDK’s `tool()` helper.
- `inputSchema`: array of `{ name, detail?, severity? }` risks.
- `execute`: logs invocation, assembles a numbered summary, selects the highest severity risk, and recommends focus.
- Registered the tool inside `workforceChatAgent` (renamed from the generic “chat-only agent”) with `toolChoice` left to the model but encouraged via the system prompt.
- Updated server logs to print tool inputs/outputs for observability.

### Result
- Sending “Here are the launch risks: … (critical)” now triggers the tool.
- Server logs show:
  ```
  [/api/workforce/agent] messages: …
  [summarize_risks] invoked { count: 3 }
  [summarize_risks] result { summary: ..., topRisk: ..., recommendation: ... }
  ```
- Chat UI reflects the structured recommendation in plain text. No errors or extra latency beyond model execution.

## 4. Key Learnings
- **Transport is mandatory**: In AI SDK v2, any custom endpoint must use `DefaultChatTransport`; otherwise everything defaults to `/api/chat` silently.
- **Tool validation happens twice**: We need to provide the tool map to both the agent constructor and `validateUIMessages` to keep type safety intact.
- **System prompt nudging**: Telling the model when to call a tool dramatically increases the success rate without forcing `toolChoice: 'required'`.
- **Logging is essential**: Console logs in both the route and `execute` handler are invaluable for debugging tool contracts.
- **Tool modules should live next to `_tables` metadata**: This keeps the schema (id, description) and executable code aligned, easing the switch to real registries later.

## 5. Open Questions & Next Steps
1. **Registry Wiring**: Load tool definitions from `_tables/tools/index.ts`, match them to agents via `_tables/agents/*.ts`, and hydrate the agent at request time.
2. **UI Surfacing**: Decide how to display tool results distinctly (perhaps JSON viewer or tool call feed) instead of plain text.
3. **Error Handling**: Introduce graceful fallbacks if a tool throws or returns malformed data.
4. **Multiple Agents**: Expand `/api/workforce/agent` into a generalized `/api/workforce/agents` route that selects persona, system prompt, and tool ids from the registry.
5. **Transpiler Alignment**: Use this prototype to inform what code the workflow transpiler must emit so generated tools plug in seamlessly.

## 6. Reflection
- The spike confirmed that the Agent SDK integrates cleanly with Next.js once transport and tool contracts are understood.
- We now have a shared vocabulary (`agent`, `tool`, `transport`, `toolIds`) and a runnable slice of functionality to iterate on.
- Next iterations will focus on turning today’s hard-coded prototype into a dynamic registry-driven system without losing the clarity we established here.
