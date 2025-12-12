# Git Worktrees Guide - For Parallel Development

**Purpose:** Learn how to use Git worktrees to work on multiple branches simultaneously without conflicts.

---

## What Problem Do Worktrees Solve?

**Without worktrees:**
- You can only check out ONE branch at a time
- Switching branches changes files in your working directory
- Running processes (dev servers, tests) break when you switch branches
- Multiple AI agents can't work in parallel on different features

**With worktrees:**
- Each branch gets its own folder
- Multiple branches checked out simultaneously
- Each folder can run its own dev server
- No interference between features

---

## Basic Concepts

### Worktree = Separate Folder for Each Branch

```
Main Repository:
/Users/zen/Desktop/Code/agipo/          ← Main worktree (main branch)
  └── .git/                             ← Shared Git repository

Worktrees:
/Users/zen/.claude-worktrees/agipo/
  ├── feature-chat/                      ← Worktree 1 (feature/chat branch)
  ├── feature-browser/                   ← Worktree 2 (feature/browser branch)
  └── feature-agents/                    ← Worktree 3 (feature/agents branch)
```

**Key Point:** All worktrees share the same `.git` repository, but each has its own files.

---

## Common Commands

### Create a Worktree

```bash
# Basic syntax
git worktree add <path> <branch>

# Example: Create worktree for a feature branch
git worktree add ../worktrees/feature-chat feature/chat-file-uploads

# If branch doesn't exist, create it
git worktree add -b feature/new-feature ../worktrees/new-feature
```

**Rules:**
- Worktree path must be **outside** the main repository folder
- Can't create worktree inside another worktree
- Each branch can only be checked out in one worktree at a time

### List All Worktrees

```bash
git worktree list
```

**Output:**
```
/Users/zen/Desktop/Code/agipo          main [main]
/Users/zen/.claude-worktrees/agipo/feature-chat    feature/chat-file-uploads [feature/chat-file-uploads]
/Users/zen/.claude-worktrees/agipo/feature-browser  feature/browser-automation [feature/browser-automation]
```

### Remove a Worktree

```bash
# Safe removal (Git cleans up properly)
git worktree remove <path>

# Example
git worktree remove ../worktrees/feature-chat

# Force removal (if there are uncommitted changes)
git worktree remove --force ../worktrees/feature-chat
```

**Important:** Always use `git worktree remove`, don't just delete the folder!

### Prune Worktrees

If you manually deleted a worktree folder, clean up Git's records:

```bash
git worktree prune
```

---

## Practical Workflow for AI Agents

### Setup: Create Worktrees for Each Feature

```bash
# 1. Create worktree for chat feature
git worktree add ../worktrees/feature-chat feature/chat-file-uploads

# 2. Create worktree for browser feature
git worktree add ../worktrees/feature-browser feature/browser-automation

# 3. Create worktree for agents feature
git worktree add ../worktrees/feature-agents feature/agent-networks
```

### Working in Each Worktree

**Terminal 1 - Chat Feature:**
```bash
cd /Users/zen/.claude-worktrees/agipo/feature-chat
npm run dev  # Runs on port 3000
# AI agent works here, makes changes, commits
```

**Terminal 2 - Browser Feature:**
```bash
cd /Users/zen/.claude-worktrees/agipo/feature-browser
npm run dev  # Runs on port 3001 (different folder!)
# Different AI agent works here, no conflicts
```

**Terminal 3 - Agents Feature:**
```bash
cd /Users/zen/.claude-worktrees/agipo/feature-agents
npm run dev  # Runs on port 3002
# Another AI agent works here
```

### VS Code: Opening Different Worktrees

**Option 1: Open Different Folders**
- File → Open Folder → Select worktree folder
- Each folder is independent

**Option 2: Multi-root Workspace**
- File → Add Folder to Workspace
- Add multiple worktree folders
- Switch between them in the explorer

### Committing Changes

```bash
# In any worktree folder
cd ../worktrees/feature-chat
git add .
git commit -m "Add chat file upload feature"
git push origin feature/chat-file-uploads
```

**Important:** Commits in one worktree are immediately visible to all other worktrees (they share the same Git repository).

---

## Advanced Usage

### Switching Branches in a Worktree

You can switch which branch a worktree checks out:

```bash
cd ../worktrees/feature-chat
git checkout feature/other-branch
```

**Note:** This changes the branch for that worktree, but the worktree folder stays the same.

### Checking Out Same Branch in Multiple Worktrees

