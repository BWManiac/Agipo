# Task: Authenticated Sessions & Persistent Profiles

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/browser-automation/01-Authenticated-Sessions.md`  
**Research Log:** `_docs/Product/ROADMAP/browser-automation/01B-Authenticated-Sessions-Research.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation
✅ **Anchor Browser persist flag is the right approach** - Server-side profile persistence more reliable than local credential injection
✅ **Profile metadata tracking locally is necessary** - Anchor SDK doesn't expose profile listing API (based on docs)
✅ **Separate profile types (anchor vs local) maintains backward compatibility** - Users can still use credential profiles
✅ **SaveProfilePrompt as explicit action is safer** - Prevents accidental profile overwrites

### Current State Analysis
- `anchor-client.ts` already accepts profileName but doesn't pass persist flag
- Profile storage tracks local credentials but not Anchor profile metadata
- Browser automation UI exists with profile picker but no persist support
- Sessions store tracks active sessions but not persist status

## File Impact Analysis

The following files will be impacted:

### CREATE (New Files)
- `app/api/browser-automation/types.ts` - Centralized type definitions
- `app/api/browser-automation/profiles/anchor/route.ts` - Anchor profile listing endpoint
- `app/(pages)/experiments/browser-automation/components/SessionsSidebar/SaveProfilePrompt.tsx` - Save profile modal

### MODIFY (Existing Files)
- `app/api/browser-automation/sessions/route.ts` - Add persist flag support
- `app/api/browser-automation/services/anchor-client.ts` - Pass persist to SDK
- `app/api/browser-automation/services/profile-storage.ts` - Add Anchor metadata tracking
- `app/api/browser-automation/profiles/route.ts` - Merge profile types
- `app/(pages)/experiments/browser-automation/store/slices/profilesSlice.ts` - Add profile types
- `app/(pages)/experiments/browser-automation/store/slices/sessionsSlice.ts` - Track persist status
- `app/(pages)/experiments/browser-automation/components/Profiles/ProfileDialog.tsx` - Add persist option
- `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionDialog.tsx` - Add profile creation flow

## Deterministic Decisions

### Storage Decisions
- **Anchor Profile Metadata**: `_tables/browser-profiles/anchor-profiles.json`
- **Profile Type Field**: Add `type: 'anchor' | 'local'` to distinguish profiles
- **No Credential Migration**: Keep credential profiles separate from Anchor profiles
- **Profile Name Format**: Use kebab-case for Anchor profile names (e.g., "linkedin-work")

### Implementation Decisions
- **Persist Default**: Default to `persist: false` unless explicitly creating new profile
- **Profile Listing**: Track Anchor profiles locally since SDK doesn't expose listing
- **Save Profile Action**: Explicit user action via SaveProfilePrompt, not automatic
- **Profile Conflict**: Prevent duplicate profile names across both types
- **Session Indicators**: Show persist badge on active sessions

### UI/UX Decisions
- **Profile Type Badges**: "Saved Session" (green) for Anchor, "Credentials" (blue) for local
- **Profile Creation**: Radio buttons in NewSessionDialog for profile options
- **Save Prompt Trigger**: Show "Save Profile" button only on persisted sessions
- **Profile Picker Sorting**: Anchor profiles first (more reliable), then local

### Error Handling Decisions
- **Profile Creation Failure**: Show error toast, keep session running
- **Missing Profile**: Fall back to anonymous session if profile not found
- **Persist Flag Failure**: Log warning but continue session without persistence
- **Stale Sessions**: No automatic detection (out of scope), user handles manually

---

## Validation

### Approach Validation
✅ **Anchor Profile persistence is the right approach** - Server-side browser state is more reliable than local credentials
✅ **Persist flag implementation is correct** - Maps directly to Anchor SDK's profile.persist option
✅ **Dual profile type system makes sense** - Keep local credentials for backwards compatibility
✅ **Manual login approach is secure** - Avoids storing sensitive credentials, uses browser's native session

