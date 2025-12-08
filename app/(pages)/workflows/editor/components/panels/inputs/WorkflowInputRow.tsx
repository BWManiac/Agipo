"use client";

import { useState, useEffect } from "react";
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
  const [defaultValue, setDefaultValue] = useState<string>(
    input.defaultValue !== undefined ? String(input.defaultValue) : ""
  );

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

  // Sync defaultValue state when input.defaultValue changes (e.g., from type change)
  useEffect(() => {
    if (input.defaultValue !== undefined) {
      setDefaultValue(String(input.defaultValue));
    } else {
      setDefaultValue("");
    }
  }, [input.defaultValue, input.type]);

  const handleDefaultValueBlur = () => {
    // Convert string value to appropriate type based on input.type
    let parsedValue: unknown = undefined;
    
    if (defaultValue.trim() === "") {
      parsedValue = undefined;
    } else {
      switch (input.type) {
        case "number":
          parsedValue = Number(defaultValue);
          if (isNaN(parsedValue as number)) {
            // Invalid number, don't save
            return;
          }
          break;
        case "boolean":
          parsedValue = defaultValue.toLowerCase() === "true" || defaultValue === "1";
          break;
        default:
          parsedValue = defaultValue;
      }
    }

    updateWorkflowInput(input.name, { defaultValue: parsedValue });
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

      {/* Default Value (AC-9.3) - Below description, type-aware input */}
      <div className="pt-2 border-t border-gray-100">
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
          Default value
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        
        {input.type === "boolean" ? (
          // Boolean: Checkbox (AC-9.4)
          <div className="flex items-center gap-3 p-2 bg-blue-50/50 border border-blue-200 rounded-md">
            <Checkbox
              id={`default-${input.name}`}
              checked={input.defaultValue === true}
              onCheckedChange={(checked) => {
                const boolValue = checked === true;
                setDefaultValue(String(boolValue));
                updateWorkflowInput(input.name, { defaultValue: boolValue });
              }}
              className="w-5 h-5"
            />
            <label
              htmlFor={`default-${input.name}`}
              className="text-xs text-gray-700 cursor-pointer flex-1"
            >
              Default to <strong>{input.defaultValue === true ? "true" : "false"}</strong>
            </label>
          </div>
        ) : input.type === "number" ? (
          // Number: Number input (AC-9.4)
          <Input
            type="number"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            onBlur={handleDefaultValueBlur}
            placeholder="Enter number..."
            className="h-8 text-xs font-mono bg-blue-50/50 border-blue-200 focus:border-blue-500"
          />
        ) : (
          // String/Array/Object: Text input (AC-9.4)
          <Input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            onBlur={handleDefaultValueBlur}
            placeholder="Enter default value..."
            className="h-8 text-xs font-mono bg-blue-50/50 border-blue-200 focus:border-blue-500 placeholder:text-gray-400"
          />
        )}
        
        <p className="text-[10px] text-gray-400 mt-1 ml-1">
          This value will be used if not provided when the workflow is invoked
        </p>
      </div>
    </div>
  );
}

