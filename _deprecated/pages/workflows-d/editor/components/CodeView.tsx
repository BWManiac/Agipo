"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { useWorkflowsDStore } from "../store";
import { generateWorkflowCode } from "../utils/codeGenerator";

export function CodeView() {
  const { workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables } = useWorkflowsDStore();
  const [copied, setCopied] = useState(false);

  const generatedCode = useMemo(() => {
    if (!workflow) return "// No workflow loaded";

    const fullWorkflow = {
      ...workflow,
      steps,
      mappings,
      runtimeInputs,
      configs,
      connections,
      tableRequirements,
      tables,
      controlFlow: {
        type: "sequential" as const,
        order: steps.map((s) => s.id),
      },
    };

    return generateWorkflowCode(fullWorkflow);
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow?.id || "workflow"}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-medium text-white">Generated TypeScript</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mastra workflow code generated from your visual design
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900/80 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-800/50">
            <span className="text-xs font-medium text-slate-400">workflow.ts</span>
            <span className="text-xs text-slate-500">{generatedCode.split("\n").length} lines</span>
          </div>
          <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto">
            <code>{generatedCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}


