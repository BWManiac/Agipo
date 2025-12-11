# Stagehand Integration

**Status:** Draft
**Priority:** P1
**North Star:** Provide precise, AI-powered element interaction for complex form filling and data extraction — critical for reliable job application automation

---

## Problem Statement

Currently, we use Anchor's `agent.task()` API for natural language browser control. This is high-level and convenient, but:

1. **Black box execution** — We describe what we want, Anchor figures out how
2. **Less control** — Can't fine-tune element selection or extraction schemas
3. **No structured output** — Results are freeform text, not typed data

Stagehand is an AI-powered browser automation framework that provides:
- `act()` — AI-powered element interaction with natural language
- `extract()` — Structured data extraction with Zod schemas
- `observe()` — Understand page state before acting

**The Gap:** We need to understand when to use Stagehand vs Anchor's native agent, and potentially offer both as options for different use cases.

---

## User Value

- **Precise element interaction** — "Click the Apply button" works even on complex pages
- **Structured data extraction** — Get typed JSON, not freeform text
- **Page state awareness** — Know what's on the page before acting
- **Schema validation** — Extraction results validated against Zod schemas
- **Debugging visibility** — See exactly which elements Stagehand identifies

---

## User Flows

### Flow 1: Extract Job Details with Schema

```
1. User navigates to a job posting page
2. User defines extraction schema:
   {
     title: string,
     company: string,
     location: string,
     salary: string | null,
     requirements: string[]
   }
3. User clicks "Extract with Schema"
4. Stagehand analyzes page and extracts matching data
5. User receives typed JSON matching schema
6. Validation errors shown if schema doesn't match
```

### Flow 2: Fill Complex Form

```
1. User navigates to job application form
2. User provides data to fill:
   {
     firstName: "John",
     lastName: "Doe",
     email: "john@example.com",
     resume: "[file path]"
   }
3. User clicks "Fill Form"
4. Stagehand identifies form fields
5. Stagehand fills each field with matching data
6. User sees confirmation of filled fields
```

### Flow 3: Observe Before Acting

```
1. User navigates to new page
2. User clicks "Observe Page"
3. Stagehand analyzes page and returns:
   - Available actions (buttons, links, forms)
   - Data that can be extracted
   - Page structure summary
4. User uses this info to decide next action
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/browser-automation/services/` | Service layer for browser | `anchor-client.ts`, `anchor-agent.ts` |
| `app/api/browser-automation/sessions/[sessionId]/` | Session-specific operations | `chat/route.ts` |
| Stagehand docs | External reference | [docs.anchorbrowser.io/integrations/stagehand](https://docs.anchorbrowser.io/integrations/stagehand) |
| `app/(pages)/experiments/browser-automation/` | Playground UI | `components/ChatPanel/` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stagehand vs Anchor Agent | Offer both, user chooses | Different tools for different jobs |
| LLM for Stagehand | Use Gemini (same as Anchor uses) | Consistency, already configured |
| Schema definition | Zod schemas in UI | Type-safe, familiar to TS developers |
| CDP connection | Through Anchor session | Stagehand connects to Anchor's browser instance |

---

## Constraints

- **CDP URL required** — Stagehand connects via Chrome DevTools Protocol
- **LLM costs** — Stagehand uses your LLM, not Anchor's
- **Session-bound** — Stagehand instance tied to browser session lifecycle
- **No recording** — Stagehand actions may not appear in Anchor's recording

---

## Success Criteria

- [ ] Can initialize Stagehand with Anchor session's CDP URL
- [ ] Can execute `act()` commands via UI
- [ ] Can execute `extract()` with Zod schema via UI
- [ ] Can execute `observe()` and see results
- [ ] Stagehand actions logged in action log
- [ ] Schema validation errors displayed clearly
- [ ] User can switch between Anchor agent and Stagehand mode

---

## Out of Scope

- Custom LLM provider selection (hardcode to Gemini initially)
- Stagehand for non-browser contexts
- Training/fine-tuning Stagehand models
- Stagehand caching/optimization

---

## Open Questions

- How do we initialize Stagehand server-side vs client-side?
- Should Stagehand be a separate service or integrated into anchor-agent?
- How do we handle Stagehand errors gracefully?
- Can Stagehand actions trigger in parallel with Anchor agent?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Mode Switcher | Toggle between Anchor and Stagehand | Toggle in chat header, mode indicator |
| Extract Schema Editor | Define Zod schemas for extraction | Schema editor, preview, validation |
| Observe Results | Display page analysis | List of actions, extractable data, page structure |
| Action Log (Stagehand) | Show Stagehand-specific actions | Different badge for Stagehand vs Anchor actions |

### Mockup Location

```
_docs/UXD/Pages/experiments/browser-automation/
├── stagehand/
│   ├── mode-switcher.html
│   ├── extract-schema-editor.html
│   ├── observe-results.html
│   └── action-log-stagehand.html
```

---

## References

- [Anchor Browser Stagehand Integration](https://docs.anchorbrowser.io/integrations/stagehand)
- [Stagehand GitHub](https://github.com/browserbase/stagehand)
- Existing implementation: `app/api/browser-automation/services/anchor-agent.ts`
