"use client";

import { useState } from "react";
import { Plus, Trash2, FileInput, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflowEditorStore } from "../../store";
import type { RuntimeInputConfig, WorkflowConfig } from "@/app/api/workflows/services/types";

export function InputsPanel() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="inputs" className="flex-1 flex flex-col">
        <div className="p-3 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="inputs" className="flex-1">
              <FileInput className="h-4 w-4 mr-2" />
              Inputs
            </TabsTrigger>
            <TabsTrigger value="configs" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Configs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="inputs" className="flex-1 overflow-auto m-0 p-3">
          <RuntimeInputsSection />
        </TabsContent>
        <TabsContent value="configs" className="flex-1 overflow-auto m-0 p-3">
          <ConfigsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RuntimeInputsSection() {
  const { runtimeInputs, addRuntimeInput, updateRuntimeInput, removeRuntimeInput } = useWorkflowEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newInput, setNewInput] = useState<Partial<RuntimeInputConfig>>({
    key: "",
    label: "",
    type: "string",
    required: true,
  });

  const handleAdd = () => {
    if (!newInput.key || !newInput.label) return;
    addRuntimeInput({
      key: newInput.key,
      label: newInput.label,
      type: newInput.type || "string",
      required: newInput.required ?? true,
      description: newInput.description,
    });
    setNewInput({ key: "", label: "", type: "string", required: true });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Runtime Inputs</h4>
          <p className="text-xs text-slate-500">Values passed by agents at execution time</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-3 space-y-3 bg-blue-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Key</Label>
              <Input
                placeholder="jobUrl"
                value={newInput.key}
                onChange={(e) => setNewInput({ ...newInput, key: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="Job URL"
                value={newInput.label}
                onChange={(e) => setNewInput({ ...newInput, label: e.target.value })}
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={newInput.type} onValueChange={(v) => setNewInput({ ...newInput, type: v as RuntimeInputConfig["type"] })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newInput.required}
                  onCheckedChange={(checked) => setNewInput({ ...newInput, required: checked })}
                />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add Input</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {runtimeInputs.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>No runtime inputs defined</p>
          <p className="text-xs mt-1">Add inputs that agents will provide when calling this workflow</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runtimeInputs.map((input) => (
            <InputCard key={input.key} input={input} onUpdate={updateRuntimeInput} onRemove={removeRuntimeInput} />
          ))}
        </div>
      )}
    </div>
  );
}

function InputCard({ input, onUpdate, onRemove }: {
  input: RuntimeInputConfig;
  onUpdate: (key: string, updates: Partial<RuntimeInputConfig>) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">{input.label}</div>
          <div className="text-xs text-slate-500 font-mono">{"{{inputs." + input.key + "}}"}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(input.key)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100">{input.type}</span>
        {input.required && <span className="text-xs text-red-500">required</span>}
      </div>
    </div>
  );
}

function ConfigsSection() {
  const { configs, addConfig, updateConfig, removeConfig } = useWorkflowEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newConfig, setNewConfig] = useState<Partial<WorkflowConfig>>({
    key: "",
    label: "",
    type: "text",
    required: false,
  });

  const handleAdd = () => {
    if (!newConfig.key || !newConfig.label) return;
    addConfig({
      key: newConfig.key,
      label: newConfig.label,
      type: newConfig.type || "text",
      required: newConfig.required ?? false,
      description: newConfig.description,
      default: newConfig.default,
      options: newConfig.options,
    });
    setNewConfig({ key: "", label: "", type: "text", required: false });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Configs</h4>
          <p className="text-xs text-slate-500">Values set once when assigning to an agent</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-3 space-y-3 bg-amber-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Key</Label>
              <Input
                placeholder="resumeStyle"
                value={newConfig.key}
                onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="Resume Style"
                value={newConfig.label}
                onChange={(e) => setNewConfig({ ...newConfig, label: e.target.value })}
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={newConfig.type} onValueChange={(v) => setNewConfig({ ...newConfig, type: v as WorkflowConfig["type"] })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newConfig.required}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, required: checked })}
                />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add Config</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {configs.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>No configs defined</p>
          <p className="text-xs mt-1">Add configs that users set when assigning this workflow</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <ConfigCard key={config.key} config={config} onUpdate={updateConfig} onRemove={removeConfig} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigCard({ config, onUpdate, onRemove }: {
  config: WorkflowConfig;
  onUpdate: (key: string, updates: Partial<WorkflowConfig>) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">{config.label}</div>
          <div className="text-xs text-slate-500 font-mono">{"{{configs." + config.key + "}}"}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(config.key)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100">{config.type}</span>
        {config.required && <span className="text-xs text-red-500">required</span>}
        {config.default !== undefined && (
          <span className="text-xs text-slate-400">default: {String(config.default)}</span>
        )}
      </div>
    </div>
  );
}




