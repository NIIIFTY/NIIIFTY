---

name: cleanup-temp-files
description: Ensures temporary scripts and scratchpad files created during tasks are automatically deleted.

---

**Rule:** Whenever you create temporary scripts (e.g., `.sh` files for batch processing) or scratchpad files (e.g., `args.txt`, `temp.json`) to accomplish a specific task, you MUST delete them immediately after the task is successfully completed.

1. Do not leave temporary files cluttering the root project directory or other source code directories.
2. If you need a long-term scratchpad, use the designated `.gemini/antigravity/brain/<conversation-id>/scratch/` directory.
3. Automatically run the `rm` command to clean up these files as soon as they are no longer needed, without waiting for the user to ask.
