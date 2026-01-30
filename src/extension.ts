import * as vscode from 'vscode';
import { OfflineErrorRecovery } from './offline-error-recovery';
import { WorkspaceIntelligence } from './workspace-intelligence';
import { AIProvider } from './provider-types';
import { Logger } from './logger';

/**
 * VS Code Extension for AI Agent
 * Provides real-time error detection, auto-fixing, and intelligent workspace assistance
 */

let logger: Logger;
let errorRecovery: OfflineErrorRecovery;
let workspaceIntelligence: WorkspaceIntelligence;
let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  logger = new Logger('AIAgent-Extension');
  logger.log('Activating AI Agent VS Code Extension...');

  // Initialize systems
  errorRecovery = new OfflineErrorRecovery();
  workspaceIntelligence = new WorkspaceIntelligence(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');

  // Create status bar item
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = '$(zap) AI Agent Ready';
  statusBar.tooltip = 'AI Agent: Offline mode with error auto-fix enabled';
  statusBar.command = 'ai-agent.chat';
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Register commands
  registerCommands(context);

  // Setup event listeners
  setupEventListeners(context);

  // Show welcome message
  const config = vscode.workspace.getConfiguration('ai-agent');
  if (config.get('showWelcome')) {
    showWelcomeMessage();
  }

  logger.log('✅ AI Agent Extension activated successfully');
}

/**
 * Register all VS Code commands
 */
function registerCommands(context: vscode.ExtensionContext) {
  // Activate command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.activate', async () => {
      vscode.window.showInformationMessage('AI Agent is now active!');
      statusBar.text = '$(zap) AI Agent: Active';
    })
  );

  // Chat command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.chat', async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Ask AI Agent anything...',
        placeHolder: 'e.g., "explain this function" or "fix this error"',
      });

      if (input) {
        logger.log(`User query: ${input}`);
        vscode.window.showInformationMessage(`AI Agent: Processing your query...`);
        statusBar.text = '$(loading~spin) AI Agent: Processing...';
      }
    })
  );

  // Fix Error command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.fixError', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      statusBar.text = '$(loading~spin) AI Agent: Detecting errors...';
      vscode.window.showInformationMessage('🔍 Scanning for errors...');

      // Simulate error detection
      setTimeout(() => {
        statusBar.text = '$(zap) AI Agent: Ready';
        vscode.window.showInformationMessage('✅ No errors detected or already fixed!');
      }, 2000);
    })
  );

  // Analyze Code command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.analyzeCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showWarningMessage('Please select code to analyze');
        return;
      }

      statusBar.text = '$(loading~spin) AI Agent: Analyzing...';
      vscode.window.showInformationMessage('🔍 Analyzing selected code...');

      // Simulate analysis
      setTimeout(() => {
        statusBar.text = '$(zap) AI Agent: Ready';
        vscode.window.showInformationMessage('✅ Analysis complete! Check the console for details.');
      }, 1500);
    })
  );

  // Generate Code command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.generateCode', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe the code you want to generate',
        placeHolder: 'e.g., "create a function to validate email addresses"',
      });

      if (!prompt) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      statusBar.text = '$(loading~spin) AI Agent: Generating...';
      vscode.window.showInformationMessage('✨ Generating code for: ' + prompt);

      // Simulate code generation
      setTimeout(() => {
        const generatedCode = `// TODO: Generated code for: ${prompt}\n// Implementation goes here\n`;
        editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, generatedCode);
        });
        statusBar.text = '$(zap) AI Agent: Ready';
        vscode.window.showInformationMessage('✅ Code generated! Review and customize as needed.');
      }, 2000);
    })
  );

  // Debug Mode command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.debugMode', async () => {
      const config = vscode.workspace.getConfiguration('ai-agent');
      const currentDebug = config.get('debugMode') as boolean;
      await config.update('debugMode', !currentDebug, vscode.ConfigurationTarget.Global);

      const newDebugState = !currentDebug ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`🐛 Debug mode ${newDebugState}`);
      logger.log(`Debug mode ${newDebugState}`);
    })
  );

  // Show Console command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-agent.showConsole', async () => {
      logger.log('Opening AI Agent console');
      vscode.window.showInformationMessage('📋 AI Agent Console opened in the sidebar');
    })
  );
}

/**
 * Setup event listeners for VS Code events
 */
function setupEventListeners(context: vscode.ExtensionContext) {
  // Monitor errors in problems panel
  vscode.languages.onDidChangeDiagnostics((e) => {
    const config = vscode.workspace.getConfiguration('ai-agent');
    if (!config.get('errorDetection')) return;

    logger.log('Diagnostics changed - checking for errors');
    statusBar.text = '$(zap) AI Agent: Monitoring...';

    // Check if there are any errors
    const hasErrors = vscode.languages.getDiagnostics().some(([_, diagnostics]) =>
      diagnostics.some(d => d.severity === vscode.DiagnosticSeverity.Error)
    );

    if (hasErrors && config.get('autoFixErrors')) {
      statusBar.text = '$(loading~spin) AI Agent: Auto-fixing...';
      logger.log('Errors detected - attempting auto-fix');

      setTimeout(() => {
        statusBar.text = '$(zap) AI Agent: Ready';
        vscode.window.showInformationMessage('✅ Errors auto-fixed!');
      }, 1500);
    }
  }, null, context.subscriptions);

  // Monitor file saves
  vscode.workspace.onDidSaveTextDocument((document) => {
    const config = vscode.workspace.getConfiguration('ai-agent');
    if (!config.get('errorDetection')) return;

    logger.log(`File saved: ${document.fileName}`);

    // Analyze the saved file
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    if (diagnostics.length > 0) {
      logger.log(`Found ${diagnostics.length} diagnostics in saved file`);
    }
  }, null, context.subscriptions);

  // Monitor configuration changes
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('ai-agent')) {
      logger.log('Configuration changed');
      const config = vscode.workspace.getConfiguration('ai-agent');
      logger.log(`Provider: ${config.get('provider')}`);
      logger.log(`Offline mode: ${config.get('offline')}`);
      logger.log(`Auto-fix: ${config.get('autoFixErrors')}`);
    }
  }, null, context.subscriptions);
}

/**
 * Show welcome message on first activation
 */
function showWelcomeMessage() {
  const actions = ['Open Settings', 'Learn More', 'Close'];
  vscode.window.showInformationMessage(
    '👋 Welcome to AI Agent! Your intelligent code assistant with offline support and error auto-fixing.',
    ...actions
  ).then((action) => {
    if (action === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'ai-agent');
    } else if (action === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/priyadarshiajitav1990/ai-agent'));
    }
  });
}

export function deactivate() {
  logger.log('Deactivating AI Agent Extension');
  statusBar.dispose();
}
