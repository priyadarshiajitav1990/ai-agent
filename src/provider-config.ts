// src/provider-config.ts
import { Logger } from './logger.js';

export interface ProviderCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  endpoint?: string;
  region?: string;
  projectId?: string;
  customHeaders?: Record<string, string>;
}

export interface ProviderSettings {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  customSettings?: Record<string, any>;
}

export interface ProviderConfiguration {
  id: string;
  name: string;
  type: string;
  credentials: ProviderCredentials;
  settings: ProviderSettings;
  isActive: boolean;
  isPrimary: boolean;
  fallbackProvider?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  lastCheck: number;
  responseTime?: number;
  errorCount: number;
  successCount: number;
  failureRate: number;
}

export class ProviderConfigManager {
  private logger: Logger;
  private configurations: Map<string, ProviderConfiguration> = new Map();
  private activeProvider: string | null = null;
  private healthStatus: Map<string, ProviderHealth> = new Map();
  private readonly PROVIDERS = ['gemini', 'github-copilot', 'microsoft-copilot', 'azure-openai', 'amazon-q', 'openrouter', 'local'];

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  /**
   * Register a new provider configuration
   */
  registerProvider(config: ProviderConfiguration): void {
    if (!this.PROVIDERS.includes(config.type)) {
      this.logger.warn(`Provider type "${config.type}" not officially supported, registering anyway`);
    }

    this.configurations.set(config.id, config);
    this.healthStatus.set(config.id, {
      providerId: config.id,
      isHealthy: true,
      lastCheck: Date.now(),
      errorCount: 0,
      successCount: 0,
      failureRate: 0,
    });

    if (config.isPrimary) {
      this.setActiveProvider(config.id);
    }

    this.logger.info(`Registered provider: ${config.name} (${config.type})`);
  }

