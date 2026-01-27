// src/index.ts
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { loadConfig } from './config.js';
import { Logger } from './logger.js';
import { GoogleCloudIntegration } from './gcloud.js';
import { InteractiveSelectors } from './selectors.js';
import { MultiProviderAuthManager } from './multi-auth.js';
import { AgentFactory, AgentInstance } from './agent-factory.js';
import { AIProvider, AccountCredential } from './provider-types.js';
import { FileCommandProcessor } from './file-commands.js';
import { ChatHistoryManager, ChatSession } from './chat-history.js';
import { ErrorRecoveryManager } from './error-recovery.js';
import { OfflineIntegration } from './offline-integration.js';
import { ProgrammingKnowledge } from './programming-knowledge.js';

// Load environment variables
dotenv.config();

interface SessionState {
  account: AccountCredential;
  provider: AIProvider;
  agent: AgentInstance;
  historyManager: ChatHistoryManager;
  errorRecovery: ErrorRecoveryManager;
  offlineIntegration?: OfflineIntegration;
  programmingKnowledge: ProgrammingKnowledge;
  learningRecordIds: string[];
}

function showFileCommandHelp(): void {
  console.log('\n📁 File Management Commands:\n');
  console.log('Create File:');
  console.log('  "create file /path/to/file.txt with Hello World"');
  console.log('  "write /path/to/file.txt containing content here"\n');

  console.log('Read File:');
  console.log('  "read file /path/to/file.txt"');
  console.log('  "show /path/to/file.txt"\n');

  console.log('Update File:');
  console.log('  "update file /path/to/file.txt with new content"');
  console.log('  "modify /path/to/file.txt to new content"\n');

  console.log('Delete File:');
  console.log('  "delete file /path/to/file.txt"');
  console.log('  "remove file /path/to/file.txt"\n');

  console.log('Directory Operations:');
  console.log('  "create directory /path/to/new/folder"');
  console.log('  "list /path/to/directory"');
  console.log('  "delete directory /path/to/folder recursive"\n');

  console.log('File Operations:');
  console.log('  "copy /source/file.txt to /dest/file.txt"');
  console.log('  "move /source/file.txt to /dest/file.txt"');
  console.log('  "rename /path/to/file.txt as newname.txt"');
  console.log('  "info /path/to/file.txt"\n');

  console.log('Navigation:');
  console.log('  "pwd" - print working directory');
  console.log('  "cd /path/to/directory" - change directory\n');
}


