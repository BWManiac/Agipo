"use client";

import type { WorkflowStep } from "@/app/api/workflows/types";
import type { ParallelConfig } from "@/app/api/workflows/types/execution-flow";
import { RailParallelFork } from "./RailParallelFork";
import { RailParallelJoin } from "./RailParallelJoin";
import { ParallelLane } from "./ParallelLane";

interface RailParallelGroupProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Complete Parallel visualization.
 * Orchestrates: Fork → Lanes → Join
 */
export function RailParallelGroup({ step, isSelected, onClick }: RailParallelGroupProps) {
  const config = step.controlConfig as ParallelConfig | undefined;
  const lanes = config?.lanes || [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Fork node */}
      <RailParallelFork step={step} isSelected={isSelected} onClick={onClick} />

      {/* Parallel lanes */}
      {lanes.length > 0 && (
        <div className="flex gap-6 mt-2">
          {lanes.map((lane, index) => (
            <ParallelLane
              key={lane.id}
              parallelStepId={step.id}
              laneIndex={index}
              lane={lane}
            />
          ))}
        </div>
      )}

      {/* Join node */}
      <div className="mt-2">
        <RailParallelJoin config={config} isSelected={isSelected} />
      </div>
    </div>
  );
}

