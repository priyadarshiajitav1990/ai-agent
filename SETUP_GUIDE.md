// SETUP_GUIDE.md

# 🚀 AI Agent Setup Guide

Follow this step-by-step guide to set up the Gemini AI Code Assist Agent.

## Step 1: Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Google account
- Active Google Cloud Platform account

## Step 2: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ai-agent

# Install dependencies
npm install
```

## Step 3: Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key
5. Save it safely (you'll need it in the next step)

## Step 4: Get Google OAuth Credentials

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (if you don't have one):
   - Click "Select a Project" → "New Project"
   - Name it (e.g., "AI Agent")
   - Click "Create"
3. Enable required APIs:
   - Search for "Cloud Resource Manager API"
   - Click on it and press "Enable"
4. Create OAuth consent screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in the form with basic info
   - Click "Save and Continue"
5. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Desktop application"
   - Name it (e.g., "AI Agent CLI")
   - Click "Create"
6. A popup will show your credentials:
   - Copy **Client ID**
   - Copy **Client Secret**
   - Click "OK"

## Step 5: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
# or
vim .env
# or use VS Code
code .env
```

Fill in your credentials:

```env
# Required: Your Gemini API key from Step 3
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Adjust as needed
MODEL_NAME=gemini-2.0-flash
AGENT_NAME=CodeAssistant
LOG_LEVEL=info

# From Step 4: Your OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Step 6: Build the Project

```bash
npm run build
```

## Step 7: First Run

```bash
npm start
```

### What happens on first run:

1. ✅ System checks for credentials
2. ✅ Browser opens automatically for Google login
3. 🔐 You authorize the application
4. ✅ Credentials are saved securely
5. 📁 Your GCP projects are displayed
6. 🎯 You select a project
7. 🤖 Available AI models are shown
8. 🎯 You select a model
9. 💬 Chat interface starts

## Step 8: Using the Agent

Once the chat interface is running:

```
You: How do I create a REST API in Node.js?
Assistant: [Detailed response with code examples]

You: /info
(Shows session details)

You: /menu
(Opens main menu with options)

You: /exit
(Quits the application)
```

## Common Issues

### Issue: "GEMINI_API_KEY environment variable is required"

**Solution:**
- Ensure `.env` file exists in the project root
- Verify `GEMINI_API_KEY` is set correctly
- Check the API key is valid in Google AI Studio

### Issue: Browser doesn't open automatically

**Solution:**
- The OAuth URL will be displayed in the terminal
- Copy the URL and paste it into your browser manually

### Issue: "No projects available"

**Solution:**
- Create a GCP project in [Google Cloud Console](https://console.cloud.google.com)
- Ensure OAuth credentials have proper permissions
- Verify Cloud Resource Manager API is enabled

### Issue: "Failed to get projects"

**Solution:**
- Delete `~/.ai-agent/credentials.json`
- Run the application again to re-authenticate

## File Structure After Setup

```
ai-agent/
├── src/                          # Source TypeScript files
├── dist/                         # Compiled JavaScript
├── node_modules/                 # Dependencies
├── .env                          # Your credentials (created in Step 5)
├── .env.example                  # Example file
├── package.json
├── tsconfig.json
└── README.md
```

## Credentials Location

Your OAuth credentials are stored securely at:
```
~/.ai-agent/credentials.json
```

This file is created after first login. File permissions are set to `0600` (readable/writable only by you).

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Commands Reference

### CLI Commands

| Command | Description |
|---------|-------------|
| `/menu` | Open main menu |
| `/clear` | Clear conversation history |
| `/info` | Show session information |
| `/exit` | Quit the application |
| Regular message | Send to the AI agent |

### npm Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run dev` | Run in development mode |
| `npm start` | Run production build |

## Next Steps

1. ✅ Complete the setup following this guide
2. 📚 Read [README.md](README.md) for detailed documentation
3. 💬 Start chatting with the AI agent
4. 🔧 Explore settings and customization options
5. 🚀 Build your own extensions

## Support

If you encounter any issues:

1. Check the [README.md](README.md) troubleshooting section
2. Review your `.env` configuration
3. Ensure all prerequisites are installed
4. Check Google Cloud Console for API status

Happy coding! 🎉
