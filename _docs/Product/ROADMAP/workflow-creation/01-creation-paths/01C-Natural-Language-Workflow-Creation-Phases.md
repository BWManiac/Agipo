# Phases: Natural Language Workflow Creation

**Task:** `01A-Natural-Language-Workflow-Creation-Task.md`  
**Status:** Not Started  
**Last Updated:** 2025-12-11

---

## Phase 1: Backend Generation System

### Goal
Build the AI-powered workflow generation engine that transforms natural language descriptions into complete workflow definitions.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/api/workflows/types/generation.ts` | ~80 | Create generation types and interfaces |
| `app/api/workflows/services/workflow-generator.ts` | ~300 | Core LLM-powered generation logic |
| `app/api/workflows/services/schema-inference.ts` | ~150 | Schema generation from step descriptions |
| `app/api/workflows/services/layout-calculator.ts` | ~100 | Auto-layout algorithm for generated nodes |
| `app/api/workflows/services/generation-prompts.ts` | ~200 | LLM prompts and structured output schemas |
| `app/api/workflows/generate/route.ts` | ~120 | Generation API endpoint |
| `app/api/workflows/generate/refine/route.ts` | ~100 | Conversational refinement endpoint |

### Implementation

#### 1. Create generation type system

```typescript
// app/api/workflows/types/generation.ts
import { z } from 'zod';
import { WorkflowDefinition } from './workflow';

export const GenerationRequestSchema = z.object({
  description: z.string().min(10).max(2000),
  workflowId: z.string().optional(),
  selectedNodeId: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string()
  })).optional(),
  userContext: z.object({
    connectedIntegrations: z.array(z.string()),
    availableTables: z.array(z.string()),
    userId: z.string()
  })
});

