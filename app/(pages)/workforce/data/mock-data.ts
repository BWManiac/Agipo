/**
 * Mock data for workforce page and create agent flow
 * 
 * This file provides mock data structures for:
 * - Create agent wizard
 * - Marketplace agent templates
 * - Workforce metrics
 * - Agent activity data
 */

import type { AgentConfig, ConnectionToolBinding, WorkflowBinding } from "@/_tables/types";

// ============================================================================
// Create Agent Wizard Data Types
// ============================================================================

export interface CreateAgentWizardData {
  // Step 1: Identity
  identity: {
    name: string;
    role: string;
    avatar: string;
    description: string;
  };
  
  // Step 2: Personality
  personality: {
    systemPrompt: string;
    model: string;
    objectives: string[];
    guardrails: string[];
  };
  
  // Step 3: Capabilities
  capabilities: {
    customToolIds: string[];
    connectionToolBindings: ConnectionToolBinding[];
    workflowBindings: WorkflowBinding[];
  };
  
  // Step 4: Quick Prompts
  quickPrompts: string[];
}

// ============================================================================
// Marketplace Agent Templates
// ============================================================================

export interface MarketplaceAgentTemplate {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  model: string;
  defaultObjectives: string[];
  defaultGuardrails: string[];
  requiredConnections?: string[]; // Toolkit slugs like ["gmail", "slack"]
  defaultCapabilities: string[];
  pricing?: {
    free: boolean;
    monthlyPrice?: number;
    usageQuota?: {
      workflowRuns: number;
      toolCalls: number;
    };
  };
  rating?: number;
  reviewCount?: number;
  usage?: string;
  verified?: boolean;
}

export const marketplaceAgentTemplates: MarketplaceAgentTemplate[] = [
  {
    id: "template-pm",
    name: "Product Manager",
    role: "Product Manager",
    avatar: "🧭",
    description: "Synthesizes feedback, prioritizes roadmap items, and keeps delivery aligned with business goals.",
    systemPrompt: "You are a Product Manager embedded with the team. Monitor initiatives, surface risks, and keep stakeholders aligned.",
    model: "google/gemini-2.5-pro",
    defaultObjectives: ["Accelerate PLG roadmap", "Improve onboarding completion"],
    defaultGuardrails: ["Escalate spend > $10k", "Respect enterprise release schedule"],
    requiredConnections: [],
    defaultCapabilities: ["Roadmap synthesis", "Launch comms", "Stakeholder pulse"],
    pricing: { free: true },
    rating: 4.8,
    reviewCount: 234,
    usage: "1.2k uses",
    verified: true,
  },
  {
    id: "template-marketing",
    name: "Growth Marketing",
    role: "Growth Marketing",
    avatar: "📈",
    description: "Creates campaign briefs, runs experiments, and monitors performance anomalies.",
    systemPrompt: "You are a growth marketer. Monitor campaign performance, surface anomalies, and draft messaging quickly.",
    model: "google/gemini-2.5-pro",
    defaultObjectives: ["Increase activation by 12%", "Ship pricing refresh"],
    defaultGuardrails: ["Budget cap $15k/mo", "Compliance review for GA content"],
    requiredConnections: ["gmail"],
    defaultCapabilities: ["Email sequencing", "Experiment design", "Attribution insights"],
    pricing: { free: true },
    rating: 4.6,
    reviewCount: 189,
    usage: "890 uses",
    verified: true,
  },
  {
    id: "template-support",
    name: "Support Operations",
    role: "Support Operations",
    avatar: "🛟",
    description: "Routes tickets, prepares weekly ops briefs, and monitors SLA risk.",
    systemPrompt: "You are a support operations lead. Monitor SLA risk, route tickets, and keep ops briefed.",
    model: "google/gemini-2.5-pro",
    defaultObjectives: ["Reduce escalations", "Improve handoffs"],
    defaultGuardrails: ["Escalate VIP within 10m", "No bulk closures"],
    requiredConnections: [],
    defaultCapabilities: ["Auto triage", "Sentiment routing", "Weekly ops digest"],
    pricing: { free: true },
    rating: 4.7,
    reviewCount: 156,
    usage: "1.1k uses",
    verified: true,
  },
  {
    id: "template-engineering",
    name: "Engineering Lead",
    role: "Engineering Lead",
    avatar: "⚙️",
    description: "Monitors sprint health, reviews technical debt, and surfaces blockers before they escalate.",
    systemPrompt: "You are an engineering lead. Track sprint progress, flag technical risks, and recommend prioritization shifts when needed.",
    model: "google/gemini-2.5-pro",
    defaultObjectives: ["Reduce sprint slippage", "Pay down critical tech debt"],
    defaultGuardrails: ["No prod deploys Friday afternoons", "All migrations require staging validation"],
    requiredConnections: [],
    defaultCapabilities: ["Sprint monitoring", "Tech debt analysis", "Release coordination"],
    pricing: { free: true },
    rating: 4.9,
    reviewCount: 312,
    usage: "2.3k uses",
    verified: true,
  },
];

