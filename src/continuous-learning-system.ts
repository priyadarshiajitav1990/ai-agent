// src/continuous-learning-system.ts
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger.js';

export interface LearningRecord {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  quality: number; // 0-100 feedback score
  category: string; // topic/domain
  tags: string[];
  isCorrect: boolean;
  userFeedback?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  version: number;
  records: LearningRecord[];
  categories: Map<string, LearningRecord[]>;
  totalAccuracy: number;
  lastUpdated: number;
  size: number;
}

export interface LearningMetrics {
  totalRecords: number;
  averageQuality: number;
  accuracyRate: number;
  topCategories: Array<{ category: string; count: number; avgQuality: number }>;
  recentLearning: LearningRecord[];
  improvementTrend: number; // percentage improvement over time
}

export class ContinuousLearningSystem {
  private logger: Logger;
  private knowledgeBase: KnowledgeBase;
  private persistenceDir: string;
  private maxRecords: number = 100000;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(logLevel: string = 'info', persistenceDir?: string) {
    this.logger = new Logger(logLevel);
    this.persistenceDir = persistenceDir || path.join(process.cwd(), '.learning-data');
    this.ensurePersistenceDirectory();

    this.knowledgeBase = {
      id: uuidv4(),
      name: 'AI Agent Knowledge Base',
      version: 1,
      records: [],
      categories: new Map(),
      totalAccuracy: 0,
      lastUpdated: Date.now(),
      size: 0,
    };

    this.loadKnowledgeBase();
    this.startAutoSave();

    this.logger.info('ContinuousLearningSystem initialized');
  }

  /**
   * Ensure persistence directory exists
   */
  private ensurePersistenceDirectory(): void {
    if (!fs.existsSync(this.persistenceDir)) {
      fs.mkdirSync(this.persistenceDir, { recursive: true });
      this.logger.info(`Created persistence directory: ${this.persistenceDir}`);
    }
  }

  /**
   * Record a learning instance
   */
  recordLearning(
    input: string,
    output: string,
    category: string,
    quality?: number,
    isCorrect?: boolean,
    userFeedback?: string,
    tags?: string[]
  ): string {
    const record: LearningRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      input,
      output,
      quality: quality || 75, // Default to 75% if not specified
      category,
      tags: tags || [],
      isCorrect: isCorrect !== undefined ? isCorrect : quality! > 70,
      userFeedback,
    };

    this.knowledgeBase.records.push(record);

    // Add to category index
    if (!this.knowledgeBase.categories.has(category)) {
      this.knowledgeBase.categories.set(category, []);
    }
    this.knowledgeBase.categories.get(category)!.push(record);

    // Maintain size limit with prioritization
    this.maintainKnowledgeBaseSize();

    // Update metrics
    this.updateMetrics();

    this.logger.debug(`Recorded learning: ${category} - Quality: ${record.quality}%`);

