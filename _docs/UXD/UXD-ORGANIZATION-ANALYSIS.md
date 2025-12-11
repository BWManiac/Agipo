# UXD Organization Analysis & Recommendations

**Date:** 2025-12-10  
**Status:** 📋 Analysis Complete - Awaiting Decision

---

## Current State

### UXD Files Location

**Primary Location:** `_docs/UXD/Pages/`
- ✅ Main UXD documentation hub
- ✅ Organized by feature/page (home, marketplace, records, workflow, etc.)
- ✅ Contains HTML mockups and planning documents

**Secondary Location:** `app/(pages)/workflows/UXD/`
- ⚠️ **INCONSISTENT** - UXD files inside implementation code
- Contains workflow-specific mockups and primitives
- ~30+ HTML files scattered in subdirectories

### File Counts

- `_docs/UXD/Pages/`: ~88 HTML files
- `app/(pages)/workflows/UXD/`: ~30+ HTML files
- **Total:** ~118+ HTML mockup files

---

## Issues Identified

### 1. Inconsistent Location
- Workflows UXD files are in `app/(pages)/workflows/UXD/` instead of `_docs/UXD/Pages/workflow/`
- Breaks the pattern of keeping all UXD in one place
- Makes it harder to find all design work

### 2. Mixed Organization Patterns
- Some features use date-based folders (`2025-12-09-sheets-v2/`, `2025-12-10-docs-v1/`)
- Some use feature-based folders (`home/`, `marketplace/`)
- Some use variation-based folders (`variation-1/`, `variation-2/`)
- Some use phase-based folders (`phase-3/`, `phase-4/`)

### 3. Deprecated Content
- `workflow/_deprecated/` folder exists
- `records/_old/` folder exists
- Unclear what's still relevant vs. obsolete

### 4. Duplicate/Similar Content
- `workforce/create-agent-flow/` and `workforce/2025-12-09-create-agent-flow/` both exist
- Unclear which is current

---

## Organization Recommendations

### Option 1: Feature-First with Versioning (Recommended)

**Structure:**
```
_docs/UXD/
├── Pages/
│   ├── home/
│   │   ├── home-page-plan.md
│   │   └── home.html
│   ├── marketplace/
│   │   ├── marketplace-page-plan.md
│   │   ├── marketplace.html
│   │   └── pricing-model-v2/
│   ├── records/
│   │   ├── README.md
│   │   ├── sheets-v2/          # Date-based versioning for major iterations
│   │   │   └── [mockups]
│   │   └── docs-v1/
│   │       └── [mockups]
│   ├── workflow/
│   │   ├── README.md
│   │   ├── flights/             # Flight A, B, C
│   │   ├── primitives/          # Reusable components
│   │   ├── phases/              # Phase-based mockups
│   │   └── deprecated/         # Old versions
│   ├── workforce/
│   │   ├── README.md
│   │   └── create-agent-flow/
│   ├── agents/
│   ├── settings/
│   └── experiments/
│       └── browser-automation/
└── Components/                  # NEW: Shared components
    ├── buttons/
    ├── forms/
    └── modals/
```

**Pros:**
- Clear feature organization
- Date-based versioning for major iterations
- Easy to find feature-specific designs
- Deprecated content clearly marked

**Cons:**
- Requires moving workflows UXD files
- Need to decide on versioning strategy

---

### Option 2: Date-First with Feature Grouping

**Structure:**
```
_docs/UXD/
├── 2025-10/
│   └── [early mockups]
├── 2025-11/
│   └── [november work]
├── 2025-12/
│   ├── 12-09/
│   │   ├── sheets-v2/
│   │   └── create-agent-flow/
│   └── 12-10/
│       ├── docs-v1/
│       └── browser-automation/
└── Components/
    └── [shared components]
```

**Pros:**
- Chronological organization
- Easy to see design evolution
- Good for historical reference

**Cons:**
- Harder to find current designs for a feature
- Requires more navigation
- Less intuitive for feature-based work

---

### Option 3: Hybrid - Feature with Status

**Structure:**
```
_docs/UXD/
├── Pages/
│   ├── home/                    # Current/Active
│   ├── marketplace/             # Current/Active
│   ├── records/
│   │   ├── current/             # Latest version
│   │   │   └── sheets-v2/
│   │   ├── versions/            # Historical
│   │   │   └── sheets-v1/
│   │   └── deprecated/          # Old/Unused
│   ├── workflow/
│   │   ├── current/             # Latest
│   │   ├── flights/             # Flight variations
│   │   └── deprecated/
│   └── experiments/
│       └── browser-automation/
└── Components/
    └── [shared components]
```

**Pros:**
- Clear current vs. historical
- Easy to find latest designs
- Preserves history

**Cons:**
- More folder nesting
- Need to maintain "current" links

---

### Option 4: Flat with Naming Convention

**Structure:**
```
_docs/UXD/
├── Pages/
│   ├── home/
│   ├── marketplace/
│   ├── records-sheets-v2-2025-12-09/
│   ├── records-docs-v1-2025-12-10/
│   ├── workflow-flight-a/
│   ├── workflow-flight-b/
│   ├── workflow-flight-c/
│   ├── workflow-primitives/
│   ├── workflow-phases/
│   └── workforce-create-agent-2025-12-09/
└── Components/
```

**Pros:**
- Simple, flat structure
- Self-documenting names
- Easy to scan

**Cons:**
- Long folder names
- Harder to group related versions
- Less hierarchical organization

---

## Recommended Action Plan

### Immediate Actions

1. **Move Workflows UXD Files**
   - Move `app/(pages)/workflows/UXD/` → `_docs/UXD/Pages/workflow/`
   - Consolidate into appropriate subfolders (flights, primitives, phases)

2. **Clean Up Duplicates**
   - Resolve `workforce/create-agent-flow/` vs `workforce/2025-12-09-create-agent-flow/`
   - Decide which is current, archive the other

3. **Organize Deprecated Content**
   - Move all deprecated content to `_deprecated/` folders
   - Add README explaining what's deprecated and why

### Recommended Structure (Option 1)

**Rationale:**
- Feature-first is most intuitive for developers/designers
- Date-based versioning handles major iterations
- Clear separation of current vs. deprecated
- Easy to extend with new features

**Migration Path:**
1. Move workflows UXD to `_docs/UXD/Pages/workflow/`
2. Organize by: `flights/`, `primitives/`, `phases/`, `deprecated/`
3. Consolidate duplicate workforce flows
4. Add README files to each major feature folder
5. Create `Components/` folder for shared design elements

---

## Questions to Answer

1. **Versioning Strategy:** Use date-based (`2025-12-09-sheets-v2`) or semantic (`sheets-v2`)?
2. **Deprecated Content:** Keep in feature folders or move to central `_deprecated/`?
3. **Shared Components:** Create separate `Components/` folder or keep in feature folders?
4. **Planning Docs:** Keep `.md` files alongside HTML or separate `Plans/` folder?

---

## Next Steps

1. Review recommendations
2. Choose organization approach
3. Create migration plan
4. Execute file moves
5. Update references in code/docs

---

**Last Updated:** 2025-12-10
