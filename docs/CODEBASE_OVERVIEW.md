# Agipo Codebase Overview

## Project Vision
Agipo is a visual workflow automation platform that empowers knowledge workers to become "10x workers" by codifying their expertise and leveraging AI as a force multiplier. It transforms natural language descriptions into executable node-based workflows, bridging the gap between no-code tools and custom development.

## Core Philosophy

### The IPO Model
All knowledge work decomposes into atomic **Input → Process → Output** steps:
- **Input**: Raw materials (data, feedback, documents)
- **Process**: Cognitive or technical work (analysis, synthesis, creation)
- **Output**: Results (reports, decisions, code)

### Guiding Principles
1. **Augmentation Before Automation**: AI amplifies human capability rather than replacing it
2. **Resonance Over Perfection**: AI mirrors user thinking style rather than generic optimization
3. **Granular and Composable**: Everything decomposes into reusable, atomic units
4. **From Reactive to Proactive**: Vision of AI that discovers and suggests workflows automatically

## Technical Architecture

### Technology Stack
- **Framework**: Next.js 16.0.1 (App Router), React 19.2.0, TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **AI Framework**: Mastra Core 0.24.6 with Memory persistence
- **Integrations**: Composio for third-party service connections
- **Authentication**: Clerk for user management
- **State Management**: Zustand 5 with slice-based architecture
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Workflow Canvas**: XYFlow (React Flow) for node-based UI
- **Data Processing**: Polars for data manipulation
- **Code Execution**: WebContainer API for isolated execution

### Project Structure
```
/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Page routes with grouped layout
│   │   ├── home/          # Landing page
│   │   ├── workforce/     # Agent management dashboard
│   │   ├── tools/         # Tools and workflow editor
│   │   ├── workflows/     # Workflow management
│   │   ├── records/       # Data records management
│   │   ├── docs/          # Documentation system
│   │   └── marketplace/   # Agent marketplace
│   └── api/               # API routes (domain-driven)
│       ├── workforce/     # Agent APIs
│       ├── connections/   # Integration APIs
│       ├── workflows/     # Workflow APIs
│       ├── tools/         # Tool management APIs
│       └── records/       # Data table APIs
├── components/            # Shared components
│   ├── ui/               # shadcn/ui primitives
│   ├── ai-elements/      # AI-specific components
│   └── layout/           # Layout components
├── _tables/              # File-based data storage
│   ├── agents/           # Agent configurations
│   ├── workflows/        # Workflow definitions
│   └── records/          # Data tables
└── _docs/                # Internal documentation
    ├── Architecture/     # Architectural decisions
    ├── Engineering/      # Technical documentation
    ├── Product/          # Product strategy
    └── _diary/           # Development journal
```

## Core Concepts

### 1. Hybrid Capability System
Agipo unifies two types of capabilities:

**Integrations** (Third-party tools via Composio)
- Atomic actions from SaaS platforms
- Examples: `gmail_send_email`, `github_star_repo`, `slack_post_message`
- OAuth and API key authentication
- 100+ supported services

**Workflows** (User-created processes)
- Compound processes authored in Workflow Editor
- Can call integrations internally
- Examples: `onboard_employee`, `generate_weekly_report`
- Executed via Workflow-as-Code engine

### 2. Agent Architecture
Agents are AI-powered assistants with:
- **Persistent Memory**: Conversation history using Mastra Memory (LibSQL)
- **Tool Access**: Both integrations and workflows
- **Thread Management**: Organized conversations with auto-generated titles
- **Working Memory**: Structured knowledge about users (preferences, context)
- **Model Configuration**: Customizable AI models via AI Gateway

### 3. Workflow Execution Engine
The workflow system features:
- **Visual Canvas**: Node-based UI powered by XYFlow
- **Schema-Driven**: JSON Schema for inputs/outputs, converted to Zod at runtime
- **Runtime Construction**: Workflows built dynamically using Mastra's `createWorkflow`
- **Data Mapping**: Visual binding of inputs between workflow steps
- **WebContainer Execution**: Isolated environment for custom code execution

### 4. State Management Pattern
Consistent Zustand slice architecture:
```typescript
// Every slice follows this 4-part structure:
interface SliceState { /* data */ }
interface SliceActions { /* operations */ }
const initialState: SliceState = { /* defaults */ }
const createSlice: StateCreator = (set, get) => ({
  ...initialState,
  // action implementations
})
```

## Key Features

### Natural Language to Workflow
- Describe tasks in plain English
- AI instantly visualizes as node-based workflows
- Automatic IPO decomposition
- AI-assisted refinement and node splitting

### Dynamic Script Generation
- AI generates bespoke code for any transformation
- Not limited to pre-defined API actions
- Infinite customization possibilities
- Scripts executed in isolated WebContainer

### Persistent AI Agents
- Remember conversations across sessions
- Learn user preferences over time
- Reference past interactions
- Function like digital colleagues

### Integration Platform
- OAuth flow management via Composio
- API key connections for simpler services
- Connection status tracking
- Tool discovery and schema caching

