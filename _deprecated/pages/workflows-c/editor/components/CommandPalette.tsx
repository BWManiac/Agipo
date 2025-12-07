"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Wrench, Code, Variable, Settings, Play, X } from "lucide-react";
import { useWorkflowEditorStore } from "../store";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleCommandPalette, setActiveTab } = useWorkflowEditorStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        toggleCommandPalette();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  const commands: CommandItem[] = [
    {
      id: "add-tool",
      label: "Add Composio Tool",
      description: "Add a tool from your connected integrations",
      icon: <Wrench className="h-4 w-4" />,
      action: () => {
        setActiveTab("palette");
        toggleCommandPalette();
      },
    },
    {
      id: "add-custom",
      label: "Add Custom Code Step",
      description: "Add a custom JavaScript code step",
      icon: <Code className="h-4 w-4" />,
      action: () => {
        // TODO: Implement add custom step
        toggleCommandPalette();
      },
    },
    {
      id: "add-input",
      label: "Define Runtime Input",
      description: "Add a new workflow input parameter",
      icon: <Variable className="h-4 w-4" />,
      action: () => {
        setActiveTab("inputs");
        toggleCommandPalette();
      },
    },
    {
      id: "add-config",
      label: "Define Config",
      description: "Add a workflow configuration option",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        setActiveTab("config");
        toggleCommandPalette();
      },
    },
    {
      id: "run-test",
      label: "Run Test",
      description: "Test the workflow with sample inputs",
      icon: <Play className="h-4 w-4" />,
      action: () => {
        setActiveTab("test");
        toggleCommandPalette();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleCommandPalette}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={toggleCommandPalette}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Commands */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-cyan-400">
                  {cmd.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{cmd.label}</div>
                  <div className="text-xs text-slate-400">{cmd.description}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}




