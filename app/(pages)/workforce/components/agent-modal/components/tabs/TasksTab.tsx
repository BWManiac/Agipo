"use client";

import type { AgentConfig } from "@/_tables/types";
import { useAgentModalStore } from "../../store";
import { TaskItem } from "../shared/TaskItem";

interface TasksTabProps {
  agent: AgentConfig;
}

export function TasksTab({ agent }: TasksTabProps) {
  const tasks = useAgentModalStore((state) => state.tasks);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Task Execution History</h2>
            <p className="text-sm text-gray-500">Review tool calls and workflow runs.</p>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

