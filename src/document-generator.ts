// src/document-generator.ts
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

export interface DocumentMetadata {
  title: string;
  author?: string;
  created: number;
  modified: number;
  version?: string;
  tags?: string[];
}

export interface GeneratedDocument {
  fileName: string;
  format: string;
  content: string;
  metadata: DocumentMetadata;
  size: number;
  downloadPath?: string;
}

export interface DocumentTemplate {
  name: string;
  format: string;
  template: string;
  description?: string;
}

export class DocumentGenerator {
  private logger: Logger;
  private documentTemplates: Map<string, DocumentTemplate> = new Map();
  private tempDirectory: string;

  private readonly SUPPORTED_FORMATS = ['md', 'html', 'json', 'csv', 'xml', 'txt', 'yaml'];

  constructor(logLevel: string = 'info', tempDir?: string) {
    this.logger = new Logger(logLevel);
    this.tempDirectory = tempDir || path.join(process.cwd(), '.generated-docs');
    this.ensureTempDirectory();
    this.initializeTemplates();
  }

  /**
   * Ensure temp directory exists
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
      this.logger.info(`Created temp directory: ${this.tempDirectory}`);
    }
  }

  /**
   * Initialize document templates
   */
  private initializeTemplates(): void {
    // Markdown templates
    this.documentTemplates.set('readme-md', {
      name: 'README',
      format: 'md',
      template: `# ${'{projectName}'}

${'{description}'}

## Features

${'{features}'}

## Installation

\`\`\`bash
${'{installCommand}'}
\`\`\`

## Usage

${'{usageExample}'}

## License

${'{license}'}
`,
      description: 'README.md template',
    });

    // Report template
    this.documentTemplates.set('report-md', {
      name: 'Report',
      format: 'md',
      template: `# ${'{reportTitle}'}

**Date:** ${'{date}'}  
**Author:** ${'{author}'}

## Executive Summary

${'{summary}'}

## Findings

${'{findings}'}

## Recommendations

${'{recommendations}'}

## Conclusion

${'{conclusion}'}
`,
      description: 'Report template',
    });

    // HTML templates
    this.documentTemplates.set('page-html', {
      name: 'HTML Page',
      format: 'html',
      template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${'{pageTitle}'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        h2 { color: #666; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${'{pageTitle}'}</h1>
        ${'{content}'}
    </div>
</body>
</html>
`,
      description: 'HTML page template',
    });

    // CSV template
    this.documentTemplates.set('data-csv', {
      name: 'Data Table',
      format: 'csv',
      template: `${'{header}'}
${'{rows}'}`,
      description: 'CSV data table template',
    });

    // JSON template
    this.documentTemplates.set('data-json', {
      name: 'Data Object',
      format: 'json',
      template: `{
  "title": "${'{title}'}",
  "description": "${'{description}'}",
  "data": ${'{data}'},
  "metadata": {
    "created": "${'{created}'}",
    "version": "${'{version}'}"
  }
}`,
      description: 'JSON data template',
    });

    // XML template
    this.documentTemplates.set('data-xml', {
      name: 'XML Document',
      format: 'xml',
      template: `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <title>${'{title}'}</title>
    <description>${'{description}'}</description>
    <data>
        ${'{content}'}
    </data>
    <metadata>
        <created>${'{created}'}</created>
        <version>${'{version}'}</version>
    </metadata>
</root>`,
      description: 'XML document template',
    });

    // Text template
    this.documentTemplates.set('note-txt', {
      name: 'Text Note',
      format: 'txt',
      template: `${'{title}'}
${'='.repeat(50)}

${'{content}'}

---
Created: ${'{created}'}
Author: ${'{author}'}
`,
      description: 'Plain text note template',
    });
  }

  /**
   * Generate document from template
   */
  generateFromTemplate(
    templateName: string,
    docTitle: string,
    parameters: Record<string, string>,
    author?: string
  ): GeneratedDocument {
    const template = this.documentTemplates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Replace parameters in template
    let content = template.template;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{${key}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value || placeholder);
    }

    return this.createDocument(docTitle, template.format, content, author);
  }

  /**
   * Create document from content
   */
  createDocument(
    title: string,
    format: string,
    content: string,
    author?: string,
    tags?: string[]
  ): GeneratedDocument {
    if (!this.SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const now = Date.now();
    const metadata: DocumentMetadata = {
      title,
      author: author || 'AI Agent',
      created: now,
      modified: now,
      version: '1.0',
      tags,
    };

    return {
      fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.${format}`,
      format,
      content,
      metadata,
      size: Buffer.byteLength(content, 'utf8'),
    };
  }

  /**
   * Save document to file
   */
  async saveDocument(document: GeneratedDocument, outputPath?: string): Promise<string> {
    try {
      const filePath = outputPath || path.join(this.tempDirectory, document.fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Add metadata comments to the file
      let fileContent = document.content;
      if (['md', 'txt', 'html'].includes(document.format)) {
        const metadataComment = this.generateMetadataComment(document.metadata);
        fileContent = metadataComment + '\n\n' + fileContent;
      }

      await fs.promises.writeFile(filePath, fileContent, 'utf-8');
      this.logger.info(`Document saved: ${filePath}`);

      return filePath;
    } catch (error: any) {
      this.logger.error(`Failed to save document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate metadata comment based on format
   */
  private generateMetadataComment(metadata: DocumentMetadata): string {
    const date = new Date(metadata.created).toISOString();
    return `<!-- Generated: ${date} | Author: ${metadata.author} | Version: ${metadata.version} -->`;
  }

  /**
   * Convert document between formats
   */
  async convertDocument(document: GeneratedDocument, targetFormat: string): Promise<GeneratedDocument> {
    if (!this.SUPPORTED_FORMATS.includes(targetFormat)) {
      throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    // Simple format conversion logic
    let convertedContent = document.content;

    if (document.format === 'md' && targetFormat === 'html') {
      convertedContent = this.markdownToHtml(document.content);
    } else if (document.format === 'html' && targetFormat === 'md') {
      convertedContent = this.htmlToMarkdown(document.content);
    } else if (document.format === 'json' && targetFormat === 'csv') {
      convertedContent = this.jsonToCsv(document.content);
    }

    return {
      ...document,
      format: targetFormat,
      fileName: `${path.parse(document.fileName).name}.${targetFormat}`,
      content: convertedContent,
    };
  }

  /**
   * Simple markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return `<html><body>${html}</body></html>`;
  }

  /**
   * Simple HTML to Markdown conversion
   */
  private htmlToMarkdown(html: string): string {
    let markdown = html;

    // Remove HTML tags (basic conversion)
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    markdown = markdown.replace(/<[^>]+>/g, '');

    return markdown;
  }

  /**
   * Simple JSON to CSV conversion
   */
  private jsonToCsv(jsonString: string): string {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        return jsonString;
      }

      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const rows = data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
      );

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    } catch (error) {
      return jsonString;
    }
  }

  /**
   * Get download URL for document
   */
  getDownloadUrl(filePath: string): string {
    const fileName = path.basename(filePath);
    return `/download/${encodeURIComponent(fileName)}`;
  }

  /**
   * List available templates
   */
  listTemplates(format?: string): Record<string, DocumentTemplate> {
    const result: Record<string, DocumentTemplate> = {};

    for (const [name, template] of this.documentTemplates.entries()) {
      if (!format || template.format === format) {
        result[name] = template;
      }
    }

    return result;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return this.SUPPORTED_FORMATS;
  }

  /**
   * Add custom template
   */
  addCustomTemplate(name: string, template: DocumentTemplate): void {
    this.documentTemplates.set(name, template);
    this.logger.info(`Added custom template: ${name}`);
  }

  /**
   * List saved documents
   */
  listSavedDocuments(): string[] {
    try {
      const files = fs.readdirSync(this.tempDirectory);
      return files.filter((f) => !f.startsWith('.'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean up old documents (older than days)
   */
  cleanupOldDocuments(daysOld: number = 7): number {
    try {
      const files = fs.readdirSync(this.tempDirectory);
      const now = Date.now();
      const cutoffTime = now - daysOld * 24 * 60 * 60 * 1000;
      let removed = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          removed++;
        }
      }

      if (removed > 0) {
        this.logger.info(`Cleaned up ${removed} old documents`);
      }

      return removed;
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error}`);
      return 0;
    }
  }

  /**
   * Display available templates as formatted text
   */
  displayTemplates(): string {
    const lines: string[] = [];

    lines.push('📄 DOCUMENT TEMPLATES');
    lines.push('═'.repeat(70));

    const grouped = new Map<string, DocumentTemplate[]>();

    for (const [name, template] of this.documentTemplates.entries()) {
      if (!grouped.has(template.format)) {
        grouped.set(template.format, []);
      }
      grouped.get(template.format)!.push(template);
    }

    for (const [format, templates] of grouped.entries()) {
      lines.push(`\n📂 ${format.toUpperCase()} FORMAT`);
      for (const template of templates) {
        lines.push(`  ├─ ${template.name}`);
        if (template.description) {
          lines.push(`  │  ${template.description}`);
        }
      }
    }

    lines.push('\n\n📋 SUPPORTED FORMATS');
    lines.push('═'.repeat(70));
    lines.push(`  ${this.SUPPORTED_FORMATS.join(', ')}`);

    return lines.join('\n');
  }
}
