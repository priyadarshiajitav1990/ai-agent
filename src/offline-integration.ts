// src/offline-integration.ts
import { Logger } from './logger.js';
import { LocalLLMIntegrator } from './local-llm-integrator.js';
import { ContinuousLearningSystem } from './continuous-learning-system.js';
import { HybridModeManager } from './hybrid-mode-manager.js';
import { NLPProcessor } from './nlp-processor.js';
import { ChatSession, ChatMessage } from './chat-history.js';

export interface OfflineIntegrationConfig {
  enableOfflineMode: boolean;
  enableLearning: boolean;
  enableNLP: boolean;
  learningDataPath?: string;
  localModelName?: string;
}

/**
 * OfflineIntegration coordinates all offline/learning/hybrid capabilities
 */
export class OfflineIntegration {
  private logger: Logger;
  private localLLM: LocalLLMIntegrator;
  private learningSystem: ContinuousLearningSystem;
  private hybridMode: HybridModeManager;
  private nlpProcessor: NLPProcessor;
  private config: OfflineIntegrationConfig;

  constructor(config: Partial<OfflineIntegrationConfig> = {}, logLevel: string = 'info') {
    this.logger = new Logger(logLevel);

    this.config = {
      enableOfflineMode: config.enableOfflineMode !== false,
      enableLearning: config.enableLearning !== false,
      enableNLP: config.enableNLP !== false,
      learningDataPath: config.learningDataPath || '.learning-data',
      localModelName: config.localModelName || 'mistral',
    };

    // Initialize all offline systems
    this.localLLM = new LocalLLMIntegrator();
    this.learningSystem = new ContinuousLearningSystem(this.config.learningDataPath);
    this.hybridMode = new HybridModeManager({
      mode: this.config.enableOfflineMode ? 'hybrid' : 'online',
      preferredProvider: 'auto',
      fallbackEnabled: true,
    }, logLevel);
    this.nlpProcessor = new NLPProcessor(logLevel);

    this.logger.info('OfflineIntegration initialized');
  }

  /**
   * Initialize offline systems
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing offline systems...');

      // Start hybrid mode
      if (this.config.enableOfflineMode) {
        await this.hybridMode.start();
      }

      this.logger.info('Offline systems initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize offline systems: ${error}`);
      throw error;
    }
  }

  /**
   * Shutdown offline systems
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down offline systems...');
      await this.hybridMode.stop();
      this.learningSystem.saveKnowledgeBase();
      this.logger.info('Offline systems shut down');
    } catch (error) {
      this.logger.error(`Error during shutdown: ${error}`);
    }
  }

  /**
   * Process a user query with learning and NLP
   */
  async processQuery(userInput: string, context?: string): Promise<{
    enhancedPrompt: string;
    relevantContext: string;
    intent: { intent: string; confidence: number; entities: string[] };
  }> {
    // Parse intent
    const intent = this.nlpProcessor.parseIntent(userInput);

    // Get relevant learning context
    let relevantContext = '';
    if (this.config.enableLearning) {
      const learningRecords = this.learningSystem.retrieveRelevant(userInput, 5);
      if (learningRecords.length > 0) {
        relevantContext = this.learningSystem.getContextForPrompt(userInput);
      }
    }

    // Enhance prompt with context
    let enhancedPrompt = userInput;
    if (relevantContext) {
      enhancedPrompt = `${context || ''}\n\nPrevious relevant learning:\n${relevantContext}\n\nUser query: ${userInput}`;
    } else if (context) {
      enhancedPrompt = `${context}\n\nUser query: ${userInput}`;
    }

    return {
      enhancedPrompt,
      relevantContext,
      intent,
    };
  }

  /**
   * Record learning from interaction
   */
  recordInteraction(
    userInput: string,
    assistantOutput: string,
    quality: number = 80,
    category: string = 'general',
  ): string {
    if (!this.config.enableLearning) return '';

    const recordId = this.learningSystem.recordLearning(
      userInput,
      assistantOutput,
      category,
      quality,
      [category],
    );

    this.logger.debug(`Recorded learning interaction: ${recordId}`);
    return recordId;
  }

  /**
   * Update learning feedback
   */
  updateLearningFeedback(recordId: string, quality: number): void {
    if (!this.config.enableLearning) return;
    this.learningSystem.updateFeedback(recordId, quality);
    this.logger.debug(`Updated learning feedback for: ${recordId}`);
  }

