import type { AgentConfig } from "@/_tables/types";

export function WorkflowList({ workflows }: { workflows: AgentConfig["assignedWorkflows"] }) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Assigned workflows
      </h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {workflows.map((workflow) => (
          <li key={workflow}>• {workflow}</li>
        ))}
      </ul>
    </div>
  );
}

