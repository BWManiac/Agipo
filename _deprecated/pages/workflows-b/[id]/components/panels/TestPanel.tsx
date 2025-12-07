"use client";

import { useState } from "react";
import { useWorkflowsBStore } from "../../../editor/store";
import { useGenerateCode } from "../../../hooks/useWorkflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

/**
 * TestPanel - Test execution UI
 * 
 * Allows users to:
 * 1. Fill in test input values
 * 2. Run the workflow
 * 3. See step-by-step progress
 * 4. View results and errors
 */
export function TestPanel() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  const executionStatus = useWorkflowsBStore(state => state.executionStatus);
  const stepStatuses = useWorkflowsBStore(state => state.stepStatuses);
  const workflowOutput = useWorkflowsBStore(state => state.workflowOutput);
  const workflowError = useWorkflowsBStore(state => state.workflowError);
  const totalDuration = useWorkflowsBStore(state => state.totalDuration);
  const testInputs = useWorkflowsBStore(state => state.testInputs);
  const setTestInputs = useWorkflowsBStore(state => state.setTestInputs);
  const updateTestInput = useWorkflowsBStore(state => state.updateTestInput);
  const startExecution = useWorkflowsBStore(state => state.startExecution);
  const updateStepStatus = useWorkflowsBStore(state => state.updateStepStatus);
  const completeExecution = useWorkflowsBStore(state => state.completeExecution);
  const failExecution = useWorkflowsBStore(state => state.failExecution);
  const cancelExecution = useWorkflowsBStore(state => state.cancelExecution);
  const resetExecution = useWorkflowsBStore(state => state.resetExecution);
  
  const generateCode = useGenerateCode(workflow?.id || "");
  const [showOutput, setShowOutput] = useState(true);
  
  if (!workflow) return null;
  
  const isRunning = executionStatus === "running";
  const isComplete = executionStatus === "completed";
  const isFailed = executionStatus === "failed";
  
  // Simulate workflow execution
  const handleRun = async () => {
    if (isRunning) return;
    
    // First generate the code
    try {
      await generateCode.mutateAsync(true);
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
    
    // Start execution
    const runId = nanoid(8);
    startExecution(runId);
    
    // Simulate step-by-step execution
    const steps = workflow.steps;
    let currentOutput: Record<string, unknown> = testInputs as Record<string, unknown>;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Update step to running
      updateStepStatus(step.id, {
        status: "running",
        startTime: Date.now(),
      });
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Simulate success (90%) or failure (10%)
      if (Math.random() > 0.1) {
        // Success
        const mockOutput = {
          ...currentOutput,
          [`step_${i + 1}_result`]: `Output from ${step.label}`,
        };
        
        updateStepStatus(step.id, {
          status: "completed",
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          output: mockOutput,
        });
        
        currentOutput = mockOutput;
      } else {
        // Failure
        updateStepStatus(step.id, {
          status: "failed",
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          error: `Simulated error in ${step.label}`,
        });
        
        failExecution(`Step "${step.label}" failed: Simulated error`);
        return;
      }
    }
    
    // Complete execution
    completeExecution(currentOutput, Date.now());
  };
  
  const handleCancel = () => {
    cancelExecution();
  };
  
  const handleReset = () => {
    resetExecution();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Input Values Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Test Inputs</h4>
          {workflow.inputs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTestInputs({})}
              className="h-6 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        
        {workflow.inputs.length === 0 ? (
          <p className="text-xs text-gray-500">
            No inputs required for this workflow
          </p>
        ) : (
          <div className="space-y-2">
            {workflow.inputs.map((input) => (
              <div key={input.name}>
                <Label className="text-xs text-gray-500">
                  {input.name}
                  {input.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                {input.type === "object" ? (
                  <Textarea
                    value={typeof testInputs[input.name] === "object" 
                      ? JSON.stringify(testInputs[input.name], null, 2)
                      : String(testInputs[input.name] || "")}
                    onChange={(e) => {
                      try {
                        updateTestInput(input.name, JSON.parse(e.target.value));
                      } catch {
                        updateTestInput(input.name, e.target.value);
                      }
                    }}
                    placeholder={input.description || `Enter ${input.name}...`}
                    className="h-16 text-xs font-mono"
                  />
                ) : (
                  <Input
                    type={input.type === "number" ? "number" : "text"}
                    value={String(testInputs[input.name] || "")}
                    onChange={(e) => updateTestInput(
                      input.name, 
                      input.type === "number" ? Number(e.target.value) : e.target.value
                    )}
                    placeholder={input.description || `Enter ${input.name}...`}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Run Button */}
      <div className="mb-4">
        {isRunning ? (
          <Button
            onClick={handleCancel}
            variant="destructive"
            className="w-full"
          >
            <Square className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        ) : (
          <Button
            onClick={handleRun}
            className="w-full"
            disabled={workflow.steps.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Test
          </Button>
        )}
      </div>
      
      {/* Step Progress */}
      {executionStatus !== "idle" && (
        <div className="flex-1 overflow-y-auto -mx-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Execution Progress</h4>
            {(isComplete || isFailed) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {workflow.steps.map((step, index) => {
              const status = stepStatuses[step.id];
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-2 rounded-lg border text-sm transition-colors",
                    status?.status === "completed" && "bg-green-50 border-green-200",
                    status?.status === "running" && "bg-blue-50 border-blue-200",
                    status?.status === "failed" && "bg-red-50 border-red-200",
                    status?.status === "skipped" && "bg-gray-50 border-gray-200",
                    (!status || status.status === "pending") && "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StepStatusIcon status={status?.status || "pending"} />
                    <span className="font-medium text-gray-900">{step.label}</span>
                    {status?.status === "running" && (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-auto" />
                    )}
                    {status?.endTime && status?.startTime && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {Math.round(status.endTime - status.startTime)}ms
                      </span>
                    )}
                  </div>
                  
                  {status?.error && (
                    <p className="text-xs text-red-600 mt-1">{status.error}</p>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Output Section */}
          {(isComplete || isFailed) && (
            <div className="mt-4 border-t pt-4">
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="flex items-center gap-1 text-sm font-medium text-gray-900 mb-2"
              >
                {showOutput ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {isComplete ? "Output" : "Error"}
              </button>
              
              {showOutput && (
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                  {isComplete ? (
                    <pre>{JSON.stringify(workflowOutput, null, 2)}</pre>
                  ) : (
                    <pre className="text-red-400">{workflowError}</pre>
                  )}
                </div>
              )}
              
              {totalDuration && (
                <p className="text-xs text-gray-500 mt-2">
                  Total duration: {Math.round(totalDuration)}ms
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {executionStatus === "idle" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Code className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Fill in test inputs and click Run to test your workflow
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "running":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "skipped":
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  }
}

