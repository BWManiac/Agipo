# Feature: Recording as Teaching (Agent Learning from Demonstration)

**Status:** Vision / Future  
**Date:** December 6, 2025  
**Owner:** Product  
**Dependencies:** `06-Tools-vs-Workflows`, Browser Automation Infrastructure

---

## 1. Executive Summary

**Recording as Teaching** is a paradigm shift in how users create agent capabilities. Instead of writing code or configuring tools, users **demonstrate** tasks by doing them—and the agent learns to replicate those actions.

> "Show, don't tell" — The most intuitive way to teach is by example.

This feature addresses a critical gap: many valuable tasks happen on **internal tools** that lack APIs. Employees navigate custom dashboards, legacy systems, and SaaS tools daily. Recording captures this tribal knowledge and transforms it into executable automation.

### The Vision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER DEMONSTRATES                                │
│                                                                         │
│  "Let me show you how I process an expense report..."                   │
│                                                                         │
│  [User navigates to internal tool]                                      │
│  [User clicks, fills forms, downloads files]                            │
│  [System records every action]                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM LEARNS                                    │
│                                                                         │
│  Recipe: "Process Expense Report"                                       │
│  1. Navigate to expenses.internal.com                                   │
│  2. Click "New Report" button                                           │
│  3. Fill "Amount" field with {input.amount}                             │
│  4. Upload file from {input.receipt_path}                               │
│  5. Click "Submit"                                                      │
│  6. Extract confirmation number → {output.confirmation}                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENT EXECUTES                                   │
│                                                                         │
│  User: "Submit my expense report for $150, receipt attached"            │
│  Agent: [Replays recipe with new inputs]                                │
│  Agent: "Done! Confirmation #EXP-2024-1234"                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why This Matters

### 2.1 The Internal Tools Problem

Most enterprise value lives in systems that:
- Have no public API
- Require authentication
- Change frequently (UI updates)
- Are unique to each organization

**Traditional automation fails here.** RPA tools are brittle. Custom integrations are expensive. Recording bridges this gap.

### 2.2 Tribal Knowledge Capture

Every organization has employees who "just know" how to do things:
- "Sarah knows how to generate that report"
- "Ask Mike—he's the only one who can update the inventory system"

Recording captures this knowledge and makes it transferable to agents.

### 2.3 The Learning Curve

| Approach | Learning Curve | Flexibility | Maintenance |
|----------|---------------|-------------|-------------|
| Write Code | High | High | Manual updates |
| Configure Tools | Medium | Medium | Moderate |
| **Record Actions** | **Low** | High | Re-record when UI changes |

---

## 3. Recording Modalities

### 3.1 Browser Recording (Primary)

User performs task in a browser, system captures actions.

| Capability | Description |
|------------|-------------|
| **Navigation** | URL changes, page loads |
| **Clicks** | Button clicks, link clicks, element selection |
| **Inputs** | Form fills, text entry, file uploads |
| **Extractions** | What data the user copies, views, or highlights |
| **Waits** | Pauses for page loads, dynamic content |

**Technical Approach:**
- Browser extension or embedded browser (Browserbase)
- Capture DOM events + network requests
- Generate selector strategies (CSS, XPath, AI-powered)

### 3.2 Desktop Recording (Future)

User records screen, system extracts actions via computer vision.

| Capability | Description |
|------------|-------------|
| **Screen Capture** | Video of user's screen |
| **Action Detection** | AI identifies clicks, typing, navigation |
| **OCR** | Extract text from screen |
| **Application Detection** | Identify which app is in use |

**Technical Approach:**
- Screen recording (native or third-party)
- Computer vision models (click detection, OCR)
- Action sequence extraction

### 3.3 Video Upload (Future)

User uploads a video of themselves doing the task.

| Capability | Description |
|------------|-------------|
| **Video Analysis** | Process uploaded video |
| **Step Extraction** | Break video into discrete actions |
| **Narration Support** | Use audio to understand intent |

**Technical Approach:**
- Video processing pipeline
- Multi-modal AI (vision + audio)
- Step-by-step breakdown generation

---

## 4. Recipe Format

A **Recipe** is the stored representation of a recorded task.

### 4.1 Recipe Schema

