# Phase 5: Profile Management

**Status:** Planned
**Depends On:** Phase 3 (Chat & Browser Agent)

**Note:** Assumes Phase 0 (Technical Spike) has validated Anchor Browser profile system. If Phase 0 revealed issues, review this phase before execution.
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Enable users to create, manage, and reuse browser profiles with saved credentials. Profiles persist browser state (cookies, local storage) across sessions via Anchor Browser's profile system, and store credential metadata locally for agent use.

After this phase, users can create profiles with credentials (e.g., "Work Account" with Slack login), select a profile when creating a session, and the agent can use saved credentials to authenticate automatically.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Credential storage | Local filesystem (encrypted) | Simple, no external DB needed |
| Cookie storage | Anchor Browser cloud | Anchor handles persistence |
| Profile selection | In session creation dialog | Natural workflow |
| Credentials in agent | Injected into context | Agent knows what credentials exist |

### Pertinent Research

- **Research Log Section 6**: Browser profiles API
- **Mockup 06**: `06-profile-management/` - Profile states (list, create, empty)

*Source: `_docs/_tasks/21-browser-automation/02-Research-Log.md`, `_docs/UXD/Pages/experiments/2025-12-10-browser-automation/`*

### Overall File Impact

#### Backend / Routes

| File | Action | Purpose |
|------|--------|---------|
| `profiles/route.ts` | Create | GET list, POST create |
| `profiles/[profileName]/route.ts` | Create | GET, PUT, DELETE |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `services/profile-storage.ts` | Create | Profile file operations |

#### Profile Storage

| File | Action | Purpose |
|------|--------|---------|
| `_tables/browser-profiles/index.ts` | Create | Profile registry |
| `_tables/browser-profiles/[name]/config.ts` | Create | Per-profile configuration |

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `store/slices/profilesSlice.ts` | Create | Profile management state |
| `store/index.ts` | Modify | Add profiles slice |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `components/SessionsSidebar/ProfilePicker.tsx` | Create | Profile dropdown in session dialog |
| `components/ProfileDialog/index.tsx` | Create | Profile create/edit modal |
| `components/ProfileDialog/ProfileForm.tsx` | Create | Profile form |
| `components/ProfileDialog/CredentialsList.tsx` | Create | Credentials management |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.1 | Profile picker appears in New Session dialog | Open dialog |
| AC-5.2 | "Create Profile" option opens profile dialog | Click option |
| AC-5.3 | Profile form has name, icon, credentials fields | Verify form |
| AC-5.4 | Can add multiple credentials per profile | Add 3 credentials |
| AC-5.5 | Credentials have label, username, password, domain | Verify fields |
| AC-5.6 | Passwords masked in UI | Type password, verify hidden |
| AC-5.7 | Creating profile calls API | Monitor network |
| AC-5.8 | Profile appears in picker after creation | Create, verify in dropdown |
| AC-5.9 | Selecting profile passes to session creation | Create session with profile |
| AC-5.10 | Session uses Anchor Browser profile | Verify in Anchor dashboard |
| AC-5.11 | Can edit existing profile | Click edit, make changes |
| AC-5.12 | Can delete profile | Click delete, confirm, verify gone |
| AC-5.13 | Agent has access to credential labels | Ask agent about available logins |

### User Flows

#### Flow 1: Create Profile

```
1. User opens New Session dialog
2. User clicks "Create new profile" in profile picker
3. Profile dialog opens
4. User enters:
   - Name: "Work Account"
   - Icon: 💼 (from picker)
   - Credentials:
     - Label: "Slack", Username: "john@company.com", Password: ●●●●, Domain: slack.com
     - Label: "GitHub", Username: "johndoe", Password: ●●●●, Domain: github.com
5. User clicks "Create Profile"
6. Dialog closes
7. Profile appears selected in session dialog
8. User continues to create session
```

#### Flow 2: Use Profile in Session

```
1. User opens New Session dialog
2. User selects "Work Account" from profile picker
3. User clicks "Start Session"
4. Session created with profile
5. Browser maintains cookies from previous sessions
6. User asks agent: "Sign in to Slack"
7. Agent knows credentials exist for slack.com
8. Agent fills login form automatically
```

#### Flow 3: Edit Profile

```
1. User clicks profile icon in session sidebar
2. Profile menu opens
3. User clicks "Edit Profile"
4. Profile dialog opens with existing data
5. User adds new credential
6. User clicks "Save"
7. Profile updated
```

#### Flow 4: Delete Profile

```
1. User opens profile menu
2. User clicks "Delete Profile"
3. Confirmation dialog: "Delete 'Work Account'? This won't affect browser cookies stored in Anchor."
4. User confirms
5. Profile removed from list
```

---

## Out of Scope

- Automatic credential detection from pages
- Browser extension integration
- Credential sharing between users
- SSO/OAuth credential storage

---

## Implementation Details

### Profile Storage Structure

