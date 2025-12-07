"use client";

import { useState } from "react";
import { Plus, Trash2, Variable, ChevronDown, ChevronRight } from "lucide-react";
import { nanoid } from "nanoid";
import { useWorkflowsDStore } from "../../store";
import type { RuntimeInputConfig } from "@/app/api/workflows-d/services/types";

export function InputsTab() {
  const { runtimeInputs, addRuntimeInput, updateRuntimeInput, removeRuntimeInput } = useWorkflowsDStore();
  const [expandedInputs, setExpandedInputs] = useState<Set<string>>(new Set());

  const handleAddInput = () => {
    const newInput: RuntimeInputConfig = {
      key: `input_${nanoid(6)}`,
      type: "string",
      label: "New Input",
      description: "",
      required: true,
      default: undefined,
    };
    addRuntimeInput(newInput);
    setExpandedInputs((prev) => new Set([...prev, newInput.key]));
  };

  const toggleExpanded = (key: string) => {
    setExpandedInputs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">Runtime Inputs</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Values provided when the workflow runs
          </p>
        </div>
        <button
          onClick={handleAddInput}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-white hover:bg-violet-500/10 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Input
        </button>
      </div>

      {runtimeInputs.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/30 border border-white/5 rounded-xl">
          <Variable className="h-8 w-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No inputs defined yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Add inputs that users will provide when running this workflow
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {runtimeInputs.map((input) => (
            <InputConfigCard
              key={input.key}
              input={input}
              isExpanded={expandedInputs.has(input.key)}
              onToggle={() => toggleExpanded(input.key)}
              onUpdate={(updates) => updateRuntimeInput(input.key, updates)}
              onRemove={() => removeRuntimeInput(input.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InputConfigCardProps {
  input: RuntimeInputConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<RuntimeInputConfig>) => void;
  onRemove: () => void;
}

function InputConfigCard({ input, isExpanded, onToggle, onUpdate, onRemove }: InputConfigCardProps) {
  return (
    <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <button className="text-slate-500">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-violet-300">{input.key}</span>
            {input.required && (
              <span className="text-red-400 text-xs">*</span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{input.label}</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-700/50 rounded">
          {input.type}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
          {/* Key */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Key</label>
            <input
              type="text"
              value={input.key}
              onChange={(e) => onUpdate({ key: e.target.value })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Label</label>
            <input
              type="text"
              value={input.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
            <select
              value={input.type}
              onChange={(e) => onUpdate({ type: e.target.value as RuntimeInputConfig["type"] })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="array">Array</option>
              <option value="object">Object</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={input.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Required</label>
            <button
              onClick={() => onUpdate({ required: !input.required })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                input.required ? "bg-violet-600" : "bg-slate-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  input.required ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


