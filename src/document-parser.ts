// src/document-parser.ts
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

export interface ParsedDocument {
  filename: string;
  filetype: string;
  content: string;
  metadata?: Record<string, any>;
  pages?: number;
  wordCount?: number;
  parseTime: number;
}

export class DocumentParser {
  private logger: Logger;
  private supportedTypes = [
    'txt', 'md', 'json', 'xml', 'csv',
    'pdf', 'docx', 'doc', 'xlsx', 'xls',
    'pptx', 'ppt', 'html', 'htm', 'yaml', 'yml'
  ];

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Parse document from file path
   */
  async parseDocument(filePath: string): Promise<ParsedDocument | null> {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        this.logger.error(`File not found: ${filePath}`);
        return null;
      }

      const startTime = Date.now();
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '');

      // Check if supported
      if (!this.isSupportedType(ext)) {
        this.logger.warn(`Unsupported file type: ${ext}`);
        return null;
      }

      // Check file size (max 50MB)
      if (stats.size > 50 * 1024 * 1024) {
        this.logger.error(`File too large: ${stats.size} bytes`);
        return null;
      }

      let content: string;
      let metadata: Record<string, any> | undefined;
      let pages: number | undefined;

      // Parse based on type
      switch (ext) {
        case 'pdf':
          // PDF parsing would require pdf-parse or similar
          this.logger.warn('PDF parsing not yet implemented');
          return null;

        case 'docx':
        case 'xlsx':
        case 'pptx':
          // These require specialized libraries
          this.logger.warn(`${ext.toUpperCase()} parsing requires additional dependencies`);
          return null;

        case 'csv':
          content = this.parseCsv(fs.readFileSync(filePath, 'utf-8'));
          break;

        case 'json':
          content = this.parseJson(fs.readFileSync(filePath, 'utf-8'));
          metadata = this.extractJsonMetadata(fs.readFileSync(filePath, 'utf-8'));
          break;

        case 'xml':
          content = this.parseXml(fs.readFileSync(filePath, 'utf-8'));
          break;

        case 'html':
        case 'htm':
          content = this.parseHtml(fs.readFileSync(filePath, 'utf-8'));
          break;

        case 'md':
        case 'txt':
        case 'yaml':
        case 'yml':
        default:
          content = fs.readFileSync(filePath, 'utf-8');
          break;
      }

      const parseTime = Date.now() - startTime;
      const wordCount = content.split(/\s+/).length;

      return {
        filename: path.basename(filePath),
        filetype: ext,
        content,
        metadata,
        pages,
        wordCount,
        parseTime,
      };
    } catch (error) {
      this.logger.error(`Failed to parse document: ${error}`);
      return null;
    }
  }

  /**
   * Parse CSV content
   */
  private parseCsv(content: string): string {
    const lines = content.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const rows = lines.slice(1).filter(line => line.trim());

    // Format as table
    const formatted: string[] = [];
    formatted.push(headers.join(' | '));
    formatted.push(headers.map(() => '---').join(' | '));

    for (const row of rows.slice(0, 100)) { // Limit to first 100 rows
      const cells = row.split(',').map(c => c.trim());
      formatted.push(cells.join(' | '));
    }

    if (rows.length > 100) {
      formatted.push(`... and ${rows.length - 100} more rows`);
    }

    return formatted.join('\n');
  }

  /**
   * Parse JSON content
   */
  private parseJson(content: string): string {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  /**
   * Extract metadata from JSON
   */
  private extractJsonMetadata(content: string): Record<string, any> {
    try {
      const parsed = JSON.parse(content);
      return {
        keys: Object.keys(parsed).length,
        isArray: Array.isArray(parsed),
        isEmpty: Object.keys(parsed).length === 0,
      };
    } catch {
      return {};
    }
  }

  /**
   * Parse XML content
   */
  private parseXml(content: string): string {
    // Simple XML formatting
    const formatted = content
      .replace(/></g, '>\n<')
      .replace(/^</, '\n<');

    return formatted.trim();
  }

  /**
   * Parse HTML content
   */
  private parseHtml(content: string): string {
    // Remove scripts and styles
    let text = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n\s*\n/g, '\n');

    return text.trim();
  }

  /**
   * Check if file type is supported
   */
  isSupportedType(ext: string): boolean {
    return this.supportedTypes.includes(ext.toLowerCase());
  }

  /**
   * Get list of supported types
   */
  getSupportedTypes(): string[] {
    return [...this.supportedTypes];
  }

  /**
   * Extract text summary from document
   */
  extractSummary(content: string, maxLength: number = 500): string {
    const lines = content.split('\n');
    const summary: string[] = [];
    let currentLength = 0;

    for (const line of lines) {
      if (currentLength + line.length > maxLength) {
        break;
      }
      if (line.trim()) {
        summary.push(line);
        currentLength += line.length;
      }
    }

    return summary.join('\n');
  }

  /**
   * Extract key information from document
   */
  extractKeyInfo(content: string): {
    headings: string[];
    codeBlocks: string[];
    links: string[];
    emails: string[];
  } {
    return {
      headings: this.extractHeadings(content),
      codeBlocks: this.extractCodeBlocks(content),
      links: this.extractLinks(content),
      emails: this.extractEmails(content),
    };
  }

  /**
   * Extract headings from content
   */
  private extractHeadings(content: string): string[] {
    const headings: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^#{1,6}\s+/)) { // Markdown headings
        headings.push(line.replace(/^#+\s+/, '').trim());
      }
    }

    return headings.slice(0, 20); // Limit to 20 headings
  }

  /**
   * Extract code blocks from content
   */
  private extractCodeBlocks(content: string): string[] {
    const blocks: string[] = [];
    const pattern = /```[\s\S]*?```/g;
    let match;

    while ((match = pattern.exec(content))) {
      blocks.push(match[0]);
    }

    return blocks.slice(0, 10); // Limit to 10 blocks
  }

  /**
   * Extract links from content
   */
  private extractLinks(content: string): string[] {
    const links: string[] = [];
    const pattern = /https?:\/\/[^\s)]+/g;
    let match;

    while ((match = pattern.exec(content))) {
      links.push(match[0]);
    }

    return Array.from(new Set(links)).slice(0, 50); // Unique, limit to 50
  }

  /**
   * Extract emails from content
   */
  private extractEmails(content: string): string[] {
    const emails: string[] = [];
    const pattern = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    let match;

    while ((match = pattern.exec(content))) {
      emails.push(match[0]);
    }

    return Array.from(new Set(emails)).slice(0, 20); // Unique, limit to 20
  }
}
