// src/chat-history.ts
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: string;
  retryCount?: number;
}

export interface ChatSession {
  sessionId: string;
  accountId: string;
  provider: string;
  accountName: string;
  startTime: number;
  lastActiveTime: number;
  messages: ChatMessage[];
  isCompleted: boolean;
  interruptedAt?: number;
  status: 'active' | 'interrupted' | 'completed' | 'error';
  learningEnabled?: boolean;
  learningRecords?: string[]; // IDs of learning records for this session
}

export interface ErrorRecord {
  messageId: string;
  timestamp: number;
  error: string;
  errorCode?: string;
  retryCount: number;
  lastRetryTime?: number;
  resolved: boolean;
  resolution?: string;
}

export class ChatHistoryManager {
  private dataDir: string;
  private sessionsDir: string;
  private logger: Logger;
  private currentSession: ChatSession | null = null;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.dataDir = path.join(process.cwd(), '.ai-agent-data');
    this.sessionsDir = path.join(this.dataDir, 'sessions');
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      this.logger.info('Created data directory');
    }
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
      this.logger.info('Created sessions directory');
    }
  }

  /**
   * Create a new chat session
   */
  createSession(
    accountId: string,
    provider: string,
    accountName: string,
    learningEnabled: boolean = true
  ): ChatSession {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: ChatSession = {
      sessionId,
      accountId,
      provider,
      accountName,
      startTime: now,
      lastActiveTime: now,
      messages: [],
      isCompleted: false,
      status: 'active',
      learningEnabled,
      learningRecords: [],
    };

    this.currentSession = session;
    this.saveSession(session);
    this.logger.info(`Created new session: ${sessionId}`);

    return session;
  }

  /**
   * Load an existing session
   */
  loadSession(sessionId: string): ChatSession | null {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      if (!fs.existsSync(sessionPath)) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return null;
      }

      const data = fs.readFileSync(sessionPath, 'utf-8');
      const session = JSON.parse(data) as ChatSession;
      this.currentSession = session;
      this.logger.info(`Loaded session: ${sessionId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to load session: ${error}`);
      return null;
    }
  }

  /**
   * Add a message to current session
   */
  addMessage(
    role: 'user' | 'assistant',
    content: string,
    error?: string,
    retryCount?: number
  ): ChatMessage {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const message: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
      error,
      retryCount,
    };

    this.currentSession.messages.push(message);
    this.currentSession.lastActiveTime = Date.now();
    this.saveSession(this.currentSession);

    return message;
  }

  /**
   * Update the last message with error information
   */
  updateLastMessageWithError(error: string, retryCount: number = 0): void {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      return;
    }

    const lastMessage = this.currentSession.messages[this.currentSession.messages.length - 1];
    lastMessage.error = error;
    lastMessage.retryCount = retryCount;
    this.currentSession.lastActiveTime = Date.now();
    this.saveSession(this.currentSession);
  }

  /**
   * Get all messages in current session
   */
  getMessages(): ChatMessage[] {
    if (!this.currentSession) {
      return [];
    }
    return this.currentSession.messages;
  }

  /**
   * Get conversation history as simple messages
   */
  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!this.currentSession) {
      return [];
    }

    return this.currentSession.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Get current session
   */
  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Save session to disk
   */
  private saveSession(session: ChatSession): void {
    try {
      const sessionPath = this.getSessionPath(session.sessionId);
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save session: ${error}`);
    }
  }

  /**
   * Mark session as completed
   */
  completeSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'completed';
    this.currentSession.isCompleted = true;
    this.currentSession.lastActiveTime = Date.now();
    this.saveSession(this.currentSession);
    this.logger.info(`Session completed: ${this.currentSession.sessionId}`);
  }

  /**
   * Mark session as interrupted (for recovery)
   */
  markSessionInterrupted(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'interrupted';
    this.currentSession.interruptedAt = Date.now();
    this.currentSession.lastActiveTime = Date.now();
    this.saveSession(this.currentSession);
    this.logger.info(`Session marked as interrupted: ${this.currentSession.sessionId}`);
  }

  /**
   * Get all available sessions
   */
  getAllSessions(): ChatSession[] {
    try {
      const files = fs.readdirSync(this.sessionsDir);
      const sessions: ChatSession[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.sessionsDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const session = JSON.parse(data) as ChatSession;
          sessions.push(session);
        }
      }

      // Sort by last active time (newest first)
      return sessions.sort((a, b) => b.lastActiveTime - a.lastActiveTime);
    } catch (error) {
      this.logger.error(`Failed to get all sessions: ${error}`);
      return [];
    }
  }

  /**
   * Get sessions for specific account
   */
  getSessionsForAccount(accountId: string): ChatSession[] {
    return this.getAllSessions().filter((s) => s.accountId === accountId);
  }

  /**
   * Get interrupted sessions available for recovery
   */
  getInterruptedSessions(): ChatSession[] {
    return this.getAllSessions().filter(
      (s) => s.status === 'interrupted' || s.status === 'error'
    );
  }

  /**
   * Get interrupted sessions for specific account
   */
  getInterruptedSessionsForAccount(accountId: string): ChatSession[] {
    return this.getSessionsForAccount(accountId).filter(
      (s) => s.status === 'interrupted' || s.status === 'error'
    );
  }

  /**
   * Resume an interrupted session
   */
  resumeSession(sessionId: string): ChatSession | null {
    const session = this.loadSession(sessionId);
    if (!session) {
      return null;
    }

    session.status = 'active';
    session.lastActiveTime = Date.now();
    this.currentSession = session;
    this.saveSession(session);
    this.logger.info(`Resumed session: ${sessionId}`);

    return session;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        this.logger.info(`Deleted session: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete session: ${error}`);
      return false;
    }
  }

  /**
   * Export session as JSON
   */
  exportSession(sessionId: string): string | null {
    try {
      const session = this.loadSession(sessionId);
      if (!session) {
        return null;
      }
      return JSON.stringify(session, null, 2);
    } catch (error) {
      this.logger.error(`Failed to export session: ${error}`);
      return null;
    }
  }

  /**
   * Export session as markdown
   */
  exportSessionAsMarkdown(sessionId: string): string | null {
    try {
      const session = this.loadSession(sessionId);
      if (!session) {
        return null;
      }

      const lines: string[] = [];
      lines.push(`# Chat Session: ${session.sessionId}`);
      lines.push(`**Provider:** ${session.provider}`);
      lines.push(`**Account:** ${session.accountName}`);
      lines.push(
        `**Started:** ${new Date(session.startTime).toLocaleString()}`
      );
      lines.push(
        `**Last Active:** ${new Date(session.lastActiveTime).toLocaleString()}`
      );
      lines.push(`**Status:** ${session.status}`);
      lines.push(`**Messages:** ${session.messages.length}`);
      lines.push('');
      lines.push('---');
      lines.push('');

      for (const msg of session.messages) {
        const role = msg.role.toUpperCase();
        lines.push(`**${role}:** (${new Date(msg.timestamp).toLocaleTimeString()})`);
        lines.push('');
        lines.push(msg.content);
        if (msg.error) {
          lines.push(`\n⚠️ Error: ${msg.error}`);
          if (msg.retryCount !== undefined) {
            lines.push(`Retries: ${msg.retryCount}`);
          }
        }
        lines.push('');
        lines.push('---');
        lines.push('');
      }

      return lines.join('\n');
    } catch (error) {
      this.logger.error(`Failed to export session as markdown: ${error}`);
      return null;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    interruptedSessions: number;
    completedSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  } {
    const allSessions = this.getAllSessions();
    const totalMessages = allSessions.reduce((sum, s) => sum + s.messages.length, 0);

    return {
      totalSessions: allSessions.length,
      activeSessions: allSessions.filter((s) => s.status === 'active').length,
      interruptedSessions: allSessions.filter((s) => s.status === 'interrupted').length,
      completedSessions: allSessions.filter((s) => s.status === 'completed').length,
      totalMessages,
      averageMessagesPerSession:
        allSessions.length > 0 ? totalMessages / allSessions.length : 0,
    };
  }

  /**
   * Clean up old sessions (older than specified days)
   */
  cleanupOldSessions(daysOld: number = 30): number {
    const allSessions = this.getAllSessions();
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const session of allSessions) {
      if (session.lastActiveTime < cutoffTime && session.status === 'completed') {
        if (this.deleteSession(session.sessionId)) {
          deletedCount++;
        }
      }
    }

    this.logger.info(`Cleaned up ${deletedCount} old sessions`);
    return deletedCount;
  }

  /**
   * Get session path
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  /**
   * Record learning record ID for a session
   */
  recordLearningForSession(recordId: string): void {
    if (!this.currentSession) return;

    if (!this.currentSession.learningRecords) {
      this.currentSession.learningRecords = [];
    }

    if (!this.currentSession.learningRecords.includes(recordId)) {
      this.currentSession.learningRecords.push(recordId);
      this.saveSession(this.currentSession);
      this.logger.debug(`Added learning record to session: ${recordId}`);
    }
  }

  /**
   * Get learning records for a session
   */
  getLearningRecords(): string[] {
    if (!this.currentSession) return [];
    return this.currentSession.learningRecords || [];
  }

  /**
   * Check if learning is enabled for current session
   */
  isLearningEnabled(): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.learningEnabled !== false;
  }

  /**
   * Set learning enabled for current session
   */
  setLearningEnabled(enabled: boolean): void {
    if (!this.currentSession) return;
    this.currentSession.learningEnabled = enabled;
    this.saveSession(this.currentSession);
    this.logger.info(`Learning ${enabled ? 'enabled' : 'disabled'} for session`);
  }
}

