// src/file-manager.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger.js';

export interface FileOperation {
  success: boolean;
  message: string;
  path?: string;
  data?: string | Buffer;
  error?: string;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  modified?: Date;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  size: number;
}

export class FileManager {
  private logger: Logger;
  private homeDir: string;
  private currentDir: string;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.homeDir = os.homedir();
    this.currentDir = process.cwd();
  }

  /**
   * Resolve path to absolute path with ~ expansion
   */
  private resolvePath(filePath: string): string {
    if (filePath.startsWith('~')) {
      return path.join(this.homeDir, filePath.slice(1));
    }
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.currentDir, filePath);
  }

  /**
   * Create a file with content
   */
  async createFile(
    filePath: string,
    content: string,
    options: { overwrite?: boolean; encoding?: BufferEncoding } = {}
  ): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const { overwrite = false, encoding = 'utf-8' } = options;

      // Check if file exists
      if (fs.existsSync(resolvedPath) && !overwrite) {
        return {
          success: false,
          message: `File already exists: ${resolvedPath}`,
          error: 'FILE_EXISTS',
          path: resolvedPath,
        };
      }

      // Create parent directories if they don't exist
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.info(`Created directory: ${dir}`);
      }

      // Write file
      fs.writeFileSync(resolvedPath, content, encoding);
      this.logger.info(`File created: ${resolvedPath}`);

      return {
        success: true,
        message: `File created successfully: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create file: ${message}`);
      return {
        success: false,
        message: `Failed to create file: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Read a file
   */
  async readFile(
    filePath: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(filePath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `File not found: ${resolvedPath}`,
          error: 'FILE_NOT_FOUND',
          path: resolvedPath,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        return {
          success: false,
          message: `Path is a directory, not a file: ${resolvedPath}`,
          error: 'IS_DIRECTORY',
          path: resolvedPath,
        };
      }

      const content = fs.readFileSync(resolvedPath, encoding);
      this.logger.info(`File read: ${resolvedPath}`);

      return {
        success: true,
        message: `File read successfully: ${resolvedPath}`,
        path: resolvedPath,
        data: content,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read file: ${message}`);
      return {
        success: false,
        message: `Failed to read file: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Update a file (modify existing content)
   */
  async updateFile(
    filePath: string,
    content: string,
    options: { encoding?: BufferEncoding; append?: boolean } = {}
  ): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const { encoding = 'utf-8', append = false } = options;

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `File not found: ${resolvedPath}`,
          error: 'FILE_NOT_FOUND',
          path: resolvedPath,
        };
      }

      if (append) {
        fs.appendFileSync(resolvedPath, content, encoding);
        this.logger.info(`Content appended to file: ${resolvedPath}`);
      } else {
        fs.writeFileSync(resolvedPath, content, encoding);
        this.logger.info(`File updated: ${resolvedPath}`);
      }

      return {
        success: true,
        message: `File ${append ? 'appended' : 'updated'} successfully: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update file: ${message}`);
      return {
        success: false,
        message: `Failed to update file: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(filePath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `File not found: ${resolvedPath}`,
          error: 'FILE_NOT_FOUND',
          path: resolvedPath,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        return {
          success: false,
          message: `Path is a directory, not a file: ${resolvedPath}`,
          error: 'IS_DIRECTORY',
          path: resolvedPath,
        };
      }

      fs.unlinkSync(resolvedPath);
      this.logger.info(`File deleted: ${resolvedPath}`);

      return {
        success: true,
        message: `File deleted successfully: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete file: ${message}`);
      return {
        success: false,
        message: `Failed to delete file: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string, recursive: boolean = true): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(dirPath);

      if (fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Directory already exists: ${resolvedPath}`,
          error: 'DIR_EXISTS',
          path: resolvedPath,
        };
      }

      fs.mkdirSync(resolvedPath, { recursive });
      this.logger.info(`Directory created: ${resolvedPath}`);

      return {
        success: true,
        message: `Directory created successfully: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create directory: ${message}`);
      return {
        success: false,
        message: `Failed to create directory: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Delete a directory (recursively if specified)
   */
  async deleteDirectory(
    dirPath: string,
    recursive: boolean = false
  ): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(dirPath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Directory not found: ${resolvedPath}`,
          error: 'DIR_NOT_FOUND',
          path: resolvedPath,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Path is not a directory: ${resolvedPath}`,
          error: 'NOT_DIRECTORY',
          path: resolvedPath,
        };
      }

      if (recursive) {
        fs.rmSync(resolvedPath, { recursive: true, force: true });
      } else {
        // Check if directory is empty
        const files = fs.readdirSync(resolvedPath);
        if (files.length > 0) {
          return {
            success: false,
            message: `Directory is not empty: ${resolvedPath}. Use recursive: true to force delete.`,
            error: 'DIR_NOT_EMPTY',
            path: resolvedPath,
          };
        }
        fs.rmdirSync(resolvedPath);
      }

      this.logger.info(`Directory deleted: ${resolvedPath}`);

      return {
        success: true,
        message: `Directory deleted successfully: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete directory: ${message}`);
      return {
        success: false,
        message: `Failed to delete directory: ${message}`,
        error: message,
      };
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string = '.'): Promise<FileOperation & { contents?: DirectoryInfo[] }> {
    try {
      const resolvedPath = this.resolvePath(dirPath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Directory not found: ${resolvedPath}`,
          error: 'DIR_NOT_FOUND',
          path: resolvedPath,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Path is not a directory: ${resolvedPath}`,
          error: 'NOT_DIRECTORY',
          path: resolvedPath,
        };
      }

      const files = fs.readdirSync(resolvedPath);
      const contents: DirectoryInfo[] = files.map(file => {
        const fullPath = path.join(resolvedPath, file);
        const fileStat = fs.statSync(fullPath);
        return {
          path: fullPath,
          name: file,
          isDirectory: fileStat.isDirectory(),
          isFile: fileStat.isFile(),
          size: fileStat.size,
          modified: new Date(fileStat.mtime),
        };
      });

      this.logger.info(`Directory listed: ${resolvedPath} (${files.length} items)`);

      return {
        success: true,
        message: `Directory contents retrieved: ${resolvedPath}`,
        path: resolvedPath,
        contents,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to list directory: ${message}`);
      return {
        success: false,
        message: `Failed to list directory: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Copy a file or directory
   */
  async copy(sourcePath: string, destPath: string, recursive: boolean = false): Promise<FileOperation> {
    try {
      const resolvedSource = this.resolvePath(sourcePath);
      const resolvedDest = this.resolvePath(destPath);

      if (!fs.existsSync(resolvedSource)) {
        return {
          success: false,
          message: `Source path not found: ${resolvedSource}`,
          error: 'SOURCE_NOT_FOUND',
        };
      }

      const sourceStats = fs.statSync(resolvedSource);
      const isDirectory = sourceStats.isDirectory();

      if (isDirectory && !recursive) {
        return {
          success: false,
          message: `Source is a directory. Use recursive: true to copy directories.`,
          error: 'IS_DIRECTORY',
        };
      }

      // Create parent directory of destination
      const destDir = path.dirname(resolvedDest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      if (isDirectory) {
        fs.cpSync(resolvedSource, resolvedDest, { recursive: true });
      } else {
        fs.copyFileSync(resolvedSource, resolvedDest);
      }

      this.logger.info(`Copied ${isDirectory ? 'directory' : 'file'}: ${resolvedSource} → ${resolvedDest}`);

      return {
        success: true,
        message: `${isDirectory ? 'Directory' : 'File'} copied successfully`,
        path: resolvedDest,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to copy: ${message}`);
      return {
        success: false,
        message: `Failed to copy: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Move a file or directory
   */
  async move(sourcePath: string, destPath: string): Promise<FileOperation> {
    try {
      const resolvedSource = this.resolvePath(sourcePath);
      const resolvedDest = this.resolvePath(destPath);

      if (!fs.existsSync(resolvedSource)) {
        return {
          success: false,
          message: `Source path not found: ${resolvedSource}`,
          error: 'SOURCE_NOT_FOUND',
        };
      }

      // Create parent directory of destination
      const destDir = path.dirname(resolvedDest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.renameSync(resolvedSource, resolvedDest);
      this.logger.info(`Moved: ${resolvedSource} → ${resolvedDest}`);

      return {
        success: true,
        message: `File/directory moved successfully`,
        path: resolvedDest,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to move: ${message}`);
      return {
        success: false,
        message: `Failed to move: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Get file/directory info
   */
  async getInfo(filePath: string): Promise<FileOperation & { info?: any }> {
    try {
      const resolvedPath = this.resolvePath(filePath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Path not found: ${resolvedPath}`,
          error: 'PATH_NOT_FOUND',
        };
      }

      const stats = fs.statSync(resolvedPath);
      const info = {
        path: resolvedPath,
        name: path.basename(resolvedPath),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        created: new Date(stats.birthtime),
        modified: new Date(stats.mtime),
        accessed: new Date(stats.atime),
        permissions: stats.mode.toString(8),
      };

      this.logger.info(`File info retrieved: ${resolvedPath}`);

      return {
        success: true,
        message: `File info retrieved: ${resolvedPath}`,
        path: resolvedPath,
        info,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get file info: ${message}`);
      return {
        success: false,
        message: `Failed to get file info: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Rename a file or directory
   */
  async rename(oldPath: string, newName: string): Promise<FileOperation> {
    try {
      const resolvedPath = this.resolvePath(oldPath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Path not found: ${resolvedPath}`,
          error: 'PATH_NOT_FOUND',
        };
      }

      const dir = path.dirname(resolvedPath);
      const newPath = path.join(dir, newName);

      fs.renameSync(resolvedPath, newPath);
      this.logger.info(`Renamed: ${resolvedPath} → ${newPath}`);

      return {
        success: true,
        message: `File/directory renamed successfully`,
        path: newPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to rename: ${message}`);
      return {
        success: false,
        message: `Failed to rename: ${message}`,
        error: message,
      };
    }
  }

  /**
   * Get current working directory
   */
  getCurrentDirectory(): string {
    return this.currentDir;
  }

  /**
   * Set current working directory
   */
  setCurrentDirectory(dirPath: string): FileOperation {
    try {
      const resolvedPath = this.resolvePath(dirPath);

      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          message: `Directory not found: ${resolvedPath}`,
          error: 'DIR_NOT_FOUND',
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          message: `Path is not a directory: ${resolvedPath}`,
          error: 'NOT_DIRECTORY',
        };
      }

      this.currentDir = resolvedPath;
      process.chdir(resolvedPath);
      this.logger.info(`Changed directory to: ${resolvedPath}`);

      return {
        success: true,
        message: `Changed directory to: ${resolvedPath}`,
        path: resolvedPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to change directory: ${message}`);
      return {
        success: false,
        message: `Failed to change directory: ${message}`,
        error: message,
      };
    }
  }
}
