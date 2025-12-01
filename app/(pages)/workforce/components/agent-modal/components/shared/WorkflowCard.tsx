import { FileText } from "lucide-react";
import type { WorkflowSummary } from "@/_tables/types";

interface WorkflowCardProps {
  workflow: WorkflowSummary;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <FileText className="h-5 w-5" />
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
          Workflow
        </span>
      </div>
      <h3 className="font-semibold text-sm">{workflow.name}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{workflow.description}</p>
    </div>
  );
}

