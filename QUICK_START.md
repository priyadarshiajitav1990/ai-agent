# Quick Start Guide

## 5-Minute Setup with New Capabilities

### Step 1: Installation
```bash
npm install uuid dotenv
```

### Step 2: Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys (optional - can authenticate via browser on first run)
```

**Add these new environment variables:**
```env
# Amazon Q (AWS)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key

# Local Model
LOCAL_MODEL_ENDPOINT=http://localhost:11434
```

### Step 3: Start the Agent
```bash
npm run dev
```

### Step 4: Authenticate
- Choose your AI provider (Gemini, GitHub Copilot, Microsoft Copilot, Azure OpenAI, **Amazon Q**, **OpenRouter**, or **Local**)
- Browser automatically opens for authentication
- Grant permissions
- Return to terminal

### Step 5: Start Using!

## NEW: Module Examples

### Example 1: Task Planning
```typescript
import { TaskPlanner } from './src/task-planner';

const planner = new TaskPlanner('info');
const plan = planner.analyzeRequest(
  'Create a REST API with authentication and deploy to AWS'
);
console.log(planner.displayPlan());
```

### Example 2: Web Research
```typescript
import { WebAccessModule } from './src/web-access';

const webModule = new WebAccessModule();
const content = await webModule.fetchWebsite('https://example.com');
console.log(content.title);
console.log(content.links);
```

### Example 3: Code Generation
```typescript
import { CodeGenerator } from './src/code-generator';

const codeGen = new CodeGenerator();
const code = codeGen.generateCode(
  'api',
  'rest-endpoint',
  'typescript',
  { method: 'post', endpoint: '/api/users', logic: 'createUser()' }
);
console.log(code.code);
```

### Example 4: Command Execution
```typescript
import { CommandExecutor } from './src/command-executor';

const executor = new CommandExecutor('info', { sandboxMode: true });
const result = await executor.executeCommand('npm list');
console.log(result.stdout);
```

### Example 5: Provider Switching
```typescript
import { ProviderConfigManager } from './src/provider-config';

const manager = new ProviderConfigManager();
manager.createAmazonQProvider('amazon-q', credentials, {}, true);
manager.setActiveProvider('amazon-q');
console.log(manager.getActiveProvider()?.name);
```

## Common Usage Patterns

### Pattern 1: Chat with AI

```
You: Can you help me understand async/await?
Assistant: [Detailed explanation with code examples]

You: Create a TypeScript file with an example
Assistant: I can help! Use this command:
         create file ~/example.ts with [code content]

You: create file ~/example.ts with export async function fetchData() { return await fetch('...'); }
✅ File created successfully
```

### Pattern 2: Research & Report
```
You: Research the latest AI trends and create a report
Assistant: I'll research this for you...

✅ Found 15 relevant articles
✅ Extracted key information
✅ Generated comprehensive report

📄 Download: report-2024.html
```

### Pattern 3: Project Setup

```
You: Create a new project structure for a Node.js API
Agent: I'll help! Let me set up the directories and files.

create directory ~/my-app/src
create directory ~/my-app/tests
create directory ~/my-app/docs

create file ~/my-app/package.json with {"name": "my-app", "version": "1.0.0"}
create file ~/my-app/README.md with # My App

list ~/my-app
✅ Project structure created!
```

### Pattern 3: Configuration Management

```
You: Create a config file for my application
create file ~/app.config with {
  "port": 3000,
  "env": "development",
  "db": "mongodb://localhost:27017"
}

You: Show me the config
read file ~/app.config
```

### Pattern 4: Multiple Providers

```
You: /menu
→ Select "Switch Account"
→ Choose different provider
→ Restart chat session

Now chatting with different provider!
```

## Command Reference

### Chat Commands
| Command | Use | Example |
|---------|-----|---------|
| `/info` | Session info | `/info` |
| `/clear` | Clear history | `/clear` |
| `/menu` | Main menu | `/menu` → Switch Account |
| `/files` | File help | `/files` |
| `/exit` | Quit | `/exit` |

### File Commands (Natural Language)

**Create Files:**
```
create file ~/file.txt with content
write ~/file.txt containing content
```

**Read Files:**
```
read file ~/file.txt
show ~/file.txt
```

**Update Files:**
```
update file ~/file.txt with new content
modify ~/file.txt to content
```

**Delete Files:**
```
delete file ~/file.txt
remove file ~/file.txt
```

**Directories:**
```
create directory ~/folder
list ~/folder
delete directory ~/folder recursive
```

**File Operations:**
```
copy ~/file.txt to ~/backup.txt
move ~/file.txt to ~/new/location.txt
rename ~/file.txt as backup.txt
info ~/file.txt
```

**Navigation:**
```
pwd
cd ~/directory
```

## Real-World Examples

### Example 1: Generate and Create Code File

```
You: Generate a hello world program in Python
Agent: Here's a Python hello world:
       print("Hello, World!")

You: create file ~/hello.py with print("Hello, World!")
✅ File created successfully

