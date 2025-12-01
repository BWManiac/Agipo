import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkflowSummary } from "@/_tables/types";

type ToolCardProps = {
  workflow: WorkflowSummary;
};

export function ToolCard({ workflow }: ToolCardProps) {
  return (
    <Link
      href={`/tools/editor?id=${workflow.id}`}
      className="block h-full"
    >
      <Card className="h-full transition-all border-border/40 hover:border-border/80 hover:shadow-md">
        <CardHeader>
          <CardTitle>{workflow.name}</CardTitle>
          <CardDescription>{workflow.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          {workflow.lastModified && (
            <Badge variant="outline">
              Updated {new Date(workflow.lastModified).toLocaleDateString()}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}




