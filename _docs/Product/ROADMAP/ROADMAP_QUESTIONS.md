# Roadmap Documents - Implementation Questions

This document contains pointed questions for each roadmap and task document to make them more deterministic and clear for implementation.

---

## Agent Config

### 01-Direct-Agent-Configuration-Editing.md

1. ✅ **Instruction Format Migration**: **ANSWERED** - Yes, migrate existing `systemPrompt` fields to `instructions` format. Migration happens during the update process.

2. ✅ **Validation Scope**: **ANSWERED** - Allow any positive integer for `maxSteps`. No specific range enforced (e.g., 1-50), but must be positive.

3. ✅ **Concurrent Edit Handling**: **ANSWERED** - Single-user assumption for now. Multi-user conflict handling deferred to later. No conflict detection needed for MVP.

4. ✅ **Provider Options UI**: **ANSWERED** - Provider options (model selection like Gemini/Claude) are IN SCOPE. Use existing model list from `app/api/workforce/[agentId]/chat/services/models.ts` (AVAILABLE_MODELS).

5. ✅ **Model Validation**: **ANSWERED** - Validate against available models list in `app/api/workforce/[agentId]/chat/services/models.ts`. Use `getAvailableModels()` function.

### 01A-Direct-Agent-Configuration-Editing-Task.md

1. ✅ **Error Handling Strategy**: **ANSWERED** - Continue with partial updates. If one field succeeds and another fails, update the successful fields and return error for failed ones.

2. **File Formatting Preservation**: The regex-based update approach might break formatting. Should we use a TypeScript parser/formatter (like `prettier` or `@typescript-eslint/parser`) to preserve formatting, or is regex sufficient?

3. ✅ **Validation Timing**: **ANSWERED** - Both client-side and server-side validation. Design UX for showing validation errors in the UI.

4. ✅ **Auto-save Consideration**: **ANSWERED** - Design UI to support future auto-save (e.g., debounced saves on blur). Manual save for MVP, but architecture should support auto-save later.

5. ✅ **Config File Backup**: **ANSWERED** - No backups needed. Rely on Git for version history.

---

## Agent Networks

### 01-Manager-Agents.md

1. ✅ **Manager vs Agent Distinction**: **ANSWERED** - Managers should have a dedicated section on the workforce page. Managers should also have a badge to distinguish them. Separate section + badge approach.

2. ✅ **Sub-Agent Selection UX**: **ANSWERED** - Users should see all available agents in a multi-select. No filtering/search needed for MVP (assumes manageable number of agents).

3. ✅ **Manager Capabilities**: **ANSWERED** - Managers CAN have their own tools/workflows that they use directly (hybrid model). Not pure routers - they can use tools/workflows directly.

4. ✅ **Delegation Visibility Detail**: **ANSWERED** - Users should see the full sub-agent conversation if possible (expandable). Full conversation visibility is the goal.

5. ✅ **Error Handling Strategy**: **ANSWERED** - Defer to Mastra for error handling logic. Not in scope for our implementation - rely on Mastra's framework behavior.

### 01A-Manager-Agents-Task.md

1. ✅ **Manager Memory Scope**: **ANSWERED** - Defer to Mastra. Research Mastra documentation to understand memory scoping in Agent Networks.

2. **Network Event Transformation**: When transforming Mastra network events to SSE format, should we include all event types or filter to only user-relevant ones? What's the event payload structure? **→ RESEARCH NEEDED: See 01B research log**

3. **Sub-Agent Loading Performance**: If a manager has 10+ sub-agents, should we load all configs upfront or lazy-load on first delegation? What's the performance impact? **→ RESEARCH NEEDED: See 01B research log**

4. **Manager-to-Manager Delegation**: The roadmap says this is "out of scope" but should we design the architecture to support it later (e.g., manager config allows manager IDs in subAgentIds)?

