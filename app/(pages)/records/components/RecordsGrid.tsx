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
import { Checkbox } from "@/components/ui/checkbox";
import { useAddRow, useUpdateRow, TableSchema } from "../hooks/useRecords";
import { useRecordsStore } from "../store";
import { ColumnHeader } from "./ColumnHeader";
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
      value={value as string || ""}
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
    <Select value={initialValue || ""} onValueChange={onValueChange}>
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

  const {
    selectedRowIds,
    toggleRowSelection,
    selectAllRows,
    clearSelection,
    sortColumn,
    sortDirection,
    filters,
    activeColumnId,
  } = useRecordsStore();

  // Apply client-side filtering and sorting for now
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([col, filter]) => {
      result = result.filter((row) => {
        const value = String(row[col] || "").toLowerCase();
        const filterVal = String(filter.value).toLowerCase();

        switch (filter.operator) {
          case "eq":
            return value === filterVal;
          case "neq":
            return value !== filterVal;
          case "contains":
            return value.includes(filterVal);
          case "gt":
            return Number(row[col]) > Number(filter.value);
          case "lt":
            return Number(row[col]) < Number(filter.value);
          default:
            return true;
        }
      });
    });

    // Apply sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [data, filters, sortColumn, sortDirection]);

  // Generate Columns from Schema
  const columns = useMemo(() => {
    if (!schema) return [];

    const cols: ColumnDef<any>[] = [
      // Selection column
      {
        id: "_select",
        header: () => {
          const allSelected = processedData.length > 0 &&
            processedData.every((row) => selectedRowIds.has(row.id));
          return (
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllRows(processedData.map((r) => r.id));
                } else {
                  clearSelection();
                }
              }}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRowIds.has(row.original.id)}
            onCheckedChange={() => toggleRowSelection(row.original.id)}
          />
        ),
        size: 40,
      },
      // Data columns
      ...schema.columns.map((col) => ({
        accessorKey: col.id,
        header: () => (
          <ColumnHeader columnId={col.id} columnName={col.name} columnType={col.type} />
        ),
        cell: (props: any) => {
          if (col.id === "id" || col.id === "_created" || col.id === "_updated") {
            const val = props.getValue();
            if (col.id === "id") {
              return <span className="text-xs text-muted-foreground font-mono">{val as string}</span>;
            }
            return <span className="text-xs text-muted-foreground">{val ? format(new Date(val as string), "MMM d, yyyy") : ""}</span>;
          }
          if (col.type === "date") return <DateCell {...props} />;
          if (col.type === "select") return <SelectCell {...props} />;
          return <TextCell {...props} />;
        },
        size: 200,
      })),
    ];

    return cols;
  }, [schema, selectedRowIds, processedData, selectAllRows, clearSelection, toggleRowSelection]);

  // Table Instance
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      schema,
      updateData: (rowIndex, columnId, value) => {
        const row = processedData[rowIndex];
        updateRow.mutate({
          rowId: row.id,
          updates: { [columnId]: value }
        });
      },
    },
  });

  // New Row Handler
  const handleAddRow = () => {
    addRow.mutate({});
  };

  return (
    <Table>
      <TableHeader className="bg-gray-50 sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize() }}
                className={cn(
                  "px-2 py-2 border-b border-r text-left font-medium text-muted-foreground text-xs uppercase tracking-wide",
                  activeColumnId === header.id && "bg-blue-100"
                )}
              >
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
            <TableRow
              key={row.id}
              className={cn(
                "hover:bg-gray-50/50",
                selectedRowIds.has(row.original.id) && "bg-blue-50/50"
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="p-0 px-3 py-2 border-b border-r">
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
  );
}
