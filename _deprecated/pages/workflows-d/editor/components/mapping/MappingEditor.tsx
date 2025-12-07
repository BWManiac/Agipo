"use client";

import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { X, Plus, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useWorkflowsDStore } from "../../store";
import type { WorkflowStep, DataMapping, FieldMapping } from "@/app/api/workflows-d/services/types";
import { extractSchemaFields, checkTypeCompatibility, getTypeColor } from "../../utils/schemaUtils";

interface MappingEditorProps {
  targetStep: WorkflowStep;
  onClose: () => void;
}

export function MappingEditor({ targetStep, onClose }: MappingEditorProps) {
  const { 
    steps, 
    mappings, 
    addMapping, 
    updateMapping, 
    removeMapping,
    workflow 
  } = useWorkflowsDStore();

  // Get available source steps (all steps before target in execution order)
  const sourceSteps = useMemo(() => {
    const targetIndex = steps.findIndex((s) => s.id === targetStep.id);
    return steps.slice(0, targetIndex);
  }, [steps, targetStep.id]);

  // Get existing mapping for this target step
  const existingMapping = useMemo(() => {
    return mappings.find((m) => m.targetStepId === targetStep.id);
  }, [mappings, targetStep.id]);

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    existingMapping?.sourceStepId || "__input__"
  );
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(
    existingMapping?.fieldMappings || []
  );

  // Get source schema fields
  const sourceFields = useMemo(() => {
    if (selectedSourceId === "__input__" && workflow) {
      return extractSchemaFields(workflow.inputSchema);
    }
    const sourceStep = steps.find((s) => s.id === selectedSourceId);
    return sourceStep ? extractSchemaFields(sourceStep.outputSchema) : [];
  }, [selectedSourceId, steps, workflow]);

  // Get target schema fields
  const targetFields = useMemo(() => {
    return extractSchemaFields(targetStep.inputSchema);
  }, [targetStep]);

  const handleAddFieldMapping = () => {
    if (sourceFields.length > 0 && targetFields.length > 0) {
      const newMapping: FieldMapping = {
        sourcePath: sourceFields[0].path,
        targetField: targetFields[0].path,
        sourceType: sourceFields[0].type,
        targetType: targetFields[0].type,
        typeMatch: checkTypeCompatibility(sourceFields[0].type, targetFields[0].type),
      };
      setFieldMappings([...fieldMappings, newMapping]);
    }
  };

  const handleUpdateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updated = [...fieldMappings];
    updated[index] = { ...updated[index], ...updates };
    
    // Recalculate type match
    if (updates.sourcePath || updates.targetField) {
      const sourceField = sourceFields.find((f) => f.path === (updates.sourcePath || updated[index].sourcePath));
      const targetField = targetFields.find((f) => f.path === (updates.targetField || updated[index].targetField));
      
      if (sourceField && targetField) {
        updated[index].sourceType = sourceField.type;
        updated[index].targetType = targetField.type;
        updated[index].typeMatch = checkTypeCompatibility(sourceField.type, targetField.type);
      }
    }
    
    setFieldMappings(updated);
  };

  const handleRemoveFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (fieldMappings.length === 0) {
      // Remove mapping if no fields are mapped
      if (existingMapping) {
        removeMapping(existingMapping.id);
      }
    } else if (existingMapping) {
      // Update existing mapping
      updateMapping(existingMapping.id, {
        sourceStepId: selectedSourceId,
        fieldMappings,
      });
    } else {
      // Create new mapping
      addMapping({
        id: `mapping-${nanoid(8)}`,
        sourceStepId: selectedSourceId,
        targetStepId: targetStep.id,
        fieldMappings,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-lg font-semibold text-white">Configure Data Mapping</h3>
            <p className="text-sm text-slate-400">
              Map outputs from previous steps to inputs of &quot;{targetStep.name}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Source selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data Source
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => {
                setSelectedSourceId(e.target.value);
                setFieldMappings([]);
              }}
              className="w-full h-10 px-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="__input__">Workflow Input</option>
              {sourceSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.name} (Step {step.listIndex + 1})
                </option>
              ))}
            </select>
          </div>

          {/* Field mappings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">
                Field Mappings
              </label>
              <button
                onClick={handleAddFieldMapping}
                disabled={sourceFields.length === 0 || targetFields.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-white hover:bg-violet-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Mapping
              </button>
            </div>

            {fieldMappings.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/30 border border-white/5 rounded-xl">
                <p className="text-sm text-slate-400">
                  No field mappings configured. Click &quot;Add Mapping&quot; to connect fields.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fieldMappings.map((mapping, index) => (
                  <FieldMappingRow
                    key={index}
                    mapping={mapping}
                    sourceFields={sourceFields}
                    targetFields={targetFields}
                    onUpdate={(updates) => handleUpdateFieldMapping(index, updates)}
                    onRemove={() => handleRemoveFieldMapping(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl hover:from-violet-500 hover:to-fuchsia-500 transition-colors"
          >
            Save Mappings
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldMappingRowProps {
  mapping: FieldMapping;
  sourceFields: { path: string; name: string; type: string }[];
  targetFields: { path: string; name: string; type: string }[];
  onUpdate: (updates: Partial<FieldMapping>) => void;
  onRemove: () => void;
}

function FieldMappingRow({ 
  mapping, 
  sourceFields, 
  targetFields, 
  onUpdate, 
  onRemove 
}: FieldMappingRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/30 border border-white/5 rounded-xl">
      {/* Source field selector */}
      <div className="flex-1">
        <select
          value={mapping.sourcePath}
          onChange={(e) => onUpdate({ sourcePath: e.target.value })}
          className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {sourceFields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path} ({field.type})
            </option>
          ))}
        </select>
      </div>

      {/* Arrow with type match indicator */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {mapping.typeMatch === "exact" && (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        )}
        {mapping.typeMatch === "coercible" && (
          <AlertCircle className="h-4 w-4 text-amber-400" />
        )}
        {mapping.typeMatch === "incompatible" && (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
        <ArrowRight className="h-4 w-4 text-slate-500" />
      </div>

      {/* Target field selector */}
      <div className="flex-1">
        <select
          value={mapping.targetField}
          onChange={(e) => onUpdate({ targetField: e.target.value })}
          className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {targetFields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path} ({field.type})
            </option>
          ))}
        </select>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}