```typescript
interface Recipe {
  id: string;
  name: string;
  description: string;
  
  // Input parameters (placeholders in the recipe)
  inputSchema: z.ZodSchema;
  
  // Output extractions
  outputSchema: z.ZodSchema;
  
  // The recorded steps
  steps: RecipeStep[];
  
  // Metadata
  recordedAt: Date;
  recordedBy: string;
  sourceUrl?: string;
  
  // Replay settings
  settings: {
    timeout: number;
    retryOnFailure: boolean;
    headless: boolean;
  };
}

interface RecipeStep {
  id: string;
  type: "navigate" | "click" | "fill" | "extract" | "wait" | "upload" | "scroll";
  
  // Target element (multiple strategies for resilience)
  target?: {
    selectors: {
      css?: string;
      xpath?: string;
      text?: string;           // "Click the button that says 'Submit'"
      aiDescription?: string;  // "The blue submit button in the form"
    };
    screenshot?: string;       // Visual reference
  };
  
  // Action-specific data
  data?: {
    url?: string;              // For navigate
    value?: string | Variable; // For fill (can be placeholder)
    extractAs?: string;        // For extract (output field name)
    duration?: number;         // For wait
    filePath?: Variable;       // For upload
  };
  
  // Human-readable description
  description: string;
}

// Variable reference to input/output
interface Variable {
  type: "input" | "extracted";
  path: string;  // e.g., "amount" or "confirmation_number"
}
```

### 4.2 Example Recipe

```json
{
  "id": "submit-expense-report",
  "name": "Submit Expense Report",
  "description": "Submit an expense report to the internal system",
  
  "inputSchema": {
    "amount": "number",
    "description": "string",
    "receipt": "file"
  },
  
  "outputSchema": {
    "confirmationNumber": "string",
    "submittedAt": "date"
  },
  
  "steps": [
    {
      "id": "step-1",
      "type": "navigate",
      "data": { "url": "https://expenses.internal.com" },
      "description": "Go to expense portal"
    },
    {
      "id": "step-2",
      "type": "click",
      "target": {
        "selectors": {
          "css": "button.new-report",
          "text": "New Report",
          "aiDescription": "The 'New Report' button in the top right"
        }
      },
      "description": "Click 'New Report' button"
    },
    {
      "id": "step-3",
      "type": "fill",
      "target": {
        "selectors": {
          "css": "input[name='amount']",
          "aiDescription": "The amount input field"
        }
      },
      "data": { "value": { "type": "input", "path": "amount" } },
      "description": "Enter the expense amount"
    },
    {
      "id": "step-4",
      "type": "upload",
      "target": {
        "selectors": {
          "css": "input[type='file']",
          "aiDescription": "The receipt upload button"
        }
      },
      "data": { "filePath": { "type": "input", "path": "receipt" } },
      "description": "Upload receipt"
    },
    {
      "id": "step-5",
      "type": "click",
      "target": {
        "selectors": {
          "css": "button[type='submit']",
          "text": "Submit",
          "aiDescription": "The submit button at the bottom of the form"
        }
      },
      "description": "Submit the report"
    },
    {
      "id": "step-6",
      "type": "extract",
      "target": {
        "selectors": {
          "css": ".confirmation-number",
          "aiDescription": "The confirmation number displayed after submission"
        }
      },
      "data": { "extractAs": "confirmationNumber" },
      "description": "Extract confirmation number"
    }
  ]
}
```

---

## 5. Recording UX

### 5.1 Browser Recording Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Start Recording                                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [🔴 Start Recording]  [Cancel]                                 │   │
│  │                                                                 │   │
│  │  "I'll open a browser window. Show me how you do this task."   │   │
│  │                                                                 │   │
│  │  Task name: [Submit Expense Report_______________]              │   │
│  │  Description: [Submit expense reports to internal__]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Perform Actions                                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Browser Window - Recording...]                 [⏹ Stop] [⏸]  │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                                                         │   │   │
│  │  │    [Internal Expense Portal]                            │   │   │
│  │  │                                                         │   │   │
│  │  │    Amount: [___150___]  ← Detected input                │   │   │
│  │  │                                                         │   │   │
│  │  │    [Submit] ← Click detected                            │   │   │
│  │  │                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  Recorded Steps:                                               │   │
│  │  ✓ Navigate to expenses.internal.com                          │   │
│  │  ✓ Click "New Report"                                         │   │
│  │  ✓ Fill amount: "150"                                         │   │
│  │  • Waiting...                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Define Variables                                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  "Which values should be dynamic inputs?"                       │   │
│  │                                                                 │   │
│  │  Step 3: Fill amount: "150"                                    │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  ○ Keep as fixed value: "150"                           │   │   │
│  │  │  ● Make this an input variable                          │   │   │
│  │  │    Name: [amount_______]  Type: [number ▼]              │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  Step 6: Extract ".confirmation-number"                        │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  ● Save as output variable                              │   │   │
│  │  │    Name: [confirmationNumber]                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  │  [Save Recipe]                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Recipe Review & Edit

