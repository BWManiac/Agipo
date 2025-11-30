import { z } from "zod";
import { TableSchema } from "../../io";

/**
 * Generates a dynamic Zod validator based on the Table Schema.
 */
export function generateRowValidator(schema: TableSchema) {
  const shape: Record<string, any> = {};
  
  schema.columns.forEach((col) => {
    // Skip system columns in validation if they are auto-generated
    if (col.id === "id" || col.id === "_created" || col.id === "_updated") return;

    let validator;
    switch (col.type) {
      case "number":
        validator = z.number();
        break;
      case "date":
        validator = z.string().datetime().or(z.string()); // Allow strict ISO or plain date string
        break;
      case "boolean":
        validator = z.boolean();
        break;
      case "select":
        validator = z.string();
        if (col.options && col.options.length > 0) {
          validator = z.enum(col.options as [string, ...string[]]);
        }
        break;
      case "text":
      default:
        validator = z.string();
    }

    if (!col.required) validator = validator.optional().or(z.null());
    
    // Use Name or ID? Ideally ID, but user might send Name. 
    // For now assume payload keys match Schema IDs.
    shape[col.id] = validator;
  });

  return z.object(shape);
}

