"use client";

import { useState, useMemo } from "react";
import { useWorkflowsBStore } from "../../../editor/store";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { 
  PLATFORM_ICONS, 
  type WorkflowStep, 
  type SchemaField 
} from "@/_tables/workflows-b/types";

/**
 * Mock tool data - in a real implementation, this would come from Composio API
 */
const MOCK_TOOLS = [
  {
    platform: "firecrawl",
    displayName: "Firecrawl",
    tools: [
      { id: "FIRECRAWL_SCRAPE", name: "Scrape Page", description: "Extract content from a webpage" },
      { id: "FIRECRAWL_CRAWL", name: "Crawl Site", description: "Crawl an entire website" },
      { id: "FIRECRAWL_EXTRACT", name: "Extract Data", description: "Extract structured data" },
    ],
  },
  {
    platform: "openai",
    displayName: "OpenAI",
    tools: [
      { id: "OPENAI_CHAT", name: "Chat Completion", description: "Generate text using GPT" },
      { id: "OPENAI_GENERATE", name: "Generate Text", description: "Generate text content" },
      { id: "OPENAI_IMAGE", name: "Generate Image", description: "Create images with DALL-E" },
      { id: "OPENAI_EMBEDDING", name: "Create Embedding", description: "Generate embeddings" },
    ],
  },
  {
    platform: "gmail",
    displayName: "Gmail",
    tools: [
      { id: "GMAIL_SEND", name: "Send Email", description: "Send an email" },
      { id: "GMAIL_READ", name: "Read Email", description: "Read email content" },
      { id: "GMAIL_SEARCH", name: "Search Emails", description: "Search through emails" },
    ],
  },
  {
    platform: "github",
    displayName: "GitHub",
    tools: [
      { id: "GITHUB_CREATE_FILE", name: "Create File", description: "Create a file in a repo" },
      { id: "GITHUB_CREATE_PR", name: "Create PR", description: "Create a pull request" },
      { id: "GITHUB_LIST_REPOS", name: "List Repos", description: "List repositories" },
      { id: "GITHUB_GET_ISSUES", name: "Get Issues", description: "Get repository issues" },
      { id: "GITHUB_CREATE_ISSUE", name: "Create Issue", description: "Create a new issue" },
    ],
  },
  {
    platform: "slack",
    displayName: "Slack",
    tools: [
      { id: "SLACK_SEND", name: "Send Message", description: "Send a Slack message" },
      { id: "SLACK_CREATE_CHANNEL", name: "Create Channel", description: "Create a new channel" },
      { id: "SLACK_LIST_CHANNELS", name: "List Channels", description: "List all channels" },
    ],
  },
  {
    platform: "browser",
    displayName: "Browser",
    tools: [
      { id: "BROWSER_CLICK", name: "Click Element", description: "Click on a page element" },
      { id: "BROWSER_TYPE", name: "Type Text", description: "Type text into an input" },
      { id: "BROWSER_NAVIGATE", name: "Navigate", description: "Navigate to a URL" },
      { id: "BROWSER_SCREENSHOT", name: "Screenshot", description: "Take a screenshot" },
    ],
  },
];

/**
 * ToolsPanel - Tool palette for adding steps
 * Based on Variation 1 (lines 347-477)
 */
