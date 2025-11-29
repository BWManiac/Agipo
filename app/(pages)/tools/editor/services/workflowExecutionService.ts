import type { Edge } from "@xyflow/react";

import { ensureRuntimeReady, spawnProcess } from "./webcontainerService";
import { useWorkflowGeneratorStore } from "../store";
import type { WorkflowNode } from "../store/types";

type Workflow = {
  nodes: WorkflowNode[];
  edges: Edge[];
};

type StreamHandler = (chunk: string) => void;

type ChainLifecycleHandlers = {
  onChainStart?: (chain: WorkflowNode[]) => void;
  onChainComplete?: (chain: WorkflowNode[]) => void;
};

const escapeSingleQuotes = (value: string): string =>
  value.replace(/'/g, `'\\''`);

const buildChains = (workflow: Workflow): WorkflowNode[][] => {
  const chains: WorkflowNode[][] = [];
  const targets = new Set(workflow.edges.map((edge) => edge.target));
  const sources = workflow.nodes.filter((node) => !targets.has(node.id));

  for (const source of sources) {
    const chain: WorkflowNode[] = [source];
    let current: WorkflowNode | undefined = source;

    while (current) {
      const nextEdge = workflow.edges.find(
        (edge) => edge.source === current?.id
      );
      const nextNode = workflow.nodes.find(
        (node) => node.id === nextEdge?.target
      );
      if (nextNode) {
        chain.push(nextNode);
      }
      current = nextNode;
    }

    chains.push(chain);
  }

  return chains;
};

const buildCommandForChain = (chain: WorkflowNode[]): string => {
  const writeCommands = chain
    .map(
      (node) =>
        `echo '${escapeSingleQuotes(node.data.code)}' > /tmp/node-${node.id}.js`
    )
    .join(" && ");

  const executeCommands = chain
    .map((node) => `node /tmp/node-${node.id}.js`)
    .join(" | ");

  return `cd /tmp && ${writeCommands} && ${executeCommands}`;
};

export const installDependency = async (
  packageName: string,
  onOutput: StreamHandler
): Promise<void> => {
  if (!packageName) {
    return;
  }

  await ensureRuntimeReady();

  const apiKeys = useWorkflowGeneratorStore.getState().apiKeys;
  const env = Object.fromEntries(
    Object.entries(apiKeys).filter(([, value]) => value)
  );

  const process = await spawnProcess(
    "sh",
    ["-c", `cd /tmp && npm install ${packageName}`],
    { env }
  );

  process.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput(data);
      },
    })
  );

  await process.exit;
};

export const runWorkflow = async (
  workflow: Workflow,
  onOutput: StreamHandler,
  handlers: ChainLifecycleHandlers = {}
): Promise<void> => {
  const chains = buildChains(workflow);
  const apiKeys = useWorkflowGeneratorStore.getState().apiKeys;
  const env = Object.fromEntries(
    Object.entries(apiKeys).filter(([, value]) => value)
  );

  for (const chain of chains) {
    handlers.onChainStart?.(chain);

    try {
      const command = buildCommandForChain(chain);

      const process = await spawnProcess("sh", ["-c", command], { env });

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            onOutput(data);
          },
        })
      );

      await process.exit;
    } finally {
      handlers.onChainComplete?.(chain);
    }
  }
};

