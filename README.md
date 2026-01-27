# Multi-Provider AI Assistant

A powerful AI assistant that supports multiple AI providers (Google Gemini, GitHub Copilot, Microsoft Copilot, Azure OpenAI) with full file system management capabilities and intelligent session recovery. Authenticate once per provider, manage multiple accounts, and switch between them seamlessly.

## Features

### 🔐 Multi-Provider Authentication
- **OAuth 2.0 Integration**: First-time login with automatic browser redirect
- **Multiple Accounts**: Add and manage multiple accounts per provider
- **Account Switching**: Seamlessly switch between different AI providers
- **Secure Credential Storage**: All credentials stored securely locally

### 🤖 AI Provider Support
- **Google Gemini**: Advanced AI for code and complex tasks
- **GitHub Copilot**: Code-focused AI with GitHub integration
- **Microsoft Copilot**: Enterprise-grade assistant
- **Azure OpenAI**: Custom-tuned language models

### 💬 Interactive Chat with Persistence
- **Real-time Conversations**: Chat with any supported AI provider
- **Context Preservation**: Maintain conversation history within sessions
- **Auto-Save Sessions**: All conversations automatically saved to disk
- **Session Recovery**: Resume interrupted sessions with full context
- **Command System**: Special commands for enhanced functionality

### 💾 Chat History & Recovery
- **Persistent Sessions**: Conversations automatically saved with timestamps
- **Automatic Recovery**: Resume sessions interrupted by crashes or network issues
- **Session Export**: Save conversations as markdown files for backup/sharing
- **History Viewing**: Use `/history` to review conversation
- **Smart Cleanup**: Automated cleanup of old completed sessions

### ⚠️ Intelligent Error Recovery
- **Automatic Retry**: Failed requests retry with exponential backoff (1s, 2s, 4s)
- **Error Classification**: Specific detection of network, auth, rate limit, and format errors
- **Smart Suggestions**: Context-aware recovery strategies for each error type
- **Manual Override**: Choose to retry, view workarounds, or skip
- **Error Tracking**: Complete history of errors with resolution attempts

### 📁 File System Management
- **Full File Operations**: Create, read, update, delete files
- **Directory Management**: Create, list, delete directories
- **Advanced Operations**: Copy, move, rename files/directories
- **Natural Language**: Give file commands in plain English
- **Same Permissions**: Agent has same access as logged-in user

## Prerequisites