async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();
    const logger = new Logger(config.logLevel);

    console.log('\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  🤖 Multi-Provider AI Assistant            ║');
    console.log('║  + Offline Learning + Hybrid Mode          ║');
    console.log('║  Powered by Gemini, GitHub, Microsoft     ║');
    console.log('╚════════════════════════════════════════════╝\n');

    logger.info('Starting Multi-Provider AI Assistant with Offline Learning');

    // Initialize managers
    const authManager = new MultiProviderAuthManager(config.logLevel);
    const selectors = new InteractiveSelectors(config.logLevel);
    const agentFactory = new AgentFactory(config.logLevel);
    const historyManager = new ChatHistoryManager(config.logLevel);
    const errorRecovery = new ErrorRecoveryManager(config.logLevel);

    // Initialize offline integration
    const offlineIntegration = new OfflineIntegration({
      enableOfflineMode: true,
      enableLearning: true,
      enableNLP: true,
    }, config.logLevel);

    try {
      await offlineIntegration.initialize();
      console.log('✅ Offline learning system initialized\n');
    } catch (error) {
      logger.warn(`Offline system initialization warning: ${error}`);
    }

    // Check for interrupted sessions
    const interruptedSessions = historyManager.getInterruptedSessions();
    if (interruptedSessions.length > 0) {
      console.log('\n⚠️  Found interrupted sessions that can be resumed:\n');
      const shouldRecover = await selectors.askYesNo(
        'Would you like to resume a previous session?'
      );

      if (shouldRecover) {
        const resumeSession = await selectors.selectSessionToResume(interruptedSessions);
        if (resumeSession) {
          const recovered = historyManager.resumeSession(resumeSession.sessionId);
          if (recovered) {
            console.log(`✅ Resuming session from ${new Date(recovered.startTime).toLocaleString()}`);
            console.log(`📝 Messages in history: ${recovered.messages.length}\n`);
            
            // Load the actual account credentials from auth manager
            const recoveredAccount = authManager.getAllAccounts().find(
              acc => acc.accountId === recovered.accountId
            );
            
            if (!recoveredAccount) {
              console.log('❌ Could not find original account for this session. Please log in again.\n');
              process.exit(1);
            }
            
            const programmingKnowledge = new ProgrammingKnowledge();
            await startChatSession(
              {
                account: recoveredAccount,
                provider: recovered.provider as AIProvider,
                agent: agentFactory.createAgent(recoveredAccount, config.apiKey) as AgentInstance,
                historyManager,
                errorRecovery,
                programmingKnowledge,
                offlineIntegration,
                learningRecordIds: [],
              },
              selectors,
              authManager,
              logger,
              recovered
            );
            return;
          }
        }
      }
    }

    // Handle initial flow
    const action = await selectors.getInitialAction();

    if (action === 'exit') {
      console.log('\nGoodbye! 👋\n');
      process.exit(0);
    }

    if (action === 'accounts') {
      await handleAccountManagement(authManager, selectors, logger);
      return;
    }

    // Get or create account
    let account = await getOrCreateAccount(authManager, selectors, config, logger);

    if (!account) {
      console.log('❌ No account selected. Exiting.\n');
      process.exit(1);
    }

    // Handle Gemini-specific flow
    let sessionState: SessionState;

    if (account.provider === 'gemini') {
      const gcloud = new GoogleCloudIntegration(config.logLevel);
      gcloud.setCredentials(authManager.getActiveAccount() as any);

      console.log('📁 Fetching your Google Cloud projects...\n');
      const projects = await gcloud.getProjects();
      const selectedProject = await selectors.selectProject(projects);

      if (!selectedProject) {
        console.log('❌ No project selected. Exiting.\n');
        process.exit(1);
      }

      console.log('\n🤖 Fetching available AI models...\n');
      const models = await gcloud.getAvailableModels(selectedProject.projectId);
      const selectedModel = await selectors.selectModel(models);

      if (!selectedModel) {
        console.log('❌ No model selected. Exiting.\n');
        process.exit(1);
      }

      const confirmed = await selectors.confirmSelection(
        selectedProject.projectName,
        selectedModel.name
      );

      if (!confirmed) {
        return;
      }

      const agent = agentFactory.createAgent(account, config.apiKey);
      if (!agent) {
        console.log('❌ Failed to initialize agent. Exiting.\n');
        process.exit(1);
      }

      sessionState = {
        account,
        provider: account.provider,
        agent,
        historyManager,
        errorRecovery,
        offlineIntegration,
        learningRecordIds: [],
      };
    } else {
      // For non-Gemini providers
      const confirmed = await selectors.confirmSelection(account.accountName, account.provider);

      if (!confirmed) {
        return;
      }

      const agent = agentFactory.createAgent(account, config.apiKey);
      if (!agent) {
        console.log('❌ Failed to initialize agent. Exiting.\n');
        process.exit(1);
      }

      sessionState = {
        account,
        provider: account.provider,
        agent,
        historyManager,
        errorRecovery,
        offlineIntegration,
        learningRecordIds: [],
      };
    }

    logger.info(`Session initialized with ${sessionState.provider}`);

    // Create new chat session with history
    const chatSession = sessionState.historyManager.createSession(
      account.accountId,
      account.provider,
      account.accountName
    );

    // Start chat session
    await startChatSession(sessionState, selectors, authManager, logger, chatSession);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', message);
    process.exit(1);
  }
}

