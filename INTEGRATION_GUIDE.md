# AI Agent - Comprehensive Integration Guide

## Overview

This document provides a complete guide to integrating all new modules into the AI Agent system. The agent now supports:

- ✅ Multi-provider AI with seamless switching
- ✅ Web access and content retrieval
- ✅ Multi-format document parsing
- ✅ Intelligent task planning and decomposition
- ✅ Safe command execution
- ✅ Code generation with templates
- ✅ Document generation with multiple formats
- ✅ Session persistence and error recovery

---

## Module Architecture

### 1. Web Access Module (`src/web-access.ts`)

**Purpose**: Safely fetch and parse website content from the internet.

**Key Features**:
- URL validation and security checks
- HTML parsing with text extraction
- Link, image, and metadata extraction
- Content caching (5-minute TTL)
- Timeout handling (10 seconds)
- Error recovery

**Usage**:
```typescript
import { WebAccessModule } from './web-access';

const webModule = new WebAccessModule();

// Fetch website
const content = await webModule.fetchWebsite('https://example.com');
console.log(content.title);
console.log(content.links);
console.log(content.images);

// Search web (with caching)
const cached = webModule.getCachedContent('https://example.com');
```

**API**:
- `fetchWebsite(url: string): Promise<WebContent>`
- `parseHtmlContent(html: string): ParsedHtmlContent`
- `searchWeb(query: string): Promise<SearchResults[]>`
- `getCachedContent(url: string): WebContent | null`
- `clearCache(): void`

---

### 2. Document Parser Module (`src/document-parser.ts`)

**Purpose**: Parse and extract information from multiple document formats.

**Supported Formats**:
- Text (.txt)
- Markdown (.md)
- JSON (.json)
- XML (.xml)
- CSV (.csv)
- HTML (.html)
- YAML (.yaml)
- PDF (.pdf) - *Stubbed*
- DOCX (.docx) - *Stubbed*
- XLSX (.xlsx) - *Stubbed*

**Key Features**:
- Format-specific parsing
- Metadata extraction
- Code block extraction
- Link and email extraction
- Heading extraction
- 50MB file size limit
- Key information extraction

**Usage**:
```typescript
import { DocumentParser } from './document-parser';

const parser = new DocumentParser();

// Parse document
const parsed = await parser.parseDocument('./readme.md');
console.log(parsed.content);
console.log(parsed.metadata);
console.log(parsed.keyInfo);

// Extract summary
const summary = await parser.extractSummary('./document.json', 200);

// Extract key info
const keyInfo = await parser.extractKeyInfo('./config.yaml');
```

**API**:
- `parseDocument(filePath: string): Promise<ParsedDocument>`
- `extractSummary(filePath: string, length?: number): Promise<string>`
- `extractKeyInfo(filePath: string): Promise<KeyInfo>`
- `isSupportedType(extension: string): boolean`

---

### 3. Task Planner Module (`src/task-planner.ts`)

**Purpose**: Analyze user requests and break them down into executable tasks.

**Features**:
- Request intent detection
- Complexity analysis
- Subtask generation with dependencies
- Task priority assignment
- Progress tracking
- Execution ordering

**Usage**:
```typescript
import { TaskPlanner } from './task-planner';

const planner = new TaskPlanner();

// Analyze request
const plan = planner.analyzeRequest(
  'Create a TypeScript API with authentication and database integration'
);

console.log(plan.analysis.intent);
console.log(plan.analysis.complexity);
console.log(plan.tasks);

// Display plan
console.log(planner.displayPlan());

// Execute tasks
let nextTask = planner.getNextTask();
while (nextTask) {
  planner.startTask(nextTask.id);
  // Execute task...
  planner.completeTask(nextTask.id, result);
  nextTask = planner.getNextTask();
}

// Check progress
const progress = planner.getPlanProgress();
console.log(`${progress.percentage}% complete`);
```

