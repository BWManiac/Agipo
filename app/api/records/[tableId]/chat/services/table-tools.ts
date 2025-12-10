/**
 * Table Tools for Records Chat
 *
 * These tools allow agents to interact with table data.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  getTableSchema,
  queryTable,
  insertRow,
  updateRow,
  deleteRow,
} from "@/app/api/records/services";

/**
 * Build table-specific tools for an agent
 */
export async function buildTableTools(tableId: string, userId: string) {
  return {
    sys_table_schema: tool({
      description: "Get the schema of the current table, including all column names and types",
      parameters: z.object({}),
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

    sys_table_read: tool({
      description: "Query rows from the table. Can filter by column values and sort results.",
      parameters: z.object({
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
      }),
      execute: async ({ filter, sort, limit }) => {
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

    sys_table_write: tool({
      description: "Insert a new row into the table. Provide values for the columns you want to set.",
      parameters: z.object({
        data: z.record(z.unknown()).describe("Object with column values. Keys are column IDs."),
      }),
      execute: async ({ data }) => {
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

    sys_table_update: tool({
      description: "Update an existing row by its ID. Provide the row ID and the columns to update.",
      parameters: z.object({
        rowId: z.string().describe("The ID of the row to update"),
        updates: z.record(z.unknown()).describe("Object with column values to update"),
      }),
      execute: async ({ rowId, updates }) => {
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

    sys_table_delete: tool({
      description: "Delete a row from the table by its ID",
      parameters: z.object({
        rowId: z.string().describe("The ID of the row to delete"),
      }),
      execute: async ({ rowId }) => {
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
}
