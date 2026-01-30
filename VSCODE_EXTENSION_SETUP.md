# AI Agent VS Code Extension - Complete Setup Guide

## What's Included

Your AI Agent now includes **full VS Code integration** with:

✅ **Native VS Code Extension** - Seamless editor integration
✅ **Chat Interface** - Talk to AI directly in VS Code  
✅ **Auto-Fix Panel** - Real-time error detection & fixing
✅ **Console Monitoring** - Track all activity
✅ **Workspace Intelligence** - Full project awareness
✅ **Offline Support** - Works without internet

## Quick Start

### 1. Install Dependencies

```bash
cd ai-agent
npm install
```

### 2. Compile the Extension

```bash
npm run extension:compile
```

### 3. Launch VS Code with Extension

```bash
code .
```

### 4. Press F5 to Start Debugging

This will open a new VS Code window with the extension loaded.

## File Structure

```
ai-agent/
├── .vscode/                         # VS Code configuration
│   ├── settings.json               # Extension settings
│   ├── launch.json                 # Debug configuration
│   ├── tasks.json                  # Build tasks
│   └── extensions.json             # Recommended extensions
├── src/
│   ├── extension.ts                # Extension entry point ⭐ NEW
│   ├── vscode-ui-manager.ts        # UI components ⭐ NEW
│   ├── offline-error-recovery.ts   # Error handling
│   ├── workspace-intelligence.ts   # Workspace access
│   └── ... (other modules)
├── package.json                    # Updated with extension config
├── package-extension.json          # Extension manifest ⭐ NEW
├── VSCODE_INTEGRATION.md           # Extension guide ⭐ NEW
└── VSCODE_EXTENSION_SETUP.md       # This file ⭐ NEW
```

## Available Commands

### Keyboard Shortcuts

| Shortcut | Command | Action |
|----------|---------|--------|
| `Ctrl+Shift+A` | Open Chat | Start conversation with AI |
| `Cmd+Shift+A` | Open Chat | (macOS) |
| `Ctrl+Shift+F` | Fix Error | Auto-fix current error |
| `Cmd+Shift+F` | Fix Error | (macOS) |

### Command Palette (Ctrl+Shift+P)

- `AI Agent: Activate` - Initialize the extension
- `AI Agent: Open Chat` - Open chat panel
- `AI Agent: Fix Error` - Fix current error
- `AI Agent: Analyze Code` - Analyze selected code
- `AI Agent: Generate Code` - Generate code
- `AI Agent: Toggle Debug Mode` - Enable/disable debugging
- `AI Agent: Show Console` - Show console panel

### Right-Click Context Menu

- `AI Agent: Analyze Code` - Analyze selection
- `AI Agent: Generate Code` - Generate code
- `AI Agent: Fix Error` - Fix error in file

## Configuration

### Settings Location

1. **GUI**: File → Preferences → Settings → Search "ai-agent"
2. **JSON**: `.vscode/settings.json`
3. **Workspace**: `.vscode/settings.json`

### Available Settings

```json
{
  "ai-agent.apiKey": "",                    // Your API key
  "ai-agent.provider": "gemini",            // AI provider
  "ai-agent.offline": true,                 // Offline mode
  "ai-agent.autoFixErrors": true,           // Auto-fix
  "ai-agent.errorDetection": true,          // Error detection
  "ai-agent.maxRetries": 3,                 // Max retries
  "ai-agent.showWelcome": true,             // Welcome message
  "ai-agent.debugMode": false               // Debug mode
}
```

### Setting API Keys

#### Option 1: VS Code Settings

1. Open Settings (Cmd/Ctrl + ,)
2. Search "ai-agent.apiKey"
3. Paste your API key

#### Option 2: Environment Variables

Create `.env` file:

```bash
GEMINI_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
AZURE_API_KEY=your-key-here
GITHUB_TOKEN=your-token-here
```

## UI Components

### Status Bar (Bottom Right)

Shows current AI Agent status:
- `$(zap) AI Agent Ready` - Ready to use
- `$(loading~spin) AI Agent: Processing...` - Working
- `$(zap) AI Agent: Monitoring...` - Watching for errors

Click the status bar to open chat.

### Sidebar Panel (Left)

