"use client";

import type { WorkflowStep } from "@/app/api/workflows/types";
import type { BranchConfig } from "@/app/api/workflows/types/execution-flow";
import { RailBranchRouter } from "./RailBranchRouter";
import { RailBranchMerge } from "./RailBranchMerge";
import { BranchLane } from "./BranchLane";

interface RailBranchGroupProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

// Lane colors
const laneColors = [
  { dot: "bg-green-500", line: "bg-green-400", label: "text-green-500" },
  { dot: "bg-blue-500", line: "bg-blue-400", label: "text-blue-500" },
  { dot: "bg-amber-500", line: "bg-amber-400", label: "text-amber-500" },
  { dot: "bg-purple-500", line: "bg-purple-400", label: "text-purple-500" },
  { dot: "bg-cyan-500", line: "bg-cyan-400", label: "text-cyan-500" },
];

const elseColor = { dot: "bg-slate-400", line: "bg-slate-400", label: "text-slate-500" };

/**
 * Complete Branch visualization.
 * Orchestrates: Router → Lanes → Merge
 */
export function RailBranchGroup({ step, isSelected, onClick }: RailBranchGroupProps) {
  const config = step.controlConfig as BranchConfig | undefined;
  const conditions = config?.conditions || [];
  const hasElse = config?.hasElse ?? true;

  // Build all lanes (conditions + optional else)
  const allLanes = [
    ...conditions.map((cond, idx) => ({
      condition: cond,
      color: laneColors[idx % laneColors.length],
      index: idx,
    })),
    ...(hasElse
      ? [{ condition: { id: "else", label: "else" }, color: elseColor, index: conditions.length }]
      : []),
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Router node */}
      <RailBranchRouter step={step} isSelected={isSelected} onClick={onClick} />

      {/* Branching lanes */}
      {allLanes.length > 0 && (
        <div className="flex gap-6 mt-2">
          {allLanes.map((lane) => (
            <BranchLane
              key={lane.condition.id}
              branchStepId={step.id}
              conditionIndex={lane.index}
              condition={lane.condition}
              color={lane.color}
            />
          ))}
        </div>
      )}

      {/* Merge node */}
      <div className="mt-2">
        <RailBranchMerge isSelected={isSelected} />
      </div>
    </div>
  );
}

