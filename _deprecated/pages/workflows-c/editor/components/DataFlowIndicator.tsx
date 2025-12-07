"use client";

import { ArrowDown, Link2, Plus } from "lucide-react";

interface DataFlowIndicatorProps {
  fields: string[];
  onClick: () => void;
  isFirst?: boolean;
}

export function DataFlowIndicator({ fields, onClick, isFirst }: DataFlowIndicatorProps) {
  const hasMappings = fields.length > 0;

  return (
    <div className="relative flex gap-4 mb-2 ml-16 pl-4">
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
          hasMappings
            ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            : "bg-slate-700/50 border border-dashed border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"
        }`}
      >
        {hasMappings ? (
          <>
            <Link2 className="w-3.5 h-3.5" />
            <span className="font-mono">
              {fields.slice(0, 2).join(", ")}
              {fields.length > 2 && ` +${fields.length - 2}`}
            </span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>
              {isFirst ? "Map from workflow input" : "Map data"}
            </span>
          </>
        )}
      </button>
      
      {/* Arrow indicator */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2">
        <ArrowDown className="w-4 h-4 text-slate-600" />
      </div>
    </div>
  );
}



