"use client";

import { useState } from "react";
import { ChevronDown, X, Variable, Layers, FileInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkflowStep, FieldMapping, RuntimeInputConfig, JSONSchema } from "@/app/api/workflows/services/types";

interface MappingDropdownProps {
  targetField: string;
  targetType?: string;
  currentMapping?: FieldMapping;
  previousSteps: WorkflowStep[];
  runtimeInputs: RuntimeInputConfig[];
  onSelect: (sourceStepId: string, sourcePath: string, sourceType?: string) => void;
  onClear: () => void;
}

export function MappingDropdown({
  targetField,
  targetType,
  currentMapping,
  previousSteps,
  runtimeInputs,
  onSelect,
  onClear,
}: MappingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayValue = () => {
    if (!currentMapping) return "Select source...";
    
    if (currentMapping.sourcePath.startsWith("{{inputs.")) {
      const inputKey = currentMapping.sourcePath.replace("{{inputs.", "").replace("}}", "");
      const input = runtimeInputs.find((i) => i.key === inputKey);
      return `Input: ${input?.label || inputKey}`;
    }
    
    const sourceStep = previousSteps.find((s) => 
      currentMapping.sourcePath.startsWith(`{{steps.${s.id}.`)
    );
    if (sourceStep) {
      const path = currentMapping.sourcePath
        .replace(`{{steps.${sourceStep.id}.`, "")
        .replace("}}", "");
      return `${sourceStep.name}: ${path}`;
    }
    
    return currentMapping.sourcePath;
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !currentMapping && "text-slate-500"
            )}
          >
            <span className="truncate">{getDisplayValue()}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Static value option */}
          <DropdownMenuItem
            onClick={() => {
              const value = prompt(`Enter static value for ${targetField}:`);
              if (value !== null) {
                onSelect("__static__", value, "string");
              }
            }}
          >
            <Variable className="h-4 w-4 mr-2" />
            Static Value
          </DropdownMenuItem>
          
          {/* Runtime inputs */}
          {runtimeInputs.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileInput className="h-4 w-4 mr-2" />
                  Workflow Inputs
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {runtimeInputs.map((input) => (
                    <DropdownMenuItem
                      key={input.key}
                      onClick={() => onSelect("__input__", input.key, input.type)}
                    >
                      <span className="flex-1">{input.label}</span>
                      <span className="text-xs text-slate-400">{input.type}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
          
          {/* Previous steps */}
          {previousSteps.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {previousSteps.map((step) => (
                <StepOutputsMenu
                  key={step.id}
                  step={step}
                  onSelectField={(path, type) => onSelect(step.id, path, type)}
                />
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {currentMapping && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface StepOutputsMenuProps {
  step: WorkflowStep;
  onSelectField: (path: string, type?: string) => void;
}

function StepOutputsMenu({ step, onSelectField }: StepOutputsMenuProps) {
  const outputProperties = step.outputSchema.properties
    ? Object.entries(step.outputSchema.properties)
    : [];

  if (outputProperties.length === 0) {
    return null;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Layers className="h-4 w-4 mr-2" />
        {step.name}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {outputProperties.map(([fieldName, schema]) => (
          <OutputFieldItem
            key={fieldName}
            fieldName={fieldName}
            schema={schema as JSONSchema}
            basePath=""
            onSelect={(path, type) => onSelectField(path, type)}
          />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

interface OutputFieldItemProps {
  fieldName: string;
  schema: JSONSchema;
  basePath: string;
  onSelect: (path: string, type?: string) => void;
}

function OutputFieldItem({ fieldName, schema, basePath, onSelect }: OutputFieldItemProps) {
  const fullPath = basePath ? `${basePath}.${fieldName}` : fieldName;
  const hasNestedProperties = schema.type === "object" && schema.properties;

  if (hasNestedProperties && schema.properties) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span className="flex-1">{fieldName}</span>
          <span className="text-xs text-slate-400">{schema.type}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {Object.entries(schema.properties).map(([nestedField, nestedSchema]) => (
            <OutputFieldItem
              key={nestedField}
              fieldName={nestedField}
              schema={nestedSchema as JSONSchema}
              basePath={fullPath}
              onSelect={onSelect}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenuItem onClick={() => onSelect(fullPath, schema.type)}>
      <span className="flex-1">{fieldName}</span>
      <span className="text-xs text-slate-400">{schema.type}</span>
    </DropdownMenuItem>
  );
}




