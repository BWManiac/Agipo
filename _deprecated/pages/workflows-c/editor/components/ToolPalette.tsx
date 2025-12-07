"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { JSONSchema } from "@/app/api/workflows/services/types";

interface ComposioTool {
  name: string;
  enum: string;
  tags: string[];
  logo: string | null;
  description: string;
  displayName: string;
  toolkit: {
    id: string;
    slug: string;
    name: string;
    description: string;
  };
  inputParameters: Record<string, unknown>;
  outputParameters?: Record<string, unknown>;
}

interface ToolkitGroup {
  slug: string;
  name: string;
  logo: string | null;
  tools: ComposioTool[];
}

export function ToolPalette() {
  const [search, setSearch] = useState("");
  const [tools, setTools] = useState<ComposioTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedToolkits, setExpandedToolkits] = useState<Set<string>>(new Set());
  const { addStep, steps } = useWorkflowEditorStore();

  useEffect(() => {
    async function fetchTools() {
      try {
        setLoading(true);
        const response = await fetch("/api/tools/composio");
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools || []);
        }
      } catch (err) {
        console.error("Failed to fetch tools:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  // Group tools by toolkit
  const toolkitGroups: ToolkitGroup[] = Object.values(
    tools.reduce((acc, tool) => {
      const slug = tool.toolkit?.slug || "other";
      if (!acc[slug]) {
        acc[slug] = {
          slug,
          name: tool.toolkit?.name || "Other",
          logo: tool.logo,
          tools: [],
        };
      }
      acc[slug].tools.push(tool);
      return acc;
    }, {} as Record<string, ToolkitGroup>)
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Filter by search
  const filteredGroups = search
    ? toolkitGroups
        .map((group) => ({
          ...group,
          tools: group.tools.filter(
            (t) =>
              t.displayName.toLowerCase().includes(search.toLowerCase()) ||
              t.description?.toLowerCase().includes(search.toLowerCase()) ||
              t.toolkit?.name?.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((g) => g.tools.length > 0)
    : toolkitGroups;

  function toggleToolkit(slug: string) {
    setExpandedToolkits((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function handleAddTool(tool: ComposioTool) {
    const stepId = `step-${uuidv4().slice(0, 8)}`;
    addStep({
      id: stepId,
      name: tool.displayName,
      type: "composio",
      toolId: tool.enum,
      toolkitSlug: tool.toolkit?.slug,
      description: tool.description,
      inputSchema: {
        type: "object",
        properties: tool.inputParameters as JSONSchema["properties"],
        required: [],
      } as JSONSchema,
      outputSchema: tool.outputParameters
        ? ({
            type: "object",
            properties: tool.outputParameters as JSONSchema["properties"],
            required: [],
          } as JSONSchema)
        : ({
            type: "object",
            properties: {
              data: { type: "object" },
              successful: { type: "boolean" },
            },
            required: [],
          } as JSONSchema),
      position: { x: 0, y: steps.length * 150 },
      listIndex: steps.length,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading tools...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Toolkit Groups */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No tools found
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.slug} className="border-b border-slate-700/50">
              {/* Toolkit Header */}
              <button
                onClick={() => toggleToolkit(group.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors"
              >
                {group.logo ? (
                  <img src={group.logo} alt="" className="w-6 h-6 rounded" />
                ) : (
                  <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400 uppercase">
                    {group.name.slice(0, 2)}
                  </div>
                )}
                <span className="flex-1 text-left text-sm font-medium text-white capitalize">
                  {group.name}
                </span>
                <span className="text-xs text-slate-500">{group.tools.length}</span>
                {expandedToolkits.has(group.slug) ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Tools */}
              {expandedToolkits.has(group.slug) && (
                <div className="bg-slate-800/30 py-1">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.enum}
                      onClick={() => handleAddTool(tool)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex-1 text-left">
                        <div className="text-sm text-slate-200 group-hover:text-white transition-colors">
                          {tool.displayName}
                        </div>
                        {tool.description && (
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {tool.description}
                          </div>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-cyan-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

