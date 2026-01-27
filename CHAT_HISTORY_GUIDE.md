# 💾 Chat History & Session Recovery Guide

## Overview

The AI Agent now includes persistent chat history, automatic session recovery, and intelligent error recovery with retry capabilities. This guide explains all the new features and how to use them.

## ✨ New Features

### 1. **Chat History Persistence**
- Every conversation is automatically saved to `.ai-agent-data/sessions/`
- Each session gets a unique ID and is stored as JSON
- Conversations are preserved even if the application crashes
- Messages include timestamps and metadata

### 2. **Session Recovery**
- If your session is interrupted, you can resume it later
- All previous messages and context are restored
- The AI agent reloads conversation history
- You'll see how many messages were in the previous session

### 3. **Error Handling & Retry**
- When errors occur, you're offered to retry or view workarounds
- Exponential backoff retry strategy with maximum 3 attempts
- Specific error detection with recovery suggestions
- Error history is tracked and can be exported

### 4. **Chat Management Commands**
- `/history` - View all messages in current session
- `/export` - Save session as markdown file
- `/menu` - Access account and settings menu
- `/clear` - Clear conversation history
- `/info` - Show session information
- `/files` - Show file management commands
- `/exit` - Save session and exit

## 📁 How Chat History Works

### Session Storage Structure

```
.ai-agent-data/
├── sessions/
│   ├── {sessionId1}.json
│   ├── {sessionId2}.json
│   └── {sessionId3}.json
```

### Session File Format

```json
{
  "sessionId": "uuid-v4-string",
  "accountId": "account-id",
  "provider": "gemini",
  "accountName": "user@example.com",
  "startTime": 1705000000000,
  "lastActiveTime": 1705001000000,
  "messages": [
    {
      "id": "message-uuid",
      "role": "user",
      "content": "What is machine learning?",
      "timestamp": 1705000100000
    },
    {
      "id": "message-uuid",
      "role": "assistant",
      "content": "Machine learning is a subset of AI...",
      "timestamp": 1705000200000
    }
  ],
  "status": "completed",
  "isCompleted": true
}
```

## 🔄 Session Recovery Workflow

### Starting the Agent

```bash
npm run dev
```

### Recovery Flow

1. **Agent starts and checks for interrupted sessions**
   ```
   ⚠️  Found interrupted sessions that can be resumed:
   Would you like to resume a previous session? (Y/n)
   ```

2. **Select which session to resume**
   ```
   ? Select Session to Resume:
   ❯ user@gmail.com (gemini) - 15 messages - 1/27/2026, 2:30:45 PM
     user@github.com (github-copilot) - 8 messages - 1/26/2026, 10:15:30 AM
     user@azure.com (azure-openai) - 12 messages - 1/25/2026, 3:45:20 PM
   ```

3. **Session resumes with context restored**
   ```
   ✅ Session Ready!
   ═══════════════════════════════════════════════════
   Provider: gemini
   Account: user@gmail.com
   📝 Resumed with 15 previous messages
   ───────────────────────────────────────────────────
   ```

## 🛠️ New Commands

### `/history` - View Chat History

Show all messages in the current session with timestamps:

```
? You: /history

📜 Chat History (15 messages):

[2:30:45 PM] USER: What is machine learning?
[2:30:47 PM] ASSISTANT: Machine learning is a subset of artificial intelligence...
[2:30:52 PM] USER: Can you explain supervised learning?
[2:30:55 PM] ASSISTANT: Supervised learning is a machine learning paradigm...
```

### `/export` - Export Session

Save the entire session as a markdown file:

```
? You: /export

✅ Session exported to /tmp/chat-session-{sessionId}.md
```

**Exported file format:**

```markdown
# Chat Session: uuid-v4-string

**Provider:** gemini
**Account:** user@gmail.com
**Started:** 1/27/2026, 2:30:45 PM
**Last Active:** 1/27/2026, 2:35:10 PM
**Status:** completed
**Messages:** 15

---

**USER:** (2:30:45 PM)

What is machine learning?

---

**ASSISTANT:** (2:30:47 PM)

Machine learning is a subset of artificial intelligence that enables...

---
```