After recording, users can review and edit the recipe:

- **Rename steps** for clarity
- **Adjust selectors** if multiple options detected
- **Add wait steps** if timing issues occur
- **Mark variables** they missed during recording
- **Test replay** with sample inputs

---

## 6. Replay Engine

### 6.1 Execution Flow

```typescript
async function executeRecipe(recipe: Recipe, inputs: Record<string, any>) {
  const browser = await browserbase.connect();
  const page = await browser.newPage();
  
  const extracted: Record<string, any> = {};
  
  for (const step of recipe.steps) {
    try {
      await executeStep(page, step, inputs, extracted);
    } catch (error) {
      if (recipe.settings.retryOnFailure) {
        // Try alternative selectors
        await retryWithAlternatives(page, step, inputs, extracted);
      } else {
        throw error;
      }
    }
  }
  
  await browser.close();
  return extracted;
}

async function executeStep(
  page: Page, 
  step: RecipeStep, 
  inputs: Record<string, any>,
  extracted: Record<string, any>
) {
  switch (step.type) {
    case "navigate":
      await page.goto(step.data.url);
      break;
      
    case "click":
      const clickTarget = await findElement(page, step.target);
      await clickTarget.click();
      break;
      
    case "fill":
      const fillTarget = await findElement(page, step.target);
      const value = resolveVariable(step.data.value, inputs, extracted);
      await fillTarget.fill(value);
      break;
      
    case "extract":
      const extractTarget = await findElement(page, step.target);
      const text = await extractTarget.textContent();
      extracted[step.data.extractAs] = text;
      break;
      
    // ... other step types
  }
}
```

### 6.2 Resilient Element Finding

Selectors can break when UIs change. We use multiple strategies:

```typescript
async function findElement(page: Page, target: RecipeTarget): Promise<Element> {
  // Strategy 1: Try CSS selector
  if (target.selectors.css) {
    const el = await page.$(target.selectors.css);
    if (el) return el;
  }
  
  // Strategy 2: Try XPath
  if (target.selectors.xpath) {
    const el = await page.$x(target.selectors.xpath);
    if (el.length) return el[0];
  }
  
  // Strategy 3: Try text content
  if (target.selectors.text) {
    const el = await page.getByText(target.selectors.text);
    if (el) return el;
  }
  
  // Strategy 4: Use AI to find element by description
  if (target.selectors.aiDescription) {
    const el = await stagehand.observe({ 
      instruction: target.selectors.aiDescription 
    });
    if (el) return el;
  }
  
  // Strategy 5: Visual matching with screenshot
  if (target.screenshot) {
    const el = await visualMatch(page, target.screenshot);
    if (el) return el;
  }
  
  throw new Error(`Could not find element: ${JSON.stringify(target)}`);
}
```

---

## 7. Integration with Agipo

### 7.1 Recipes as Tools

Once saved, a Recipe becomes a **Tool** that agents can call:

```typescript
// Generated tool from recipe
const submitExpenseReportTool = tool({
  name: "submit_expense_report",
  description: "Submit an expense report to the internal system",
  parameters: z.object({
    amount: z.number(),
    description: z.string(),
    receipt: z.string(), // file path
  }),
  execute: async (inputs) => {
    return await executeRecipe(submitExpenseRecipe, inputs);
  },
});
```

### 7.2 Recipes in Workflows

Recipes can be composed into larger workflows:

```
Workflow: Monthly Expense Processing
├── Tool: get_pending_expenses (from Records)
├── Recipe: submit_expense_report (recorded)
├── Tool: send_confirmation_email (Composio)
└── Tool: update_expense_status (from Records)
```

### 7.3 Agent Assignment

Recipes are assigned to agents like any other capability:

```typescript
const financeAgent: AgentConfig = {
  // ...
  capabilities: {
    toolIds: ["calculate_tax"],
    workflowIds: ["monthly_close"],
    recipeIds: ["submit_expense_report", "generate_invoice"],
  },
};
```