By default, Git prevents this. To force it:

```bash
git worktree add --force ../worktrees/feature-chat-2 feature/chat-file-uploads
```

**Warning:** This can cause conflicts if both worktrees have uncommitted changes.

### Finding Which Worktree You're In

```bash
# Check current directory
pwd

# Or check Git
git rev-parse --git-dir
# Output: /Users/zen/Desktop/Code/agipo/.git/worktrees/feature-chat
```

---

## Best Practices

### ✅ DO:

1. **Use descriptive worktree paths**
   ```bash
   git worktree add ../worktrees/feature-chat-file-uploads feature/chat-file-uploads
   ```

2. **Keep worktrees organized**
   ```bash
   # Use a consistent location
   ~/.claude-worktrees/agipo/
   ```

3. **Remove worktrees when done**
   ```bash
   git worktree remove ../worktrees/feature-chat
   ```

4. **List worktrees regularly**
   ```bash
   git worktree list  # See what's active
   ```

### ❌ DON'T:

1. **Don't manually delete worktree folders**
   - Always use `git worktree remove`
   - Or run `git worktree prune` after manual deletion

2. **Don't create worktrees inside the main repo**
   ```bash
   # ❌ BAD
   git worktree add ./worktree feature/branch
   
   # ✅ GOOD
   git worktree add ../worktrees/feature-branch feature/branch
   ```

3. **Don't commit from wrong worktree**
   - Always check `pwd` or `git branch` to confirm location

4. **Don't let worktrees accumulate**
   - Clean up unused worktrees regularly

---

## Troubleshooting

### "Worktree path is already registered"

**Problem:** Git thinks a worktree already exists at that path.

**Solution:**
```bash
# Check if it really exists
git worktree list

# If not, prune it
git worktree prune

# Or force remove
git worktree remove --force <path>
```

### "Branch is already checked out"

**Problem:** That branch is checked out in another worktree.

**Solution:**
```bash
# Find which worktree has it
git worktree list

# Either:
# 1. Switch that worktree to a different branch
# 2. Remove that worktree
# 3. Use --force (not recommended)
```

### "Cannot lock ref"

**Problem:** Another Git operation is in progress.

**Solution:**
```bash
# Check for lock files
ls -la .git/worktrees/*/HEAD.lock

# Remove lock files if safe
rm .git/worktrees/*/HEAD.lock
```

### Worktree folder deleted but Git still thinks it exists

**Solution:**
```bash
git worktree prune
```

---

## Example: Complete Workflow

### Scenario: Three AI agents working on different features

```bash
# 1. Create branches (if they don't exist)
git branch feature/chat-file-uploads
git branch feature/browser-automation
git branch feature/agent-networks

# 2. Create worktrees
git worktree add ~/.claude-worktrees/agipo/chat feature/chat-file-uploads
git worktree add ~/.claude-worktrees/agipo/browser feature/browser-automation
git worktree add ~/.claude-worktrees/agipo/agents feature/agent-networks

# 3. Each agent works in their folder
# Terminal 1:
cd ~/.claude-worktrees/agipo/chat
npm run dev  # Port 3000

# Terminal 2:
cd ~/.claude-worktrees/agipo/browser
npm run dev  # Port 3001

# Terminal 3:
cd ~/.claude-worktrees/agipo/agents
npm run dev  # Port 3002

# 4. When done, merge to main
git checkout main
git merge feature/chat-file-uploads
git merge feature/browser-automation
git merge feature/agent-networks

# 5. Clean up worktrees
git worktree remove ~/.claude-worktrees/agipo/chat
git worktree remove ~/.claude-worktrees/agipo/browser
git worktree remove ~/.claude-worktrees/agipo/agents
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Create worktree | `git worktree add <path> <branch>` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove <path>` |
| Prune worktrees | `git worktree prune` |
| Create branch + worktree | `git worktree add -b <branch> <path>` |
| Force remove | `git worktree remove --force <path>` |

---

## Key Takeaways

1. **Worktrees = separate folders for each branch**
2. **All worktrees share the same Git repository**
3. **Each worktree can run independently** (dev servers, tests, etc.)
4. **Perfect for parallel development** (multiple AI agents, features)
5. **Always use `git worktree remove`** to clean up

---

## Next Steps

1. Try creating a worktree for a test branch
2. Run a dev server in the worktree
3. Make changes and commit
4. See how it doesn't affect your main directory
5. Remove the worktree when done

**Remember:** Worktrees are your friend when you need to work on multiple things at once!