async function getOrCreateAccount(
  authManager: MultiProviderAuthManager,
  selectors: InteractiveSelectors,
  config: any,
  logger: Logger
): Promise<AccountCredential | null> {
  const allAccounts = authManager.getAllAccounts();

  if (allAccounts.length > 0) {
    const selected = await selectors.selectAccount(allAccounts);
    if (selected) {
      authManager.setActiveAccount(selected.accountId);
      return selected;
    }
  }

  // Add new account
  const provider = await selectors.selectProvider();
  if (!provider) return null;

  console.log(`\n🔐 Setting up ${provider}...`);
  const newAccount = await authManager.authenticateProvider(provider, `${provider}-account`);

  return newAccount;
}

async function handleAccountManagement(
  authManager: MultiProviderAuthManager,
  selectors: InteractiveSelectors,
  logger: Logger
): Promise<void> {
  while (true) {
    const action = await selectors.showAccountMenu();

    if (action === 'back') {
      return;
    }

    if (action === 'view') {
      const accounts = authManager.getAllAccounts();
      const stats = authManager.getAccountStats();

      console.log('\n📊 Account Statistics:');
      console.log(`  Total Accounts: ${stats.totalAccounts}`);
      console.log(`  Active Account: ${stats.activeAccount?.accountName || 'None'}`);
      console.log('\n📋 Accounts by Provider:');

      for (const [provider, count] of Object.entries(stats.byProvider)) {
        if (count > 0) {
          console.log(`  ${provider}: ${count}`);
        }
      }

      console.log('\n👤 All Accounts:');
      for (const account of accounts) {
        const isActive = account.accountId === stats.activeAccount?.accountId;
        const marker = isActive ? '✓' : ' ';
        console.log(`  [${marker}] ${account.accountName} (${account.provider})`);
      }
      console.log('');
    }

    if (action === 'add') {
      const provider = await selectors.selectProvider();
      if (provider) {
        const newAccount = await authManager.authenticateProvider(provider, `${provider}-account`);
        if (newAccount) {
          console.log(`✅ Account added: ${newAccount.accountName}\n`);
        }
      }
    }

    if (action === 'remove') {
      const accounts = authManager.getAllAccounts();
      const toRemove = await selectors.selectAccountToRemove(accounts);
      if (toRemove) {
        authManager.removeAccount(toRemove.accountId);
        console.log(`✅ Account removed: ${toRemove.accountName}\n`);
      }
    }

    if (action === 'switch') {
      const accounts = authManager.getAllAccounts();
      const toSwitch = await selectors.selectAccount(accounts);
      if (toSwitch) {
        authManager.setActiveAccount(toSwitch.accountId);
        console.log(`✅ Switched to: ${toSwitch.accountName}\n`);
      }
    }
  }
}

