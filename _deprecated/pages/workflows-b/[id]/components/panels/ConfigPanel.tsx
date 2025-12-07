"use client";

import { useState } from "react";
import { useWorkflowsBStore } from "../../../editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Trash2, Settings } from "lucide-react";
import type { WorkflowConfig } from "@/_tables/workflows-b/types";

/**
 * ConfigPanel - Workflow configuration editor
 * Based on Variation 1 (lines 597-694)
 */
export function ConfigPanel() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  const addConfig = useWorkflowsBStore(state => state.addConfig);
  const updateConfig = useWorkflowsBStore(state => state.updateConfig);
  const removeConfig = useWorkflowsBStore(state => state.removeConfig);
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newConfig, setNewConfig] = useState<Partial<WorkflowConfig>>({
    name: "",
    type: "string",
    description: "",
  });
  const [enumOptions, setEnumOptions] = useState("");
  
  if (!workflow) return null;
  
  const handleAddConfig = () => {
    if (!newConfig.name?.trim()) return;
    
    const config: WorkflowConfig = {
      name: newConfig.name.trim(),
      type: newConfig.type || "string",
      description: newConfig.description || "",
    };
    
    // Add options for enum type
    if (newConfig.type === "enum" && enumOptions.trim()) {
      config.options = enumOptions.split(",").map(o => o.trim()).filter(Boolean);
    }
    
    addConfig(config);
    setNewConfig({ name: "", type: "string", description: "" });
    setEnumOptions("");
    setIsAddingNew(false);
  };
  
  // Find which steps use each config
  const getConfigUsage = (configName: string): string[] => {
    return workflow.steps
      .filter(step => 
        step.inputMappings.some(
          m => m.source.type === "config" && m.source.configName === configName
        )
      )
      .map(step => step.label);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-xs text-gray-500">
          Configuration values are set when the workflow is deployed/hired.
        </p>
      </div>
      
      {/* Existing Configs */}
      <div className="flex-1 overflow-y-auto space-y-3 -mx-4 px-4">
        {workflow.configs.map((config) => {
          const usedIn = getConfigUsage(config.name);
          
          return (
            <div 
              key={config.name}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm">{config.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                  onClick={() => removeConfig(config.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-12">Type:</Label>
                  <Select
                    value={config.type}
                    onValueChange={(value) => updateConfig(config.name, { 
                      type: value as WorkflowConfig["type"] 
                    })}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="enum">enum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {config.type === "enum" && config.options && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500 w-12">Opts:</Label>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {config.options.map((opt) => (
                        <span 
                          key={opt}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-12">Desc:</Label>
                  <Input
                    value={config.description || ""}
                    onChange={(e) => updateConfig(config.name, { description: e.target.value })}
                    placeholder="Description..."
                    className="h-7 text-xs flex-1"
                  />
                </div>
                
                {config.defaultValue !== undefined && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500 w-12">Default:</Label>
                    <span className="text-xs text-gray-600">
                      {String(config.defaultValue)}
                    </span>
                  </div>
                )}
              </div>
              
              {usedIn.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Used in: {usedIn.join(", ")}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Add New Config Form */}
        {isAddingNew && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Name:</Label>
                <Input
                  value={newConfig.name || ""}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="configName"
                  className="h-7 text-xs flex-1"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Type:</Label>
                <Select
                  value={newConfig.type || "string"}
                  onValueChange={(value) => setNewConfig(prev => ({ 
                    ...prev, 
                    type: value as WorkflowConfig["type"] 
                  }))}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                    <SelectItem value="enum">enum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newConfig.type === "enum" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-12">Opts:</Label>
                  <Input
                    value={enumOptions}
                    onChange={(e) => setEnumOptions(e.target.value)}
                    placeholder="opt1, opt2, opt3"
                    className="h-7 text-xs flex-1"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Desc:</Label>
                <Input
                  value={newConfig.description || ""}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description..."
                  className="h-7 text-xs flex-1"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddConfig}
                  disabled={!newConfig.name?.trim()}
                >
                  Add Config
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {workflow.configs.length === 0 && !isAddingNew && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">No configuration options yet</p>
            <p className="text-xs text-gray-400">
              Add configuration that will be set when the workflow is deployed
            </p>
          </div>
        )}
      </div>
      
      {/* Add Config Button */}
      {!isAddingNew && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full border-2 border-dashed hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        </div>
      )}
    </div>
  );
}
