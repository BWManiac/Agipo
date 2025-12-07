"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { ArrowLeftRight, Plus, Trash2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";
import { MappingDropdown } from "./MappingDropdown";
import type { WorkflowStep, FieldMapping, DataMapping } from "@/app/api/workflows/services/types";

interface DataMappingSectionProps {
  step: WorkflowStep;
}

export function DataMappingSection({ step }: DataMappingSectionProps) {
  const { steps, mappings, runtimeInputs, addMapping, updateMapping, removeMapping, getMappingsForStep } = useWorkflowEditorStore();
  
  const stepMappings = getMappingsForStep(step.id);
  const inputProperties = step.inputSchema.properties ? Object.entries(step.inputSchema.properties) : [];
  const requiredInputs = step.inputSchema.required || [];
  
  const previousSteps = steps.filter((s) => s.listIndex < step.listIndex);
  
  const getFieldMapping = (targetField: string): FieldMapping | undefined => {
    for (const mapping of stepMappings) {
      const fm = mapping.fieldMappings.find((f) => f.targetField === targetField);
      if (fm) return fm;
    }
    return undefined;
  };

  const getMappingId = (targetField: string): string | undefined => {
    for (const mapping of stepMappings) {
      if (mapping.fieldMappings.some((f) => f.targetField === targetField)) {
        return mapping.id;
      }
    }
    return undefined;
  };

  const handleSetMapping = (targetField: string, sourceStepId: string, sourcePath: string, sourceType?: string) => {
    const existingMappingId = getMappingId(targetField);
    
    if (existingMappingId) {
      const existing = mappings.find((m) => m.id === existingMappingId);
      if (existing) {
        const newFieldMappings = existing.fieldMappings.filter((f) => f.targetField !== targetField);
        newFieldMappings.push({
          sourcePath,
          targetField,
          sourceType,
          typeMatch: "exact",
        });
        updateMapping(existingMappingId, {
          sourceStepId,
          fieldMappings: newFieldMappings,
        });
      }
    } else {
      const newMapping: DataMapping = {
        id: nanoid(),
        sourceStepId,
        targetStepId: step.id,
        fieldMappings: [{
          sourcePath,
          targetField,
          sourceType,
          typeMatch: "exact",
        }],
      };
      addMapping(newMapping);
    }
  };

  const handleClearMapping = (targetField: string) => {
    const existingMappingId = getMappingId(targetField);
    if (!existingMappingId) return;
    
    const existing = mappings.find((m) => m.id === existingMappingId);
    if (!existing) return;
    
    const newFieldMappings = existing.fieldMappings.filter((f) => f.targetField !== targetField);
    if (newFieldMappings.length === 0) {
      removeMapping(existingMappingId);
    } else {
      updateMapping(existingMappingId, { fieldMappings: newFieldMappings });
    }
  };

  if (inputProperties.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-purple-100">
          <ArrowLeftRight className="h-4 w-4 text-purple-600" />
        </div>
        <span className="font-medium">Data Mapping</span>
      </div>
      
      <div className="bg-slate-50 rounded-lg border divide-y">
        {inputProperties.map(([fieldName, schema]) => {
          const isRequired = requiredInputs.includes(fieldName);
          const currentMapping = getFieldMapping(fieldName);
          const isMapped = !!currentMapping;
          
          return (
            <div key={fieldName} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm">{fieldName}</span>
                {isRequired && <span className="text-[10px] text-red-500 font-medium">required</span>}
                {isMapped ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : isRequired ? (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                ) : null}
              </div>
              
              <MappingDropdown
                targetField={fieldName}
                targetType={(schema as { type?: string }).type}
                currentMapping={currentMapping}
                previousSteps={previousSteps}
                runtimeInputs={runtimeInputs}
                onSelect={(sourceStepId, sourcePath, sourceType) => 
                  handleSetMapping(fieldName, sourceStepId, sourcePath, sourceType)
                }
                onClear={() => handleClearMapping(fieldName)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}




