"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentConfig } from "@/_tables/types";
import { useAgentDetails } from "../../hooks/useAgentDetails";
import { JobCard } from "../shared/JobCard";
import { TriggerCard } from "../shared/TriggerCard";

interface PlannerTabProps {
  agent: AgentConfig;
}

export function PlannerTab({ agent }: PlannerTabProps) {
  const { jobs, triggers } = useAgentDetails(agent);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Scheduled Jobs Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Scheduled Jobs</h2>
              <p className="text-sm text-gray-500">Time-based recurring tasks.</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Plus className="h-3 w-3" /> Add Job
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Event Triggers Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Event Triggers</h2>
              <p className="text-sm text-gray-500">Actions triggered by data changes.</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Plus className="h-3 w-3" /> Add Trigger
            </Button>
          </div>

          <div className="space-y-4">
            {triggers.map((trigger) => (
              <TriggerCard key={trigger.id} trigger={trigger} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

