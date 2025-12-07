"use client";

import { useWorkflowsBStore } from "../../editor/store";
import { WorkflowOverview } from "./WorkflowOverview";
import { StepCard } from "./StepCard";
import { DataFlowIndicator } from "./DataFlowIndicator";
import { AddStepButton } from "./AddStepButton";

/**
 * Timeline - Main timeline container showing steps vertically
 * Based on Variation 3 (lines 99-225)
 */
export function Timeline() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  
  if (!workflow) {
    return (
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto py-8 px-6">
          <div className="text-center py-16">
            <p className="text-gray-500">Loading workflow...</p>
          </div>
        </div>
      </main>
    );
  }
  
  const steps = workflow.steps;
  
  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Workflow Overview Card */}
        <WorkflowOverview />
        
        {/* Timeline Steps */}
        <div className="relative">
          {/* Timeline line */}
          {steps.length > 0 && (
            <div 
              className="absolute left-8 top-10 w-0.5 bg-gray-200"
              style={{ 
                height: `calc(100% - 6rem)`,
              }}
            />
          )}
          
          {/* Steps */}
          {steps.map((step, index) => (
            <div key={step.id}>
              <StepCard 
                step={step} 
                stepNumber={index + 1} 
              />
              
              {/* Data flow indicator between steps */}
              {index < steps.length - 1 && (
                <DataFlowIndicator fromStep={step} />
              )}
            </div>
          ))}
          
          {/* Add Step Button */}
          <AddStepButton />
        </div>
        
        {/* Empty state */}
        {steps.length === 0 && (
          <div className="text-center py-8 mb-8 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-2">No steps yet</p>
            <p className="text-sm text-gray-400">
              Add your first step from the Tools panel on the right
            </p>
          </div>
        )}
      </div>
    </main>
  );
}




