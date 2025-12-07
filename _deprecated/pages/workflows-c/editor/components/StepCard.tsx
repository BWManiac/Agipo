"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, GripVertical } from "lucide-react";
import { WorkflowStep } from "@/app/api/workflows/services/types";
import { useWorkflowEditorStore } from "../store";

interface StepCardProps {
  step: WorkflowStep;
  index: number;
}

export function StepCard({ step, index }: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedStepId, selectStep, removeStep } = useWorkflowEditorStore();
  const isSelected = selectedStepId === step.id;

  // Count input/output fields
  const inputCount = step.inputSchema?.properties
    ? Object.keys(step.inputSchema.properties).length
    : 0;
  const outputCount = step.outputSchema?.properties
    ? Object.keys(step.outputSchema.properties).length
    : 0;

  // Get step icon based on type
  function getStepIcon() {
    if (step.type === "composio") {
      return step.toolkitSlug === "firecrawl" ? "🔍" :
             step.toolkitSlug === "gmail" ? "📧" :
             step.toolkitSlug === "github" ? "🐙" :
             step.toolkitSlug === "slack" ? "💬" :
             step.toolkitSlug === "openai" ? "🤖" : "🔧";
    }
    if (step.type === "custom") return "💻";
    if (step.type === "control") return "🔀";
    return "📦";
  }

  // Get gradient color based on type
  function getGradient() {
    if (step.type === "composio") {
      return step.toolkitSlug === "firecrawl" ? "from-orange-400 to-red-500" :
             step.toolkitSlug === "gmail" ? "from-red-400 to-pink-500" :
             step.toolkitSlug === "github" ? "from-slate-400 to-slate-600" :
             step.toolkitSlug === "slack" ? "from-purple-400 to-pink-500" :
             step.toolkitSlug === "openai" ? "from-emerald-400 to-teal-500" : "from-blue-400 to-indigo-500";
    }
    if (step.type === "custom") return "from-cyan-400 to-blue-500";
    return "from-slate-400 to-slate-600";
  }

  return (
    <div className="relative flex gap-4 mb-4 group">
      {/* Step Number */}
      <div className="w-16 flex-shrink-0 flex flex-col items-center">
        <div
          className={`w-10 h-10 bg-gradient-to-br ${getGradient()} rounded-xl flex items-center justify-center text-white text-lg shadow-lg z-10`}
        >
          {getStepIcon()}
        </div>
        <div className="text-xs text-slate-500 mt-1">Step {index + 1}</div>
      </div>

      {/* Card */}
      <div
        onClick={() => selectStep(step.id)}
        className={`flex-1 bg-slate-800/50 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? "border-cyan-500 shadow-lg shadow-cyan-500/10"
            : "border-slate-700 hover:border-slate-600"
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4" />
            </button>
            <div>
              <h3 className="font-medium text-white">{step.name}</h3>
              <p className="text-sm text-slate-400">
                {step.type === "composio" ? step.toolkitSlug : step.type}
                {step.toolId && ` • ${step.toolId.toLowerCase().replace(/_/g, " ")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {inputCount} in → {outputCount} out
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeStep(step.id);
              }}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
            {/* Input Schema */}
            {step.inputSchema?.properties && Object.keys(step.inputSchema.properties).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Inputs
                </h4>
                <div className="space-y-1">
                  {Object.entries(step.inputSchema.properties).map(([key, schema]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-cyan-400 font-mono">{key}</span>
                      <span className="text-slate-500">
                        {(schema as { type?: string }).type || "any"}
                      </span>
                      {step.inputSchema?.required?.includes(key) && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output Schema */}
            {step.outputSchema?.properties && Object.keys(step.outputSchema.properties).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Outputs
                </h4>
                <div className="space-y-1">
                  {Object.entries(step.outputSchema.properties).map(([key, schema]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400 font-mono">{key}</span>
                      <span className="text-slate-500">
                        {(schema as { type?: string }).type || "any"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




