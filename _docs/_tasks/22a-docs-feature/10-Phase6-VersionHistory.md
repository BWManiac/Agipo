# Phase 6: Version History

**Status:** 📋 Planned  
**Depends On:** Phase 1 (Core Document CRUD)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Add version tracking, comparison, and restoration. After this phase, users can:
- View document version history
- See who made changes (user vs agent)
- Compare versions side-by-side
- Restore previous versions

This phase enables change tracking and rollback capabilities.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version Storage | Timestamped files | Simple, Git-friendly |
| Version Creation | Auto-save triggers | Automatic, no user action needed |
| Diff Algorithm | `diff-match-patch` | Fast, accurate, handles Markdown |
| Version Attribution | Track user/agent | Clear audit trail |

### Pertinent Research

- **RQ-9**: Version diff generation (diff-match-patch)
- **RQ-10**: Auto-save version creation

*Source: `02-Research-Log.md`*

### Overall File Impact

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/[docId]/versions/route.ts` | Create | GET list versions | A |
| `app/api/dox/[docId]/versions/[versionId]/route.ts` | Create | GET version, POST restore | A |
| `app/api/dox/[docId]/versions/[versionId]/compare/route.ts` | Create | GET version diff | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/services/version-manager.ts` | Create | Version tracking | A |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/VersionHistory/index.tsx` | Create | Version list | B |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionItem.tsx` | Create | Version entry | B |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionPreview.tsx` | Create | Version preview | B |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionCompare.tsx` | Create | Diff view | B |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/versionSlice.ts` | Create | Version history state | B |

#### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/hooks/useDocumentVersions.ts` | Create | Version history hooks | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-6.1 | Versions auto-created periodically | Edit document, verify version created | A |
| AC-6.2 | Version list shows all versions | Open version history, verify list | B |
| AC-6.3 | Version preview works | Click version, verify preview | B |
| AC-6.4 | Version comparison shows diff | Compare two versions, verify diff | B |
| AC-6.5 | Can restore versions | Click restore, verify document restored | A |
| AC-6.6 | Agent versions marked distinctly | Agent edit, verify version marked | A |

### User Flows (Phase Level)

#### Flow 1: View Version History

```
1. User opens version history panel
2. System fetches versions from API
3. User sees list of versions
4. Each version shows: timestamp, author, excerpt
5. User clicks a version
6. Version preview opens
```

#### Flow 2: Restore Version

```
1. User views version history
2. User clicks "Restore" on a version
3. System confirms restoration
4. Document content restored
5. New version created (restore point)
```

---

## Part A: Backend Version Management

### Goal

Build version tracking, storage, and diff generation.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/dox/[docId]/versions/route.ts` | Create | GET list versions | ~100 |
| `app/api/dox/[docId]/versions/[versionId]/route.ts` | Create | GET version, POST restore | ~120 |
| `app/api/dox/[docId]/versions/[versionId]/compare/route.ts` | Create | GET version diff | ~150 |
| `app/api/dox/services/version-manager.ts` | Create | Version tracking | ~150 |

### Pseudocode

#### `app/api/dox/services/version-manager.ts`

```
createVersion(docId: string, content: string, author: { type, id, name }): Promise<Version>
├── Generate versionId (timestamp-based)
├── Create _tables/dox/[docId]/versions/[versionId].md
├── Write content to version file
├── Create _tables/dox/[docId]/versions/[versionId].meta.json
│   └── { versionId, createdAt, author, excerpt }
├── Update versions index
└── Return: { versionId, createdAt, author, excerpt }

listVersions(docId: string): Promise<Version[]>
├── Read _tables/dox/[docId]/versions/ directory
├── For each version file:
│   ├── Read meta.json
│   └── Add to versions array
├── Sort by createdAt (descending)
└── Return: versions array

getVersion(docId: string, versionId: string): Promise<Version>
├── Read _tables/dox/[docId]/versions/[versionId].md
├── Read _tables/dox/[docId]/versions/[versionId].meta.json
└── Return: { versionId, content, createdAt, author }

compareVersions(docId: string, versionId1: string, versionId2: string): Promise<Diff>
├── Read both version files
├── Use diff-match-patch to generate diff
├── Format diff (line-by-line, word-level)
└── Return: { added, removed, unchanged }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.1 | Versions auto-created periodically | Edit document, verify version created |
| AC-6.5 | Can restore versions | Click restore, verify document restored |
| AC-6.6 | Agent versions marked distinctly | Agent edit, verify version marked |

### User Flows

#### Flow A.1: Auto-Create Version

```
1. User edits document
2. Auto-save triggers (Phase 2)
3. version-manager.createVersion() called
4. Version file created
5. Version metadata saved
```

---

## Part B: Frontend Version UI

### Goal

Build version history panel with preview and comparison.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/VersionHistory/index.tsx` | Create | Version list | ~100 |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionItem.tsx` | Create | Version entry | ~80 |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionPreview.tsx` | Create | Version preview | ~120 |
| `app/(pages)/dox/[docId]/components/VersionHistory/VersionCompare.tsx` | Create | Diff view | ~150 |
| `app/(pages)/dox/[docId]/store/slices/versionSlice.ts` | Create | Version state | ~150 |
| `app/(pages)/dox/[docId]/hooks/useDocumentVersions.ts` | Create | Version hooks | ~120 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/VersionHistory/index.tsx`

```
VersionHistory
├── Render: Panel
│   ├── Header: "Version History"
│   ├── Content: Version list
│   │   ├── VersionItem (for each version)
│   │   └── Empty state (if no versions)
│   └── Actions: Compare, Restore
├── Store: useDocsStore()
│   ├── versionSlice.versions
│   └── versionSlice.selectedVersionId
└── Events:
    ├── Click version → Show preview
    ├── Click compare → Show diff
    └── Click restore → Restore version
```

#### `app/(pages)/dox/[docId]/store/slices/versionSlice.ts`

```
versionSlice
├── State:
│   ├── versions: Version[]
│   ├── selectedVersionId: string | null
│   ├── compareVersionIds: [string, string] | null
│   └── isLoading: boolean
├── Actions:
│   ├── setVersions(versions)
│   ├── setSelectedVersion(id)
│   ├── setCompareVersions([id1, id2])
│   ├── loadVersions(docId)
│   └── restoreVersion(docId, versionId)
└── Implementation:
    ├── loadVersions: GET /api/dox/[docId]/versions
    └── restoreVersion: POST /api/dox/[docId]/versions/[versionId], reload document
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-6.2 | Version list shows all versions | Open version history, verify list |
| AC-6.3 | Version preview works | Click version, verify preview |
| AC-6.4 | Version comparison shows diff | Compare two versions, verify diff |

### User Flows

#### Flow B.1: Compare Versions

```
1. User opens version history
2. User selects two versions
3. User clicks "Compare"
4. System fetches diff from API
5. Diff view shows changes
6. Added lines in green, removed in red
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Version branching** → Future consideration
- **Version comments** → Future consideration
- **Version tags** → Future consideration

---

## References

- **Research**: `02-Research-Log.md` - Version diff patterns
- **Architecture**: `03-Technical-Architecture.md` - Version management
- **External**: [diff-match-patch Documentation](https://github.com/google/diff-match-patch) - Diff algorithm

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10
