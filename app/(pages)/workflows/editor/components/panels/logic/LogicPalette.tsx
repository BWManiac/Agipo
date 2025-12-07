"use client";

import { LogicPaletteItem } from "./LogicPaletteItem";

const controlFlowItems = [
  {
    category: "Routing",
    items: [
      { type: "branch", name: "Branch", description: "Route based on conditions", color: "purple" },
      { type: "parallel", name: "Parallel", description: "Execute concurrently", color: "cyan" },
    ],
  },
  {
    category: "Iteration",
    items: [
      { type: "loop", name: "Loop", description: "Repeat until condition", color: "green" },
      { type: "foreach", name: "ForEach", description: "Iterate over array", color: "pink" },
    ],
  },
  {
    category: "Timing",
    items: [
      { type: "wait", name: "Wait", description: "Pause for duration", color: "yellow" },
    ],
  },
  {
    category: "Human",
    items: [
      { type: "suspend", name: "Suspend", description: "Await human input", color: "red" },
    ],
  },
];

export function LogicPalette() {
  return (
    <div className="flex flex-col h-full">
      {/* Tip */}
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Drag control flow to the workflow →
        </p>
      </div>

      {/* Control flow items grouped by category */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {controlFlowItems.map((group) => (
          <div key={group.category}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              {group.category}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <LogicPaletteItem
                  key={item.type}
                  type={item.type}
                  name={item.name}
                  description={item.description}
                  color={item.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