5. **Team Tab Data Source**: Should the Team tab fetch sub-agent data from the agent API or cache it in manager config? How do we handle sub-agents that are deleted after manager creation?

---

## Browser Automation

### 01-Authenticated-Sessions.md

1. ✅ **Profile Expiration Handling**: **RESEARCH NEEDED** - Focus on what Anchor provides. Research Anchor Browser documentation for profile expiration detection. See 01B research log.

2. ✅ **Profile Deletion Scope**: **RESEARCH NEEDED** - Research Anchor API for profile deletion. See 01B research log.

3. ✅ **Profile Name Conflicts**: **RESEARCH NEEDED** - Research Anchor's profile naming and conflict handling. See 01B research log.

4. ✅ **Migration Strategy**: **RESEARCH NEEDED** - Research Anchor profile migration patterns. See 01B research log.

5. ✅ **Profile Save Timing**: **RESEARCH NEEDED** - Research Anchor's profile persistence API to understand save timing. See 01B research log.

### 01A-Authenticated-Sessions-Task.md

1. ✅ **Anchor Profile Listing API**: **RESEARCH NEEDED** - Research Anchor SDK documentation for profile listing methods. See 01B research log.

2. **Profile Metadata Storage**: Should profile metadata (name, description, lastUsed) be stored in a single JSON file or per-profile files? What's the structure of `anchor-profiles.json`?

3. ✅ **Session Persistence Flag**: **RESEARCH NEEDED** - Research Anchor's `persist` flag behavior and scope. See 01B research log.

4. ✅ **Error Recovery**: **RESEARCH NEEDED** - Research Anchor API error handling patterns. See 01B research log.

5. ✅ **Profile Update vs Create**: **RESEARCH NEEDED** - Research Anchor's profile update/versioning API. See 01B research log.

### 02-Tasks-API.md

1. **Task Code Generation**: Should we provide code templates/boilerplate in the UI, or require users to write TypeScript from scratch? What's the onboarding experience for non-developers?

2. **Task Input Validation**: When defining task inputs, should we validate that all inputs with `ANCHOR_` prefix are actually used in the code? Or just validate the prefix format?

3. **Task Versioning Strategy**: When a user updates task code, should we create a new version automatically, or require explicit "Deploy" action? Can users have multiple draft versions?

4. ✅ **Async Execution Monitoring**: **RESEARCH NEEDED** - Research Anchor Tasks API for async execution monitoring (polling vs webhooks). See 02B research log.

5. ✅ **Task Failure Handling**: **RESEARCH NEEDED** - Research Anchor Tasks API for failure handling and retry strategies. See 02B research log.

### 02A-Tasks-API-Task.md

1. **Code Editor Choice**: Should we use Monaco Editor (VS Code editor), CodeMirror, or a simple textarea? What's the tradeoff between features and bundle size?

2. ✅ **Task Code Size Limits**: **RESEARCH NEEDED** - Research Anchor Tasks API documentation for code size limits. See 02B research log.

3. **Input Schema Generation**: Should we auto-generate input schemas from code analysis (parsing `process.env.ANCHOR_*`), or require manual input definition? Can we do both?

4. **Execution History Retention**: How many execution records should we keep per task? Last 50? Last 100? Should this be configurable per task?

5. ✅ **Task Deletion Impact**: **RESEARCH NEEDED** - Research Anchor Tasks API for task deletion behavior with active executions. See 02B research log.

### 03-Stagehand-Integration.md

1. **Stagehand vs Anchor Agent Toggle**: Should users be able to switch modes mid-conversation, or is mode selection per-session? Can both modes be active simultaneously?

2. ✅ **CDP Connection Lifecycle**: **RESEARCH NEEDED** - Research Stagehand documentation for CDP connection patterns. See 03B research log.

3. ✅ **Schema Format Conversion**: **RESEARCH NEEDED** - Research Stagehand API for schema format requirements (Zod vs JSON Schema). See 03B research log.

