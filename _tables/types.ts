import type { Tool } from "ai";
import type { Node, Edge } from "@xyflow/react";

export type AgentStatus = "active" | "paused" | "attention";

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
