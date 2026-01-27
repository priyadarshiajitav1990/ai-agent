// src/session.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger.js';

export interface UserSession {
  sessionId: string;
  userId: string;
  projectId: string;
  modelId: string;
  createdAt: string;
  lastActivity: string;
  settings: {
    logLevel: string;
    autoSave: boolean;
    theme: string;
  };
}

export class SessionManager {
  private sessionsPath: string;
  private logger: Logger;
  private currentSession: UserSession | null = null;

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
    this.sessionsPath = path.join(os.homedir(), '.ai-agent', 'sessions');
    this.ensureSessionsDir();
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
      this.logger.info(`Created sessions directory: ${this.sessionsPath}`);
    }
  }

  createSession(userId: string, projectId: string, modelId: string): UserSession {
    const session: UserSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      projectId,
      modelId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      settings: {
        logLevel: 'info',
        autoSave: true,
        theme: 'dark',
      },
    };

    this.currentSession = session;
    this.saveSession(session);
    this.logger.info(`Session created: ${session.sessionId}`);

    return session;
  }

  private saveSession(session: UserSession): void {
    try {
      const sessionFile = path.join(this.sessionsPath, `${session.sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf-8');
      this.logger.debug(`Session saved: ${session.sessionId}`);
    } catch (error) {
      this.logger.error(`Error saving session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateSessionActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date().toISOString();
      this.saveSession(this.currentSession);
    }
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  getSessions(): UserSession[] {
    try {
      const files = fs.readdirSync(this.sessionsPath).filter((f) => f.endsWith('.json'));
      const sessions: UserSession[] = [];

      for (const file of files) {
        const filePath = path.join(this.sessionsPath, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        sessions.push(JSON.parse(data));
      }

      return sessions.sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } catch (error) {
      this.logger.error(`Error reading sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  archiveSession(sessionId: string): boolean {
    try {
      const sessionFile = path.join(this.sessionsPath, `${sessionId}.json`);
      const archivePath = path.join(this.sessionsPath, 'archive');

      if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath, { recursive: true });
      }

      const archivedFile = path.join(archivePath, `${sessionId}_archived.json`);
      fs.renameSync(sessionFile, archivedFile);
      this.logger.info(`Session archived: ${sessionId}`);

      return true;
    } catch (error) {
      this.logger.error(`Error archiving session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  deleteSession(sessionId: string): boolean {
    try {
      const sessionFile = path.join(this.sessionsPath, `${sessionId}.json`);

      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        this.logger.info(`Session deleted: ${sessionId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error deleting session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    oldestSession: string | null;
    newestSession: string | null;
  } {
    const sessions = this.getSessions();

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => {
        const lastActivity = new Date(s.lastActivity).getTime();
        const oneHourAgo = Date.now() - 3600000;
        return lastActivity > oneHourAgo;
      }).length,
      oldestSession: sessions.length > 0 ? sessions[sessions.length - 1].createdAt : null,
      newestSession: sessions.length > 0 ? sessions[0].createdAt : null,
    };
  }
}
