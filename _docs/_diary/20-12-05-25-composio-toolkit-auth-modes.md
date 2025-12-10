# Diary Entry 20: Composio Toolkit Authentication Modes

**Date:** 2025-12-05  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

Composio toolkits have different **authentication modes** that determine whether users need to create a connection before using tools. This is poorly documented but critical for building a good UX. We discovered this through SDK exploration and testing.

---

## 2. Implementation Summary

### The Four Authentication Modes

| Mode | Description | User Action Required | Example Toolkits |
|------|-------------|---------------------|------------------|
| `NO_AUTH` | Tools work without any authentication | None - just use them | `browser_tool` |
| `API_KEY` | Requires user's API key | Enter API key once | `browserbase_tool`, `hyperbrowser` |
| `BEARER_TOKEN` | Requires bearer token | Enter token once | `browserless` |
| `OAUTH2` | OAuth flow with redirect | Complete OAuth flow | `gmail`, `github`, `slack` |

### How to Check a Toolkit's Auth Mode

```typescript
const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const toolkit = await client.toolkits.get("browser_tool");
const authMode = toolkit.authConfigDetails?.[0]?.mode;
// Returns: "NO_AUTH" | "API_KEY" | "BEARER_TOKEN" | "OAUTH2" | etc.
```

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Mode Detection | Check `authConfigDetails[0].mode` | Composio SDK structure |
| NO_AUTH Handling | No connection required | Platform-provided tools |
| UX Pattern | Different flows per auth mode | Better user experience |

---

## 4. Technical Deep Dive

### NO_AUTH Toolkits: The Hidden Gem

NO_AUTH toolkits are **platform-provided tools** that work without any user authentication. Composio hosts the infrastructure and makes it available to all users.

**The `browser_tool` Toolkit:**
- `BROWSER_TOOL_FETCH_WEBPAGE` - Fetch and parse webpage content (returns markdown)
- `BROWSER_TOOL_COPY_SELECTED_TEXT` - Copy text from page to clipboard
- `BROWSER_TOOL_DRAG_AND_DROP` - Drag and drop operations
- `BROWSER_TOOL_KEYBOARD_SHORTCUT` - Execute keyboard shortcuts
- `BROWSER_TOOL_GET_CLIPBOARD` - Read clipboard content
- + 13 more tools

**Executing NO_AUTH Tools:**
```typescript
// NO_AUTH tools don't need connectedAccountId!
const result = await client.tools.execute("BROWSER_TOOL_FETCH_WEBPAGE", {
  userId: "any_user_id",
  arguments: { url: "https://example.com" },
  dangerouslySkipVersionCheck: true,
  // Note: NO connectedAccountId parameter
});
```

---

## 5. Lessons Learned

- **Auth modes are critical:** Determines UX flow (redirect vs modal vs no action)
- **NO_AUTH tools are powerful:** Platform-provided tools don't require user setup
- **SDK exploration pays off:** Documentation gaps require experimentation
- **Toolkit differences matter:** Browserbase (infrastructure) vs Browserless (automation)

---

## 6. Next Steps

- [ ] Update UI to detect and handle different auth modes
- [ ] Add NO_AUTH tools to agent capabilities automatically
- [ ] Document auth mode patterns for future integrations
- [ ] Improve error messages for auth mode mismatches

---

## References

- **Related Diary:** `19-ApiKeyConnectionsAndToolCategories.md` - API key connections
- **Composio Docs:** [Toolkit Authentication](https://docs.composio.dev/)

---

**Last Updated:** 2025-12-05
