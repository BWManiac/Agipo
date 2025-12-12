# Authenticated Sessions UXD

**Created:** December 2024
**Status:** Phase 1 Design

---

## Overview

These mockups show the UI changes needed for Phase 1 of Authenticated Sessions - allowing users to create persistent browser profiles that save login state.

## Mockup Files

| File | Purpose |
|------|---------|
| `01-new-session-dialog.html` | Updated New Session dialog with 3 options: No profile, Use existing, Create new |
| `02-profile-picker-dropdown.html` | Profile dropdown showing both "Saved Session" and "Credential" profile types |
| `03-session-toolbar-with-profile.html` | Session toolbar showing active profile badge |
| `04-end-session-confirmation.html` | Confirmation dialog when ending session with profile |

---

## User Flow

```
1. User opens "New Session" dialog
2. User selects "Create new profile"
3. User enters profile name: "linkedin-work"
4. User clicks "Start Session"
5. Browser opens, user manually logs into LinkedIn
6. User clicks "End Session"
7. Confirmation shows "Save to linkedin-work?"
8. Profile saved to Anchor
9. Next time: User selects "linkedin-work" → starts logged in
```

---

## Key Design Decisions

### Profile Types

- **Saved Session** (green badge) - Browser state saved on Anchor (cookies, logins)
- **Credentials** (blue badge) - Local username/password for auto-fill
- **May Expire** (amber badge) - Profile not used in 30+ days

### Profile Naming

- User-provided names
- Lowercase letters, numbers, dashes only (e.g., `linkedin-work`)
- Cannot be changed after creation

### Session Behavior

- "No profile" = fresh browser, nothing saved
- "Use existing" = loads saved state, updates profile on end
- "Create new" = fresh browser, saves as new profile on end
