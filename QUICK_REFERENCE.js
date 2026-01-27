#!/usr/bin/env node

/**
 * AI AGENT QUICK REFERENCE
 * 
 * A complete guide to the Gemini AI Code Assist Agent
 * with OAuth authentication and Google Cloud integration
 */

// ============================================================================
// QUICK START
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    🤖 AI AGENT QUICK REFERENCE                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📚 DOCUMENTATION FILES:
  • README.md - Main documentation
  • SETUP_GUIDE.md - Step-by-step setup (START HERE!)
  • ARCHITECTURE.md - Technical details
  • IMPLEMENTATION_SUMMARY.md - What's new

🚀 QUICK START:
  1. npm install
  2. cp .env.example .env
  3. Edit .env with your API keys
  4. npm run build
  5. npm start

  OR just run:
  ./start.sh

═══════════════════════════════════════════════════════════════════════════

🔐 AUTHENTICATION

First Run:
  • System checks for credentials
  • Browser opens automatically (or URL provided)
  • You authorize with Google
  • Credentials saved securely

Subsequent Runs:
  • Credentials loaded from ~/.ai-agent/credentials.json
  • No re-authentication needed (until token expires)

Logout:
  • Press /menu then select "Logout"
  • Delete ~/.ai-agent/credentials.json manually

═══════════════════════════════════════════════════════════════════════════

📁 PROJECT SELECTION

Interactive Dropdown:
  • Shows all your GCP projects
  • Select one to use
  • Credentials stored in session

Available Models:
  • Gemini 2.0 Flash (fastest)
  • Gemini 2.0 Pro (most capable)
  • Gemini 1.5 Pro (balanced)
  • Gemini 1.5 Flash (efficient)
  • PaLM 2 (Text/Code Bison)

═══════════════════════════════════════════════════════════════════════════

💬 CHAT COMMANDS

Regular Chat:
  You: How do I create a REST API?
  > Type anything and press Enter

Main Menu:
  /menu - Open menu (settings, logout, exit)

Session Info:
  /info - Show session details
  • Session ID
  • Message count
  • Creation time
  • Project & Model

Clear History:
  /clear - Clear conversation history

Exit:
  /exit - Quit the application

═══════════════════════════════════════════════════════════════════════════

🔧 ENVIRONMENT VARIABLES

Required:
  GEMINI_API_KEY=your_api_key_here

Optional (for project selection):
  GOOGLE_OAUTH_CLIENT_ID=...
  GOOGLE_OAUTH_CLIENT_SECRET=...
  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

Configuration:
  MODEL_NAME=gemini-2.0-flash (default)
  AGENT_NAME=CodeAssistant (default)
  LOG_LEVEL=info (debug|info|warn|error)

═══════════════════════════════════════════════════════════════════════════

📦 NPM COMMANDS

npm install
  Install dependencies

npm run dev
  Run in development mode with hot reload

npm run build
  Compile TypeScript to JavaScript

npm start
  Run production build

npm test (future)
  Run tests

═══════════════════════════════════════════════════════════════════════════

🔒 SECURITY

Credentials:
  Location: ~/.ai-agent/credentials.json
  Permissions: 0600 (owner read/write only)
  Contains: OAuth tokens (NOT Gemini API key)

API Keys:
  NEVER stored in credentials.json
  Loaded from .env file only
  Keep .env file private

Token Refresh:
  Automatic when token expires
  Re-authenticates user if needed

═══════════════════════════════════════════════════════════════════════════

📊 FILE STRUCTURE

After First Run:
  ~/.ai-agent/
  ├── credentials.json (OAuth tokens)
  └── sessions/
      ├── session_xxx.json
      ├── session_yyy.json
      └── archive/

Project Files:
  ai-agent/
  ├── src/ (TypeScript source)
  ├── dist/ (Compiled JS)
  ├── .env (your config)
  ├── package.json
  └── README.md

═══════════════════════════════════════════════════════════════════════════

🎯 GETTING STARTED

Step 1: Get Gemini API Key
  → Visit https://aistudio.google.com/app/apikeys
  → Click "Create API Key"
  → Copy the key

Step 2: Get Google OAuth Credentials (optional, for projects)
  → Go to https://console.cloud.google.com
  → Create/select project
  → Enable Cloud Resource Manager API
  → Create OAuth 2.0 Desktop credentials
  → Copy Client ID & Secret

Step 3: Configure .env
  → cp .env.example .env
  → Add GEMINI_API_KEY
  → Add OAuth credentials (if have)

Step 4: Run
  → npm install
  → npm run build
  → npm start

═══════════════════════════════════════════════════════════════════════════

❓ TROUBLESHOOTING

"GEMINI_API_KEY required"
  → Add key to .env file
  → Verify it's valid in Google AI Studio

"No projects available"
  → Create a GCP project in Cloud Console
  → Check OAuth credentials permissions

Browser doesn't open
  → Copy the displayed URL
  → Paste into browser manually

"Credentials expired"
  → Delete ~/.ai-agent/credentials.json
  → Restart app to re-authenticate

═══════════════════════════════════════════════════════════════════════════

📞 SUPPORT

Issues? Check:
  1. README.md - Main documentation
  2. SETUP_GUIDE.md - Detailed setup steps
  3. ARCHITECTURE.md - How it works
  4. This file - Quick reference

═══════════════════════════════════════════════════════════════════════════

🎉 FEATURES

✅ OAuth 2.0 authentication with auto-login
✅ Automatic browser redirect (no manual URL copy)
✅ Secure credential storage
✅ Google Cloud project selection
✅ Multiple AI model support
✅ Interactive dropdown menus
✅ Session management
✅ Conversation history
✅ Built with TypeScript
✅ Production ready

═══════════════════════════════════════════════════════════════════════════

Happy coding! 🚀
`);
