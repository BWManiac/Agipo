# Records Page - UXD

**Status:** Active Development
**Last Updated:** December 9, 2025

---

## Overview

The Records page is a "Sheets-like" interface for managing structured data tables. Users can create tables, edit data inline, and chat with AI agents about the data.

---

## Design Iterations

### Current: 2025-12-09-sheets-v2

**Focus:** Chat sidebar integration with data grid

**Key Features:**
- Split-pane layout: Chat sidebar + Data grid
- Agent picker for selecting workforce agents
- Real-time updates when agent modifies data
- Column sorting and filtering
- Attribution tracking (User vs Agent)

**Design Language:** v2-minimal (clean, monochrome, professional)

**Mockups:**
| File | Description |
|------|-------------|
| `01-table-with-chat.html` | Primary view: grid + chat sidebar |
| `02-agent-picker.html` | Agent selection dropdown |
| `03-empty-table.html` | Empty table state with prompts |
| `04-column-filter.html` | Sort and filter UI (collapsed sidebar) |
| `05-chat-states.html` | Reference: all chat states |
| `06-catalog-view.html` | Table catalog/listing page |
| `07-create-table.html` | Create new table dialog |
| `08-table-access-panel.html` | Settings panel: access & activity |
| `Frontend-Backend-Mapping.md` | API requirements |

### Previous: _old/

Legacy designs from initial MVP. Moved for reference.

---

## Related Documentation

- **Product Spec:** `_docs/_tasks/20-records-feature/00-Product-Spec.md`
- **Feature Doc:** `_docs/Product/Features/02-Shared-Memory-Records.md`
- **Implementation:** `_docs/_diary/13-RecordsDomainAndPolars.md`