**API**:
- `analyzeRequest(userRequest: string): TaskPlan`
- `getNextTask(): Task | null`
- `startTask(taskId: string): boolean`
- `completeTask(taskId: string, result: string): boolean`
- `failTask(taskId: string, error: string): boolean`
- `getPlanProgress(): Progress`
- `displayPlan(): string`

---

### 4. Command Executor Module (`src/command-executor.ts`)

**Purpose**: Safely execute OS commands with security boundaries.

**Security Features**:
- Command validation
- Dangerous command blocking
- Timeout enforcement (30 seconds default)
- Output size limits (1MB default)
- Path scope restrictions
- Sandbox mode

**Usage**:
```typescript
import { CommandExecutor } from './command-executor';

const executor = new CommandExecutor('info', {
  allowedPaths: ['/workspaces', '/home/user'],
  blockedCommands: ['rm -rf', 'mkfs'],
  timeoutMs: 30000,
  maxOutputLength: 1024 * 1024,
  sandboxMode: true,
});

// Execute command
const result = await executor.executeCommand('ls -la /workspaces');
console.log(result.stdout);
console.log(result.exitCode);

// Stream output
await executor.executeCommandStream(
  'npm install',
  (data) => console.log(data),
  (error) => console.error(error)
);

// System info
const info = executor.getSystemInfo();
console.log(info.platform, info.arch);

// Command history
console.log(executor.displayCommandHistory());
```

**API**:
- `executeCommand(command: string, options?: CommandExecutionOptions): Promise<CommandResult>`
- `executeCommandStream(command: string, onData: Function): Promise<CommandResult>`
- `getSystemInfo(): SystemInfo`
- `getCommandHistory(limit?: number): CommandResult[]`
- `isPathAllowed(filePath: string): boolean`
- `getSafeCommandsSuggestions(): string[]`

---

### 5. Code Generator Module (`src/code-generator.ts`)

**Purpose**: Generate code from templates with parameter substitution.

**Template Categories**:
- Functions (basic, async, arrow)
- Classes (basic, with interface)
- APIs (REST, GraphQL)
- Tests (unit, integration)
- Python functions and classes
- SQL queries
- Shell scripts

**Supported Languages**: JavaScript, TypeScript, Python, Java, C#, C++, Rust, Go, Ruby, PHP, Shell, SQL, HTML, CSS, YAML, JSON

**Usage**:
```typescript
import { CodeGenerator } from './code-generator';

const generator = new CodeGenerator();

// Generate code from template
const code = generator.generateCode(
  'function',
  'async-function',
  'typescript',
  {
    functionName: 'fetchUserData',
    parameters: 'userId: string',
    returnValue: 'userData',
  }
);

console.log(code.code);
console.log(code.fileName);

// Create custom snippet
const custom = generator.createCustomSnippet(
  'Authentication middleware',
  'export const auth = (req, res, next) => { ... }',
  'typescript',
  'auth-middleware.ts'
);

// List templates
const templates = generator.listTemplates();
console.log(generator.displayTemplates());
```

**API**:
- `generateCode(type, templateName, language, parameters): GeneratedCode`
- `createCustomSnippet(description, code, language, fileName?): GeneratedCode`
- `listTemplates(templateType?): Record<string, CodeTemplate[]>`
- `getSupportedLanguages(): string[]`
- `addCustomTemplate(type: string, template: CodeTemplate): void`

---

### 6. Document Generator Module (`src/document-generator.ts`)

**Purpose**: Generate documents in multiple formats with download capability.

**Supported Formats**: Markdown, HTML, JSON, CSV, XML, Text, YAML

**Built-in Templates**:
- README generator
- Report generator
- HTML page generator
- Data table (CSV)
- Data objects (JSON)
- XML documents
- Text notes

**Features**:
- Template-based generation
- Format conversion (MD ↔ HTML, JSON → CSV, etc.)
- Metadata embedding
- File download support
- Temporary file management
- Cleanup of old documents

