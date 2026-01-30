# VS Code Integration Guide

## Overview

The AI Agent is now fully integrated with VS Code as a native extension. This provides seamless access to all AI Agent features directly within your editor.

## Installation & Setup

### Option 1: Install from Marketplace (When Published)

```bash
# Search for "AI Agent Assistant" in VS Code extensions marketplace
# Or install via command line:
code --install-extension ai-agent.ai-agent-assistant
```

### Option 2: Install from Local Build

```bash
# Clone the repository
git clone https://github.com/priyadarshiajitav1990/ai-agent.git
cd ai-agent

# Install dependencies
npm install

# Build the extension
npm run build

# Package the extension
npm install -g @vscode/vsce
vsce package

# Install the .vsix file
code --install-extension ai-agent-assistant-1.0.0.vsix
```

## Features

### 1. Chat Interface (Ctrl+Shift+A)
- Open the AI Agent chat panel
- Ask questions about your code
- Get intelligent suggestions
- Works completely offline

### 2. Auto-Fix Errors (Ctrl+Shift+F)
- Detects errors in real-time
- Automatically fixes common issues
- Shows detailed error reports
- Retry up to 3 times

### 3. Code Analysis
- Right-click → "AI Agent: Analyze Code"
- Analyze selected code
- Get recommendations
- View suggestions in console

### 4. Code Generation
- Right-click → "AI Agent: Generate Code"
- Describe the code you need
- AI generates the code
- Insert directly into editor

### 5. Debug Mode
- Command Palette → "AI Agent: Toggle Debug Mode"
- Enhanced logging
- Detailed error traces
- Performance monitoring

### 6. Console & Monitoring
- View console output
- Monitor errors in real-time
- Track auto-fix attempts
- See performance metrics

## Configuration

Access settings via:
- `Cmd/Ctrl + ,` → Search "AI Agent"
- Or directly edit `.vscode/settings.json`

### Available Settings

```json
{
  "ai-agent.apiKey": "your-api-key-here",
  "ai-agent.provider": "gemini",           // gemini, openai, azure, github
  "ai-agent.offline": true,                // Enable offline mode
  "ai-agent.autoFixErrors": true,          // Auto-fix errors
  "ai-agent.errorDetection": true,         // Real-time error detection
  "ai-agent.maxRetries": 3,                // Max auto-fix attempts
  "ai-agent.showWelcome": true,            // Show welcome on startup
  "ai-agent.debugMode": false              // Enable debug logging
}
```

## Commands

### Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `ai-agent.activate` | - | Activate the AI Agent |
| `ai-agent.chat` | Ctrl+Shift+A | Open chat interface |
| `ai-agent.fixError` | Ctrl+Shift+F | Auto-fix current error |
| `ai-agent.analyzeCode` | Right-click | Analyze selected code |
| `ai-agent.generateCode` | Right-click | Generate code from description |
| `ai-agent.debugMode` | Command Palette | Toggle debug mode |
| `ai-agent.showConsole` | - | Show console panel |

## UI Components

### Status Bar
- Shows current AI Agent status
- Click to open chat
- Real-time status updates

### Sidebar
- Chat panel for conversations
- Console for monitoring
- Errors panel for quick fixes

### Context Menu
- Right-click options for code analysis
- Quick access to generation
- Error fixing suggestions

## Workflow Examples

### Example 1: Auto-Fix an Error

1. Save a file with an error
2. AI Agent detects it (status bar shows "Detecting errors...")
3. Auto-fix triggered automatically
4. Error fixed and code rebuilds
5. You're notified with "✅ Error fixed!"

### Example 2: Generate Code

1. Ctrl+Shift+A to open chat
2. Type: "create a function to validate email"
3. AI Agent generates the code
4. Code inserted at cursor position
5. Review and customize as needed

### Example 3: Analyze Code

1. Select code in editor
2. Right-click → "AI Agent: Analyze Code"
3. AI analyzes the selection
4. Results shown in console
5. Get suggestions for improvement

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` (Windows/Linux) | Open Chat |
| `Cmd+Shift+A` (macOS) | Open Chat |
| `Ctrl+Shift+F` (Windows/Linux) | Fix Error |
| `Cmd+Shift+F` (macOS) | Fix Error |

## Development

### Build the Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Test the Extension

```bash
# Run tests
npm run test

# Debug extension
# Open VS Code and press F5 to start debugging
```

### Package for Distribution

```bash
# Install vsce
npm install -g @vscode/vsce

# Package the extension
vsce package

# Publish (requires authentication)
vsce publish
```

## Troubleshooting

### Extension Not Showing

1. Restart VS Code
2. Check if extension is installed: `code --list-extensions`
3. Verify .vscode/settings.json exists
4. Check extension logs: View → Output → Select "AI Agent"

### Commands Not Working

1. Reload VS Code window: Ctrl+K Ctrl+R
2. Check if extension is active
3. Verify keyboard shortcuts in settings
4. Look for conflicts with other extensions

### Auto-Fix Not Triggering

1. Check "ai-agent.errorDetection" is true
2. Check "ai-agent.autoFixErrors" is true
3. Verify error patterns match
4. Check console for error messages

### Performance Issues

1. Enable debug mode: Command Palette → "AI Agent: Toggle Debug Mode"
2. Check console for bottlenecks
3. Reduce max retries if needed
4. Disable offline mode temporarily to test

## API Integration

### Setting Up API Keys

1. Choose your AI provider in settings
2. Get your API key from the provider
3. Set in VS Code settings or .env file
4. Verify connection: Command Palette → "AI Agent: Activate"

### Supported Providers

- **Gemini**: Fast, free tier available
- **OpenAI**: Most capable, subscription required
- **Azure**: Enterprise option
- **GitHub Copilot**: GitHub integration

## Security & Privacy

- ✅ All API keys stored locally
- ✅ No data sent to external servers
- ✅ Offline mode available
- ✅ Workspace-sandboxed operations
- ✅ No tracking or telemetry

## Getting Help

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Updates**: Extension releases page

## Contributing

Want to improve the extension? Great!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

---

**Enjoy AI-powered coding with AI Agent!** 🚀
