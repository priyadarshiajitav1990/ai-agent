# 🎯 AI Agent System Architecture Diagrams

## Application Startup Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ User runs: npm start                                                  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓
                ┌──────────────────────────┐
                │ Load .env configuration  │
                └──────────────┬───────────┘
                               │
                               ↓
                    ┌───────────────────────┐
                    │ Initialize Logger     │
                    └──────────┬────────────┘
                               │
                               ↓
        ┌──────────────────────────────────────────┐
        │ Initialize AuthenticationManager         │
        └──────────┬───────────────────────────────┘
                   │
                   ↓
        ┌────────────────────────────────┐
        │ Check ~/.ai-agent/credentials  │
        └────────┬──────────────┬────────┘
                 │              │
         ┌───────┘              └──────────┐
         │ EXISTS & VALID       NOT EXISTS/EXPIRED
         │                      │
         ↓                      ↓
    Use Cached        ┌────────────────────────┐
    Credentials       │ Generate OAuth URL     │
         │            └────────┬───────────────┘
         │                     │
         │                     ↓
         │            ┌────────────────────────┐
         │            │ Open Browser           │
         │            │ (automatic redirect)   │
         │            └────────┬───────────────┘
         │                     │
         │                     ↓
         │            ┌────────────────────────┐
         │            │ User authorizes        │
         │            └────────┬───────────────┘
         │                     │
         │                     ↓
         │            ┌────────────────────────┐
         │            │ Exchange code for token│
         │            └────────┬───────────────┘
         │                     │
         │                     ↓
         │            ┌────────────────────────┐
         │            │ Save to ~/. ai-agent/  │
         │            │ credentials.json       │
         │            └────────┬───────────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ↓
        ┌──────────────────────────────────────┐
        │ Initialize GoogleCloudIntegration    │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Set credentials on GCloud instance   │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Fetch GCP projects via API           │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Display project selection dropdown   │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ User selects project                 │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Fetch available AI models            │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Display model selection dropdown     │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ User selects model                   │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Confirm selection (project + model)  │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Initialize GeminiCodeAssistAgent     │
        │ with selected model                  │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Create new SessionManager            │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Display welcome & start chat prompt  │
        └──────────────────────────────────────┘
```

## Chat Message Flow

```
┌────────────────────────────────┐
│ User types message & presses   │
│ Enter                          │
└──────────────┬─────────────────┘
               │
               ↓
    ┌──────────────────────┐
    │ Check for commands   │
    │ (/menu, /info, etc)  │
    └────────┬──────┬──────┘
             │      │
      Is Cmd │      │ Regular
             │      │ Message
             ↓      ↓
        Handle   ┌──────────────────────┐
        Command  │ Add to conversation  │
             │   │ history              │
             │   └──────────┬───────────┘
             │              │
             │              ↓
             │   ┌──────────────────────────┐
             │   │ Prepare API payload with │
             │   │ full conversation history│
             │   └──────────┬───────────────┘
             │              │
             │              ↓
             │   ┌──────────────────────────┐
             │   │ Call Gemini API with     │
             │   │ selected model           │
             │   └──────────┬───────────────┘
             │              │
             │              ↓
             │   ┌──────────────────────────┐
             │   │ Parse response           │
             │   │ Handle errors if needed  │
             │   └──────────┬───────────────┘
             │              │
             │              ↓
             │   ┌──────────────────────────┐
             │   │ Add response to history  │
             │   └──────────┬───────────────┘
             │              │
             └──────┬───────┘
                    │
                    ↓
        ┌───────────────────────┐
        │ Display to user       │
        │ Update session activity
        └───────────┬───────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │ Wait for next input   │
        └───────────────────────┘
