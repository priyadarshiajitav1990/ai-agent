// src/agent.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Logger } from './logger.js';
import { Message, AgentResponse, ConversationContext } from './types.js';

export class GeminiCodeAssistAgent {
  private client: GoogleGenerativeAI;
  private modelName: string;
  private logger: Logger;
  private conversationHistory: ConversationContext;
  private systemPrompt: string;

  constructor(apiKey: string, modelName: string, logLevel: string = 'info') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.logger = new Logger(logLevel);
    this.conversationHistory = {
      messages: [],
      sessionId: this.generateSessionId(),
      createdAt: new Date(),
    };
    this.systemPrompt = this.buildSystemPrompt();
    this.logger.info(`GeminiCodeAssistAgent initialized with model: ${modelName}`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildSystemPrompt(): string {
    return `You are an expert AI code assistant powered by Google Gemini. Your role is to:
- Provide high-quality code assistance and suggestions
- Help debug code issues
- Explain complex programming concepts
- Generate code snippets and solutions
- Review and improve existing code
- Answer programming-related questions

Guidelines:
- Be concise and direct in your responses
- Provide code examples when relevant
- Suggest best practices and improvements
- Be helpful and professional`;
  }

  async chat(userMessage: string): Promise<AgentResponse> {
    try {
      this.logger.info('Processing user message', { sessionId: this.conversationHistory.sessionId });

      // Add user message to history
      this.conversationHistory.messages.push({
        role: 'user',
        content: userMessage,
      });

      // Prepare messages for API call
      const messages = this.prepareMessagesForAPI();

      // Call Gemini API
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const result = await model.generateContent({
        contents: messages,
      });

      const responseText = result.response.text();
      
      // Add assistant response to history
      this.conversationHistory.messages.push({
        role: 'assistant',
        content: responseText,
      });

      this.logger.info('Response generated successfully');

      return {
        success: true,
        message: responseText,
        data: {
          sessionId: this.conversationHistory.sessionId,
          messageCount: this.conversationHistory.messages.length,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Error during chat', { error: errorMessage });

      return {
        success: false,
        message: 'Failed to generate response',
        error: errorMessage,
      };
    }
  }

  private prepareMessagesForAPI(): Array<{ role: string; parts: Array<{ text: string }> }> {
    const messages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add system prompt as first user message
    if (this.conversationHistory.messages.length === 1) {
      messages.push({
        role: 'user',
        parts: [{ text: this.systemPrompt }],
      });
      messages.push({
        role: 'model',
        parts: [{ text: 'Understood. I am ready to assist with code-related tasks.' }],
      });
    }

    // Add conversation history
    for (const msg of this.conversationHistory.messages) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    return messages;
  }

  getConversationHistory(): ConversationContext {
    return { ...this.conversationHistory };
  }

  clearHistory(): void {
    this.logger.info('Clearing conversation history');
    this.conversationHistory.messages = [];
    this.conversationHistory.sessionId = this.generateSessionId();
    this.conversationHistory.createdAt = new Date();
  }

  getSessionInfo(): { sessionId: string; messageCount: number; createdAt: Date } {
    return {
      sessionId: this.conversationHistory.sessionId,
      messageCount: this.conversationHistory.messages.length,
      createdAt: this.conversationHistory.createdAt,
    };
  }
}