### Data Records System
- Table-based data storage with schema evolution
- Polars-powered data manipulation
- Agent access control
- Chat interface for data queries
- Activity logging and audit trails

## API Architecture

### Domain-Driven Design
APIs organized by business capabilities:

**`/api/workforce`** - Agent Management
- Agent CRUD operations
- Chat streaming with tool execution
- Thread and memory management
- Knowledge base operations

**`/api/connections`** - Integration Platform
- OAuth and API key flows
- Connection management
- Tool discovery and schemas
- Toolkit information

**`/api/workflows`** - Workflow Engine
- Workflow CRUD operations
- Transpilation and code generation
- Input schema generation
- Registry management

**`/api/tools`** - Tool Management
- Custom tool storage
- Runtime tool loading
- Composio tool wrapping
- Workflow tool execution

**`/api/records`** - Data Tables
- Table CRUD operations
- Query and mutations
- Schema management
- Agent access control

### Service Layer Pattern
Each domain follows consistent patterns:
- **Route files**: HTTP handlers only
- **Service files**: Business logic
- **README files**: Documentation for each endpoint
- **Co-location**: Services live with their consumers

## Authentication & Security

### Clerk Integration
- User authentication with OAuth/password
- Session management via middleware
- User isolation for all resources
- Identity flows through entire stack:
  ```
  Clerk → Session → API Route → auth() → userId → Composio/Mastra
  ```

### Security Patterns
- No hardcoded credentials
- Environment variables for API keys
- User-scoped resource access
- Connection isolation per user

## Integration Patterns

### Composio Integration
Handles third-party service connections:
- **Auth Configs**: Pre-configured OAuth templates
- **Connected Accounts**: User-specific connections
- **Tool Execution**: Via Composio SDK
- **Schema Conversion**: JSON Schema to Zod

### Mastra Integration
Powers the agent runtime:
- **Agent Creation**: With tools and memory
- **Stream Handling**: For chat responses
- **Memory Persistence**: Via LibSQL
- **Tool Wrapping**: Vercel AI SDK format

## Development Practices

### Documentation-Driven Development
- Extensive `_docs/` directory with architectural decisions
- Development diary tracking implementation learnings
- API route READMEs for each endpoint
- Task planning documents for features

### Testing Strategy
- Playwright for E2E testing
- Component-level testing patterns
- Service isolation for unit testing
- Mock data for development

### Code Organization
- Page-level component co-location
- Domain-driven API structure
- Consistent file naming patterns
- Service/route separation

## Recent Development Focus

Based on diary entries and commits:

1. **Mastra Migration** (Complete)
   - Migrated from Vercel AI SDK experimental agent
   - Implemented Mastra Memory for persistence
   - Integrated working memory for user preferences

2. **Architecture Refactoring** (Complete)
   - Decomposed monolithic services
   - Implemented barrel file patterns
   - Improved service co-location

3. **Workflow Engine Evolution**
   - Runtime workflow construction
   - Schema-driven transpilation
   - Connection binding system

4. **Integration Platform Maturity**
   - NO_AUTH platform tools
   - API key connections
   - Schema caching system

## Known Challenges & Solutions

### Challenge: Composio/Mastra Version Compatibility
- **Issue**: @composio/mastra requires older Mastra version
- **Solution**: Manual tool wrapping with context filtering

### Challenge: Dynamic Workflow Loading
- **Issue**: Turbopack doesn't support dynamic imports
- **Solution**: Runtime workflow construction instead of file loading

### Challenge: Context Injection
- **Issue**: Mastra injects runtime context into tool arguments
- **Solution**: Filter Mastra-specific keys before Composio execution

## Future Vision

### Immediate Roadmap
- [ ] Workflow marketplace for sharing
- [ ] Advanced control flow (loops, conditionals)
- [ ] Real-time collaboration features
- [ ] Enhanced data visualization

### Long-term Vision
- **Ambient Workflow Discovery**: AI proactively suggests workflows based on user behavior
- **Infinite Context**: Deep understanding of user's digital environment
- **Workflow Monetization**: Marketplace for selling expertise as workflows
- **Team Collaboration**: Shared agents and workflows across organizations

## Key Insights

1. **The Power of Abstraction**: By abstracting all work into IPO steps, Agipo creates a universal language for automation

2. **Hybrid Approach Wins**: Combining third-party integrations with custom workflows provides both convenience and flexibility

3. **Memory Transforms Agents**: Persistent memory turns stateless assistants into true digital colleagues

4. **Visual Programming Works**: Node-based interfaces make complex logic accessible to non-programmers

5. **Documentation Matters**: Extensive documentation accelerates development and onboarding

## Conclusion

Agipo represents a new paradigm in workflow automation - one where AI doesn't replace human expertise but amplifies it. By providing tools that mirror how knowledge workers think, rather than forcing them into rigid automation frameworks, Agipo enables a future where every professional can leverage AI to work at 10x their current capacity.

The codebase reflects this vision through its thoughtful architecture, extensive documentation, and focus on user empowerment. It's not just a tool; it's a platform for codifying and scaling human expertise.

---

*Generated: December 2024*
*Based on comprehensive codebase analysis*