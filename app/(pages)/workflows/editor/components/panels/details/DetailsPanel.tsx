"use client";

import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import { InputBindingsSection } from "./InputBindingsSection";
import { OutputBindingsSection } from "./OutputBindingsSection";

interface ToolSchema {
  inputParameters: Record<string, unknown>;
  outputParameters: Record<string, unknown>;
}

export function DetailsPanel() {
  const { selectedStepId, steps, setSelectedStepId } = useWorkflowStore();
  const [schema, setSchema] = useState<ToolSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const stepIndex = steps.findIndex((s) => s.id === selectedStepId);

  // Fetch schema when step changes
  useEffect(() => {
    if (!selectedStep?.toolkitSlug || !selectedStep?.toolId) {
      setSchema(null);
      return;
    }

    const fetchSchema = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/workflows/composio-schemas/${selectedStep.toolkitSlug}/${selectedStep.toolId}`
        );
        if (!res.ok) throw new Error("Failed to fetch schema");
        const data = await res.json();
        setSchema(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [selectedStep?.toolkitSlug, selectedStep?.toolId]);

  const handleNavigateToStep = (stepId: string) => {
    setSelectedStepId(stepId);
  };

  // Empty state
  if (!selectedStepId || !selectedStep) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-6">
        <Info className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a step to configure its data bindings
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading schema: {error}
      </div>
    );
  }

  const previousSteps = steps.slice(0, stepIndex);
  const nextStep = steps[stepIndex + 1];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {selectedStep.toolkitLogo && (
            <img
              src={selectedStep.toolkitLogo}
              alt=""
              className="h-5 w-5 rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              Step {stepIndex + 1}: {selectedStep.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedStep.toolId || selectedStep.controlType || "Custom Step"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Input Bindings */}
        <InputBindingsSection
          stepId={selectedStepId}
          stepIndex={stepIndex}
          inputSchema={schema?.inputParameters || {}}
          previousSteps={previousSteps}
          isFirstStep={isFirstStep}
          onNavigateToStep={handleNavigateToStep}
        />

        {/* Output Bindings */}
        <OutputBindingsSection
          stepId={selectedStepId}
          stepIndex={stepIndex}
          outputSchema={schema?.outputParameters || {}}
          nextStep={nextStep}
          isLastStep={isLastStep}
          onNavigateToStep={handleNavigateToStep}
        />
      </div>
    </div>
  );
}

