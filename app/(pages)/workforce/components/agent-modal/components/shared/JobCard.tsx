import { Calendar, MessageSquare, RefreshCw } from "lucide-react";
import type { ScheduledJob } from "../../../data/mocks";

interface JobCardProps {
  job: ScheduledJob;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {job.schedule}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {job.type === "conversation" ? (
          <MessageSquare className="h-4 w-4 text-purple-500" />
        ) : (
          <RefreshCw className="h-4 w-4 text-blue-500" />
        )}
        <h3 className="font-semibold text-sm">{job.title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {job.type === "conversation" ? "Starts a conversation with:" : "Executes workflow:"}
      </p>
      <div className="p-2 bg-gray-50 rounded border border-gray-100 text-xs text-gray-600 italic">
        {job.description}
      </div>
    </div>
  );
}

