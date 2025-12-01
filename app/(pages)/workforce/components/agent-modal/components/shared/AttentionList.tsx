import { AlertCircle, Key } from "lucide-react";

export function AttentionList() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Needs Attention</h3>
      
      {/* Approval Request */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-l-blue-500 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors">Approval Required</h4>
            <p className="text-xs text-gray-500">Create &quot;Technical Debt&quot; ticket in Roadmap.</p>
          </div>
        </div>
        <button className="text-xs font-medium text-blue-600 border border-blue-200 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors">Review</button>
      </div>

      {/* Blocker */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-l-red-500 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium text-sm group-hover:text-red-600 transition-colors">Missing Credentials</h4>
            <p className="text-xs text-gray-500">Jira API Token has expired.</p>
          </div>
        </div>
        <button className="text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">Fix</button>
      </div>
    </div>
  );
}

