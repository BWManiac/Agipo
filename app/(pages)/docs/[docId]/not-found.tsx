import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-muted rounded-full mb-4">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Document not found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The document you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Link href="/docs">
        <Button>Back to Documents</Button>
      </Link>
    </div>
  );
}