// ============================================================================
// Workforce Metrics
// ============================================================================

export interface WorkforceMetrics {
  agentsHired: {
    value: number;
    trend?: string;
  };
  tasksCompleted: {
    value: number;
    pending: number;
    trend?: string;
  };
  alerts: {
    value: number;
    requiringApproval: number;
    severity?: "low" | "medium" | "high";
  };
  activeConversations?: {
    value: number;
    agentsEngaged: number;
  };
}

export function getWorkforceMetrics(agents: AgentConfig[]): WorkforceMetrics {
  const activeAgents = agents.filter(a => a.status === "active").length;
  const attentionAgents = agents.filter(a => a.status === "attention").length;
  
  return {
    agentsHired: {
      value: agents.length,
      trend: "+1 recommendation",
    },
    tasksCompleted: {
      value: 37, // TODO: Calculate from actual task data
      pending: 5,
      trend: "+12% vs last week",
    },
    alerts: {
      value: attentionAgents + 1, // +1 for other alerts
      requiringApproval: 2,
      severity: attentionAgents > 0 ? "medium" : "low",
    },
    activeConversations: {
      value: 12, // TODO: Calculate from actual thread data
      agentsEngaged: activeAgents,
    },
  };
}

// ============================================================================
// Agent Activity Data
// ============================================================================

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  action: string;
  timestamp: string;
  details?: string;
}

export const mockAgentActivities: AgentActivity[] = [
  {
    id: "activity-1",
    agentId: "pm",
    agentName: "Mira Patel",
    agentAvatar: "🧭",
    action: "completed story map refresh",
    timestamp: "10 minutes ago",
    details: "Organised 14 discovery notes into 3 opportunity themes",
  },
  {
    id: "activity-2",
    agentId: "marketing",
    agentName: "Noah Reyes",
    agentAvatar: "📈",
    action: "flagged pricing copy for approval",
    timestamp: "1 hour ago",
    details: "Draft ready in Notion. Provide final comments by Friday",
  },
  {
    id: "activity-3",
    agentId: "engineering",
    agentName: "Alex Kim",
    agentAvatar: "⚙️",
    action: "identified sprint blocker",
    timestamp: "2 hours ago",
    details: "Database migration dependency blocking feature work",
  },
];

// ============================================================================
// Default Agent Config Values
// ============================================================================

export const defaultAgentConfig: Partial<AgentConfig> = {
  status: "active",
  model: "google/gemini-2.5-pro",
  toolIds: [],
  connectionToolBindings: [],
  workflowBindings: [],
  quickPrompts: [],
  objectives: [],
  guardrails: [],
  metrics: [],
  assignedWorkflows: [],
  capabilities: [],
  insights: [],
  activities: [],
  feedback: [],
  highlight: "",
  lastActivity: "Just created",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique agent ID from a name
 */
export function generateAgentId(name: string): string {
  // Convert name to slug: "Mira Patel" -> "mira-patel"
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  
  return `${slug}-${timestamp}`;
}

/**
 * Get available models for agent configuration
 */
export const availableModels = [
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  { value: "google/gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google" },
  { value: "anthropic/claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "openai/gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
];

/**
 * Get common role suggestions
 */
export const roleSuggestions = [
  "Product Manager",
  "Engineering Lead",
  "Growth Marketing",
  "Support Operations",
  "Data Analyst",
  "Content Creator",
  "Sales Operations",
  "HR Coordinator",
  "Finance Analyst",
  "Customer Success",
];

/**
 * Get common objective suggestions
 */
export const objectiveSuggestions = [
  "Accelerate PLG roadmap",
  "Improve onboarding completion",
  "Reduce sprint slippage",
  "Increase activation by 12%",
  "Reduce escalations",
  "Pay down critical tech debt",
];

/**
 * Get common guardrail suggestions
 */
export const guardrailSuggestions = [
  "Escalate spend > $10k",
  "Respect enterprise release schedule",
  "No prod deploys Friday afternoons",
  "Budget cap $15k/mo",
  "Escalate VIP within 10m",
  "All migrations require staging validation",
];