4. **Stagehand Error Recovery**: If a Stagehand action fails (e.g., element not found), should we automatically fall back to Anchor agent mode, or show an error and let user decide?

5. **Cost Tracking**: Stagehand uses the user's LLM (not Anchor's). Should we track and display costs per action, or is this out of scope? How do users know they're being charged?

### 03A-Stagehand-Integration-Task.md

1. ✅ **Stagehand Package Availability**: **RESEARCH NEEDED** - Research Stagehand npm package availability and installation. See 03B research log.

2. ✅ **Instance Caching Strategy**: **RESEARCH NEEDED** - Research Stagehand documentation for instance lifecycle and best practices. See 03B research log.

3. ✅ **JSON Schema to Zod Conversion**: **RESEARCH NEEDED** - Research Stagehand API to understand schema format requirements. See 03B research log.

4. ✅ **Observe Result Format**: **RESEARCH NEEDED** - Research Stagehand `observe()` method return structure. See 03B research log.

5. ✅ **Stagehand Initialization Timing**: **RESEARCH NEEDED** - Research Stagehand initialization patterns and CDP connection requirements. See 03B research log.

### 04-Workflow-Integration.md

1. **Browser Session Per Workflow Run**: Should each workflow run create a new browser session, or can multiple browser steps in the same workflow share one session? What about multiple workflows running simultaneously?

2. **Profile Selection Scope**: Should browser profile selection be at workflow level (all browser steps use same profile) or step level (each step can use different profile)? What's the UX for this?

3. **Browser Step Failure Strategy**: If a browser step fails (e.g., page not found), should the workflow continue to next step, retry the step, or fail the entire workflow? Is this configurable?

4. **File Upload Handling**: For "fill_form" browser steps, how do we handle file uploads? Should file paths be workflow inputs, or do we need a file storage system first?

5. **Browser Step Output Format**: What's the exact structure of browser step outputs? Should "extract" always return JSON matching the schema, or can it return partial matches? How do we handle extraction failures?

### 04A-Workflow-Integration-Task.md

1. **Session Lifecycle Management**: Should browser sessions be created at workflow start and destroyed at workflow end, or can sessions persist across multiple workflow runs? What's the cleanup strategy?

2. **Browser Step Code Generation**: When transpiling browser steps, should the generated code import from a shared `browser-step-executor` module, or inline the execution logic? What's the transpilation pattern?

3. **Error Propagation**: If a browser step throws an error, should it propagate as a workflow step failure, or be caught and returned as a structured error in step output? How does this affect workflow error handling?

4. **Browser Step Input Binding**: Can browser step inputs bind to outputs from non-browser steps (e.g., LLM step output → browser navigate URL)? Should we validate these bindings at transpile time?

5. **Multiple Browser Steps Efficiency**: If a workflow has 5 browser steps in sequence, should we reuse the same browser session or create new ones? What's the performance vs. isolation tradeoff?

---

## Chat File Uploads

### 01-Chat-File-Uploads.md

1. **File Persistence Duration**: Should uploaded files be stored permanently (linked to thread), deleted after conversation ends, or deleted after N days? What's the storage cost consideration?

2. **Document Extraction Library Choice**: For PDF extraction, should we use `pdf-parse` (simpler) or `pdfjs-dist` (more features)? For DOCX, `mammoth` (HTML output) or `docx` (structured)? What are the tradeoffs?

3. **Image Format Decision**: Should images be passed to Mastra as URLs (requires storage) or base64 (larger payloads but no storage)? What's the size threshold for this decision?

4. **File Limits Configuration**: The roadmap mentions "5 files per message" - should this be configurable per agent, or a global limit? What about total size limits (50MB mentioned)?

5. **Upload Progress UX**: For large files (10MB PDFs), should we show upload progress, or is the upload fast enough to not need it? What's the UX for upload failures?

### 01-Chat-File-Uploads-Task.md

