// src/file-commands.ts
import { FileManager, FileOperation } from './file-manager.js';
import { Logger } from './logger.js';

export interface FileCommand {
  action: string;
  path?: string;
  content?: string;
  destPath?: string;
  newName?: string;
  recursive?: boolean;
  append?: boolean;
  encoding?: BufferEncoding;
}

export interface FileCommandResult {
  success: boolean;
  action: string;
  message: string;
  result?: any;
  error?: string;
}

export class FileCommandProcessor {
  private fileManager: FileManager;
  private logger: Logger;

  constructor(logLevel: string = 'info') {
    this.fileManager = new FileManager(logLevel);
    this.logger = new Logger(logLevel);
  }

  /**
   * Process file commands from user input
   */
  async processCommand(command: FileCommand): Promise<FileCommandResult> {
    try {
      switch (command.action) {
        case 'create':
          return await this.handleCreate(command);
        case 'read':
          return await this.handleRead(command);
        case 'update':
          return await this.handleUpdate(command);
        case 'delete':
          return await this.handleDelete(command);
        case 'mkdir':
          return await this.handleMkdir(command);
        case 'rmdir':
          return await this.handleRmdir(command);
        case 'list':
          return await this.handleList(command);
        case 'copy':
          return await this.handleCopy(command);
        case 'move':
          return await this.handleMove(command);
        case 'info':
          return await this.handleInfo(command);
        case 'rename':
          return await this.handleRename(command);
        case 'pwd':
          return this.handlePwd();
        case 'cd':
          return this.handleCd(command);
        default:
          return {
            success: false,
            action: command.action,
            message: `Unknown file action: ${command.action}`,
            error: 'UNKNOWN_ACTION',
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`File command error: ${message}`);
      return {
        success: false,
        action: command.action,
        message: `Error processing command: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Parse natural language file commands
   */
  parseUserCommand(input: string): FileCommand | null {
    const input_lower = input.toLowerCase();

    // Create file
    if (input_lower.includes('create file') || input_lower.includes('write')) {
      const match = input.match(/(?:create|write)\s+(?:file\s+)?(?:at\s+)?['"]?(.+?)['"]?\s+(?:with|content|containing)[\s:]*(.+)/i);
      if (match) {
        return { action: 'create', path: match[1], content: match[2] };
      }
    }

    // Read file
    if (input_lower.includes('read file') || input_lower.includes('show') || input_lower.includes('cat')) {
      const match = input.match(/(?:read|show|cat|view)\s+(?:file\s+)?(?:at\s+)?['"]?(.+?)['"]?$/i);
      if (match) {
        return { action: 'read', path: match[1] };
      }
    }

    // Update file
    if (input_lower.includes('update file') || input_lower.includes('modify')) {
      const match = input.match(/(?:update|modify)\s+(?:file\s+)?(?:at\s+)?['"]?(.+?)['"]?\s+(?:with|to|content|containing)[\s:]*(.+)/i);
      if (match) {
        return { action: 'update', path: match[1], content: match[2] };
      }
    }

    // Delete file
    if (input_lower.includes('delete file') || input_lower.includes('remove file') || input_lower.includes('rm ')) {
      const match = input.match(/(?:delete|remove|rm)\s+(?:file\s+)?(?:at\s+)?['"]?(.+?)['"]?$/i);
      if (match) {
        return { action: 'delete', path: match[1] };
      }
    }

    // Create directory
    if (input_lower.includes('create directory') || input_lower.includes('create folder') || input_lower.includes('mkdir')) {
      const match = input.match(/(?:create|mkdir)\s+(?:directory|folder)?\s*['"]?(.+?)['"]?$/i);
      if (match) {
        return { action: 'mkdir', path: match[1] };
      }
    }

    // Delete directory
    if (input_lower.includes('delete directory') || input_lower.includes('remove directory') || input_lower.includes('rmdir')) {
      const match = input.match(/(?:delete|remove|rmdir)\s+(?:directory|folder)?\s*['"]?(.+?)['"]?(?:\s+recursive)?/i);
      if (match) {
        const recursive = input_lower.includes('recursive') || input_lower.includes('-r');
        return { action: 'rmdir', path: match[1], recursive };
      }
    }

    // List directory
    if (input_lower.includes('list') || input_lower.includes('ls ') || input_lower.includes('show files')) {
      const match = input.match(/(?:list|ls)\s+(?:at|in)?\s*['"]?(.+?)['"]?$/) || input.match(/list|ls/i);
      if (match) {
        return { action: 'list', path: match[1] || '.' };
      }
    }

    // Copy
    if (input_lower.includes('copy')) {
      const match = input.match(/copy\s+['"]?(.+?)['"]?\s+(?:to|into)\s+['"]?(.+?)['"]?/i);
      if (match) {
        const recursive = input_lower.includes('recursive') || input_lower.includes('-r');
        return { action: 'copy', path: match[1], destPath: match[2], recursive };
      }
    }

    // Move
    if (input_lower.includes('move') || input_lower.includes('mv ')) {
      const match = input.match(/(?:move|mv)\s+['"]?(.+?)['"]?\s+(?:to|into)\s+['"]?(.+?)['"]?/i);
      if (match) {
        return { action: 'move', path: match[1], destPath: match[2] };
      }
    }

    // Info
    if (input_lower.includes('info') || input_lower.includes('stat')) {
      const match = input.match(/(?:info|stat)\s+(?:on\s+)?['"]?(.+?)['"]?$/i);
      if (match) {
        return { action: 'info', path: match[1] };
      }
    }

    // Rename
    if (input_lower.includes('rename')) {
      const match = input.match(/rename\s+['"]?(.+?)['"]?\s+(?:to|as)\s+['"]?(.+?)['"]?/i);
      if (match) {
        return { action: 'rename', path: match[1], newName: match[2] };
      }
    }

    // PWD
    if (input_lower === 'pwd' || input_lower.includes('current directory')) {
      return { action: 'pwd' };
    }

    // CD
    if (input_lower.includes('cd ') || input_lower.includes('change directory')) {
      const match = input.match(/cd\s+['"]?(.+?)['"]?$/i) || input.match(/(?:change\s+)?directory\s+(?:to\s+)?['"]?(.+?)['"]?$/i);
      if (match) {
        return { action: 'cd', path: match[1] };
      }
    }

    return null;
  }

  private async handleCreate(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path || !cmd.content) {
      return {
        success: false,
        action: 'create',
        message: 'Path and content required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.createFile(cmd.path, cmd.content, {
      overwrite: false,
      encoding: cmd.encoding,
    });

    return {
      success: result.success,
      action: 'create',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private async handleRead(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path) {
      return {
        success: false,
        action: 'read',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.readFile(cmd.path, cmd.encoding);

    return {
      success: result.success,
      action: 'read',
      message: result.message,
      result: { path: result.path, content: result.data },
      error: result.error,
    };
  }

  private async handleUpdate(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path || !cmd.content) {
      return {
        success: false,
        action: 'update',
        message: 'Path and content required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.updateFile(cmd.path, cmd.content, {
      encoding: cmd.encoding,
      append: cmd.append,
    });

    return {
      success: result.success,
      action: 'update',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private async handleDelete(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path) {
      return {
        success: false,
        action: 'delete',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.deleteFile(cmd.path);

    return {
      success: result.success,
      action: 'delete',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private async handleMkdir(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path) {
      return {
        success: false,
        action: 'mkdir',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.createDirectory(cmd.path, true);

    return {
      success: result.success,
      action: 'mkdir',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private async handleRmdir(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path) {
      return {
        success: false,
        action: 'rmdir',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.deleteDirectory(cmd.path, cmd.recursive || false);

    return {
      success: result.success,
      action: 'rmdir',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private async handleList(cmd: FileCommand): Promise<FileCommandResult> {
    const result = await this.fileManager.listDirectory(cmd.path || '.');

    return {
      success: result.success,
      action: 'list',
      message: result.message,
      result: { path: result.path, contents: (result as any).contents },
      error: result.error,
    };
  }

  private async handleCopy(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path || !cmd.destPath) {
      return {
        success: false,
        action: 'copy',
        message: 'Source and destination paths required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.copy(cmd.path, cmd.destPath, cmd.recursive);

    return {
      success: result.success,
      action: 'copy',
      message: result.message,
      result: { source: cmd.path, destination: result.path },
      error: result.error,
    };
  }

  private async handleMove(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path || !cmd.destPath) {
      return {
        success: false,
        action: 'move',
        message: 'Source and destination paths required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.move(cmd.path, cmd.destPath);

    return {
      success: result.success,
      action: 'move',
      message: result.message,
      result: { source: cmd.path, destination: result.path },
      error: result.error,
    };
  }

  private async handleInfo(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path) {
      return {
        success: false,
        action: 'info',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.getInfo(cmd.path);

    return {
      success: result.success,
      action: 'info',
      message: result.message,
      result: { path: result.path, info: (result as any).info },
      error: result.error,
    };
  }

  private async handleRename(cmd: FileCommand): Promise<FileCommandResult> {
    if (!cmd.path || !cmd.newName) {
      return {
        success: false,
        action: 'rename',
        message: 'Path and new name required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = await this.fileManager.rename(cmd.path, cmd.newName);

    return {
      success: result.success,
      action: 'rename',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }

  private handlePwd(): FileCommandResult {
    const currentDir = this.fileManager.getCurrentDirectory();
    return {
      success: true,
      action: 'pwd',
      message: `Current directory: ${currentDir}`,
      result: { path: currentDir },
    };
  }

  private handleCd(cmd: FileCommand): FileCommandResult {
    if (!cmd.path) {
      return {
        success: false,
        action: 'cd',
        message: 'Path required',
        error: 'MISSING_PARAMS',
      };
    }

    const result = this.fileManager.setCurrentDirectory(cmd.path);
    return {
      success: result.success,
      action: 'cd',
      message: result.message,
      result: { path: result.path },
      error: result.error,
    };
  }
}
