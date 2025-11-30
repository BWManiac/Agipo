"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  ColumnDef,
  RowData
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddRow, useUpdateRow, TableSchema } from "../hooks/useRecords";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    schema: TableSchema;
  }
}

// --- Cell Editors ---

const TextCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    table.options.meta?.updateData(row.index, column.id, value);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      value={value as string}
      onChange={e => setValue(e.target.value)}
      onBlur={onBlur}
      className="h-8 border-transparent focus-visible:ring-0 px-2 bg-transparent hover:bg-muted/50"
    />
  );
};

const DateCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const [date, setDate] = useState<Date | undefined>(
    initialValue ? new Date(initialValue) : undefined
  );

  const onSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    table.options.meta?.updateData(
        row.index, 
        column.id, 
        newDate ? newDate.toISOString() : null
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"ghost"}
          className={cn(
            "w-full justify-start text-left font-normal h-8 px-2",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const SelectCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const schema = table.options.meta?.schema;
  const colDef = schema?.columns.find((c: any) => c.id === column.id);
  const options = colDef?.options || [];

  const onValueChange = (val: string) => {
      table.options.meta?.updateData(row.index, column.id, val);
  };

  return (
    <Select value={initialValue} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 border-transparent focus:ring-0 bg-transparent hover:bg-muted/50">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt: string) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// --- Main Grid Component ---

interface RecordsGridProps {
  tableId: string;
  schema: TableSchema;
  data: any[];
}

export function RecordsGrid({ tableId, schema, data }: RecordsGridProps) {
  const updateRow = useUpdateRow(tableId);
  const addRow = useAddRow(tableId);

  // Generate Columns from Schema
  const columns = useMemo(() => {
    if (!schema) return [];
    
    const cols: ColumnDef<any>[] = schema.columns.map((col) => ({
      accessorKey: col.id,
      header: () => (
        <div className="flex items-center gap-2">
          {/* Icon based on type */}
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            {col.name}
          </span>
        </div>
      ),
      cell: (props) => {
          if (col.id === "id" || col.id === "_created" || col.id === "_updated") {
              return <span className="text-xs text-muted-foreground">{props.getValue() as string}</span>;
          }
          if (col.type === "date") return <DateCell {...props} />;
          if (col.type === "select") return <SelectCell {...props} />;
          return <TextCell {...props} />;
      },
      size: 200, // default width
    }));

    return cols;
  }, [schema]);

  // Table Instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      schema,
      updateData: (rowIndex, columnId, value) => {
        const row = data[rowIndex];
        // Optimistic update handled by React Query usually, but here we fire mutation
        updateRow.mutate({ 
            rowId: row.id, 
            updates: { [columnId]: value } 
        });
      },
    },
  });

  // New Row Handler
  const handleAddRow = () => {
      // Add empty row matching schema defaults
      // For now, let backend handle ID/Dates. We just send minimal object.
      addRow.mutate({}); 
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader className="bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
          
          {/* Add Row Button Row */}
          <TableRow>
              <TableCell colSpan={columns.length} className="p-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground h-8"
                    onClick={handleAddRow}
                  >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                  </Button>
              </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

