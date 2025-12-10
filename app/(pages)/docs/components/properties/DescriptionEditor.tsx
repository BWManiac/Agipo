"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDocsStore } from "../../store";

interface DescriptionEditorProps {
  docId: string;
}

export function DescriptionEditor({ docId }: DescriptionEditorProps) {
  const document = useDocsStore((state) => state.document);
  const setDocument = useDocsStore((state) => state.setDocument);
  const [description, setDescription] = useState(
    document?.frontmatter.description || ""
  );

  useEffect(() => {
    if (document) {
      setDescription(document.frontmatter.description || "");
    }
  }, [document]);

  const handleBlur = async () => {
    if (!document || description === (document.frontmatter.description || ""))
      return;

    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (error) {
      console.error("Failed to update description:", error);
      setDescription(document.frontmatter.description || "");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add a description..."
        rows={3}
      />
    </div>
  );
}
