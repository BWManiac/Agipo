# Task 01.1: Authenticated Sessions & Persistent Profiles — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/browser-automation/01-Authenticated-Sessions.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Anchor Browser's profile persistence API. 

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Anchor Browser's API is immutable. We can't change their shape—we discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Profile persistence API](#rq-1-profile-persistence-api) | Session creation with `persist: true` | ❓ |
| [RQ-2: Profile listing API](#rq-2-profile-listing-api) | Display saved profiles in UI | ❓ |
| [RQ-3: Profile expiration detection](#rq-3-profile-expiration-detection) | Handle expired sessions gracefully | ❓ |
| [RQ-4: Profile deletion API](#rq-4-profile-deletion-api) | Delete profiles from Anchor | ❓ |
| [RQ-5: Profile update vs create](#rq-5-profile-update-vs-create) | Update existing profiles | ❓ |

---

## Part 1: Anchor Browser Profile Persistence API Research

### RQ-1: Profile Persistence API

**Why It Matters:** PR-1.1 (Session Creation with Persistence) — Need to understand how to create sessions with `persist: true` and how profiles are saved/loaded.

**Status:** ✅ Answered

**Question:** 
1. What's the exact API for creating a session with `persist: true`?
2. How does Anchor save browser state when `persist: true`?
3. How do we load a saved profile in a new session?
4. What's the profile naming structure?

**Answer:**
```typescript
// Creating a session with persist flag via SDK
import Anchorbrowser from "anchorbrowser";

const anchorClient = new Anchorbrowser({
  apiKey: process.env.ANCHOR_API_KEY
});

// Create session with persist: true to save profile
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'new-profile',
      persist: true  // This saves the profile when session ends
    }
  }
});

// Load saved profile in new session
const sessionWithProfile = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'new-profile'  // Just specify name to load existing profile
    }
  }
});
```

**Primitive Discovered:**
- Function/Method: `anchorClient.sessions.create()`
- Signature: `create(config: SessionConfig): Promise<Session>`
- Return type: Session object with id, browser connection details
- Profile naming: String identifier, must be unique per account

**Implementation Note:** When `persist: true` is set, the profile (cookies, local storage, cache) is automatically saved when the session terminates. No explicit save call needed.

**Source:** 
- https://docs.anchorbrowser.io/essentials/authentication-and-identity
- https://docs.anchorbrowser.io/quickstart/use-via-sdk

---

### RQ-2: Profile Listing API

**Why It Matters:** PR-1.2 (Profile Picker UI) — Need to list all saved profiles to show in profile picker dropdown.

**Status:** ✅ Answered

**Question:**
1. Does Anchor SDK provide a `listProfiles()` or similar method?
2. If not, how do we track which profiles we've created?
3. What metadata is available for each profile (name, created date, last used)?

**Answer:**
```typescript
// REST API for listing profiles
const response = await fetch('https://api.anchorbrowser.io/v1/profiles', {
  headers: {
    'anchor-api-key': process.env.ANCHOR_API_KEY
  }
});

const data = await response.json();
// Response structure:
{
  "data": {
    "count": 123,
    "items": [
      {
        "name": "<string>",
        "description": "<string>",
        "source": "session",
        "session_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
        "status": "<string>",
        "created_at": "2023-11-07T05:31:56Z"
      }
    ]
  }
}
```

**Primitive Discovered:**
- Function/Method: `GET /v1/profiles` REST endpoint
- Signature: No parameters, requires `anchor-api-key` header
- Metadata available: name, description, source, session_id, status, created_at

**Implementation Note:** The SDK doesn't have a built-in `listProfiles()` method. We need to use the REST API directly or wrap it in a helper function.

**Source:** https://docs.anchorbrowser.io/api-reference/profiles/list-profiles 

---

### RQ-3: Profile Expiration Detection

**Why It Matters:** PR-1.3 (Profile Expiration Handling) — Need to detect when a profile's session has expired (cookies stale).

**Status:** ✅ Answered (Limited)

**Question:**
1. How does Anchor detect expired sessions?
2. What happens when we try to use an expired profile?
3. Do we get an error, or does Anchor attempt re-authentication?
4. Can we check profile validity before creating a session?

**Answer:**
The documentation does not explicitly describe profile expiration detection. However:
- Profiles store cookies, local storage, and cache which may naturally expire
- The profile `status` field (from list API) may indicate validity
- Error handling would likely occur when trying to use an invalid profile

**If Not Available, Workarounds:**

| Option | Pros | Cons |
|--------|------|------|
| A: Try session, catch error | Simple | User sees error after attempt |
| B: Check profile status field | Proactive | Status meaning unclear |
| C: Track last used timestamp | Control expiration logic | Manual management |

**Our Choice:** Option A - Try session and handle errors gracefully, since Anchor handles authentication state internally.

**Source:** 
- https://docs.anchorbrowser.io/essentials/authentication-and-identity (no explicit expiration info)
- Inferred from profile listing API response structure 

---

### RQ-4: Profile Deletion API

**Why It Matters:** PR-1.4 (Profile Management) — Need to delete profiles when user removes them.

**Status:** ✅ Answered

**Question:**
1. Does Anchor provide a profile deletion API?
2. What happens to active sessions using a deleted profile?
3. Can we delete profiles created outside our system?

**Answer:**
```typescript
// REST API for deleting profiles
const response = await fetch(`https://api.anchorbrowser.io/v1/profiles/${profileName}`, {
  method: 'DELETE',
  headers: {
    'anchor-api-key': process.env.ANCHOR_API_KEY
  }
});

// Response:
{
  "data": {
    "status": "<string>"
  }
}
```

**Primitive Discovered:**
- Function/Method: `DELETE /v1/profiles/{name}`
- Signature: Path parameter `name` (string), requires API key header
- Return: Status confirmation object

**Implementation Note:** 
- Deletes profile by name, removing stored cookies, local storage, and cache
- Documentation doesn't specify what happens to active sessions
- Any profile accessible with your API key can be deleted

**Source:** https://docs.anchorbrowser.io/api-reference/profiles/delete-profile 

---

### RQ-5: Profile Update vs Create

**Why It Matters:** PR-1.5 (Profile Update Flow) — Need to understand if we update existing profiles or create new versions.

**Status:** ✅ Answered

**Question:**
1. When saving a profile with an existing name, does Anchor update or create new?
2. Is there a profile versioning system?
3. How do we handle "Update Profile" action - update existing or create new?

**Answer:**
```typescript
// Create profile from session endpoint
const response = await fetch('https://api.anchorbrowser.io/v1/profiles', {
  method: 'POST',
  headers: {
    'anchor-api-key': process.env.ANCHOR_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "name": "profile-name",
    "description": "Profile description",
    "source": "session",
    "session_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
    "dedicated_sticky_ip": false
  })
});

// Error 409 if profile name already exists
```

**Primitive Discovered:**
- Function/Method: `POST /v1/profiles`
- Error: Returns 409 Conflict if profile name exists
- No explicit update API - appears to be create-only

**Implementation Note:** 
- Profile names must be unique (409 error on duplicate)
- No versioning system mentioned
- "Update Profile" would require: delete old profile, create new with same name
- Or use different naming convention (e.g., "profile-v2")

**Source:** https://docs.anchorbrowser.io/api-reference/profiles/create-profile 

---

## Part 2: Integration Patterns

### RQ-6: How do Anchor Profiles work with our Session Management?

**Why It Matters:** PR-1.6 (Session Lifecycle) — Understanding how profiles integrate with our session creation/termination flow.

**Status:** ✅ Answered

**Questions:**
1. When does profile state get saved - on session end, or explicitly?
2. Can we save a profile mid-session, or only at the end?
3. How do profiles relate to our existing credential-based profile system?

**Integration Pattern:**
```typescript
// Profile state is saved automatically when session ends if persist: true
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'my-profile',
      persist: true  // Saves automatically on session.close()
    }
  }
});

