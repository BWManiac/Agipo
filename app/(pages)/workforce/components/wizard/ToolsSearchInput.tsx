"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

interface ToolsSearchInputProps {
  selectedToolIds: string[];
  onSelectionChange: (toolIds: string[]) => void;
  availableTools: Array<{ id: string; name: string; description: string }>;
}

// Mock suggestions for now (LLM implementation deferred)
const MOCK_SUGGESTIONS = [
  { id: "workflow-research-v1", name: "Research Workflow", description: "Performs web research on a topic" },
  { id: "workflow-email-summary", name: "Email Summary", description: "Summarizes email threads" },
  { id: "workflow-data-analysis", name: "Data Analysis", description: "Analyzes data and generates insights" },
];

export function ToolsSearchInput({
  selectedToolIds,
  onSelectionChange,
  availableTools,
}: ToolsSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use availableTools if provided, otherwise fall back to mock
  const tools = availableTools.length > 0 ? availableTools : MOCK_SUGGESTIONS;

  const filteredTools = tools.filter(
    (tool) =>
      !selectedToolIds.includes(tool.id) &&
      (tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTool = (toolId: string) => {
    onSelectionChange([...selectedToolIds, toolId]);
    setSearchQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTool = (toolId: string) => {
    onSelectionChange(selectedToolIds.filter((id) => id !== toolId));
  };

  const selectedTools = tools.filter((tool) => selectedToolIds.includes(tool.id));

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search for tools or describe what you need..."
          className="w-full"
        />
        {showSuggestions && filteredTools.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-60 overflow-y-auto">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleSelectTool(tool.id)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
              >
                <div className="font-medium text-sm">{tool.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tool.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTools.map((tool) => (
            <Badge key={tool.id} variant="secondary" className="gap-1">
              {tool.name}
              <button
                type="button"
                onClick={() => handleRemoveTool(tool.id)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
