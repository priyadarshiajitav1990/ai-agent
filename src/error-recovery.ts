// src/error-recovery.ts
import { Logger } from './logger.js';

export interface RecoveryStrategy {
  name: string;
  description: string;
  action: () => Promise<boolean>;
}

export interface ErrorContext {
  messageId: string;
  userInput: string;
  error: string;
  errorCode?: string;
  timestamp: number;
  retryCount: number;
  lastRetryTime?: number;
}

export class ErrorRecoveryManager {
  private logger: Logger;
  private errorHistory: Map<string, ErrorContext> = new Map();
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Record an error occurrence
   */
  recordError(context: ErrorContext): void {
    this.errorHistory.set(context.messageId, context);
    this.logger.error(`Error recorded: ${context.errorCode || 'UNKNOWN'} - ${context.error}`);
  }

  /**
   * Check if an error can be retried
   */
  canRetry(messageId: string): boolean {
    const context = this.errorHistory.get(messageId);
    if (!context) {
      return true; // First attempt
    }

    const canRetry = context.retryCount < this.maxRetries;
    this.logger.debug(
      `Retry check for ${messageId}: ${canRetry} (${context.retryCount}/${this.maxRetries})`
    );
    return canRetry;
  }

  /**
   * Get retry count for a message
   */
  getRetryCount(messageId: string): number {
    const context = this.errorHistory.get(messageId);
    return context ? context.retryCount : 0;
  }

  /**
   * Increment retry count
   */
  incrementRetry(messageId: string): void {
    const context = this.errorHistory.get(messageId);
    if (context) {
      context.retryCount++;
      context.lastRetryTime = Date.now();
    }
  }