// Connect to browser and perform actions
const browser = await anchorClient.browser.connect(session.id);
// ... perform automation ...
await browser.close(); // Profile saved here

// Can also create profile from existing session via REST API
await fetch('https://api.anchorbrowser.io/v1/profiles', {
  method: 'POST',
  body: JSON.stringify({
    source: 'session',
    session_id: session.id,
    name: 'saved-mid-session'
  })
});
```

**Answer:**
1. Profile state saves automatically when session ends (if `persist: true`)
2. Can save mid-session using POST /v1/profiles with session_id
3. Profiles complement credential system - profiles store browser state, credentials authenticate

**Source:** 
- https://docs.anchorbrowser.io/essentials/authentication-and-identity
- https://docs.anchorbrowser.io/api-reference/profiles/create-profile 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Create session with persist | `anchorClient.sessions.create({ browser: { profile: { name, persist: true }}})` | Anchor SDK | ✅ |
| Load saved profile | `anchorClient.sessions.create({ browser: { profile: { name }}})` | Anchor SDK | ✅ |
| List profiles | `GET /v1/profiles` | Anchor REST API | ✅ |
| Delete profile | `DELETE /v1/profiles/{name}` | Anchor REST API | ✅ |
| Create profile from session | `POST /v1/profiles` | Anchor REST API | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| No SDK method for listing profiles | Must use REST API | Wrap REST call in helper function |
| No update API | Can't modify existing profiles | Delete and recreate with same name |
| No explicit expiration detection | Can't proactively check validity | Handle errors when loading profile |

### Key Learnings

1. **Profile persistence is automatic** - Setting `persist: true` automatically saves browser state when session ends
2. **REST API required for management** - SDK handles session creation, but profile listing/deletion requires REST API
3. **Profile names must be unique** - API returns 409 error for duplicate names, no versioning system 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to proceed with authenticated sessions feature

---

## Resources Used

- [Anchor Browser Authentication Docs](https://docs.anchorbrowser.io/essentials/authentication-and-identity)
- [Anchor Browser SDK Reference](https://docs.anchorbrowser.io/)
- Existing code: `app/api/browser-automation/services/anchor-client.ts`



