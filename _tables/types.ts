import type { Tool } from "ai";
import type { Node, Edge } from "@xyflow/react";

export type AgentStatus = "active" | "paused" | "attention";

/**
 * Represents a binding between an agent and a Composio connection tool.
 * This allows agents to use tools from connected accounts (Gmail, Slack, etc.)
 */
export type ConnectionToolBinding = {
  toolId: string;        // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string;  // e.g., "ca_abc123"
  toolkitSlug: string;   // e.g., "gmail"
};

export type AgentConfig = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  description: string;
  systemPrompt: string;
  model: string;
  toolIds: string[];
  maxSteps?: number; // Optional: controls stopWhen for agent loop
  connectionToolBindings?: ConnectionToolBinding[]; // Optional: tools from connected accounts
  quickPrompts: string[];
  objectives: string[];
  guardrails: string[];
  highlight: string;
  lastActivity: string;
  metrics: Array<{ label: string; value: string }>;
  assignedWorkflows: string[];
  capabilities: string[];
  insights: Array<{ title: string; detail: string; type: "question" | "opportunity" | "risk" }>;
  activities: Array<{ title: string; timestamp: string; summary: string; impact: string }>;
  feedback: Array<{ author: string; comment: string; timestamp: string }>;
  isManager?: boolean; // Optional: indicates if agent is a manager
  subAgentIds?: string[]; // Optional: IDs of sub-agents managed by this agent
};

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  runtime?: "webcontainer" | "internal" | "http" | string;
  run: Tool<unknown, unknown>;
};

export type WorkflowData = {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  lastModified?: string;
  apiKeys?: Record<string, string>;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  description: string;
  lastModified?: string;
};