---

## 8. Technical Considerations

### 8.1 Authentication Handling

Recorded recipes often involve authenticated sessions:

| Approach | Description | Trade-offs |
|----------|-------------|------------|
| **Session Persistence** | Store cookies/tokens | Security risk, expiration |
| **Re-authentication** | Recipe includes login steps | Slower, more fragile |
| **SSO Integration** | Use org's SSO | Complex setup, most secure |

**Recommendation:** Start with re-authentication (include login steps), evolve to session management.

### 8.2 Headless vs Visible Execution

| Mode | Use Case | Performance |
|------|----------|-------------|
| **Headless** | Production execution | Fast, scalable |
| **Visible** | Debugging, demo | Slower, visual feedback |

Users should be able to toggle between modes.

### 8.3 Error Recovery

| Error Type | Recovery Strategy |
|------------|-------------------|
| Element not found | Try alternative selectors, AI fallback |
| Timeout | Increase wait, retry |
| Authentication failure | Re-authenticate, notify user |
| Unexpected page state | Take screenshot, pause for human |

---

## 9. Privacy & Security

### 9.1 Data Captured During Recording

| Data Type | Captured? | Storage |
|-----------|-----------|---------|
| URLs visited | Yes | Recipe |
| Elements clicked | Yes | Recipe (selectors) |
| Text entered | Yes (as variables or fixed) | Recipe |
| Passwords | **No** - masked during recording | Never stored |
| Screenshots | Optional | Encrypted |
| Cookies/tokens | **No** | Never stored |

### 9.2 Execution Isolation

- Recipes execute in isolated browser contexts
- No access to user's local browser
- Credentials passed at runtime, not stored in recipe

---

## 10. Phased Implementation

### Phase 1: Basic Browser Recording (MVP)
- [ ] Recording UI (start/stop)
- [ ] Step capture (navigate, click, fill)
- [ ] Recipe storage
- [ ] Basic replay engine
- [ ] CSS selector strategy

### Phase 2: Enhanced Resilience
- [ ] Multiple selector strategies
- [ ] AI-powered element finding (Stagehand)
- [ ] Visual matching
- [ ] Error recovery

### Phase 3: Variable System
- [ ] Input variable detection
- [ ] Output extraction
- [ ] Variable editor UI
- [ ] Type inference

### Phase 4: Desktop Recording
- [ ] Screen capture
- [ ] Action detection (computer vision)
- [ ] Cross-application support

### Phase 5: Video Upload
- [ ] Video processing pipeline
- [ ] Step extraction from video
- [ ] Narration support

---

## 11. Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Recording success rate | > 95% | Users complete recording without errors |
| Replay success rate | > 90% | Recipes execute successfully |
| Time to first recipe | < 10 min | Low barrier to entry |
| Recipe reuse | > 70% | Recipes called by agents regularly |
| UI change resilience | > 80% | Recipes survive minor UI updates |

---

## 12. Competitive Landscape

| Product | Approach | Strengths | Weaknesses |
|---------|----------|-----------|------------|
| **UiPath** | Traditional RPA | Enterprise features | Complex, expensive |
| **Zapier** | API connectors | Easy setup | No browser automation |
| **Bardeen** | Browser extension | Consumer-friendly | Limited enterprise |
| **Agipo (This)** | AI-native recording | Agent integration, AI resilience | New, unproven |

Our differentiator: **Recipes become first-class agent capabilities**, not standalone automations.

---

## 13. Open Questions

1. **Should recording be a browser extension or embedded browser?**
   - Extension: User's real browser, real auth
   - Embedded: More control, no extension install

2. **How to handle CAPTCHAs during replay?**
   - Human-in-the-loop pause?
   - CAPTCHA solving service?

3. **How to version recipes when UIs change?**
   - Auto-detect changes?
   - Prompt re-recording?

4. **Multi-step recipes with branches?**
   - Allow conditional logic in recipes?
   - Or keep recipes linear, use workflows for branching?

---

## 14. References

- [Browserbase Documentation](https://docs.browserbase.com/)
- [Stagehand - AI Browser Automation](https://github.com/browserbase/stagehand)
- Internal: `06-Tools-vs-Workflows.md`
- Task: `_docs/_tasks/10-platform-evolution.md`

