"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface IdentityStepProps {
  formData: {
    name: string;
    role: string;
    avatar: string;
    description: string;
  };
  onUpdate: (updates: Partial<IdentityStepProps["formData"]>) => void;
}

const AVATAR_OPTIONS = ["🤖", "👤", "👨‍💼", "👩‍💼", "🧑‍🔬", "👨‍🎨", "👩‍🎨", "🤝"];

export function IdentityStep({ formData, onUpdate }: IdentityStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Identity</h2>
        <p className="text-sm text-muted-foreground">
          Give your agent a name, role, and description
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Alex Kim"
            minLength={2}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 2 characters
          </p>
        </div>

        <div>
          <Label htmlFor="role">
            Role <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => onUpdate({ role: e.target.value })}
            placeholder="e.g., Engineering Lead"
            minLength={2}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 2 characters
          </p>
        </div>

        <div>
          <Label>Avatar</Label>
          <div className="mt-2 flex gap-2">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => onUpdate({ avatar })}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-2xl transition ${
                  formData.avatar === avatar
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Brief description of what this agent does..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
