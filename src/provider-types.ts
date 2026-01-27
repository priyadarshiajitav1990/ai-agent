// src/provider-types.ts
export type AIProvider =
  | 'gemini'
  | 'github-copilot'
  | 'microsoft-copilot'
  | 'azure-openai'
  | 'amazon-q'
  | 'openrouter'
  | 'local';

export interface ProviderConfig {
  id: string;
  name: string;
  type: AIProvider;
  description: string;
  requiresAuth: boolean;
  authUrl?: string;
}

export interface AccountCredential {
  accountId: string;
  provider: AIProvider;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  lastUsed?: string;
}

export interface UserAccount {
  accountId: string;
  provider: AIProvider;
  accountName: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastUsed: string;
}

export interface ProviderResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  provider: AIProvider;
}

export const SUPPORTED_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    description: 'Google Gemini AI (2.0, 1.5, PaLM 2)',
    requiresAuth: true,
    authUrl: 'https://aistudio.google.com/app/apikeys',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    type: 'github-copilot',
    description: 'GitHub Copilot powered by OpenAI',
    requiresAuth: true,
    authUrl: 'https://github.com/login',
  },
  {
    id: 'microsoft-copilot',
    name: 'Microsoft Copilot',
    type: 'microsoft-copilot',
    description: 'Microsoft Copilot Pro',
    requiresAuth: true,
    authUrl: 'https://login.microsoft.com',
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    type: 'azure-openai',
    description: 'Azure OpenAI API Access',
    requiresAuth: true,
    authUrl: 'https://portal.azure.com',
  },
  {
    id: 'amazon-q',
    name: 'Amazon Q',
    type: 'amazon-q',
    description: 'AWS Amazon Q AI Assistant',
    requiresAuth: true,
    authUrl: 'https://aws.amazon.com/q',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openrouter',
    description: 'OpenRouter - Multi-model AI API',
    requiresAuth: true,
    authUrl: 'https://openrouter.ai',
  },
  {
    id: 'local',
    name: 'Local Model',
    type: 'local',
    description: 'Local Language Model (Ollama, LM Studio, etc)',
    requiresAuth: false,
    authUrl: 'http://localhost:11434',
  },
];
