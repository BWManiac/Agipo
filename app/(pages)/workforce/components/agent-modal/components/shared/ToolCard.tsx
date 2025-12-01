import { Zap } from "lucide-react";
import type { Tool } from "ai";

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
  };
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Zap className="h-5 w-5" />
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
          Read/Write
        </span>
      </div>
      <h3 className="font-semibold text-sm">{tool.name}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
    </div>
  );
}