### Technical Feasibility
- Anchor SDK supports `profile.persist` flag in session creation
- Profile state persists server-side at Anchor
- Existing anchor-client.ts just needs minor modifications
- Profile storage can track both types in parallel

## Deterministic Decisions

### Storage Decisions
- **Anchor Profile Metadata**: Store in `_tables/browser-profiles/anchor-profiles.json`
- **Keep Local Profiles**: Maintain existing credential storage for compatibility
- **Profile Type Field**: Add `type: 'anchor' | 'local'` to distinguish
- **No Migration**: Don't auto-convert local profiles to Anchor

### Implementation Decisions
- **Default Persist**: When creating new profile, default `persist: true`
- **Profile Listing**: Track locally which profiles we've created (Anchor may not expose API)
- **Session Toolbar**: Add "Save Profile" button only when session has no profile
- **Profile Names**: Use kebab-case for consistency (e.g., "linkedin-work")

### Error Handling Decisions
- **Profile Name Conflicts**: Return 409 Conflict, suggest alternative name
- **Missing Profile**: Fall back to no-profile session
- **Anchor API Failures**: Log error, proceed without profile
- **Stale Sessions**: Show warning if profile last used > 30 days ago

## Overview

### Goal

Implement Anchor Browser's native profile persistence so users can log into sites once (manually) and stay logged in across sessions. This replaces/augments our current credential-injection approach with server-side session state managed by Anchor.

### Relevant Research

**Anchor Profile API** (from docs):
```javascript
// Create session with persistent profile
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'my-profile',
      persist: true  // Saves browser state when session ends
    }
  }
});

// Reuse profile in new session
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'my-profile'  // Loads saved browser state
    }
  }
});
```

**Current Implementation** (`anchor-client.ts`):
- `createSession()` accepts `profileName` but doesn't use `persist: true`
- Profile passed as `options.browser.profile = { name, persist: true }` but `persist` flag not exposed in our API

**Current Profile Storage** (`profile-storage.ts`):
- Stores credentials locally with AES-256-CBC encryption
- Doesn't interact with Anchor's profile persistence
- Profile metadata in `_tables/browser-profiles/`

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/types.ts` | Create | Centralize browser automation types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/sessions/route.ts` | Modify | Add `persist` flag to session creation | A |
| `app/api/browser-automation/profiles/route.ts` | Modify | Distinguish Anchor profiles from local credential profiles | B |
| `app/api/browser-automation/profiles/[profileName]/route.ts` | Modify | Handle Anchor profile updates and deletion | B |
| `app/api/browser-automation/profiles/anchor/route.ts` | Create | List profiles from Anchor API | B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/services/anchor-client.ts` | Modify | Expose persist flag, add profile listing from Anchor | A |
| `app/api/browser-automation/services/profile-storage.ts` | Modify | Add Anchor profile metadata storage alongside credentials | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/experiments/browser-automation/store/slices/profilesSlice.ts` | Modify | Handle Anchor profiles, add persist state | C |
| `app/(pages)/experiments/browser-automation/store/slices/sessionsSlice.ts` | Modify | Track persist flag on sessions | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/experiments/browser-automation/components/Profiles/ProfileDialog.tsx` | Modify | Add "create persistent profile" flow | C |
| `app/(pages)/experiments/browser-automation/components/Profiles/ProfilePicker.tsx` | Modify | Show Anchor profiles with indicators | C |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionDialog.tsx` | Modify | Add persist toggle, profile creation option | C |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/SaveProfilePrompt.tsx` | Create | Modal to save session as profile | C |

---

## Part A: Backend - Session Persistence

### Goal

Enable session creation with Anchor's `persist: true` flag so browser state is saved when session ends.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/types.ts` | Create | Shared types for browser automation | ~50 |
| `app/api/browser-automation/sessions/route.ts` | Modify | Accept persist flag | +20 |
| `app/api/browser-automation/services/anchor-client.ts` | Modify | Pass persist to Anchor SDK | +15 |

### Pseudocode

