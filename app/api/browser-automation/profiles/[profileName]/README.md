# Profile Instance

> Get, update, or delete a specific profile.

**Endpoint:** `GET|PUT|DELETE /api/browser-automation/profiles/[profileName]`
**Auth:** None (internal API)

---

## Purpose

This endpoint provides CRUD operations on individual local credential profiles. Users can retrieve profile details (with masked passwords), update profile settings and credentials, or delete profiles entirely.

**Product Value:** Enables users to manage their saved credentials and profile configurations.

---

## Approach

The route extracts the profile name from the URL path and delegates to the `profile-storage` service. All credential passwords are masked in responses and re-encrypted on updates. The profile is stored as a JSON file in the `_tables/browser-profiles/` directory.

---

## GET - Get Profile

Retrieves profile details with masked passwords.

### Pseudocode

```
GET(request, { params }): NextResponse
├── Extract profileName from params
├── **Call `getProfile(profileName)`** from profile-storage
├── **If not found**: Return 404
└── Return profile (passwords masked)
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `profile.name` | string | Profile identifier |
| `profile.displayName` | string | Human-readable name |
| `profile.icon` | string | Emoji icon |
| `profile.credentials` | Credential[] | Credentials with masked passwords |
| `profile.config` | object | Browser configuration |
| `profile.createdAt` | string | Creation timestamp |
| `profile.lastUsed` | string | Last used timestamp |

**Example Response:**
```json
{
  "profile": {
    "name": "google-work",
    "displayName": "Google - Work Account",
    "icon": "🏢",
    "credentials": [
      {
        "id": "cred_1",
        "label": "Google Account",
        "username": "user@company.com",
        "password": "••••••••",
        "domain": "google.com"
      }
    ],
    "config": {
      "viewport": { "width": 1920, "height": 1080 }
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUsed": "2024-01-16T14:00:00.000Z"
  }
}
```

---

## PUT - Update Profile

Updates profile settings and/or credentials.

### Pseudocode

```
PUT(request, { params }): NextResponse
├── Extract profileName from params
├── Parse and validate request body
├── **Call `updateProfile(profileName, updates)`** from profile-storage
│   ├── Merge with existing profile
│   ├── Re-encrypt changed passwords
│   └── Preserve unchanged encrypted passwords
└── Return updated profile summary
```

### Input

All fields are optional - only provided fields are updated.

| Field | Type | Description |
|-------|------|----------|
| `displayName` | string | Updated display name |
| `icon` | string | Updated emoji icon |
| `credentials` | Credential[] | Updated credentials array |
| `config.viewport` | object | Updated viewport settings |
| `config.proxy` | object | Updated proxy configuration |

**Example Request:**
```json
{
  "displayName": "Google - Personal Account",
  "credentials": [
    {
      "id": "cred_1",
      "label": "Google Account",
      "username": "user@gmail.com",
      "password": "newpassword123",
      "domain": "google.com"
    }
  ]
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether update succeeded |
| `profile.name` | string | Profile identifier |
| `profile.displayName` | string | Updated display name |
| `profile.icon` | string | Profile icon |
| `profile.credentialCount` | number | Number of credentials |

**Example Response:**
```json
{
  "success": true,
  "profile": {
    "name": "google-work",
    "displayName": "Google - Personal Account",
    "icon": "🏢",
    "credentialCount": 1
  }
}
```

---

## DELETE - Delete Profile

Permanently deletes a profile and all stored credentials.

### Pseudocode

```
DELETE(request, { params }): NextResponse
├── Extract profileName from params
├── **Call `deleteProfile(profileName)`** from profile-storage
│   ├── Remove profile directory
│   └── Update registry
└── Return success status
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether deletion succeeded |

**Example Response:**
```json
{
  "success": true
}
```

---

## Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid request body |
| 404 | Profile not found |
| 500 | Operation failed |

---

## Notes

- Passwords sent as "••••••••" are preserved from existing storage (not overwritten)
- Deleting a local profile does not delete the corresponding Anchor profile (if any)
- Profile names are immutable - cannot be changed after creation

---

## Related Docs

- [Profiles Collection](../README.md) - List and create profiles
- [profile-storage Service](../../services/profile-storage.README.md) - Storage implementation
