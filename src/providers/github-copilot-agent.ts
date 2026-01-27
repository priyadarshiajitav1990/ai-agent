// src/providers/github-copilot-agent.ts
import { Octokit } from '@octokit/rest';
import { Logger } from '../logger.js';
import { Message, AgentResponse } from '../types.js';

export class GitHubCopilotAgent {
  private octokit: Octokit;
  private logger: Logger;
  private conversationHistory: Message[] = [];
  private sessionId: string;

  constructor(githubToken: string, logLevel: string = 'info') {
    this.octokit = new Octokit({ auth: githubToken });
    this.logger = new Logger(logLevel);
    this.sessionId = `github-copilot-${Date.now()}`;
    this.logger.info('GitHub Copilot agent initialized');
  }

  async chat(userMessage: string): Promise<AgentResponse> {
    try {
      this.logger.info('Processing GitHub Copilot request');

      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // GitHub Copilot uses OpenAI models through GitHub's API
      // This demonstrates code completions and suggestions
      const response = await this.generateCopilotResponse(userMessage);

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      return {
        success: true,
        message: response,
        data: {
          provider: 'github-copilot',
          sessionId: this.sessionId,
          messageCount: this.conversationHistory.length,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Error in GitHub Copilot chat', { error: errorMessage });

      return {
        success: false,
        message: 'Failed to generate Copilot response',
        error: errorMessage,
      };
    }
  }

  private async generateCopilotResponse(userMessage: string): Promise<string> {
    // GitHub Copilot response generation
    // This would typically call GitHub's Copilot API
    const isCodeQuestion = userMessage.toLowerCase().includes('code') || 
                          userMessage.toLowerCase().includes('function') ||
                          userMessage.toLowerCase().includes('class');

    if (isCodeQuestion) {
      return `GitHub Copilot Suggestion:\n\n${this.generateCodeSuggestion(userMessage)}`;
    }

    return `GitHub Copilot: ${userMessage}\n\nGitHub Copilot is great for code completion and suggestions.`;
  }

  private generateCodeSuggestion(query: string): string {
    return `// Suggestion based on GitHub Copilot\n// Query: ${query}\n\n// Example implementation:\nfunction example() {\n  // Your code here\n}`;
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.logger.info('GitHub Copilot conversation history cleared');
  }

  getSessionInfo(): {
    sessionId: string;
    messageCount: number;
    provider: string;
  } {
    return {
      sessionId: this.sessionId,
      messageCount: this.conversationHistory.length,
      provider: 'github-copilot',
    };
  }
}
