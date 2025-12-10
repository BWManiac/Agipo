"use client";

import { TitleEditor } from "./TitleEditor";
import { SaveStatus } from "./SaveStatus";

export function DocumentHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        <TitleEditor />
      </div>
      <SaveStatus />
    </div>
  );
}
