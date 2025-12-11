# Git Branching Guide for Product Managers

## What is a Branch? (Simple Explanation)

Think of branches like **different versions of your project** that you can work on simultaneously:

- **Main branch** = Your "production" or "stable" version
- **Feature branches** = Separate copies where you (or AI agents) can experiment without breaking the main version
- You can switch between branches instantly to see different versions
- When you're happy with a branch, you can "merge" it back into main

**Real-world analogy:** It's like having multiple drafts of a document. You keep the original safe, make copies to edit, and when a copy looks good, you replace the original with it.

---

## Using Cursor's Visual Git Tools

### 1. **See Your Current Branch**

**Location:** Bottom-left status bar (look for `✓ main`)

This tells you which branch you're currently viewing/editing. In your case, you're on `main`.

### 2. **Switch Between Branches**

**Method 1: Click the Branch Name**
1. Click on `main` in the bottom-left status bar
2. A menu will appear showing all available branches
3. Click any branch to switch to it

**Method 2: Source Control Panel**
1. Open the Source Control panel (left sidebar, looks like a branch icon)
2. Click the branch name at the top of the panel
3. Select a branch from the list

**What happens:** Cursor will switch your entire workspace to that branch's version of the code. It's instant!

### 3. **Create a New Branch**

**For AI Agent Work:**
1. Click the branch name in the bottom-left (`main`)
2. Click "Create new branch..."
3. Give it a descriptive name like: `ai-agent-feature-x` or `agent-task-123`
4. Press Enter

**Now you're on the new branch!** Any changes you or AI agents make will be on this branch, not main.

### 4. **Review Changes in a Branch**

**View All Changes:**
1. Open the Source Control panel (left sidebar)
2. You'll see a list of all modified files
3. Click any file to see what changed (green = added, red = removed)

**Compare Branches:**
1. Right-click on a branch name (in the branch picker)
2. Select "Compare with..." or "Compare with Working Tree"
3. See all differences between branches side-by-side

### 5. **Commit Changes**

**When you or an AI agent makes changes:**
1. Open Source Control panel
2. You'll see files under "Changes"
3. Click the `+` next to files you want to include (or click `+` next to "Changes" to stage all)
4. Type a commit message in the box at the top (e.g., "AI agent: Added new feature X")
5. Click the checkmark (✓) or press `Cmd+Shift+Enter` to commit

### 6. **Push/Pull Changes**

**Push (send your branch to remote):**
- Click the "Sync Changes" button in the Source Control panel
- Or click the up arrow (↑) in the bottom status bar

**Pull (get latest changes):**
- Click the down arrow (↓) in the bottom status bar
- Or use the "..." menu in Source Control panel → "Pull"

---

## Recommended Workflow for AI Agents

### Step-by-Step Process:

1. **Create a branch for each AI task**
   - Branch name: `ai-agent-[task-description]`
   - Example: `ai-agent-add-login-feature`

2. **Switch to that branch**
   - Click branch name → select your new branch

3. **Let AI agents work**
   - They'll make changes on this branch
   - Main branch stays untouched

4. **Review the changes**
   - Use Source Control panel to see what changed
   - Click files to review the actual code changes

5. **If you like it: Merge to main**
   - Switch back to `main` branch
   - Use Source Control panel → "..." menu → "Merge Branch..."
   - Select the branch you want to merge

6. **If you don't like it: Delete the branch**
   - Switch to `main` (or another branch)
   - Right-click the branch → "Delete Branch"

---

## Visual Indicators in Cursor

**Bottom Status Bar:**
- `✓ main` = Current branch name
- `0 ↓ 1 ↑` = 0 incoming changes, 1 outgoing change (needs push)

**Source Control Panel:**
- **Changes** = Files you've modified but not committed
- **Staged Changes** = Files ready to commit
- **Sync Changes** button = Push/pull your branch

---

## Common Scenarios

### "I want to see what an AI agent did"
1. Switch to the agent's branch (click branch name → select branch)
2. Open Source Control panel to see changes
3. Click files to review code

### "I want to try something without breaking main"
1. Create a new branch
2. Make your changes
3. If it works: merge to main
4. If it doesn't: just switch back to main (your changes stay on the branch)

### "I have changes on main but want to move them to a branch"
1. Don't commit yet
2. Create a new branch (your uncommitted changes will come with you)
3. Commit on the new branch

### "I want to see what's different between two branches"
1. Switch to one branch
2. Right-click the other branch → "Compare with..."
3. Review the differences

---

## Safety Tips

✅ **Always create a branch before letting AI agents work**
✅ **Review changes in Source Control panel before merging**
✅ **Keep main branch clean** - only merge when you're confident
✅ **You can't break anything** - branches are isolated copies

❌ **Don't work directly on main** if you're experimenting
❌ **Don't delete main branch** (you can't anyway, it's protected)

---

## Quick Reference

| Action | How to Do It |
|--------|-------------|
| See current branch | Look at bottom-left status bar |
| Switch branch | Click branch name → select branch |
| Create branch | Click branch name → "Create new branch..." |
| See changes | Open Source Control panel (left sidebar) |
| Commit changes | Source Control → type message → click ✓ |
| Push branch | Click "Sync Changes" or ↑ in status bar |
| Merge branch | Switch to main → Source Control → "..." → "Merge Branch..." |
| Delete branch | Right-click branch → "Delete Branch" |

---

## Need Help?

If you're ever unsure:
- **Branches are safe** - you can always switch back
- **Nothing is permanent** until you merge
- **You can have multiple branches** - they don't interfere with each other

Remember: The visual tools in Cursor make this much easier than command-line Git. You rarely need to type anything!