export const GenerationResponseSchema = z.object({
  workflow: WorkflowDefinitionSchema,
  explanation: z.string(),
  suggestedName: z.string(),
  warnings: z.array(z.string()).optional(),
  changes: z.array(z.object({
    type: z.enum(['added', 'modified', 'removed']),
    nodeId: z.string(),
    description: z.string()
  })).optional()
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;
```

#### 2. Build workflow generation service

```typescript
// app/api/workflows/services/workflow-generator.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { GenerationRequest, GenerationResponse } from '../types/generation';
import { getComposioClient } from '@/lib/composio';
import { generatePrompts } from './generation-prompts';
import { inferStepSchemas } from './schema-inference';
import { calculateLayout } from './layout-calculator';

export class WorkflowGenerator {
  async generateWorkflow(request: GenerationRequest): Promise<GenerationResponse> {
    // 1. Build context for LLM
    const context = await this.buildContext(request);
    
    // 2. Generate initial workflow structure
    const structuredOutput = await this.callLLM(request, context);
    
    // 3. Post-process and validate
    const workflow = await this.postProcessWorkflow(structuredOutput, context);
    
    // 4. Generate explanation and metadata
    const response = await this.buildResponse(workflow, request, structuredOutput);
    
    return response;
  }
  
  private async buildContext(request: GenerationRequest) {
    // Fetch user's available tools
    const composioClient = getComposioClient();
    const connectedApps = request.userContext.connectedIntegrations;
    
    const availableTools = await Promise.all(
      connectedApps.map(async (app) => {
        const tools = await composioClient.tools.list({ 
          appNames: [app],
          limit: 50 
        });
        return tools.data.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          app: app
        }));
      })
    );
    
    // Fetch user's data tables
    const tables = await this.getUserTables(request.userContext.userId);
    
    return {
      availableTools: availableTools.flat(),
      availableTables: tables,
      conversationHistory: request.conversationHistory || []
    };
  }
  
  private async callLLM(request: GenerationRequest, context: any) {
    const { systemPrompt, userPrompt } = generatePrompts(request, context);
    
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        workflowName: z.string(),
        description: z.string(),
        steps: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['composio', 'llm', 'browser', 'data', 'custom']),
          description: z.string(),
          tool: z.string().optional(),
          prompt: z.string().optional(),
          parameters: z.record(z.any()).optional(),
          expectedOutput: z.string()
        })),
        connections: z.array(z.object({
          from: z.string(),
          to: z.string(),
          field: z.string().optional()
        })),
        controlFlow: z.object({
          type: z.enum(['sequential', 'parallel', 'conditional']),
          branches: z.array(z.object({
            condition: z.string().optional(),
            steps: z.array(z.string())
          })).optional()
        })
      }),
      temperature: 0.7,
      maxTokens: 4000
    });
    
    return result.object;
  }
  
  private async postProcessWorkflow(llmOutput: any, context: any) {
    // 1. Generate JSON schemas for each step
    const stepsWithSchemas = await Promise.all(
      llmOutput.steps.map(async (step) => ({
        ...step,
        inputSchema: await inferStepSchemas(step, context, 'input'),
        outputSchema: await inferStepSchemas(step, context, 'output')
      }))
    );
    
    // 2. Calculate node positions
    const positions = calculateLayout(stepsWithSchemas, llmOutput.controlFlow);
    
    // 3. Build complete workflow definition
    const workflow = {
      id: crypto.randomUUID(),
      name: llmOutput.workflowName,
      description: llmOutput.description,
      steps: stepsWithSchemas.map((step, index) => ({
        ...step,
        position: positions[index]
      })),
      bindings: this.generateBindings(llmOutput.connections, stepsWithSchemas),
      metadata: {
        generated: true,
        generatedAt: new Date().toISOString(),
        llmModel: 'claude-3-5-sonnet-20241022'
      }
    };
    
    // 4. Validate workflow
    await this.validateWorkflow(workflow, context);
    
    return workflow;
  }
  
  private generateBindings(connections: any[], steps: any[]) {
    return connections.map(conn => ({
      id: crypto.randomUUID(),
      from: {
        stepId: conn.from,
        field: conn.field || 'output'
      },
      to: {
        stepId: conn.to,
        field: 'input'
      }
    }));
  }
  
  private async validateWorkflow(workflow: any, context: any) {
    // Validate all referenced tools exist
    const toolSteps = workflow.steps.filter(s => s.type === 'composio');
    for (const step of toolSteps) {
      const toolExists = context.availableTools.some(t => t.name === step.tool);
      if (!toolExists) {
        throw new Error(`Tool '${step.tool}' not available. Connect the required integration first.`);
      }
    }
    
    // Validate schema compatibility between connected steps
    workflow.bindings.forEach(binding => {
      const fromStep = workflow.steps.find(s => s.id === binding.from.stepId);
      const toStep = workflow.steps.find(s => s.id === binding.to.stepId);
      
      // Check output schema of 'from' step is compatible with input schema of 'to' step
      this.validateSchemaCompatibility(fromStep.outputSchema, toStep.inputSchema, binding);
    });
  }
}
```

#### 3. Create schema inference service

```typescript
// app/api/workflows/services/schema-inference.ts
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';

export async function inferStepSchemas(
  step: any, 
  context: any, 
  direction: 'input' | 'output'
): Promise<z.ZodSchema> {
  // For composio tools, use existing schema
  if (step.type === 'composio') {
    const tool = context.availableTools.find(t => t.name === step.tool);
    return direction === 'input' 
      ? tool?.parameters || z.object({})
      : z.object({ result: z.any() });
  }
  
  // For other step types, infer from description
  const schemaPrompt = `
    Generate a JSON schema for the ${direction} of this workflow step:
    
    Step: ${step.name}
    Description: ${step.description}
    Expected Output: ${step.expectedOutput}
    
    Return a valid JSON Schema object that describes the expected ${direction} structure.
  `;
  
  const result = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt: schemaPrompt,
    schema: z.object({
      type: z.literal('object'),
      properties: z.record(z.object({
        type: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional()
      })),
      required: z.array(z.string()).optional()
    }),
    temperature: 0.3
  });
  
  // Convert to Zod schema
  return convertJsonSchemaToZod(result.object);
}

