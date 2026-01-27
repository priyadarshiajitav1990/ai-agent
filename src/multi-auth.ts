// src/multi-auth.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import open from 'open';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger.js';
import { AIProvider, AccountCredential, UserAccount } from './provider-types.js';

export class MultiProviderAuthManager {
  private accountsPath: string;
  private logger: Logger;
  private accounts: Map<string, AccountCredential> = new Map();
  private activeAccountId: string | null = null;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.accountsPath = path.join(os.homedir(), '.ai-agent', 'accounts');
    this.ensureAccountsDir();
    this.loadAccounts();
  }

  private ensureAccountsDir(): void {
    if (!fs.existsSync(this.accountsPath)) {
      fs.mkdirSync(this.accountsPath, { recursive: true });
      this.logger.info(`Created accounts directory: ${this.accountsPath}`);
    }
  }

  private loadAccounts(): void {
    try {
      const files = fs.readdirSync(this.accountsPath).filter((f) => f.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(this.accountsPath, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        const credential: AccountCredential = JSON.parse(data);
        this.accounts.set(credential.accountId, credential);
      }

      // Set first account as active if none are set
      if (this.accounts.size > 0 && !this.activeAccountId) {
        this.activeAccountId = Array.from(this.accounts.keys())[0];
        this.logger.info(`Loaded ${this.accounts.size} accounts`);
      }
    } catch (error) {
      this.logger.error(`Error loading accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addAccount(
    provider: AIProvider,
    accountName: string,
    token: string,
    refreshToken?: string,
    metadata?: Record<string, unknown>
  ): Promise<AccountCredential> {
    const accountId = uuidv4();
    const credential: AccountCredential = {
      accountId,
      provider,
      accountName,
      accessToken: token,
      refreshToken,
      expiryDate: refreshToken ? Date.now() + 86400000 : undefined, // 24h default
      metadata,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    this.accounts.set(accountId, credential);
    this.activeAccountId = accountId;
    this.saveAccount(credential);

    this.logger.info(`Added account: ${accountName} (${provider})`);
    return credential;
  }

  private saveAccount(credential: AccountCredential): void {
    try {
      const accountFile = path.join(this.accountsPath, `${credential.accountId}.json`);
      fs.writeFileSync(accountFile, JSON.stringify(credential, null, 2), 'utf-8');
      fs.chmodSync(accountFile, 0o600);
      this.logger.debug(`Account saved: ${credential.accountId}`);
    } catch (error) {
      this.logger.error(`Error saving account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAccount(accountId: string): AccountCredential | undefined {
    return this.accounts.get(accountId);
  }

  getActiveAccount(): AccountCredential | undefined {
    if (this.activeAccountId) {
      return this.accounts.get(this.activeAccountId);
    }
    return undefined;
  }

  setActiveAccount(accountId: string): boolean {
    if (this.accounts.has(accountId)) {
      this.activeAccountId = accountId;
      const account = this.accounts.get(accountId);
      if (account) {
        account.lastUsed = new Date().toISOString();
        this.saveAccount(account);
      }
      this.logger.info(`Active account switched to: ${accountId}`);
      return true;
    }
    return false;
  }

  getAllAccounts(): AccountCredential[] {
    return Array.from(this.accounts.values());
  }

  getAccountsByProvider(provider: AIProvider): AccountCredential[] {
    return Array.from(this.accounts.values()).filter((a) => a.provider === provider);
  }

  removeAccount(accountId: string): boolean {
    try {
      const accountFile = path.join(this.accountsPath, `${accountId}.json`);
      if (fs.existsSync(accountFile)) {
        fs.unlinkSync(accountFile);
        this.accounts.delete(accountId);

        // Switch to another account if active one was deleted
        if (this.activeAccountId === accountId) {
          const remaining = Array.from(this.accounts.keys());
          this.activeAccountId = remaining.length > 0 ? remaining[0] : null;
        }

        this.logger.info(`Account removed: ${accountId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error removing account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  updateAccountToken(accountId: string, newToken: string, refreshToken?: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.accessToken = newToken;
    if (refreshToken) {
      account.refreshToken = refreshToken;
    }
    account.lastUsed = new Date().toISOString();
    
    this.saveAccount(account);
    this.logger.info(`Account token updated: ${accountId}`);
    return true;
  }

  isTokenExpired(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account || !account.expiryDate) return false;
    return account.expiryDate < Date.now();
  }

  async authenticateProvider(provider: AIProvider, accountName: string): Promise<AccountCredential | null> {
    console.log(`\n🔐 Authenticating ${provider} as ${accountName}...`);

    try {
      switch (provider) {
        case 'gemini':
          return await this.authenticateGemini(accountName);
        case 'github-copilot':
          return await this.authenticateGitHubCopilot(accountName);
        case 'microsoft-copilot':
          return await this.authenticateMicrosoftCopilot(accountName);
        case 'azure-openai':
          return await this.authenticateAzureOpenAI(accountName);
        default:
          this.logger.error(`Unknown provider: ${provider}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private async authenticateGemini(accountName: string): Promise<AccountCredential | null> {
    const inquirer = await import('inquirer');

    const answers = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Gemini API Key (visit https://aistudio.google.com/app/apikeys):',
        mask: '*',
      },
    ]);

    if (!answers.apiKey) return null;

    try {
      await open('https://aistudio.google.com/app/apikeys');
    } catch (error) {
      console.log('Please visit: https://aistudio.google.com/app/apikeys');
    }

    return this.addAccount('gemini', accountName, answers.apiKey, undefined, { type: 'gemini' });
  }

  private async authenticateGitHubCopilot(accountName: string): Promise<AccountCredential | null> {
    const inquirer = await import('inquirer');
    const authUrl = 'https://github.com/login/oauth/authorize?client_id=github-copilot&redirect_uri=http://localhost:8080/callback&scope=user:email';

    console.log('\n🌐 Opening GitHub authorization in browser...');
    try {
      await open(authUrl);
    } catch (error) {
      console.log(`\nPlease visit: ${authUrl}`);
    }

    const answers = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub Personal Access Token (with copilot scope):',
        mask: '*',
      },
    ]);

    if (!answers.token) return null;

    return this.addAccount('github-copilot', accountName, answers.token, undefined, {
      type: 'github-copilot',
      provider: 'openai',
    });
  }

  private async authenticateMicrosoftCopilot(accountName: string): Promise<AccountCredential | null> {
    const inquirer = await import('inquirer');
    const authUrl = 'https://login.microsoft.com/common/oauth2/v2.0/authorize?client_id=Microsoft.Identity&redirect_uri=http://localhost:8080/callback&scope=offline_access';

    console.log('\n🌐 Opening Microsoft authorization in browser...');
    try {
      await open(authUrl);
    } catch (error) {
      console.log(`\nPlease visit: ${authUrl}`);
    }

    const answers = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your Microsoft Copilot API Token:',
        mask: '*',
      },
      {
        type: 'password',
        name: 'refreshToken',
        message: 'Enter your Refresh Token (optional):',
        mask: '*',
      },
    ]);

    if (!answers.token) return null;

    return this.addAccount('microsoft-copilot', accountName, answers.token, answers.refreshToken || undefined, {
      type: 'microsoft-copilot',
    });
  }

  private async authenticateAzureOpenAI(accountName: string): Promise<AccountCredential | null> {
    const inquirer = await import('inquirer');

    const answers = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Azure OpenAI API Key:',
        mask: '*',
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'Enter your Azure OpenAI Endpoint (https://xxx.openai.azure.com/):',
      },
      {
        type: 'input',
        name: 'deploymentId',
        message: 'Enter your Deployment ID:',
      },
    ]);

    if (!answers.apiKey || !answers.endpoint) return null;

    return this.addAccount('azure-openai', accountName, answers.apiKey, undefined, {
      endpoint: answers.endpoint,
      deploymentId: answers.deploymentId,
    });
  }

  getAccountStats(): {
    totalAccounts: number;
    byProvider: Record<AIProvider, number>;
    activeAccount: AccountCredential | undefined;
  } {
    const byProvider: Record<AIProvider, number> = {
      'gemini': 0,
      'github-copilot': 0,
      'microsoft-copilot': 0,
      'azure-openai': 0,
    };

    for (const account of this.accounts.values()) {
      byProvider[account.provider]++;
    }

    return {
      totalAccounts: this.accounts.size,
      byProvider,
      activeAccount: this.getActiveAccount(),
    };
  }
}
