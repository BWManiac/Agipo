Browser Automation Architecture
=================================

## Core Approach: Hybrid DOM + Vision

**Confirmed Technology**: Playwright is explicitly used as the primary browser automation engine, as evidenced by:
- Agent Builder workflow diagram showing "Playwright Script" node
- Feature list stating "Playwright logic with selector-based guardrails"
- Execution dashboard showing Playwright-style action patterns

Based on their blog post ["When will browser agents do real work?"](https://asteroid.ai/blog/when-will-browser-agents-do-real-work/), Asteroid.ai uses a **hybrid approach** combining two methodologies:

### 1. DOM-Based Agents (Primary)

**How it works:**
- Operate directly on the Document Object Model (DOM)
- Reason over textual representations: element tags, attributes, ARIA roles, labels
- Use **accessibility snapshots** (popularized by Microsoft's Playwright MCP server)
- Transform live DOM into structured, readable text for language models

**Advantages:**
- **Faster**: No need to process images
- **More deterministic**: Direct DOM access is more reliable
- **Better for text-rich sites**: Forms, portals, structured content
- **Lower latency**: Text processing is faster than vision

**Example:**
```typescript
// Accessibility snapshot (Playwright pattern)
const snapshot = await page.accessibility.snapshot()
// Returns structured text representation:
// {
//   role: 'button',
//   name: 'Submit',
//   value: undefined,
//   description: 'Submit the form'
// }
```

### 2. Vision-Based Agents (Fallback)

**How it works:**
- Analyze screenshots using multimodal AI models
- Interpret visual layout and elements
- Output low-level actions like "click (210,260)"

**Advantages:**
- **Handles dynamic UIs**: Canvas-based apps, dashboards
- **Image-heavy sites**: Better for visual interfaces
- **Complex layouts**: When DOM is insufficient

**Tradeoffs:**
- **Slower**: Image processing is expensive
- **Less precise**: Pixel coordinates can be fragile
- **Requires scrolling**: Vision models need full page context

---

## Hybrid Routing Logic

Their system intelligently chooses the right approach:

1. **Default**: DOM-based actions
2. **Fallback**: Vision when DOM is insufficient
3. **Combination**: Use both for verification

This matches OpenAI's approach with the new ChatGPT Agent:
> "Under the hood, it can use either a text browser or a visual browser, choosing the most effective one per step."

---

## Accessibility Snapshots

**Key Technology**: Playwright's accessibility snapshot API

**What it does:**
- Transforms DOM into structured, readable text
- Includes ARIA roles, labels, descriptions
- More LLM-friendly than raw HTML

**Example transformation:**
```html
<!-- Raw DOM -->
<button class="btn-primary" aria-label="Submit form">
  Submit
</button>

<!-- Accessibility snapshot -->
{
  role: 'button',
  name: 'Submit form',
  value: undefined
}
```

**Why it matters:**
- Language models understand structured text better than HTML
- Reduces hallucinations from complex DOM structures
- More reliable element identification

---

## Two-Phase Execution Model

### Phase 1: Exploration
- Agent uses vision/computer-use models to discover page structure
- Records successful navigation paths
- Understands dynamic UIs and complex interactions

### Phase 2: Execution
- Compiles knowledge into deterministic scripts
- Uses Playwright/Selenium/CDP commands
- Repeats process with high reliability

**Self-Optimization:**
- Agents generate and improve their own scripts
- Learn from experience
- Build reusable workflows

---

## Graph-Based Workflow Architecture

**Visual Builder**: Astro
- Non-technical users can create agents
- Graph-based approach (nodes and edges)
- Each node represents a specific action or decision point

**Benefits:**
- Enhanced reliability and observability
- Modular design allows precise control
- Easy to debug and iterate

**Node Types (Inferred):**
- Navigation nodes
- Form interaction nodes
- Decision/conditional nodes
- Data extraction nodes
- API call nodes

---

## Comparison: Vision vs DOM

| Aspect | Vision-Based | DOM-Based |
|--------|--------------|-----------|
| **Speed** | Slower (image processing) | Faster (text processing) |
| **Precision** | Pixel coordinates (fragile) | Element selectors (reliable) |
| **Best For** | Canvas apps, dashboards | Forms, text-heavy sites |
| **Determinism** | Lower (visual interpretation) | Higher (direct DOM access) |
| **Scalability** | Higher compute cost | Lower compute cost |

**Asteroid's Solution**: Use DOM by default, fallback to vision when needed.

---

## Key Insights

1. **Not Bespoke**: They use standard browser automation engines (Playwright/Selenium/CDP)
2. **Intelligence Layer**: Their innovation is the AI reasoning and routing
3. **Hybrid is Future**: Both approaches have strengths; combining them is optimal
4. **Accessibility Snapshots**: Critical for making DOM LLM-friendly
5. **Learning Loop**: Agents improve by generating and refining their own scripts

---

## Implementation Implications

For building similar capabilities:

1. **Start with Playwright**: Most mature API, best accessibility support
2. **Add Vision Fallback**: For complex/dynamic UIs
3. **Use Accessibility Snapshots**: Transform DOM for LLM consumption
4. **Build Routing Logic**: Decide when to use DOM vs vision
5. **Enable Self-Optimization**: Let agents generate scripts from experience

