# Implementation Phases: Direct Agent Configuration Editing

**Feature:** Agent Configuration Editing  
**Task Document:** `01A-Direct-Agent-Configuration-Editing-Task.md`

---

## Goal

Enable users to directly edit agent configuration (systemPrompt, model, maxSteps, objectives, guardrails) through the Config tab with proper backend persistence.

## Overall File Impact

- **CREATE:** `app/api/workforce/[agentId]/config/route.ts`
- **MODIFY:** `app/api/workforce/services/agent-config.ts` 
- **MODIFY:** `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`

---

## Phase 1: Backend API Foundation

### Goal
Create the PATCH endpoint and service methods for updating agent configuration fields.

### File Impact
- **CREATE:** `app/api/workforce/[agentId]/config/route.ts`
- **MODIFY:** `app/api/workforce/services/agent-config.ts`

### Implementation

#### app/api/workforce/[agentId]/config/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isValidModelId } from "../../chat/services/models";
import {
  updateAgentSystemPrompt,
  updateAgentModel,
  updateAgentMaxSteps,
  updateAgentObjectives,
  updateAgentGuardrails
} from "@/app/api/workforce/services/agent-config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  const body = await req.json();
  const { systemPrompt, model, maxSteps, objectives, guardrails } = body;

  const updated = [];
  const errors = [];

  // Validate and update each field
  try {
    if (systemPrompt !== undefined) {
      if (systemPrompt.length < 10) {
        errors.push("systemPrompt: Must be at least 10 characters");
      } else {
        await updateAgentSystemPrompt(params.agentId, systemPrompt);
        updated.push("systemPrompt");
      }
    }

    if (model !== undefined) {
      if (!isValidModelId(model)) {
        errors.push("model: Invalid model ID");
      } else {
        await updateAgentModel(params.agentId, model);
        updated.push("model");
      }
    }

    if (maxSteps !== undefined) {
      if (!Number.isInteger(maxSteps) || maxSteps < 1) {
        errors.push("maxSteps: Must be positive integer");
      } else {
        await updateAgentMaxSteps(params.agentId, maxSteps);
        updated.push("maxSteps");
      }
    }

    if (objectives !== undefined) {
      await updateAgentObjectives(params.agentId, objectives);
      updated.push("objectives");
    }

    if (guardrails !== undefined) {
      await updateAgentGuardrails(params.agentId, guardrails);
      updated.push("guardrails");
    }

    return NextResponse.json({
      success: updated.length > 0,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("[config] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}
```

#### app/api/workforce/services/agent-config.ts (additions)
```typescript
// Add these functions to existing file

export async function updateAgentSystemPrompt(agentId: string, systemPrompt: string): Promise<void> {
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  let fileContent = await fs.readFile(agentFile, "utf-8");
  
  // Escape quotes in systemPrompt
  const escapedPrompt = systemPrompt.replace(/"/g, '\\"');
  
  // Replace systemPrompt field
  const pattern = /(systemPrompt:\s*)"[^"]*"(\s*,?)/;
  if (!fileContent.match(pattern)) {
    throw new Error("Could not find systemPrompt field");
  }
  
  fileContent = fileContent.replace(pattern, `$1"${escapedPrompt}"$2`);
  await fs.writeFile(agentFile, fileContent, "utf-8");
}

export async function updateAgentModel(agentId: string, model: string): Promise<void> {
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  let fileContent = await fs.readFile(agentFile, "utf-8");
  
  const pattern = /(model:\s*)"[^"]*"(\s*,?)/;
  if (!fileContent.match(pattern)) {
    throw new Error("Could not find model field");
  }
  
  fileContent = fileContent.replace(pattern, `$1"${model}"$2`);
  await fs.writeFile(agentFile, fileContent, "utf-8");
}

export async function updateAgentMaxSteps(agentId: string, maxSteps: number): Promise<void> {
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  let fileContent = await fs.readFile(agentFile, "utf-8");
  
  // Check if maxSteps exists
  const existingPattern = /(maxSteps:\s*)\d+(\s*,?)/;
  if (fileContent.match(existingPattern)) {
    fileContent = fileContent.replace(existingPattern, `$1${maxSteps}$2`);
  } else {
    // Add after model field
    const modelPattern = /(model:\s*"[^"]*")(\s*,?)/;
    fileContent = fileContent.replace(modelPattern, `$1$2\n  maxSteps: ${maxSteps},`);
  }
  
  await fs.writeFile(agentFile, fileContent, "utf-8");
}

export async function updateAgentObjectives(agentId: string, objectives: string[]): Promise<void> {
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  let fileContent = await fs.readFile(agentFile, "utf-8");
  
  // Build array string
  const objectivesString = objectives.map(o => `"${o.replace(/"/g, '\\"')}"`).join(", ");
  
  const pattern = /(objectives:\s*)\[[^\]]*\](\s*,?)/;
  fileContent = fileContent.replace(pattern, `$1[${objectivesString}]$2`);
  
  await fs.writeFile(agentFile, fileContent, "utf-8");
}

export async function updateAgentGuardrails(agentId: string, guardrails: string[]): Promise<void> {
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  let fileContent = await fs.readFile(agentFile, "utf-8");
  
  // Build array string
  const guardrailsString = guardrails.map(g => `"${g.replace(/"/g, '\\"')}"`).join(", ");
  
  const pattern = /(guardrails:\s*)\[[^\]]*\](\s*,?)/;
  fileContent = fileContent.replace(pattern, `$1[${guardrailsString}]$2`);
  
  await fs.writeFile(agentFile, fileContent, "utf-8");
}
```

### Acceptance Criteria
- [ ] PATCH endpoint accepts configuration updates
- [ ] Each field can be updated independently
- [ ] Validation rejects invalid models
- [ ] Validation rejects short systemPrompt
- [ ] Partial updates work (some fields succeed, others fail)

### Testing
```bash
# Test updating systemPrompt
curl -X PATCH http://localhost:3000/api/workforce/[agentId]/config \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "You are a helpful AI assistant that provides detailed answers."}'

# Test updating model
curl -X PATCH http://localhost:3000/api/workforce/[agentId]/config \
  -H "Content-Type: application/json" \
  -d '{"model": "google/gemini-2.5-flash"}'

# Test validation error
curl -X PATCH http://localhost:3000/api/workforce/[agentId]/config \
  -H "Content-Type: application/json" \
  -d '{"model": "invalid-model"}'

# Test multiple fields
curl -X PATCH http://localhost:3000/api/workforce/[agentId]/config \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "New prompt", "model": "google/gemini-2.5-flash", "maxSteps": 10}'

# Verify changes in file
cat _tables/agents/*/config.ts | grep -E "systemPrompt|model|maxSteps"
```

---

## Phase 2: Frontend Integration

### Goal
Wire up the ConfigTab save button to call the API with proper loading states and feedback.

### File Impact
- **MODIFY:** `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`

### Implementation

#### app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx
```typescript
// Add to imports
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Inside ConfigTab component, add state
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);

// Add save handler
const handleSave = async () => {
  // Validation
  if (systemPrompt.length < 10) {
    toast.error("System prompt must be at least 10 characters");
    return;
  }

  setIsSaving(true);
  setSaveError(null);

  try {
    const response = await fetch(`/api/workforce/${agentDetails.id}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        model,
        objectives: objectives.split("\n").filter(o => o.trim()),
        guardrails: guardrails.split("\n").filter(g => g.trim())
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save configuration");
    }

    if (data.errors && data.errors.length > 0) {
      toast.error(`Some fields failed: ${data.errors.join(", ")}`);
    } else {
      toast.success("Configuration saved successfully");
    }

    // Update local state if needed
    if (data.updated.includes("systemPrompt")) {
      // Refresh agent details if you have that capability
    }
  } catch (error) {
    console.error("Save error:", error);
    setSaveError(error.message);
    toast.error(error.message);
  } finally {
    setIsSaving(false);
  }
};

// Update Save button
<Button 
  onClick={handleSave}
  disabled={isSaving}
  className="w-full"
>
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</Button>

// Add error display if needed
{saveError && (
  <div className="text-sm text-red-500 mt-2">
    {saveError}
  </div>
)}
```

### Acceptance Criteria
- [ ] Save button triggers API call
- [ ] Loading state shows during save
- [ ] Success toast appears on successful save
- [ ] Error messages display for validation failures
- [ ] Button disabled during save operation

### Testing
1. **Manual UI Test:**
   - Open agent modal → Config tab
   - Edit systemPrompt field
   - Click "Save Changes"
   - Verify loading spinner appears
   - Verify success toast appears
   - Refresh page and verify changes persist

2. **Validation Test:**
   - Clear systemPrompt field
   - Click "Save Changes"
   - Verify error message appears

3. **Network Test:**
   - Open browser DevTools → Network tab
   - Click "Save Changes"
   - Verify PATCH request sent to `/api/workforce/[agentId]/config`
   - Verify request body contains correct fields

---

## Phase 3: Polish and Edge Cases

### Goal
Handle edge cases and improve user experience.

### File Impact
- **MODIFY:** `app/(pages)/workforce/components/agent-modal/components/tabs/ConfigTab.tsx`
- **MODIFY:** `app/api/workforce/[agentId]/config/route.ts`

### Implementation

#### Additional Frontend Improvements
```typescript
// Add dirty state tracking
const [isDirty, setIsDirty] = useState(false);

// Track changes
useEffect(() => {
  const hasChanges = 
    systemPrompt !== agentDetails.systemPrompt ||
    model !== agentDetails.model ||
    objectives !== agentDetails.objectives.join("\n");
  
  setIsDirty(hasChanges);
}, [systemPrompt, model, objectives, agentDetails]);

// Disable save if not dirty
<Button 
  onClick={handleSave}
  disabled={isSaving || !isDirty}
  className="w-full"
>
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    isDirty ? "Save Changes" : "No Changes"
  )}
</Button>

// Add unsaved changes warning
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isDirty]);
```

### Acceptance Criteria
- [ ] Save button disabled when no changes made
- [ ] Browser warns before leaving with unsaved changes
- [ ] All edge cases handled gracefully

### Testing
1. **Dirty State Test:**
   - Open Config tab
   - Verify "Save Changes" button shows "No Changes"
   - Edit a field
   - Verify button becomes enabled

2. **Navigation Warning Test:**
   - Make changes to config
   - Try to navigate away or close tab
   - Verify browser warning appears

---

## Summary

**Total Implementation Time:** ~4-6 hours

**Phase Breakdown:**
- Phase 1 (Backend API): 2 hours
- Phase 2 (Frontend Integration): 1.5 hours
- Phase 3 (Polish): 0.5 hours

**Risk Areas:**
- Regex patterns might not match all formatting variations
- File write conflicts if multiple saves happen simultaneously
- Model validation depends on `models.ts` being up-to-date

**Success Metrics:**
- Users can edit and save agent configuration
- Changes persist across page refreshes
- Clear feedback for both success and error states