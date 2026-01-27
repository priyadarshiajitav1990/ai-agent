// src/config.ts
export interface Config {
  apiKey: string;
  modelName: string;
  agentName: string;
  logLevel: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthRedirectUri?: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  return {
    apiKey,
    modelName: process.env.MODEL_NAME || 'gemini-2.0-flash',
    agentName: process.env.AGENT_NAME || 'CodeAssistant',
    logLevel: process.env.LOG_LEVEL || 'info',
    oauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    oauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  };
}
