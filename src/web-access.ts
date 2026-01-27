// src/web-access.ts
import { Logger } from './logger.js';

export interface WebContent {
  url: string;
  title?: string;
  content: string;
  statusCode: number;
  contentType?: string;
  headers?: Record<string, string>;
  timestamp: number;
}

export interface ParsedWebContent {
  url: string;
  title?: string;
  text: string;
  links: string[];
  images: string[];
  meta?: Record<string, string>;
}

export class WebAccessModule {
  private logger: Logger;
  private cache: Map<string, WebContent> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Fetch website content
   */
  async fetchWebsite(url: string, useCache: boolean = true): Promise<WebContent | null> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        this.logger.error(`Invalid URL: ${url}`);
        return null;
      }

      // Check cache
      if (useCache && this.cache.has(url)) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          this.logger.info(`Using cached content for ${url}`);
          return cached;
        }
      }

      this.logger.info(`Fetching ${url}`);

      // Dynamic import to handle both Node.js environments
      let fetch: any;
      try {
        fetch = (await import('node-fetch')).default;
      } catch {
        // Fallback to built-in fetch if available
        fetch = (global as any).fetch;
      }

      if (!fetch) {
        this.logger.error('fetch not available');
        return null;
      }

      const response = await Promise.race([
        fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 10000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        ),
      ]);

      if (!response.ok) {
        this.logger.warn(`HTTP ${response.status} for ${url}`);
        return null;
      }

      const content = await response.text();

      const webContent: WebContent = {
        url,
        title: this.extractTitle(content),
        content,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || undefined,
        headers: this.getHeaders(response.headers),
        timestamp: Date.now(),
      };

      // Cache the result
      this.cache.set(url, webContent);

      return webContent;
    } catch (error) {
      this.logger.error(`Failed to fetch ${url}: ${error}`);
      return null;
    }
  }

  /**
   * Parse HTML content to extract meaningful text
   */
  parseHtmlContent(html: string, url?: string): ParsedWebContent {
    const title = this.extractTitle(html);
    const text = this.extractMainText(html);
    const links = this.extractLinks(html, url);
    const images = this.extractImages(html, url);
    const meta = this.extractMetaTags(html);

    return {
      url: url || '',
      title,
      text,
      links,
      images,
      meta,
    };
  }

  /**
   * Get search results from a search query
   */
  async searchWeb(query: string, maxResults: number = 5): Promise<Array<{ title: string; url: string; snippet: string }>> {
    try {
      // Note: This would typically use a search API like Google Custom Search, Bing, or similar
      // For now, return an empty array as a placeholder
      this.logger.info(`Search query: ${query}`);

      // In production, you would:
      // 1. Use a search API like Google Custom Search
      // 2. Parse the results
      // 3. Return structured data

      return [];
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      return [];
    }
  }

  /**
   * Extract main text from HTML
   */
  private extractMainText(html: string): string {
    // Remove script and style tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length
    if (text.length > 10000) {
      text = text.substring(0, 10000) + '...';
    }

    return text;
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string | undefined {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }

    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    if (ogTitleMatch) {
      return ogTitleMatch[1];
    }

    return undefined;
  }

  /**
   * Extract all links from HTML
   */
  private extractLinks(html: string, baseUrl?: string): string[] {
    const links: Set<string> = new Set();
    const linkPattern = /href=["']([^"']*?)["']/gi;
    let match;

    while ((match = linkPattern.exec(html))) {
      let url = match[1];

      // Skip fragments, javascript, and mailto
      if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
        continue;
      }

      // Convert relative URLs to absolute
      if (baseUrl && !url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          url = new URL(url, base).href;
        } catch {
          continue;
        }
      }

      if (url.startsWith('http')) {
        links.add(url);
      }
    }

    return Array.from(links).slice(0, 50); // Limit to 50 links
  }

  /**
   * Extract images from HTML
   */
  private extractImages(html: string, baseUrl?: string): string[] {
    const images: Set<string> = new Set();
    const imgPattern = /src=["']([^"']*?)["']/gi;
    let match;

    while ((match = imgPattern.exec(html))) {
      let url = match[1];

      // Skip data URLs and javascript
      if (url.startsWith('data:') || url.startsWith('javascript:')) {
        continue;
      }

      // Convert relative URLs to absolute
      if (baseUrl && !url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          url = new URL(url, base).href;
        } catch {
          continue;
        }
      }

      if (url.startsWith('http')) {
        images.add(url);
      }
    }

    return Array.from(images).slice(0, 20); // Limit to 20 images
  }

  /**
   * Extract meta tags from HTML
   */
  private extractMetaTags(html: string): Record<string, string> {
    const meta: Record<string, string> = {};

    // Extract description
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (descMatch) {
      meta.description = descMatch[1];
    }

    // Extract keywords
    const keywordsMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/i);
    if (keywordsMatch) {
      meta.keywords = keywordsMatch[1];
    }

    // Extract author
    const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]*)"/i);
    if (authorMatch) {
      meta.author = authorMatch[1];
    }

    // Extract OG tags
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    if (ogDescMatch) {
      meta['og:description'] = ogDescMatch[1];
    }

    return meta;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Extract headers from response
   */
  private getHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    if (headers.entries) {
      for (const [key, value] of headers.entries()) {
        result[key.toLowerCase()] = String(value);
      }
    }
    return result;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Web cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).reduce((sum, item) => sum + item.content.length, 0),
    };
  }
}