```

## Component Interaction Diagram

```
                    ┌─────────────────────────┐
                    │      index.ts           │
                    │     (Main Entry)        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ↓                         ↓
            ┌──────────────┐         ┌──────────────┐
            │   auth.ts    │         │  config.ts   │
            │ (OAuth Flow) │         │(Environment) │
            └──────┬───────┘         └──────────────┘
                   │
                   ↓
            ┌──────────────┐
            │ credentials  │
            │   Storage    │
            └──────────────┘

                   │
                   ↓
        ┌──────────────────────┐
        │    gcloud.ts         │
        │ (GCP Integration)    │
        └────────┬─────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │  GCP APIs              │
        │  (Projects, Models)    │
        └────────────────────────┘

                 │
                 ↓
        ┌──────────────────────┐
        │   selectors.ts       │
        │ (UI Dropdowns)       │
        └────────┬─────────────┘
                 │
                 ↓
        ┌──────────────────────┐
        │    inquirer.js       │
        │  (Terminal Prompts)  │
        └────────────────────────┘

                 │
                 ↓
        ┌──────────────────────┐
        │    agent.ts          │
        │ (Gemini Integration) │
        └────────┬─────────────┘
                 │
                 ↓
        ┌──────────────────────┐
        │  Gemini API          │
        │  (AI Processing)     │
        └────────────────────────┘

                 │
                 ↓
        ┌──────────────────────┐
        │   session.ts         │
        │ (Session Tracking)   │
        └────────┬─────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │  Session Storage       │
        │  (~/.ai-agent/sessions)│
        └────────────────────────┘
```

## Authentication State Machine

```
                    ┌─────────────┐
                    │   INITIAL   │
                    └──────┬──────┘
                           │
                    ┌──────┴────────┐
                    │               │
              YES   │               │   NO
                    ↓               ↓
        ┌─────────────────┐  ┌──────────────────┐
        │ CACHED_VALID    │  │ NEED_AUTH        │
        │                 │  │                  │
        │ Use cached      │  │ Generate OAuth   │
        │ credentials     │  │ URL              │
        └────────┬────────┘  └────────┬─────────┘
                 │                    │
                 │                    ↓
                 │           ┌──────────────────┐
                 │           │ BROWSER_OPENED   │
                 │           │                  │
                 │           │ User authorizes  │
                 │           └────────┬─────────┘
                 │                    │
                 │                    ↓
                 │           ┌──────────────────┐
                 │           │ EXCHANGING_TOKEN │
                 │           │                  │
                 │           │ Get access token │
                 │           └────────┬─────────┘
                 │                    │
                 │                    ↓
                 │           ┌──────────────────┐
                 │           │ SAVING_CREDS     │
                 │           │                  │
                 │           │ Save credentials │
                 │           └────────┬─────────┘
                 │                    │
                 └────────┬───────────┘
                          │
                          ↓
                    ┌──────────────┐
                    │ AUTHENTICATED│
                    │              │
                    │ Ready for    │
                    │ operations   │
                    └──────────────┘
```

## Data Flow: Project Selection to Chat

```
Authentication Complete
        │
        ↓
    ┌─────────────────────────────────┐
    │ Fetch GCP Projects              │
    │ cloud resource manager API      │
    └────────────┬────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Projects Array:                  │
    │ [                                │
    │   {projectId, projectName},      │
    │   {projectId, projectName},      │
    │   ...                            │
    │ ]                                │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Interactive Dropdown             │
    │ (Powered by inquirer.js)         │
    │ ──────────────────────────────   │
    │ 📁 Project Selection             │
    │                                  │
    │ > Project A (ID-123)             │
    │   Project B (ID-456) ← selected  │
    │   Project C (ID-789)             │
    └────────────┬─────────────────────┘
                 │
                 ↓ User Selects
    ┌──────────────────────────────────┐
    │ Selected Project: Project B       │
    │ ProjectId: ID-456                │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Fetch Available Models           │
    │ For Project ID-456               │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Models Array:                    │
    │ [                                │
    │   {id, name, provider},          │
    │   {id, name, provider},          │
    │   ...                            │
    │ ]                                │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Interactive Dropdown             │
    │ (Model Selection)                │
    │ ──────────────────────────────   │
    │ 🤖 Model Selection               │
    │                                  │
    │   Gemini 2.0 Flash               │
    │ > Gemini 2.0 Pro ← selected      │
    │   Gemini 1.5 Pro                 │
    └────────────┬─────────────────────┘
                 │
                 ↓ User Selects
    ┌──────────────────────────────────┐
    │ Selected: Gemini 2.0 Pro         │
    │ ModelId: gemini-2.0-pro          │
    │ ProjectId: ID-456                │
    └────────────┬─────────────────────┘
                 │
                 ↓ Confirm?
    ┌──────────────────────────────────┐
    │ Continue with Project B and      │
    │ Gemini 2.0 Pro?                  │
    │                                  │
    │ (Y/n)                            │
    └────────────┬─────────────────────┘
                 │
                 ↓ Yes
    ┌──────────────────────────────────┐
    │ Initialize Agent                 │
    │ projectId: ID-456                │
    │ modelId: gemini-2.0-pro          │
    │ API Key: (from env)              │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ Create Session                   │
    │ Store: projectId, modelId, etc   │
    └────────────┬─────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────┐
    │ START CHAT SESSION               │
    │                                  │
    │ Project: Project B               │
    │ Model: Gemini 2.0 Pro            │
    │                                  │
    │ You: [ready for input]           │
    └──────────────────────────────────┘