async function startChatSession(
  sessionState: SessionState,
  selectors: InteractiveSelectors,
  authManager: MultiProviderAuthManager,
  logger: Logger,
  chatSession?: ChatSession
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const config = loadConfig();
  const isResumed = chatSession && (sessionState.historyManager.getCurrentSession()?.messages.length ?? 0) > 0;

  console.log('\n✅ Session Ready!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Provider: ${sessionState.provider}`);
  console.log(`Account: ${sessionState.account.accountName}`);
  console.log(`📚 Learning: ${sessionState.offlineIntegration ? '✅ Enabled' : '❌ Disabled'}`);
  if (isResumed) {
    const msgs = sessionState.historyManager.getMessages();
    console.log(`📝 Resumed with ${msgs.length} previous messages`);
  }
  console.log('───────────────────────────────────────────────────');
  console.log('Commands: /menu (main menu), /clear (history), /info (session info), /files (file help), /history (show chat), /export (save session), /offline (status), /exit (quit)\n');

  const fileProcessor = new FileCommandProcessor(config.logLevel);

  // Restore conversation history for AI if resuming
  if (isResumed && 'setConversationHistory' in sessionState.agent) {
    const history = sessionState.historyManager.getConversationHistory();
    (sessionState.agent as any).setConversationHistory(history);
  }

  const askQuestion = (): void => {
    rl.question('You: ', async (input: string) => {
      const userInput = input.trim();

      if (!userInput) {
        askQuestion();
        return;
      }

      // Handle special commands
      if (userInput.toLowerCase() === '/exit') {
        sessionState.historyManager.completeSession();
        console.log('\nGoodbye! 👋\n');
        rl.close();
        process.exit(0);
      }

      if (userInput.toLowerCase() === '/clear') {
        if ('clearHistory' in sessionState.agent) {
          (sessionState.agent as any).clearHistory();
        }
        console.log('✓ Conversation history cleared\n');
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/history') {
        const messages = sessionState.historyManager.getMessages();
        if (messages.length === 0) {
          console.log('No messages in history\n');
        } else {
          console.log(`\n📜 Chat History (${messages.length} messages):\n`);
          for (const msg of messages) {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            console.log(`[${time}] ${msg.role.toUpperCase()}: ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
          }
          console.log('');
        }
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/export') {
        const session = sessionState.historyManager.getCurrentSession();
        if (!session) {
          console.log('No active session to export\n');
          askQuestion();
          return;
        }
        const markdown = sessionState.historyManager.exportSessionAsMarkdown(session.sessionId);
        if (markdown) {
          const exportPath = `/tmp/chat-session-${session.sessionId}.md`;
          try {
            const fs = await import('fs');
            fs.writeFileSync(exportPath, markdown);
            console.log(`✅ Session exported to ${exportPath}\n`);
          } catch (err) {
            console.log(`❌ Failed to export session: ${err}\n`);
          }
        }
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/info') {
        if ('getSessionInfo' in sessionState.agent) {
          const info = (sessionState.agent as any).getSessionInfo();
          console.log('\n📊 Session Info:');
          console.log(`  Provider: ${sessionState.provider}`);
          console.log(`  Account: ${sessionState.account.accountName}`);
          if (info.sessionId) console.log(`  Session ID: ${info.sessionId}`);
          if (info.messageCount) console.log(`  Messages: ${info.messageCount}`);
          
          const currentSession = sessionState.historyManager.getCurrentSession();
          if (currentSession) {
            console.log(`  Status: ${currentSession.status}`);
            console.log(`  Total Messages: ${currentSession.messages.length}`);
            console.log(`  Learning Records: ${currentSession.learningRecords?.length || 0}`);
            console.log(`  Started: ${new Date(currentSession.startTime).toLocaleString()}`);
          }
          console.log('');
        }
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/offline') {
        if (sessionState.offlineIntegration) {
          console.log('\n' + sessionState.offlineIntegration.displayStatus() + '\n');
        } else {
          console.log('❌ Offline integration not available\n');
        }
        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/menu') {
        const action = await selectors.showMainMenu();

        if (action === 'exit') {
          console.log('\nGoodbye! 👋\n');
          rl.close();
          process.exit(0);
        }

        if (action === 'logout') {
          authManager.removeAccount(sessionState.account.accountId);
          console.log('✅ Logged out successfully.\n');
          rl.close();
          process.exit(0);
        }

        if (action === 'accounts') {
          rl.close();
          await handleAccountManagement(authManager, selectors, logger);
          process.exit(0);
        }

        if (action === 'settings') {
          console.log('\n⚙️  Settings menu coming soon...\n');
        }

        askQuestion();
        return;
      }

      if (userInput.toLowerCase() === '/files') {
        showFileCommandHelp();
        askQuestion();
        return;
      }

      // Check if user input is a file command
      const fileCommand = fileProcessor.parseUserCommand(userInput);
      if (fileCommand) {
        console.log('');
        // Save user message to history
        sessionState.historyManager.addMessage('user', userInput);

        const fileResult = await fileProcessor.processCommand(fileCommand);

        if (fileResult.success) {
          console.log('✅ Success:', fileResult.message);
          if (fileResult.result) {
            console.log('📦 Result:', JSON.stringify(fileResult.result, null, 2));
          }
          // Save file command result to history
          sessionState.historyManager.addMessage('assistant', `File operation: ${fileResult.message}`);
        } else {
          console.log('❌ Error:', fileResult.message);
          if (fileResult.error) {
            console.log('   Error code:', fileResult.error);
          }
          // Save error to history
          sessionState.historyManager.updateLastMessageWithError(fileResult.message, 0);
        }
        console.log('');
        askQuestion();
        return;
      }

      // Regular chat with error handling and retry
      console.log('');
      sessionState.historyManager.addMessage('user', userInput);

      let response = await sessionState.agent.chat(userInput);
      let retryCount = 0;

      // Retry logic if chat fails
      while (!response.success && sessionState.errorRecovery.canRetry(userInput)) {
        retryCount++;
        const parsedError = sessionState.errorRecovery.parseError(response.error);
        const strategies = sessionState.errorRecovery.getSuggestedStrategies(
          parsedError.message,
          parsedError.code
        );

        console.log(`\n⚠️  Error occurred (Attempt ${retryCount}/${sessionState.errorRecovery['maxRetries']})`);
        console.log(`Error: ${response.error}\n`);

        // Ask user whether to retry or search for workaround
        const userChoice = await selectors.askRetryOrWorkaround(strategies);

        if (userChoice === 'exit') {
          sessionState.historyManager.updateLastMessageWithError(
            response.error || 'User interrupted',
            retryCount
          );
          break;
        }

        if (userChoice === 'retry') {
          console.log('\n⏳ Retrying...');
          await sessionState.errorRecovery.waitForRetry(retryCount);
          response = await sessionState.agent.chat(userInput);
        } else {
          // Show workarounds
          console.log('\n💡 Suggested workarounds:');
          strategies.forEach((strategy, index) => {
            console.log(`${index + 1}. ${strategy}`);
          });
          console.log('');
          break;
        }
      }

      if (response.success) {
        console.log('Assistant:', response.message, '\n');
        // Save assistant response to history
        sessionState.historyManager.addMessage('assistant', response.message);

        // Record learning interaction if enabled
        if (sessionState.offlineIntegration && sessionState.historyManager.isLearningEnabled()) {
          const recordId = sessionState.offlineIntegration.recordInteraction(
            userInput,
            response.message,
            85, // Quality score for successful interaction
            sessionState.offlineIntegration
              .getProcessors()
              .nlpProcessor.parseIntent(userInput).intent
          );
          if (recordId) {
            sessionState.learningRecordIds.push(recordId);
            sessionState.historyManager.recordLearningForSession(recordId);
          }
        }
      } else {
        console.log('❌ Error:', response.error, '\n');
        // Mark message as having error in history
        sessionState.historyManager.updateLastMessageWithError(response.error || 'Unknown error', retryCount);
      }

      askQuestion();
    });
  };

  // Handle interruption (Ctrl+C)
  process.on('SIGINT', async () => {
    sessionState.historyManager.markSessionInterrupted();
    
    // Learn from session before exiting
    if (sessionState.offlineIntegration && sessionState.learningRecordIds.length > 0) {
      const currentSession = sessionState.historyManager.getCurrentSession();
      if (currentSession) {
        await sessionState.offlineIntegration.learnFromSession(currentSession);
      }
    }

    // Shutdown offline integration
    if (sessionState.offlineIntegration) {
      await sessionState.offlineIntegration.shutdown();
    }

    console.log('\n\n⚠️  Session interrupted. You can resume this session later.\n');
    process.exit(0);
  });

  // Start the chat loop
  askQuestion();
}

main();
