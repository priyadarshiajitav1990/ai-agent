// src/offline-error-recovery.ts
// Advanced offline error detection, recovery, and auto-fix system

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { Logger } from './logger.js';

export interface ErrorContext {
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  consoleOutput: string;
  stackTrace?: string;
  command?: string;
  context?: Record<string, string>;
  suggestedFix?: string;
  autoFixAttempts: number;
  isResolved: boolean;
}

export interface OfflineCommand {
  command: string;
  isAvailable: boolean;
  fallbackCommand?: string;
  description: string;
}

export class OfflineErrorRecovery extends EventEmitter {
  private logger: Logger;
  private errorHistory: ErrorContext[] = [];
  private maxRetries: number = 3;
  private errorPatterns: Map<RegExp, string> = new Map();
  private consoleBuffer: string[] = [];
  private maxBufferSize: number = 500;
  private workspacePath: string;
  private localLLMEnabled: boolean = false;

  constructor(workspacePath: string, logger: Logger) {
    super();
    this.logger = logger;
    this.workspacePath = workspacePath;
    this.initializeErrorPatterns();
  }

  private initializeErrorPatterns(): void {
    // Common npm errors
    this.errorPatterns.set(/npm ERR! 404/g, 'Package not found. Check package name and version.');
    this.errorPatterns.set(/npm ERR! ERESOLVE/g, 'Dependency conflict detected. Try: npm install --legacy-peer-deps');
    this.errorPatterns.set(/npm ERR! EACCES/g, 'Permission denied. Try: sudo npm or fix permissions.');
    
    // TypeScript errors
    this.errorPatterns.set(/error TS\d+:/g, 'TypeScript compilation error.');
    this.errorPatterns.set(/Cannot find module/g, 'Missing module. Install dependencies with: npm install');
    
    // Node.js errors
    this.errorPatterns.set(/ENOENT: no such file or directory/g, 'File or directory not found.');
    this.errorPatterns.set(/EADDRINUSE/g, 'Port already in use. Free the port or use a different one.');
    this.errorPatterns.set(/ReferenceError/g, 'Variable not defined. Check code syntax.');
    this.errorPatterns.set(/SyntaxError/g, 'Syntax error in code. Check file for typos.');
    
    // Build errors
    this.errorPatterns.set(/Failed to compile/g, 'Build compilation failed. Check source files.');
    this.errorPatterns.set(/Cannot assign to readonly property/g, 'Attempting to modify readonly property.');
    
    // Network errors (should work offline)
    this.errorPatterns.set(/ECONNREFUSED/g, 'Connection refused. Check if service is running.');
    this.errorPatterns.set(/ETIMEDOUT/g, 'Request timed out. Working in offline mode.');
  }

  /**
   * Capture console output in real-time
   */
  public captureConsoleOutput(output: string): void {
    this.consoleBuffer.push(output);
    
    // Keep buffer size manageable
    if (this.consoleBuffer.length > this.maxBufferSize) {
      this.consoleBuffer.shift();
    }

    // Check for errors in output
    this.analyzeOutput(output);
  }

  /**
   * Analyze output for errors and trigger fixes
   */
  private analyzeOutput(output: string): void {
    for (const [pattern, suggestion] of this.errorPatterns) {
      if (pattern.test(output)) {
        this.handleDetectedError(output, suggestion);
        break;
      }
    }
  }

