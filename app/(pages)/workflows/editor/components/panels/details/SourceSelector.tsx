"use client";

import { useState } from "react";
import { ChevronDown, FileOutput, FileInput, Type, Check } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import { StepPathPicker } from "./StepPathPicker";
import type { FieldBinding, WorkflowInputDefinition } from "@/app/api/workflows/types/bindings";
import type { WorkflowStep } from "@/app/api/workflows/types";
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
import { Input } from "@/components/ui/input";

interface SourceSelectorProps {
  stepId: string;
  fieldName: string;
  currentBinding?: FieldBinding;
  previousSteps: WorkflowStep[];
  workflowInputs: WorkflowInputDefinition[];
  isFirstStep: boolean;
  onChange: (binding: FieldBinding) => void;
  variant: "empty" | "edit";
}

export function SourceSelector({
  stepId,
  fieldName,
  currentBinding,
  previousSteps,
  workflowInputs,
  isFirstStep,
  onChange,
  variant,
}: SourceSelectorProps) {
  const { steps } = useWorkflowStore();
  const [showPathPicker, setShowPathPicker] = useState(false);
  const [selectedSourceStep, setSelectedSourceStep] = useState<string | null>(null);
  const [literalValue, setLiteralValue] = useState("");

  const handleSelectStepOutput = (sourceStepId: string) => {
    setSelectedSourceStep(sourceStepId);
    setShowPathPicker(true);
  };

  const handleSelectPath = (path: string) => {
    if (!selectedSourceStep) return;
    onChange({
      targetStepId: stepId,
      targetField: fieldName,
      sourceType: "step-output",
      sourceStepId: selectedSourceStep,
      sourcePath: path,
    });
    setShowPathPicker(false);
    setSelectedSourceStep(null);
  };

  const handleSelectWorkflowInput = (inputName: string) => {
    onChange({
      targetStepId: stepId,
      targetField: fieldName,
      sourceType: "workflow-input",
      workflowInputName: inputName,
    });
  };

  const handleSetLiteral = () => {
    if (!literalValue.trim()) return;
    onChange({
      targetStepId: stepId,
      targetField: fieldName,
      sourceType: "literal",
      literalValue: literalValue,
    });
    setLiteralValue("");
  };

  if (showPathPicker && selectedSourceStep) {
    const sourceStep = steps.find((s) => s.id === selectedSourceStep);
    return (
      <StepPathPicker
        sourceStep={sourceStep!}
        onSelect={handleSelectPath}
        onCancel={() => {
          setShowPathPicker(false);
          setSelectedSourceStep(null);
        }}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "empty" ? (
          <button className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-md border border-dashed border-gray-300 px-2.5 py-2 text-xs text-gray-500 transition-colors">
            <span>Select source...</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Change
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Step Output */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isFirstStep}>
            <FileOutput className="h-4 w-4 mr-2" />
            <span>Step Output</span>
            {isFirstStep && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                No previous steps
              </span>
            )}
          </DropdownMenuSubTrigger>
          {!isFirstStep && (
            <DropdownMenuSubContent>
              {previousSteps.map((step, idx) => (
                <DropdownMenuItem
                  key={step.id}
                  onClick={() => handleSelectStepOutput(step.id)}
                >
                  <span>Step {idx + 1}: {step.name}</span>
                  {currentBinding?.sourceType === "step-output" &&
                    currentBinding.sourceStepId === step.id && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          )}
        </DropdownMenuSub>

        {/* Workflow Input */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={workflowInputs.length === 0}>
            <FileInput className="h-4 w-4 mr-2" />
            <span>Workflow Input</span>
            {workflowInputs.length === 0 && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                None defined
              </span>
            )}
          </DropdownMenuSubTrigger>
          {workflowInputs.length > 0 && (
            <DropdownMenuSubContent>
              {workflowInputs.map((input) => (
                <DropdownMenuItem
                  key={input.name}
                  onClick={() => handleSelectWorkflowInput(input.name)}
                >
                  <span>{input.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {input.type}
                  </span>
                  {currentBinding?.sourceType === "workflow-input" &&
                    currentBinding.workflowInputName === input.name && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          )}
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Literal Value */}
        <div className="p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Literal Value</span>
          </div>
          <div className="flex gap-1.5">
            <Input
              value={literalValue}
              onChange={(e) => setLiteralValue(e.target.value)}
              placeholder="Enter value..."
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSetLiteral();
              }}
            />
            <button
              onClick={handleSetLiteral}
              disabled={!literalValue.trim()}
              className="px-2 h-8 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Set
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