  /**
   * Create and register Amazon Q provider
   */
  createAmazonQProvider(
    id: string,
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
      region?: string;
    },
    settings?: ProviderSettings,
    isPrimary?: boolean
  ): ProviderConfiguration {
    const config: ProviderConfiguration = {
      id,
      name: 'Amazon Q',
      type: 'amazon-q',
      credentials: {
        apiKey: credentials.accessKeyId,
        apiSecret: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1',
      },
      settings: settings || {
        modelName: 'amazon.q',
        temperature: 0.7,
        maxTokens: 2048,
      },
      isActive: isPrimary || false,
      isPrimary: isPrimary || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.registerProvider(config);
    return config;
  }

  /**
   * Create and register OpenRouter provider
   */
  createOpenRouterProvider(
    id: string,
    apiKey: string,
    modelName: string = 'openrouter/auto',
    settings?: ProviderSettings,
    isPrimary?: boolean
  ): ProviderConfiguration {
    const config: ProviderConfiguration = {
      id,
      name: 'OpenRouter',
      type: 'openrouter',
      credentials: {
        apiKey,
        endpoint: 'https://openrouter.ai/api/v1',
      },
      settings: settings || {
        modelName,
        temperature: 0.7,
        maxTokens: 2048,
      },
      isActive: isPrimary || false,
      isPrimary: isPrimary || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.registerProvider(config);
    return config;
  }

  /**
   * Create and register local provider
   */
  createLocalProvider(
    id: string,
    endpoint: string,
    modelName: string = 'local-model',
    settings?: ProviderSettings,
    isPrimary?: boolean
  ): ProviderConfiguration {
    const config: ProviderConfiguration = {
      id,
      name: 'Local Model',
      type: 'local',
      credentials: {
        endpoint,
      },
      settings: settings || {
        modelName,
        temperature: 0.7,
        maxTokens: 2048,
      },
      isActive: isPrimary || false,
      isPrimary: isPrimary || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.registerProvider(config);
    return config;
  }

  /**
   * Get provider configuration
   */
  getProvider(providerId: string): ProviderConfiguration | null {
    return this.configurations.get(providerId) || null;
  }

  /**
   * Get active provider
   */
  getActiveProvider(): ProviderConfiguration | null {
    if (!this.activeProvider) return null;
    return this.configurations.get(this.activeProvider) || null;
  }

  /**
   * Set active provider (switch without breaking flow)
   */
  setActiveProvider(providerId: string): boolean {
    const provider = this.configurations.get(providerId);
    if (!provider) {
      this.logger.error(`Provider not found: ${providerId}`);
      return false;
    }

    const oldProvider = this.activeProvider;
    this.activeProvider = providerId;
    provider.isActive = true;

    // Deactivate other providers
    for (const [id, config] of this.configurations.entries()) {
      if (id !== providerId) {
        config.isActive = false;
      }
    }

    this.logger.info(
      `Switched provider from ${oldProvider || 'none'} to ${providerId} (${provider.name}) - Flow preserved`
    );

    return true;
  }

  /**
   * Get fallback provider
   */
  getFallbackProvider(): ProviderConfiguration | null {
    const active = this.getActiveProvider();
    if (!active || !active.fallbackProvider) {
      return this.getNextHealthyProvider();
    }

    return this.configurations.get(active.fallbackProvider) || this.getNextHealthyProvider();
  }

  /**
   * Get next healthy provider
   */
  private getNextHealthyProvider(): ProviderConfiguration | null {
    const providers = Array.from(this.configurations.values())
      .filter((p) => p.id !== this.activeProvider)
      .sort((a, b) => {
        const healthA = this.healthStatus.get(a.id);
        const healthB = this.healthStatus.get(b.id);
        const failureA = healthA?.failureRate || 1;
        const failureB = healthB?.failureRate || 1;
        return failureA - failureB;
      });

    return providers.length > 0 ? providers[0] : null;
  }

  /**
   * Update provider settings
   */
  updateProviderSettings(providerId: string, settings: Partial<ProviderSettings>): boolean {
    const provider = this.configurations.get(providerId);
    if (!provider) {
      this.logger.error(`Provider not found: ${providerId}`);
      return false;
    }

    provider.settings = { ...provider.settings, ...settings };
    provider.updatedAt = Date.now();

    this.logger.info(`Updated settings for provider: ${providerId}`);
    return true;
  }

  /**
   * Update provider credentials
   */
  updateProviderCredentials(providerId: string, credentials: Partial<ProviderCredentials>): boolean {
    const provider = this.configurations.get(providerId);
    if (!provider) {
      this.logger.error(`Provider not found: ${providerId}`);
      return false;
    }

    provider.credentials = { ...provider.credentials, ...credentials };
    provider.updatedAt = Date.now();

    this.logger.info(`Updated credentials for provider: ${providerId}`);
    return true;
  }

  /**
   * Record provider health check
   */
  recordHealthCheck(providerId: string, success: boolean, responseTime?: number): void {
    let health = this.healthStatus.get(providerId);
    if (!health) {
      health = {
        providerId,
        isHealthy: true,
        lastCheck: Date.now(),
        errorCount: 0,
        successCount: 0,
        failureRate: 0,
      };
      this.healthStatus.set(providerId, health);
    }

    if (success) {
      health.successCount++;
    } else {
      health.errorCount++;
    }

    health.responseTime = responseTime;
    health.lastCheck = Date.now();
    health.failureRate = health.errorCount / (health.errorCount + health.successCount);
    health.isHealthy = health.failureRate < 0.3; // Less than 30% failure rate is healthy

    this.logger.debug(
      `Health check for ${providerId}: ${success ? 'success' : 'failed'} (${health.failureRate.toFixed(2)}% failure rate)`
    );
  }

  /**
   * Get provider health status
   */
  getProviderHealth(providerId: string): ProviderHealth | null {
    return this.healthStatus.get(providerId) || null;
  }

  /**
   * Get all providers
   */
  getAllProviders(): ProviderConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get all active providers
   */
  getActiveProviders(): ProviderConfiguration[] {
    return Array.from(this.configurations.values()).filter((p) => p.isActive);
  }

  /**
   * Get all healthy providers
   */
  getHealthyProviders(): ProviderConfiguration[] {
    return Array.from(this.configurations.values()).filter((p) => {
      const health = this.healthStatus.get(p.id);
      return health?.isHealthy !== false;
    });
  }

  /**
   * Remove provider
   */
  removeProvider(providerId: string): boolean {
    if (this.activeProvider === providerId) {
      const fallback = this.getFallbackProvider();
      if (fallback) {
        this.setActiveProvider(fallback.id);
      } else {
        this.activeProvider = null;
      }
    }

    this.configurations.delete(providerId);
    this.healthStatus.delete(providerId);

    this.logger.info(`Removed provider: ${providerId}`);
    return true;
  }

  /**
   * Display providers as formatted text
   */
  displayProviders(): string {
    const lines: string[] = [];

    lines.push('🔧 PROVIDER CONFIGURATION');
    lines.push('═'.repeat(70));

    if (this.configurations.size === 0) {
      lines.push('No providers configured');
      return lines.join('\n');
    }

    for (const [id, provider] of this.configurations.entries()) {
      const health = this.healthStatus.get(id);
      const activeIcon = provider.isActive ? '✅' : '⚪';
      const primaryIcon = provider.isPrimary ? '⭐' : '';
      const healthIcon = health?.isHealthy ? '💚' : '💔';

      lines.push(`${activeIcon} ${primaryIcon} ${provider.name} (${provider.type})`);
      lines.push(`   ID: ${id}`);
      lines.push(`   Model: ${provider.settings.modelName || 'default'}`);
      lines.push(`   Fallback: ${provider.fallbackProvider || 'none'}`);

      if (health) {
        lines.push(`   ${healthIcon} Health: Success: ${health.successCount}, Errors: ${health.errorCount}`);
        lines.push(`   Failure Rate: ${(health.failureRate * 100).toFixed(1)}%`);
        if (health.responseTime) {
          lines.push(`   Response Time: ${health.responseTime}ms`);
        }
      }

      lines.push('');
    }

    lines.push('📊 ACTIVE PROVIDER');
    lines.push('═'.repeat(70));
    if (this.activeProvider) {
      const active = this.configurations.get(this.activeProvider)!;
      lines.push(`${active.name} (${active.type})`);
    } else {
      lines.push('None');
    }

    return lines.join('\n');
  }

  /**
   * Get supported provider types
   */
  getSupportedProviders(): string[] {
    return this.PROVIDERS;
  }

  /**
   * Add custom provider type
   */
  registerCustomProvider(type: string): void {
    if (!this.PROVIDERS.includes(type)) {
      this.PROVIDERS.push(type);
      this.logger.info(`Registered custom provider type: ${type}`);
    }
  }
}
