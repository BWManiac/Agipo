# CLAUDE.MD - Agipo Project Context

**Last Updated:** 2025-12-05
**Project:** Agipo
**Main Repository:** /Users/zen/Desktop/Code/agipo

## Project Overview

Agipo is a visual workflow automation platform that empowers knowledge workers to become "10x workers" by codifying their expertise and leveraging AI as a force multiplier. It enables users to describe tasks in natural language, instantly visualize them as node-based workflows, and execute them with AI assistance.

### Core Value Proposition

- **Natural Language to Workflow**: Describe tasks in plain language, get visual workflows
- **Dynamic & Bespoke Nodes**: AI-generated scripts instead of rigid API integrations
- **Workflow-as-Code**: User-created compound processes that can call integrations
- **Hybrid Capability System**: Seamlessly combines third-party integrations (Composio) with custom workflows

## Tech Stack

### Framework & UI
- **Next.js 16.0.1** (App Router)
- **React 19.2.0** with React DOM
- **TypeScript 5**
- **Tailwind CSS 4** with PostCSS

### Key Dependencies
- **Mastra** (`@mastra/core`) - AI agent framework (built on Vercel AI SDK)
- **Mastra Memory** (`@mastra/memory`, `@mastra/libsql`) - Conversation persistence and working memory
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/gateway`) - AI orchestration primitives
- **Composio** (`@composio/core`, `@composio/vercel`) - Third-party integrations platform
- **Clerk** (`@clerk/nextjs`) - Authentication
- **Zustand 5** - State management
- **Radix UI** - Accessible component primitives
- **XYFlow** (`@xyflow/react`) - Node-based workflow canvas
- **TanStack Query** - Data fetching and caching
- **React Hook Form** + Zod - Form handling and validation
- **Polars** (`nodejs-polars`) - Data manipulation
- **Shiki** - Syntax highlighting
- **WebContainer API** - Code execution environment

### Development Tools
- **Playwright** - E2E testing
- **ESLint** - Code linting

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Page routes
│   │   ├── home/          # Landing page
│   │   ├── marketplace/   # Agent marketplace
│   │   ├── profile/       # User profile & connections
│   │   ├── records/       # Data records management
│   │   ├── tools/         # Tools pages
│   │   │   └── editor/    # Visual workflow editor
│   │   └── workforce/     # Agent management dashboard
│   ├── api/               # API routes
│   │   ├── connections/   # Integration connections API
│   │   ├── tools/         # Custom tools API
│   │   └── workforce/     # Agent management API
│   └── layout.tsx         # Root layout
├── components/            # Shared components
│   ├── ui/               # UI primitives (shadcn/ui)
│   ├── layout/           # Layout components
│   └── ai-elements/      # AI-specific components
├── lib/                   # Utilities and shared logic
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── public/               # Static assets
├── _docs/                # Documentation
│   ├── Architecture/     # Architecture decisions
│   ├── Engineering/      # Technical documentation
│   ├── Product/          # Product strategy
│   ├── UXD/              # UX/UI design docs
│   ├── _diary/           # Development journal
│   ├── _tasks/           # Task planning documents
│   └── _random_thoughts/ # Exploratory notes
└── _tables/              # Data table schemas
    ├── agents/           # Agent definitions
    └── tools/            # Tool definitions
```

## Core Concepts

### 1. The IPO Model (Input-Process-Output)

All knowledge work can be deconstructed into atomic IPO steps:
- **Input**: Raw materials (data, feedback, documents)
- **Process**: Cognitive or technical work (analysis, synthesis, creation)
- **Output**: Results (reports, decisions, code)

Each node in the workflow canvas represents one IPO step, with edges showing data flow between nodes.

### 2. Hierarchy of Capabilities

**Capabilities** = Any discrete action an Agent can perform

Two types of capabilities:

#### Integrations (formerly "Basic Tools")
- Source: Composio platform
- Definition: Atomic actions from third-party SaaS platforms
- Examples: `gmail_send_email`, `github_star_repo`, `slack_post_message`
- Execution: Handled by Composio SDK with OAuth management

#### Workflows (formerly "Custom Tools")
- Source: User-created in Agipo
- Definition: Compound processes authored in Workflow Editor
- Examples: `onboard_employee`, `generate_weekly_report`
- Execution: Handled by Agipo's Workflow-as-Code engine

**Key Insight**: Workflows can (and often do) call Integrations internally.

### 3. The Hybrid Toolset Pattern

Capabilities are merged at the Application Runtime Layer (before calling the LLM):

