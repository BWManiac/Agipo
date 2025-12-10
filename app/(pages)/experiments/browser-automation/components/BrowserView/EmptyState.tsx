"use client";

import { useBrowserStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";

export function EmptyState() {
  const openNewSessionDialog = useBrowserStore(
    (state) => state.openNewSessionDialog
  );

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-6">
          <Globe className="h-10 w-10 text-gray-400" />
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-semibold mb-2">No Session Selected</h2>
        <p className="text-muted-foreground mb-6">
          Create a browser session to start automating. You&apos;ll be able to
          control the browser using natural language commands.
        </p>

        {/* CTA */}
        <Button onClick={openNewSessionDialog} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Session
        </Button>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-2xl mb-2">????</div>
            <div className="font-medium text-sm">Natural Language</div>
            <div className="text-xs text-muted-foreground">
              Control browser with plain English
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-2xl mb-2">????</div>
            <div className="font-medium text-sm">Live Preview</div>
            <div className="text-xs text-muted-foreground">
              Watch actions execute in real-time
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-2xl mb-2">????</div>
            <div className="font-medium text-sm">Extract Data</div>
            <div className="text-xs text-muted-foreground">
              Pull structured data from pages
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-2xl mb-2">????</div>
            <div className="font-medium text-sm">Save Profiles</div>
            <div className="text-xs text-muted-foreground">
              Persist cookies and credentials
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