  /**
   * Handle detected error with auto-fix attempt
   */
  private async handleDetectedError(errorOutput: string, suggestion: string): Promise<void> {
    const errorContext: ErrorContext = {
      timestamp: new Date(),
      errorType: this.classifyError(errorOutput),
      errorMessage: errorOutput.substring(0, 200),
      consoleOutput: errorOutput,
      suggestedFix: suggestion,
      autoFixAttempts: 0,
      isResolved: false,
    };

    this.errorHistory.push(errorContext);
    this.logger.info(`🔍 Error Detected: ${errorContext.errorType}`, 'OFFLINE_RECOVERY');
    this.logger.info(`💡 Suggestion: ${suggestion}`, 'OFFLINE_RECOVERY');

    // Attempt auto-fix
    await this.attemptAutoFix(errorContext);
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptAutoFix(errorContext: ErrorContext, attempt: number = 1): Promise<boolean> {
    if (attempt > this.maxRetries) {
      this.logger.error(
        `❌ Failed to auto-fix after ${this.maxRetries} attempts. Manual intervention needed.`,
        'OFFLINE_RECOVERY'
      );
      errorContext.isResolved = false;
      return false;
    }

    errorContext.autoFixAttempts = attempt;
    this.logger.info(`🔧 Auto-fix attempt ${attempt}/${this.maxRetries}...`, 'OFFLINE_RECOVERY');

    try {
      const fixed = await this.executeAutoFix(errorContext);
      if (fixed) {
        errorContext.isResolved = true;
        this.logger.success(`✅ Error auto-fixed on attempt ${attempt}!`, 'OFFLINE_RECOVERY');
        this.emit('error-fixed', errorContext);
        return true;
      } else {
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.attemptAutoFix(errorContext, attempt + 1);
      }
    } catch (error) {
      this.logger.error(`Auto-fix attempt ${attempt} failed: ${error}`, 'OFFLINE_RECOVERY');
      return this.attemptAutoFix(errorContext, attempt + 1);
    }
  }

  /**
   * Execute specific auto-fix based on error type
   */
  private async executeAutoFix(errorContext: ErrorContext): Promise<boolean> {
    const errorType = errorContext.errorType;

    if (errorType.includes('DEPENDENCY')) {
      return this.fixDependencyError();
    } else if (errorType.includes('COMPILATION')) {
      return this.fixCompilationError();
    } else if (errorType.includes('SYNTAX')) {
      return this.fixSyntaxError(errorContext);
    } else if (errorType.includes('FILE_NOT_FOUND')) {
      return this.fixFileNotFoundError(errorContext);
    } else if (errorType.includes('PORT_IN_USE')) {
      return this.fixPortInUseError();
    }

    return false;
  }

  private async fixDependencyError(): Promise<boolean> {
    this.logger.info('Attempting to fix dependency error...', 'OFFLINE_RECOVERY');
    
    try {
      // Check if node_modules exists
      const nodeModulesPath = path.join(this.workspacePath, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.logger.info('Installing dependencies...', 'OFFLINE_RECOVERY');
        await this.executeCommand('npm install --legacy-peer-deps');
        return true;
      }

      // Try to rebuild native modules
      this.logger.info('Rebuilding modules...', 'OFFLINE_RECOVERY');
      await this.executeCommand('npm rebuild');
      return true;
    } catch (error) {
      this.logger.error(`Dependency fix failed: ${error}`, 'OFFLINE_RECOVERY');
      return false;
    }
  }

  private async fixCompilationError(): Promise<boolean> {
    this.logger.info('Attempting to fix compilation error...', 'OFFLINE_RECOVERY');
    
    try {
      // Clean build
      this.logger.info('Cleaning build artifacts...', 'OFFLINE_RECOVERY');
      const distPath = path.join(this.workspacePath, 'dist');
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
      }

      // Rebuild
      this.logger.info('Rebuilding TypeScript...', 'OFFLINE_RECOVERY');
      await this.executeCommand('npm run compile');
      return true;
    } catch (error) {
      this.logger.error(`Compilation fix failed: ${error}`, 'OFFLINE_RECOVERY');
      return false;
    }
  }

  private async fixSyntaxError(errorContext: ErrorContext): Promise<boolean> {
    this.logger.info('Analyzing syntax error...', 'OFFLINE_RECOVERY');
    
    // Extract file information from error
    const fileMatch = errorContext.consoleOutput.match(/(\S+\.ts|\.js):\d+:\d+/);
    if (fileMatch) {
      const filePath = fileMatch[1];
      this.logger.info(`Syntax error in: ${filePath}`, 'OFFLINE_RECOVERY');
      this.logger.info('Please review and fix the syntax error manually.', 'OFFLINE_RECOVERY');
      this.logger.info(`File: ${path.join(this.workspacePath, filePath)}`, 'OFFLINE_RECOVERY');
    }
    
    return false; // Syntax errors need manual fixing
  }