```typescript
// Service: lib/agents/tools.ts
export async function getAgentCapabilities(agentId: string) {
  // 1. Fetch Integrations from Composio
  const integrationTools = await composioToolSet.getTools({ entityId: agentId });

  // 2. Fetch Workflows from Database
  const workflowRecords = await getAssignedWorkflows(agentId);

  // 3. Wrap Workflows as Vercel AI SDK Tools
  const workflowTools = workflowRecords.reduce((acc, wf) => {
    acc[wf.slug] = tool({
      description: wf.description,
      parameters: wf.inputSchema,
      execute: async (args) => executeWorkflow(wf.id, args)
    });
    return acc;
  }, {});

  // 4. Merge and Return
  return { ...integrationTools, ...workflowTools };
}
```

This approach maintains separation of concerns:
- **Agipo owns the Logic** (Workflows)
- **Composio owns the Connectivity** (Integrations)
- They merge at the edge

## Key Features

### Visual Workflow Canvas
- Heart of the Agipo interface
- Node-based UI powered by XYFlow
- Natural language node creation
- Visual data flow representation

### AI-Assisted Refinement
- **Node Decomposition**: Break high-level nodes into detailed sub-workflows
- **Conditional Logic**: AI helps insert branching logic
- **Dynamic Scripts**: Generate bespoke code for any node action

### Workforce Management
- Create and configure AI agents
- Assign capabilities (both integrations and workflows)
- Chat interface with tool execution
- Activity monitoring and metrics

### Integrations Platform
- Connect to third-party services via Composio
- OAuth flow management
- Connection status tracking
- Toolkit-based tool discovery

### Records Domain
- Data manipulation using Polars
- Shared memory between agents and workflows
- Table-based data storage

## Development Philosophy

### Core Principles

1. **Augmentation Before Automation**: AI as a force multiplier for individual productivity
2. **Resonance Over Perfection**: AI should mirror the user's thinking style, not aim for generic perfection
3. **Granular and Composable**: Work is decomposable into reusable, atomic units
4. **From Reactive to Proactive**: Vision of AI that discovers and suggests workflows automatically

### Code Organization

- **Documentation**: Extensive docs in `_docs/` organized by Architecture, Engineering, Product, UXD
- **Diary Entries**: Development journal tracking key implementation learnings
- **Task Planning**: Detailed task breakdowns in `_docs/_tasks/`
- **Page-Level READMEs**: API routes include README documentation

## Recent Work (Last 5 Commits)

1. **6313df5** - Enhance agent configuration and capabilities management
2. **e2d82b2** - Add connection tool bindings to agent configuration
3. **fed9fdb** - Refactor import paths in shared components for consistency
4. **74ea6f8** - Refactor integration components and update API routes
5. **ac5b954** - Remove obsolete integration files and refactor components

## Important Development Notes

### Authentication
- Using Clerk for user authentication
- Entity IDs used for Composio integration scoping

### State Management
- Zustand stores for application state
- See `_docs/Engineering/Architecture/Store-Slice-Architecture.md` for patterns

### Workflow Execution
- WebContainer API provides isolated execution environment
- Workflows transpiled to executable code
- Runtime injection of Composio toolset for integration calls

### API Structure
- RESTful API routes in `app/api/`
- Organized by domain: connections, tools, workforce
- Each endpoint has dedicated README for documentation

## Key Documentation References

- **Product Vision**: `_docs/Product/Positioning/02-agipo-product-overview.md`
- **Core Thesis**: `_docs/Product/Strategy/01-agipo-thesis.md`
- **Hybrid Capability System**: `_docs/Architecture/Hybrid-Capability-System.md`
- **Engineering Taxonomy**: `_docs/Engineering/README.md`
- **Latest Diary Entry**: `_docs/_diary/17.2-ConnectionToolSchemaFix.md`
- **Mastra Migration Plan**: `_docs/_tasks/9-mastra-migration.md`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The app runs on [http://localhost:3000](http://localhost:3000)

## Testing

- E2E tests using Playwright
- Test results documented in `_docs/_tasks/8-backend-integration-test-results.md`

## Current Focus Areas

Based on recent commits and diary entries:
1. **Mastra Migration** - Migrated agent runtime from Vercel AI SDK `Experimental_Agent` to Mastra `Agent`
2. Agent configuration and capability management refinement
3. Connection tool bindings and schema fixes
4. Integration platform stability and error handling
5. Component architecture refactoring for maintainability

## Notes for AI Assistants

- This is the main project repository
- Worktrees may exist at `/Users/zen/.claude-worktrees/agipo/`
- Always check `_docs/_diary/` for latest implementation context
- Refer to `_docs/Architecture/` for architectural decisions
- Use `_docs/_tasks/` for understanding planned work
- The project uses App Router conventions (Next.js 13+)
- TypeScript strict mode is enabled
- Follow existing patterns in component organization
