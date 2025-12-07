"use client";

import { Layers } from "lucide-react";

export function NoSelectionState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Layers className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">No step selected</p>
      <p className="text-xs text-slate-500 mt-1">
        Select a step from the timeline to view its details
      </p>
    </div>
  );
}




