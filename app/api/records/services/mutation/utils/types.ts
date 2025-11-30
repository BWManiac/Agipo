import pl from "nodejs-polars";

/**
 * Gets the Polars type for a schema column type.
 */
export function getPolarsTypeForSchemaType(schemaType: string): typeof pl.Utf8 | typeof pl.Float64 | typeof pl.Bool {
  switch (schemaType) {
    case "text":
      return pl.Utf8;
    case "number":
      return pl.Float64;
    case "date":
      return pl.Utf8; // Dates stored as ISO strings
    case "boolean":
      return pl.Bool;
    case "select":
      return pl.Utf8; // Select values are strings
    default:
      return pl.Utf8;
  }
}

