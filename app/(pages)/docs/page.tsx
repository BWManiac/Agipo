"use client";

import { useEffect } from "react";
import { DocumentCatalog, CreateDocumentButton } from "./components/catalog";
import { useDocsStore } from "./store";

export default function DocsPage() {
  const documents = useDocsStore((state) => state.documents);
  const isLoading = useDocsStore((state) => state.isLoading);
  const fetchDocuments = useDocsStore((state) => state.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your documents with AI assistance
          </p>
        </div>
        <CreateDocumentButton />
      </div>

      <DocumentCatalog documents={documents} isLoading={isLoading} />
    </div>
  );
}