**Usage**:
```typescript
import { DocumentGenerator } from './document-generator';

const generator = new DocumentGenerator('info', '/tmp/docs');

// Generate from template
const doc = generator.generateFromTemplate(
  'readme-md',
  'My Project',
  {
    projectName: 'My Awesome Project',
    description: 'A great project',
    features: '- Fast\n- Reliable\n- Easy to use',
    installCommand: 'npm install my-project',
  }
);

// Save document
const path = await generator.saveDocument(doc);
const downloadUrl = generator.getDownloadUrl(path);

// Convert format
const htmlVersion = await generator.convertDocument(doc, 'html');
await generator.saveDocument(htmlVersion);

// Display templates
console.log(generator.displayTemplates());

// Cleanup old files
const removed = generator.cleanupOldDocuments(7); // 7 days old
```

**API**:
- `generateFromTemplate(templateName, title, parameters, author?): GeneratedDocument`
- `createDocument(title, format, content, author?, tags?): GeneratedDocument`
- `saveDocument(document, outputPath?): Promise<string>`
- `convertDocument(document, targetFormat): Promise<GeneratedDocument>`
- `listTemplates(format?): Record<string, DocumentTemplate>`
- `getSupportedFormats(): string[]`
- `listSavedDocuments(): string[]`
- `cleanupOldDocuments(daysOld): number`

---

### 7. Provider Config Manager (`src/provider-config.ts`)

**Purpose**: Manage multiple AI providers and switch between them seamlessly.

**Supported Providers**:
- Google Gemini
- GitHub Copilot
- Microsoft Copilot
- Azure OpenAI
- Amazon Q ✨ *New*
- OpenRouter ✨ *New*
- Local Models ✨ *New*

**Features**:
- Provider registration
- Health monitoring
- Fallback provider support
- Settings management
- Credentials management
- Seamless switching without flow break
- Failure rate tracking

**Usage**:
```typescript
import { ProviderConfigManager } from './provider-config';

const manager = new ProviderConfigManager();

// Register Amazon Q
manager.createAmazonQProvider(
  'amazon-q-prod',
  {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
    region: 'us-east-1',
  },
  { temperature: 0.7, maxTokens: 2048 },
  true // isPrimary
);

// Register OpenRouter
manager.createOpenRouterProvider(
  'openrouter-gpt4',
  'YOUR_OPENROUTER_API_KEY',
  'gpt-4',
  { temperature: 0.8 }
);

// Register local model
manager.createLocalProvider(
  'local-llama',
  'http://localhost:11434',
  'llama2'
);

// Switch provider seamlessly
manager.setActiveProvider('openrouter-gpt4');
const active = manager.getActiveProvider();
console.log(active?.name); // "OpenRouter"

// Monitor health
manager.recordHealthCheck('amazon-q-prod', true, 245);
const health = manager.getProviderHealth('amazon-q-prod');
console.log(health?.failureRate);

// Get fallback
const fallback = manager.getFallbackProvider();

// List providers
console.log(manager.displayProviders());
```

**API**:
- `registerProvider(config: ProviderConfiguration): void`
- `createAmazonQProvider(...): ProviderConfiguration`
- `createOpenRouterProvider(...): ProviderConfiguration`
- `createLocalProvider(...): ProviderConfiguration`
- `setActiveProvider(providerId: string): boolean`
- `getActiveProvider(): ProviderConfiguration | null`
- `getFallbackProvider(): ProviderConfiguration | null`
- `recordHealthCheck(providerId, success, responseTime?): void`
- `getProviderHealth(providerId): ProviderHealth | null`
- `updateProviderSettings(providerId, settings): boolean`
- `getAllProviders(): ProviderConfiguration[]`
- `getHealthyProviders(): ProviderConfiguration[]`

---

## Integration Flow

### 1. Chat History & Session Management

**Files Involved**:
- `src/chat-history.ts` - Session persistence
- `src/error-recovery.ts` - Error handling
- `src/index.ts` - Main orchestration

**Flow**:
```
User Request
    ↓
ChatHistoryManager.createSession()
    ↓
Process Request
    ↓
If Error → ErrorRecoveryManager.recordError()
    ↓
Retry with backoff logic
    ↓
Save to ChatHistoryManager
    ↓
Response
```