```
_tables/browser-profiles/
├── index.ts                    # Profile registry
└── work-account/
    └── config.ts               # Profile configuration
```

#### index.ts (Registry)

```typescript
// _tables/browser-profiles/index.ts

export const profileRegistry = {
  profiles: ["work-account", "personal"],
};
```

#### config.ts (Per Profile)

```typescript
// _tables/browser-profiles/work-account/config.ts

export const profileConfig = {
  name: "work-account",
  displayName: "Work Account",
  icon: "💼",
  credentials: [
    {
      id: "cred_001",
      label: "Slack Login",
      username: "john@company.com",
      password: "encrypted:U2FsdGVkX1...",  // AES-256 encrypted
      domain: "slack.com",
    },
    {
      id: "cred_002",
      label: "GitHub Login",
      username: "johndoe",
      password: "encrypted:U2FsdGVkX1...",
      domain: "github.com",
    },
  ],
  config: {
    viewport: { width: 1920, height: 1080 },
    proxy: { active: false },
  },
  createdAt: "2025-12-10T10:00:00Z",
  lastUsed: "2025-12-10T14:30:00Z",
};
```

### Profile Storage Service

```typescript
// services/profile-storage.ts

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const PROFILES_DIR = path.join(process.cwd(), "_tables/browser-profiles");
const ENCRYPTION_KEY = process.env.PROFILE_ENCRYPTION_KEY || "default-key-change-me";

// Encryption helpers
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `encrypted:${iv.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  if (!encryptedText.startsWith("encrypted:")) return encryptedText;
  const parts = encryptedText.slice(10).split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface ProfileCredential {
  id: string;
  label: string;
  username: string;
  password: string;
  domain?: string;
}

export interface ProfileConfig {
  name: string;
  displayName: string;
  icon: string;
  credentials: ProfileCredential[];
  config: {
    viewport?: { width: number; height: number };
    proxy?: { active: boolean; type?: string };
  };
  createdAt: string;
  lastUsed?: string;
}

export async function listProfiles(): Promise<ProfileConfig[]> {
  try {
    const indexPath = path.join(PROFILES_DIR, "index.ts");
    const content = await fs.readFile(indexPath, "utf-8");
    const match = content.match(/profiles:\s*\[(.*?)\]/s);
    if (!match) return [];

    const profileNames = match[1]
      .split(",")
      .map((s) => s.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    const profiles = await Promise.all(
      profileNames.map((name) => getProfile(name))
    );

    return profiles.filter((p): p is ProfileConfig => p !== null);
  } catch {
    return [];
  }
}

export async function getProfile(name: string): Promise<ProfileConfig | null> {
  try {
    const configPath = path.join(PROFILES_DIR, name, "config.ts");
    const content = await fs.readFile(configPath, "utf-8");

    // Parse the TypeScript config (simple extraction)
    const match = content.match(/export const profileConfig = ({[\s\S]*});/);
    if (!match) return null;

    // Use eval safely (in controlled environment)
    const config = eval(`(${match[1]})`);

    // Mask passwords for API response
    config.credentials = config.credentials.map((c: ProfileCredential) => ({
      ...c,
      password: "••••••••",
    }));

    return config;
  } catch {
    return null;
  }
}

export async function createProfile(config: Omit<ProfileConfig, "createdAt">): Promise<ProfileConfig> {
  const profileDir = path.join(PROFILES_DIR, config.name);
  await fs.mkdir(profileDir, { recursive: true });

  // Encrypt passwords
  const credentialsWithEncrypted = config.credentials.map((c) => ({
    ...c,
    password: encrypt(c.password),
  }));

  const fullConfig: ProfileConfig = {
    ...config,
    credentials: credentialsWithEncrypted,
    createdAt: new Date().toISOString(),
  };

  // Write config file
  const configContent = `// Generated browser profile configuration
export const profileConfig = ${JSON.stringify(fullConfig, null, 2)};
`;
  await fs.writeFile(path.join(profileDir, "config.ts"), configContent);

  // Update registry
  await updateRegistry(config.name, "add");

  return {
    ...fullConfig,
    credentials: fullConfig.credentials.map((c) => ({
      ...c,
      password: "••••••••",
    })),
  };
}

export async function updateProfile(
  name: string,
  updates: Partial<ProfileConfig>
): Promise<ProfileConfig> {
  const existing = await getProfile(name);
  if (!existing) throw new Error("Profile not found");

  const updated = { ...existing, ...updates };

  // Re-encrypt passwords if provided
  if (updates.credentials) {
    updated.credentials = updates.credentials.map((c) => ({
      ...c,
      password: c.password.startsWith("encrypted:") ? c.password : encrypt(c.password),
    }));
  }

  const configContent = `// Generated browser profile configuration
export const profileConfig = ${JSON.stringify(updated, null, 2)};
`;
  await fs.writeFile(path.join(PROFILES_DIR, name, "config.ts"), configContent);

  return {
    ...updated,
    credentials: updated.credentials.map((c) => ({
      ...c,
      password: "••••••••",
    })),
  };
}

export async function deleteProfile(name: string): Promise<void> {
  const profileDir = path.join(PROFILES_DIR, name);
  await fs.rm(profileDir, { recursive: true, force: true });
  await updateRegistry(name, "remove");
}

async function updateRegistry(name: string, action: "add" | "remove"): Promise<void> {
  const indexPath = path.join(PROFILES_DIR, "index.ts");

  let profiles: string[] = [];
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const match = content.match(/profiles:\s*\[(.*?)\]/s);
    if (match) {
      profiles = match[1]
        .split(",")
        .map((s) => s.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    }
  } catch {
    // File doesn't exist, start fresh
  }

  if (action === "add" && !profiles.includes(name)) {
    profiles.push(name);
  } else if (action === "remove") {
    profiles = profiles.filter((p) => p !== name);
  }

  const content = `// Browser profiles registry
export const profileRegistry = {
  profiles: [${profiles.map((p) => `"${p}"`).join(", ")}],
};
`;
  await fs.writeFile(indexPath, content);
}

// Get credentials for agent use (decrypted)
export async function getProfileCredentials(name: string): Promise<ProfileCredential[]> {
  const configPath = path.join(PROFILES_DIR, name, "config.ts");
  const content = await fs.readFile(configPath, "utf-8");
  const match = content.match(/export const profileConfig = ({[\s\S]*});/);
  if (!match) return [];

  const config = eval(`(${match[1]})`);

  return config.credentials.map((c: ProfileCredential) => ({
    ...c,
    password: decrypt(c.password),
  }));
}
```

### Profiles API Routes

```typescript
// profiles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProfiles, createProfile } from "../services/profile-storage";

const CreateProfileSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  icon: z.string().default("💼"),
  credentials: z.array(z.object({
    id: z.string(),
    label: z.string(),
    username: z.string(),
    password: z.string(),
    domain: z.string().optional(),
  })).default([]),
  config: z.object({
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    proxy: z.object({
      active: z.boolean(),
      type: z.string().optional(),
    }).optional(),
  }).default({}),
});

