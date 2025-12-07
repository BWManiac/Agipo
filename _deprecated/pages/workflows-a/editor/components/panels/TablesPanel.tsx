"use client";

import { useState } from "react";
import { Plus, Trash2, Database, Table2, Search, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflowEditorStore } from "../../store";
import type { TableRequirement, ColumnRequirement } from "@/app/api/workflows/services/types";

export function TablesPanel() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="requirements" className="flex-1 flex flex-col">
        <div className="p-3 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="requirements" className="flex-1">
              <Table2 className="h-4 w-4 mr-2" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="bindings" className="flex-1">
              <Database className="h-4 w-4 mr-2" />
              Bindings
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="requirements" className="flex-1 overflow-auto m-0 p-3">
          <TableRequirementsSection />
        </TabsContent>
        <TabsContent value="bindings" className="flex-1 overflow-auto m-0 p-3">
          <TableBindingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TableRequirementsSection() {
  const { tableRequirements, addTableRequirement, updateTableRequirement, removeTableRequirement } =
    useWorkflowEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newReq, setNewReq] = useState<Partial<TableRequirement>>({
    key: "",
    description: "",
    purpose: "read",
    requiredColumns: [],
    canAutoCreate: true,
  });

  const handleAdd = () => {
    if (!newReq.key) return;
    addTableRequirement({
      key: newReq.key,
      description: newReq.description || "",
      purpose: newReq.purpose || "read",
      requiredColumns: newReq.requiredColumns || [],
      canAutoCreate: newReq.canAutoCreate ?? true,
    });
    setNewReq({ key: "", description: "", purpose: "read", requiredColumns: [], canAutoCreate: true });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Table Requirements</h4>
          <p className="text-xs text-slate-500">Define tables needed by this workflow</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {isAdding && (
        <div className="border rounded-lg p-3 space-y-3 bg-green-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Key</Label>
              <Input
                placeholder="job_listings"
                value={newReq.key || ""}
                onChange={(e) => setNewReq({ ...newReq, key: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Table for job listings"
                value={newReq.description || ""}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                className="h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Purpose</Label>
            <Select
              value={newReq.purpose}
              onValueChange={(v) => setNewReq({ ...newReq, purpose: v as "read" | "write" | "readwrite" })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3" /> Read Only
                  </div>
                </SelectItem>
                <SelectItem value="write">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-3 w-3" /> Write Only
                  </div>
                </SelectItem>
                <SelectItem value="readwrite">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3" /> Read & Write
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              Add Requirement
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {tableRequirements.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <p>No table requirements defined</p>
          <p className="text-xs mt-1">Add tables that this workflow needs to read from or write to</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tableRequirements.map((req) => (
            <TableRequirementCard key={req.key} requirement={req} onRemove={removeTableRequirement} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableRequirementCard({
  requirement,
  onRemove,
}: {
  requirement: TableRequirement;
  onRemove: (id: string) => void;
}) {
  const [showColumns, setShowColumns] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">{requirement.key}</div>
          <div className="text-xs text-slate-500 font-mono">{"{{tables." + requirement.key + "}}"}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(requirement.key)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            requirement.purpose === "read"
              ? "bg-blue-100 text-blue-700"
              : requirement.purpose === "write"
              ? "bg-amber-100 text-amber-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {requirement.purpose}
        </span>
        {requirement.requiredColumns.length > 0 && (
          <button
            onClick={() => setShowColumns(!showColumns)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            {requirement.requiredColumns.length} columns
          </button>
        )}
      </div>
      {showColumns && requirement.requiredColumns.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <div className="text-xs text-slate-500 space-y-1">
            {requirement.requiredColumns.map((col) => (
              <div key={col.key} className="flex items-center gap-2">
                <span className="font-mono">{col.suggestedName}</span>
                <span className="text-slate-400">{col.type}</span>
                {col.required && <span className="text-red-500">*</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TableBindingsSection() {
  const { tableRequirements, tables } = useWorkflowEditorStore();

  if (tableRequirements.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        <p>No table requirements to bind</p>
        <p className="text-xs mt-1">Add table requirements first, then bind them to actual tables</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Table Bindings</h4>
        <p className="text-xs text-slate-500">Map requirements to actual tables (set when assigning to agent)</p>
      </div>

      <div className="space-y-2">
        {tableRequirements.map((req) => {
          const binding = tables[req.key];
          return (
            <div key={req.key} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{req.key}</div>
                  <div className="text-xs text-slate-500">{req.purpose}</div>
                </div>
                {binding ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Bound: {binding.tableId}
                  </span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    Not bound (set at assignment)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Table bindings are configured when assigning this workflow to an agent. Users can select existing tables or
        create new ones that match the required columns.
      </p>
    </div>
  );
}


