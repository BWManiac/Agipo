# Authenticated Sessions - Implementation Phases

**Feature:** Authenticated Sessions & Persistent Profiles  
**Task Document:** `01A-Authenticated-Sessions-Task.md`  
**Research Log:** `01B-Authenticated-Sessions-Research.md`

---

## Phase 1: Backend Session Persistence

### Goal
Enable session creation with Anchor's `persist: true` flag so browser state is saved server-side when sessions end. Create shared types and modify anchor client to support persistence.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/types.ts` | Create | Shared types for browser automation |
| `app/api/browser-automation/sessions/route.ts` | Modify | Accept persist flag in session creation |
| `app/api/browser-automation/services/anchor-client.ts` | Modify | Pass persist flag to Anchor SDK |

### Pseudocode

#### `app/api/browser-automation/types.ts`
```typescript
export interface CreateSessionRequest {
  profileName?: string;
  initialUrl?: string;
  persist?: boolean;          // Save browser state when session ends
  createNewProfile?: boolean; // Create new profile with this session
  config?: {
    timeout?: { 
      maxDuration?: number;
      idleTimeout?: number;
    };
    recording?: boolean;
  };
}

export interface AnchorProfile {
  name: string;
  type: 'anchor' | 'local';   // Distinguish profile types
  displayName: string;
  description?: string;
  createdAt: string;
  lastUsed?: string;
}

export interface SessionData {
  id: string;
  cdpUrl: string;
  liveViewUrl: string;
  status: 'starting' | 'running' | 'idle' | 'stopped';
  profileName?: string;
  persist?: boolean;          // Is this session persisting?
  createdAt: string;
}
```

#### `app/api/browser-automation/sessions/route.ts`
```typescript
export async function POST(request: Request) {
  const body: CreateSessionRequest = await request.json();
  const { profileName, initialUrl, persist, createNewProfile, config } = body;
  
  // Validate new profile creation
  if (createNewProfile && !profileName) {
    return NextResponse.json(
      { error: "Profile name required when creating new profile" },
      { status: 400 }
    );
  }
  
  // Build session options
  const options: CreateSessionOptions = {
    profileName,
    persist: persist ?? createNewProfile ?? false,
    initialUrl,
    ...config
  };
  
  try {
    const session = await anchorClient.createSession(options);
    
    // Track profile creation if new
    if (createNewProfile && profileName) {
      await profileStorage.registerAnchorProfile(profileName, profileName);
    }
    
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
```

#### `app/api/browser-automation/services/anchor-client.ts`
```typescript
export interface CreateSessionOptions {
  profileName?: string;
  persist?: boolean;           // NEW
  initialUrl?: string;
  timeout?: { 
    maxDuration?: number;
    idleTimeout?: number;
  };
  recording?: boolean;
}

async createSession(options: CreateSessionOptions): Promise<SessionData> {
  const anchorOptions: any = {
    url: options.initialUrl,
    timeout: options.timeout,
    recording: options.recording
  };
  
  // Add profile with persist flag
  if (options.profileName) {
    anchorOptions.browser = {
      profile: {
        name: options.profileName,
        persist: options.persist ?? false  // Pass persist to Anchor
      }
    };
  }
  
  const session = await this.client.sessions.create(anchorOptions);
  
  return {
    id: session.id,
    cdpUrl: session.cdpUrl,
    liveViewUrl: session.liveViewUrl,
    status: session.status,
    profileName: options.profileName,
    persist: options.persist,
    createdAt: new Date().toISOString()
  };
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Session accepts persist flag | POST with `persist: true` succeeds |
| Anchor receives persist flag | Verify in Anchor logs/dashboard |
| Response includes persist status | Check response has `persist` field |
| Types file compiles | TypeScript compilation succeeds |
| Profile creation tracked | New profile appears in anchor-profiles.json |

### Testing Strategy
- Unit test session creation with various flag combinations
- Integration test with real Anchor API
- Verify browser state persistence manually

---

## Phase 2: Profile Management Backend

### Goal
Implement profile tracking and management for both Anchor-persisted and local credential profiles. Enable listing, updating, and deleting profiles with proper type distinction.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/profiles/anchor/route.ts` | Create | List Anchor profiles |
| `app/api/browser-automation/profiles/route.ts` | Modify | Return combined profile list |
| `app/api/browser-automation/profiles/[profileName]/route.ts` | Modify | Handle profile updates/deletion |
| `app/api/browser-automation/services/profile-storage.ts` | Modify | Track Anchor profile metadata |

### Pseudocode

