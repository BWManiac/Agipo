"use client";

import { useState } from "react";
import { Plus, Trash2, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { nanoid } from "nanoid";
import { useWorkflowsDStore } from "../../store";
import type { WorkflowConfig } from "@/app/api/workflows-d/services/types";

export function ConfigTab() {
  const { configs, addConfig, updateConfig, removeConfig, workflow, updateWorkflowMetadata } = useWorkflowsDStore();
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());

  const handleAddConfig = () => {
    const newConfig: WorkflowConfig = {
      key: `config_${nanoid(6)}`,
      type: "text",
      label: "New Config",
      description: "",
      required: false,
      default: undefined,
    };
    addConfig(newConfig);
    setExpandedConfigs((prev) => new Set([...prev, newConfig.key]));
  };

  const toggleExpanded = (key: string) => {
    setExpandedConfigs((prev) => {
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
    <div className="space-y-6">
      {/* Workflow metadata */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white">Workflow Details</h4>
        
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
          <input
            type="text"
            value={workflow?.name || ""}
            onChange={(e) => updateWorkflowMetadata({ name: e.target.value })}
            className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea
            value={workflow?.description || ""}
            onChange={(e) => updateWorkflowMetadata({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            placeholder="Describe what this workflow does..."
          />
        </div>
      </div>

      {/* Configuration options */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Configuration Options</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Settings that customize workflow behavior
            </p>
          </div>
          <button
            onClick={handleAddConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-white hover:bg-violet-500/10 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Config
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-6 bg-slate-800/30 border border-white/5 rounded-xl">
            <Settings className="h-6 w-6 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No config options defined</p>
          </div>
        ) : (
          <div className="space-y-2">
            {configs.map((config) => (
              <ConfigCard
                key={config.key}
                config={config}
                isExpanded={expandedConfigs.has(config.key)}
                onToggle={() => toggleExpanded(config.key)}
                onUpdate={(updates) => updateConfig(config.key, updates)}
                onRemove={() => removeConfig(config.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfigCardProps {
  config: WorkflowConfig;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<WorkflowConfig>) => void;
  onRemove: () => void;
}

function ConfigCard({ config, isExpanded, onToggle, onUpdate, onRemove }: ConfigCardProps) {
  return (
    <div className="bg-slate-800/30 border border-white/5 rounded-xl overflow-hidden">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <button className="text-slate-500">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-sm text-violet-300">{config.key}</span>
          <p className="text-xs text-slate-400 truncate">{config.label}</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-700/50 rounded">
          {config.type}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Key</label>
            <input
              type="text"
              value={config.key}
              onChange={(e) => onUpdate({ key: e.target.value })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Label</label>
            <input
              type="text"
              value={config.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
            <select
              value={config.type}
              onChange={(e) => onUpdate({ type: e.target.value as WorkflowConfig["type"] })}
              className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}