export function ToolsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(
    new Set(MOCK_TOOLS.map(p => p.platform))
  );
  
  const addStep = useWorkflowsBStore(state => state.addStep);
  const closeAddStepModal = useWorkflowsBStore(state => state.closeAddStepModal);
  
  // Filter tools based on search
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_TOOLS;
    
    const query = searchQuery.toLowerCase();
    return MOCK_TOOLS.map(platform => ({
      ...platform,
      tools: platform.tools.filter(
        tool => 
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          platform.displayName.toLowerCase().includes(query)
      ),
    })).filter(platform => platform.tools.length > 0);
  }, [searchQuery]);
  
  const togglePlatform = (platform: string) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };
  
  const handleAddTool = (platform: string, tool: { id: string; name: string; description: string }) => {
    // Create a new step for this tool
    const newStep: Omit<WorkflowStep, "position"> = {
      id: nanoid(8),
      type: "composio",
      label: tool.name,
      toolId: tool.id,
      platform,
      inputSchema: {
        fields: getDefaultInputSchema(tool.id),
      },
      outputSchema: {
        fields: getDefaultOutputSchema(tool.id),
      },
      inputMappings: [],
    };
    
    addStep(newStep);
    closeAddStepModal();
  };
  
  const handleAddCodeStep = () => {
    const newStep: Omit<WorkflowStep, "position"> = {
      id: nanoid(8),
      type: "code",
      label: "Custom Code",
      code: "// Write your custom logic here\n",
      inputSchema: { fields: [] },
      outputSchema: { fields: [] },
      inputMappings: [],
    };
    
    addStep(newStep);
    closeAddStepModal();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Tool Groups */}
      <div className="flex-1 overflow-y-auto space-y-4 -mx-4 px-4">
        {filteredTools.map((platform) => (
          <div key={platform.platform}>
            {/* Platform Header */}
            <button
              onClick={() => togglePlatform(platform.platform)}
              className="flex items-center gap-2 mb-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <span className="text-base">
                {PLATFORM_ICONS[platform.platform] || "🔧"}
              </span>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex-1">
                {platform.displayName}
              </span>
              <span className="text-xs text-gray-400">
                ({platform.tools.length})
              </span>
              {expandedPlatforms.has(platform.platform) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {/* Tools */}
            {expandedPlatforms.has(platform.platform) && (
              <div className="space-y-1 ml-6">
                {platform.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleAddTool(platform.platform, tool)}
                    className="w-full flex items-center gap-2 p-2 text-sm text-left hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group"
                  >
                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tool.name}</div>
                      <div className="text-xs text-gray-400 group-hover:text-blue-500/70 truncate">
                        {tool.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Custom Code Option */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleAddCodeStep}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-colors text-left"
          >
            <span className="text-2xl">💻</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Custom Code</div>
              <div className="text-xs text-gray-500">
                Write your own JavaScript/TypeScript
              </div>
            </div>
          </button>
        </div>
        
        {/* Empty state */}
        {filteredTools.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No tools match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get default input schema for a tool
 * In real implementation, this would come from Composio
 */
function getDefaultInputSchema(toolId: string): SchemaField[] {
  const schemas: Record<string, SchemaField[]> = {
    FIRECRAWL_SCRAPE: [
      { name: "url", type: "string", description: "URL to scrape", required: true },
    ],
    OPENAI_CHAT: [
      { name: "prompt", type: "string", description: "The prompt to send", required: true },
      { name: "model", type: "string", description: "Model to use", required: false },
    ],
    GMAIL_SEND: [
      { name: "to", type: "string", description: "Recipient email", required: true },
      { name: "subject", type: "string", description: "Email subject", required: true },
      { name: "body", type: "string", description: "Email body", required: true },
    ],
  };
  
  return schemas[toolId] || [
    { name: "input", type: "string", description: "Input data", required: true },
  ];
}

/**
 * Get default output schema for a tool
 * In real implementation, this would come from Composio
 */
function getDefaultOutputSchema(toolId: string): SchemaField[] {
  const schemas: Record<string, SchemaField[]> = {
    FIRECRAWL_SCRAPE: [
      { name: "title", type: "string", description: "Page title" },
      { name: "content", type: "string", description: "Page content" },
      { name: "metadata", type: "object", description: "Page metadata" },
    ],
    OPENAI_CHAT: [
      { name: "response", type: "string", description: "Generated response" },
    ],
    GMAIL_SEND: [
      { name: "messageId", type: "string", description: "Sent message ID" },
      { name: "success", type: "boolean", description: "Whether send succeeded" },
    ],
  };
  
  return schemas[toolId] || [
    { name: "result", type: "object", description: "Operation result" },
  ];
}