  /**
   * Wait before retry with exponential backoff
   */
  async waitForRetry(retryCount: number): Promise<void> {
    const delay = this.retryDelayMs * Math.pow(2, Math.max(0, retryCount - 1));
    this.logger.info(`Waiting ${delay}ms before retry ${retryCount}...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Get suggested recovery strategies for an error
   */
  getSuggestedStrategies(error: string, errorCode?: string): string[] {
    const strategies: string[] = [];

    // Network errors
    if (
      errorCode?.includes('NETWORK') ||
      error.toLowerCase().includes('network') ||
      error.toLowerCase().includes('econnrefused') ||
      error.toLowerCase().includes('timeout')
    ) {
      strategies.push('Check your internet connection');
      strategies.push('Verify the API endpoint is accessible');
      strategies.push('Try again with slower network connection');
      strategies.push('Check firewall/proxy settings');
    }

    // Authentication errors
    if (
      errorCode?.includes('AUTH') ||
      error.toLowerCase().includes('unauthorized') ||
      error.toLowerCase().includes('forbidden') ||
      error.toLowerCase().includes('credential')
    ) {
      strategies.push('Re-authenticate with your account');
      strategies.push('Check if credentials are expired');
      strategies.push('Verify account has required permissions');
      strategies.push('Try switching to a different account');
    }

    // Rate limit errors
    if (
      errorCode?.includes('RATE_LIMIT') ||
      error.toLowerCase().includes('rate limit') ||
      error.toLowerCase().includes('quota')
    ) {
      strategies.push('Wait a few minutes and try again');
      strategies.push('Use a shorter query or smaller batch size');
      strategies.push('Check your API usage limits');
      strategies.push('Consider upgrading your plan');
    }

    // Invalid request errors
    if (
      errorCode?.includes('INVALID') ||
      error.toLowerCase().includes('invalid') ||
      error.toLowerCase().includes('bad request')
    ) {
      strategies.push('Check the format of your input');
      strategies.push('Verify all required parameters are provided');
      strategies.push('Check for special characters that need escaping');
      strategies.push('Try a simpler version of your request');
    }

    // File/Path errors
    if (
      errorCode?.includes('FILE') ||
      error.toLowerCase().includes('no such file') ||
      error.toLowerCase().includes('permission denied')
    ) {
      strategies.push('Verify the file path exists');
      strategies.push('Check file permissions');
      strategies.push('Try with absolute path instead of relative');
      strategies.push('Ensure you have read/write access to the directory');
    }

    // Generic strategies
    strategies.push('Clear conversation history and start fresh');
    strategies.push('Try rephrasing your request differently');
    strategies.push('Check the documentation for similar examples');

    return Array.from(new Set(strategies)); // Remove duplicates
  }

  /**
   * Parse error to extract error code and type
   */
  parseError(error: unknown): { message: string; code?: string; type: string } {
    if (error instanceof Error) {
      const message = error.message;
      let code: string | undefined;
      let type = 'UNKNOWN';

      // Extract error code from message or name
      if (error.name.includes('Timeout')) type = 'TIMEOUT_ERROR';
      if (error.name.includes('Network')) type = 'NETWORK_ERROR';
      if (message.includes('401') || message.includes('Unauthorized')) type = 'AUTH_ERROR';
      if (message.includes('403') || message.includes('Forbidden')) type = 'AUTH_ERROR';
      if (message.includes('429') || message.includes('rate limit')) type = 'RATE_LIMIT_ERROR';
      if (message.includes('400') || message.includes('Bad Request')) type = 'INVALID_REQUEST_ERROR';
      if (message.includes('ENOENT') || message.includes('no such file')) type = 'FILE_NOT_FOUND';
      if (message.includes('EACCES') || message.includes('Permission denied')) type = 'PERMISSION_ERROR';

      return { message, code: type, type };
    }

    if (typeof error === 'string') {
      return { message: error, type: 'UNKNOWN' };
    }

    return { message: 'An unknown error occurred', type: 'UNKNOWN' };
  }

  /**
   * Get recovery action based on error type
   */
  getRecoveryAction(errorType: string): string {
    const actions: Record<string, string> = {
      NETWORK_ERROR: 'Check your internet connection and try again',
      TIMEOUT_ERROR: 'The request timed out. Try a simpler query',
      AUTH_ERROR: 'Please re-authenticate by selecting your account from the menu',
      RATE_LIMIT_ERROR: 'API rate limit reached. Please wait a moment and try again',
      INVALID_REQUEST_ERROR: 'The request format is invalid. Please check your input',
      FILE_NOT_FOUND: 'The specified file or directory does not exist',
      PERMISSION_ERROR: 'You do not have permission to access this resource',
      UNKNOWN: 'An unknown error occurred. Please try again',
    };

    return actions[errorType] || actions.UNKNOWN;
  }

  /**
   * Clear error history for a message
   */
  clearErrorHistory(messageId: string): void {
    this.errorHistory.delete(messageId);
  }

  /**
   * Clear all error history
   */
  clearAllErrorHistory(): void {
    this.errorHistory.clear();
    this.logger.info('Cleared all error history');
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorContext[] {
    return Array.from(this.errorHistory.values());
  }

  /**
   * Get errors that exceeded max retries
   */
  getUnrecoverableErrors(): ErrorContext[] {
    return Array.from(this.errorHistory.values()).filter(
      (ctx) => ctx.retryCount >= this.maxRetries
    );
  }

  /**
   * Check if error is potentially recoverable
   */
  isRecoverable(errorType: string): boolean {
    const recoverableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR',
      'FILE_NOT_FOUND',
    ];
    return recoverableErrors.includes(errorType);
  }

  /**
   * Generate detailed error report
   */
  generateErrorReport(): string {
    const errors = this.getErrorHistory();
    if (errors.length === 0) {
      return 'No errors recorded';
    }

    const lines: string[] = [];
    lines.push('=== Error Report ===\n');

    for (const error of errors) {
      lines.push(`Message ID: ${error.messageId}`);
      lines.push(`Error: ${error.error}`);
      if (error.errorCode) lines.push(`Code: ${error.errorCode}`);
      lines.push(`Timestamp: ${new Date(error.timestamp).toLocaleString()}`);
      lines.push(`Retries: ${error.retryCount}`);
      if (error.lastRetryTime) {
        lines.push(`Last Retry: ${new Date(error.lastRetryTime).toLocaleString()}`);
      }
      lines.push('---');
    }

    return lines.join('\n');
  }

  /**
   * Set maximum retry attempts
   */
  setMaxRetries(max: number): void {
    this.maxRetries = Math.max(1, max);
    this.logger.info(`Max retries set to ${this.maxRetries}`);
  }

  /**
   * Set retry delay in milliseconds
   */
  setRetryDelay(delayMs: number): void {
    this.retryDelayMs = Math.max(100, delayMs);
    this.logger.info(`Retry delay set to ${this.retryDelayMs}ms`);
  }
}
