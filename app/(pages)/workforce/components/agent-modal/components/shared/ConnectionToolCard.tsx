import { Plug } from "lucide-react";
import type { ConnectionToolBinding } from "@/_tables/types";

interface ConnectionToolCardProps {
  binding: ConnectionToolBinding;
  toolkitName?: string;
  accountLabel?: string;
}

export function ConnectionToolCard({
  binding,
  toolkitName,
  accountLabel,
}: ConnectionToolCardProps) {
  // Format the tool name for display (e.g., "GMAIL_SEND_EMAIL" -> "Send Email")
  const formatToolName = (toolId: string): string => {
    // Remove toolkit prefix (e.g., "GMAIL_" or "SLACK_")
    const withoutPrefix = toolId.replace(/^[A-Z]+_/, "");
    // Convert to title case with spaces
    return withoutPrefix
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Plug className="h-5 w-5" />
        </div>
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded">
          {toolkitName || binding.toolkitSlug}
        </span>
      </div>
      <h3 className="font-semibold text-sm">{formatToolName(binding.toolId)}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
        {accountLabel || binding.toolkitSlug}
      </p>
    </div>
  );
}

