import type { WorkflowSummary } from "@/_tables/types";

export interface Task {
  id: string;
  type: "workflow" | "tool";
  name: string;
  status: "completed" | "running" | "failed";
  timestamp: string;
  duration: string;
  input?: string;
  output?: string;
}

export interface ScheduledJob {
  id: string;
  title: string;
  schedule: string;
  type: "conversation" | "workflow";
  description: string;
  workflowId?: string;
}

export interface EventTrigger {
  id: string;
  title: string;
  event: string;
  action: "run_workflow" | "start_chat";
  target: string;
}

export interface MockRecord {
  id: string;
  [key: string]: string;
}

export const MOCK_TASKS: Task[] = [
  {
    id: "1",
    type: "workflow",
    name: "Draft Release Notes",
    status: "completed",
    timestamp: "Today, 9:00 AM",
    duration: "45s",
    output: "v2.4 Release Notes: Fixed login latency...",
  },
  {
    id: "2",
    type: "tool",
    name: "Jira: Create Ticket",
    status: "completed",
    timestamp: "Today, 9:42 AM",
    duration: "1.2s",
    input: '{ title: "Technical Debt", priority: "High" }',
    output: '{ id: "PROD-1042", status: "Created" }',
  },
  {
    id: "3",
    type: "workflow",
    name: "Synthesising Feedback",
    status: "running",
    timestamp: "Now",
    duration: "Running...",
  },
];

export const MOCK_JOBS: ScheduledJob[] = [
  {
    id: "job-1",
    title: "Morning Briefing",
    schedule: "09:00 AM • Daily",
    type: "conversation",
    description: '"Good morning. Here are the tasks for today..."',
  },
  {
    id: "job-2",
    title: "Weekly Report",
    schedule: "05:00 PM • Fridays",
    type: "workflow",
    description: 'Executes "Draft Release Notes" workflow silently.',
    workflowId: "draft-release-notes",
  },
];

export const MOCK_TRIGGERS: EventTrigger[] = [
  {
    id: "trig-1",
    title: "New Lead Qualification",
    event: "When a row is added to Leads",
    action: "run_workflow",
    target: "Qualify Lead",
  },
  {
    id: "trig-2",
    title: "New Support Ticket",
    event: "When row added to Tickets with priority='P1'",
    action: "start_chat",
    target: '"Hi, a P1 ticket just came in..."',
  },
];

export const MOCK_RECORDS: MockRecord[] = [
  { id: "#1024", stakeholder: "Sarah Chen (CTO)", topic: "Admin Dashboard", sentiment: "Negative", date: "Oct 24" },
  { id: "#1023", stakeholder: "Mike Ross (Sales)", topic: "Mobile App", sentiment: "Positive", date: "Oct 23" },
  { id: "#1022", stakeholder: "Jenny Li (Support)", topic: "Login Flow", sentiment: "Neutral", date: "Oct 22" },
];

export const MOCK_WORKFLOWS: WorkflowSummary[] = [
  { id: "wf-1", name: "Draft Release Notes", description: "Compiles Jira items + Git commits into a summary." },
  { id: "wf-2", name: "Weekly Report", description: "Generates and sends the Friday status email." },
];

