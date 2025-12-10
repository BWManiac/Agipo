# Diary Entry 3: MVP Implementation Learnings

**Date:** 2025-01-15  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

This entry documents critical, nuanced learnings discovered during the implementation of the MVP execution engine. These points were not obvious from the initial design and represent key insights into working with WebContainers and Next.js routing.

---

## 2. Implementation Summary

### Learning 1: Next.js Routing - Underscore (`_`) is a Private Convention

**Problem:** Encountered `404 Not Found` error when trying to access experiment page.

**Learning:** Prefixing a folder with an underscore in the Next.js `app/` directory (e.g., `app/_experiments`) marks it as a **private folder**. This explicitly opts the folder and all its children out of the routing system.

**Solution:** Renamed directory to `app/experiments` to make it public and routable.

---

### Learning 2: WebContainer Execution - Race Condition Bug

**Problem:** `MODULE_NOT_FOUND` error - Node.js process couldn't find file we just created.

**Root Cause:** `await` on separate WebContainer commands does not guarantee sequential execution in the way one might expect, especially between file system operations and process spawning.

**Solution:** Moved to a single, atomic shell command using `sh -c`. The command `sh -c "echo '...' > /file.js && node /file.js"` guarantees that the shell waits for the `echo` (write) to complete before attempting the `node` (execute) command.

---

### Learning 3: WebContainer Permissions - Writable Directory

**Problem:** `EACCES: permission denied` when trying to write to root (`/`) directory.

**Learning:** The default user in the WebContainer does not have permission to write to `/`. The standard world-writable directory for temporary files is `/tmp`.

**Solution:** Updated shell command to write all scripts to the `/tmp` directory (e.g., `... > /tmp/node-1.js`).

---

### Learning 4: Package Management - Consistent CWD

**Problem:** When implementing `npm install`, the installed package was not available during execution.

**Root Cause:** The `npm install` process and the `node` execution process were running in different "current working directories" (CWD). `npm` was installing `node_modules` in a default location (likely `/`), but our `node` script was running from `/tmp`, so it couldn't find the modules.

**Solution:** Enforced a consistent working directory for all operations. By prepending `cd /tmp && ...` to both our `onInstall` and `onRun` commands, we ensure that `npm` creates the `/tmp/node_modules` directory and that our `node` process starts from `/tmp`, allowing `require()` to work as expected.

---

### Learning 5: Module System - CommonJS (`require`) Only

**Learning:** The default Node.js environment we are spinning up is a CommonJS environment. The ES6 `import` syntax will not work out of the box.

**Solution:** All packages and modules must be loaded using the `require()` syntax.

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution Directory | `/tmp` | World-writable, avoids permission issues |
| Execution Method | Atomic shell command | Prevents race conditions |
| Working Directory | Consistent CWD (`/tmp`) | Ensures `npm install` and `node` execution share same directory |
| Module System | CommonJS (`require()`) | Default Node.js environment, no extra configuration |

---

## 4. Technical Deep Dive

### Atomic Command Pattern

Instead of:
```javascript
await fs.writeFile('/tmp/script.js', code);
await spawn('node', ['/tmp/script.js']);
```

Use:
```javascript
await spawn('sh', ['-c', `echo '${code}' > /tmp/script.js && node /tmp/script.js`]);
```

The `&&` operator ensures sequential execution within the shell, preventing race conditions.

### CWD Consistency

Both install and run commands must use the same working directory:
```javascript
// Install
await spawn('sh', ['-c', 'cd /tmp && npm install cowsay']);

// Run
await spawn('sh', ['-c', 'cd /tmp && node /tmp/script.js']);
```

This ensures `node_modules` is in the same location where `require()` looks for modules.

---

## 5. Lessons Learned

- **Next.js routing:** Underscore prefix marks folders as private - use for internal/utility folders only
- **WebContainer execution:** Atomic shell commands prevent race conditions better than separate async operations
- **File permissions:** Only `/tmp` is writable in WebContainer sandbox
- **Package management:** Consistent CWD is critical for `npm install` and `node` execution
- **Module system:** Default environment is CommonJS - ES modules require explicit configuration

---

## 6. Next Steps

- [ ] Document these patterns in engineering guidelines
- [ ] Create helper functions for common WebContainer operations
- [ ] Add error handling for permission and CWD issues

---

## References

- **Related Diary:** `01-NodeExecutionEngineMVP.md` - MVP implementation
- **Related Diary:** `02-TestCasesExecution.md` - Test cases

---

**Last Updated:** 2025-01-15
