export interface CommunicationPreferences {
  style?: "formal" | "casual" | "technical";
  responseLength?: "concise" | "detailed";
  formatPreference?: "paragraphs" | "bullets" | "mixed";
}

export interface ActiveProject {
  name: string;
  status?: "active" | "blocked" | "completed";
  notes?: string;
}

export interface RecentDecision {
  decision: string;
  date?: string;
}

export interface WorkingMemory {
  communicationPreferences?: CommunicationPreferences;
  activeProjects?: ActiveProject[];
  keyContext?: string[];
  recentDecisions?: RecentDecision[];
}

export interface KnowledgeData {
  knowledge: WorkingMemory | null;
  updatedAt: string | null;
}

