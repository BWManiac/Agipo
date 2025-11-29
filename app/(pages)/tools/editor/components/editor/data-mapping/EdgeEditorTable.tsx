"use client";

/**
 * EdgeEditorTable
 * ----------------
 * Table-driven UI for managing mappings between a source node's outputs and a
 * target node's inputs.  This mirrors the ShadCN table mock the PM approved and
 * keeps the data entry flow compact enough for the sidebar.
 *
 * Responsibilities:
 *  - Render one row per target input so nothing is hidden.
 *  - Allow users to pick an upstream field or fall back to a static default.
 *  - Surface validation warnings (type mismatches, missing bindings) inline.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import type {
  BusinessFieldType,
  BusinessListItemType,
  EdgeFieldRef,
  EdgeLink,
  EdgeMapping,
  MatchResult,
} from "../../../types/domain";
import type { WorkflowNode } from "../../../store/types";

type EdgeEditorTableProps = {
  sourceNode: WorkflowNode | null;
  targetNode: WorkflowNode | null;
  mapping?: EdgeMapping;
  onLink: (from: EdgeFieldRef | undefined, to: EdgeFieldRef) => MatchResult;
  onUnlink: (to: EdgeFieldRef) => void;
  onStaticValue: (to: EdgeFieldRef, value: string) => void;
};

const typeLabel = (type: BusinessFieldType, itemType?: BusinessListItemType) => {
  if (type === "flag") return "Flag";
  if (type === "list") {
    return `List • ${itemType ?? "text"}`;
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const compatibility = (
  from?: EdgeFieldRef,
  to?: EdgeFieldRef
): MatchResult => {
  if (!to) return { status: "warning", reason: "missing-downstream" };
  if (!from) return { status: "warning", reason: "missing-upstream" };
  if (from.type !== to.type) return { status: "warning", reason: "type-mismatch" };
  if (from.type === "list" && from.itemType !== to.itemType) {
    return { status: "warning", reason: "list-item-mismatch" };
  }
  return { status: "ok" };
};

const findLinkForField = (
  mapping: EdgeMapping | undefined,
  field: EdgeFieldRef
): EdgeLink | undefined =>
  mapping?.links.find(
    (link) =>
      link.to.nodeId === field.nodeId && link.to.fieldName === field.fieldName
  );

export function EdgeEditorTable({
  sourceNode,
  targetNode,
  mapping,
  onLink,
  onUnlink,
  onStaticValue,
}: EdgeEditorTableProps) {
  const sourceFields =
    sourceNode?.data.spec.outputs.map((output) => ({
      nodeId: sourceNode.id,
      fieldName: output.name,
      type: output.type,
      itemType: output.itemType,
      description: output.description,
    })) ?? [];

  const targetFields =
    targetNode?.data.spec.inputs.map((input) => ({
      nodeId: targetNode.id,
      fieldName: input.name,
      type: input.type,
      itemType: input.itemType,
      description: input.description,
      optional: input.optional,
    })) ?? [];

  const mappedCount = mapping?.links.filter((link) => link.from || link.staticValue)
    .length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Field bindings</h2>
          <p className="text-xs text-muted-foreground">
            Map outputs from <strong>{sourceNode?.data.title ?? "?"}</strong> to{" "}
            inputs on <strong>{targetNode?.data.title ?? "?"}</strong>.
          </p>
        </div>
        <Badge variant="secondary">
          {mappedCount ?? 0} of {targetFields.length} mapped
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target input</TableHead>
            <TableHead className="w-48">Bind source</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targetFields.map((target) => {
            const targetRef: EdgeFieldRef = {
              nodeId: target.nodeId,
              fieldName: target.fieldName,
              type: target.type,
              itemType: target.itemType,
            };
            const link = findLinkForField(mapping, targetRef);
            const activeSource = link?.from;
            const status =
              link?.staticValue !== undefined
                ? { status: "ok" as const }
                : compatibility(activeSource, targetRef);

            return (
              <TableRow key={`${target.nodeId}-${target.fieldName}`}>
                <TableCell>
                  <div className="font-medium">{target.fieldName}</div>
                  <div className="text-xs text-muted-foreground">
                    {typeLabel(target.type, target.itemType)}
                    {target.optional ? " • Optional" : null}
                  </div>
                  {target.description ? (
                    <div className="text-xs text-muted-foreground">
                      {target.description}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Select
                    value={
                      link?.staticValue !== undefined
                        ? "__static__"
                        : activeSource?.fieldName ?? ""
                    }
                    onValueChange={(value) => {
                      if (value === "__clear__") {
                        onUnlink(targetRef);
                        return;
                      }
                      if (value === "__static__") {
                        onStaticValue(targetRef, link?.staticValue ?? "");
                        return;
                      }
                      const source = sourceFields.find(
                        (candidate) => candidate.fieldName === value
                      );
                      if (!source) return;
                      // Delegate to store; validation happens in the slice.
                      onLink(
                        {
                          nodeId: source.nodeId,
                          fieldName: source.fieldName,
                          type: source.type,
                          itemType: source.itemType,
                        },
                        targetRef
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__clear__">No binding</SelectItem>
                      <SelectItem value="__static__">Set default value</SelectItem>
                      {sourceFields.map((field) => (
                        <SelectItem key={field.fieldName} value={field.fieldName}>
                          {field.fieldName} · {typeLabel(field.type, field.itemType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {link?.staticValue !== undefined ? (
                    <Input
                      className="mt-2"
                      placeholder="Default value..."
                      value={link.staticValue}
                      onChange={(event) =>
                        onStaticValue(targetRef, event.target.value)
                      }
                    />
                  ) : null}
                </TableCell>
                <TableCell>
                  {status.status === "ok" ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Linked
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-amber-100 text-amber-700">
                      Needs mapping
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