```

## Security & Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Machine                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │  Application (.env)              │                           │
│  │  ├─ GEMINI_API_KEY (sensitive)  │──┐                        │
│  │  ├─ OAUTH_CLIENT_ID             │  │                        │
│  │  └─ OAUTH_CLIENT_SECRET         │  │                        │
│  └──────────────────────────────────┘  │                        │
│                                         │ Loaded in memory      │
│  ┌──────────────────────────────────┐  │ (NOT persisted)       │
│  │  ~/.ai-agent/                   │◄─┘                        │
│  │  ├─ credentials.json            │                           │
│  │  │  (OAuth tokens only)         │                           │
│  │  │  Permissions: 0600           │                           │
│  │  │                              │                           │
│  │  └─ sessions/                   │                           │
│  │     ├─ session_1.json           │                           │
│  │     ├─ session_2.json           │                           │
│  │     └─ archive/                 │                           │
│  │        └─ old_sessions.json     │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Key Points:
✅ GEMINI_API_KEY: Environment only (not in files)
✅ OAuth tokens: Credentials file (0600 permissions)
✅ Sessions: Separate JSON files (for tracking)
✅ Encrypted: No encryption (stored in plaintext at ~/.ai-agent/)
```

## Full System Context

```
┌──────────────────────────────────────────────────────────────────────┐
│                     GEMINI AI CODE ASSIST AGENT                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Input ─────┬─────────────────────────────────────┐             │
│                  ↓                                       │             │
│          ┌──────────────┐                              │             │
│          │  CLI Input   │ (readline)                   │             │
│          └──────┬───────┘                              │             │
│                 │                                       │             │
│          Command Detection:                            │             │
│          • /menu → Show main menu                      │             │
│          • /clear → Clear history                      │             │
│          • /info → Show session info                   │             │
│          • /exit → Quit app                            │             │
│          • Other → Send to AI                          │             │
│                 │                                       │             │
│                 ↓                                       │             │
│         ┌──────────────────────┐                       │             │
│         │ GeminiCodeAssistAgent│                       │             │
│         │                      │                       │             │
│         │ • Maintain history   │                       │             │
│         │ • Generate prompts   │                       │             │
│         │ • API communication  │                       │             │
│         └────────┬─────────────┘                       │             │
│                  │                                      │             │
│                  ↓                                      │             │
│     ┌────────────────────────────┐                     │             │
│     │  Gemini API (@google/      │                     │             │
│     │  generative-ai)            │                     │             │
│     │                            │                     │             │
│     │  • Selected Model          │                     │             │
│     │    (gemini-2.0-pro, etc)   │                     │             │
│     │  • Conversation Context    │                     │             │
│     │  • Safety Settings         │                     │             │
│     └────────┬───────────────────┘                     │             │
│              │                                          │             │
│              ↓                                          │             │
│  ┌──────────────────────────────────────────┐          │             │
│  │  Google Generative AI API (Cloud)        │          │             │
│  │  ─────────────────────────────────────   │          │             │
│  │  • Model Processing                      │          │             │
│  │  • Token Generation                      │          │             │
│  │  • Response Streaming                    │          │             │
│  └────────────┬─────────────────────────────┘          │             │
│               │                                         │             │
│               ↓                                         │             │
│          AI Response                                   │             │
│               │                                         │             │
│               ↓                                         │             │
│         ┌────────────────────────────┐                │             │
│         │ Add to Conversation History│                │             │
│         │ Update Session Activity    │                │             │
│         └────────┬───────────────────┘                │             │
│                  │                                     │             │
│                  └──────────────────────────────────┬──┘             │
│                                                     │                │
│                                                     ↓                │
│                                          ┌──────────────────┐        │
│                                          │ Format & Display │        │
│                                          │ to User          │        │
│                                          └──────────────────┘        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

These diagrams show the complete flow and architecture of the AI agent system!
