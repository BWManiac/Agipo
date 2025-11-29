"use client";

/**
 * SpecFieldRow
 * ------------
 * Editable row inside the node spec editor.  Handles the business-friendly
 * field vocabulary and ensures list fields expose a secondary selector for the
 * per-item type.  This keeps the UX approachable for non-engineers without
 * sacrificing strongly-typed state downstairs.
 */
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

import type {
  BusinessFieldType,
  BusinessListItemType,
} from "../../../types/domain";

const FIELD_TYPES: BusinessFieldType[] = [
  "text",
  "number",
  "flag",
  "list",
  "record",
  "file",
];

const LIST_ITEM_TYPES: BusinessListItemType[] = [
  "text",
  "number",
  "flag",
  "record",
  "file",
];

type SpecFieldRowProps = {
  name: string;
  type: BusinessFieldType;
  itemType?: BusinessListItemType;
  description?: string;
  optional?: boolean;
  onChange: (patch: {
    name?: string;
    type?: BusinessFieldType;
    itemType?: BusinessListItemType;
    description?: string;
    optional?: boolean;
  }) => void;
  onRemove: () => void;
};

export function SpecFieldRow({
  name,
  type,
  itemType,
  description,
  optional,
  onChange,
  onRemove,
}: SpecFieldRowProps) {
  const handleTypeChange = (value: BusinessFieldType) => {
    // When switching away from "list" we strip the `itemType` so downstream validation stays tidy.
    onChange({
      type: value,
      itemType: value === "list" ? itemType ?? "text" : undefined,
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Name
          </Label>
          <input
            value={name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Field name"
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Type
          </Label>
          <Select
            value={type}
            onValueChange={(value) =>
              handleTypeChange(value as BusinessFieldType)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a type" />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "flag"
                    ? "Flag (true/false)"
                    : option === "list"
                    ? "List"
                    : option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === "list" ? (
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Item type
          </Label>
          <Select
            value={itemType ?? "text"}
            onValueChange={(value) =>
              onChange({
                itemType: value as BusinessListItemType,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick an item type" />
            </SelectTrigger>
            <SelectContent>
              {LIST_ITEM_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Description
        </Label>
        <Textarea
          value={description ?? ""}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Describe the field"
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <Checkbox
            checked={optional ?? false}
            onCheckedChange={(value) => onChange({ optional: value === true })}
          />
          Optional
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md border border-transparent bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  );
}