- Node.js 18+
- npm or yarn
- Active accounts with desired AI providers:
  - Google Cloud Project with Gemini API enabled
  - GitHub account for GitHub Copilot
  - Microsoft account for Microsoft Copilot
  - Azure subscription for Azure OpenAI (optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your API keys:
```env
# Required for at least one provider
GEMINI_API_KEY=your_gemini_key_here
GITHUB_TOKEN=your_github_token_here
AZURE_OPENAI_KEY=your_azure_key_here

# Optional
LOG_LEVEL=info
DEFAULT_PROVIDER=gemini
```

## Configuration

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Cloud Resource Manager API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Desktop application"
6. Copy the Client ID and Client Secret to `.env`

### Getting Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Create API Key"
3. Copy and add to `.env` as `GEMINI_API_KEY`

## Usage

### Development Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production Mode
```bash
npm start
```

### First Time Setup

On first run:
1. Choose your AI provider (Gemini, GitHub Copilot, Microsoft Copilot, Azure OpenAI)
2. Authenticate via browser (automatic redirect)
3. Grant necessary permissions
4. For Gemini: Select GCP project and AI model
5. Start chatting!

### Interactive Commands

During a chat session, use these commands:

| Command | Function |
|---------|----------|
| `/info` | Show session information |
| `/clear` | Clear conversation history |
| `/menu` | Open main menu (logout, switch accounts) |
| `/files` | Show file management help |
| `/exit` | Exit the application |

### File Management Commands

Give natural language file commands:

**File Operations:**
```
create file ~/myfile.txt with Hello World
read file ~/myfile.txt
update file ~/myfile.txt with New content
delete file ~/myfile.txt
```

**Directory Operations:**
```
create directory ~/my_project
list ~/my_project
delete directory ~/my_project recursive
```

**File Management:**
```
copy ~/file.txt to ~/backup.txt
move ~/old.txt to ~/new.txt
rename ~/file.txt as backup.txt
info ~/file.txt
```

**Navigation:**
```
pwd
cd ~/projects
```

See [FILE_MANAGEMENT_GUIDE.md](FILE_MANAGEMENT_GUIDE.md) for complete documentation.

### Multi-Provider Usage

**Add Multiple Accounts:**
```
1. Select "Manage Accounts"
2. Choose "Add Account"
3. Select provider
4. Complete authentication
5. Give account a name (e.g., "Work GitHub", "Personal Gemini")
```

**Switch Providers:**
```
1. Start chat with any provider
2. Type `/menu`
3. Select "Switch Account"
4. Choose different provider/account
5. Restart chat session
```

See [MULTI_PROVIDER_GUIDE.md](MULTI_PROVIDER_GUIDE.md) for detailed instructions.

### Chat Commands

Once in a chat session, you can use these commands:

| Command | Purpose | Example |
|---------|---------|---------|
| `/history` | View all messages in current session | Shows timestamps and message preview |
| `/export` | Save session as markdown file | Exports to `/tmp/chat-session-{id}.md` |
| `/info` | Show session info (provider, messages, etc.) | Displays session statistics |
| `/clear` | Clear conversation history | Starts fresh within same session |
| `/menu` | Show main menu (accounts, settings, etc.) | Account management |
| `/files` | Show file management command help | Lists all file operations |
| `/exit` | Save session and exit | Gracefully closes session |

### Session Recovery

If your session is interrupted, the agent automatically offers to resume:

```
⚠️  Found interrupted sessions that can be resumed:
? Would you like to resume a previous session? (Y/n)
```

Select a previous session to restore full context and continue your conversation.

### Error Recovery

When errors occur, you have options:

```
⚠️  Error occurred (Attempt 1/3)
Error: Network timeout

What would you like to do?
❯ 🔄 Retry the request
  💡 Show workarounds
  ❌ Skip and continue
```

- **Retry**: Automatically retries with exponential backoff
- **Workarounds**: See context-specific recovery suggestions
- **Skip**: Continue with next message

See [CHAT_HISTORY_GUIDE.md](CHAT_HISTORY_GUIDE.md) and [CHAT_RECOVERY_QUICKREF.md](CHAT_RECOVERY_QUICKREF.md) for complete documentation.

## Project Structure

```
ai-agent/
├── src/
│   ├── index.ts                 # Main entry point with CLI & auth flow
│   ├── types.ts                 # TypeScript type definitions
│   ├── config.ts                # Configuration management
│   ├── logger.ts                # Logging utility
│   ├── session.ts               # Session management
│   │
│   ├── agent.ts                 # Core Gemini agent logic
│   ├── agent-factory.ts         # Factory for creating provider agents
│   │
│   ├── providers/               # Provider implementations
│   │   ├── github-copilot-agent.ts
│   │   ├── microsoft-copilot-agent.ts
│   │   └── azure-openai-agent.ts
│   │
│   ├── auth.ts                  # OAuth authentication (Gemini)
│   ├── multi-auth.ts            # Multi-provider authentication manager
│   ├── provider-types.ts        # Provider type definitions
│   │
│   ├── gcloud.ts                # Google Cloud integration
│   ├── selectors.ts             # Interactive CLI menus
│   │
│   ├── file-manager.ts          # File system operations
│   └── file-commands.ts         # Natural language file command parser
│
├── dist/                        # Compiled JavaScript (generated)
├── MULTI_PROVIDER_GUIDE.md      # Multi-provider guide
├── FILE_MANAGEMENT_GUIDE.md     # File management documentation
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Architecture

### Core Components

1. **MultiProviderAuthManager** (`multi-auth.ts`):
   - OAuth 2.0 for all 4 providers
   - Multi-account management
   - Secure credential storage

2. **AgentFactory** (`agent-factory.ts`):
   - Creates provider-specific agents
   - Handles initialization
   - Runtime agent selection

3. **Provider Agents** (`providers/`):
   - GitHubCopilotAgent
   - MicrosoftCopilotAgent
   - AzureOpenAIAgent
   - GeminiCodeAssistAgent (existing)

4. **FileManager** (`file-manager.ts`):
   - Complete file system access
   - Directory operations
   - File metadata management

5. **FileCommandProcessor** (`file-commands.ts`):
   - Natural language parsing
   - Command execution
   - Error handling

6. **GoogleCloudIntegration** (`gcloud.ts`):
   - GCP project selection
   - Model listing

7. **InteractiveSelectors** (`selectors.ts`):
   - Provider selection
   - Account management menus
   - Interactive UI

8. **CLI Interface** (`index.ts`):
   - Main orchestration
   - Chat loop
   - Command routing

### Data Flow

```
User Input
    ↓
File Command? → FileCommandProcessor → Execute File Operation
    ↓ No
Special Command? → Handle (/menu, /clear, /info, /files, /exit)
    ↓ No
Chat Message → Selected Agent → AI Provider Response
    ↓
Display Response
```

## Authentication Flow

1. **First Login**: User runs the application
2. **Browser Opens**: Automatically redirected to Google login
3. **User Authorizes**: Grants access to Cloud Platform resources
4. **Credentials Saved**: OAuth tokens stored securely locally
5. **Future Sessions**: Credentials reused automatically

## Credential Storage

Credentials are stored in:
```
~/.ai-agent/credentials.json
```

Permissions: `0600` (read/write for owner only)

To re-authenticate, delete this file and restart the application.

## Error Handling

The agent includes comprehensive error handling:

- OAuth authentication failures
- Invalid configuration
- API connection errors
- Request/response handling
- Graceful failure messages

## Logging

Logs are controlled by the `LOG_LEVEL` environment variable:

- `debug`: Detailed debugging information
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages only

## Google Cloud Code Integration

The agent internally uses Google Cloud APIs:

- **Cloud Resource Manager**: For project listing
- **Google APIs Client**: For authentication
- **AI Platform APIs**: For model access

## Future Enhancements

- [ ] Conversation persistence (save/load sessions)
- [ ] Support for additional AI providers
- [ ] Advanced code execution capabilities
- [ ] Integration with Cloud Code IDE extensions
- [ ] Web UI dashboard
- [ ] API server mode for team deployment
- [ ] Plugin system for extensibility
- [ ] Code snippet caching and management

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"
- Ensure `.env` file exists with valid Gemini API key
- Verify API key is active in Google AI Studio

### "No projects available"
- Ensure you have at least one GCP project
- Verify OAuth credentials have correct permissions
- Check that Cloud Resource Manager API is enabled

### Browser doesn't open automatically
- OAuth URL will still be displayed in terminal
- Copy and paste URL manually into your browser

### "Credentials expired"
- Delete `~/.ai-agent/credentials.json`
- Restart the application to re-authenticate

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
