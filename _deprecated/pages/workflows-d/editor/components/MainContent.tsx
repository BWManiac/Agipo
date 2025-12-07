"use client";

import { useWorkflowsDStore } from "../store";
import { ListView } from "./list/ListView";
import { CanvasView } from "./canvas/CanvasView";
import { CodeView } from "./CodeView";

export function MainContent() {
  const { viewMode, abstractionLevel } = useWorkflowsDStore();

  // Code view
  if (abstractionLevel === "code") {
    return <CodeView />;
  }

  // Spec view
  if (abstractionLevel === "spec") {
    return <SpecView />;
  }

  // Flow view (list or canvas)
  if (viewMode === "canvas") {
    return <CanvasView />;
  }

  return <ListView />;
}

function SpecView() {
  const { workflow } = useWorkflowsDStore();

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-slate-400">Workflow Specification</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-slate-800/30 border border-white/5 rounded-xl p-6">
          <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
            {JSON.stringify(workflow, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

