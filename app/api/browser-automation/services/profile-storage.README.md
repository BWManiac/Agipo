# Profile Storage Service

> Manages browser profiles with encrypted credential storage.

**Service:** `profile-storage.ts`
**Domain:** Browser Automation

---

## Purpose

This service provides persistent storage for browser profiles, supporting two distinct profile types:

1. **Local Profiles** - Store encrypted credentials (username/password) for automated login flows
2. **Anchor Profiles** - Store metadata for cloud-persisted browser state (cookies, localStorage)

Credentials are encrypted at rest using AES-256-CBC, ensuring sensitive data is protected even if storage is compromised.

**Product Value:** Enables users to save authentication credentials securely and maintain metadata about their cloud-persisted browser sessions.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `listProfiles()` | Returns summaries of all local credential profiles. | When displaying the profile picker. |
| `getProfile()` | Retrieves a profile's full configuration with masked passwords. | When viewing profile details. |
| `createProfile()` | Creates a new local profile with encrypted credentials. | When user creates a credential profile. |
| `updateProfile()` | Updates profile settings and credentials. | When user modifies a profile. |
| `deleteProfile()` | Permanently removes a profile and its credentials. | When user deletes a profile. |
| `getProfileCredentials()` | Retrieves decrypted credentials for agent use. | Internal use for auto-login flows. |
| `touchProfile()` | Updates the lastUsed timestamp. | After using a profile in a session. |
| `registerAnchorProfile()` | Registers metadata for an Anchor cloud profile. | After creating a persistent session. |
| `listAnchorProfiles()` | Lists all Anchor profile metadata. | When displaying saved sessions. |
| `touchAnchorProfile()` | Updates lastUsed for an Anchor profile. | After using an Anchor profile. |
| `deleteAnchorProfile()` | Removes Anchor profile metadata. | When deleting an Anchor profile. |

---

## Approach

Profiles are stored in the `_tables/browser-profiles/` directory:

```
_tables/browser-profiles/
├── index.json                    ← Local profile registry
├── anchor-profiles.json          ← Anchor profile metadata
└── {profile-name}/
    └── config.json               ← Profile config with encrypted credentials
```

Passwords are encrypted using AES-256-CBC with a random IV for each encryption. The encryption key is sourced from the `PROFILE_ENCRYPTION_KEY` environment variable.

---

## Public API

### `listProfiles(): Promise<ProfileSummary[]>`

**What it does:** Returns summaries of all local credential profiles without sensitive data.

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Profile identifier |
| `displayName` | string | Human-readable name |
| `icon` | string | Emoji icon |
| `credentialCount` | number | Number of stored credentials |
| `createdAt` | string | Creation timestamp |
| `lastUsed` | string | Last used timestamp |

---

### `getProfile(name: string): Promise<ProfileConfig | null>`

**What it does:** Retrieves a profile's full configuration with passwords masked as "••••••••".

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Profile identifier |

---

### `createProfile(config: Omit<ProfileConfig, "createdAt">): Promise<ProfileConfig>`

**What it does:** Creates a new local profile, encrypting all credential passwords before storage.

**Process:**

```
createProfile(config): ProfileConfig
├── Ensure profiles directory exists
├── Create profile subdirectory
├── Encrypt all credential passwords
├── Write config.json
├── Update registry index
└── Return config with masked passwords
```

---

### `updateProfile(name: string, updates: Partial<ProfileConfig>): Promise<ProfileConfig>`

**What it does:** Updates profile settings. Handles password updates intelligently - preserves existing encrypted passwords if "••••••••" is sent.

**Process:**

```
updateProfile(name, updates): ProfileConfig
├── Read existing profile
├── Merge updates
├── For each credential:
│   ├── **If password is "••••••••"**: Preserve existing encrypted password
│   ├── **If already encrypted**: Keep as-is
│   └── **Otherwise**: Encrypt new password
├── Write updated config
└── Return with masked passwords
```

---

### `deleteProfile(name: string): Promise<void>`

**What it does:** Permanently deletes a profile directory and removes it from the registry.

---

### `getProfileCredentials(name: string): Promise<ProfileCredential[]>`

**What it does:** Returns decrypted credentials for internal use (e.g., auto-login scripts).

**Security Note:** This function returns plaintext passwords. Only use for trusted internal operations.

---

### `registerAnchorProfile(name: string, displayName: string, description?: string): Promise<AnchorProfileMeta>`

**What it does:** Registers metadata for an Anchor profile after creating a session with `persist: true`.

**Note:** The actual browser state is stored on Anchor's servers. This function only tracks local metadata (name, display name, timestamps).

---

### `listAnchorProfiles(): Promise<AnchorProfileMeta[]>`

**What it does:** Returns metadata for all registered Anchor profiles.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `crypto` | AES-256-CBC encryption for passwords |
| `fs/promises` | Async file system operations |
| `path` | Path manipulation |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Sessions Route | `sessions/route.ts` | registerAnchorProfile on session create |
| Profiles Route | `profiles/route.ts` | list, create operations |
| Profile Instance Route | `profiles/[profileName]/route.ts` | get, update, delete |

---

## Design Decisions

### Why store profiles as files instead of database?

**Decision:** Use JSON files in `_tables/browser-profiles/` directory.

**Rationale:** Keeps the storage simple and portable. Profiles are low-volume data that doesn't require database features. File-based storage also makes it easy to inspect and backup profiles.

### Why separate Anchor and local profiles?

**Decision:** Maintain two distinct storage mechanisms for the two profile types.

**Rationale:**
- **Anchor profiles** - Browser state lives on Anchor's servers. We only store metadata locally.
- **Local profiles** - Credentials are stored and encrypted locally for future auto-login features.

This separation keeps concerns clean and allows different lifecycle management.

### Why AES-256-CBC encryption?

**Decision:** Encrypt credential passwords with AES-256-CBC and random IVs.

**Rationale:** Industry-standard symmetric encryption. Each password gets a unique IV, preventing pattern analysis. The encrypted format `encrypted:{iv}:{ciphertext}` is self-describing.

---

## Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `PROFILE_ENCRYPTION_KEY` | 32-character key for credential encryption (padded if shorter) |

---

## Notes

- Passwords are never logged or returned in API responses (always masked)
- Profile names must be lowercase alphanumeric with dashes
- Deleting a local profile does not affect Anchor cloud storage
- The encryption key should be properly secured in production

---

## Related Docs

- [Profiles Route](../profiles/README.md) - API endpoints
- [Profile Instance Route](../profiles/[profileName]/README.md) - CRUD operations