function convertJsonSchemaToZod(jsonSchema: any): z.ZodSchema {
  const properties: Record<string, z.ZodSchema> = {};
  
  Object.entries(jsonSchema.properties).forEach(([key, prop]: [string, any]) => {
    switch (prop.type) {
      case 'string':
        properties[key] = z.string();
        break;
      case 'number':
        properties[key] = z.number();
        break;
      case 'boolean':
        properties[key] = z.boolean();
        break;
      case 'array':
        properties[key] = z.array(z.any());
        break;
      default:
        properties[key] = z.any();
    }
    
    if (!prop.required) {
      properties[key] = properties[key].optional();
    }
  });
  
  return z.object(properties);
}
```

#### 4. Create layout calculator

```typescript
// app/api/workflows/services/layout-calculator.ts
interface NodePosition {
  x: number;
  y: number;
}

interface Step {
  id: string;
  name: string;
}

interface ControlFlow {
  type: 'sequential' | 'parallel' | 'conditional';
  branches?: Array<{
    condition?: string;
    steps: string[];
  }>;
}

export function calculateLayout(steps: Step[], controlFlow: ControlFlow): NodePosition[] {
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 150;
  
  const positions: Record<string, NodePosition> = {};
  
  switch (controlFlow.type) {
    case 'sequential':
      steps.forEach((step, index) => {
        positions[step.id] = {
          x: 100,
          y: 100 + (index * VERTICAL_SPACING)
        };
      });
      break;
      
    case 'parallel':
      const branchWidth = steps.length * HORIZONTAL_SPACING;
      steps.forEach((step, index) => {
        positions[step.id] = {
          x: 100 + (index * HORIZONTAL_SPACING) - (branchWidth / 2),
          y: 100
        };
      });
      break;
      
    case 'conditional':
      // Main branch on left, alternative on right
      let currentY = 100;
      let currentX = 100;
      
      controlFlow.branches?.forEach((branch, branchIndex) => {
        branch.steps.forEach((stepId, stepIndex) => {
          positions[stepId] = {
            x: currentX + (branchIndex * HORIZONTAL_SPACING),
            y: currentY + (stepIndex * VERTICAL_SPACING)
          };
        });
      });
      break;
  }
  
  // Return positions in step order
  return steps.map(step => positions[step.id]);
}
```

#### 5. Create generation endpoint

```typescript
// app/api/workflows/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WorkflowGenerator } from '../services/workflow-generator';
import { GenerationRequestSchema } from '../types/generation';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedRequest = GenerationRequestSchema.parse({
      ...body,
      userContext: {
        ...body.userContext,
        userId
      }
    });
    
    const generator = new WorkflowGenerator();
    const response = await generator.generateWorkflow(validatedRequest);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Workflow generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Testing

```bash
# Test generation service
npm run test -- --grep "workflow-generator"

# Test schema inference
npm run test -- --grep "schema-inference"

# Test layout calculator
npm run test -- --grep "layout-calculator"

# Test API endpoint
curl -X POST http://localhost:3000/api/workflows/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "Send email when new file uploaded", "userContext": {"connectedIntegrations": ["gmail"], "availableTables": []}}'
```

### Success Metrics

- [ ] Simple workflow descriptions generate valid workflow.json
- [ ] Generated workflows pass step-generator transpilation
- [ ] All referenced Composio tools are validated as available
- [ ] Generated schemas are valid JSON Schema format
- [ ] Node positions don't overlap in generated layouts
- [ ] API handles errors gracefully with helpful messages
- [ ] Complex workflows (5+ steps) generate successfully
- [ ] Schema compatibility validation catches incompatible connections

---

## Phase 2: Frontend Generation UI