#### `app/api/browser-automation/services/profile-storage.ts`
```typescript
const ANCHOR_PROFILES_FILE = '_tables/browser-profiles/anchor-profiles.json';

interface AnchorProfileMeta {
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
  lastUsed?: string;
}

export async function registerAnchorProfile(
  name: string, 
  displayName: string, 
  description?: string
): Promise<void> {
  const profiles = await readAnchorProfiles();
  
  // Check for conflicts
  if (profiles.find(p => p.name === name)) {
    throw new Error(`Profile ${name} already exists`);
  }
  
  profiles.push({
    name,
    displayName,
    description,
    createdAt: new Date().toISOString()
  });
  
  await writeAnchorProfiles(profiles);
}

export async function listAnchorProfiles(): Promise<AnchorProfileMeta[]> {
  try {
    const content = await fs.readFile(ANCHOR_PROFILES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];  // File doesn't exist yet
  }
}

export async function updateAnchorProfileLastUsed(name: string): Promise<void> {
  const profiles = await readAnchorProfiles();
  const profile = profiles.find(p => p.name === name);
  
  if (profile) {
    profile.lastUsed = new Date().toISOString();
    await writeAnchorProfiles(profiles);
  }
}

export async function deleteAnchorProfile(name: string): Promise<void> {
  const profiles = await readAnchorProfiles();
  const filtered = profiles.filter(p => p.name !== name);
  await writeAnchorProfiles(filtered);
  
  // Note: Actual Anchor profile may still exist server-side
  console.log(`Removed local metadata for Anchor profile: ${name}`);
}
```

#### `app/api/browser-automation/profiles/route.ts`
```typescript
export async function GET() {
  try {
    // Get local credential profiles (existing)
    const localProfiles = await profileStorage.listProfiles();
    
    // Get Anchor profile metadata
    const anchorProfiles = await profileStorage.listAnchorProfiles();
    
    // Combine and format
    const allProfiles: AnchorProfile[] = [
      ...anchorProfiles.map(p => ({
        ...p,
        type: 'anchor' as const
      })),
      ...localProfiles.map(p => ({
        name: p.name,
        displayName: p.displayName,
        type: 'local' as const,
        description: p.description,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
        credentialCount: p.credentials?.length
      }))
    ];
    
    // Sort by lastUsed (most recent first)
    allProfiles.sort((a, b) => {
      const aTime = a.lastUsed || a.createdAt;
      const bTime = b.lastUsed || b.createdAt;
      return bTime.localeCompare(aTime);
    });
    
    return NextResponse.json({ 
      success: true, 
      profiles: allProfiles 
    });
  } catch (error) {
    console.error("Failed to list profiles:", error);
    return NextResponse.json(
      { error: "Failed to list profiles" },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Anchor profiles tracked locally | anchor-profiles.json created |
| Combined profile list works | GET /profiles returns both types |
| Profile types distinguished | Each profile has correct `type` field |
| LastUsed updates correctly | Start session, check timestamp |
| Profile deletion works | DELETE removes from local tracking |
| Sorting by recency works | Most recent profiles appear first |

### Testing Strategy
- Unit test profile storage functions
- Integration test profile endpoints
- Verify profile persistence across sessions

---

## Phase 3: Frontend Profile UI

### Goal
Build UI components for creating, selecting, and managing persistent profiles. Add save profile prompt and enhance session creation dialog.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/experiments/browser-automation/store/slices/profilesSlice.ts` | Modify | Handle profile types and persistence |
| `app/(pages)/experiments/browser-automation/store/slices/sessionsSlice.ts` | Modify | Track persist flag |
| `app/(pages)/experiments/browser-automation/components/Profiles/ProfileDialog.tsx` | Modify | Add persist option |
| `app/(pages)/experiments/browser-automation/components/Profiles/ProfilePicker.tsx` | Modify | Show type indicators |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/NewSessionDialog.tsx` | Modify | Profile creation flow |
| `app/(pages)/experiments/browser-automation/components/SessionsSidebar/SaveProfilePrompt.tsx` | Create | Save session as profile |

### Pseudocode

#### `store/slices/profilesSlice.ts`
```typescript
interface Profile {
  name: string;
  displayName: string;
  type: 'anchor' | 'local';    // NEW
  description?: string;
  credentialCount?: number;
  createdAt: string;
  lastUsed?: string;
}

interface ProfilesSlice {
  profiles: Profile[];
  saveProfilePromptOpen: boolean;  // NEW
  pendingProfileSave: {           // NEW
    sessionId: string;
    suggestedName: string;
  } | null;
  
  // Actions
  openSaveProfilePrompt: (sessionId: string, name?: string) => void;
  saveSessionAsProfile: (name: string, displayName: string) => Promise<void>;
}

// Implementation
openSaveProfilePrompt: (sessionId, suggestedName) => {
  set({
    saveProfilePromptOpen: true,
    pendingProfileSave: { sessionId, suggestedName }
  });
},

