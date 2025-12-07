"use client";

import { useState } from "react";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘/Ctrl", "S"], description: "Save workflow" },
  { keys: ["⌘/Ctrl", "Z"], description: "Undo" },
  { keys: ["⌘/Ctrl", "⇧", "Z"], description: "Redo" },
  { keys: ["⌫/Del"], description: "Delete selected step" },
  { keys: ["Esc"], description: "Deselect step" },
  { keys: ["↑/↓"], description: "Navigate steps" },
  { keys: ["⌘/Ctrl", "1"], description: "List view" },
  { keys: ["⌘/Ctrl", "2"], description: "Canvas view" },
  { keys: ["⌘/Ctrl", "⇧", "1"], description: "Flow mode" },
  { keys: ["⌘/Ctrl", "⇧", "2"], description: "Spec mode" },
  { keys: ["⌘/Ctrl", "⇧", "3"], description: "Code mode" },
  { keys: ["⌘/Ctrl", "B"], description: "Toggle chat panel" },
  { keys: ["⌘/Ctrl", "I"], description: "Toggle inspector" },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors backdrop-blur-sm"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Keyboard className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {SHORTCUTS.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5"
                  >
                    <span className="text-sm text-slate-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 border border-white/10 rounded text-slate-300">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-slate-500">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5">
              <p className="text-xs text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 border border-white/10 rounded">?</kbd> anytime to show this help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


