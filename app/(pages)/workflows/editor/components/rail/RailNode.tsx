"use client";

import type { WorkflowStep } from "@/app/api/workflows/types";
import { RailStep } from "./RailStep";
import { RailLoop } from "./containers/RailLoop";
import { RailForEach } from "./containers/RailForEach";
import { RailBranchGroup } from "./routers/RailBranchGroup";
import { RailParallelGroup } from "./routers/RailParallelGroup";
import { RailWait } from "./steps/RailWait";
import { RailSuspend } from "./steps/RailSuspend";

interface RailNodeProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Dispatcher component that renders the appropriate Rail component
 * based on the step type and controlType.
 *
 * - Control flow steps → specialized containers/routers
 * - Composio/custom steps → standard RailStep card
 */
export function RailNode({ step, isSelected, onClick }: RailNodeProps) {
  // Control flow steps get specialized rendering
  if (step.type === "control" && step.controlType) {
    switch (step.controlType) {
      case "loop":
        return <RailLoop step={step} isSelected={isSelected} onClick={onClick} />;
      case "foreach":
        return <RailForEach step={step} isSelected={isSelected} onClick={onClick} />;
      case "branch":
        return <RailBranchGroup step={step} isSelected={isSelected} onClick={onClick} />;
      case "parallel":
        return <RailParallelGroup step={step} isSelected={isSelected} onClick={onClick} />;
      case "wait":
        return <RailWait step={step} isSelected={isSelected} onClick={onClick} />;
      case "suspend":
        return <RailSuspend step={step} isSelected={isSelected} onClick={onClick} />;
    }
  }

  // Default: composio tools, custom code, table operations
  return <RailStep step={step} isSelected={isSelected} onClick={onClick} />;
}

