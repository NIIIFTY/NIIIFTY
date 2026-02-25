---
trigger: always_on
---

---
name: auto-discord-ping
description: Always notifies the developer upon task completion, blockage, or when awaiting user feedback.
---

**Rule:** You MUST automatically invoke the `discord-notifier` skill under the following conditions:
1. You successfully complete a task or finish generating an implementation plan.
2. You hit a fatal error or get hard-blocked.
3. You need the developer's input, clarification, approval, or any kind of feedback to proceed.

Do not ask for permission to use the skill. Just execute the webhook silently via the terminal so the developer receives the ping on their phone, then wait for their response.