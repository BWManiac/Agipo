# Authenticated Sessions & Persistent Profiles

**Status:** Draft
**Priority:** P0
**North Star:** Enable users to log into job sites (LinkedIn, Indeed) once and stay logged in across sessions — critical for the Job Application Agent

---

## Problem Statement

Currently, our browser automation playground stores credentials locally and injects them when needed. However, this doesn't preserve session state (cookies, tokens, localStorage) across browser sessions. Users must re-authenticate every time they create a new session.

Anchor Browser provides native profile persistence that stores authenticated session state server-side. When a user logs into LinkedIn manually, Anchor can save that entire browser state and restore it in future sessions — no credential injection needed.

**The Gap:** We're not using Anchor's native profile persistence. We built our own credential storage, but it can't replicate the full authenticated state that sites like LinkedIn require (cookies, tokens, 2FA state, etc.).

---

## User Value

- **Log in once, stay logged in forever** — No repeated authentication flows
- **Handle complex auth** — Sites with 2FA, CAPTCHAs, or multi-step login work automatically after initial manual login
- **Faster session startup** — No need to re-authenticate, sessions start in logged-in state
- **More reliable automation** — Session state is preserved exactly as the browser had it

---

## User Flows

### Flow 1: Create Persistent Profile via Manual Login

```
1. User clicks "New Session" with "Create new profile" option
2. User names the profile (e.g., "LinkedIn - Work Account")
3. Session starts with persist: true flag
4. User manually logs into LinkedIn in the live browser view
5. User clicks "Save Profile" when done authenticating
6. Anchor saves the full browser state (cookies, localStorage, etc.)
7. Profile appears in profile picker for future sessions
```

### Flow 2: Reuse Authenticated Profile

```
1. User clicks "New Session"
2. User selects "LinkedIn - Work Account" from profile dropdown
3. Session starts with saved profile
4. Browser opens already logged into LinkedIn
5. User can immediately start automation tasks
```

### Flow 3: Update Profile After Session Changes

```
1. User creates session with existing profile
2. During session, user updates account settings or accepts new terms
3. User clicks "Update Profile" to save current state
4. Profile is updated with new browser state
5. Future sessions include these changes
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/browser-automation/sessions/` | Session creation with profile options | `route.ts` |
| `app/api/browser-automation/services/` | Anchor client wrapper | `anchor-client.ts` |
| `app/api/browser-automation/profiles/` | Current profile storage (credential-based) | `route.ts`, `[profileName]/route.ts` |
| `app/api/browser-automation/services/` | Profile storage service | `profile-storage.ts` |
| `app/(pages)/experiments/browser-automation/` | Playground UI | `components/Profiles/`, `store/slices/profilesSlice.ts` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Profile persistence location | Anchor server-side (not local) | Anchor manages browser state; we just reference profile names |
| Profile naming | User-defined names mapped to Anchor profile IDs | Better UX than exposing Anchor's internal IDs |
| Credential storage | Keep existing for fallback, but prefer Anchor profiles | Some sites may still need credential injection |
| Profile creation flow | Manual login then save | More reliable than trying to automate complex auth flows |

---

## Constraints

- **Anchor API dependency** — Profile persistence is an Anchor feature; we're building on their infrastructure
- **Existing profile system** — We have a credential-based profile system that works differently; need to reconcile or run parallel
- **Profile data lives on Anchor** — We only store metadata locally (name, description, last used); actual session state is on Anchor
- **Manual login required** — Users must manually authenticate; we can't automate initial login for security-sensitive sites

---

## Success Criteria

- [ ] User can create a new session with `persist: true` flag
- [ ] User can manually log into a site and save the profile
- [ ] User can create a new session with a saved profile and start already authenticated
- [ ] Profile list shows Anchor-persisted profiles (not just local credential profiles)
- [ ] LinkedIn login persists across sessions (primary test case)
- [ ] Profile metadata (name, description, last used) stored locally
- [ ] UI clearly distinguishes between "new profile" and "existing profile" flows

---

## Out of Scope

- **Automated login flows** — Users must manually authenticate; we're not automating login
- **Credential injection** — Keep existing system but don't enhance it
- **Profile sharing** — Profiles are user-specific
- **Profile export/import** — Not needed for MVP

---

## Open Questions

- How do we handle profile deletion? (Delete local metadata + tell Anchor to delete?)
- Should we migrate existing credential-based profiles to Anchor profiles?
- How do we handle profile conflicts if user has same name locally and on Anchor?
- What's the UX for "profile expired" (session cookies expired)?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| New Session Dialog (Updated) | Profile creation flow | "Create new profile" vs "Use existing profile" toggle, profile name input, persist checkbox |
| Profile Save Prompt | Save profile after login | Modal asking "Save this session as a profile?", profile name input, description field |
| Profile Picker (Updated) | Select from Anchor profiles | List of saved profiles with last used date, profile type indicator (Anchor vs local) |
| Profile Management Panel | View/delete profiles | List of profiles, delete button, profile metadata (created, last used, type) |

### Mockup Location

```
_docs/UXD/Pages/experiments/browser-automation/
├── authenticated-sessions/
│   ├── new-session-dialog.html
│   ├── profile-save-prompt.html
│   ├── profile-picker.html
│   └── profile-management.html
```

---

## References

- [Anchor Browser Authentication Docs](https://docs.anchorbrowser.io/essentials/authentication-and-identity)
- Existing implementation: `app/api/browser-automation/services/profile-storage.ts`
- Task 21 Product Spec: `_docs/_tasks/_completed/21-browser-automation/00-Product-Spec.md`