### `/info` - Session Information

Display comprehensive session information:

```
? You: /info

📊 Session Info:
  Provider: gemini
  Account: user@gmail.com
  Session ID: 550e8400-e29b-41d4-a716-446655440000
  Messages: 15
  Status: active
  Total Messages: 15
  Started: 1/27/2026, 2:30:45 PM
```

## ⚠️ Error Recovery Workflow

### When an Error Occurs

```
⚠️  Error occurred (Attempt 1/3)
Error: Network timeout

What would you like to do?
❯ 🔄 Retry the request
  💡 Show workarounds
  ❌ Skip and continue
```

### Retry Logic

The agent automatically uses exponential backoff:
- 1st retry: Wait 1 second
- 2nd retry: Wait 2 seconds
- 3rd retry: Wait 4 seconds
- Then give up if still failing

### Workaround Suggestions

Based on error type, the agent suggests solutions:

**Network Errors:**
- Check your internet connection
- Verify the API endpoint is accessible
- Try again with slower network connection
- Check firewall/proxy settings

**Authentication Errors:**
- Re-authenticate with your account
- Check if credentials are expired
- Verify account has required permissions
- Try switching to a different account

**Rate Limit Errors:**
- Wait a few minutes and try again
- Use a shorter query or smaller batch size
- Check your API usage limits
- Consider upgrading your plan

**Invalid Request Errors:**
- Check the format of your input
- Verify all required parameters are provided
- Check for special characters that need escaping
- Try a simpler version of your request

## 📊 Session Management

### Get Session Statistics

```typescript
const stats = historyManager.getSessionStats();
// Returns:
// {
//   totalSessions: 42,
//   activeSessions: 2,
//   interruptedSessions: 3,
//   completedSessions: 37,
//   totalMessages: 1250,
//   averageMessagesPerSession: 29.8
// }
```

### Get All Sessions

```typescript
const allSessions = historyManager.getAllSessions();
// Sorted by last active time (newest first)
```

### Get Sessions for Specific Account

```typescript
const accountSessions = historyManager.getSessionsForAccount(accountId);
```

### Get Interrupted Sessions

```typescript
const interrupted = historyManager.getInterruptedSessions();
// Sessions available for recovery
```

### Resume a Session

```typescript
const resumed = historyManager.resumeSession(sessionId);
// Session status changed from 'interrupted' to 'active'
```

### Delete a Session

```typescript
const deleted = historyManager.deleteSession(sessionId);
```

### Clean Up Old Sessions

Remove completed sessions older than specified days:

```typescript
const deletedCount = historyManager.cleanupOldSessions(30);
// Deletes all completed sessions older than 30 days
```

## 🔍 Error Recovery API

### Record an Error

```typescript
errorRecovery.recordError({
  messageId: 'msg-123',
  userInput: 'Your question',
  error: 'Network timeout',
  errorCode: 'NETWORK_ERROR',
  timestamp: Date.now(),
  retryCount: 0
});
```

### Check if Can Retry

```typescript
const canRetry = errorRecovery.canRetry(messageId);
if (canRetry) {
  await errorRecovery.waitForRetry(retryCount);
  // Retry the operation
}
```

### Get Retry Count

```typescript
const retries = errorRecovery.getRetryCount(messageId);
```

### Get Suggested Strategies

```typescript
const strategies = errorRecovery.getSuggestedStrategies(
  'Connection refused',
  'NETWORK_ERROR'
);
// Returns array of recovery strategies
```

### Parse Error

```typescript
const parsed = errorRecovery.parseError(error);
// {
//   message: 'Error message',
//   code: 'NETWORK_ERROR',
//   type: 'NETWORK_ERROR'
// }
```

### Get Error History

```typescript
const errors = errorRecovery.getErrorHistory();
const unrecoverable = errorRecovery.getUnrecoverableErrors();
```

