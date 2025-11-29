"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflowGeneratorStore } from "../../store";
import type { WorkflowNode } from "../../store/types";
import { ProcessStepItem } from "./spec/ProcessStepItem";
import { SectionHeader } from "./spec/SectionHeader";
import { SpecFieldRow } from "./spec/SpecFieldRow";

type NodeEditorProps = {
  node: WorkflowNode;
};

export function NodeEditor({ node }: NodeEditorProps) {
  // Subscribe to each action individually so Zustand can memoise snapshots.
  const updateNodeTitle = useWorkflowGeneratorStore(
    (state) => state.updateNodeTitle
  );
  const updateNodeFlowSummary = useWorkflowGeneratorStore(
    (state) => state.updateNodeFlowSummary
  );
  const addNodeSpecInput = useWorkflowGeneratorStore(
    (state) => state.addNodeSpecInput
  );
  const updateNodeSpecInput = useWorkflowGeneratorStore(
    (state) => state.updateNodeSpecInput
  );
  const removeNodeSpecInput = useWorkflowGeneratorStore(
    (state) => state.removeNodeSpecInput
  );
  const addNodeSpecOutput = useWorkflowGeneratorStore(
    (state) => state.addNodeSpecOutput
  );
  const updateNodeSpecOutput = useWorkflowGeneratorStore(
    (state) => state.updateNodeSpecOutput
  );
  const removeNodeSpecOutput = useWorkflowGeneratorStore(
    (state) => state.removeNodeSpecOutput
  );
  const addNodeProcessStep = useWorkflowGeneratorStore(
    (state) => state.addNodeProcessStep
  );
  const updateNodeProcessStep = useWorkflowGeneratorStore(
    (state) => state.updateNodeProcessStep
  );
  const removeNodeProcessStep = useWorkflowGeneratorStore(
    (state) => state.removeNodeProcessStep
  );

  const inputs = node.data.spec.inputs;
  const outputs = node.data.spec.outputs;
  const process = node.data.spec.process;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        <section className="space-y-2">
          <SectionHeader title="Title" subtitle="Give this node a clear name." />
          <Input
            value={node.data.title}
            onChange={(event) =>
              updateNodeTitle(node.id, event.target.value)
            }
          />
        </section>

        <section className="space-y-2">
          <SectionHeader
            title="Flow Summary"
            subtitle="Brief explanation of what happens in this node."
          />
          <Textarea
            value={node.data.flow.summary}
            onChange={(event) =>
              updateNodeFlowSummary(node.id, event.target.value)
            }
            rows={4}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <SectionHeader
            title="Inputs"
            subtitle="Describe required values."
          />
          <div className="space-y-3">
            {inputs.length === 0 ? (
              <EmptyNotice message="No inputs defined yet." />
            ) : (
              inputs.map((input, index) => (
                <SpecFieldRow
                  key={index}
                  name={input.name}
                  type={input.type}
                  description={input.description}
                  optional={input.optional}
                  onChange={(patch) =>
                    updateNodeSpecInput(node.id, index, patch)
                  }
                  onRemove={() => removeNodeSpecInput(node.id, index)}
                />
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNodeSpecInput(node.id)}
            >
              Add input
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Process"
            subtitle="Explain how this node transforms inputs."
          />
          <div className="space-y-3">
            {process.length === 0 ? (
              <EmptyNotice message="Document the steps." />
            ) : (
              process.map((step, index) => (
                <ProcessStepItem
                  key={index}
                  index={index}
                  value={step}
                  onChange={(value) =>
                    updateNodeProcessStep(node.id, index, value)
                  }
                  onRemove={() => removeNodeProcessStep(node.id, index)}
                />
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNodeProcessStep(node.id)}
            >
              Add step
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Outputs"
            subtitle="List what will be emitted."
          />
          <div className="space-y-3">
            {outputs.length === 0 ? (
              <EmptyNotice message="No outputs defined yet." />
            ) : (
              outputs.map((output, index) => (
                <SpecFieldRow
                  key={index}
                  name={output.name}
                  type={output.type}
                  description={output.description}
                  optional={output.optional}
                  onChange={(patch) =>
                    updateNodeSpecOutput(node.id, index, patch)
                  }
                  onRemove={() => removeNodeSpecOutput(node.id, index)}
                />
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addNodeSpecOutput(node.id)}
            >
              Add output
            </Button>
          </div>
        </section>

        <Separator />

        <section>
          <SectionHeader
            title="Context"
            subtitle="Coming soon: add prompts, guardrails, and metadata."
          />
          <p className="mt-2 text-xs text-slate-400">
            We will support additional configuration here in a future update.
          </p>
        </section>
      </div>
    </ScrollArea>
  );
}

function EmptyNotice({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-400">
      {message}
    </p>
  );
}


