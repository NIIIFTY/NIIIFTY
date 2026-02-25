---
name: discord-notifier
description: Sends a push notification to a Discord channel using a Webhook when a task is completed, requires human review, or gets blocked.
version: 1.0.0
---

# Discord Notifier Skill

You are equipped with the ability to ping the developer in a Discord channel to provide asynchronous updates on your progress.

## When to use this skill
- **Task Completion:** Automatically use this skill IMMEDIATELY after finishing a complete implementation plan or major milestone.
- **Blocked/Needs Input:** Use this skill if you hit a fatal error, lack permissions, or need the developer to clarify business logic before you can proceed.

## Webhook Configuration
**Webhook URL:** `https://discord.com/api/webhooks/1476182765962531090/KVKDOL5DdBeRNVKda9rYDmP9_HIfvBI7aru0kYc62SEoIRoWfgLDMpBg4RCoVbOKZmnH`

## Execution Instructions
To trigger the notification, use your local terminal tool to execute a `curl` POST request. 

### Payload Format
Construct a JSON payload using the `content` field. Keep it concise.
- Prefix the message with a status: 🟢 **Task Complete**, 🟡 **Needs Review**, or 🔴 **Blocked**.
- Provide a 1-2 sentence summary of the current state.

### Terminal Command Template
Use the following bash structure. Ensure your JSON string is properly escaped:

```bash
curl -H "Content-Type: application/json" \
     -d '{"content": "🟢 **Task Complete:** I have finished refactoring the authentication routes and verified the tests pass locally."}' \
     [INSERT_YOUR_DISCORD_WEBHOOK_URL_HERE]