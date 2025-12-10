"use client";

import { X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDocsStore } from "../../store";
import { TitleEditor } from "./TitleEditor";
import { TagEditor } from "./TagEditor";
import { DescriptionEditor } from "./DescriptionEditor";
import { DocumentStats } from "./DocumentStats";
import { Separator } from "@/components/ui/separator";

interface PropertiesPanelProps {
  docId: string;
}

export function PropertiesPanel({ docId }: PropertiesPanelProps) {
  const isPropertiesOpen = useDocsStore((state) => state.isPropertiesOpen);
  const setPropertiesOpen = useDocsStore((state) => state.setPropertiesOpen);
  const document = useDocsStore((state) => state.document);

  if (!document) return null;

  return (
    <Sheet open={isPropertiesOpen} onOpenChange={setPropertiesOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Document Properties
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1">
          <TitleEditor docId={docId} />

          <Separator />

          <DescriptionEditor docId={docId} />

          <Separator />

          <TagEditor docId={docId} />

          <Separator />

          <DocumentStats />
        </div>
      </SheetContent>
    </Sheet>
  );
}
