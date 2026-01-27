// ARCHITECTURE.md

# 🏗️ AI Agent Architecture

## System Overview

The Gemini AI Code Assist Agent is a full-stack application that combines:
- **Google Gemini AI** for code assistance
- **Google Cloud Platform** for project management
- **OAuth 2.0** for secure authentication
- **Node.js/TypeScript** for runtime and type safety

## Component Architecture

### 1. Authentication Layer (`src/auth.ts`)

**Purpose**: Secure OAuth 2.0 authentication with automatic browser redirect

**Responsibilities**:
- Initialize OAuth2 client with Google credentials
- Generate authorization URL
- Automatically open browser for login
- Handle authorization code flow
- Store and retrieve credentials securely
- Validate token expiration

**File Storage**:
```
~/.ai-agent/credentials.json
└── Contains: access_token, refresh_token, expiry_date, scope
```

**Flow Diagram**:
```
User Run → Check Credentials → Credentials Valid?
                ├─ Yes: Load cached credentials
                └─ No: Generate OAuth URL → Open Browser → 
                       User Authorizes → Get Token → Save Credentials
```

### 2. Google Cloud Integration (`src/gcloud.ts`)

**Purpose**: Interact with Google Cloud Platform APIs

**Responsibilities**:
- Fetch list of GCP projects
- Get available AI models
- Enable required API services
- Manage authentication with Cloud APIs

**Supported Models**:
- Gemini 2.0 Flash
- Gemini 2.0 Pro
- Gemini 1.5 Pro
- Gemini 1.5 Flash
- PaLM 2 (Text Bison)
- PaLM 2 (Code Bison)

**APIs Used**:
- Cloud Resource Manager API (list projects)
- Google Generative AI API (models)
- Service Management API (enable services)

### 3. Interactive UI Layer (`src/selectors.ts`)

**Purpose**: Provide user-friendly dropdown selections

**Components**:
- **Project Selector**: Browse and select GCP projects
- **Model Selector**: Choose AI models
- **Menu System**: Navigate app features
- **Confirmation Dialogs**: Verify selections

**UI Framework**: `inquirer` - Terminal UI library

### 4. AI Agent Core (`src/agent.ts`)

**Purpose**: Handle AI interactions and conversation management

**Responsibilities**:
- Communicate with Gemini API
- Maintain conversation history
- Generate system prompts
- Handle API responses
- Manage session state

**Key Features**:
- Stateful conversations
- System prompt integration
- Error handling and recovery
- Session tracking

**Conversation Flow**:
```
User Message 
  ↓
Add to history
  ↓
Prepare API payload
  ↓
Call Gemini API
  ↓
Parse response
  ↓
Add response to history
  ↓
Return to user
```

### 5. Session Management (`src/session.ts`)

**Purpose**: Track user sessions and activity

**Responsibilities**:
- Create and manage sessions
- Track session activity
- Archive old sessions
- Generate session statistics

**Session Storage**:
```
~/.ai-agent/sessions/
├── session_xxx.json (active)
├── session_yyy.json (active)
└── archive/
    └── session_zzz_archived.json
```

### 6. Configuration Management (`src/config.ts`)

**Purpose**: Load and validate environment configuration

**Environment Variables**:
```env
GEMINI_API_KEY          # Required
MODEL_NAME              # Default: gemini-2.0-flash
AGENT_NAME              # Default: CodeAssistant
LOG_LEVEL               # Default: info
GOOGLE_OAUTH_CLIENT_ID  # For GCP projects
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
```

### 7. Logging System (`src/logger.ts`)

**Purpose**: Provide structured logging

**Log Levels**:
- `debug`: Verbose debugging information
- `info`: General information (default)
- `warn`: Warning messages
- `error`: Error messages only

**Log Format**:
```
[2024-01-27T10:30:45.123Z] [INFO] Message here
```

### 8. Type Definitions (`src/types.ts`)

**Purpose**: Centralized TypeScript interfaces

**Key Types**:
```typescript
Message          // User/assistant message pair
AgentResponse    // API response structure
ConversationContext  // Session conversation data
```

### 9. Main Entry Point (`src/index.ts`)

**Purpose**: Orchestrate the entire application flow

**Startup Sequence**:
1. Load environment config
2. Initialize authentication
3. Authenticate user (if needed)
4. Fetch GCP projects
5. Get user project selection
6. Fetch available models
7. Get user model selection
8. Initialize agent with selected model
9. Start interactive chat session
10. Handle user commands and chat

## Data Flow Architecture

### Authentication Flow
```
┌─────────────────────────────────────────────────────┐
│ User starts application                             │
└────────────────┬────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ Check ~/.ai-agent/credentials.json exists?          │
└────────────────┬────────────────────────────────────┘
         ┌───────┴────────┐
         ↓                 ↓
      Yes                  No
         ↓                 ↓
  Load from disk    Generate OAuth URL
         ↓                 ↓
  Validate token    Open browser automatically
         ↓                 ↓
  Reuse creds       User logs in & approves
         ↓                 ↓
         └────────┬────────┘
                  ↓
         Continue to project selection
```

