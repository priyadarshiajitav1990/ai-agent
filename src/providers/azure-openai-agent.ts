// src/providers/azure-openai-agent.ts
import { OpenAI } from 'openai';
import { Logger } from '../logger.js';
import { Message, AgentResponse } from '../types.js';

export class AzureOpenAIAgent {
  private client: OpenAI;
  private logger: Logger;
  private conversationHistory: Message[] = [];
  private sessionId: string;
  private deploymentId: string;

  constructor(apiKey: string, endpoint: string, deploymentId: string, logLevel: string = 'info') {
    this.deploymentId = deploymentId;
    this.logger = new Logger(logLevel);
    this.sessionId = `azure-openai-${Date.now()}`;

    // Initialize Azure OpenAI client
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentId}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': apiKey,
      },
    });

    this.logger.info('Azure OpenAI agent initialized');
  }

  async chat(userMessage: string): Promise<AgentResponse> {
    try {
      this.logger.info('Processing Azure OpenAI request');

      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Prepare messages for Azure OpenAI
      const messages = this.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Call Azure OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.deploymentId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'No response generated';

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return {
        success: true,
        message: assistantMessage,
        data: {
          provider: 'azure-openai',
          sessionId: this.sessionId,
          messageCount: this.conversationHistory.length,
          model: this.deploymentId,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Error in Azure OpenAI chat', { error: errorMessage });

      return {
        success: false,
        message: 'Failed to generate Azure OpenAI response',
        error: errorMessage,
      };
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.logger.info('Azure OpenAI conversation history cleared');
  }

  getSessionInfo(): {
    sessionId: string;
    messageCount: number;
    provider: string;
    deployment: string;
  } {
    return {
      sessionId: this.sessionId,
      messageCount: this.conversationHistory.length,
      provider: 'azure-openai',
      deployment: this.deploymentId,
    };
  }
}