### 2. Web Access Flow

```
User: "Research recent AI breakthroughs"
    ↓
TaskPlanner.analyzeRequest()
    ↓
Create Tasks: [Search, Fetch, Summarize]
    ↓
WebAccessModule.searchWeb()
    ↓
WebAccessModule.fetchWebsite() for each result
    ↓
DocumentParser.extractKeyInfo()
    ↓
DocumentGenerator.generateReport()
    ↓
Return results + downloadable document
```

### 3. Code Generation Flow

```
User: "Create a TypeScript async function for API calls"
    ↓
TaskPlanner.analyzeRequest()
    ↓
CodeGenerator.generateCode(
  'function',
  'async-function',
  'typescript',
  parameters
)
    ↓
DocumentGenerator.saveDocument()
    ↓
Return code + file download
```

### 4. Command Execution Flow

```
User: "Run npm install and show logs"
    ↓
CommandExecutor.validateCommand()
    ↓
Check: allowed paths, blocked commands
    ↓
If valid: executeCommandStream()
    ↓
Stream output in real-time
    ↓
Record in command history
    ↓
Return result
```

### 5. Provider Switching Flow

```
Current: ProviderConfigManager.getActiveProvider()
    ↓
User: "Switch to Amazon Q"
    ↓
ProviderConfigManager.setActiveProvider('amazon-q')
    ↓
Update ChatHistoryManager context
    ↓
Continue conversation seamlessly
    ↓
No session interruption or data loss
```

---

## Configuration Examples

### Example 1: Complete Setup

```typescript
import { ProviderConfigManager } from './provider-config';
import { TaskPlanner } from './task-planner';
import { CommandExecutor } from './command-executor';
import { WebAccessModule } from './web-access';
import { DocumentParser } from './document-parser';
import { CodeGenerator } from './code-generator';
import { DocumentGenerator } from './document-generator';
import { ChatHistoryManager } from './chat-history';

// Initialize all modules
const providerManager = new ProviderConfigManager();
const taskPlanner = new TaskPlanner();
const commandExecutor = new CommandExecutor('info', {
  allowedPaths: ['/workspaces', '/home/user'],
  sandboxMode: true,
});
const webModule = new WebAccessModule();
const docParser = new DocumentParser();
const codeGen = new CodeGenerator();
const docGen = new DocumentGenerator();
const chatHistory = new ChatHistoryManager();

// Configure providers
providerManager.createAmazonQProvider(
  'amazon-q',
  {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  { temperature: 0.7 },
  true // primary
);

// Start session
const session = chatHistory.createSession('user-123');

// Process user request
const userRequest = 'Create a REST API with authentication';

// Plan tasks
const plan = taskPlanner.analyzeRequest(userRequest);
console.log(plan.analysis);

// Execute tasks
for (const task of plan.tasks) {
  taskPlanner.startTask(task.id);
  
  // Generate code for API
  const code = codeGen.generateCode(
    'api',
    'rest-endpoint',
    'typescript',
    { method: 'post', endpoint: '/api/login', logic: 'authenticateUser()' }
  );
  
  const result = `Generated ${code.fileName}`;
  taskPlanner.completeTask(task.id, result);
}

// Generate documentation
const doc = docGen.generateFromTemplate(
  'readme-md',
  'API Documentation',
  { /* ... */ },
  'AI Agent'
);

// Save and get download link
const path = await docGen.saveDocument(doc);
const downloadUrl = docGen.getDownloadUrl(path);

// Add to chat history
chatHistory.addMessage(session.sessionId, {
  role: 'assistant',
  content: `API created. Download: ${downloadUrl}`,
  timestamp: Date.now(),
});
```

### Example 2: Multi-Provider Setup

