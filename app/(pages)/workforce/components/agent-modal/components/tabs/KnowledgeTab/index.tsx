"use client";

import { useState } from "react";
import {
  MessageSquare,
  ClipboardList,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentConfig } from "@/_tables/types";
import {
  KnowledgeSection,
  KeyValueRow,
  ProjectRow,
  ContextItem,
  DecisionRow,
} from "./components/KnowledgeSection";
import { ClearMemoryDialog } from "./components/ClearMemoryDialog";
import { useKnowledge } from "./hooks/useKnowledge";

interface KnowledgeTabProps {
  agent: AgentConfig;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatPreferenceValue(value: string | undefined): string {
  if (!value) return "Not set";
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

export function KnowledgeTab({ agent }: KnowledgeTabProps) {
  const { knowledge, updatedAt, isLoading, hasKnowledge, clearKnowledge, refresh } =
    useKnowledge(agent.id);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    await clearKnowledge();
    setIsClearing(false);
    setClearDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-muted/30 min-h-full">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasKnowledge) {
    return (
      <div className="p-8 bg-muted/30 min-h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Knowledge Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {agent.name} hasn&apos;t learned anything about you yet. Start a
            conversation and share your preferences, projects, or context—the
            agent will remember what&apos;s important.
          </p>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const prefs = knowledge?.communicationPreferences;
  const projects = knowledge?.activeProjects || [];
  const context = knowledge?.keyContext || [];
  const decisions = knowledge?.recentDecisions || [];

  return (
    <div className="p-8 bg-muted/30 min-h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-semibold">
              What {agent.name} Knows About You
            </h2>
            <p className="text-sm text-muted-foreground">
              Information remembered across conversations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" />
              Last updated {formatRelativeTime(updatedAt)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Communication Preferences */}
        {prefs && (prefs.style || prefs.responseLength || prefs.formatPreference) && (
          <KnowledgeSection
            title="Communication Preferences"
            description="How you like to receive information"
            icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          >
            <div className="space-y-1">
              {prefs.style && (
                <KeyValueRow
                  label="Response Style"
                  value={formatPreferenceValue(prefs.style)}
                />
              )}
              {prefs.responseLength && (
                <KeyValueRow
                  label="Preferred Length"
                  value={formatPreferenceValue(prefs.responseLength)}
                />
              )}
              {prefs.formatPreference && (
                <KeyValueRow
                  label="Format Preference"
                  value={formatPreferenceValue(prefs.formatPreference)}
                  isLast
                />
              )}
            </div>
          </KnowledgeSection>
        )}

        {/* Active Projects */}
        {projects.length > 0 && (
          <KnowledgeSection
            title="Active Projects"
            description="Projects we're currently working on together"
            icon={<ClipboardList className="w-4 h-4 text-blue-600" />}
            iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          >
            <div className="-m-4">
              {projects.map((project, index) => (
                <ProjectRow
                  key={index}
                  name={project.name}
                  notes={project.notes}
                  status={project.status}
                />
              ))}
            </div>
          </KnowledgeSection>
        )}

        {/* Key Context */}
        {context.length > 0 && (
          <KnowledgeSection
            title="Key Context"
            description="Important things to remember"
            icon={<Info className="w-4 h-4 text-amber-600" />}
            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          >
            <div className="space-y-1">
              {context.map((item, index) => (
                <ContextItem key={index} text={item} />
              ))}
            </div>
          </KnowledgeSection>
        )}

        {/* Recent Decisions */}
        {decisions.length > 0 && (
          <KnowledgeSection
            title="Recent Decisions"
            description="Decisions made during our conversations"
            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
          >
            <div className="-m-4">
              {decisions.map((item, index) => (
                <DecisionRow
                  key={index}
                  decision={item.decision}
                  date={item.date}
                />
              ))}
            </div>
          </KnowledgeSection>
        )}
      </div>

      {/* Clear Dialog */}
      <ClearMemoryDialog
        open={clearDialogOpen}
        agentName={agent.name}
        onOpenChange={setClearDialogOpen}
        onConfirm={handleClear}
      />
    </div>
  );
}