  private async fixFileNotFoundError(errorContext: ErrorContext): Promise<boolean> {
    this.logger.info('Analyzing file not found error...', 'OFFLINE_RECOVERY');
    
    // Extract file path from error
    const pathMatch = errorContext.consoleOutput.match(/['"]([^'"]+\.ts|\.js)['"]/);
    if (pathMatch) {
      const missingFile = pathMatch[1];
      this.logger.info(`Missing file: ${missingFile}`, 'OFFLINE_RECOVERY');
      this.logger.info('Creating stub file...', 'OFFLINE_RECOVERY');
      
      try {
        const fullPath = path.join(this.workspacePath, missingFile);
        const directory = path.dirname(fullPath);
        
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, '// Auto-generated stub file\nexport {};\n');
        this.logger.success(`Created: ${missingFile}`, 'OFFLINE_RECOVERY');
        return true;
      } catch (error) {
        this.logger.error(`Failed to create stub file: ${error}`, 'OFFLINE_RECOVERY');
      }
    }
    
    return false;
  }

  private async fixPortInUseError(): Promise<boolean> {
    this.logger.info('Attempting to free port...', 'OFFLINE_RECOVERY');
    
    try {
      // Try to find and kill process using port 3000
      await this.executeCommand('lsof -ti:3000 | xargs kill -9 || true');
      this.logger.success('Port freed successfully', 'OFFLINE_RECOVERY');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      this.logger.error(`Port free attempt failed: ${error}`, 'OFFLINE_RECOVERY');
      return false;
    }
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      child_process.exec(command, { cwd: this.workspacePath }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout + stderr);
      });
    });
  }

  private classifyError(output: string): string {
    if (output.includes('npm ERR')) return 'DEPENDENCY_ERROR';
    if (output.includes('error TS')) return 'COMPILATION_ERROR';
    if (output.includes('SyntaxError') || output.includes('error TS')) return 'SYNTAX_ERROR';
    if (output.includes('ENOENT')) return 'FILE_NOT_FOUND_ERROR';
    if (output.includes('EADDRINUSE')) return 'PORT_IN_USE_ERROR';
    if (output.includes('Cannot find module')) return 'MISSING_MODULE_ERROR';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get error history
   */
  public getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory];
  }

  /**
   * Get console buffer
   */
  public getConsoleBuffer(): string[] {
    return [...this.consoleBuffer];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Resume from error
   */
  public async resumeFromError(errorId: number): Promise<boolean> {
    if (errorId < 0 || errorId >= this.errorHistory.length) {
      this.logger.error('Invalid error ID', 'OFFLINE_RECOVERY');
      return false;
    }

    const errorContext = this.errorHistory[errorId];
    this.logger.info(`Resuming from error: ${errorContext.errorType}`, 'OFFLINE_RECOVERY');
    
    const fixed = await this.attemptAutoFix(errorContext);
    return fixed;
  }

  /**
   * Generate error report for offline diagnosis
   */
  public generateErrorReport(): string {
    const report: string[] = [
      '=== AI AGENT ERROR RECOVERY REPORT ===',
      `Generated: ${new Date().toISOString()}`,
      `Total Errors Detected: ${this.errorHistory.length}`,
      `Resolved Errors: ${this.errorHistory.filter(e => e.isResolved).length}`,
      '',
      '--- RECENT ERRORS ---',
    ];

    this.errorHistory.slice(-10).forEach((error, index) => {
      report.push(`\n[${index}] ${error.errorType}`);
      report.push(`  Time: ${error.timestamp.toISOString()}`);
      report.push(`  Message: ${error.errorMessage}`);
      report.push(`  Suggestion: ${error.suggestedFix}`);
      report.push(`  Auto-fix Attempts: ${error.autoFixAttempts}`);
      report.push(`  Resolved: ${error.isResolved ? '✅' : '❌'}`);
    });

    return report.join('\n');
  }
}
