import { FileText, MessageSquare, Zap } from "lucide-react";

export function ActivityHighlights() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Highlights</h3>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          <div className="p-3 flex gap-3 items-start hover:bg-gray-50 transition-colors cursor-default">
            <div className="mt-1 p-1 bg-green-100 text-green-700 rounded">
              <FileText className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Drafted Release Notes</p>
              <p className="text-xs text-gray-500">9:00 AM • Saved to Docs</p>
            </div>
          </div>
          <div className="p-3 flex gap-3 items-start hover:bg-gray-50 transition-colors cursor-default">
            <div className="mt-1 p-1 bg-blue-100 text-blue-700 rounded">
              <MessageSquare className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Morning Briefing</p>
              <p className="text-xs text-gray-500">Yesterday • Chat Session</p>
            </div>
          </div>
          <div className="p-3 flex gap-3 items-start hover:bg-gray-50 transition-colors cursor-default">
            <div className="mt-1 p-1 bg-purple-100 text-purple-700 rounded">
              <Zap className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Lead Qualified: Acme Corp</p>
              <p className="text-xs text-gray-500">Mon 2pm • Triggered by &apos;Leads&apos;</p>
            </div>
          </div>
        </div>
        <button className="w-full p-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">View Full History</button>
      </div>
    </div>
  );
}