saveSessionAsProfile: async (name, displayName, description) => {
  const { pendingProfileSave } = get();
  if (!pendingProfileSave) return;
  
  await fetch('/api/browser-automation/profiles/anchor', {
    method: 'POST',
    body: JSON.stringify({ name, displayName, description })
  });
  
  set({
    saveProfilePromptOpen: false,
    pendingProfileSave: null
  });
  
  // Refresh profiles
  await get().fetchProfiles();
}
```

#### `components/SessionsSidebar/NewSessionDialog.tsx`
```tsx
export function NewSessionDialog() {
  const [profileOption, setProfileOption] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [newProfileName, setNewProfileName] = useState('');
  const [persist, setPersist] = useState(true);
  
  const handleSubmit = async () => {
    let options: CreateSessionRequest = {};
    
    if (profileOption === 'new') {
      options = {
        profileName: newProfileName,
        persist: true,
        createNewProfile: true
      };
    } else if (profileOption === 'existing') {
      options = {
        profileName: selectedProfile
      };
    }
    
    await createSession(options);
    onClose();
  };
  
  return (
    <Dialog>
      <RadioGroup value={profileOption} onChange={setProfileOption}>
        <Radio value="none">No profile</Radio>
        <Radio value="existing">Use existing profile</Radio>
        <Radio value="new">Create new profile</Radio>
      </RadioGroup>
      
      {profileOption === 'existing' && (
        <ProfilePicker 
          value={selectedProfile}
          onChange={setSelectedProfile}
        />
      )}
      
      {profileOption === 'new' && (
        <>
          <Input
            label="Profile name"
            value={newProfileName}
            onChange={setNewProfileName}
            placeholder="linkedin-work"
            pattern="[a-z0-9-]+"
          />
          <Checkbox
            checked={persist}
            onChange={setPersist}
            label="Save browser state (stay logged in)"
          />
        </>
      )}
      
      <Button onClick={handleSubmit}>
        Create Session
      </Button>
    </Dialog>
  );
}
```

#### `components/SessionsSidebar/SaveProfilePrompt.tsx`
```tsx
export function SaveProfilePrompt() {
  const { saveProfilePromptOpen, pendingProfileSave, saveSessionAsProfile } = useProfilesStore();
  const [name, setName] = useState(pendingProfileSave?.suggestedName || '');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSave = async () => {
    if (!name || !displayName) return;
    
    await saveSessionAsProfile(name, displayName, description);
    toast.success(`Profile "${displayName}" saved`);
  };
  
  return (
    <Dialog open={saveProfilePromptOpen} onClose={closeSaveProfilePrompt}>
      <DialogTitle>Save Session as Profile</DialogTitle>
      <DialogDescription>
        Save this browser session so you stay logged in next time
      </DialogDescription>
      
      <Input
        label="Profile ID"
        value={name}
        onChange={setName}
        pattern="[a-z0-9-]+"
        helperText="Lowercase letters, numbers, and dashes only"
      />
      
      <Input
        label="Display Name"
        value={displayName}
        onChange={setDisplayName}
        placeholder="LinkedIn - Work Account"
      />
      
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={setDescription}
      />
      
      <DialogActions>
        <Button variant="text" onClick={closeSaveProfilePrompt}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Profile
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Profile options in new session dialog | Open dialog, see 3 radio options |
| Can create new persistent profile | Select "Create new", enter name, verify session |
| Can select existing profile | Select existing, verify session uses profile |
| Save profile prompt appears | Click "Save Profile" button, see dialog |
| Profile type badges visible | See "Saved Session" vs "Credentials" |
| Profiles sorted by recency | Most recently used appear first |

### Testing Strategy
- Component tests for dialogs and pickers
- E2E test full profile creation flow
- Visual regression for type badges
- Manual test LinkedIn login persistence

---

## Implementation Order

1. **Phase 1** (Day 1): Backend persistence
   - Critical path: Enable persist flag
   - Enables: Browser state saving

2. **Phase 2** (Day 2): Profile management
   - Critical path: Track and list profiles
   - Enables: Profile discovery and management

3. **Phase 3** (Day 3): Frontend UI
   - Critical path: User interaction
   - Enables: Complete user experience

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Anchor API unavailable | Graceful fallback to no-profile sessions |
| Profile name conflicts | Validate and suggest alternatives |
| Stale browser sessions | Show warning for old profiles |
| Profile list performance | Cache and paginate if needed |

---

## Success Metrics

- Profile creation success rate > 95%
- Session reuse with existing profile < 2 seconds
- LinkedIn login persistence works across sessions
- User satisfaction with saved sessions feature