#### `app/api/browser-automation/types.ts`

```
export interface CreateSessionRequest {
  profileName?: string
  initialUrl?: string
  persist?: boolean          // NEW: Save browser state when session ends
  createNewProfile?: boolean // NEW: Create new profile with this session
  config?: {
    timeout?: { maxDuration?: number; idleTimeout?: number }
    recording?: boolean
  }
}

export interface AnchorProfile {
  name: string
  type: 'anchor' | 'local'   // Anchor-persisted vs local credentials
  createdAt: string
  lastUsed?: string
  description?: string
}

export interface SessionData {
  id: string
  cdpUrl: string
  liveViewUrl: string
  status: 'starting' | 'running' | 'idle' | 'stopped'
  profileName?: string
  persist?: boolean          // NEW: Is this session persisting?
  createdAt?: string
}
```

#### `app/api/browser-automation/sessions/route.ts` (POST handler changes)

```
POST handler:
├── Parse request body
├── Extract: profileName, initialUrl, persist, createNewProfile, config
├── If createNewProfile && !profileName:
│   └── Return 400: "Profile name required when creating new profile"
├── Build session options:
│   ├── If profileName:
│   │   └── options.browser.profile = {
│   │         name: profileName,
│   │         persist: persist ?? createNewProfile ?? false
│   │       }
│   └── Else:
│       └── No profile options
├── Call anchorClient.createSession(options)
├── Return session data with persist flag included
```

#### `app/api/browser-automation/services/anchor-client.ts` (changes)

```
export interface CreateSessionOptions {
  profileName?: string
  persist?: boolean           // NEW
  initialUrl?: string
  timeout?: { maxDuration?: number; idleTimeout?: number }
  recording?: boolean
}

createSession(options: CreateSessionOptions): Promise<SessionData>
├── Build Anchor SDK options:
│   ├── If options.profileName:
│   │   └── browser: {
│   │         profile: {
│   │           name: options.profileName,
│   │           persist: options.persist ?? false  // NEW
│   │         }
│   │       }
│   └── ... rest of options
├── Call client.sessions.create(anchorOptions)
├── Return session data with persist flag
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Session creation accepts `persist` flag | POST with `persist: true` succeeds |
| AC-A.2 | Anchor receives persist flag | Check Anchor dashboard shows profile persisted |
| AC-A.3 | Session response includes persist status | Response has `persist: true` |
| AC-A.4 | Types file created with shared interfaces | Import works across API routes |

---

## Part B: Backend - Profile Management

### Goal

Add ability to list, track, and manage Anchor-persisted profiles alongside (or replacing) local credential profiles.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/profiles/anchor/route.ts` | Create | List profiles from Anchor | ~60 |
| `app/api/browser-automation/profiles/route.ts` | Modify | Return combined profile list | +30 |
| `app/api/browser-automation/profiles/[profileName]/route.ts` | Modify | Handle Anchor profile deletion | +20 |
| `app/api/browser-automation/services/profile-storage.ts` | Modify | Track Anchor profile metadata | +50 |

### Pseudocode

#### `app/api/browser-automation/profiles/anchor/route.ts`

```
GET /api/browser-automation/profiles/anchor
├── Get Anchor client
├── Call Anchor API to list profiles
│   └── Note: Check if Anchor SDK has profile listing, or use REST API
├── Map to AnchorProfile format:
│   └── { name, type: 'anchor', createdAt, lastUsed }
├── Return profiles array

// Note: Anchor may not expose profile listing via SDK
// May need to track locally which profiles we've created with persist: true
```

#### `app/api/browser-automation/profiles/route.ts` (GET handler changes)

```
GET handler:
├── Fetch local profiles (existing logic)
├── Fetch Anchor profile metadata (from local tracking)
├── Merge lists:
│   ├── Local credential profiles: type = 'local'
│   └── Anchor persisted profiles: type = 'anchor'
├── Sort by lastUsed descending
├── Return combined list with type indicators
```

