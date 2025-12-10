"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IdentityStep } from "./wizard/IdentityStep";
import { PersonalityStep } from "./wizard/PersonalityStep";
import { SuccessState } from "./wizard/SuccessState";

interface CreateFromScratchWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | "success" | "error";

interface FormData {
  name: string;
  role: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  model: string;
  objectives: string[];
  guardrails: string[];
  isManager: boolean;
  subAgentIds: string[];
}

export function CreateFromScratchWizard({
  onComplete,
  onCancel,
}: CreateFromScratchWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    role: "",
    avatar: "🤖",
    description: "",
    systemPrompt: "",
    model: "google/gemini-2.5-pro",
    objectives: [],
    guardrails: [],
    isManager: false,
    subAgentIds: [],
  });

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1
      if (formData.name.length < 2 || formData.role.length < 2) {
        setError("Name and role must be at least 2 characters");
        return;
      }
      setStep(2);
      setError(null);
    } else if (step === 2) {
      // Validate step 2
      if (formData.systemPrompt.length < 10) {
        setError("System prompt must be at least 10 characters");
        return;
      }
      // Submit form
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workforce/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          avatar: formData.avatar,
          description: formData.description,
          systemPrompt: formData.systemPrompt,
          model: formData.model,
          objectives: formData.objectives,
          guardrails: formData.guardrails,
          isManager: formData.isManager,
          subAgentIds: formData.subAgentIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create agent");
      }

      const data = await response.json();
      setCreatedAgentId(data.agentId);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success" && createdAgentId) {
    return (
      <SuccessState
        agentId={createdAgentId}
        agentName={formData.name}
        onOpenAgent={() => {
          onComplete();
        }}
        onConfigureCapabilities={() => {
          onComplete();
        }}
        onStartChatting={() => {
          onComplete();
        }}
      />
    );
  }

  if (step === "error") {
    return (
      <div className="space-y-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive">Error creating agent</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>
            Go back to form
          </Button>
          <Button onClick={handleSubmit}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2 flex-1 rounded-full ${
            step >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-2 flex-1 rounded-full ${
            step >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step content */}
      {step === 1 && (
        <IdentityStep
          formData={formData}
          onUpdate={(updates) => setFormData({ ...formData, ...updates })}
        />
      )}

      {step === 2 && (
        <PersonalityStep
          formData={formData}
          onUpdate={(updates) => setFormData({ ...formData, ...updates })}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <Button onClick={handleNext} disabled={isLoading}>
          {isLoading ? "Creating..." : step === 2 ? "Create Agent" : "Next"}
        </Button>
      </div>
    </div>
  );
}
