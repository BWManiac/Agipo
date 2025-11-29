"use client";

import type { WorkflowNodeData } from "../../store/types";

type SpecContentProps = {
  data: WorkflowNodeData;
  onOpenEditor: () => void;
};

export function SpecContent({ data, onOpenEditor }: SpecContentProps) {
  const inputsSummary =
    data.spec.inputs.length === 0
      ? "No inputs"
      : data.spec.inputs
          .slice(0, 2)
          .map((input) => input.name || "(unnamed)")
          .join(", ") + (data.spec.inputs.length > 2 ? "…" : "");

  const outputsSummary =
    data.spec.outputs.length === 0
      ? "No outputs"
      : data.spec.outputs
          .slice(0, 2)
          .map((output) => output.name || "(unnamed)")
          .join(", ") + (data.spec.outputs.length > 2 ? "…" : "");

  const processSummary =
    data.spec.process.length === 0
      ? "No documented steps."
      : data.spec.process[0] +
        (data.spec.process.length > 1 ? " (+" + (data.spec.process.length - 1) + " more)" : "");

  return (
    <div className="space-y-4 text-sm text-slate-600">
      <SummaryCard title="Inputs" value={inputsSummary} />
      <SummaryCard title="Process" value={processSummary} />
      <SummaryCard title="Outputs" value={outputsSummary} />
      <button
        type="button"
        onClick={onOpenEditor}
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        onPointerDownCapture={(event) => event.stopPropagation()}
      >
        Edit details
      </button>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}