"use client";

import { List } from "lucide-react";

export function ActionEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <List className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No actions yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Browser actions will appear here as the agent executes your commands.
      </p>

      {/* Action type preview */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        {[
          { icon: "????", label: "Navigate" },
          { icon: "????", label: "Click" },
          { icon: "??????", label: "Type" },
          { icon: "????", label: "Extract" },
          { icon: "????", label: "Screenshot" },
          { icon: "??????", label: "Download" },
        ].map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50"
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-muted-foreground">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
