"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { generateCodePreview, generateWorkflowCode } from "../lib/code-generator";

export function CodePreview() {
  const { workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables } =
    useWorkflowEditorStore();
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  // Build a complete workflow definition for the generator
  const workflowDefinition = useMemo(() => {
    if (!workflow) return null;
    return {
      ...workflow,
      steps,
      mappings,
      runtimeInputs,
      configs,
      connections,
      tableRequirements,
      tables,
    };
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables]);

  // Generate code preview or full code
  const generatedCode = useMemo(() => {
    if (!workflowDefinition) return "// No workflow loaded";
    try {
      return showFullCode
        ? generateWorkflowCode(workflowDefinition)
        : generateCodePreview(workflowDefinition);
    } catch (error) {
      console.error("Code generation error:", error);
      return `// Error generating code\n// ${(error as Error).message}`;
    }
  }, [workflowDefinition, showFullCode]);

  // Copy to clipboard
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  // Download as file
  function handleDownload() {
    if (!workflow) return;
    const blob = new Blob([generateWorkflowCode(workflowDefinition!)], {
      type: "text/typescript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.id}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-medium text-slate-300">Generated Code</h3>
          <p className="text-xs text-slate-500">
            {showFullCode ? "Full TypeScript" : "Preview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullCode(!showFullCode)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showFullCode
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            {showFullCode ? "Full" : "Preview"}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Download as .ts file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono leading-relaxed">
          {generatedCode.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 text-right pr-4 text-slate-600 select-none">
                {i + 1}
              </span>
              <code className={getLineStyle(line)}>{line || " "}</code>
            </div>
          ))}
        </pre>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
        {steps.length} step{steps.length !== 1 ? "s" : ""} •{" "}
        {mappings.length} mapping{mappings.length !== 1 ? "s" : ""} •{" "}
        {runtimeInputs.length} input{runtimeInputs.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// Simple syntax highlighting by line type
function getLineStyle(line: string): string {
  const trimmed = line.trim();
  
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
    return "text-slate-500";
  }
  if (trimmed.startsWith("import") || trimmed.startsWith("export")) {
    return "text-purple-400";
  }
  if (trimmed.startsWith("const ") || trimmed.startsWith("function ")) {
    return "text-cyan-400";
  }
  if (trimmed.includes("z.object") || trimmed.includes("z.string") || trimmed.includes("z.number")) {
    return "text-amber-400";
  }
  if (trimmed.includes(".then(") || trimmed.includes(".map(") || trimmed.includes(".commit()")) {
    return "text-emerald-400";
  }
  return "text-slate-300";
}