    return record.id;
  }

  /**
   * Maintain knowledge base size with quality-based pruning
   */
  private maintainKnowledgeBaseSize(): void {
    if (this.knowledgeBase.records.length > this.maxRecords) {
      // Sort by quality and timestamp, keep high-quality and recent records
      this.knowledgeBase.records.sort((a, b) => {
        const qualityDiff = b.quality - a.quality;
        if (Math.abs(qualityDiff) > 10) return qualityDiff; // Prioritize quality
        return b.timestamp - a.timestamp; // Then by recency
      });

      // Remove oldest/lowest quality records
      const removeCount = Math.floor(this.knowledgeBase.records.length * 0.1); // Remove 10%
      this.knowledgeBase.records.splice(this.maxRecords);

      // Rebuild category index
      this.rebuildCategoryIndex();

      this.logger.info(`Pruned ${removeCount} records to maintain knowledge base size`);
    }
  }

  /**
   * Rebuild category index
   */
  private rebuildCategoryIndex(): void {
    this.knowledgeBase.categories.clear();

    for (const record of this.knowledgeBase.records) {
      if (!this.knowledgeBase.categories.has(record.category)) {
        this.knowledgeBase.categories.set(record.category, []);
      }
      this.knowledgeBase.categories.get(record.category)!.push(record);
    }
  }

  /**
   * Retrieve relevant learning records for a query
   */
  retrieveRelevant(query: string, limit: number = 5): LearningRecord[] {
    // Simple keyword matching - can be enhanced with semantic search
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scored = this.knowledgeBase.records.map((record) => {
      let score = 0;

      // Score based on matching terms in input
      for (const term of queryTerms) {
        if (record.input.toLowerCase().includes(term)) score += 2;
        if (record.category.toLowerCase().includes(term)) score += 3;
        if (record.tags.some((tag) => tag.toLowerCase().includes(term))) score += 1;
      }

      // Factor in quality
      score *= record.quality / 100;

      // Factor in recency
      const ageInDays = (Date.now() - record.timestamp) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.exp(-ageInDays / 30); // Decay over 30 days
      score *= (1 + recencyScore);

      return { record, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.record);
  }

  /**
   * Provide learning-based context for prompts
   */
  getContextForPrompt(query: string, maxContextSize: number = 2000): string {
    const relevant = this.retrieveRelevant(query, 5);

    if (relevant.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('📚 RELEVANT LEARNED CONTEXT:');
    lines.push('═'.repeat(50));

    for (const record of relevant) {
      const confidence = `${record.quality}%`;
      lines.push(`\n[${record.category}] - Confidence: ${confidence}`);
      lines.push(`Q: ${record.input.substring(0, 100)}...`);
      lines.push(`A: ${record.output.substring(0, 150)}...`);
    }

    const context = lines.join('\n');
    return context.substring(0, maxContextSize);
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    if (this.knowledgeBase.records.length === 0) return;

    const correctCount = this.knowledgeBase.records.filter((r) => r.isCorrect).length;
    this.knowledgeBase.totalAccuracy = (correctCount / this.knowledgeBase.records.length) * 100;
    this.knowledgeBase.lastUpdated = Date.now();
    this.knowledgeBase.size = this.knowledgeBase.records.length;
  }

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    const topCategories: Array<{ category: string; count: number; avgQuality: number }> = [];

    for (const [category, records] of this.knowledgeBase.categories.entries()) {
      const avgQuality = records.reduce((sum, r) => sum + r.quality, 0) / records.length;
      topCategories.push({
        category,
        count: records.length,
        avgQuality,
      });
    }

    topCategories.sort((a, b) => b.count - a.count);

    // Calculate improvement trend
    const recentRecords = this.knowledgeBase.records.filter(
      (r) => r.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const olderRecords = this.knowledgeBase.records.filter(
      (r) => r.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const recentQuality =
      recentRecords.length > 0
        ? recentRecords.reduce((sum, r) => sum + r.quality, 0) / recentRecords.length
        : 75;
    const olderQuality =
      olderRecords.length > 0
        ? olderRecords.reduce((sum, r) => sum + r.quality, 0) / olderRecords.length
        : 75;

    const improvementTrend = recentQuality - olderQuality;

    return {
      totalRecords: this.knowledgeBase.records.length,
      averageQuality:
        this.knowledgeBase.records.reduce((sum, r) => sum + r.quality, 0) /
        this.knowledgeBase.records.length,
      accuracyRate: this.knowledgeBase.totalAccuracy,
      topCategories: topCategories.slice(0, 10),
      recentLearning: this.knowledgeBase.records.slice(-10).reverse(),
      improvementTrend,
    };
  }

  /**
   * Provide user feedback on a learning record
   */
  updateFeedback(recordId: string, quality: number, feedback?: string): boolean {
    const record = this.knowledgeBase.records.find((r) => r.id === recordId);

    if (!record) {
      this.logger.warn(`Learning record not found: ${recordId}`);
      return false;
    }

    // Weighted update - new feedback influences existing quality
    const oldQuality = record.quality;
    record.quality = Math.round((oldQuality + quality) / 2);
    record.isCorrect = record.quality > 70;
    record.userFeedback = feedback;

    this.updateMetrics();

    this.logger.debug(
      `Updated feedback for record ${recordId}: ${oldQuality}% → ${record.quality}%`
    );

    return true;
  }

  /**
   * Save knowledge base to disk (permanent storage)
   */
  async saveKnowledgeBase(): Promise<boolean> {
    try {
      const data = {
        id: this.knowledgeBase.id,
        name: this.knowledgeBase.name,
        version: this.knowledgeBase.version,
        records: this.knowledgeBase.records,
        totalAccuracy: this.knowledgeBase.totalAccuracy,
        lastUpdated: this.knowledgeBase.lastUpdated,
        size: this.knowledgeBase.size,
      };

      const filePath = path.join(this.persistenceDir, 'knowledge-base.json');
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));

      this.logger.info(
        `Knowledge base saved (${this.knowledgeBase.records.length} records)`
      );

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to save knowledge base: ${error.message}`);
      return false;
    }
  }

  /**
   * Load knowledge base from disk
   */
  private loadKnowledgeBase(): void {
    try {
      const filePath = path.join(this.persistenceDir, 'knowledge-base.json');

      if (!fs.existsSync(filePath)) {
        this.logger.info('No existing knowledge base found, starting fresh');
        return;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      this.knowledgeBase = {
        id: data.id,
        name: data.name,
        version: data.version,
        records: data.records || [],
        categories: new Map(),
        totalAccuracy: data.totalAccuracy,
        lastUpdated: data.lastUpdated,
        size: data.size,
      };

      // Rebuild category index
      this.rebuildCategoryIndex();

      this.logger.info(
        `Knowledge base loaded (${this.knowledgeBase.records.length} records)`
      );
    } catch (error: any) {
      this.logger.error(`Failed to load knowledge base: ${error.message}`);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveKnowledgeBase();
    }, 5 * 60 * 1000); // Auto-save every 5 minutes

    this.logger.info('Auto-save enabled (every 5 minutes)');
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      this.logger.info('Auto-save disabled');
    }
  }

  /**
   * Export knowledge base
   */
  async exportKnowledgeBase(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.knowledgeBase, null, 2);
    }

    // CSV export
    const headers = ['id', 'timestamp', 'input', 'output', 'quality', 'category', 'tags'];
    const rows = this.knowledgeBase.records.map((r) => [
      r.id,
      new Date(r.timestamp).toISOString(),
      `"${r.input.replace(/"/g, '""')}"`,
      `"${r.output.replace(/"/g, '""')}"`,
      r.quality,
      r.category,
      r.tags.join(';'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Display learning metrics
   */
  displayMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    lines.push('📊 CONTINUOUS LEARNING METRICS');
    lines.push('═'.repeat(70));
    lines.push(`Total Records: ${metrics.totalRecords}`);
    lines.push(`Average Quality: ${metrics.averageQuality.toFixed(1)}%`);
    lines.push(`Accuracy Rate: ${metrics.accuracyRate.toFixed(1)}%`);
    lines.push(
      `Improvement Trend: ${metrics.improvementTrend > 0 ? '+' : ''}${metrics.improvementTrend.toFixed(1)}%`
    );
    lines.push('');

    lines.push('📚 TOP CATEGORIES');
    for (const cat of metrics.topCategories.slice(0, 5)) {
      lines.push(`  ${cat.category}: ${cat.count} records, ${cat.avgQuality.toFixed(1)}% avg quality`);
    }
    lines.push('');

    lines.push('🆕 RECENT LEARNING');
    for (const record of metrics.recentLearning.slice(0, 5)) {
      lines.push(`  [${record.category}] ${record.input.substring(0, 50)}...`);
    }

    return lines.join('\n');
  }

  /**
   * Reset knowledge base
   */
  async resetKnowledgeBase(): Promise<boolean> {
    try {
      this.knowledgeBase = {
        id: uuidv4(),
        name: 'AI Agent Knowledge Base',
        version: 1,
        records: [],
        categories: new Map(),
        totalAccuracy: 0,
        lastUpdated: Date.now(),
        size: 0,
      };

      this.logger.info('Knowledge base reset');
      return await this.saveKnowledgeBase();
    } catch (error: any) {
      this.logger.error(`Failed to reset knowledge base: ${error.message}`);
      return false;
    }
  }
}
