"use client";

import { useWorkflowEditorStore } from "../store";
import { ListView } from "./ListView";
import { CodePreview } from "./CodePreview";

export function EditorMain() {
  const { isCodePreviewOpen } = useWorkflowEditorStore();

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* List View */}
      <div className={`flex-1 overflow-hidden ${isCodePreviewOpen ? "border-r border-slate-700" : ""}`}>
        <ListView />
      </div>

      {/* Code Preview Panel */}
      {isCodePreviewOpen && (
        <div className="w-[400px] overflow-hidden shrink-0">
          <CodePreview />
        </div>
      )}
    </main>
  );
}




