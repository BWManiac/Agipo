"use client";

import { useTableSchema, useTableRows, useAddColumn } from "../hooks/useRecords";
import { RecordsGrid } from "../components/RecordsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const { data: schema, isLoading: isLoadingSchema } = useTableSchema(tableId);
  const { data: rows, isLoading: isLoadingRows } = useTableRows(tableId);

  if (isLoadingSchema || isLoadingRows) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!schema) return <div className="p-8">Table not found</div>;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b h-14 flex items-center px-4 justify-between bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/records" className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
             <h1 className="text-sm font-bold flex items-center gap-2">
                {schema.name}
                <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground font-normal">
                    {rows?.length || 0} Records
                </span>
             </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
             <AddColumnPopover tableId={tableId} />
             <Button size="sm" variant="outline">
                 <Settings className="w-4 h-4 mr-2" />
                 Settings
             </Button>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
         <RecordsGrid tableId={tableId} schema={schema} data={rows || []} />
      </div>
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

