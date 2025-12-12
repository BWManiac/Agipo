# Profiles Collection

> List and create browser profiles for authenticated sessions.

**Endpoint:** `GET|POST /api/browser-automation/profiles`
**Auth:** None (internal API)

---

## Purpose

This endpoint manages browser profiles which store authentication state and credentials. Profiles enable users to maintain logged-in sessions across multiple browser automation runs. Two types of profiles are supported: Anchor profiles (cloud-stored browser state) and local profiles (encrypted credential storage).

**Product Value:** Enables users to automate authenticated workflows without re-logging in each time.

---

## Approach

The route combines two profile sources:
1. **Anchor profiles** - Metadata for cloud-stored browser state (cookies, localStorage)
2. **Local profiles** - Credential profiles with encrypted username/password storage

GET returns a unified list with type indicators. POST creates local credential profiles (Anchor profiles are created via session creation with `persist: true`).

---

## GET - List Profiles

Returns all profiles (both Anchor and local) sorted by most recently used.

### Pseudocode

```
GET(): NextResponse
├── **Call `listProfiles()`** for local profiles
├── **Call `listAnchorProfiles()`** for Anchor profiles
├── Combine with type indicators
├── Sort by lastUsed/createdAt descending
└── Return combined profiles array
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `profiles` | CombinedProfile[] | Array of all profiles |

**CombinedProfile Structure:**
```typescript
{
  name: string;           // Profile identifier
  displayName: string;    // Human-readable name
  type: "anchor" | "local";  // Profile type
  icon?: string;          // Emoji icon (local only)
  credentialCount?: number; // Number of credentials (local only)
  description?: string;   // Profile description (anchor only)
  createdAt: string;      // ISO timestamp
  lastUsed?: string;      // Last used timestamp
}
```

**Example Response:**
```json
{
  "profiles": [
    {
      "name": "linkedin-work",
      "displayName": "LinkedIn - Work Account",
      "type": "anchor",
      "description": "Work LinkedIn account",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "lastUsed": "2024-01-16T14:30:00.000Z"
    },
    {
      "name": "google-personal",
      "displayName": "Google Personal",
      "type": "local",
      "icon": "🔑",
      "credentialCount": 2,
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

---

## POST - Create Local Profile

Creates a new local credential profile with encrypted password storage.

### Pseudocode

```
POST(request): NextResponse
├── Parse and validate request body
├── **Call `createProfile()`** from profile-storage
│   ├── Encrypt passwords
│   ├── Write config file
│   └── Update registry
└── Return profile summary (passwords masked)
```

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Profile identifier (lowercase alphanumeric with dashes) |
| `displayName` | string | Yes | Human-readable name |
| `icon` | string | No | Emoji icon (default: "💼") |
| `credentials` | Credential[] | No | Array of credentials to store |
| `config.viewport` | object | No | Browser viewport settings |
| `config.proxy` | object | No | Proxy configuration |

**Credential Structure:**
```typescript
{
  id: string;       // Unique credential ID
  label: string;    // Display label (e.g., "Google Account")
  username: string; // Username or email
  password: string; // Password (will be encrypted)
  domain?: string;  // Optional domain restriction
}
```

**Example Request:**
```json
{
  "name": "google-work",
  "displayName": "Google - Work Account",
  "icon": "🏢",
  "credentials": [
    {
      "id": "cred_1",
      "label": "Google Account",
      "username": "user@company.com",
      "password": "secret123",
      "domain": "google.com"
    }
  ]
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether profile was created |
| `profile.name` | string | Profile identifier |
| `profile.displayName` | string | Human-readable name |
| `profile.icon` | string | Emoji icon |
| `profile.credentialCount` | number | Number of stored credentials |
| `profile.createdAt` | string | ISO timestamp |

**Example Response:**
```json
{
  "success": true,
  "profile": {
    "name": "google-work",
    "displayName": "Google - Work Account",
    "icon": "🏢",
    "credentialCount": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ProfilePicker | `components/Profiles/ProfilePicker.tsx` | Profile selection dropdown |
| profilesSlice | `store/slices/profilesSlice.ts` | Profile state management |
| NewSessionDialog | `components/SessionsSidebar/NewSessionDialog.tsx` | Profile selection when creating session |

---

## Notes

- Anchor profiles are created via session creation with `persist: true`, not this endpoint
- Local profile passwords are encrypted using AES-256-CBC before storage
- Profile names must be lowercase alphanumeric with dashes only
- Passwords are masked in all API responses ("••••••••")

---

## Related Docs

- [Profile Instance](./[profileName]/README.md) - Individual profile operations
- [profile-storage Service](../services/profile-storage.README.md) - Storage implementation