### Generate Error Report

```typescript
const report = errorRecovery.generateErrorReport();
console.log(report);
```

## 💾 Chat History API

### Create a New Session

```typescript
const session = historyManager.createSession(
  'account-id',
  'gemini',
  'user@gmail.com'
);
```

### Add a Message

```typescript
const message = historyManager.addMessage(
  'user',
  'What is AI?'
);

// Assistant response with possible error
const response = historyManager.addMessage(
  'assistant',
  'AI is artificial intelligence...'
);
```

### Get Conversation History

Get messages in format suitable for AI context:

```typescript
const history = historyManager.getConversationHistory();
// [
//   { role: 'user', content: 'What is AI?' },
//   { role: 'assistant', content: 'AI is...' }
// ]
```

### Get All Messages

```typescript
const messages = historyManager.getMessages();
```

### Export as Markdown

```typescript
const markdown = historyManager.exportSessionAsMarkdown(sessionId);
fs.writeFileSync('session.md', markdown);
```

### Mark Session Completed

```typescript
historyManager.completeSession();
// Changes status from 'active' to 'completed'
```

### Mark Session Interrupted

```typescript
historyManager.markSessionInterrupted();
// Changes status to 'interrupted' for later recovery
```

## 🎯 Use Cases

### Use Case 1: Long Research Session

1. Start research: `npm run dev`
2. Ask multiple questions, build knowledge
3. Get interrupted by power outage
4. Later: `npm run dev` → Resume previous session
5. Continue research with full context

### Use Case 2: Debugging with Multiple Attempts

1. Describe the bug
2. Get suggestions
3. Error occurs during testing
4. Choose "Retry" from error prompt
5. Agent retries automatically
6. Or choose "Show workarounds" for alternative solutions

### Use Case 3: Multi-Provider Continuity

1. Start with Gemini
2. Get rate limited
3. Use `/menu` → Account Management
4. Switch to GitHub Copilot
5. Continue conversation with same history
6. Session automatically tracks provider switch

### Use Case 4: Archive Important Sessions

1. Complete important research session
2. Use `/export` to save as markdown
3. Store in version control or backup
4. Share session transcript with team

## ⚙️ Configuration

### Set Maximum Retries

```typescript
errorRecovery.setMaxRetries(5);
```

### Set Retry Delay

```typescript
errorRecovery.setRetryDelay(500); // milliseconds
```

## 📋 Session Data Fields

Each saved session includes:

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Unique UUID for session |
| `accountId` | string | Account that owns session |
| `provider` | string | AI provider used (gemini, github-copilot, etc.) |
| `accountName` | string | Human-readable account name |
| `startTime` | number | Timestamp when session started |
| `lastActiveTime` | number | Timestamp of last message |
| `messages` | array | All messages in session |
| `status` | string | 'active', 'interrupted', 'completed', or 'error' |
| `isCompleted` | boolean | Whether session is finished |
| `interruptedAt` | number | Timestamp of interruption (if interrupted) |

## 🔐 Privacy & Storage

- All session data stored locally in `.ai-agent-data/`
- No data sent to external servers
- Sessions are JSON files - human readable
- File permissions: 0600 (owner read/write only)
- You can manually delete sessions anytime
- Use `cleanupOldSessions()` for automatic cleanup

## 🐛 Troubleshooting

### Sessions Not Appearing at Startup

**Problem:** You expect to resume a session but don't see the recovery prompt.

**Solutions:**
1. Check if sessions exist: `ls .ai-agent-data/sessions/`
2. Sessions must have status 'interrupted' or 'error' to show
3. Completed sessions aren't offered for recovery
4. Try manual recovery by checking session list

### Error Messages Not Clear

**Problem:** Error recovery suggestion doesn't help.

**Solutions:**
1. Use `/history` to see what went wrong
2. Check the full error message in the chat
3. Try a different workaround from the list
4. Consider switching to different account/provider

### Session Too Large

