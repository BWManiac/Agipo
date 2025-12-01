export function StatusCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Current Focus</h3>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Synthesising Feedback</h2>
          <p className="text-sm text-gray-500">Reading &quot;QBR Recordings&quot; table to extract themes. (Step 2/4)</p>
        </div>
      </div>
      <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div className="bg-green-500 h-full w-[45%] rounded-full"></div>
      </div>
    </div>
  );
}

