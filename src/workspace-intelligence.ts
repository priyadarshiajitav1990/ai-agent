// src/workspace-intelligence.ts
// AI Agent Workspace Intelligence - Access to VS Code workspace, commands, and console monitoring

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';
import { Logger } from './logger.js';

export interface WorkspaceFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  isSource: boolean;
  isConfig: boolean;
}

export interface WorkspaceCommand {
  command: string;
  description: string;
  available: boolean;
  lastRun?: Date;
  lastOutput?: string;
}

export interface ConsoleMessage {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  source?: string;
  context?: Record<string, unknown>;
}

export class WorkspaceIntelligence extends EventEmitter {
  private logger: Logger;
  private workspacePath: string;
  private consoleHistory: ConsoleMessage[] = [];
  private maxConsoleHistory: number = 1000;
  private commandHistory: Map<string, WorkspaceCommand> = new Map();
  private fileWatchPatterns: RegExp[] = [];
  private sourceFileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
  private configFileNames = ['package.json', 'tsconfig.json', '.env', '.gitignore', 'webpack.config.js', 'vite.config.js'];

  constructor(workspacePath: string, logger: Logger) {
    super();
    this.logger = logger;
    this.workspacePath = workspacePath;
    this.initializeFileWatchers();
  }

  private initializeFileWatchers(): void {
    // Watch for common config and source file changes
    this.fileWatchPatterns = [
      /\.(ts|js|tsx|jsx)$/,
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env(\..*)?$/,
    ];
  }

  /**
   * Get complete workspace structure
   */
  public getWorkspaceStructure(
    targetPath: string = this.workspacePath,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): WorkspaceFile[] {
    const files: WorkspaceFile[] = [];

    if (currentDepth >= maxDepth) return files;

    try {
      const entries = fs.readdirSync(targetPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules and hidden files at root level
        if (entry.name.startsWith('.') && currentDepth === 0) continue;
        if (entry.name === 'node_modules' && currentDepth === 0) continue;
        if (entry.name === 'dist' && currentDepth === 0) continue;

        const fullPath = path.join(targetPath, entry.name);
        const stats = fs.statSync(fullPath);

        const file: WorkspaceFile = {
          path: fullPath,
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime,
          isSource: this.isSourceFile(fullPath),
          isConfig: this.isConfigFile(entry.name),
        };

        files.push(file);

        // Recursively get subdirectory structure
        if (entry.isDirectory() && currentDepth < maxDepth - 1) {
          files.push(...this.getWorkspaceStructure(fullPath, maxDepth, currentDepth + 1));
        }
      }
    } catch (error) {
      this.logger.error(`Error reading workspace: ${error}`, 'WORKSPACE_INTEL');
    }

    return files;
  }

  /**
   * Get all source files in workspace
   */
  public getSourceFiles(): WorkspaceFile[] {
    return this.getWorkspaceStructure().filter(f => f.isSource && f.type === 'file');
  }

  /**
   * Get all config files in workspace
   */
  public getConfigFiles(): WorkspaceFile[] {
    return this.getWorkspaceStructure().filter(f => f.isConfig);
  }

  /**
   * Read file content
   */
  public readFile(filePath: string): string | null {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
      
      // Security: Prevent reading outside workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        this.logger.warn(`Attempted to read outside workspace: ${filePath}`, 'WORKSPACE_INTEL');
        return null;
      }

