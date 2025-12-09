"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";

interface StepPathPickerProps {
  sourceStep: WorkflowStep;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

interface SchemaNode {
  name: string;
  type: string;
  path: string;
  children?: SchemaNode[];
}

export function StepPathPicker({ sourceStep, onSelect, onCancel }: StepPathPickerProps) {
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([""]));

  useEffect(() => {
    const fetchSchema = async () => {
      if (!sourceStep.toolkitSlug || !sourceStep.toolId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/connections/schemas/composio/toolkits/${sourceStep.toolkitSlug}/${sourceStep.toolId}`
        );
        if (!res.ok) throw new Error("Failed to fetch schema");
        const data = await res.json();
        setSchema(data.outputParameters || {});
      } catch (e) {
        console.error("Failed to fetch schema:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [sourceStep.toolkitSlug, sourceStep.toolId]);

  const schemaTree = schema ? parseSchemaToTree(schema, "") : [];

  const toggleExpand = (path: string) => {
    const next = new Set(expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedPaths(next);
  };

  const renderNode = (node: SchemaNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);
    const isLeaf = !hasChildren;

    return (
      <div key={node.path}>
        <button
          onClick={() => (isLeaf ? onSelect(node.path) : toggleExpand(node.path))}
          className={`w-full flex items-center gap-1.5 py-1.5 px-2 text-xs hover:bg-muted/50 rounded transition-colors ${
            isLeaf ? "text-blue-600 hover:text-blue-700" : "text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren && (
            <ChevronRight
              className={`h-3 w-3 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
          {!hasChildren && <span className="w-3" />}
          <span className="font-medium">{node.name}</span>
          <span className="text-muted-foreground">({node.type})</span>
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium">Select output path</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tree */}
      <div className="max-h-64 overflow-y-auto py-1">
        {schemaTree.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">
            No output schema available
          </p>
        ) : (
          schemaTree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}

function parseSchemaToTree(
  schema: Record<string, unknown>,
  basePath: string
): SchemaNode[] {
  const properties = (schema as { properties?: Record<string, unknown> })?.properties;
  if (!properties) {
    // Maybe it's already properties at root
    if (typeof schema === "object" && !Array.isArray(schema)) {
      return Object.entries(schema).map(([key, value]) => {
        const prop = value as { type?: string; properties?: Record<string, unknown> };
        const path = basePath ? `${basePath}.${key}` : key;
        const children =
          prop?.type === "object" && prop.properties
            ? parseSchemaToTree({ properties: prop.properties }, path)
            : undefined;
        return {
          name: key,
          type: prop?.type || "unknown",
          path,
          children,
        };
      });
    }
    return [];
  }

  return Object.entries(properties).map(([key, value]) => {
    const prop = value as { type?: string; properties?: Record<string, unknown> };
    const path = basePath ? `${basePath}.${key}` : key;
    const children =
      prop?.type === "object" && prop.properties
        ? parseSchemaToTree({ properties: prop.properties }, path)
        : undefined;
    return {
      name: key,
      type: prop?.type || "unknown",
      path,
      children,
    };
  });
}

