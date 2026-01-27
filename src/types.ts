// src/types.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface ConversationContext {
  messages: Message[];
  sessionId: string;
  createdAt: Date;
}

export interface FileOperationRequest {
  type: 'file' | 'command' | 'chat';
  action?: string; // For file operations
  path?: string;
  content?: string;
  options?: Record<string, any>;
}

export interface FileOperationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

