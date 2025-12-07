"use client";

import { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { useWorkflowEditorStore } from "../store";

export function ConfigPanel() {
  const { configs, addConfig, updateConfig, removeConfig } = useWorkflowEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: "",
    label: "",
    type: "text" as "text" | "number" | "boolean" | "select",
    description: "",
    required: true,
    default: "",
  });

  function handleAdd() {
    if (!newConfig.key.trim()) return;

    addConfig({
      key: newConfig.key.trim(),
      label: newConfig.label.trim() || newConfig.key.trim(),
      type: newConfig.type,
      description: newConfig.description.trim(),
      required: newConfig.required,
      default: newConfig.default || undefined,
    });

    setNewConfig({ key: "", label: "", type: "text", description: "", required: true, default: "" });
    setIsAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Workflow Configs</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Persistent settings defined when assigning to an agent
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Add Form */}
        {isAdding && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 space-y-3">
            <input
              type="text"
              value={newConfig.key}
              onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
              placeholder="Config name (e.g., maxRetries)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="text"
              value={newConfig.label}
              onChange={(e) => setNewConfig({ ...newConfig, label: e.target.value })}
              placeholder="Display label"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <select
              value={newConfig.type}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  type: e.target.value as "text" | "number" | "boolean" | "select",
                })
              }
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="select">Select</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={newConfig.required}
                onChange={(e) => setNewConfig({ ...newConfig, required: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
              />
              Required
            </label>
            <input
              type="text"
              value={newConfig.description}
              onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="text"
              value={newConfig.default}
              onChange={(e) => setNewConfig({ ...newConfig, default: e.target.value })}
              placeholder="Default value (optional)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-3 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newConfig.key.trim()}
                className="flex-1 px-3 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Config List */}
        {configs.length === 0 && !isAdding ? (
          <div className="p-8 text-center">
            <Settings className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No configs defined</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Add your first config
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {configs.map((config) => (
              <div
                key={config.key}
                className="p-4 hover:bg-slate-700/20 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-amber-400">@{config.key}</span>
                    <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                      {config.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeConfig(config.key)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {config.description && (
                  <p className="text-xs text-slate-500 mb-1">{config.description}</p>
                )}
                {config.default !== undefined && (
                  <p className="text-xs text-slate-600">
                    Default: <span className="text-slate-400">{String(config.default)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

