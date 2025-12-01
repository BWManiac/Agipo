import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "../../../data/mocks";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  const getIcon = () => {
    if (task.status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (task.status === "failed") return <XCircle className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
  };

  const getBadgeColor = () => {
    if (task.type === "workflow") return "bg-purple-50 text-purple-700 border-purple-100";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className={`mt-1 p-1.5 rounded-lg ${task.status === "completed" ? "bg-green-50" : task.status === "failed" ? "bg-red-50" : "bg-blue-50"}`}>
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{task.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wide font-medium ${getBadgeColor()}`}>
                {task.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{task.timestamp}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.duration}</span>
            </div>
          </div>
        </div>
        {task.status === "completed" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => setShowFeedback(!showFeedback)}
          >
            Give Feedback
          </Button>
        )}
      </div>

      {task.output && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono border border-gray-100 overflow-x-auto">
          {task.output}
        </div>
      )}

      {showFeedback && (
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-medium text-blue-900">How can the agent improve this task?</p>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 text-xs text-blue-700 transition-colors" onClick={() => console.log("Feedback: Edit Workflow")}>
              Edit Workflow Logic
            </button>
            <button className="flex items-center justify-center gap-2 p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 text-xs text-blue-700 transition-colors" onClick={() => console.log("Feedback: Refine Prompt")}>
              Refine Prompt Context
            </button>
          </div>
          <Textarea 
            placeholder="Or describe the issue..." 
            className="text-xs bg-white border-blue-200 focus-visible:ring-blue-500/20"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500" onClick={() => setShowFeedback(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowFeedback(false)}>Save Feedback</Button>
          </div>
        </div>
      )}
    </div>
  );
}