      if (!fs.existsSync(fullPath)) {
        this.logger.warn(`File not found: ${filePath}`, 'WORKSPACE_INTEL');
        return null;
      }

      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      this.logger.error(`Error reading file ${filePath}: ${error}`, 'WORKSPACE_INTEL');
      return null;
    }
  }

  /**
   * Write file content
   */
  public writeFile(filePath: string, content: string): boolean {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
      
      // Security: Prevent writing outside workspace
      if (!fullPath.startsWith(this.workspacePath)) {
        this.logger.warn(`Attempted to write outside workspace: ${filePath}`, 'WORKSPACE_INTEL');
        return false;
      }

      // Create directories if needed
      const directory = path.dirname(fullPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      this.logger.success(`File written: ${filePath}`, 'WORKSPACE_INTEL');
      this.emit('file-modified', { path: filePath, type: 'write' });
      return true;
    } catch (error) {
      this.logger.error(`Error writing file ${filePath}: ${error}`, 'WORKSPACE_INTEL');
      return false;
    }
  }

  /**
   * Execute command in workspace
   */
  public async executeCommand(command: string, captureOutput: boolean = true): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    this.logger.info(`Executing: ${command}`, 'WORKSPACE_INTEL');

    return new Promise((resolve) => {
      child_process.exec(command, { cwd: this.workspacePath }, (error, stdout, stderr) => {
        const output = stdout + stderr;
        const success = !error;

        if (captureOutput) {
          this.addConsoleMessage({
            timestamp: new Date(),
            level: success ? 'info' : 'error',
            message: output,
            source: 'command',
            context: { command },
          });
        }

        // Store in command history
        const cmdRecord: WorkspaceCommand = {
          command,
          description: `Executed: ${command}`,
          available: success,
          lastRun: new Date(),
          lastOutput: output,
        };
        this.commandHistory.set(command, cmdRecord);

        if (error) {
          this.logger.error(`Command failed: ${stderr}`, 'WORKSPACE_INTEL');
          resolve({
            success: false,
            output,
            error: stderr,
          });
        } else {
          this.logger.success(`Command executed successfully`, 'WORKSPACE_INTEL');
          resolve({
            success: true,
            output,
          });
        }
      });
    });
  }

  /**
   * Execute NPM script
   */
  public async executeNpmScript(scriptName: string): Promise<{ success: boolean; output: string }> {
    return this.executeCommand(`npm run ${scriptName}`);
  }

  /**
   * Build project
   */
  public async buildProject(): Promise<{ success: boolean; output: string }> {
    this.logger.info('Building project...', 'WORKSPACE_INTEL');
    return this.executeCommand('npm run compile');
  }

  /**
   * Run tests
   */
  public async runTests(): Promise<{ success: boolean; output: string }> {
    this.logger.info('Running tests...', 'WORKSPACE_INTEL');
    return this.executeCommand('npm test');
  }

  /**
   * Get workspace analysis
   */
  public analyzeWorkspace(): Record<string, unknown> {
    const sourceFiles = this.getSourceFiles();
    const configFiles = this.getConfigFiles();

    const analysis = {
      workspacePath: this.workspacePath,
      totalSourceFiles: sourceFiles.length,
      totalConfigFiles: configFiles.length,
      sourceFileTypes: this.getFileTypeDistribution(sourceFiles),
      configFiles: configFiles.map(f => f.name),
      projectType: this.detectProjectType(),
      hasNodeModules: fs.existsSync(path.join(this.workspacePath, 'node_modules')),
      hasGit: fs.existsSync(path.join(this.workspacePath, '.git')),
      totalSourceLines: this.countSourceLines(sourceFiles),
    };

    return analysis;
  }

  /**
   * Add console message
   */
  public addConsoleMessage(message: ConsoleMessage): void {
    this.consoleHistory.push(message);

    // Keep history manageable
    if (this.consoleHistory.length > this.maxConsoleHistory) {
      this.consoleHistory.shift();
    }

    this.emit('console-message', message);
  }

  /**
   * Get recent console messages
   */
  public getConsoleHistory(count: number = 50): ConsoleMessage[] {
    return this.consoleHistory.slice(-count);
  }

  /**
   * Search in console history
   */
  public searchConsole(query: string): ConsoleMessage[] {
    return this.consoleHistory.filter(msg =>
      msg.message.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Analyze console for errors
   */
  public getConsoleErrors(): ConsoleMessage[] {
    return this.consoleHistory.filter(msg => msg.level === 'error' || msg.level === 'warn');
  }

  /**
   * Get command history
   */
  public getCommandHistory(): WorkspaceCommand[] {
    return Array.from(this.commandHistory.values());
  }

  /**
   * Get specific command info
   */
  public getCommandInfo(command: string): WorkspaceCommand | null {
    return this.commandHistory.get(command) || null;
  }

  /**
   * List available npm scripts
   */
  public getAvailableNpmScripts(): string[] {
    const packageJsonPath = path.join(this.workspacePath, 'package.json');
    
    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return Object.keys(packageJson.scripts || {});
      }
    } catch (error) {
      this.logger.error(`Error reading package.json: ${error}`, 'WORKSPACE_INTEL');
    }

    return [];
  }

  /**
   * Monitor file changes
   */
  public watchFiles(callback: (filePath: string) => void): void {
    try {
      fs.watch(this.workspacePath, { recursive: true }, (eventType, filename) => {
        if (filename && this.shouldWatchFile(filename)) {
          callback(filename);
          this.emit('file-changed', filename);
        }
      });
    } catch (error) {
      this.logger.error(`Error setting up file watcher: ${error}`, 'WORKSPACE_INTEL');
    }
  }

  // Private helpers

  private isSourceFile(filePath: string): boolean {
    return this.sourceFileExtensions.some(ext => filePath.endsWith(ext));
  }

  private isConfigFile(fileName: string): boolean {
    return this.configFileNames.includes(fileName);
  }

  private shouldWatchFile(fileName: string): boolean {
    return this.fileWatchPatterns.some(pattern => pattern.test(fileName));
  }

  private getFileTypeDistribution(files: WorkspaceFile[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    files.forEach(file => {
      const ext = path.extname(file.name) || 'no-extension';
      distribution[ext] = (distribution[ext] || 0) + 1;
    });

    return distribution;
  }

  private detectProjectType(): string {
    const packageJsonPath = path.join(this.workspacePath, 'package.json');
    const tsconfigPath = path.join(this.workspacePath, 'tsconfig.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name?.includes('ai-agent')) return 'ai-agent';
        if (packageJson.devDependencies?.['@types/node']) return 'node-app';
        if (packageJson.dependencies?.['react']) return 'react-app';
        if (packageJson.devDependencies?.['next']) return 'next-app';
      } catch (error) {
        // Silent fail
      }
    }

    if (fs.existsSync(tsconfigPath)) return 'typescript-project';
    
    return 'unknown';
  }

  private countSourceLines(files: WorkspaceFile[]): number {
    let totalLines = 0;

    files.slice(0, 100).forEach(file => {
      try {
        const content = fs.readFileSync(file.path, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // Silently skip unreadable files
      }
    });

    return totalLines;
  }
}
