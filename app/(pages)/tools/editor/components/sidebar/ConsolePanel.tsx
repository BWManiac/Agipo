"use client";

type ConsolePanelProps = {
  output: string;
};

export function ConsolePanel({ output }: ConsolePanelProps) {
  return (
    <div className="flex-grow overflow-auto p-4">
      <h3 className="mb-2 font-semibold">Output</h3>
      <pre className="h-full rounded-md bg-black p-4 text-sm text-white">
        {output}
      </pre>
    </div>
  );
}

