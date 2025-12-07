"use client";

import { useState } from "react";
import { Plus, Trash2, Variable } from "lucide-react";
import { useWorkflowEditorStore } from "../store";

export function InputsPanel() {
  const { runtimeInputs, addRuntimeInput, updateRuntimeInput, removeRuntimeInput } =
    useWorkflowEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newInput, setNewInput] = useState({
    key: "",
    label: "",
    type: "string" as "string" | "number" | "boolean" | "array" | "object",
    description: "",
    required: true,
  });

  function handleAdd() {
    if (!newInput.key.trim()) return;

    addRuntimeInput({
      key: newInput.key.trim(),
      label: newInput.label.trim() || newInput.key.trim(),
      type: newInput.type,
      description: newInput.description.trim(),
      required: newInput.required,
    });

    setNewInput({ key: "", label: "", type: "string", description: "", required: true });
    setIsAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Runtime Inputs</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Inputs that agents provide when calling this workflow
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Add Form */}
        {isAdding && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 space-y-3">
            <input
              type="text"
              value={newInput.key}
              onChange={(e) => setNewInput({ ...newInput, key: e.target.value })}
              placeholder="Input name (e.g., userEmail)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="text"
              value={newInput.label}
              onChange={(e) => setNewInput({ ...newInput, label: e.target.value })}
              placeholder="Display label"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <select
              value={newInput.type}
              onChange={(e) =>
                setNewInput({
                  ...newInput,
                  type: e.target.value as "string" | "number" | "boolean" | "array" | "object",
                })
              }
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="array">Array</option>
              <option value="object">Object</option>
            </select>
            <input
              type="text"
              value={newInput.description}
              onChange={(e) => setNewInput({ ...newInput, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={newInput.required}
                onChange={(e) => setNewInput({ ...newInput, required: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
              />
              Required
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-3 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newInput.key.trim()}
                className="flex-1 px-3 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Input List */}
        {runtimeInputs.length === 0 && !isAdding ? (
          <div className="p-8 text-center">
            <Variable className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No runtime inputs defined</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Add your first input
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {runtimeInputs.map((input) => (
              <div
                key={input.key}
                className="p-4 hover:bg-slate-700/20 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-purple-400">${input.key}</span>
                    <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                      {input.type}
                    </span>
                    {input.required && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeRuntimeInput(input.key)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {input.description && (
                  <p className="text-xs text-slate-500">{input.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

