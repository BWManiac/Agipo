# Workflow UXD Mockups

This folder contains all UXD mockups and design documentation for the Workflow feature.

---

## Structure

```
workflow/
├── current/              # Latest/active mockups
│   ├── editor-layout.html
│   ├── create-workflow-modal.html
│   └── workflow-list-page.html
├── flights/              # Flight variations (A, B, C)
│   ├── Flight A/
│   ├── Flight B/
│   └── Flight C/
├── primitives/           # Reusable UI components
│   ├── canvas-view/
│   ├── list-view/
│   ├── tool-list-view/
│   ├── rail-view/
│   └── right-panel/
├── phases/               # Phase-based mockups
│   ├── phase-3/
│   ├── phase-4/
│   └── phase-7/
└── _deprecated/          # Old/obsolete designs
    └── io-visualizations/
```

---

## Current Mockups

### Editor Layout
- **File:** `current/editor-layout.html`
- **Description:** 3-panel editor layout (chat left, workflow center, settings right)

### Create Workflow Modal
- **File:** `current/create-workflow-modal.html`
- **Description:** Modal dialog for creating new workflows

### Workflow List Page
- **File:** `current/workflow-list-page.html`
- **Description:** List view of all workflows

---

## Flight Variations

Flight A, B, and C represent different design approaches for the workflow editor. See individual flight folders for variations.

---

## Primitives

Reusable UI components and patterns:
- **Canvas View:** Node/edge visualization patterns
- **List View:** Outline and swimlane views
- **Tool List View:** Tool palette components
- **Rail View:** Sidebar navigation patterns
- **Right Panel:** Input panels and configuration

---

## Phases

Phase-based mockups organized by implementation phase:
- **Phase 3:** Tools panel and tool palette
- **Phase 4:** Logic panel and control flow
- **Phase 7:** Details tab and source selection

---

## Design System

All mockups use:
- **ShadCN components** (Button, Card, Dialog, etc.)
- **Minimal custom styling** (polish later)
- **Consistent patterns** with existing codebase

---

**Last Updated:** 2025-12-10