### Chat Flow
```
┌──────────────────┐
│ User input       │
└────────┬─────────┘
         ↓
┌──────────────────────────────┐
│ Add to conversation history  │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ Prepare API request with history context│
└────────┬─────────────────────────────────┘
         ↓
┌─────────────────────────────┐
│ Call Gemini API             │
└────────┬────────────────────┘
         ↓
┌────────────────────────────────┐
│ Parse and validate response    │
└────────┬───────────────────────┘
         ↓
┌──────────────────────────────┐
│ Add response to history      │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────────┐
│ Display to user              │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────────┐
│ Wait for next input          │
└──────────────────────────────┘
```

## Directory Structure

```
ai-agent/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point
│   ├── agent.ts                  # Gemini agent
│   ├── auth.ts                   # OAuth authentication
│   ├── gcloud.ts                 # GCP integration
│   ├── selectors.ts              # UI components
│   ├── session.ts                # Session management
│   ├── config.ts                 # Configuration
│   ├── logger.ts                 # Logging
│   └── types.ts                  # Type definitions
├── dist/                         # Compiled JavaScript
├── .env                          # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── start.sh                      # Quick start script
├── SETUP_GUIDE.md               # Setup instructions
├── ARCHITECTURE.md              # This file
└── README.md                    # Documentation
```

## Dependency Graph

```
index.ts (Main)
    ├── config.ts
    ├── logger.ts
    ├── auth.ts
    │   └── logger.ts
    ├── gcloud.ts
    │   ├── logger.ts
    │   └── googleapis
    ├── selectors.ts
    │   ├── logger.ts
    │   └── inquirer
    ├── agent.ts
    │   ├── logger.ts
    │   ├── types.ts
    │   └── @google/generative-ai
    ├── session.ts
    │   └── logger.ts
    └── types.ts
```

## External Dependencies

### Production Dependencies
- `@google/generative-ai`: Gemini API client
- `googleapis`: Google APIs client library
- `inquirer`: Interactive CLI prompts
- `open`: Open URLs in default browser
- `simple-oauth2`: OAuth 2.0 client
- `dotenv`: Environment variable loader

### Development Dependencies
- `typescript`: TypeScript compiler
- `ts-node`: TypeScript REPL
- `@types/node`: Node.js type definitions

## Security Considerations

### Credential Storage
- Credentials stored in `~/.ai-agent/credentials.json`
- File permissions set to 0600 (owner read/write only)
- OAuth tokens expire and are automatically refreshed
- Refresh tokens stored for extended sessions

### API Keys
- Gemini API key loaded from environment
- Never logged or exposed in output
- Should be treated as sensitive data

### OAuth Flow
- No server implementation needed
- User authorizes directly with Google
- Tokens handled securely locally
- Browser-based authentication for security

## Error Handling Strategy

### Graceful Degradation
```
Try operation
  ├─ Success: Return result
  ├─ Network error: Log & retry or use cache
  ├─ Auth error: Prompt re-authentication
  └─ Other error: Log & show user-friendly message
```

### Error Types
1. **Authentication Errors**: Handled by auth.ts
2. **API Errors**: Caught in agent.ts, logged and reported
3. **Configuration Errors**: Validated in config.ts startup
4. **File I/O Errors**: Handled with try-catch in session.ts

## Performance Considerations

### Caching
- Credentials cached locally to avoid re-authentication
- Session data stored for quick access
- Project/model lists fetched once per session

### Optimization
- Lazy loading of dependencies
- Async/await for non-blocking operations
- Efficient conversation history management

## Testing Strategy

### Test Categories
1. **Unit Tests**: Individual module functionality
2. **Integration Tests**: Multi-module interactions
3. **End-to-End Tests**: Full application flow

### Key Test Scenarios
- Authentication flow with valid/invalid credentials
- Project and model selection
- Chat message handling
- Error recovery
- Session management

## Future Architecture Enhancements

1. **Database Layer**: Replace JSON file storage with database
2. **API Server**: REST API for programmatic access
3. **Plugin System**: Extend functionality with plugins
4. **Web UI**: Browser-based interface
5. **Clustering**: Multi-user support
6. **Analytics**: Usage tracking and insights
7. **Advanced Caching**: Redis for distributed caching

## Deployment Architecture

### Single User (Current)
```
User Machine
    └── Node.js App
        ├── Credentials
        ├── Sessions
        └── Config
```

### Multi-User (Future)
```
Cloud Server
    ├── API Gateway
    ├── Database (PostgreSQL/MongoDB)
    ├── Auth Service
    ├── Agent Service
    └── Session Manager

    ↑
Multiple Users (Web/Desktop/CLI)
```

## Conclusion

The architecture is designed to be:
- **Modular**: Each component has a single responsibility
- **Scalable**: Can be extended with new features
- **Secure**: Credentials handled carefully
- **User-Friendly**: Interactive CLI with clear prompts
- **Maintainable**: Well-organized code with clear separation of concerns