```typescript
// Configure multiple providers
providerManager.createAmazonQProvider('amazon-q-main', {...}, {...}, true);
providerManager.createOpenRouterProvider('openrouter-backup', '...', 'gpt-4');
providerManager.createLocalProvider('local-fallback', 'http://localhost:11434');

// Set fallback chain
const mainConfig = providerManager.getProvider('amazon-q-main')!;
mainConfig.fallbackProvider = 'openrouter-backup';

const backupConfig = providerManager.getProvider('openrouter-backup')!;
backupConfig.fallbackProvider = 'local-fallback';

// During execution
let provider = providerManager.getActiveProvider();
if (!provider?.isHealthy) {
  const fallback = providerManager.getFallbackProvider();
  if (fallback) {
    providerManager.setActiveProvider(fallback.id);
    // Continue seamlessly with new provider
  }
}
```

---

## Error Handling & Recovery

### Error Recovery Pattern

```typescript
import { ErrorRecoveryManager } from './error-recovery';

const recovery = new ErrorRecoveryManager();

try {
  // Execute task
  await commandExecutor.executeCommand('npm install');
} catch (error) {
  recovery.recordError(error);
  
  if (recovery.canRetry('command-execution')) {
    // Retry with backoff
    const strategies = recovery.getSuggestedStrategies(error);
    console.log('Suggested fixes:', strategies);
    
    // Retry
    await commandExecutor.executeCommand('npm install');
  } else {
    // Ask user for help
    console.log('Max retries reached. User intervention needed.');
  }
}
```

---

## Performance Considerations

1. **Web Access**: Cache enabled (5-minute TTL) - reduces redundant requests
2. **Document Parsing**: Lazy loading - parse only when needed
3. **Task Planning**: Dependencies tracked - parallel execution where possible
4. **Command Execution**: Timeouts enforced - prevents hanging processes
5. **Provider Health**: Monitored continuously - automatic failover
6. **Session History**: Periodic cleanup - prevent storage bloat

---

## Security Best Practices

1. **Environment Variables**: Store all credentials in `.env`
2. **Command Validation**: Never execute user input directly
3. **Path Restrictions**: Use `allowedPaths` to limit file system access
4. **Output Limits**: Enforce maximum output size (1MB default)
5. **Timeout Enforcement**: All operations have timeouts
6. **Error Messages**: Don't expose sensitive information
7. **Provider Switching**: Preserve context during transitions

---

## Testing

```typescript
// Test task planner
const plan = taskPlanner.analyzeRequest('complex multi-step task');
assert(plan.tasks.length > 1);
assert(plan.analysis.complexity === 'complex');

// Test command executor
const result = await commandExecutor.executeCommand('echo test');
assert(result.success === true);
assert(result.stdout.includes('test'));

// Test web access
const content = await webModule.fetchWebsite('https://example.com');
assert(content.title.length > 0);

// Test document parsing
const parsed = await docParser.parseDocument('test.md');
assert(parsed.content.length > 0);

// Test code generation
const code = codeGen.generateCode('function', 'basic-function', 'typescript', {});
assert(code.code.includes('function'));

// Test document generation
const doc = docGen.createDocument('test', 'md', '# Test');
assert(doc.size > 0);

// Test provider switching
providerManager.setActiveProvider('amazon-q');
assert(providerManager.getActiveProvider()?.type === 'amazon-q');
```

---

## Migration Guide

If upgrading from previous version:

1. **Update imports**: All modules now available in `src/`
2. **Update provider types**: New types include `amazon-q`, `openrouter`, `local`
3. **Session management**: Use `ChatHistoryManager` for all session handling
4. **Error handling**: Use `ErrorRecoveryManager` instead of custom retry logic
5. **Existing code**: Backward compatible - all old APIs still work

---

## Next Steps

1. ✅ Integrate modules into main application
2. ✅ Set up provider configuration
3. ✅ Configure session management
4. ✅ Set up error recovery
5. 🟡 Add monitoring and logging
6. 🟡 Performance optimization
7. 🟡 Extended testing suite
8. 🟡 Production deployment

---

## Support & Documentation

- API Reference: See individual module documentation
- Examples: Check `examples/` directory
- Issues: Report via GitHub Issues
- Contributing: See CONTRIBUTING.md
