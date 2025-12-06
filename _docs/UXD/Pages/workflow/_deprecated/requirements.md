## Workflow Builder Requirements (IPO Contracts)

### Objective
- Establish a node-based workflow authoring experience where every node declares explicit input and output contracts (IPO) and edges only connect when contracts are compatible.

### User Roles & Goals
- **Builders:** Compose workflows by dragging nodes, previewing contracts, and trusting that only valid connections are allowed.
- **Reviewers:** Inspect existing flows to understand data movement, required inputs, and produced outputs without reading raw code.
- **Agents:** (Future) Publish reusable nodes with clear contract metadata so others can adopt them safely.

### Node Contract Model
- Each node exposes:
  - **Identifier & version** (e.g., `cowsay@1.0.0`).
  - **Human-readable description** of its purpose.
  - **Input contract**: structured schema (primitive, object, array) plus nullability; may include multiple named inputs.
  - **Output contract**: structured schema for successful completion plus optional error contract.
  - **Runtime requirements**: npm packages, environment flags, or external services.
- Contracts should map cleanly to TypeScript-like definitions (e.g., `type In = { message: string }`).
- Nodes may offer **adapters** for alternate input shapes (e.g., string → `{ message: string }`). Adapters must be explicit and reusable.

### Connection Semantics
- UI only permits connections when `source.output` satisfies `target.input` via:
  - Direct type equality.
  - Registered adapter that converts source output to target input.
- When incompatible, display tooltip explaining mismatch and suggest adapters.
- Connection metadata stores the resolved adapter (if any) to support execution and auditing.

### UX Requirements
- **Node Card Layout:** Header (name, version, tags), contract badges (input/output types), expandable sections showing schema details, CTA to edit code/config.
- **Connection Flow:** Dragging from an output socket highlights compatible input sockets; incompatible ones are dimmed.
- **Inspector Panel:** Selecting a node shows full contract, adapter options, runtime dependencies, and example payloads.
- **Validation Feedback:** Real-time warnings for missing required inputs, unsatisfied outputs, or circular dependencies.

### Execution Layer Implications
- Orchestrator must pass structured data, not raw stdout pipes:
  - Serialize outputs to JSON and store in orchestrator state keyed by node ID.
  - Before invoking downstream node, apply adapter (if any) and inject as arguments.
- Maintain streaming option for nodes flagged as `streaming=true` (back-compat with current pipe model) while introducing new `contracted` mode.
- Preserve `/tmp` working directory, npm install workflow, and teardown semantics from current WebContainer implementation.

### Extensibility & Safety
- Contracts should be versioned; breaking changes require new node version.
- Support unit-test stubs per node to validate contract compliance.
- Provide audit log of data shapes moving across edges for compliance review.

### Open Questions
- How to represent optional fan-out/fan-in nodes (e.g., splitters, mergers) within contract system?
- What adapter authoring experience do we provide (code vs. visual mapping)?
- Do we enforce runtime type checking or rely on compile-time validation only?

