// src/command-executor.ts
import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import { Logger } from './logger.js';
import { Measure, Retry, PerformanceMonitor, TTLCache } from './tools-utils.js';

const execAsync = promisify(exec);

export interface CommandExecutionOptions {
  timeout?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  shell?: string;
  user?: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export interface SafetyConfig {
  allowedPaths?: string[];
  blockedCommands?: string[];
  timeoutMs?: number;
  maxOutputLength?: number;
  sandboxMode?: boolean;
}

export class CommandExecutor {
  private logger: Logger;
  private safetyConfig: SafetyConfig;
  private commandHistory: CommandResult[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_MAX_OUTPUT = 1024 * 1024; // 1MB

  // Dangerous commands that should be blocked
  private readonly DANGEROUS_COMMANDS = [
    'rm -rf',
    'mkfs',
    'dd if=/dev/zero',
    'shutdown',
    'reboot',
    ':(){:|:&};:',
    'sudo rm',
    'format',
  ];

  // Safe commands to recommend
  private readonly SAFE_COMMANDS = [
    'ls',
    'pwd',
    'echo',
    'cat',
    'grep',
    'find',
    'head',
    'tail',
    'wc',
    'date',
    'curl',
    'wget',
    'npm',
    'git',
    'docker',
  ];

  private performanceMonitor: PerformanceMonitor;
  private commandCache: TTLCache<string, CommandResult>;

  constructor(logLevel: string = 'info', safetyConfig?: SafetyConfig) {
    this.logger = new Logger(logLevel);
    this.performanceMonitor = new PerformanceMonitor(this.logger);
    this.commandCache = new TTLCache(5000, this.logger); // 5 second TTL for cached results
    this.safetyConfig = {
      blockedCommands: this.DANGEROUS_COMMANDS,
      timeoutMs: 30000,
      maxOutputLength: 1024 * 1024,
      sandboxMode: true,
      ...safetyConfig,
    };
  }

  /**
   * Execute shell command safely with automatic retries and monitoring
   */
  @Measure()
  @Retry(2, 100)
  async executeCommand(command: string, options?: CommandExecutionOptions): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = this.commandCache.get(command);
      if (cached) {
        this.logger.debug(`Command served from cache: ${command}`);
        return cached;
      }

      // Safety checks
      this.validateCommand(command);

      const timeout = options?.timeout || this.safetyConfig.timeoutMs || this.DEFAULT_TIMEOUT;
      const cwd = options?.cwd || process.cwd();

      this.logger.info(`Executing command: ${command}`);

      const result = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT,
        shell: options?.shell || this.getShellForOS(),
      });

