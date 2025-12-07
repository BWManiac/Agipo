"use client";

import { useState, useMemo } from "react";
import { Search, Loader2, ChevronDown, ChevronRight, Plus, Code, Database, TableProperties } from "lucide-react";
import { useComposioTools, filterTools, type ComposioTool, type ToolkitGroup } from "../../hooks/useComposioTools";
import { useWorkflowsDStore } from "../../store";
import { createStepFromTool, createCustomCodeStep } from "../../utils/stepFactory";

export function ToolsTab() {
  const { toolkits, isLoading, error } = useComposioTools();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedToolkits, setExpandedToolkits] = useState<Set<string>>(new Set());

  const filteredToolkits = useMemo(
    () => filterTools(toolkits, searchQuery),
    [toolkits, searchQuery]
  );

  const toggleToolkit = (slug: string) => {
    setExpandedToolkits((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-violet-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading tools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-2">Failed to load tools</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full h-10 pl-10 pr-4 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
        />
      </div>

      {/* Special step types */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
          Special Steps
        </p>
        <CustomCodeCard />
      </div>

      {/* Toolkit groups */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
          Composio Tools
        </p>
        {filteredToolkits.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            {searchQuery ? "No tools match your search" : "No tools available"}
          </p>
        ) : (
          filteredToolkits.map((toolkit) => (
            <ToolkitSection
              key={toolkit.slug}
              toolkit={toolkit}
              isExpanded={expandedToolkits.has(toolkit.slug) || searchQuery.length > 0}
              onToggle={() => toggleToolkit(toolkit.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CustomCodeCard() {
  const { steps, addStep, setSelectedStep, setConnection } = useWorkflowsDStore();

  const handleAdd = () => {
    const step = createCustomCodeStep(steps.length);
    addStep(step);
    setSelectedStep(step.id);
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 hover:border-violet-500/30 rounded-xl transition-all group"
    >
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
        <Code className="h-4 w-4 text-amber-400" />
      </div>
      <div className="flex-1 text-left">
        <h4 className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
          Custom Code
        </h4>
        <p className="text-xs text-slate-400 line-clamp-1">
          Execute custom JavaScript/TypeScript
        </p>
      </div>
      <Plus className="h-4 w-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
    </button>
  );
}

interface ToolkitSectionProps {
  toolkit: ToolkitGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

function ToolkitSection({ toolkit, isExpanded, onToggle }: ToolkitSectionProps) {
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        {toolkit.logo ? (
          <img
            src={toolkit.logo}
            alt={toolkit.name}
            className="h-6 w-6 rounded"
          />
        ) : (
          <div className="h-6 w-6 rounded bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
            {toolkit.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="flex-1 text-sm font-medium text-white text-left">
          {toolkit.name}
        </span>
        <span className="text-xs text-slate-500 mr-2">
          {toolkit.tools.length} tools
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 p-2 space-y-1">
          {toolkit.tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              toolkitSlug={toolkit.slug}
              toolkitName={toolkit.name}
              toolkitLogo={toolkit.logo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolCardProps {
  tool: ComposioTool;
  toolkitSlug: string;
  toolkitName: string;
  toolkitLogo?: string;
}

function ToolCard({ tool, toolkitSlug, toolkitName, toolkitLogo }: ToolCardProps) {
  const { steps, addStep, setSelectedStep, setConnection, connections } = useWorkflowsDStore();

  const handleAdd = () => {
    const step = createStepFromTool(
      tool,
      toolkitSlug,
      toolkitName,
      toolkitLogo,
      steps.length
    );
    addStep(step);
    setSelectedStep(step.id);

    // Auto-add connection requirement
    if (!connections[toolkitSlug]) {
      setConnection(toolkitSlug, null);
    }
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full flex items-center gap-3 p-2.5 hover:bg-violet-500/10 rounded-lg transition-colors group"
    >
      <div className="flex-1 text-left">
        <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
          {tool.name}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-1">
          {tool.description || tool.id}
        </p>
      </div>
      <Plus className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
    </button>
  );
}




