# Multi-Provider AI Assistant Guide

## Overview

The AI Assistant now supports multiple AI providers, allowing you to switch between different AI services seamlessly. This guide walks you through using the multi-provider system.

## Supported Providers

### 1. **Google Gemini** (Recommended for Code Generation)
- **Description**: Google's advanced AI for code assistance and complex tasks
- **Best For**: Code generation, analysis, technical questions
- **Authentication**: Google Cloud OAuth 2.0
- **Special Features**: 
  - GCP project and model selection
  - Advanced code understanding
  - Integration with Google Cloud services

### 2. **GitHub Copilot**
- **Description**: AI-powered code completion from GitHub
- **Best For**: Code snippets, completions, programming assistance
- **Authentication**: GitHub OAuth 2.0
- **Special Features**:
  - Access to GitHub repositories
  - Code suggestions
  - Integration with GitHub workflows

### 3. **Microsoft Copilot**
- **Description**: Microsoft's enterprise AI assistant
- **Best For**: Enterprise productivity, office integration
- **Authentication**: Microsoft Azure OAuth 2.0
- **Special Features**:
  - Office 365 integration
  - Enterprise features
  - OneDrive/SharePoint access (optional)

### 4. **Azure OpenAI**
- **Description**: OpenAI models deployed on Microsoft Azure
- **Best For**: Advanced language models, specialized tasks
- **Authentication**: Azure API Key authentication
- **Special Features**:
  - Custom-tuned models
  - Enterprise deployment
  - Regional availability

## Getting Started

### First Launch

When you start the application for the first time:

```bash
npm run dev
```

You'll see the main menu:

```
╔════════════════════════════════════════════╗
║  🤖 Multi-Provider AI Assistant            ║
║  Powered by Gemini, GitHub, Microsoft     ║
╚════════════════════════════════════════════╝

Choose an option:
1) Chat (start conversation)
2) Manage Accounts
3) Exit
```

### First-Time Setup

1. **Choose a Provider**: Select from Gemini, GitHub Copilot, Microsoft Copilot, or Azure OpenAI
2. **Authenticate**: Your browser will automatically open for authentication
3. **Login**: Complete the OAuth flow in your browser
4. **Start Chatting**: Return to the terminal and begin your conversation

## Account Management

### Adding Multiple Accounts

You can add multiple accounts per provider for different use cases:

1. Select **"Manage Accounts"** from the main menu
2. Choose **"Add Account"**
3. Select a provider
4. Complete the authentication flow
5. Give your account a descriptive name (e.g., "Work GitHub", "Personal Gemini")

### Switching Between Accounts

**During Chat**:
- Press `/menu`
- Select **"Switch Account"**
- Choose the account you want to use
- Exit and restart chat (planned feature for session switching)

**From Main Menu**:
- Select **"Manage Accounts"**
- Choose **"Switch Account"**
- Select your preferred account

### Viewing All Accounts

1. Go to **"Manage Accounts"**
2. Select **"View Accounts"**
3. See all your accounts organized by provider:

```
📊 Account Statistics:
  Total Accounts: 4
  Active Account: Personal Gemini

📋 Accounts by Provider:
  gemini: 2
  github-copilot: 1
  microsoft-copilot: 1

👤 All Accounts:
  [✓] Personal Gemini (gemini)
  [ ] Work Gemini (gemini)
  [ ] GitHub Dev (github-copilot)
  [ ] Microsoft Work (microsoft-copilot)
```

### Removing Accounts

1. Go to **"Manage Accounts"**
2. Select **"Remove Account"**
3. Choose the account to delete
4. Confirm deletion

**⚠️ Note**: Removing an account deletes its stored credentials. You'll need to authenticate again if you want to use it later.

## Provider-Specific Setup

### Google Gemini Setup

#### Prerequisites
- Google Cloud Project with Gemini API enabled
- Google Cloud SDK installed

#### Steps
1. Create a Google Cloud Project (or use existing)
2. Enable the Generative AI API
3. Create OAuth 2.0 credentials (Desktop application)
4. Download credentials file
5. Set `GEMINI_API_KEY` environment variable

#### During Chat
- Select your GCP project
- Choose a Gemini model (latest recommended)
- Start chatting

### GitHub Copilot Setup

#### Prerequisites
- GitHub account
- GitHub CLI (recommended)
- Valid GitHub PAT (Personal Access Token) with `repo` scope

#### Steps
1. Visit https://github.com/login/oauth/authorize
2. Complete OAuth flow
3. Grant repo access permissions
4. Return to terminal

#### During Chat
- Use GitHub context for code analysis
- Reference your repositories
- Get code suggestions

### Microsoft Copilot Setup

#### Prerequisites
- Microsoft account
- Azure subscription (optional, for advanced features)

#### Steps
1. Complete Azure OAuth flow
2. Grant necessary permissions
3. Optionally connect Microsoft 365 account
4. Start chatting

### Azure OpenAI Setup

