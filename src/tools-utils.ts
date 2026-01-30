/**
 * tools-utils.ts - Shared utilities for all tool modules
 * Provides common functionality for validation, error handling, and performance monitoring
 */

import { Logger } from './logger.js';

/**
 * Decorator to validate required parameters before execution
 */
export function ValidateParams(...requiredParams: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const missingParams = requiredParams.filter(
        (param) => !this[param] || (typeof this[param] === 'string' && !this[param].trim())
      );
      if (missingParams.length > 0) {
        throw new Error(
          `Missing required parameters: ${missingParams.join(', ')}`
        );
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

/**
 * Decorator to measure execution time and log performance
 */
export function Measure(logLevel: 'debug' | 'info' = 'debug') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const logger = this.logger as Logger;
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        logger[logLevel](
          `${propertyKey} completed in ${duration.toFixed(2)}ms`
        );
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logger.error(
          `${propertyKey} failed after ${duration.toFixed(2)}ms: ${error}`
        );
        throw error;
      }
    };
    return descriptor;
  };
}

/**
 * Decorator for automatic retry logic with exponential backoff
 */
export function Retry(
  maxRetries: number = 3,
  delayMs: number = 100,
  backoffMultiplier: number = 2
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const logger = this.logger as Logger;
      let lastError: Error | null = null;
      let delay = delayMs;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxRetries) {
            logger.warn(
              `${propertyKey} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${lastError.message}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= backoffMultiplier;
          }
        }
      }
      throw new Error(
        `${propertyKey} failed after ${maxRetries} retries: ${lastError?.message}`
      );
    };
    return descriptor;
  };
}

/**
 * Result wrapper for consistent error handling
 */
export class ToolResult<T> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: Error,
    public readonly metadata?: Record<string, any>
  ) {}

  static ok<T>(data: T, metadata?: Record<string, any>): ToolResult<T> {
    return new ToolResult(true, data, undefined, metadata);
  }

  static err<T>(error: Error | string, metadata?: Record<string, any>): ToolResult<T> {
    const err = typeof error === 'string' ? new Error(error) : error;
    return new ToolResult(false, undefined, err, metadata);
  }

  isSuccess(): boolean {
    return this.success;
  }

  unwrap(): T {
    if (!this.success) {
      throw this.error || new Error('Unknown error');
    }
    return this.data as T;
  }

  unwrapOr(defaultValue: T): T {
    return this.success ? (this.data as T) : defaultValue;
  }
}

/**
 * Path validation utilities
 */
export class PathValidator {
  /**
   * Check if path is safe (not attempting directory traversal)
   */
  static isSafePath(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    const traversalPatterns = [
      '/../',
      '/.',
      '\\..',
      '~/',
      /[<>:"|?*]/,
    ];

    for (const pattern of traversalPatterns) {
      if (typeof pattern === 'string') {
        if (normalized.includes(pattern)) return false;
      } else {
        if (pattern.test(normalized)) return false;
      }
    }
    return true;
  }

  /**
   * Validate file extension against whitelist
   */
  static isAllowedExtension(
    filePath: string,
    allowedExtensions: string[]
  ): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
  }

  /**
   * Check path is within allowed directory
   */
  static isWithinDirectory(filePath: string, baseDir: string): boolean {
    const path = require('path');
    const normalized = path.resolve(filePath);
    const base = path.resolve(baseDir);
    return normalized.startsWith(base);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Record metric timing
   */
  recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const data = this.metrics.get(name);
    if (!data || data.length === 0) return null;

    return {
      count: data.length,
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      min: Math.min(...data),
      max: Math.max(...data),
    };
  }

  /**
   * Log all metric statistics
   */
  logAllMetrics(): void {
    for (const [name, data] of this.metrics.entries()) {
      if (data.length > 0) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);
        this.logger.info(
          `Metric [${name}]: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms, samples=${data.length}`
        );
      }
    }
  }
}

/**
 * Batch operation utilities for improved throughput
 */
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private processing = false;
  private logger: Logger;

  constructor(
    private batchSize: number,
    private processor: (items: T[]) => Promise<R[]>,
    logger: Logger
  ) {
    this.logger = logger;
  }

  /**
   * Add item to batch queue
   */
  async add(item: T): Promise<void> {
    this.queue.push(item);
    if (this.queue.length >= this.batchSize && !this.processing) {
      await this.flush();
    }
  }

  /**
   * Process all queued items
   */
  async flush(): Promise<R[]> {
    if (this.queue.length === 0) return [];

    this.processing = true;
    try {
      const batch = this.queue.splice(0, this.batchSize);
      this.logger.debug(`Processing batch of ${batch.length} items`);
      return await this.processor(batch);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        await this.flush();
      }
    }
  }
}

/**
 * Cache with TTL support
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }> = new Map();
  private logger: Logger;

  constructor(private ttlMs: number, logger: Logger) {
    this.logger = logger;
  }

  /**
   * Set cache entry with TTL
   */
  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  /**
   * Get cache entry, returning null if expired
   */
  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`TTLCache: removed ${removed} expired entries`);
    }
  }
}

/**
 * Utility to convert AsyncGenerator to Promise array
 */
export async function consumeAsyncGenerator<T>(
  gen: AsyncGenerator<T>
): Promise<T[]> {
  const result: T[] = [];
  for await (const item of gen) {
    result.push(item);
  }
  return result;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string,
  defaultValue: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return defaultValue;
  }
}