### Goal
Build the natural language input interface and generation progress UI integrated into the workflow editor.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workflows/editor/store/slices/generation-slice.ts` | ~100 | Create generation state slice |
| `app/(pages)/workflows/editor/store/index.ts` | ~10 | Export generation slice |
| `app/(pages)/workflows/editor/components/GenerationInput.tsx` | ~150 | Natural language input component |
| `app/(pages)/workflows/editor/components/GenerationProgress.tsx` | ~80 | Progress indicator component |
| `app/(pages)/workflows/editor/components/GenerationModeToggle.tsx` | ~60 | Toggle between manual and generated mode |
| `app/(pages)/workflows/editor/index.tsx` | ~50 | Integrate generation UI |

### Implementation

#### 1. Create generation state slice

```typescript
// app/(pages)/workflows/editor/store/slices/generation-slice.ts
import { StateCreator } from 'zustand';
import { GenerationRequest, GenerationResponse } from '@/app/api/workflows/types/generation';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GenerationState {
  isGenerating: boolean;
  generationStage: 'idle' | 'understanding' | 'decomposing' | 'generating' | 'complete' | 'error';
  conversationHistory: Message[];
  lastError: string | null;
  lastGeneration: GenerationResponse | null;
  generationMode: boolean; // true = generation mode, false = manual mode
}

