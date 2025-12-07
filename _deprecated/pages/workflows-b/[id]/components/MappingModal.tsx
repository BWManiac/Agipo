"use client";

import { useMemo } from "react";
import { useWorkflowsBStore } from "../../editor/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, DollarSign, Settings, Type, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputSource, SchemaField, WorkflowStep } from "@/_tables/workflows-b/types";

/**
 * MappingModal - Configure input mappings for a step
 * 
 * Allows users to specify where each input gets its value from:
 * - Previous step output
 * - Runtime input
 * - Config value
 * - Static value
 */
export function MappingModal() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  const isMappingModalOpen = useWorkflowsBStore(state => state.isMappingModalOpen);
  const mappingModalStepId = useWorkflowsBStore(state => state.mappingModalStepId);
  const closeMappingModal = useWorkflowsBStore(state => state.closeMappingModal);
  const updateStepMapping = useWorkflowsBStore(state => state.updateStepMapping);
  
  // Get the step being edited
  const step = useMemo(() => {
    if (!workflow || !mappingModalStepId) return null;
    return workflow.steps.find(s => s.id === mappingModalStepId);
  }, [workflow, mappingModalStepId]);
  
  // Get available sources (previous steps)
  const availableSources = useMemo(() => {
    if (!workflow || !step) return { steps: [], inputs: [], configs: [] };
    
    const stepIndex = workflow.steps.findIndex(s => s.id === step.id);
    const previousSteps = workflow.steps.slice(0, stepIndex);
    
    return {
      steps: previousSteps,
      inputs: workflow.inputs,
      configs: workflow.configs,
    };
  }, [workflow, step]);
  
  if (!step || !workflow) return null;
  
  // Get current mapping for a field
  const getMapping = (fieldName: string) => {
    return step.inputMappings.find(m => m.inputName === fieldName);
  };
  
  // Handle mapping change
  const handleMappingChange = (fieldName: string, sourceType: string, value: string) => {
    let source: InputSource | null = null;
    
    if (sourceType === "step" && value) {
      const [stepId, fieldName] = value.split(".");
      source = { type: "step", stepId, fieldName };
    } else if (sourceType === "runtime" && value) {
      source = { type: "runtime", inputName: value };
    } else if (sourceType === "config" && value) {
      source = { type: "config", configName: value };
    } else if (sourceType === "static" && value) {
      source = { type: "static", value };
    }
    
    updateStepMapping(step.id, fieldName, source);
  };
  
  // Clear mapping
  const clearMapping = (fieldName: string) => {
    updateStepMapping(step.id, fieldName, null);
  };
  
  return (
    <Dialog open={isMappingModalOpen} onOpenChange={(open) => !open && closeMappingModal()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-500" />
            Configure Input Mappings
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 mb-4">
          <p className="text-sm text-gray-500">
            Map inputs for <span className="font-medium text-gray-700">{step.label}</span>
          </p>
        </div>
        
        {/* Input Fields */}
        <div className="space-y-4">
          {step.inputSchema.fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              This step has no inputs to map
            </div>
          ) : (
            step.inputSchema.fields.map((field) => (
              <MappingRow
                key={field.name}
                field={field}
                mapping={getMapping(field.name)}
                availableSources={availableSources}
                onMappingChange={(type, value) => handleMappingChange(field.name, type, value)}
                onClear={() => clearMapping(field.name)}
              />
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={closeMappingModal}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual mapping row for a field
 */
function MappingRow({
  field,
  mapping,
  availableSources,
  onMappingChange,
  onClear,
}: {
  field: SchemaField;
  mapping?: { inputName: string; source: InputSource };
  availableSources: {
    steps: WorkflowStep[];
    inputs: { name: string; type: string }[];
    configs: { name: string; type: string }[];
  };
  onMappingChange: (sourceType: string, value: string) => void;
  onClear: () => void;
}) {
  const isMapped = !!mapping;
  const sourceType = mapping?.source.type || "";
  
  // Get the current value based on source type
  const getCurrentValue = () => {
    if (!mapping) return "";
    
    switch (mapping.source.type) {
      case "step":
        return `${mapping.source.stepId}.${mapping.source.fieldName}`;
      case "runtime":
        return mapping.source.inputName;
      case "config":
        return mapping.source.configName;
      case "static":
        return mapping.source.value;
      default:
        return "";
    }
  };
  
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-colors",
      isMapped ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
    )}>
      {/* Field Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">{field.name}</span>
          {field.required && <span className="text-red-500 text-xs">*required</span>}
          <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-200 rounded">
            {field.type}
          </span>
        </div>
        {isMapped && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={onClear}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {field.description && (
        <p className="text-xs text-gray-500 mb-3">{field.description}</p>
      )}
      
      {/* Source Type Selection */}
      <div className="flex items-center gap-2">
        <Select
          value={sourceType}
          onValueChange={(value) => onMappingChange(value, "")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select source..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="step">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                From Step
              </div>
            </SelectItem>
            <SelectItem value="runtime">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Runtime Input
              </div>
            </SelectItem>
            <SelectItem value="config">
              <div className="flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Config
              </div>
            </SelectItem>
            <SelectItem value="static">
              <div className="flex items-center gap-2">
                <Type className="w-3 h-3" />
                Static Value
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <ArrowRight className="w-4 h-4 text-gray-400" />
        
        {/* Value Selection based on source type */}
        {sourceType === "step" && (
          <Select
            value={getCurrentValue()}
            onValueChange={(value) => onMappingChange("step", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select output..." />
            </SelectTrigger>
            <SelectContent>
              {availableSources.steps.map((step) => (
                <SelectGroup key={step.id}>
                  <SelectLabel className="text-xs">{step.label}</SelectLabel>
                  {step.outputSchema.fields.map((output) => (
                    <SelectItem 
                      key={`${step.id}.${output.name}`}
                      value={`${step.id}.${output.name}`}
                    >
                      {output.name}
                      <span className="text-xs text-gray-400 ml-2">({output.type})</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              {availableSources.steps.length === 0 && (
                <div className="px-2 py-1 text-xs text-gray-500">
                  No previous steps available
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        
        {sourceType === "runtime" && (
          <Select
            value={getCurrentValue()}
            onValueChange={(value) => onMappingChange("runtime", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select input..." />
            </SelectTrigger>
            <SelectContent>
              {availableSources.inputs.map((input) => (
                <SelectItem key={input.name} value={input.name}>
                  ${input.name}
                  <span className="text-xs text-gray-400 ml-2">({input.type})</span>
                </SelectItem>
              ))}
              {availableSources.inputs.length === 0 && (
                <div className="px-2 py-1 text-xs text-gray-500">
                  No runtime inputs defined
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        
        {sourceType === "config" && (
          <Select
            value={getCurrentValue()}
            onValueChange={(value) => onMappingChange("config", value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select config..." />
            </SelectTrigger>
            <SelectContent>
              {availableSources.configs.map((config) => (
                <SelectItem key={config.name} value={config.name}>
                  {config.name}
                  <span className="text-xs text-gray-400 ml-2">({config.type})</span>
                </SelectItem>
              ))}
              {availableSources.configs.length === 0 && (
                <div className="px-2 py-1 text-xs text-gray-500">
                  No config values defined
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        
        {sourceType === "static" && (
          <Input
            value={getCurrentValue()}
            onChange={(e) => onMappingChange("static", e.target.value)}
            placeholder="Enter static value..."
            className="flex-1"
          />
        )}
        
        {!sourceType && (
          <div className="flex-1 text-sm text-gray-400 italic">
            Choose a source type...
          </div>
        )}
      </div>
    </div>
  );
}


