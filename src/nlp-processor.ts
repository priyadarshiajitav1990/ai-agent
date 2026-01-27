// src/nlp-processor.ts
import { Logger } from './logger.js';

export interface TokenizedText {
  tokens: string[];
  entities: NamedEntity[];
  sentiment: SentimentScore;
  keywords: KeywordExtraction[];
}

export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'ORG' | 'LOCATION' | 'DATE' | 'MONEY' | 'GPE' | 'PRODUCT' | 'OTHER';
  confidence: number;
  position: number;
}

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  dominant: 'positive' | 'negative' | 'neutral';
}

export interface KeywordExtraction {
  keyword: string;
  frequency: number;
  tfidf: number;
  confidence: number;
}

export class NLPProcessor {
  private logger: Logger;

  // Sentiment lexicons
  private readonly POSITIVE_WORDS = new Set([
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'perfect',
    'love',
    'like',
    'best',
    'awesome',
    'fantastic',
    'brilliant',
    'positive',
    'happy',
    'glad',
    'beautiful',
    'smart',
    'intelligent',
    'capable',
    'impressive',
  ]);

  private readonly NEGATIVE_WORDS = new Set([
    'bad',
    'terrible',
    'awful',
    'horrible',
    'hate',
    'dislike',
    'worst',
    'useless',
    'stupid',
    'dumb',
    'ugly',
    'negative',
    'sad',
    'angry',
    'disappointing',
    'broken',
    'failed',
    'error',
    'problem',
    'issue',
  ]);