Three tabs in the AI Agent panel:
1. **Welcome** - Quick start guide
2. **Chat** - Conversation interface
3. **Console** - Activity monitoring
4. **Errors** - Error tracking

### Bottom Panel

- **Console**: Real-time logs and output
- **Errors**: Detected errors with fixes
- **Problems**: VS Code problems panel

## Features

### 1. Chat Interface

**Open**: Ctrl+Shift+A (or Command Palette)

```
💬 AI Agent Chat
┌─────────────────────────┐
│ Welcome to AI Agent!    │
│ Ask me anything...      │
├─────────────────────────┤
│ Type your message...    │
│           [Send]        │
└─────────────────────────┘
```

### 2. Error Auto-Fix

**Trigger**: Ctrl+Shift+F (or save a file with error)

**What happens:**
1. Error detected in console
2. Error classified (20+ patterns)
3. Auto-fix strategy executed
4. Retries up to 3 times
5. Result shown in status bar

### 3. Code Analysis

**Trigger**: Right-click → "Analyze Code"

**Shows:**
- Code quality assessment
- Potential issues
- Improvement suggestions
- Optimization tips

### 4. Code Generation

**Trigger**: Right-click → "Generate Code"

**Steps:**
1. Describe what you want
2. AI generates code
3. Code inserted at cursor
4. Review and customize

## Debugging the Extension

### Enable Debug Mode

1. Command Palette → "AI Agent: Toggle Debug Mode"
2. Or: Settings → `ai-agent.debugMode` = true

### View Debug Output

1. View → Output
2. Select "AI Agent" from dropdown
3. See detailed logs

### Debug in VS Code

1. Press F5 to start debugging
2. Breakpoints work normally
3. Console shows debug info
4. Test extension in the new window

## Building & Publishing

### Compile for Production

```bash
npm run build
npm run extension:compile
```

### Package the Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Package
npm run extension:package

# Creates: ai-agent-assistant-1.0.0.vsix
```

### Publish to Marketplace

```bash
# Create account on https://marketplace.visualstudio.com
# Login with vsce
vsce login ai-agent

# Publish
npm run extension:publish
```

## Troubleshooting

### Extension Not Loading

```bash
# Check if extension is in list
code --list-extensions

# Reinstall
code --uninstall-extension ai-agent.ai-agent-assistant
npm run extension:compile
# Press F5 to debug
```

### Commands Not Showing

1. Reload window: Ctrl+K Ctrl+R
2. Check command registration in `extension.ts`
3. Restart VS Code

### Error Detection Not Working

1. Enable in settings: `ai-agent.errorDetection = true`
2. Check console for errors
3. Verify error patterns match
4. Enable debug mode for details

### Performance Issues

1. Disable debug mode
2. Reduce `maxRetries` in settings
3. Check console for bottlenecks
4. Monitor system resources

## Advanced Usage

### Integrating with CI/CD

```yaml
# .github/workflows/lint.yml
- name: Run AI Agent Analysis
  run: |
    npm install
    npm run build
    npm run extension:compile
```

### Custom Error Patterns

Edit `src/offline-error-recovery.ts` to add custom error patterns:

```typescript
errorPatterns.set(/your-pattern/, 'ERROR_TYPE');
```

### Custom UI Extensions

Extend `VSCodeUIManager` in `src/vscode-ui-manager.ts`:

```typescript
public async showCustomPanel(): Promise<vscode.WebviewPanel> {
  // Your custom panel
}
```

## Tips & Best Practices

1. **Keep API Key Secure**: Never commit API keys to git
2. **Use Offline Mode**: For maximum privacy and speed
3. **Monitor Console**: Check logs for insights
4. **Enable Debug**: When troubleshooting issues
5. **Test with F5**: Always test in debug mode first
6. **Update Regularly**: Check for new versions

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## Next Steps

1. ✅ Read VSCODE_INTEGRATION.md for detailed feature guide
2. ✅ Configure your API key in settings
3. ✅ Test with F5 (debug mode)
4. ✅ Try commands: Ctrl+Shift+A for chat
5. ✅ Enable auto-fix and test error detection
6. ✅ Build for production: `npm run build`

## Getting Help

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: README.md and VSCODE_INTEGRATION.md

---

**Now you have a full-featured AI Agent integrated directly into VS Code!** 🚀
