/**
 * Business-friendly field vocabulary that we surface to workflow authors.
 * These intentionally avoid low-level TypeScript/JSON jargon so PMs and ops
 * folks can reason about data bindings without reading code.
 *
 * - `text`: plain UTF-8 string payloads.
 * - `number`: any numeric value (int/float). The runner is responsible for casting.
 * - `flag`: boolean yes/no values.
 * - `list`: ordered collection; see `BusinessListItemType` for per-item typing.
 * - `record`: loosely-typed object/JSON payload.
 * - `file`: binary/file attachments (future expansion: csv/pdf/etc.).
 */
export type BusinessFieldType =
  | "text"
  | "number"
  | "flag"
  | "list"
  | "record"
  | "file";

/**
 * When a field is a list we still need to know the shape of each entry so we
 * can validate bindings (e.g. list of text → list of text is OK).
 */
export type BusinessListItemType =
  | "text"
  | "number"
  | "flag"
  | "record"
  | "file";

/**
 * A pointer to a specific field on a node.  We store the owning node ID as well
 * as the semantic type information so validation can run without looking up the
 * node object again.
 */
export type EdgeFieldRef = {
  nodeId: string;
  fieldName: string;
  type: BusinessFieldType;
  itemType?: BusinessListItemType;
};

/**
 * `EdgeLink` represents a mapping between an upstream output and a downstream
 * input.  `from` is optional so we can represent static/default values for
 * targets that do not connect to any source node.
 */
export type EdgeLink = {
  from?: EdgeFieldRef;
  to: EdgeFieldRef;
  staticValue?: string;
};

/**
 * A collection of bindings for a specific edge.  We store notes so future UX
 * work can surface human-readable guidance or rationale alongside the mapping.
 */
export type EdgeMapping = {
  edgeId: string;
  links: EdgeLink[];
  notes?: string;
};

/**
 * Result object returned by link/unlink operations so the UI can display
 * validation feedback.  `warning` states highlight mismatches but still allow
 * the user to persist a binding if they really want to (e.g. type coercion).
 */
export type MatchResult =
  | { status: "ok" }
  | {
      status: "warning";
      reason:
        | "type-mismatch"
        | "list-item-mismatch"
        | "missing-upstream"
        | "missing-downstream";
    };