      const duration = Date.now() - startTime;
      this.performanceMonitor.recordMetric('executeCommand', duration);
      const commandResult: CommandResult = {
        command,
        exitCode: 0,
        stdout: result.stdout.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT),
        stderr: result.stderr?.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT) || '',
        duration,
        timestamp: startTime,
        success: true,
      };

      this.recordCommand(commandResult);
      this.commandCache.set(command, commandResult); // Cache successful results
      return commandResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const commandResult: CommandResult = {
        command,
        exitCode: error.code || 1,
        stdout: error.stdout?.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT) || '',
        stderr: error.stderr?.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT) || error.message,
        duration,
        timestamp: startTime,
        success: false,
      };

      this.recordCommand(commandResult);
      this.logger.error(`Command failed: ${command} - ${error.message}`);

      return commandResult;
    }
  }

  /**
   * Execute command with real-time output streaming
   */
  async executeCommandStream(
    command: string,
    onData: (data: string) => void,
    onError?: (error: string) => void
  ): Promise<CommandResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        this.validateCommand(command);

        this.logger.info(`Executing command (stream): ${command}`);

        const child = exec(command, {
          timeout: this.safetyConfig.timeoutMs || this.DEFAULT_TIMEOUT,
          maxBuffer: this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT,
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          const chunk = data.toString();
          onData(chunk);
          stdout += chunk;
        });

        child.stderr?.on('data', (data) => {
          const chunk = data.toString();
          if (onError) onError(chunk);
          stderr += chunk;
        });

        child.on('close', (code) => {
          const duration = Date.now() - startTime;
          const commandResult: CommandResult = {
            command,
            exitCode: code || 0,
            stdout: stdout.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT),
            stderr: stderr.substring(0, this.safetyConfig.maxOutputLength || this.DEFAULT_MAX_OUTPUT),
            duration,
            timestamp: startTime,
            success: code === 0,
          };

          this.recordCommand(commandResult);
          resolve(commandResult);
        });

        child.on('error', (error) => {
          const duration = Date.now() - startTime;
          const commandResult: CommandResult = {
            command,
            exitCode: 1,
            stdout: '',
            stderr: error.message,
            duration,
            timestamp: startTime,
            success: false,
          };

          this.recordCommand(commandResult);
          resolve(commandResult);
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const commandResult: CommandResult = {
          command,
          exitCode: 1,
          stdout: '',
          stderr: error.message,
          duration,
          timestamp: startTime,
          success: false,
        };

        this.recordCommand(commandResult);
        resolve(commandResult);
      }
    });
  }

  /**
   * Validate command for safety
   */
  private validateCommand(command: string): void {
    if (!command || command.trim().length === 0) {
      throw new Error('Command cannot be empty');
    }

    const commandLower = command.toLowerCase();

    // Check for blocked commands
    if (this.safetyConfig.blockedCommands) {
      for (const blocked of this.safetyConfig.blockedCommands) {
        if (commandLower.includes(blocked.toLowerCase())) {
          throw new Error(`Command blocked for security reasons: ${blocked}`);
        }
      }
    }

    // Additional safety checks
    if (commandLower.includes('eval') || commandLower.includes('exec(')) {
      throw new Error('Dynamic code execution not allowed');
    }

    if (commandLower.includes('$(') && commandLower.includes(')')) {
      throw new Error('Command substitution not allowed in this context');
    }
  }

  /**
   * Get shell for current OS
   */
  private getShellForOS(): string {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'cmd.exe';
      case 'darwin':
      case 'linux':
      default:
        return '/bin/bash';
    }
  }

  /**
   * Record command in history
   */
  private recordCommand(result: CommandResult): void {
    this.commandHistory.push(result);
    if (this.commandHistory.length > this.MAX_HISTORY) {
      this.commandHistory.shift();
    }
  }

  /**
   * Get command history
   */
  getCommandHistory(limit?: number): CommandResult[] {
    const historyLimit = limit || 10;
    return this.commandHistory.slice(-historyLimit);
  }

  /**
   * Clear command history
   */
  clearCommandHistory(): void {
    this.commandHistory = [];
    this.logger.info('Command history cleared');
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    platform: string;
    arch: string;
    osVersion: string;
    nodeVersion: string;
    cpuCount: number;
    totalMemory: string;
    freeMemory: string;
    homeDir: string;
    tempDir: string;
  } {
    return {
      platform: os.platform(),
      arch: os.arch(),
      osVersion: os.release(),
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemory: `${(os.totalmem() / (1024 * 1024)).toFixed(2)} MB`,
      freeMemory: `${(os.freemem() / (1024 * 1024)).toFixed(2)} MB`,
      homeDir: os.homedir(),
      tempDir: os.tmpdir(),
    };
  }

  /**
   * Check if path is within allowed scope
   */
  isPathAllowed(filePath: string): boolean {
    if (!this.safetyConfig.allowedPaths || this.safetyConfig.allowedPaths.length === 0) {
      return true; // No restrictions if not configured
    }

    const absPath = path.resolve(filePath);
    return this.safetyConfig.allowedPaths.some((allowed) => {
      const allowedAbs = path.resolve(allowed);
      return absPath.startsWith(allowedAbs);
    });
  }

  /**
   * Get safe commands suggestion
   */
  getSafeCommandsSuggestions(): string[] {
    return this.SAFE_COMMANDS;
  }

  /**
   * Display command history as formatted text
   */
  displayCommandHistory(): string {
    const history = this.getCommandHistory(20);
    const lines: string[] = [];

    lines.push('📜 COMMAND HISTORY');
    lines.push('═'.repeat(80));

    if (history.length === 0) {
      lines.push('No commands executed yet');
      return lines.join('\n');
    }

    for (let i = 0; i < history.length; i++) {
      const cmd = history[i];
      const status = cmd.success ? '✅' : '❌';
      lines.push(`${status} [${i + 1}] ${cmd.command}`);
      lines.push(`    Exit Code: ${cmd.exitCode} | Duration: ${cmd.duration}ms`);
      if (cmd.stdout && cmd.stdout.length > 0) {
        const preview = cmd.stdout.substring(0, 100).replace(/\n/g, ' ');
        lines.push(`    Output: ${preview}${cmd.stdout.length > 100 ? '...' : ''}`);
      }
      if (cmd.stderr && cmd.stderr.length > 0) {
        const preview = cmd.stderr.substring(0, 100).replace(/\n/g, ' ');
        lines.push(`    Error: ${preview}${cmd.stderr.length > 100 ? '...' : ''}`);
      }
    }

    return lines.join('\n');
  }
}