1. **File Upload Endpoint Timing**: Should files be uploaded immediately when selected, or only when the message is sent? What if user selects files but then cancels the message?

2. **Document Text Injection Method**: Should extracted document text be injected as a separate message part, appended to user's text message, or sent as a system message before user message? What's the agent's view?

3. **File Type Validation**: Should we validate file types by extension, MIME type, or both? What happens if a user renames a `.exe` to `.pdf` - do we trust the extension or check MIME?

4. **Multiple File Upload UX**: When uploading 3 files, should they upload sequentially or in parallel? What if one fails - do we show partial success or fail the entire message?

5. **File Attachment Display**: In message history, should file attachments show thumbnails (for images), file icons (for docs), or both? Should users be able to download/view files from history?

---

## Planner

### 01-Planner-System.md

1. **Chat Template Variable Discovery**: What variables are available in chat templates? Should we auto-detect available variables based on trigger type, or provide a fixed list? How do users discover new variables?

2. **Workflow Input Mapping Strategy**: For event triggers executing workflows, should we pass the entire event payload as workflow input, or require explicit field mapping? What if the workflow inputSchema doesn't match event structure?

3. **Chat Thread Management**: Should scheduled jobs create new chat threads for each execution, or reuse an existing thread? What if the thread doesn't exist yet - create it automatically?

4. **Error Notification Method**: When a scheduled job or event trigger fails, how should users be notified? In-app notification, email, or both? Should this be configurable per job/trigger?

5. **Inngest Dev Setup**: For local development, should we provide Docker Compose setup for Inngest, or expect developers to run Inngest cloud? What's the onboarding experience?

### 01-Planner-System-Task.md

1. **Template Variable Replacement Timing**: Should template variables be replaced server-side before sending to agent, or passed as-is and let the agent handle replacement? What about nested variables like `{user.profile.email}`?

2. **Webhook URL Configuration**: How do we handle webhook URLs in dev (localhost) vs prod? Should we use environment variables, or dynamically construct based on `NEXT_PUBLIC_BASE_URL`? What about ngrok for dev?

3. **Job Execution History**: The roadmap says execution history is "out of scope" but users might want to see if a job ran. Should we at least store last execution time/status, or completely omit this?

4. **Trigger Filter Syntax**: For Composio trigger filters, should we support JSON conditions, a visual filter builder, or both? What's the complexity threshold for JSON vs UI?

5. **Concurrent Job Execution**: If a scheduled job is still running when the next scheduled time arrives, should we skip the next execution, queue it, or run in parallel? What's the expected behavior?

---

## RAG Integration

### 01-RAG-for-Records-and-Docs.md

1. **RAG Retrieval Timing**: Should RAG context be retrieved for every user message automatically, or only when the query seems relevant? How do we classify "relevant" - keyword matching, LLM classification, or always retrieve?

2. **Context Injection Method**: Should RAG context be injected into the system prompt (background context), added as a message part (explicit context), or both? What's the token limit consideration?

3. **Chunk Count Per Source**: The roadmap mentions "3-5 chunks per source" - should this be configurable per agent/table, or a global setting? What if a table has 1000 rows - do we still only retrieve 3-5?

4. **Incremental Indexing Detection**: For records, how do we efficiently detect which rows changed? Should we compare row counts, timestamps, content hashes, or use a change log? What's the performance impact?

5. **Vector Store Location**: Should vector stores be co-located with records/docs (`_tables/records/[tableId]/vectors.db`), or centralized (`_tables/rag/vectors/[indexName].db`)? What's the backup/restore strategy?

### 01-RAG-for-Records-and-Docs-Task.md

1. **Embedding Model Configuration**: Should the embedding model be configurable per agent/table, or a global setting? What if a user wants to use a different model for different content types?

2. **Chunking Strategy Parameters**: The task mentions "512 tokens, 50 overlap" - should these be configurable, or fixed? What about different chunking strategies (sentence-based, paragraph-based) for different content?