  // Common stopwords
  private readonly STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
  ]);

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Tokenize text into words
   */
  tokenize(text: string): string[] {
    // Remove punctuation and split into words
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);

    return tokens;
  }

  /**
   * Remove stopwords
   */
  removeStopwords(tokens: string[]): string[] {
    return tokens.filter((token) => !this.STOPWORDS.has(token));
  }

  /**
   * Extract named entities (simplified)
   */
  extractEntities(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Simple pattern-based entity extraction
    const patterns = [
      { regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, type: 'PERSON' as const, confidence: 0.7 },
      {
        regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{4})\b/gi,
        type: 'DATE' as const,
        confidence: 0.9,
      },
      {
        regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
        type: 'MONEY' as const,
        confidence: 0.95,
      },
      {
        regex: /\b(?:Inc|Corp|Ltd|LLC|Company|Inc\.)\b/g,
        type: 'ORG' as const,
        confidence: 0.8,
      },
    ];

    for (const { regex, type, confidence } of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type,
          confidence,
          position: match.index,
        });
      }
    }

    return entities;
  }

  /**
   * Analyze sentiment
   */
  analyzeSentiment(text: string): SentimentScore {
    const tokens = this.tokenize(text);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const token of tokens) {
      if (this.POSITIVE_WORDS.has(token)) positiveCount++;
      if (this.NEGATIVE_WORDS.has(token)) negativeCount++;
    }

    const total = positiveCount + negativeCount || 1;
    const positive = positiveCount / total;
    const negative = negativeCount / total;
    const neutral = 1 - positive - negative;

    let dominant: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positive > negative && positive > 0.4) dominant = 'positive';
    if (negative > positive && negative > 0.4) dominant = 'negative';

    return {
      positive,
      negative,
      neutral,
      dominant,
    };
  }

  /**
   * Extract keywords using TF-IDF
   */
  extractKeywords(text: string, limit: number = 10): KeywordExtraction[] {
    const tokens = this.tokenize(text);
    const filteredTokens = this.removeStopwords(tokens);

    // Calculate term frequency
    const tf = new Map<string, number>();
    for (const token of filteredTokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Convert to TF-IDF scores (simplified - without corpus)
    const keywords: KeywordExtraction[] = [];
    for (const [keyword, frequency] of tf.entries()) {
      const tfidf = frequency * Math.log(1 + 1 / frequency);
      keywords.push({
        keyword,
        frequency,
        tfidf,
        confidence: Math.min(0.9, frequency / filteredTokens.length * 2),
      });
    }

    return keywords
      .sort((a, b) => b.tfidf - a.tfidf)
      .slice(0, limit);
  }

  /**
   * Calculate text similarity (Jaccard similarity)
   */
  calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.removeStopwords(this.tokenize(text1)));
    const tokens2 = new Set(this.removeStopwords(this.tokenize(text2)));

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Detect language (simplified)
   */
  detectLanguage(text: string): { language: string; confidence: number } {
    // Simple heuristic-based detection
    const cyrillic = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
    const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const chinese = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
    const hebrew = (text.match(/[\u0590-\u05FF]/g) || []).length;

    const total = text.length;

    if (cyrillic > total * 0.3) return { language: 'Russian', confidence: 0.8 };
    if (arabic > total * 0.3) return { language: 'Arabic', confidence: 0.8 };
    if (chinese > total * 0.1) return { language: 'Chinese', confidence: 0.8 };
    if (hebrew > total * 0.3) return { language: 'Hebrew', confidence: 0.8 };

    return { language: 'English', confidence: 0.85 };
  }

  /**
   * Perform full NLP analysis
   */
  analyzeText(text: string): TokenizedText {
    return {
      tokens: this.tokenize(text),
      entities: this.extractEntities(text),
      sentiment: this.analyzeSentiment(text),
      keywords: this.extractKeywords(text, 10),
    };
  }

  /**
   * Generate summary
   */
  generateSummary(text: string, sentenceCount: number = 3): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length <= sentenceCount) {
      return text;
    }

    // Score sentences based on keyword frequency
    const keywords = this.extractKeywords(text, 20).map((k) => k.keyword);
    const scoredSentences = sentences.map((sentence) => {
      let score = 0;
      for (const keyword of keywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          score += 1;
        }
      }
      return { sentence: sentence.trim(), score };
    });

    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .sort((a, b) => sentences.indexOf(a.sentence + '.') - sentences.indexOf(b.sentence + '.'))
      .map((s) => s.sentence);

    return topSentences.join('. ') + '.';
  }

  /**
   * Correct common spelling mistakes
   */
  correctSpelling(text: string): string {
    const corrections: Record<string, string> = {
      'recieve': 'receive',
      'wich': 'which',
      'occured': 'occurred',
      'buisness': 'business',
      'definately': 'definitely',
      'seperete': 'separate',
      'thier': 'their',
      'untill': 'until',
      'neccessary': 'necessary',
      'occassion': 'occasion',
    };

    let corrected = text;
    for (const [mistake, correct] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
      corrected = corrected.replace(regex, correct);
    }

    return corrected;
  }

  /**
   * Parse intent from text
   */
  parseIntent(text: string): { intent: string; confidence: number; entities: string[] } {
    const lowerText = text.toLowerCase();

    // Intent patterns
    const patterns = [
      { pattern: /generate|create|make|build|write/i, intent: 'create' },
      { pattern: /analyze|review|examine|study/i, intent: 'analyze' },
      { pattern: /explain|describe|tell|show/i, intent: 'explain' },
      { pattern: /fix|debug|correct|repair/i, intent: 'fix' },
      { pattern: /search|find|look for|query/i, intent: 'search' },
      { pattern: /execute|run|perform|do/i, intent: 'execute' },
      { pattern: /compare|contrast|difference/i, intent: 'compare' },
      { pattern: /summarize|brief|overview/i, intent: 'summarize' },
    ];

    for (const { pattern, intent } of patterns) {
      if (pattern.test(text)) {
        const confidence = 0.85;
        const entities = this.extractKeywords(text, 3).map((k) => k.keyword);
        return { intent, confidence, entities };
      }
    }

    return { intent: 'general', confidence: 0.6, entities: [] };
  }

  /**
   * Display NLP analysis
   */
  displayAnalysis(text: string, maxLength: number = 500): string {
    const analysis = this.analyzeText(text);
    const lines: string[] = [];

    lines.push('🔍 NLP ANALYSIS');
    lines.push('═'.repeat(70));
    lines.push('');

    lines.push('📝 TEXT PREVIEW');
    lines.push(text.substring(0, maxLength) + (text.length > maxLength ? '...' : ''));
    lines.push('');

    lines.push('🔤 TOKENS');
    lines.push(analysis.tokens.slice(0, 10).join(', ') + '...');
    lines.push('');

    lines.push('😊 SENTIMENT');
    lines.push(`  Positive: ${(analysis.sentiment.positive * 100).toFixed(1)}%`);
    lines.push(`  Negative: ${(analysis.sentiment.negative * 100).toFixed(1)}%`);
    lines.push(`  Neutral: ${(analysis.sentiment.neutral * 100).toFixed(1)}%`);
    lines.push(`  Dominant: ${analysis.sentiment.dominant}`);
    lines.push('');

    lines.push('🏷️ KEYWORDS');
    for (const keyword of analysis.keywords.slice(0, 5)) {
      lines.push(`  ${keyword.keyword} (${keyword.frequency}x, ${(keyword.tfidf * 100).toFixed(1)})`);
    }
    lines.push('');

    lines.push('🎯 ENTITIES');
    for (const entity of analysis.entities.slice(0, 5)) {
      lines.push(`  ${entity.text} [${entity.type}] - ${(entity.confidence * 100).toFixed(0)}%`);
    }

    return lines.join('\n');
  }
}
