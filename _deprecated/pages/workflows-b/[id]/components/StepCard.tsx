"use client";

import { useWorkflowsBStore } from "../../editor/store";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORM_ICONS, PLATFORM_GRADIENTS, type WorkflowStep } from "@/_tables/workflows-b/types";

interface StepCardProps {
  step: WorkflowStep;
  stepNumber: number;
}

/**
 * StepCard - Collapsible step card in the timeline
 * Based on Variation 3 (lines 142-163 collapsed, 325-446 expanded)
 */
export function StepCard({ step, stepNumber }: StepCardProps) {
  const selectedStepId = useWorkflowsBStore(state => state.selectedStepId);
  const expandedStepIds = useWorkflowsBStore(state => state.expandedStepIds);
  const setSelectedStep = useWorkflowsBStore(state => state.setSelectedStep);
  const toggleStepExpanded = useWorkflowsBStore(state => state.toggleStepExpanded);
  const removeStep = useWorkflowsBStore(state => state.removeStep);
  const openMappingModal = useWorkflowsBStore(state => state.openMappingModal);
  
  const isSelected = selectedStepId === step.id;
  const isExpanded = expandedStepIds.has(step.id);
  const platform = step.platform || "code";
  const gradient = PLATFORM_GRADIENTS[platform] || PLATFORM_GRADIENTS.code;
  const icon = PLATFORM_ICONS[platform] || "💻";
  
  const inputCount = step.inputSchema.fields.length;
  const outputCount = step.outputSchema.fields.length;
  const mappedCount = step.inputMappings.length;
  
  const handleClick = () => {
    setSelectedStep(step.id);
    toggleStepExpanded(step.id);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove "${step.label}"?`)) {
      removeStep(step.id);
    }
  };
  
  const handleEditMapping = (e: React.MouseEvent) => {
    e.stopPropagation();
    openMappingModal(step.id);
  };
  
  return (
    <div className="step-card relative flex gap-4 mb-4 cursor-pointer group">
      {/* Step number and icon */}
      <div className="w-16 flex-shrink-0 flex flex-col items-center">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm z-10 bg-gradient-to-br",
          gradient
        )}>
          {icon}
        </div>
        <div className="text-xs text-gray-400 mt-1">Step {stepNumber}</div>
      </div>
      
      {/* Card content */}
      <div 
        onClick={handleClick}
        className={cn(
          "flex-1 bg-white rounded-xl border shadow-sm overflow-hidden transition-all",
          isSelected 
            ? "border-2 border-blue-500 shadow-lg" 
            : "border-gray-200 group-hover:border-blue-300 group-hover:shadow-md"
        )}
      >
        {/* Header - always visible */}
        <div className={cn(
          "p-4 transition-colors",
          isSelected ? "bg-blue-50" : "group-hover:bg-gray-50"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{step.label}</h3>
              <p className="text-sm text-gray-500">
                {step.platform || "custom"} {step.toolId ? `• ${step.toolId}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {inputCount} in → {outputCount} out
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            {/* Input Mapping Section */}
            <div className="p-4">
              <button 
                onClick={handleEditMapping}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span className="font-medium text-sm text-gray-900">Input Mapping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    mappedCount === inputCount && inputCount > 0
                      ? "text-green-600 bg-green-100"
                      : mappedCount > 0
                      ? "text-yellow-600 bg-yellow-100"
                      : "text-gray-500 bg-gray-100"
                  )}>
                    {mappedCount}/{inputCount} mapped
                  </span>
                </div>
              </button>
              
              {/* Mapping list */}
              {step.inputMappings.length > 0 && (
                <div className="mt-3 space-y-2 pl-6">
                  {step.inputMappings.map((mapping) => (
                    <div 
                      key={mapping.inputName}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">←</span>
                        <span className="text-gray-700">{mapping.inputName}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {mapping.source.type === "step" && `from Step → ${mapping.source.fieldName}`}
                        {mapping.source.type === "runtime" && `Runtime Input`}
                        {mapping.source.type === "config" && `Config`}
                        {mapping.source.type === "static" && `Static value`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Unmapped inputs */}
              {inputCount > mappedCount && (
                <div className="mt-3 space-y-2 pl-6">
                  {step.inputSchema.fields
                    .filter(f => !step.inputMappings.some(m => m.inputName === f.name))
                    .map((field) => (
                      <div 
                        key={field.name}
                        className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg text-sm border border-yellow-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">?</span>
                          <span className="text-gray-700">{field.name}</span>
                        </div>
                        <span className="text-yellow-600 text-xs">Not mapped</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Output Schema Section */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-sm text-gray-900">Output Schema</span>
              </div>
              <div className="space-y-1 pl-6">
                {step.outputSchema.fields.map((field) => (
                  <div 
                    key={field.name}
                    className="flex items-center justify-between text-sm text-gray-600"
                  >
                    <span>{field.name}</span>
                    <span className="text-gray-400 text-xs">{field.type}</span>
                  </div>
                ))}
                {step.outputSchema.fields.length === 0 && (
                  <p className="text-sm text-gray-400">No outputs defined</p>
                )}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove step
              </Button>
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Ready
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




