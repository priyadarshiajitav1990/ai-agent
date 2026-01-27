// src/agent-factory.ts
import { Logger } from './logger.js';
import { GeminiCodeAssistAgent } from './agent.js';
import { GitHubCopilotAgent } from './providers/github-copilot-agent.js';
import { MicrosoftCopilotAgent } from './providers/microsoft-copilot-agent.js';
import { AzureOpenAIAgent } from './providers/azure-openai-agent.js';
import { AIProvider, AccountCredential } from './provider-types.js';

export type AgentInstance = 
  | GeminiCodeAssistAgent 
  | GitHubCopilotAgent 
  | MicrosoftCopilotAgent 
  | AzureOpenAIAgent;

export class AgentFactory {
  private logger: Logger;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  createAgent(account: AccountCredential, apiKey?: string): AgentInstance | null {
    try {
      switch (account.provider) {
        case 'gemini':
          if (!apiKey) {
            this.logger.error('Gemini API key required');
            return null;
          }
          return new GeminiCodeAssistAgent(apiKey, 'gemini-2.0-flash', this.logger['minLevel'] ? 'debug' : 'info');

        case 'github-copilot':
          return new GitHubCopilotAgent(account.accessToken, 'info');

        case 'microsoft-copilot':
          return new MicrosoftCopilotAgent(account.accessToken, 'info');

        case 'azure-openai':
          const metadata = account.metadata as Record<string, string>;
          if (!metadata?.endpoint || !metadata?.deploymentId) {
            this.logger.error('Azure OpenAI metadata missing');
            return null;
          }
          return new AzureOpenAIAgent(
            account.accessToken,
            metadata.endpoint,
            metadata.deploymentId,
            'info'
          );

        default:
          this.logger.error(`Unknown provider: ${account.provider}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Error creating agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  getProviderDescription(provider: AIProvider): string {
    const descriptions: Record<AIProvider, string> = {
      'gemini': 'Google Gemini - Advanced AI with multiple model options',
      'github-copilot': 'GitHub Copilot - Code-focused AI assistant',
      'microsoft-copilot': 'Microsoft Copilot - Enterprise productivity AI',
      'azure-openai': 'Azure OpenAI - Powerful GPT models with enterprise support',
    };
    return descriptions[provider] || 'Unknown provider';
  }
}
