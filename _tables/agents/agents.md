# Agents Table

| Column | Type | Description | Notes |
| --- | --- | --- | --- |
| id | string | Unique identifier for the agent. | Prefer human-readable slug; fallback to nanoid. |
| name | string | Display name shown across UI and APIs. | Keep short; used in marketplace listings. |
| description | string | Summary of the agent's purpose or specialization. | Optional; surfaced in tooltips and docs. |
| tool_ids | string[] | Identifiers of tools the agent can call. | Represents many-to-many relationship to tools table. |

## Purpose
- Capture the smallest useful shape of an "agent" we can ship today.
- Keep structure simple enough to mock in JSON and grow toward a real database.
- Align the definition with the product vision that "an agent is defined by its tools."

## Rationale & Notes
- `tool_ids` keeps the schema lean while reinforcing that capabilities flow through tools.
- We expect tools to live in their own table with metadata (name, invocation contract, etc.); referencing them by id avoids premature embedding.
- Leaving `description` optional lets us iterate on tone and copy without blocking schema changes.
- Using string ids keeps the doc and the eventual mock data file readable; we can revisit UUIDs later if needed.

## Open Questions / Next Iterations
- Do we need per-agent configuration (e.g., model preference, temperature) or should that live on tools or runtime profiles?
- Should we capture ownership or provenance (creator, version) now, or defer until marketplace requirements solidify?
- How do we want to represent layered tool permissions (e.g., default vs. premium tool access)?

## Example Record (TBD)
- Will add once we sketch the corresponding tools table to keep references consistent.
