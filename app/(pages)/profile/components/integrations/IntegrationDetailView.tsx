"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { AuthConfig } from "../../hooks/useIntegrations";

type Tool = { slug: string; name: string; description?: string };
type Trigger = { slug: string; name: string; description?: string };

type IntegrationDetailViewProps = {
  authConfig: AuthConfig;
  onBack: () => void;
  onConnect?: (authConfigId: string) => void;
};

export function IntegrationDetailView({ authConfig, onBack, onConnect }: IntegrationDetailViewProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [showAllTriggers, setShowAllTriggers] = useState(false);

  const toolkitSlug = authConfig?.toolkit?.slug;

  useEffect(() => {
    if (!toolkitSlug) return;
    
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        const [toolsRes, triggersRes] = await Promise.all([
          fetch(`/api/integrations/toolkits/${toolkitSlug}/tools`),
          fetch(`/api/integrations/toolkits/${toolkitSlug}/triggers`),
        ]);
        
        if (cancelled) return;
        
        const toolsData = toolsRes.ok ? await toolsRes.json() : { items: [] };
        const triggersData = triggersRes.ok ? await triggersRes.json() : { items: [] };
        
        setTools(toolsData.items || toolsData || []);
        setTriggers(triggersData.items || triggersData || []);
        setShowAllTools(false);
        setShowAllTriggers(false);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    
    setIsLoading(true);
    fetchData();
    
    return () => { cancelled = true; };
  }, [toolkitSlug]);

  const visibleTools = showAllTools ? tools : tools.slice(0, 8);
  const visibleTriggers = showAllTriggers ? triggers : triggers.slice(0, 5);
  const hiddenToolsCount = tools.length - 8;
  const hiddenTriggersCount = triggers.length - 5;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with back button */}
      <div className="border-b border-slate-200 p-6 bg-gradient-to-b from-slate-50 to-white flex items-start gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {authConfig.toolkit?.logo ? (
          <img src={authConfig.toolkit.logo} alt="" className="w-14 h-14 rounded-xl border" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-slate-100 border flex items-center justify-center text-xl font-bold text-slate-600">
            {(authConfig.toolkit?.name || authConfig.name).charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{authConfig.toolkit?.name || authConfig.name}</h2>
            {authConfig.isConnected && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Connected</span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{authConfig.name}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{authConfig.authScheme}</span>
          </div>
        </div>

        {!authConfig.isConnected && (
          <Button onClick={() => onConnect?.(authConfig.id)}>Connect</Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading capabilities...</div>
        ) : (
          <>
            {/* Tools Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Available Tools</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tools.length} tools</span>
              </div>
              {tools.length === 0 ? (
                <p className="text-sm text-slate-500">No tools available for this integration.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleTools.map((tool) => (
                      <div key={tool.slug} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                        <div className="text-xs font-semibold text-slate-900 truncate">{tool.slug}</div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tool.description || tool.name}</p>
                      </div>
                    ))}
                  </div>
                  {hiddenToolsCount > 0 && (
                    <button
                      onClick={() => setShowAllTools(!showAllTools)}
                      className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {showAllTools ? "Show less" : `Show ${hiddenToolsCount} more tools →`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Triggers Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Available Triggers</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{triggers.length} triggers</span>
              </div>
              {triggers.length === 0 ? (
                <p className="text-sm text-slate-500">No triggers available for this integration.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {visibleTriggers.map((trigger) => (
                      <div key={trigger.slug} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-amber-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">{trigger.slug}</span>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">EVENT</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{trigger.description || trigger.name}</p>
                      </div>
                    ))}
                  </div>
                  {hiddenTriggersCount > 0 && (
                    <button
                      onClick={() => setShowAllTriggers(!showAllTriggers)}
                      className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {showAllTriggers ? "Show less" : `Show ${hiddenTriggersCount} more triggers →`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Documentation Link */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs text-blue-700">
                View full documentation on{" "}
                <a href={`https://docs.composio.dev/tools/${toolkitSlug}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Composio Docs
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