3. **RAG Context Token Limits**: If RAG retrieval returns 10 chunks of 500 tokens each, that's 5000 tokens. Should we truncate, summarize, or limit chunk count to stay within token budgets? What's the max context size?

4. **Index Rebuilding Strategy**: If a user wants to rebuild an index (e.g., after changing chunking strategy), should this be a manual action or automatic? How long does re-indexing take for 10k rows?

5. **Multi-Source Query Ordering**: When querying multiple RAG sources, should results be interleaved by relevance score, or grouped by source? How do we handle sources with different relevance thresholds?

---

## Records Consolidation

### 01-Records-and-Docs-Consolidation.md

1. **Root Folder Naming**: What should the root folder be called in the UI? "Root", "All Items", "Home", or just show items directly without a folder concept? What's the mental model?

2. **Migration Execution Timing**: Should migration happen automatically on first page load, require an explicit "Migrate" button, or run as a background job? What if migration fails partway through?

3. **URL Redirect Strategy**: Should existing `/records/[tableId]` URLs redirect to `/records/folder/_root/[tableId]`, or should we maintain backward compatibility by supporting both URL formats?

4. **Folder Depth Limits**: The roadmap mentions "10 levels" as a reasonable limit - should we enforce this hard limit, show a warning, or allow unlimited depth? What's the performance impact of deep nesting?

5. **Item Name Uniqueness**: Can items have the same name in different folders (e.g., "Resume.md" in both "Job Applications" and "Personal" folders), or must names be globally unique? What about within the same folder?

### 01-Records-and-Docs-Consolidation-Task.md

1. **Folder Path Parsing**: For URLs like `/records/folder/job-applications/research/market-analysis`, how do we parse the folder path? Should folder IDs be in the path, or folder slugs? What if a folder is renamed?

2. **Migration Rollback Strategy**: If migration fails or user wants to rollback, should we keep the old structure intact, or is migration one-way? How do we handle partial migrations?

3. **Catalog API Performance**: For folders with 100+ items, should the catalog API return all items, paginate, or lazy-load? What's the performance impact of building the full folder tree?

4. **Item Type Detection**: When scanning a folder for items, how do we distinguish between tables (have `schema.json`) and documents (have `content.md`)? What if both exist (edge case)?

5. **Breadcrumb Path Building**: Should breadcrumbs show folder names or folder IDs? If a folder is renamed, should breadcrumbs update, or show the name at time of navigation? How do we handle deleted parent folders?

---

## Workflow State Injection

### 01-Workflow-State-Injection.md

1. **Fixed Inputs vs Runtime Inputs Precedence**: The roadmap says "runtime takes precedence" - but what if a user explicitly wants to prevent runtime override? Should we support "locked" fixed inputs that can't be overridden?

2. **Initial State Configuration UI**: Should `initialState` be configurable in the UI (like fixed inputs), or only set programmatically? If UI-configurable, how do users define the state schema structure?

3. **Trigger Data Auto-Mapping Rules**: For auto-mapping trigger data to workflow inputs, what are the exact matching rules? Case-sensitive? Partial matches? Nested field access (e.g., `event.data.message`)?

4. **Fixed Inputs Validation Timing**: Should fixed inputs be validated when saved (in UI), when workflow is executed, or both? What if a workflow's `inputSchema` changes after fixed inputs are configured?

5. **State Schema Extraction**: How do we extract `stateSchema` from transpiled workflows? Should it be stored in `workflow.json` metadata, or extracted from the TypeScript workflow definition at runtime?

### 01A-Workflow-State-Injection-Task.md

1. **Fixed Inputs Storage Format**: Should `fixedInputs` store raw values or stringified JSON? For complex types (objects, arrays), how do we ensure type safety when merging with runtime inputs?

