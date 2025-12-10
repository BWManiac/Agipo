"use client";

import { useTableSchema, useTableRows, useAddColumn } from "../hooks/useRecords";
import { RecordsGrid } from "../components/RecordsGrid";
import { ChatSidebar } from "../components/ChatSidebar";
import { SettingsPanel } from "../components/SettingsPanel";
import { Pagination } from "../components/Pagination";
import { useRecordsStore } from "../store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Filter, X } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const { data: schema, isLoading: isLoadingSchema } = useTableSchema(tableId);
  const { data: rows, isLoading: isLoadingRows } = useTableRows(tableId);

  const {
    filters,
    clearAllFilters,
    setTotalRows,
    openSettingsPanel,
    selectedRowIds,
  } = useRecordsStore();

  // Update total rows when data changes
  useEffect(() => {
    if (rows) {
      setTotalRows(rows.length);
    }
  }, [rows, setTotalRows]);

  const filterCount = Object.keys(filters).length;

  if (isLoadingSchema || isLoadingRows) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!schema) return <div className="p-8">Table not found</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/records" className="text-muted-foreground hover:text-foreground text-sm">
            Records
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold">{schema.name}</h1>
          <Badge variant="secondary" className="font-normal text-xs">
            {rows?.length || 0} rows
          </Badge>
          {filterCount > 0 && (
            <Badge
              variant="outline"
              className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
            >
              <Filter className="h-3 w-3" />
              {filterCount} filter{filterCount > 1 ? "s" : ""}
              <button
                onClick={clearAllFilters}
                className="hover:text-blue-900 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AddColumnPopover tableId={tableId} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => openSettingsPanel()}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Area */}
        <div className="flex-1 overflow-auto bg-white">
          <RecordsGrid tableId={tableId} schema={schema} data={rows || []} />
        </div>

        {/* Chat Sidebar */}
        <ChatSidebar tableId={tableId} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t px-6 py-2 shrink-0">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{rows?.length || 0} rows total</span>
            {selectedRowIds.size > 0 && (
              <span>{selectedRowIds.size} selected</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Pagination />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Auto-save enabled
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      <SettingsPanel tableId={tableId} />
    </div>
  );
}

function AddColumnPopover({ tableId }: { tableId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const addColumn = useAddColumn(tableId);

  const handleAdd = async () => {
    await addColumn.mutateAsync({ name, type });
    setOpen(false);
    setName("");
    setType("text");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="w-4 h-4 mr-2" />
          Column
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-medium leading-none">Add Column</h4>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Status" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="select">Select (Enum)</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full" onClick={handleAdd} disabled={!name}>
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
