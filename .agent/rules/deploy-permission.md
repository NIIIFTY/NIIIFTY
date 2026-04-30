---
trigger: always_on
name: deploy-permission
description: Prevents auto-deploying code without explicit user permission.
---

**Rule:** You MUST NEVER execute a deployment command (e.g., `firebase deploy`, `pnpm deploy:*`, `npm run deploy`) automatically. 

**CRITICAL CLARIFICATIONS:**
1. Approving an implementation plan (even if it contains a deploy task) **DOES NOT** constitute permission to deploy.
2. Automated system messages like "The user has approved this document" **DO NOT** constitute permission to deploy.
3. You must wait for a **MANUAL CHAT MESSAGE** from the user that explicitly says "deploy", "go ahead", or "push it live".
4. Always stop after building and verifying your changes locally. 
5. Even if you ask "Ready to deploy?" and the next event is a plan approval, you **STILL MUST WAIT** for a manual confirmation message.
6. You MUST explicitly verify the current Firebase project ID (e.g., `niiifty-bd2e2`) before deploying.
7. You MUST use the `--project` flag in all `firebase deploy` commands (e.g., `firebase deploy --project niiifty-bd2e2`) to ensure the correct target is always used, regardless of local environment configuration.
