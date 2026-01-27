# 🚀 Chat History & Error Recovery - Quick Reference

## ⚡ Quick Start

### Start the Agent
```bash
npm run dev
```

### Resume Interrupted Session
Agent automatically prompts to resume - just select from the list!

### New Chat Commands
| Command | Purpose | Example |
|---------|---------|---------|
| `/history` | View all messages | Shows timestamps and content |
| `/export` | Save session as markdown | Exports to `/tmp/chat-session-{id}.md` |
| `/info` | Show session details | Provider, account, message count |
| `/clear` | Clear conversation | Starts fresh with same session |
| `/menu` | Account management | Switch accounts/providers |
| `/exit` | Save and quit | Marks session as completed |

## 💾 What Gets Saved

Every conversation is automatically saved to `.ai-agent-data/sessions/`

```
User Input → Saved ✅
Assistant Response → Saved ✅
File Operations → Saved ✅
Errors → Saved with Details ✅
Timestamps → Saved ✅
```

## 🔄 Session Recovery

### How It Works
1. **Interruption Detected** - Session marked as "interrupted"
2. **On Restart** - Agent finds interrupted sessions
3. **Your Choice** - Resume or start fresh
4. **Context Restored** - All previous messages loaded
5. **Continue** - Pick up where you left off

### Session States
- **Active** - Currently in use
- **Interrupted** - Stopped unexpectedly (can resume)
- **Completed** - Finished normally (archived)
- **Error** - Had critical error (can resume)

## ⚠️ Error Recovery

### When an Error Happens
```
Error occurs
    ↓
Retry? Yes ← Exponential backoff (1s, 2s, 4s)
    ↓
Workarounds? Yes ← Get recovery suggestions
    ↓
Skip ← Continue with next message
```

### Retry Strategy
- **Max Attempts:** 3 times
- **Backoff:** Doubles each time (1s → 2s → 4s)
- **Smart Detection:** Identifies error type automatically

### Error Types & Fixes

| Error | Cause | Quick Fix |
|-------|-------|-----------|
| Network Timeout | Internet issue | Retry or check connection |
| Unauthorized | Bad credentials | Re-authenticate |
| Rate Limited | Too many requests | Wait and use `/menu` for different account |
| Invalid Request | Bad format | Rephrase question simpler |
| File Not Found | Path incorrect | Use absolute paths |

## 📊 Common Scenarios

### Scenario 1: Long Session Interrupted
```
Start → Chat 10 times → Power outage
↓
Restart → Choose "Resume" → Continue from message 11
```

### Scenario 2: Network Error
```
Your: Ask complex question
Error: Timeout
↓
Choose: Retry → Waits 1 second → Tries again
If fails: Get workarounds → Rephrase simpler
```

### Scenario 3: Multi-Account Work
```
Session A (Gemini) → 5 messages
Interrupted
↓
Session B (GitHub Copilot) → Different account
Completed
↓
Restart → Resume either session
```

### Scenario 4: Research Backup
```
Important research session
Command: /export
Result: chat-session-uuid.md
Action: Save to git or backup
```

## 🎯 Tips & Tricks

### Keep Sessions Organized
- Use descriptive questions to identify sessions later
- Export important sessions regularly
- Delete old completed sessions to save space

### Optimize Error Recovery
- "Retry" works best for network issues
- "Workarounds" best for API/format errors
- Switch accounts/providers if rate limited

### Efficient Workflow
1. Use `/history` to review your discussion
2. Use `/export` before closing long sessions
3. Use `/info` to check session size/age
4. Use `/menu` to switch accounts if issues

### Session Management
```bash
# Check session storage size
du -sh .ai-agent-data/

# List all sessions
ls -la .ai-agent-data/sessions/

# View specific session
cat .ai-agent-data/sessions/{sessionId}.json | jq
```

## 🔧 Configuration

### In Code (if using programmatically)
```typescript
// Set max retry attempts
errorRecovery.setMaxRetries(5);

// Set retry delay (milliseconds)
errorRecovery.setRetryDelay(1000);

// Clean up sessions older than 30 days
const deleted = historyManager.cleanupOldSessions(30);
```

## 📁 File Structure

```
.ai-agent-data/
└── sessions/
    ├── session-1.json        ← Completed session
    ├── session-2.json        ← Active session
    └── session-3.json        ← Interrupted (resumable)
```

Each JSON contains:
- Unique session ID
- Account & provider info
- All messages with timestamps
- Session status
- Error tracking info

## ✅ Checklist: First Time Setup

- [ ] Run `npm run dev` to start
- [ ] See interrupted sessions prompt (if any)
- [ ] Try `/history` command
- [ ] Try `/info` command
- [ ] Send a message to save it
- [ ] Use `/export` to backup
- [ ] Check `.ai-agent-data/sessions/` to see saved files
- [ ] Interrupt session (Ctrl+C)
- [ ] Restart and choose to resume

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No recovery prompt | No interrupted sessions exist - start fresh |
| Error keeps happening | Choose "Show workarounds" and try suggestion |
| Can't find old session | Use `/history` or check `.ai-agent-data/sessions/` |
| Session too large | Use `/export` to backup, then manual delete |
| Session won't resume | Ensure using same account - check with `/info` |

## 📈 What's Different from Before

| Before | Now |
|--------|-----|
| Chat lost on interrupt | Sessions auto-save and recoverable |
| One error = give up | Error retry with exponential backoff |
| No chat history viewing | `/history` shows all messages |
| Can't export chats | `/export` saves as markdown |
| No session info | `/info` shows full session details |

## 🎓 Next Steps

1. **Try Recovery** - Interrupt session, restart, resume
2. **Export Session** - Use `/export` and check the file
3. **Test Error Recovery** - Intentionally trigger error, choose retry
4. **Review Help** - Read full [CHAT_HISTORY_GUIDE.md](./CHAT_HISTORY_GUIDE.md)
5. **Explore Code** - Check `src/chat-history.ts` and `src/error-recovery.ts`

## 📞 Need Help?

- Check `CHAT_HISTORY_GUIDE.md` for detailed docs
- Use `/info` command to debug current session
- Review error messages - they're specific to problem
- Check `.ai-agent-data/sessions/` for session files

---

**Version:** 2.0.0  
**Status:** ✅ Ready to Use  
**Last Updated:** January 27, 2026
