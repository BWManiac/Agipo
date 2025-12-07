"use client";

import { ArrowRight } from "lucide-react";
import type { DataMapping } from "@/app/api/workflows-d/services/types";

interface DataFlowIndicatorProps {
  mappings: DataMapping[];
}

export function DataFlowIndicator({ mappings }: DataFlowIndicatorProps) {
  const totalMappings = mappings.reduce(
    (sum, m) => sum + m.fieldMappings.length,
    0
  );

  if (totalMappings === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg">
      <ArrowRight className="h-3 w-3 text-violet-400" />
      <span className="text-xs font-medium text-violet-400">
        {totalMappings} {totalMappings === 1 ? "mapping" : "mappings"}
      </span>
    </div>
  );
}




