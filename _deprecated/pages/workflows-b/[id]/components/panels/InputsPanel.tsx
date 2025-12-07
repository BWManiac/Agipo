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
import { Plus, Trash2, DollarSign } from "lucide-react";
import type { RuntimeInput } from "@/_tables/workflows-b/types";

/**
 * InputsPanel - Runtime inputs editor
 * Based on Variation 1 (lines 516-595)
 */
export function InputsPanel() {
  const workflow = useWorkflowsBStore(state => state.workflow);
  const addInput = useWorkflowsBStore(state => state.addInput);
  const updateInput = useWorkflowsBStore(state => state.updateInput);
  const removeInput = useWorkflowsBStore(state => state.removeInput);
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newInput, setNewInput] = useState<Partial<RuntimeInput>>({
    name: "",
    type: "string",
    description: "",
    required: true,
  });
  
  if (!workflow) return null;
  
  const handleAddInput = () => {
    if (!newInput.name?.trim()) return;
    
    addInput({
      name: newInput.name.trim(),
      type: newInput.type || "string",
      description: newInput.description || "",
      required: newInput.required ?? true,
    });
    
    setNewInput({ name: "", type: "string", description: "", required: true });
    setIsAddingNew(false);
  };
  
  // Find which steps use each input
  const getInputUsage = (inputName: string): string[] => {
    return workflow.steps
      .filter(step => 
        step.inputMappings.some(
          m => m.source.type === "runtime" && m.source.inputName === inputName
        )
      )
      .map(step => step.label);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <p className="text-xs text-gray-500">
          Runtime inputs are provided by the agent when the workflow runs.
        </p>
      </div>
      
      {/* Existing Inputs */}
      <div className="flex-1 overflow-y-auto space-y-3 -mx-4 px-4">
        {workflow.inputs.map((input) => {
          const usedIn = getInputUsage(input.name);
          
          return (
            <div 
              key={input.name}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">{input.name}</span>
                  {input.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                  onClick={() => removeInput(input.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-12">Type:</Label>
                  <Select
                    value={input.type}
                    onValueChange={(value) => updateInput(input.name, { 
                      type: value as RuntimeInput["type"] 
                    })}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                      <SelectItem value="array">array</SelectItem>
                      <SelectItem value="object">object</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 w-12">Desc:</Label>
                  <Input
                    value={input.description}
                    onChange={(e) => updateInput(input.name, { description: e.target.value })}
                    placeholder="Description..."
                    className="h-7 text-xs flex-1"
                  />
                </div>
              </div>
              
              {usedIn.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Used in: {usedIn.join(", ")}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Add New Input Form */}
        {isAddingNew && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Name:</Label>
                <Input
                  value={newInput.name || ""}
                  onChange={(e) => setNewInput(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="inputName"
                  className="h-7 text-xs flex-1"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Type:</Label>
                <Select
                  value={newInput.type || "string"}
                  onValueChange={(value) => setNewInput(prev => ({ 
                    ...prev, 
                    type: value as RuntimeInput["type"] 
                  }))}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                    <SelectItem value="array">array</SelectItem>
                    <SelectItem value="object">object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 w-12">Desc:</Label>
                <Input
                  value={newInput.description || ""}
                  onChange={(e) => setNewInput(prev => ({ ...prev, description: e.target.value }))}
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
                  onClick={handleAddInput}
                  disabled={!newInput.name?.trim()}
                >
                  Add Input
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {workflow.inputs.length === 0 && !isAddingNew && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">No runtime inputs yet</p>
            <p className="text-xs text-gray-400">
              Add inputs that will be provided when the workflow runs
            </p>
          </div>
        )}
      </div>
      
      {/* Add Input Button */}
      {!isAddingNew && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full border-2 border-dashed hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Runtime Input
          </Button>
        </div>
      )}
    </div>
  );
}




