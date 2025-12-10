"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "lucide-react";

interface SuccessStateProps {
  agentId: string;
  agentName: string;
  onOpenAgent: () => void;
  onConfigureCapabilities: () => void;
  onStartChatting: () => void;
}

export function SuccessState({
  agentId,
  agentName,
  onOpenAgent,
  onConfigureCapabilities,
  onStartChatting,
}: SuccessStateProps) {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Agent created successfully!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {agentName} is ready to use
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agent Preview
              </div>
              <div className="mt-2">
                <div className="text-lg font-semibold">{agentName}</div>
                <div className="text-sm text-muted-foreground">ID: {agentId}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={onOpenAgent}
        >
          Open Agent
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={onConfigureCapabilities}
        >
          Configure Capabilities
        </Button>
        <Button
          className="w-full"
          onClick={onStartChatting}
        >
          Start Chatting
        </Button>
      </div>
    </div>
  );
}
