---
trigger: always_on
---

---

name: auto-build-check
description: Ensures the codebase always compiles correctly whenever code is modified.

---

**Rule:** Whenever you modify any TypeScript, React components, CSS, or configuration files in the project, you MUST verify that the project still builds successfully. 

1. Use the `run_command` tool to execute `pnpm build:all` (or `npx tsc --noEmit` / `npm run build:functions` depending on what was changed) locally after making your changes.
2. If the build fails, you must read the error logs and attempt to fix the issues before concluding your task.
3. Do not ask for permission to verify the build; run the checks silently and proactively.
4. After a successful build, follow the instructions in `deploy-suggestion.md` to recommend the appropriate deployment command. **NEVER** execute a deployment command automatically; you MUST follow the `deploy-permission` rule and wait for explicit manual confirmation.
