// src/auth.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import open from 'open';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from './logger.js';

export interface Credentials {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type: string;
  scope: string[];
}

export class AuthenticationManager {
  private credentialsPath: string;
  private logger: Logger;
  private oauth2Client: OAuth2Client;
  private credentials: Credentials | null = null;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.credentialsPath = path.join(os.homedir(), '.ai-agent', 'credentials.json');
    
    // Initialize OAuth2 client
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_OAUTH_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
      process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'GOCSPX-your-client-secret',
      process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    );

    this.ensureCredentialsDir();
  }

  private ensureCredentialsDir(): void {
    const dir = path.dirname(this.credentialsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.info(`Created credentials directory: ${dir}`);
    }
  }

  async authenticate(): Promise<Credentials> {
    // Check if credentials already exist
    if (this.hasValidCredentials()) {
      this.logger.info('Using cached credentials');
      return this.credentials!;
    }

    this.logger.info('Starting authentication flow...');

    // Generate OAuth URL
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/compute',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    console.log('\n🔐 Authentication Required');
    console.log('===========================');
    console.log('Opening browser for authentication...\n');

    try {
      // Open browser automatically
      await open(authUrl);
      this.logger.info(`Opened authentication URL in browser: ${authUrl}`);
    } catch (error) {
      this.logger.warn('Could not open browser automatically. Please visit the URL manually:');
      console.log(`\n📱 Please visit this URL in your browser:\n${authUrl}\n`);
    }

    // For interactive flow, we'll use a different approach
    // In production, you'd set up a callback server
    // For now, we'll prompt for the auth code
    const authCode = await this.promptForAuthCode();
    
    const { tokens } = await this.oauth2Client.getToken(authCode);
    this.oauth2Client.setCredentials(tokens);

    const credentials: Credentials = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type!,
      scope: tokens.scope ? tokens.scope.split(' ') : [],
    };

    this.saveCredentials(credentials);
    this.credentials = credentials;

    this.logger.info('Authentication successful');
    console.log('✅ Authentication successful!\n');

    return credentials;
  }

  private async promptForAuthCode(): Promise<string> {
    // Dynamic import for inquirer
    const inquirer = await import('inquirer');
    
    const answers = await inquirer.default.prompt([
      {
        type: 'password',
        name: 'authCode',
        message: 'Enter the authorization code from the browser:',
        mask: '*',
      },
    ]);

    return answers.authCode;
  }

  private hasValidCredentials(): boolean {
    if (!fs.existsSync(this.credentialsPath)) {
      return false;
    }

    try {
      const data = fs.readFileSync(this.credentialsPath, 'utf-8');
      this.credentials = JSON.parse(data);

      // Check if token is expired
      if (this.credentials.expiry_date && this.credentials.expiry_date < Date.now()) {
        this.logger.info('Credentials expired, need re-authentication');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn('Error reading credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  private saveCredentials(credentials: Credentials): void {
    try {
      fs.writeFileSync(this.credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8');
      fs.chmodSync(this.credentialsPath, 0o600); // Secure file permissions
      this.logger.info(`Credentials saved to ${this.credentialsPath}`);
    } catch (error) {
      this.logger.error('Error saving credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  getCredentials(): Credentials | null {
    return this.credentials;
  }

  clearCredentials(): void {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        fs.unlinkSync(this.credentialsPath);
        this.credentials = null;
        this.logger.info('Credentials cleared');
      }
    } catch (error) {
      this.logger.error('Error clearing credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