  /**
   * Learn from chat session
   */
  learnFromSession(session: ChatSession): number {
    if (!this.config.enableLearning) return 0;

    let recordCount = 0;

    for (let i = 0; i < session.messages.length - 1; i++) {
      const current = session.messages[i];
      const next = session.messages[i + 1];

      if (current.role === 'user' && next.role === 'assistant') {
        // Analyze interaction quality
        const quality = this.calculateInteractionQuality(current, next);

        if (quality > 40) {
          // Only record meaningful interactions
          this.recordInteraction(
            current.content,
            next.content,
            quality,
            this.categorizeInteraction(current.content),
          );
          recordCount++;
        }
      }
    }

    this.logger.info(`Learned ${recordCount} interactions from session`);
    return recordCount;
  }

  /**
   * Calculate interaction quality
   */
  private calculateInteractionQuality(userMsg: ChatMessage, assistantMsg: ChatMessage): number {
    let quality = 70; // Base quality

    // Penalize errors
    if (assistantMsg.error) quality -= 30;
    if (userMsg.retryCount && userMsg.retryCount > 0) quality -= userMsg.retryCount * 5;

    // Reward length (more detailed responses)
    if (assistantMsg.content.length > 500) quality += 10;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Categorize interaction
   */
  private categorizeInteraction(userInput: string): string {
    const intent = this.nlpProcessor.parseIntent(userInput);
    return intent.intent || 'general';
  }

  /**
   * Analyze conversation with NLP
   */
  analyzeConversation(messages: ChatMessage[]): {
    sentiment: any;
    keyTopics: string[];
    conversationQuality: number;
  } {
    const fullText = messages.map((m) => m.content).join(' ');

    const sentiment = this.nlpProcessor.analyzeSentiment(fullText);
    const keywords = this.nlpProcessor.extractKeywords(fullText, 10);
    const keyTopics = keywords.map((k) => k.keyword);

    // Calculate conversation quality
    let qualityScore = 70;
    if (sentiment.positive > sentiment.negative) qualityScore += 10;
    if (keyTopics.length > 5) qualityScore += 10;

    return {
      sentiment,
      keyTopics,
      conversationQuality: Math.min(100, qualityScore),
    };
  }

  /**
   * Get learning metrics
   */
  getLearningMetrics() {
    return this.learningSystem.getMetrics();
  }

  /**
   * Get hybrid mode metrics
   */
  getHybridMetrics() {
    return this.hybridMode.getMetrics();
  }

  /**
   * Display full status
   */
  displayStatus(): string {
    const lines: string[] = [];

    lines.push('🚀 OFFLINE INTEGRATION STATUS');
    lines.push('═'.repeat(70));
    lines.push('');

    lines.push('⚙️ CONFIGURATION');
    lines.push(`  Offline Mode: ${this.config.enableOfflineMode ? '✅ Enabled' : '❌ Disabled'}`);
    lines.push(`  Learning System: ${this.config.enableLearning ? '✅ Enabled' : '❌ Disabled'}`);
    lines.push(`  NLP Processor: ${this.config.enableNLP ? '✅ Enabled' : '❌ Disabled'}`);
    lines.push(`  Local Model: ${this.config.localModelName}`);
    lines.push('');

    lines.push('📚 LEARNING SYSTEM');
    const learningMetrics = this.getLearningMetrics();
    lines.push(`  Total Records: ${learningMetrics.totalRecords}`);
    lines.push(`  Average Quality: ${learningMetrics.averageQuality.toFixed(1)}%`);
    lines.push(`  Accuracy Rate: ${learningMetrics.accuracyRate.toFixed(1)}%`);
    lines.push('');

    lines.push('🌐 HYBRID MODE');
    const hybridMetrics = this.getHybridMetrics();
    lines.push(`  Mode: ${hybridMetrics.config.mode}`);
    lines.push(`  Total Requests: ${hybridMetrics.requestCount}`);
    lines.push(`  Local Requests: ${hybridMetrics.localRequests}`);
    lines.push(`  Failed Requests: ${hybridMetrics.failedRequests}`);

    return lines.join('\n');
  }

  /**
   * Get all processors
   */
  getProcessors() {
    return {
      localLLM: this.localLLM,
      learningSystem: this.learningSystem,
      hybridMode: this.hybridMode,
      nlpProcessor: this.nlpProcessor,
    };
  }
}
