"use client";

import { useState, useMemo } from "react";
import { X, ArrowRight, Check, AlertCircle } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { WorkflowStep, FieldMapping, DataMapping } from "@/app/api/workflows/services/types";
import { v4 as uuidv4 } from "uuid";

interface DataMappingModalProps {
  sourceStep: WorkflowStep | null;
  targetStep: WorkflowStep;
  onClose: () => void;
}

interface SchemaField {
  path: string;
  type: string;
  description?: string;
}

function extractFields(
  schema: Record<string, unknown> | undefined,
  prefix = ""
): SchemaField[] {
  if (!schema) return [];

  const fields: SchemaField[] = [];
  const properties = (schema as { properties?: Record<string, unknown> }).properties;

  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const fieldSchema = value as { type?: string; description?: string; properties?: Record<string, unknown> };

      fields.push({
        path,
        type: fieldSchema.type || "unknown",
        description: fieldSchema.description,
      });

      // Recursively extract nested fields (max 2 levels)
      if (fieldSchema.type === "object" && fieldSchema.properties && !prefix.includes(".")) {
        fields.push(...extractFields(fieldSchema as Record<string, unknown>, path));
      }
    }
  }

  return fields;
}

export function DataMappingModal({ sourceStep, targetStep, onClose }: DataMappingModalProps) {
  const { mappings, runtimeInputs, addMapping, updateMapping, removeMapping } = useWorkflowEditorStore();

  // Find existing mapping between these steps
  const sourceStepId = sourceStep?.id || "__input__";
  const existingMapping = mappings.find(
    (m) => m.sourceStepId === sourceStepId && m.targetStepId === targetStep.id
  );

  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(
    existingMapping?.fieldMappings || []
  );

  // Extract available source fields
  const sourceFields = useMemo(() => {
    if (sourceStep) {
      return extractFields(sourceStep.outputSchema as unknown as Record<string, unknown>);
    }
    // Use runtime inputs as source
    return runtimeInputs.map((input) => ({
      path: input.key,
      type: input.type,
      description: input.description,
    }));
  }, [sourceStep, runtimeInputs]);

  // Extract target input fields
  const targetFields = useMemo(() => {
    return extractFields(targetStep.inputSchema as unknown as Record<string, unknown>);
  }, [targetStep]);

  // Check if a target field is already mapped
  const isMapped = (targetField: string) =>
    fieldMappings.some((m) => m.targetField === targetField);

  // Add a new field mapping
  function addFieldMapping(sourcePath: string, targetField: string) {
    const sourceField = sourceFields.find((f) => f.path === sourcePath);
    const target = targetFields.find((f) => f.path === targetField);

    setFieldMappings([
      ...fieldMappings,
      {
        sourcePath,
        targetField,
        sourceType: sourceField?.type,
        targetType: target?.type,
        typeMatch: sourceField?.type === target?.type ? "exact" : "coercible",
      },
    ]);
  }

  // Remove a field mapping
  function removeFieldMapping(targetField: string) {
    setFieldMappings(fieldMappings.filter((m) => m.targetField !== targetField));
  }

  // Save mappings
  function handleSave() {
    if (existingMapping) {
      if (fieldMappings.length === 0) {
        removeMapping(existingMapping.id);
      } else {
        updateMapping(existingMapping.id, { fieldMappings });
      }
    } else if (fieldMappings.length > 0) {
      addMapping({
        id: `mapping-${uuidv4().slice(0, 8)}`,
        sourceStepId,
        targetStepId: targetStep.id,
        fieldMappings,
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Map Data</h2>
            <p className="text-sm text-slate-400">
              {sourceStep ? `${sourceStep.name} → ${targetStep.name}` : `Workflow Input → ${targetStep.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Current Mappings */}
          {fieldMappings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Current Mappings</h3>
              <div className="space-y-2">
                {fieldMappings.map((mapping) => (
                  <div
                    key={mapping.targetField}
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg group"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-mono text-sm text-emerald-400">
                        {mapping.sourcePath}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-sm text-cyan-400">
                        {mapping.targetField}
                      </span>
                      {mapping.typeMatch === "exact" ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <button
                      onClick={() => removeFieldMapping(mapping.targetField)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped Target Fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* Source Fields */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Available from {sourceStep?.name || "Workflow Input"}
              </h3>
              <div className="space-y-1">
                {sourceFields.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No output fields available</p>
                ) : (
                  sourceFields.map((field) => (
                    <div
                      key={field.path}
                      className="px-3 py-2 bg-slate-700/30 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400">{field.path}</span>
                        <span className="text-slate-500 text-xs">{field.type}</span>
                      </div>
                      {field.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Target Fields */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Required by {targetStep.name}
              </h3>
              <div className="space-y-1">
                {targetFields.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No input fields required</p>
                ) : (
                  targetFields.map((field) => {
                    const mapped = fieldMappings.find((m) => m.targetField === field.path);
                    return (
                      <div
                        key={field.path}
                        className={`px-3 py-2 rounded text-sm ${
                          mapped ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-slate-700/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400">{field.path}</span>
                            <span className="text-slate-500 text-xs">{field.type}</span>
                          </div>
                          {!mapped && sourceFields.length > 0 && (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  addFieldMapping(e.target.value, field.path);
                                }
                              }}
                              className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              <option value="">Map from...</option>
                              {sourceFields.map((sf) => (
                                <option key={sf.path} value={sf.path}>
                                  {sf.path}
                                </option>
                              ))}
                            </select>
                          )}
                          {mapped && (
                            <span className="text-xs text-cyan-300">
                              ← {mapped.sourcePath}
                            </span>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-500">
            {fieldMappings.length} field{fieldMappings.length !== 1 ? "s" : ""} mapped
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
            >
              Save Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



