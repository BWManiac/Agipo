# Project Diary: Entry 3 - MVP Implementation Learnings

This entry documents the critical, nuanced learnings discovered during the implementation of the MVP execution engine. These points were not obvious from the initial design and represent key insights into working with WebContainers and Next.js routing.

### 1. Next.js Routing: Underscore (`_`) is a Private Convention

We encountered a `404 Not Found` error when trying to access our experiment page.

*   **Learning:** Prefixing a folder with an underscore in the Next.js `app/` directory (e.g., `app/_experiments`) marks it as a **private folder**. This explicitly opts the folder and all its children out of the routing system.
*   **Solution:** We renamed the directory to `app/experiments` to make it public and routable.

### 2. WebContainer Execution: A Tale of Two Bugs

Getting code to run inside the WebContainer was more complex than anticipated. We faced and solved two major issues related to the container's environment.

**Bug A: `MODULE_NOT_FOUND` - The Race Condition**

Our first attempt was to `await` a `writeFile` command and then immediately `await` a `spawn` command. This failed because the Node.js process started before the virtual file system had fully committed the write.

*   **Learning:** `await` on separate WebContainer commands does not guarantee sequential execution in the way one might expect, especially between file system operations and process spawning.
*   **Solution:** We moved to a single, atomic shell command using `sh -c`. The command `sh -c "echo '...' > /file.js && node /file.js"` guarantees that the shell waits for the `echo` (write) to complete before attempting the `node` (execute) command.

**Bug B: `EACCES: permission denied` - The Writable Directory**

Our robust shell command then failed because it was trying to write to the root (`/`) directory.

*   **Learning:** The default user in the WebContainer does not have permission to write to `/`. The standard world-writable directory for temporary files is `/tmp`.
*   **Solution:** We updated our shell command to write all scripts to the `/tmp` directory (e.g., `... > /tmp/node-1.js`).

### 3. Package Management: The Importance of a Consistent CWD

When implementing `npm install`, we discovered that the installed package was not available during execution.

*   **Learning:** The `npm install` process and the `node` execution process were running in different "current working directories" (CWD). `npm` was installing `node_modules` in a default location (likely `/`), but our `node` script was running from `/tmp`, so it couldn't find the modules.
*   **Solution:** We enforced a consistent working directory for all operations. By prepending `cd /tmp && ...` to both our `onInstall` and `onRun` commands, we ensure that `npm` creates the `/tmp/node_modules` directory and that our `node` process starts from `/tmp`, allowing `require()` to work as expected.

### 4. Module System: CommonJS (`require`) Only

*   **Learning:** The default Node.js environment we are spinning up is a CommonJS environment. The ES6 `import` syntax will not work out of the box.
*   **Solution:** All packages and modules must be loaded using the `require()` syntax.
