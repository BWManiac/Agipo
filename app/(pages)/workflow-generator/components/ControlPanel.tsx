"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { WorkflowLayer } from "../store/slices/editorSlice";
import { ApiKeyManager } from "./settings/ApiKeyManager";

type ControlPanelProps = {
  onAdd: () => void;
  onRun: () => void;
  onInstall: () => void;
  onSave: () => void;
  isBooting: boolean;
  isInstalling: boolean;
  isSaving: boolean;
  packageName: string;
  setPackageName: (pkg: string) => void;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  activeLayer: WorkflowLayer;
  onLayerChange: (layer: WorkflowLayer) => void;
};

export function ControlPanel({
  onAdd,
  onRun,
  onInstall,
  onSave,
  isBooting,
  isInstalling,
  isSaving,
  packageName,
  setPackageName,
  workflowName,
  setWorkflowName,
  activeLayer,
  onLayerChange,
}: ControlPanelProps) {
  const isLoading = isBooting || isInstalling || isSaving;

  return (
    <div className="pointer-events-none absolute top-4 left-1/2 z-10 flex w-full max-w-5xl -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200 bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <Button onClick={onAdd} disabled={isLoading} className="pointer-events-auto">
          Add Node
        </Button>
        <Button onClick={onRun} disabled={isLoading} className="pointer-events-auto">
          {isBooting ? "Booting..." : "Run"}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="pointer-events-auto flex gap-2">
        <Input
          type="text"
          placeholder="npm package"
          value={packageName}
          onChange={(event) => setPackageName(event.target.value)}
          disabled={isLoading}
          className="w-32"
        />
        <Button
          onClick={onInstall}
          disabled={isLoading || !packageName}
          className="pointer-events-auto"
        >
          {isInstalling ? "Installing..." : "Install"}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="pointer-events-auto">
        <ApiKeyManager />
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
        {(["flow", "spec", "code"] as WorkflowLayer[]).map((layer) => {
          const isActive = activeLayer === layer;
          return (
            <button
              key={layer}
              type="button"
              onClick={() => onLayerChange(layer)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="pointer-events-auto flex items-center gap-2">
        <Input
          type="text"
          placeholder="Workflow name..."
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          disabled={isLoading}
          className="w-40"
        />
        <Button onClick={onSave} disabled={isLoading || !workflowName}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

