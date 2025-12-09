import type { JSONSchema } from "@/app/api/workflows/types/schemas";

/**
 * Converts JSON Schema to Zod code string.
 * Generated code can be used directly in createStep() declarations.
 */
export function generateZodCodeString(schema: JSONSchema | undefined): string {
  if (!schema || Object.keys(schema).length === 0) {
    return "z.any()";
  }

  const { type, properties, items, required = [], enum: enumValues } = schema;

  // Handle enum
  if (enumValues && enumValues.length > 0) {
    const values = enumValues.map((v) => JSON.stringify(v)).join(", ");
    return `z.enum([${values}])`;
  }

  switch (type) {
    case "string":
      return "z.string()";

    case "number":
    case "integer":
      return type === "integer" ? "z.number().int()" : "z.number()";

    case "boolean":
      return "z.boolean()";

    case "array":
      const itemsZod = generateZodCodeString(items);
      return `z.array(${itemsZod})`;

    case "object":
      if (!properties || Object.keys(properties).length === 0) {
        return "z.object({})";
      }

      const props = Object.entries(properties).map(([key, propSchema]) => {
        const propZod = generateZodCodeString(propSchema as JSONSchema);
        const isRequired = required.includes(key);
        const finalZod = isRequired ? propZod : `${propZod}.optional()`;
        return `  ${safePropertyName(key)}: ${finalZod}`;
      });

      return `z.object({\n${props.join(",\n")}\n})`;

    default:
      return "z.any()";
  }
}

/**
 * Ensures property name is valid JS identifier or quotes it.
 */
function safePropertyName(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return `"${name}"`;
}

