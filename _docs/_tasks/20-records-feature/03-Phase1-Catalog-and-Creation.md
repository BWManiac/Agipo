# Phase 1: Catalog & Table Creation

**Status:** 📋 Planned
**Depends On:** None
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Enhance the Records catalog page to match the new design with table cards, quick stats, search, and templates. Ensure the Create Table dialog works correctly with the new fields (icon, description, initial columns).

After this phase, users can browse their tables in a polished card-based view, see quick stats, search for tables, and create new tables with proper metadata.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Card layout | Grid of cards vs list | Cards show richer metadata at a glance |
| Templates | Pre-built schema starters | Faster table creation for common use cases |
| Quick stats | Aggregate metrics at top | Immediate visibility into data volume |

### Pertinent Research

- **Mockup 06**: `06-catalog-view.html` - Shows card grid, stats bar, templates
- **Mockup 07**: `07-create-table.html` - Shows create dialog with icon, columns, agent access

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/page.tsx` | Modify | Restructure to match catalog mockup |
| `app/(pages)/records/components/RecordsCatalog.tsx` | Create | Card grid with table previews |
| `app/(pages)/records/components/TableCard.tsx` | Create | Individual table card component |
| `app/(pages)/records/components/QuickStats.tsx` | Create | Stats bar (tables, rows, agents, changes) |
| `app/(pages)/records/components/TemplateGrid.tsx` | Create | Template selection buttons |
| `app/(pages)/records/components/CreateTableDialog.tsx` | Modify | Add icon picker, initial columns, agent access |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-1.1 | Catalog shows tables as cards with icon, name, description | Navigate to /records, verify card layout |
| AC-1.2 | Each card shows row count, column count, agent avatars | Check card metadata matches table |
| AC-1.3 | Quick stats show total tables, rows, agents, changes | Verify numbers are accurate |
| AC-1.4 | Search filters tables by name | Type in search, verify filtering |
| AC-1.5 | "New Table" button opens create dialog | Click button, dialog appears |
| AC-1.6 | Create dialog has icon picker | Open dialog, change icon |
| AC-1.7 | Create dialog allows adding initial columns | Add 2-3 columns with types |
| AC-1.8 | Template buttons create pre-configured tables | Click CRM template, verify schema |
| AC-1.9 | Clicking table card navigates to table view | Click card, URL changes to /records/[tableId] |

### User Flows

#### Flow 1: Browse Tables

```
1. User navigates to /records
2. System shows catalog page with:
   - Quick stats bar at top
   - Grid of table cards
   - Templates section at bottom
3. User sees their existing tables
4. User can search by name to filter
```

#### Flow 2: Create Table from Scratch

```
1. User clicks "New Table" button
2. Dialog opens with:
   - Name input (required)
   - Description textarea
   - Icon picker
   - Initial columns list
3. User fills in name "Customer Feedback"
4. User adds columns: "Name" (text), "Rating" (number), "Comment" (text)
5. User clicks "Create Table"
6. System creates table, navigates to /records/customer-feedback
```

#### Flow 3: Create Table from Template

```
1. User clicks "CRM" template button
2. Dialog opens pre-filled with:
   - Name: "CRM"
   - Columns: Name, Email, Company, Status, Created
3. User modifies name to "Sales Pipeline"
4. User clicks "Create Table"
5. System creates table with template schema
```

---

## Out of Scope

- Agent access selection in create dialog → Phase 9
- Table deletion → Phase 9
- Empty state for zero tables → Polish phase
- Advanced search (by column, by content) → Future

---

## References

- **Mockup**: `06-catalog-view.html`, `07-create-table.html`
- **Existing Code**: `app/(pages)/records/page.tsx`
- **API**: `GET /api/records/list`, `POST /api/records/create`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
