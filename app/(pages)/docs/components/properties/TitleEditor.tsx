"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocsStore } from "../../store";

interface TitleEditorProps {
  docId: string;
}

export function TitleEditor({ docId }: TitleEditorProps) {
  const document = useDocsStore((state) => state.document);
  const setDocument = useDocsStore((state) => state.setDocument);
  const [title, setTitle] = useState(document?.frontmatter.title || "");

  useEffect(() => {
    if (document) {
      setTitle(document.frontmatter.title);
    }
  }, [document]);

  const handleBlur = async () => {
    if (!document || title === document.frontmatter.title) return;

    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      setTitle(document.frontmatter.title);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Document title"
      />
    </div>
  );
}
