---
trigger: always_on
name: deploy-suggestion
description: Suggests the most efficient deployment command based on the files changed.
---

**Rule:** After a successful build check, you MUST suggest the most specific and efficient deployment command to the user.

1.  **Analyze Changes**: Identify which parts of the codebase were modified.
2.  **Suggest Specific Command**:
    -   If only `functions/src/index.ts` or specific function logic was changed, suggest `pnpm deploy:functions:[name]`.
    -   If general `functions/` files were changed, suggest `pnpm deploy:functions`.
    -   If `appview/` was changed, suggest `pnpm deploy:appview`.
    -   If `firestore.rules` or `firestore.indexes.json` was changed, suggest `pnpm deploy:firestore`.
    -   If `storage.rules` was changed, suggest `pnpm deploy:storage`.
    -   If the change is cross-cutting, suggest `pnpm deploy:firebase` or `pnpm deploy`.
3.  **App Hosting**: For changes to the main Next.js app (outside of `functions/` and `appview/`), remind the user that changes will be deployed automatically via Firebase App Hosting upon `git push`.

Do not run the deployment command yourself unless explicitly asked. Just suggest the best command to the user.