**Problem:** Session file is huge and takes long to load.

**Solutions:**
1. Use `/export` to backup then delete old sessions
2. Use `cleanupOldSessions(days)` to remove old data
3. Consider deleting specific sessions manually
4. Start fresh session for new topic

### Can't Resume Session

**Problem:** Session shows but can't resume.

**Solutions:**
1. Ensure you're using the same account
2. Check session status with `/info`
3. Try using different provider for same account
4. Manually check session file format

## 📚 Examples

### Example 1: Research with Recovery

```bash
# Start agent
$ npm run dev

# Select provider and account
Provider: gemini
Account: researcher@example.com

# Ask questions
You: What are the latest developments in quantum computing?
Assistant: Quantum computing has seen several breakthroughs...

You: How does quantum entanglement work?
Assistant: Quantum entanglement is a phenomenon where particles...

# [System crash/interrupt]

# Later: Start agent again
$ npm run dev

# Resume prompt appears
⚠️  Found interrupted sessions that can be resumed:
? Would you like to resume a previous session? (Y/n) Y

# Select session
? Select Session to Resume:
❯ researcher@example.com (gemini) - 5 messages - 1/27/2026, 2:30:45 PM

# Session resumes
✅ Session Ready!
📝 Resumed with 5 previous messages

# Continue with full context
You: Can you elaborate on quantum superposition?
Assistant: Building on our previous discussion, quantum superposition...
```

### Example 2: Error Recovery

```bash
You: Generate a large dataset with 1 million records

# Error occurs
⚠️  Error occurred (Attempt 1/3)
Error: Request timeout

What would you like to do?
❯ 🔄 Retry the request
  💡 Show workarounds
  ❌ Skip and continue

# Choose retry
[After 1 second]
...retrying...

# Still fails
⚠️  Error occurred (Attempt 2/3)

# Choose workarounds
💡 Suggested workarounds:
1. Use a shorter query or smaller batch size
2. Wait a few minutes and try again
3. Check your API usage limits

You: Can you generate 10,000 records instead?
Assistant: Here's a dataset with 10,000 records...
```

### Example 3: Exporting Session

```bash
You: /export

✅ Session exported to /tmp/chat-session-550e8400-e29b-41d4-a716-446655440000.md

# Later - access the file
$ cat /tmp/chat-session-550e8400-e29b-41d4-a716-446655440000.md

# Chat Session: 550e8400-e29b-41d4-a716-446655440000

**Provider:** gemini
**Account:** researcher@example.com
[... complete transcript ...]
```

## 🚀 Best Practices

1. **Regular Backups** - Use `/export` to backup important sessions
2. **Clean Storage** - Use `cleanupOldSessions()` periodically
3. **Account Management** - Keep accounts organized for recovery
4. **Error Learning** - Review error patterns to improve queries
5. **Session Naming** - Use descriptive queries to make sessions identifiable

## 🎓 Advanced Usage

### Programmatic Session Access

```typescript
const { ChatHistoryManager } = await import('./chat-history.js');

const manager = new ChatHistoryManager('info');

// Get all sessions
const allSessions = manager.getAllSessions();

// Filter for specific provider
const geminiSessions = allSessions.filter(s => s.provider === 'gemini');

// Get sessions from last 7 days
const recentSessions = allSessions.filter(
  s => Date.now() - s.lastActiveTime < 7 * 24 * 60 * 60 * 1000
);

// Export top 10 most active sessions
for (const session of geminiSessions.slice(0, 10)) {
  const markdown = manager.exportSessionAsMarkdown(session.sessionId);
  fs.writeFileSync(`backup-${session.sessionId}.md`, markdown);
}
```

## 📞 Support

For issues with:
- **Chat History**: Check `.ai-agent-data/sessions/` directory
- **Error Recovery**: Review error codes and suggested workarounds
- **Session Recovery**: Use `/history` and `/info` commands
- **Storage**: Ensure write permissions in project directory

---

**Last Updated:** January 27, 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
