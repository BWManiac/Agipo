"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../../store";

export function CreateDocumentButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useDocsStore((state) => state.createDocument);

  const handleCreate = async () => {
    setIsCreating(true);
    const docId = await createDocument("Untitled");
    if (docId) {
      router.push(`/docs/${docId}`);
    }
    setIsCreating(false);
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating}>
      <Plus className="h-4 w-4 mr-2" />
      {isCreating ? "Creating..." : "New Document"}
    </Button>
  );
}