You: Now create a version with a function
create file ~/hello_func.py with def greet(name):
    print(f"Hello, {name}!")

greet("World")

You: List my files
list ~/
→ [hello.py, hello_func.py, ...]
```

### Example 2: Setup Project with AI Help

```
You: Help me set up a new TypeScript project
Agent: I'll create a complete structure:

create directory ~/ts-project/src
create directory ~/ts-project/dist
create directory ~/ts-project/tests

create file ~/ts-project/package.json with {
  "name": "ts-project",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}

create file ~/ts-project/tsconfig.json with {
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "outDir": "./dist"
  }
}

create file ~/ts-project/src/index.ts with export function hello(name: string): string {
  return `Hello, ${name}!`;
}

You: list ~/ts-project/src
→ Project created!
```

### Example 3: Config File Generation

```
You: Create a database configuration file
create file ~/db.config with {
  "production": {
    "host": "prod.db.example.com",
    "port": 5432,
    "database": "prod_db",
    "ssl": true
  },
  "development": {
    "host": "localhost",
    "port": 5432,
    "database": "dev_db",
    "ssl": false
  }
}

You: Show me the production config
read file ~/db.config
→ [Complete file contents]

You: Update dev settings
update file ~/db.config with {
  "production": {...},
  "development": {
    "host": "localhost",
    "port": 5432,
    "database": "dev_db",
    "ssl": false,
    "verbose": true
  }
}
```

## Tips & Tricks

### Tip 1: Use Relative Paths
```
cd ~/projects
create file app.config with {...}  # Creates in ~/projects
list .                              # Lists current directory
```

### Tip 2: Chain Operations
```
create directory ~/backup
copy ~/important.txt to ~/backup/important.txt
list ~/backup                       # Verify backup
```

### Tip 3: Navigation
```
pwd                                 # Check location
cd ~/projects/myapp                 # Navigate
list .                              # See contents
cd ..                               # Go up one level
```

### Tip 4: Get File Info
```
info ~/my-config.json
→ Shows: size, creation date, permissions, etc.
```

### Tip 5: Ask AI to Generate Content
```
You: Generate a Docker configuration file
Agent: [Provides Dockerfile content]

You: create file ~/Dockerfile with [content from agent]
✅ Created!
```

## Switching Providers

### From Chat Session
```
You: /menu
→ Choose "Accounts"
→ Select "Switch Account"
→ Choose different provider
→ Chat continues with new provider
```

### Adding New Account
```
You: /menu
→ Choose "Accounts"
→ Select "Add Account"
→ Choose provider
→ Complete browser authentication
→ Account saved!
```

## Troubleshooting

### Q: File command not recognized
**A:** Use `/files` to see correct syntax, then adjust command

### Q: "Permission denied" error
**A:** Check file permissions or try different directory

### Q: Path not found
**A:** Use `pwd` to check current directory, then navigate with `cd`

### Q: Need help with syntax
**A:** Just ask! "Show me how to create a file"
    Agent will provide correct syntax

## Advanced Usage

### Create Multiple Files
```
create file ~/project/file1.txt with content1
create file ~/project/file2.txt with content2
create file ~/project/file3.txt with content3
list ~/project
```

### Backup Important Files
```
copy ~/important.json to ~/important.backup.json
```

### Project Templates
```
create directory ~/new-project/src
create directory ~/new-project/tests
create file ~/new-project/README.md with # New Project
create file ~/new-project/.gitignore with node_modules/
```

## Environment Variables

Optional setup in `.env`:
```env
# Logging level
LOG_LEVEL=info              # debug, info, warn, error

# Default provider (optional)
DEFAULT_PROVIDER=gemini     # gemini, github-copilot, microsoft-copilot, azure-openai

# API keys (optional - can authenticate via browser)
GEMINI_API_KEY=your_key
GITHUB_TOKEN=your_token
AZURE_OPENAI_KEY=your_key
```

## Next Steps

1. **Start the agent**: `npm run dev`
2. **Choose provider**: Select Gemini, GitHub Copilot, Microsoft Copilot, or Azure OpenAI
3. **Authenticate**: Browser opens automatically
4. **Start chatting**: Ask questions or give file commands
5. **Explore**: Try different providers and file operations

## Full Documentation

For complete documentation, see:
- [README.md](README.md) - Overview and installation
- [MULTI_PROVIDER_GUIDE.md](MULTI_PROVIDER_GUIDE.md) - Provider details
- [FILE_MANAGEMENT_GUIDE.md](FILE_MANAGEMENT_GUIDE.md) - File operations
- [FILE_ACCESS_IMPLEMENTATION.md](FILE_ACCESS_IMPLEMENTATION.md) - Technical details

## Support

- **Syntax help**: Type `/files` in chat
- **Command reference**: See FILE_MANAGEMENT_GUIDE.md
- **Issues**: Check logs with `DEBUG=true npm run dev`
- **Questions**: Read the comprehensive guides above

---

**You're ready to start!** 🚀

```bash
npm run dev
```

Choose your AI provider and start chatting!