export interface GenerationSlice {
  generation: GenerationState;
  startGeneration: (description: string) => Promise<void>;
  updateStage: (stage: GenerationState['generationStage']) => void;
  generationComplete: (response: GenerationResponse) => void;
  generationFailed: (error: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearConversation: () => void;
  toggleGenerationMode: () => void;
  retryGeneration: () => Promise<void>;
}

export const createGenerationSlice: StateCreator<
  GenerationSlice,
  [],
  [],
  GenerationSlice
> = (set, get) => ({
  generation: {
    isGenerating: false,
    generationStage: 'idle',
    conversationHistory: [],
    lastError: null,
    lastGeneration: null,
    generationMode: false,
  },
  
  startGeneration: async (description: string) => {
    const { generation } = get();
    
    // Add user message to conversation
    get().addMessage({ role: 'user', content: description });
    
    set((state) => ({
      generation: {
        ...state.generation,
        isGenerating: true,
        generationStage: 'understanding',
        lastError: null
      }
    }));
    
    try {
      // Simulate stages for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      get().updateStage('decomposing');
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      get().updateStage('generating');
      
      // Call generation API
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          conversationHistory: generation.conversationHistory,
          userContext: {
            connectedIntegrations: [], // TODO: Get from user state
            availableTables: [] // TODO: Get from records
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }
      
      const result: GenerationResponse = await response.json();
      get().generationComplete(result);
      
    } catch (error) {
      get().generationFailed(error instanceof Error ? error.message : 'Unknown error');
    }
  },
  
  updateStage: (stage) => set((state) => ({
    generation: { ...state.generation, generationStage: stage }
  })),
  
  generationComplete: (response) => {
    // Add assistant response to conversation
    get().addMessage({ 
      role: 'assistant', 
      content: response.explanation 
    });
    
    set((state) => ({
      generation: {
        ...state.generation,
        isGenerating: false,
        generationStage: 'complete',
        lastGeneration: response
      }
    }));
    
    // Update workflow in editor (integrate with workflow slice)
    // TODO: Call workflow slice action to update workflow
  },
  
  generationFailed: (error) => {
    get().addMessage({ 
      role: 'assistant', 
      content: `I encountered an error: ${error}. Please try again with a different description.` 
    });
    
    set((state) => ({
      generation: {
        ...state.generation,
        isGenerating: false,
        generationStage: 'error',
        lastError: error
      }
    }));
  },
  
  addMessage: (message) => set((state) => ({
    generation: {
      ...state.generation,
      conversationHistory: [
        ...state.generation.conversationHistory,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      ]
    }
  })),
  
  clearConversation: () => set((state) => ({
    generation: {
      ...state.generation,
      conversationHistory: [],
      generationStage: 'idle',
      lastError: null
    }
  })),
  
  toggleGenerationMode: () => set((state) => ({
    generation: {
      ...state.generation,
      generationMode: !state.generation.generationMode
    }
  })),
  
  retryGeneration: async () => {
    const { generation } = get();
    const lastUserMessage = generation.conversationHistory
      .filter(m => m.role === 'user')
      .pop();
      
    if (lastUserMessage) {
      await get().startGeneration(lastUserMessage.content);
    }
  }
});
```

#### 2. Create generation input component

```tsx
// app/(pages)/workflows/editor/components/GenerationInput.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Send } from 'lucide-react';
import { useStore } from '../store';

const EXAMPLE_PROMPTS = [
  "Send a weekly report email every Friday",
  "Extract data from CSV and save to database",
  "Monitor competitor prices and send alerts",
  "Process job applications and schedule interviews",
  "Backup files to cloud storage daily"
];

export function GenerationInput() {
  const [description, setDescription] = useState('');
  const { 
    generation, 
    startGeneration, 
    toggleGenerationMode 
  } = useStore();
  
  const { isGenerating, generationMode } = generation;
  
  const handleSubmit = async () => {
    if (!description.trim() || isGenerating) return;
    
    await startGeneration(description);
    setDescription('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  if (!generationMode) {
    return (
      <div className="p-4 border-b border-border bg-muted/30">
        <Button
          variant="outline"
          onClick={toggleGenerationMode}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Generate with AI
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="mx-4 mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Describe Your Workflow
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleGenerationMode}
            >
              Manual Mode
            </Button>
          </div>
          
          <div className="space-y-3">
            <Textarea
              placeholder="Describe what you want to automate... (e.g., 'Send an email when a new file is uploaded to Google Drive')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              rows={3}
              className="resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Press ⌘+Enter to generate
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!description.trim() || isGenerating}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="h-3 w-3" />
                Generate
              </Button>
            </div>
          </div>
          
          {/* Example prompts */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Try these examples:</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setDescription(prompt)}
                >
                  {prompt}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Create generation progress component

```tsx
// app/(pages)/workflows/editor/components/GenerationProgress.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Brain, Cog, Wand2 } from 'lucide-react';
import { useStore } from '../store';

const STAGE_CONFIG = {
  understanding: {
    icon: Brain,
    label: 'Understanding',
    description: 'Analyzing your description...',
    progress: 25
  },
  decomposing: {
    icon: Cog,
    label: 'Decomposing',
    description: 'Breaking into steps...',
    progress: 50
  },
  generating: {
    icon: Wand2,
    label: 'Generating',
    description: 'Building your workflow...',
    progress: 75
  },
  complete: {
    icon: Wand2,
    label: 'Complete',
    description: 'Workflow generated successfully!',
    progress: 100
  }
};

export function GenerationProgress() {
  const { 
    generation: { isGenerating, generationStage, lastError },
    updateStage
  } = useStore();
  
  if (!isGenerating && generationStage !== 'complete' && generationStage !== 'error') {
    return null;
  }
  
  const config = STAGE_CONFIG[generationStage] || STAGE_CONFIG.understanding;
  const Icon = config.icon;
  
  const handleCancel = () => {
    updateStage('idle');
    // TODO: Cancel ongoing generation request
  };
  
  return (
    <Card className="mx-4 mb-4 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{config.label}</div>
                <div className="text-sm text-muted-foreground">
                  {config.description}
                </div>
              </div>
            </div>
            
            {isGenerating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Progress value={config.progress} className="h-2" />
          
          {generationStage === 'error' && lastError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{lastError}</div>
            </div>
          )}
          
          {generationStage === 'complete' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700">
                Your workflow has been generated! You can now edit it or generate a new one.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4. Integrate into editor

```tsx
// app/(pages)/workflows/editor/index.tsx (additions)
import { GenerationInput } from './components/GenerationInput';
import { GenerationProgress } from './components/GenerationProgress';

export function WorkflowEditor() {
  const { generation: { generationMode } } = useStore();
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with toolbar */}
      <EditorToolbar />
      
      {/* Generation UI */}
      {generationMode && (
        <div className="flex-shrink-0">
          <GenerationInput />
          <GenerationProgress />
        </div>
      )}
      
      {/* Canvas */}
      <div className="flex-1 relative">
        <WorkflowCanvas />
        
        {/* Empty state with generation prompt */}
        {!hasNodes && !generationMode && (
          <EmptyStateWithGenerationPrompt />
        )}
      </div>
    </div>
  );
}
```

### Testing

```bash
# Test generation slice
npm run test -- --grep "generation-slice"

# Test generation components
npm run test -- --grep "GenerationInput|GenerationProgress"

# Test workflow generation integration
npm run test -- --grep "workflow generation integration"

# E2E test generation flow
npx playwright test generation-workflow.spec.ts
```

### Success Metrics

- [ ] Generation input appears prominently in empty workflow state
- [ ] Progress stages display correctly during generation
- [ ] Generated workflow appears on canvas with proper layout
- [ ] Example prompts populate input when clicked
- [ ] Generation can be cancelled mid-process
- [ ] Error states display helpful messages and retry options
- [ ] Keyboard shortcuts work (Cmd+Enter to generate)
- [ ] Mode toggle between manual and generation modes works
- [ ] Generation state persists during browser refresh

---

## Phase 3: Conversational Refinement

### Goal
Add conversational refinement capabilities to iteratively improve generated workflows through natural language instructions.

### File Impact

| File | Lines | Action |
|------|-------|--------|
| `app/(pages)/workflows/editor/components/RefinementChat.tsx` | ~200 | Conversational refinement UI |
| `app/(pages)/workflows/editor/components/RefinementSidebar.tsx` | ~150 | Chat sidebar container |
| `app/api/workflows/generate/refine/route.ts` | ~100 | Refinement API endpoint |
| `app/(pages)/workflows/editor/store/slices/generation-slice.ts` | ~50 | Add refinement actions |

### Implementation

#### 1. Create refinement endpoint

```typescript
// app/api/workflows/generate/refine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WorkflowGenerator } from '../services/workflow-generator';
import { RefinementRequestSchema } from '../types/generation';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedRequest = RefinementRequestSchema.parse(body);
    
