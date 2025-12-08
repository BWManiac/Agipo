import { z } from "zod";
import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import type { StepBindings } from "@/app/api/workflows/types/bindings";

/**
 * Context passed between transpiler generators.
 * Tracks variable names, imports, and bindings as code is generated.
 */
export interface TranspilerContext {
  /** Maps step IDs to generated variable names */
  stepVarMap: Map<string, string>;
  /** Tracks imports needed in generated code */
  usedImports: Set<string>;
  /** All step bindings keyed by step ID */
  bindings: Record<string, StepBindings>;
}

/**
 * Options for controlling transpilation output.
 */
export interface TranspilerOptions {
  /** Include comments in generated code */
  includeComments?: boolean;
}

/**
 * Result of transpilation.
 */
export interface TranspilerResult {
  /** Generated TypeScript code */
  code: string;
  /** Metadata extracted during transpilation */
  metadata: TranspilerMetadata;
  /** Errors encountered (empty if successful) */
  errors: string[];
}

/**
 * Metadata about the transpiled workflow.
 */
export interface TranspilerMetadata {
  /** Toolkit slugs that require connected accounts */
  requiredConnections: string[];
  /** Number of steps in workflow */
  stepCount: number;
}

/**
 * Input to the transpiler.
 */
export interface TranspilerInput {
  definition: WorkflowDefinition;
  bindings: Record<string, StepBindings>;
}

/** Validator for TranspilerInput */
export const TranspilerInputValidator = z.object({
  definition: z.any(), // Already validated by WorkflowDefinitionValidator
  bindings: z.record(z.string(), z.any()),
});