export async function GET() {
  try {
    const profiles = await listProfiles();
    return NextResponse.json({
      profiles: profiles.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        icon: p.icon,
        credentialCount: p.credentials.length,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to list profiles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.format() },
        { status: 400 }
      );
    }

    const profile = await createProfile(validated.data);

    return NextResponse.json({
      success: true,
      profile: {
        name: profile.name,
        displayName: profile.displayName,
        icon: profile.icon,
        credentialCount: profile.credentials.length,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
```

### Profiles Slice

```typescript
// store/slices/profilesSlice.ts

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface ProfileSummary {
  name: string;
  displayName: string;
  icon: string;
  credentialCount: number;
  createdAt: string;
  lastUsed?: string;
}

export interface ProfilesSliceState {
  profiles: ProfileSummary[];
  selectedProfileName: string | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

export interface ProfilesSliceActions {
  fetchProfiles: () => Promise<void>;
  createProfile: (profile: any) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;
  selectProfile: (name: string | null) => void;
  setError: (error: string | null) => void;
}

export type ProfilesSlice = ProfilesSliceState & ProfilesSliceActions;

export const createProfilesSlice: StateCreator<BrowserStore, [], [], ProfilesSlice> = (
  set
) => ({
  profiles: [],
  selectedProfileName: null,
  isLoading: false,
  isCreating: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/profiles");
      const data = await response.json();
      set({ profiles: data.profiles, isLoading: false });
    } catch {
      set({ error: "Failed to fetch profiles", isLoading: false });
    }
  },

  createProfile: async (profile) => {
    set({ isCreating: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      set((state) => ({
        profiles: [...state.profiles, data.profile],
        selectedProfileName: data.profile.name,
        isCreating: false,
      }));
    } catch {
      set({ error: "Failed to create profile", isCreating: false });
    }
  },

  deleteProfile: async (name) => {
    try {
      await fetch(`/api/browser-automation/profiles/${name}`, {
        method: "DELETE",
      });
      set((state) => ({
        profiles: state.profiles.filter((p) => p.name !== name),
        selectedProfileName:
          state.selectedProfileName === name ? null : state.selectedProfileName,
      }));
    } catch {
      set({ error: "Failed to delete profile" });
    }
  },

  selectProfile: (name) => set({ selectedProfileName: name }),

  setError: (error) => set({ error }),
});
```

---

## Security Considerations

1. **Encryption at Rest**: All passwords encrypted with AES-256
2. **Environment Key**: Encryption key from environment variable
3. **No Logging**: Passwords never logged or included in errors
4. **Masked UI**: Passwords always shown as `••••••••` in API responses
5. **Secure Delete**: Profile directory removed recursively on delete

---

## References

- **Mockup**: `06-profile-management/`
- **Research Log**: `02-Research-Log.md` Section 6
- **Implementation Plan**: `04-Implementation-Plan.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

**Last Updated:** 2025-12-10