#### Prerequisites
- Azure subscription
- Azure OpenAI API key
- Azure OpenAI deployment name
- Azure OpenAI endpoint URL

#### Steps
1. Get your API credentials from Azure Portal
2. Provide deployment name and endpoint during setup
3. Confirm credentials
4. Start chatting

## Session Information

During a chat session, use commands to manage your conversation:

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/info` | Show session information | `/info` |
| `/clear` | Clear conversation history | `/clear` |
| `/menu` | Open main menu | `/menu` |
| `/exit` | Exit the application | `/exit` |

### Session Info Example

```
/info

📊 Session Info:
  Provider: gemini
  Account: Personal Gemini
  Session ID: sess_abc123def456
  Messages: 5
```

## Advanced Usage

### Multi-Account Workflow

**Scenario**: Switch between work and personal projects

```
1. Start app → Select "Chat"
2. Choose account → "Work Gemini"
3. Have work-related conversation
4. Type `/menu` → Select "Switch Account"
5. Choose "Personal Gemini"
6. Continue with personal questions
```

### Provider Switching Workflow

**Scenario**: Use different providers for different tasks

```
Provider: Gemini
├─ Best for: Architecture, system design, complex code
├─ Use: Large codebases, planning

Provider: GitHub Copilot
├─ Best for: Quick code snippets, completions
├─ Use: Day-to-day coding tasks

Provider: Azure OpenAI
├─ Best for: Creative writing, analysis
├─ Use: Non-code tasks, content generation
```

## Troubleshooting

### Authentication Failed

**Issue**: Browser doesn't open or authentication times out

**Solution**:
1. Ensure you have internet connection
2. Check if port 3000 is available
3. Try again - you may need to grant permissions
4. Check provider's documentation for specific requirements

### Account Not Found

**Issue**: Added account but can't see it in the list

**Solution**:
1. Check `~/.ai-agent/accounts/` directory
2. Ensure credentials are properly saved
3. Try adding account again
4. Check logs with `DEBUG=true npm run dev`

### Provider API Error

**Issue**: Get error when starting chat with a provider

**Solution**:
1. Verify API credentials are valid
2. Check provider's service status
3. Ensure API is enabled (for GCP Gemini)
4. Check rate limits on provider's dashboard

### No Browser Opens

**Issue**: Browser doesn't automatically open during authentication

**Solution**:
1. Check system browser availability
2. Copy the URL from terminal and open manually in browser
3. Complete authentication
4. Return to terminal

## Storage and Security

### Credential Storage

All credentials are stored locally in:
```
~/.ai-agent/accounts/
```

Each provider has a separate directory:
- `~/.ai-agent/accounts/gemini/`
- `~/.ai-agent/accounts/github-copilot/`
- `~/.ai-agent/accounts/microsoft-copilot/`
- `~/.ai-agent/accounts/azure-openai/`

### Security Practices

✅ **Do**:
- Keep your credentials private
- Use unique credentials per account
- Review granted permissions regularly
- Rotate tokens if exposed

❌ **Don't**:
- Share your `.ai-agent` folder
- Commit credentials to git
- Use same credentials across providers
- Grant unnecessary permissions

## Configuration

### Environment Variables

Optional environment variables:

```bash
# Logging level (debug, info, warn, error)
LOG_LEVEL=info

# API Keys (if not using OAuth)
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
AZURE_OPENAI_KEY=your_key_here

# Default provider
DEFAULT_PROVIDER=gemini

# Debug mode
DEBUG=false
```

### Configuration File

Settings stored in:
```
~/.ai-agent/config.json
```

Example:
```json
{
  "logLevel": "info",
  "defaultProvider": "gemini",
  "autoOpenBrowser": true,
  "sessionTimeout": 3600
}
```

## FAQ

**Q: Can I use multiple accounts for the same provider?**
A: Yes! Add as many accounts as you need. Each one is stored separately.

**Q: How do I switch providers mid-conversation?**
A: Use `/menu` → "Manage Accounts" → "Switch Account", then restart chat.

**Q: Do my credentials get stored securely?**
A: Yes, credentials are stored locally with restricted permissions (0600). Never shared with external services.

**Q: Can I export my conversation history?**
A: Not currently, but this feature is planned. Conversations are stored in memory during sessions.

**Q: What if I lose access to a provider?**
A: You can remove the account and add a new one after regaining access.

**Q: Can I use different models within the same provider?**
A: For Gemini, yes - you select the model after selecting the provider. Other providers use their default models.

## Support

For issues or questions:
1. Check this guide
2. Review provider-specific documentation
3. Check application logs: `tail -f ~/.ai-agent/logs/`
4. Open an issue on GitHub

## Coming Soon

- 🔄 Session switching without restart
- 💾 Conversation history export
- 🎨 Custom themes
- 📊 Usage analytics
- 🔐 Enhanced credential management
- 🌐 Proxy support
- 🔗 Provider-specific integrations