#### `app/api/browser-automation/services/profile-storage.ts` (additions)

```
// NEW: Track Anchor profiles we've created
const ANCHOR_PROFILES_FILE = '_tables/browser-profiles/anchor-profiles.json'

interface AnchorProfileMeta {
  name: string
  displayName: string
  description?: string
  createdAt: string
  lastUsed?: string
}

registerAnchorProfile(name: string, displayName: string, description?: string): Promise<void>
├── Read anchor-profiles.json (or create if missing)
├── Add new entry: { name, displayName, description, createdAt: now }
├── Write back to file

listAnchorProfiles(): Promise<AnchorProfileMeta[]>
├── Read anchor-profiles.json
├── Return array (empty if file missing)

updateAnchorProfileLastUsed(name: string): Promise<void>
├── Read anchor-profiles.json
├── Find profile by name
├── Update lastUsed to now
├── Write back

deleteAnchorProfile(name: string): Promise<void>
├── Read anchor-profiles.json
├── Remove entry by name
├── Write back
├── Note: This only deletes local metadata; Anchor profile may persist
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | GET /profiles returns both types | Response includes profiles with `type: 'anchor'` and `type: 'local'` |
| AC-B.2 | Anchor profile metadata stored locally | File `anchor-profiles.json` created after profile save |
| AC-B.3 | Profile lastUsed updated on session start | Start session with profile, check lastUsed updated |
| AC-B.4 | Profile deletion removes local metadata | DELETE profile, verify removed from list |

---

## Part C: Frontend - Profile UI

### Goal

Update the playground UI to support creating, selecting, and managing Anchor-persisted profiles.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `store/slices/profilesSlice.ts` | Modify | Handle profile types, fetch Anchor profiles | +40 |
| `store/slices/sessionsSlice.ts` | Modify | Track persist flag on active session | +15 |
| `components/Profiles/ProfileDialog.tsx` | Modify | Add persist option, Anchor profile creation | +50 |
| `components/Profiles/ProfilePicker.tsx` | Modify | Show profile type indicators | +30 |
| `components/SessionsSidebar/NewSessionDialog.tsx` | Modify | Add "create new profile" flow | +40 |
| `components/SessionsSidebar/SaveProfilePrompt.tsx` | Create | Prompt to save session as profile | ~100 |

### Pseudocode

#### `store/slices/profilesSlice.ts` (additions)

```
interface Profile {
  name: string
  displayName: string
  type: 'anchor' | 'local'    // NEW
  description?: string
  credentialCount?: number    // For local profiles
  createdAt: string
  lastUsed?: string
}

interface ProfilesSlice {
  profiles: Profile[]
  // ... existing state
  saveProfilePromptOpen: boolean  // NEW
  pendingProfileSave: {           // NEW
    sessionId: string
    suggestedName: string
  } | null
}

// NEW action
openSaveProfilePrompt(sessionId: string, suggestedName?: string): void
├── Set saveProfilePromptOpen = true
├── Set pendingProfileSave = { sessionId, suggestedName }

