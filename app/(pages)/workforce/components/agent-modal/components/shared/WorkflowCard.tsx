import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkflowMetadata, WorkflowBinding } from "@/_tables/types";

interface WorkflowCardProps {
  workflow: WorkflowMetadata;
  binding?: WorkflowBinding;
}

export function WorkflowCard({ workflow, binding }: WorkflowCardProps) {
  // Determine status based on binding completeness
  let status: "ready" | "needs-setup" | undefined;
  if (binding) {
    status = "ready";
    for (const toolkitSlug of workflow.requiredConnections) {
      if (!binding.connectionBindings[toolkitSlug]) {
        status = "needs-setup";
        break;
      }
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <Badge
              variant={status === "ready" ? "default" : "secondary"}
              className="text-[10px]"
            >
              {status === "ready" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Setup
                </>
              )}
            </Badge>
          )}
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
            Workflow
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-sm">{workflow.name}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
        {workflow.description || "No description"}
      </p>
    </div>
  );
}