2. **Trigger Data Mapping UI Complexity**: For event triggers, should the input mapping UI show all possible trigger fields upfront, or dynamically load based on trigger type? How do we handle nested/structured trigger data?

3. **Initial State Type Safety**: When setting `initialState`, should we validate it against the workflow's `stateSchema` at configuration time, or only at execution time? What if `stateSchema` is missing or invalid?

4. **Workflow Binding Update Strategy**: When updating a workflow binding's fixed inputs, should we validate all fixed inputs against the current `inputSchema`, or only validate changed fields? What if validation fails?

5. **Scheduled Job Input Configuration**: For scheduled jobs executing workflows, should input configuration be the same UI as fixed inputs, or a simplified version? Can scheduled jobs override fixed inputs from bindings?

---

## Workflow Visibility

### 01-Workflow-Observability.md

1. **Workflow Run Persistence**: If a workflow is still running when the user closes the browser, should we persist run state and restore it on page load, or only show workflows active during the current session?

2. **SSE Reconnection Strategy**: If the SSE connection drops (network issue, server restart), should we auto-reconnect, queue missed events, or show an error? How do we handle events that occurred during disconnection?

3. **Panel Auto-Close Behavior**: Should the observability panel auto-close when all workflows complete, stay open for user review, or remember user preference? What's the default behavior?

4. **Multiple Workflow Performance**: If 5 workflows are running simultaneously, each streaming events, should we throttle updates, batch events, or stream all in real-time? What's the performance impact on chat UI?

5. **Step Output Size Limits**: If a workflow step returns 10MB of data, should we truncate it in the UI, show a summary, or allow full expansion? What's the UX for very large outputs?

### 01-Workflow-Observability-Task.md

1. **Streaming vs Tool Compatibility**: When refactoring from `run.start()` to `run.stream()`, how do we maintain backward compatibility with the tool wrapper? Should the tool still return a final result synchronously, or become async?

2. **SSE Connection Scoping**: Should SSE connections be scoped per thread, per agent, or per user? If a user has multiple chat tabs open, should all receive the same workflow events, or only the active tab?

3. **Workflow Run ID Tracking**: How do we link workflow `runId` to chat messages? Should `runId` be stored in message metadata, or tracked separately? What if a workflow is invoked outside of chat?

4. **Event Queue Management**: If the frontend disconnects and reconnects, should we queue events and replay them, or only show events from reconnection time? How do we handle event ordering?

5. **Panel State Persistence**: Should panel state (open/closed, expanded workflows, expanded steps) persist across page refreshes, or reset? Should this be per-thread, per-agent, or global user preference?

---

## Summary

Total documents reviewed: 24
- Roadmap documents: 12
- Task documents: 12

Total questions generated: 120 (average 5 per document)

**Answered Questions:** 15 (marked with ✅)
**Research Needed:** 25+ (marked with → RESEARCH NEEDED: See XXB research log)

These questions should be answered during implementation planning to ensure each feature is fully specified and deterministic.

---

## Research Logs Created

Research logs (01B documents) have been created for features using external APIs:
- ✅ `browser-automation/01B-Authenticated-Sessions-Research.md` (Anchor Browser)
- ✅ `browser-automation/02B-Tasks-API-Research.md` (Anchor Browser)
- ✅ `browser-automation/03B-Stagehand-Integration-Research.md` (Stagehand)
- ✅ `agent-networks/01B-Manager-Agents-Research.md` (Mastra Agent Networks)
- ✅ `workflow-state-injection/01B-Workflow-State-Injection-Research.md` (Mastra Workflow State)
- ✅ `workflow-visibility/01B-Workflow-Observability-Research.md` (Mastra Workflow Streaming)
- ✅ `planner/01B-Planner-System-Research.md` (Inngest + Composio)
- ✅ `rag-integration/01B-RAG-Integration-Research.md` (Mastra RAG)

Research logs focus on external API questions that require documentation research.


