import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * VS Code Extension UI Manager
 * Handles all UI components, panels, and webviews
 */

export class VSCodeUIManager {
  private logger: Logger;
  private chatPanel: vscode.WebviewPanel | undefined;
  private consolePanel: vscode.WebviewPanel | undefined;
  private errorPanel: vscode.WebviewPanel | undefined;

  constructor() {
    this.logger = new Logger('VSCodeUIManager');
  }

  /**
   * Create and show the chat webview panel
   */
  public async showChatPanel(context: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
    if (this.chatPanel) {
      this.chatPanel.reveal(vscode.ViewColumn.Beside);
      return this.chatPanel;
    }

    this.chatPanel = vscode.window.createWebviewPanel(
      'aiAgent-chat',
      'AI Agent Chat',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        enableFindWidget: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    this.chatPanel.webview.html = this.getChatPanelHTML();

    this.chatPanel.onDidDispose(() => {
      this.chatPanel = undefined;
    });

    // Handle messages from webview
    this.chatPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'sendMessage':
            this.logger.log(`Chat message: ${message.text}`);
            this.chatPanel?.webview.postMessage({
              type: 'response',
              content: `AI Agent: Processing "${message.text}"...`
            });
            break;
        }
      }
    );

    return this.chatPanel;
  }

  /**
   * Create and show the console webview panel
   */
  public async showConsolePanel(context: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
    if (this.consolePanel) {
      this.consolePanel.reveal(vscode.ViewColumn.Bottom);
      return this.consolePanel;
    }

    this.consolePanel = vscode.window.createWebviewPanel(
      'aiAgent-console',
      'AI Agent Console',
      vscode.ViewColumn.Bottom,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    this.consolePanel.webview.html = this.getConsolePanelHTML();

    this.consolePanel.onDidDispose(() => {
      this.consolePanel = undefined;
    });

    return this.consolePanel;
  }

  /**
   * Create and show the errors webview panel
   */
  public async showErrorPanel(context: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
    if (this.errorPanel) {
      this.errorPanel.reveal(vscode.ViewColumn.Bottom);
      return this.errorPanel;
    }

    this.errorPanel = vscode.window.createWebviewPanel(
      'aiAgent-errors',
      'AI Agent Errors',
      vscode.ViewColumn.Bottom,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    this.errorPanel.webview.html = this.getErrorPanelHTML();

    this.errorPanel.onDidDispose(() => {
      this.errorPanel = undefined;
    });

    return this.errorPanel;
  }

  /**
   * Get HTML for chat panel
   */
  private getChatPanelHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
          }
          .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
            background: var(--vscode-editor-inlineValue-background);
          }
          .message.user {
            background: var(--vscode-inputValidation-infoBorder);
            margin-left: 20px;
          }
          .message.ai {
            background: var(--vscode-inputValidation-successBorder);
          }
          .input-area {
            display: flex;
            gap: 10px;
          }
          input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
          }
          button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background: var(--vscode-button-hoverBackground);
          }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <h2>💬 AI Agent Chat</h2>
          <div class="messages" id="messages">
            <div class="message ai">Welcome to AI Agent! Ask me anything about your code.</div>
          </div>
          <div class="input-area">
            <input type="text" id="input" placeholder="Type your message..." />
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          function sendMessage() {
            const input = document.getElementById('input');
            const text = input.value.trim();
            if (!text) return;

            const messagesDiv = document.getElementById('messages');
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.textContent = text;
            messagesDiv.appendChild(userMsg);

            vscode.postMessage({
              command: 'sendMessage',
              text: text
            });

            input.value = '';
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response') {
              const messagesDiv = document.getElementById('messages');
              const aiMsg = document.createElement('div');
              aiMsg.className = 'message ai';
              aiMsg.textContent = message.content;
              messagesDiv.appendChild(aiMsg);
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
          });

          document.getElementById('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Get HTML for console panel
   */
  private getConsolePanelHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            margin: 0;
            padding: 15px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-size: 12px;
          }
          .console {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .console-output {
            flex: 1;
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            overflow-y: auto;
            font-size: 11px;
            line-height: 1.5;
          }
          .log-line {
            margin: 2px 0;
          }
          .log-info { color: #4ec9b0; }
          .log-warn { color: #ce9178; }
          .log-error { color: #f48771; }
          .log-success { color: #6a9955; }
          .timestamp {
            color: var(--vscode-descriptionForeground);
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="console">
          <h3>📋 AI Agent Console</h3>
          <div class="console-output" id="output">
            <div class="log-line"><span class="timestamp">[00:00:00]</span><span class="log-success">✓</span> AI Agent console ready</div>
            <div class="log-line"><span class="timestamp">[00:00:00]</span><span class="log-info">i</span> Monitoring workspace for errors...</div>
            <div class="log-line"><span class="timestamp">[00:00:00]</span><span class="log-info">i</span> Offline mode enabled</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get HTML for errors panel
   */
  private getErrorPanelHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 15px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .errors-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .error-item {
            background: var(--vscode-inputValidation-errorBorder);
            border-left: 4px solid #f48771;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;
          }
          .error-header {
            font-weight: bold;
            color: #f48771;
            margin-bottom: 5px;
          }
          .error-message {
            font-size: 13px;
            margin-bottom: 5px;
          }
          .error-fix {
            background: var(--vscode-inputValidation-successBorder);
            border-left: 3px solid #6a9955;
            padding: 8px;
            border-radius: 3px;
            margin-top: 8px;
            font-size: 12px;
          }
          .no-errors {
            color: #6a9955;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="errors-container">
          <h3>🔍 AI Agent Errors</h3>
          <div id="errors-list">
            <div class="no-errors">✅ No errors detected. Your code looks good!</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Add a log message to the console
   */
  public logToConsole(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    if (this.consolePanel) {
      const timestamp = new Date().toLocaleTimeString();
      this.consolePanel.webview.postMessage({
        type: 'log',
        timestamp,
        level,
        message
      });
    }
  }

  /**
   * Display an error to the user
   */
  public showError(message: string, details?: string) {
    if (this.errorPanel) {
      this.errorPanel.webview.postMessage({
        type: 'error',
        message,
        details
      });
    }
  }
}