    const generator = new WorkflowGenerator();
    const response = await generator.refineWorkflow(validatedRequest);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Workflow refinement error:', error);
    return NextResponse.json({ 
      error: 'Refinement failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### 2. Create refinement chat component

```tsx
// app/(pages)/workflows/editor/components/RefinementChat.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, X } from 'lucide-react';
import { useStore } from '../store';

interface QuickAction {
  label: string;
  instruction: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add error handling", instruction: "Add error handling to all steps in case they fail" },
  { label: "Add logging", instruction: "Add logging steps to track workflow progress" },
  { label: "Optimize for speed", instruction: "Optimize the workflow to run faster" },
  { label: "Add validation", instruction: "Add data validation before processing" },
  { label: "Make it more robust", instruction: "Make the workflow more reliable and fault-tolerant" }
];

export function RefinementChat() {
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    generation: { conversationHistory, isGenerating },
    sendRefinement
  } = useStore();
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);
  
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    await sendRefinement(input);
    setInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleQuickAction = (action: QuickAction) => {
    setInput(action.instruction);
  };
  
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Bot className="h-4 w-4 mr-2" />
        Refine Workflow
      </Button>
    );
  }
  
  return (
    <Card className="w-80 h-96 flex flex-col shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Workflow Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3">
        {/* Conversation history */}
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-xs ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.content}
                </div>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  {message.role === 'user' ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        {/* Quick actions */}
        {!isGenerating && conversationHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick actions:</div>
            <div className="flex flex-wrap gap-1">
              {QUICK_ACTIONS.slice(0, 3).map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="text-xs h-6 px-2"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Describe changes to your workflow..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            rows={2}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              ⌘+Enter to send
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="sm"
              className="h-6 px-3"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Add refinement actions to store

```typescript
// app/(pages)/workflows/editor/store/slices/generation-slice.ts (additions)
export interface GenerationSlice {
  // ... existing actions
  sendRefinement: (instruction: string) => Promise<void>;
  highlightChanges: (changes: any[]) => void;
}

// Add to createGenerationSlice:
sendRefinement: async (instruction: string) => {
  const { generation, workflow } = get(); // Assume workflow comes from workflow slice
  
  // Add user message
  get().addMessage({ role: 'user', content: instruction });
  
  set((state) => ({
    generation: {
      ...state.generation,
      isGenerating: true,
      generationStage: 'understanding'
    }
  }));
  
  try {
    const response = await fetch('/api/workflows/generate/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction,
        currentWorkflow: workflow.current,
        conversationHistory: generation.conversationHistory,
        workflowId: workflow.current?.id
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Refinement failed');
    }
    
    const result: GenerationResponse = await response.json();
    get().generationComplete(result);
    
    // Highlight changes on canvas
    if (result.changes) {
      get().highlightChanges(result.changes);
    }
    
  } catch (error) {
    get().generationFailed(error instanceof Error ? error.message : 'Unknown error');
  }
}
```

### Testing

```bash
# Test refinement API
curl -X POST http://localhost:3000/api/workflows/generate/refine \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Add error handling", "currentWorkflow": {...}, "conversationHistory": [...]}'

# Test refinement UI
npm run test -- --grep "RefinementChat"

# E2E test refinement flow
npx playwright test refinement-workflow.spec.ts
```

### Success Metrics

- [ ] Refinement chat sidebar displays conversation history
- [ ] Quick action buttons populate input with common refinements
- [ ] Refinement requests successfully modify existing workflows
- [ ] Changes are highlighted on canvas after refinement
- [ ] Conversation context is maintained across multiple refinements
- [ ] Chat can be minimized and restored
- [ ] Error handling works for failed refinement requests
- [ ] Real-time typing indicators during processing

---

## Validation & Testing

### Integration Tests

```typescript
// Test complete generation flow
describe('Natural Language Workflow Generation', () => {
  it('should generate complete workflow from description', async () => {
    // 1. Submit description
    // 2. Verify API calls generation endpoint
    // 3. Verify workflow appears on canvas
    // 4. Verify workflow is valid and executable
  });
  
  it('should refine existing workflow based on instructions', async () => {
    // 1. Generate initial workflow
    // 2. Send refinement instruction
    // 3. Verify workflow is modified correctly
    // 4. Verify changes are highlighted
  });
  
  it('should handle generation errors gracefully', async () => {
    // 1. Submit invalid description (missing integrations)
    // 2. Verify error handling
    // 3. Verify helpful error messages
    // 4. Verify retry functionality
  });
});
```

### Manual Testing Checklist

- [ ] Generate workflow from simple description ("send email when file uploaded")
- [ ] Verify generated workflow appears on canvas with proper layout
- [ ] Test progress stages display correctly during generation
- [ ] Try complex workflow generation (5+ steps with conditions)
- [ ] Test refinement: "Add error handling to all steps"
- [ ] Verify conversation history is maintained
- [ ] Test quick action buttons populate refinement input
- [ ] Cancel generation mid-process and verify state cleanup
- [ ] Test example prompts populate input correctly
- [ ] Verify mode toggle between manual and generation modes

### Performance Considerations

- [ ] Generation completes within 10 seconds for simple workflows
- [ ] UI remains responsive during generation
- [ ] Large conversation histories don't impact performance
- [ ] Canvas redraws smoothly after workflow updates
- [ ] Memory usage remains stable during long sessions

---

## Future Enhancements

1. **Streaming Generation**: Real-time progress updates during LLM generation
2. **Multi-Model Support**: Allow users to choose between different LLM models
3. **Template Library**: Save and reuse generated workflow patterns
4. **Voice Input**: Generate workflows from voice descriptions
5. **Collaboration**: Real-time collaborative generation with multiple users
6. **Smart Suggestions**: Proactive workflow suggestions based on user behavior
7. **Version History**: Track and revert generation iterations