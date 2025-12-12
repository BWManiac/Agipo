"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useWorkflowStore } from "../../store";
import { useExecution } from "../../hooks/useExecution";

/**
 * Form for collecting workflow input values before execution.
 * Dynamically generates form fields from workflow inputs.
 */
export function ExecutionInputForm() {
  const workflowInputs = useWorkflowStore((s) => s.workflowInputs);
  const inputValues = useWorkflowStore((s) => s.inputValues);
  const setInputValue = useWorkflowStore((s) => s.setInputValue);
  const missingConnections = useWorkflowStore((s) => s.missingConnections);

  const { execute, checkExecution, isExecuting } = useExecution();
  const [isChecking, setIsChecking] = useState(false);
  const [canExecute, setCanExecute] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Check execution prerequisites on mount
  useEffect(() => {
    async function check() {
      setIsChecking(true);
      const info = await checkExecution();
      if (info) {
        setCanExecute(info.canExecute);
        setErrors(info.errors);
      }
      setIsChecking(false);
    }
    check();
  }, [checkExecution]);

  // Validate required inputs
  const requiredInputsMissing = workflowInputs
    .filter((input) => input.required)
    .filter((input) => {
      const value = inputValues[input.name];
      return value === undefined || value === "" || value === null;
    });

  const canRun = canExecute && requiredInputsMissing.length === 0 && !isChecking;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canRun) {
      execute();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Connection Status */}
      {isChecking ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking connections...
        </div>
      ) : missingConnections.length > 0 ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Missing Connections</p>
              <ul className="mt-1 space-y-1">
                {missingConnections.map((conn) => (
                  <li key={conn} className="text-muted-foreground">
                    {conn}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : canExecute ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          All connections available
        </div>
      ) : null}

      {/* Error Messages */}
      {errors.length > 0 && !isChecking && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              {errors.map((error, i) => (
                <p key={i} className="text-destructive">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      {workflowInputs.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Workflow Inputs</h4>
          {workflowInputs.map((input) => (
            <div key={input.name} className="space-y-2">
              <Label htmlFor={input.name}>
                {input.name}
                {input.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {input.description && (
                <p className="text-xs text-muted-foreground">{input.description}</p>
              )}
              {renderInputField(input, inputValues[input.name], setInputValue)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This workflow has no input parameters.
        </p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={!canRun || isExecuting}
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            "Run Workflow"
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Renders the appropriate input field based on input type.
 */
function renderInputField(
  input: { name: string; type: string; defaultValue?: unknown },
  value: unknown,
  setValue: (name: string, value: unknown) => void
) {
  const stringValue = value !== undefined ? String(value) : "";

  switch (input.type) {
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={input.name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => setValue(input.name, checked)}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case "number":
      return (
        <Input
          id={input.name}
          type="number"
          value={stringValue}
          onChange={(e) => setValue(input.name, Number(e.target.value))}
          placeholder={`Enter ${input.name}`}
        />
      );

    case "object":
    case "array":
      return (
        <Textarea
          id={input.name}
          value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              setValue(input.name, JSON.parse(e.target.value));
            } catch {
              setValue(input.name, e.target.value);
            }
          }}
          placeholder={`Enter JSON for ${input.name}`}
          className="font-mono text-sm"
          rows={4}
        />
      );

    case "string":
    default:
      return (
        <Input
          id={input.name}
          type="text"
          value={stringValue}
          onChange={(e) => setValue(input.name, e.target.value)}
          placeholder={`Enter ${input.name}`}
        />
      );
  }
}