// NEW action
saveSessionAsProfile(name: string, displayName: string, description?: string): Promise<void>
├── Get pendingProfileSave.sessionId
├── POST /api/browser-automation/profiles/anchor with { name, displayName, description }
├── Note: Session should already have persist: true
├── Close prompt
├── Refresh profiles list
```

#### `components/SessionsSidebar/NewSessionDialog.tsx` (changes)

```
NewSessionDialog:
├── State:
│   ├── profileOption: 'none' | 'existing' | 'new'
│   ├── selectedProfile: string | null
│   ├── newProfileName: string
│   ├── persist: boolean (default true when creating new)
│   └── initialUrl: string
├── UI:
│   ├── Radio group: "No profile" | "Use existing" | "Create new"
│   ├── If 'existing': ProfilePicker dropdown
│   ├── If 'new':
│   │   ├── Profile name input
│   │   └── Checkbox: "Save browser state (stay logged in)"
│   └── URL input (optional)
├── On submit:
│   ├── If 'new': createSession({ profileName, persist: true, createNewProfile: true })
│   ├── If 'existing': createSession({ profileName: selectedProfile })
│   └── If 'none': createSession({})
```

#### `components/SessionsSidebar/SaveProfilePrompt.tsx`

```
SaveProfilePrompt:
├── Props: open, onClose, sessionId, suggestedName
├── State:
│   ├── name: string (initialized from suggestedName)
│   ├── displayName: string
│   ├── description: string
│   └── isSaving: boolean
├── UI:
│   ├── Dialog with title "Save Session as Profile"
│   ├── Explanation: "Save this browser session so you stay logged in next time"
│   ├── Form:
│   │   ├── Profile ID input (lowercase, dashes only)
│   │   ├── Display name input
│   │   └── Description textarea (optional)
│   ├── Cancel button
│   └── Save button (calls saveSessionAsProfile)
├── On save:
│   ├── Validate name format
│   ├── Call saveSessionAsProfile(name, displayName, description)
│   └── Show success toast
```

#### `components/Profiles/ProfilePicker.tsx` (changes)

```
ProfilePicker:
├── Add type indicator badge:
│   ├── If profile.type === 'anchor': Badge "Saved Session" (green)
│   └── If profile.type === 'local': Badge "Credentials" (blue)
├── Show lastUsed in subtitle
├── Sort Anchor profiles first (more reliable)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | New Session dialog has profile options | Open dialog, see radio buttons for profile choice |
| AC-C.2 | Can create session with new persistent profile | Select "Create new", enter name, submit → session starts with persist |
| AC-C.3 | Can select existing Anchor profile | Select "Use existing", pick profile → session starts logged in |
| AC-C.4 | Save Profile prompt works | After login, click "Save Profile" → prompt appears → saves |
| AC-C.5 | Profile picker shows type badges | Open picker, see "Saved Session" vs "Credentials" badges |
| AC-C.6 | LinkedIn stays logged in across sessions | Login to LinkedIn, save profile, new session → already logged in |

---

## User Flows

### Flow 1: First-Time Profile Creation

```
1. User clicks "New Session" → NewSessionDialog opens
2. User selects "Create new profile" radio option
3. User enters profile name: "linkedin-work"
4. User leaves "Save browser state" checked (default)
5. User clicks "Create Session"
6. POST /api/browser-automation/sessions with { profileName: "linkedin-work", persist: true, createNewProfile: true }
7. Session starts, live browser view appears
8. User manually logs into LinkedIn
9. User sees "Save Profile" button in session toolbar
10. User clicks "Save Profile" → SaveProfilePrompt opens
11. User enters display name: "LinkedIn - Work Account"
12. User clicks "Save"
13. POST /api/browser-automation/profiles/anchor with metadata
14. Profile appears in ProfilePicker with "Saved Session" badge
15. User terminates session (Anchor saves browser state)
```

### Flow 2: Reuse Authenticated Profile

```
1. User clicks "New Session" → NewSessionDialog opens
2. User selects "Use existing profile"
3. User selects "LinkedIn - Work Account" from ProfilePicker
4. User clicks "Create Session"
5. POST /api/browser-automation/sessions with { profileName: "linkedin-work" }
6. Session starts with saved browser state
7. Browser shows LinkedIn already logged in
8. User can immediately start automation tasks
```

---

## Out of Scope

- Automated login flows
- Profile import/export
- Profile sharing between users
- Credential profile migration to Anchor profiles

---

## Open Questions

- ✅ Does Anchor SDK have a profile listing API, or do we need to track locally? **ANSWERED**: Track locally in anchor-profiles.json
- [ ] How do we detect when a profile's session has expired (cookies stale)? **OUT OF SCOPE**: Manual user handling
- ✅ Should "Save Profile" be automatic when session ends, or explicit user action? **ANSWERED**: Explicit via SaveProfilePrompt
- ✅ How do we handle profile name conflicts? **ANSWERED**: Validate uniqueness across both profile types

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
