import { Zap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventTrigger } from "../../data/mocks";

interface TriggerCardProps {
  trigger: EventTrigger;
}

export function TriggerCard({ trigger }: TriggerCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-sm">{trigger.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{trigger.event}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {trigger.action === "run_workflow" ? "Run Workflow" : "Start Chat"}
          </p>
          <p className="text-xs text-gray-500">{trigger.target}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={() => console.log(`Testing trigger: ${trigger.title}`)}
        >
          <Play className="h-3 w-3" /> Test
        </Button>
      </div>
    </div>
  );
}

