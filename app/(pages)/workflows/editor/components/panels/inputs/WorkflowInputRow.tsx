"use client";

import { useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkflowInputDefinition } from "@/app/api/workflows/types/bindings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowInputRowProps {
  input: WorkflowInputDefinition;
}

const typeOptions = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "object", label: "Object" },
  { value: "array", label: "Array" },
] as const;

export function WorkflowInputRow({ input }: WorkflowInputRowProps) {
  const { updateWorkflowInput, removeWorkflowInput } = useWorkflowStore();
  const [name, setName] = useState(input.name);
  const [description, setDescription] = useState(input.description || "");

  const handleNameBlur = () => {
    if (name !== input.name && name.trim()) {
      updateWorkflowInput(input.name, { name: name.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== input.description) {
      updateWorkflowInput(input.name, { description: description || undefined });
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-3">
      {/* Name + Type row */}
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="Input name"
          className="h-8 text-xs flex-1 font-mono"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 h-8 text-xs bg-white border border-input rounded-md hover:bg-muted">
              {input.type}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {typeOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => updateWorkflowInput(input.name, { type: opt.value })}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => removeWorkflowInput(input.name)}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Required checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`required-${input.name}`}
          checked={input.required}
          onCheckedChange={(checked) =>
            updateWorkflowInput(input.name, { required: checked === true })
          }
        />
        <label
          htmlFor={`required-${input.name}`}
          className="text-xs text-muted-foreground cursor-pointer"
        >
          Required
        </label>
      </div>

      {/* Description */}
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Description (optional)"
        className="h-8 text-xs"
      />
    </div>
  );
}

