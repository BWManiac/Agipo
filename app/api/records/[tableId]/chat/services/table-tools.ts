/**
 * Table Tools for Records Chat
 *
 * These tools allow agents to interact with table data.
 */

import { tool, type Tool } from "ai";
import { z } from "zod";
import {
  getTableSchema,
  queryTable,
  insertRow,
  updateRow,
  deleteRow,
} from "@/app/api/records/services";

// Schema definitions
const schemaParams = z.object({
  _unused: z.string().optional().describe("This parameter is not used"),
});

const readParams = z.object({
  filter: z
    .object({
      column: z.string().describe("Column to filter by"),
      operator: z.enum(["eq", "neq", "gt", "lt", "contains"]).describe("Filter operator"),
      value: z.union([z.string(), z.number(), z.boolean()]).describe("Value to compare"),
    })
    .optional()
    .describe("Optional filter condition"),
  sort: z
    .object({
      column: z.string().describe("Column to sort by"),
      descending: z.boolean().optional().describe("Sort descending (default: false)"),
    })
    .optional()
    .describe("Optional sort order"),
  limit: z.number().optional().describe("Max rows to return (default: 100)"),
});

const writeParams = z.object({
  data: z.record(z.string(), z.unknown()).describe("Object with column values. Keys are column IDs."),
});

const updateParams = z.object({
  rowId: z.string().describe("The ID of the row to update"),
  updates: z.record(z.string(), z.unknown()).describe("Object with column values to update"),
});

const deleteParams = z.object({
  rowId: z.string().describe("The ID of the row to delete"),
});

// Helper to create tools with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTool(config: any): Tool {
  return tool(config) as Tool;
}

/**
 * Build table-specific tools for an agent
 */
export async function buildTableTools(
  tableId: string,
  userId: string
): Promise<Record<string, Tool>> {
  const tools: Record<string, Tool> = {
    sys_table_schema: createTool({
      description: "Get the schema of the current table, including all column names and types",
      parameters: schemaParams,
      execute: async () => {
        try {
          const schema = await getTableSchema(tableId);
          if (!schema) {
            return { success: false, error: "Table not found" };
          }
          return {
            success: true,
            schema: {
              name: schema.name,
              description: schema.description,
              columns: schema.columns.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                required: c.required,
                options: c.options,
              })),
            },
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    }),

    sys_table_read: createTool({
      description: "Query rows from the table. Can filter by column values and sort results.",
      parameters: readParams,
      execute: async ({ filter, sort, limit }: z.infer<typeof readParams>) => {
        try {
          const options: Record<string, unknown> = {};

          if (filter) {
            options.filter = {
              col: filter.column,
              op: filter.operator,
              val: filter.value,
            };
          }

          if (sort) {
            options.sort = {
              col: sort.column,
              desc: sort.descending || false,
            };
          }

          options.limit = limit || 100;

          const rows = await queryTable(tableId, options);
          return {
            success: true,
            rowCount: rows.length,
            rows,
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    }),

    sys_table_write: createTool({
      description: "Insert a new row into the table. Provide values for the columns you want to set.",
      parameters: writeParams,
      execute: async ({ data }: z.infer<typeof writeParams>) => {
        try {
          // Add actor info for activity logging
          const rowData = {
            ...data,
            _actor: { type: "agent", userId },
          };
          const result = await insertRow(tableId, rowData);
          return {
            success: true,
            rowId: result.id,
            message: `Successfully inserted row with ID ${result.id}`,
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    }),

    sys_table_update: createTool({
      description: "Update an existing row by its ID. Provide the row ID and the columns to update.",
      parameters: updateParams,
      execute: async ({ rowId, updates }: z.infer<typeof updateParams>) => {
        try {
          // Add actor info for activity logging
          const updateData = {
            ...updates,
            _actor: { type: "agent", userId },
          };
          await updateRow(tableId, rowId, updateData);
          return {
            success: true,
            message: `Successfully updated row ${rowId}`,
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    }),

    sys_table_delete: createTool({
      description: "Delete a row from the table by its ID",
      parameters: deleteParams,
      execute: async ({ rowId }: z.infer<typeof deleteParams>) => {
        try {
          await deleteRow(tableId, rowId);
          return {
            success: true,
            message: `Successfully deleted row ${rowId}`,
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    }),
  };

  return tools;
}
