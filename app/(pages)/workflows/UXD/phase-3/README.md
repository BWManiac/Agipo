# Phase 3 UXD Mockups

High-fidelity mockups for the Tools Panel implementation.

## Files

| File | Description |
|------|-------------|
| `tools-panel.html` | Complete tools panel with all states (default, loading, error, search, no results, hover) |
| `tool-palette-group.html` | Collapsible toolkit group component anatomy |
| `tool-palette-item.html` | Individual tool item component anatomy + IPO model explanation |
| `workflow-primitives-list-mapping.html` | Visual mapping of Mastra primitives to list view representations |

## How to View

Open any `.html` file directly in a browser. They use Tailwind CDN for styling.

## Design Decisions

1. **Tab bar** - 5 tabs (Tools, Inputs, Config, Connect, Test), Tools active by default
2. **Search** - Filters both toolkit names and tool names, highlights matches
3. **Toolkit groups** - Collapsible, show tool count, first expanded by default
4. **Tool items** - Show name, description (2 lines max), input/output counts ("X in, Y out")
5. **Hover state** - Primary color accent, "Click to add step" hint

## Implementation Notes

- Use ShadCN Input for search bar
- Use ShadCN Tabs for tab interface (or custom buttons if needed)
- Tool items are full-width buttons (accessible, clickable)
- Input/output counts derived from `Object.keys(schema.properties).length`

---

**Phase:** 3 - Tools Panel  
**Created:** December 2025

