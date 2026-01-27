// src/selectors.ts
import inquirer from 'inquirer';
import { Logger } from './logger.js';
import { GCPProject, AIModel } from './gcloud.js';
import { AIProvider, AccountCredential, SUPPORTED_PROVIDERS } from './provider-types.js';
import { ChatSession } from './chat-history.js';

export class InteractiveSelectors {
  private logger: Logger;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  async selectProvider(): Promise<AIProvider | null> {
    const choices = SUPPORTED_PROVIDERS.map((provider) => ({
      name: `${provider.name} - ${provider.description}`,
      value: provider.type,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: '🤖 Select AI Provider:',
        choices,
        pageSize: 10,
      },
    ]);

    this.logger.info(`Selected provider: ${answers.provider}`);
    return answers.provider;
  }

  async selectAccount(accounts: AccountCredential[]): Promise<AccountCredential | null> {
    if (accounts.length === 0) {
      this.logger.warn('No accounts available');
      console.log('❌ No accounts found');
      return null;
    }

    if (accounts.length === 1) {
      console.log(`✓ Using account: ${accounts[0].accountName}`);
      return accounts[0];
    }

    const choices = accounts.map((account) => ({
      name: `${account.accountName} (${account.provider}) - Added: ${new Date(account.createdAt).toLocaleDateString()}`,
      value: account,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'account',
        message: '👤 Select Account:',
        choices,
        pageSize: 10,
      },
    ]);

    this.logger.info(`Selected account: ${answers.account.accountId}`);
    return answers.account;
  }

  async addNewAccount(provider: AIProvider): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addNew',
        message: `No existing accounts for ${provider}. Add a new account?`,
        default: true,
      },
    ]);

    return answers.addNew;
  }

  async selectProject(projects: GCPProject[]): Promise<GCPProject | null> {
    if (projects.length === 0) {
      this.logger.warn('No projects available');
      console.log('❌ No Google Cloud projects found');
      return null;
    }

    if (projects.length === 1) {
      console.log(`✓ Using project: ${projects[0].projectName}`);
      return projects[0];
    }

    const choices = projects.map((project) => ({
      name: `${project.projectName} (${project.projectId})`,
      value: project,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'project',
        message: '📁 Select a Google Cloud Project:',
        choices,
        pageSize: 10,
      },
    ]);

    this.logger.info(`Selected project: ${answers.project.projectId}`);
    return answers.project;
  }

  async selectModel(models: AIModel[]): Promise<AIModel | null> {
    if (models.length === 0) {
      this.logger.warn('No models available');
      console.log('❌ No AI models found');
      return null;
    }

    const choices = models.map((model) => ({
      name: `${model.name} (${model.id})`,
      value: model,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: '🤖 Select an AI Model:',
        choices,
        pageSize: 10,
      },
    ]);

    this.logger.info(`Selected model: ${answers.model.id}`);
    return answers.model;
  }

  async confirmSelection(
    accountName: string,
    provider: AIProvider
  ): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Continue with ${accountName} (${provider})?`,
        default: true,
      },
    ]);

    return answers.confirmed;
  }

  async getAccountAction(): Promise<'select' | 'add' | 'switch' | 'exit'> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '👤 Account Management:',
        choices: [
          { name: '✓ Select Existing Account', value: 'select' },
          { name: '➕ Add New Account', value: 'add' },
          { name: '🔄 Switch Account', value: 'switch' },
          { name: '🚪 Exit', value: 'exit' },
        ],
      },
    ]);

    return answers.action;
  }

  async getInitialAction(): Promise<'chat' | 'accounts' | 'settings' | 'exit'> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '🚀 What would you like to do?',
        choices: [
          { name: '💬 Start Chatting', value: 'chat' },
          { name: '👤 Manage Accounts', value: 'accounts' },
          { name: '⚙️  Settings', value: 'settings' },
          { name: '🚪 Exit', value: 'exit' },
        ],
      },
    ]);

    return answers.action;
  }

  async showMainMenu(): Promise<'continue' | 'accounts' | 'settings' | 'logout' | 'exit'> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '📋 Main Menu:',
        choices: [
          { name: '💬 Continue Chatting', value: 'continue' },
          { name: '👤 Manage Accounts', value: 'accounts' },
          { name: '⚙️  Change Settings', value: 'settings' },
          { name: '🔐 Logout', value: 'logout' },
          { name: '🚪 Exit', value: 'exit' },
        ],
      },
    ]);

    return answers.action;
  }

  async showAccountMenu(): Promise<'view' | 'add' | 'remove' | 'switch' | 'back'> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '👤 Account Menu:',
        choices: [
          { name: '📋 View All Accounts', value: 'view' },
          { name: '➕ Add New Account', value: 'add' },
          { name: '🗑️  Remove Account', value: 'remove' },
          { name: '🔄 Switch Active Account', value: 'switch' },
          { name: '↩️  Back to Menu', value: 'back' },
        ],
      },
    ]);

    return answers.action;
  }

  async selectAccountToRemove(accounts: AccountCredential[]): Promise<AccountCredential | null> {
    if (accounts.length === 0) {
      console.log('❌ No accounts to remove');
      return null;
    }

    const choices = accounts.map((account) => ({
      name: `${account.accountName} (${account.provider})`,
      value: account,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'account',
        message: '🗑️  Select Account to Remove:',
        choices,
      },
    ]);

    const confirmed = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Are you sure you want to remove ${answers.account.accountName}?`,
        default: false,
      },
    ]);

    return confirmed.confirmed ? answers.account : null;
  }

  async selectSessionToResume(sessions: ChatSession[]): Promise<ChatSession | null> {
    if (sessions.length === 0) {
      return null;
    }

    const choices = sessions.map((session) => ({
      name: `${session.accountName} (${session.provider}) - ${session.messages.length} messages - ${new Date(session.startTime).toLocaleString()}`,
      value: session,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'session',
        message: '📝 Select Session to Resume:',
        choices,
        pageSize: 10,
      },
    ]);

    return answers.session;
  }

  async askYesNo(question: string): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'answer',
        message: question,
        default: false,
      },
    ]);

    return answers.answer;
  }

  async askRetryOrWorkaround(strategies: string[]): Promise<'retry' | 'workaround' | 'exit'> {
    const choices = [
      { name: '🔄 Retry the request', value: 'retry' },
      { name: '💡 Show workarounds', value: 'workaround' },
      { name: '❌ Skip and continue', value: 'exit' },
    ];

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices,
      },
    ]);

    return answers.action;
  }
}
