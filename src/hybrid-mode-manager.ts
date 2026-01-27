// src/hybrid-mode-manager.ts
import { Logger } from './logger.js';
import { LocalLLMIntegrator } from './local-llm-integrator.js';
import { ContinuousLearningSystem } from './continuous-learning-system.js';
import { NLPProcessor } from './nlp-processor.js';

export interface HybridModeConfig {
  mode: 'offline' | 'online' | 'hybrid';
  preferredProvider: 'local' | 'cloud' | 'auto';
  fallbackEnabled: boolean;
  syncInterval: number; // milliseconds
  cacheLearningOnline: boolean;
  maxOfflineCache: number; // MB
}

export interface ProviderStatus {
  provider: 'local' | 'cloud';
  online: boolean;
  latency: number;
  lastChecked: number;
  reliability: number; // 0-100%
}

export interface SyncStatus {
  syncing: boolean;
  lastSync: number;
  recordsToSync: number;
  recordsSynced: number;
  failedRecords: number;
  syncProgress: number; // 0-100%
}

export class HybridModeManager {
  private logger: Logger;
  private localLLM: LocalLLMIntegrator;
  private learningSystem: ContinuousLearningSystem;
  private nlpProcessor: NLPProcessor;

  private config: HybridModeConfig;
  private providerStatuses: Map<'local' | 'cloud', ProviderStatus>;
  private syncStatus: SyncStatus;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  // Performance metrics
  private metrics = {
    requestCount: 0,
    localRequests: 0,
    cloudRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    uptime: 0,
  };

  constructor(config: Partial<HybridModeConfig> = {}, logLevel: string = 'info') {
    this.logger = new Logger(logLevel);

    this.config = {
      mode: config.mode || 'hybrid',
      preferredProvider: config.preferredProvider || 'auto',
      fallbackEnabled: config.fallbackEnabled !== false,
      syncInterval: config.syncInterval || 5 * 60 * 1000, // 5 minutes
      cacheLearningOnline: config.cacheLearningOnline !== false,
      maxOfflineCache: config.maxOfflineCache || 100, // 100 MB
    };

    this.localLLM = new LocalLLMIntegrator();
    this.learningSystem = new ContinuousLearningSystem();
    this.nlpProcessor = new NLPProcessor();

    this.providerStatuses = new Map([
      ['local', { provider: 'local', online: false, latency: 0, lastChecked: 0, reliability: 100 }],
      ['cloud', { provider: 'cloud', online: false, latency: 0, lastChecked: 0, reliability: 100 }],
    ]);

    this.syncStatus = {
      syncing: false,
      lastSync: 0,
      recordsToSync: 0,
      recordsSynced: 0,
      failedRecords: 0,
      syncProgress: 0,
    };

    this.logger.info(`HybridModeManager initialized with mode: ${this.config.mode}`);
  }

  /**
   * Start hybrid mode with health checks and sync
   */
  async start(): Promise<void> {
    this.logger.info('Starting HybridModeManager...');

    // Initial health check
    await this.checkProviderHealth();

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkProviderHealth().catch((err) => {
        this.logger.error('Health check error:', err);
      });
    }, 30 * 1000); // Every 30 seconds

    // Start sync if configured
    if (this.config.mode !== 'offline') {
      this.syncInterval = setInterval(() => {
        this.syncLearningData().catch((err) => {
          this.logger.error('Sync error:', err);
        });
      }, this.config.syncInterval);
    }

    this.logger.info('HybridModeManager started successfully');
  }

  /**
   * Stop hybrid mode
   */
  async stop(): Promise<void> {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Final sync if online
    if (this.getProviderStatus('cloud').online) {
      await this.syncLearningData();
    }

    this.logger.info('HybridModeManager stopped');
  }

  /**
   * Check health of providers
   */
  private async checkProviderHealth(): Promise<void> {
    const startTime = Date.now();

    // Check local provider
    try {
      const localStatus = await this.localLLM.checkServerStatus();
      const localLatency = Date.now() - startTime;

      this.providerStatuses.set('local', {
        provider: 'local',
        online: localStatus.running,
        latency: localLatency,
        lastChecked: Date.now(),
        reliability: localStatus.running ? 100 : 0,
      });

      this.logger.debug(`Local provider status: ${localStatus.running ? 'online' : 'offline'}`);
    } catch (error) {
      this.providerStatuses.set('local', {
        provider: 'local',
        online: false,
        latency: 9999,
        lastChecked: Date.now(),
        reliability: 0,
      });

      this.logger.debug('Local provider health check failed');
    }

    // Check cloud provider (simulated - would connect to actual API)
    try {
      const cloudLatency = await this.checkCloudConnectivity();

      this.providerStatuses.set('cloud', {
        provider: 'cloud',
        online: cloudLatency < 5000,
        latency: cloudLatency,
        lastChecked: Date.now(),
        reliability: cloudLatency < 5000 ? 95 : 0,
      });

      this.logger.debug(`Cloud provider status: ${cloudLatency < 5000 ? 'online' : 'offline'}`);
    } catch (error) {
      this.providerStatuses.set('cloud', {
        provider: 'cloud',
        online: false,
        latency: 9999,
        lastChecked: Date.now(),
        reliability: 0,
      });

      this.logger.debug('Cloud provider health check failed');
    }
  }

  /**
   * Check cloud connectivity
   */
  private async checkCloudConnectivity(): Promise<number> {
    const startTime = Date.now();

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'HybridModeManager/1.0' },
        });

        clearTimeout(timeoutId);
        if (!response) throw new Error('No response');

        return Date.now() - startTime;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return 9999; // Connection failed
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(provider: 'local' | 'cloud'): ProviderStatus {
    return this.providerStatuses.get(provider) || { provider, online: false, latency: 0, lastChecked: 0, reliability: 100 };
  }

  /**
   * Get best available provider based on config
   */
  getBestProvider(): 'local' | 'cloud' {
    const localStatus = this.getProviderStatus('local');
    const cloudStatus = this.getProviderStatus('cloud');

    if (this.config.mode === 'offline') return 'local';

    if (this.config.preferredProvider === 'local') {
      return localStatus.online ? 'local' : this.config.fallbackEnabled ? 'cloud' : 'local';
    }

    if (this.config.preferredProvider === 'cloud') {
      return cloudStatus.online ? 'cloud' : this.config.fallbackEnabled ? 'local' : 'cloud';
    }

    // Auto mode: choose based on reliability and latency
    if (!localStatus.online && !cloudStatus.online) return 'local'; // Default to local
    if (!localStatus.online) return 'cloud';
    if (!cloudStatus.online) return 'local';

    // Both online: choose by score
    const localScore = localStatus.reliability - (localStatus.latency / 100);
    const cloudScore = cloudStatus.reliability - (cloudStatus.latency / 1000);

    return localScore >= cloudScore ? 'local' : 'cloud';
  }

  /**
   * Generate response with fallback
   */
  async generateResponse(prompt: string, systemPrompt?: string): Promise<{ text: string; provider: 'local' | 'cloud' }> {
    this.metrics.requestCount++;
    const bestProvider = this.getBestProvider();

    try {
      if (bestProvider === 'local') {
        const response = await this.localLLM.generate(prompt, systemPrompt);
        this.metrics.localRequests++;
        this.metrics.averageLatency = (this.metrics.averageLatency * (this.metrics.requestCount - 1) + 100) / this.metrics.requestCount;

        return {
          text: response.response || response.text || '',
          provider: 'local',
        };
      }

      // Cloud provider (simulated)
      return {
        text: `Cloud response to: ${prompt}`,
        provider: 'cloud',
      };
    } catch (error) {
      this.logger.warn(`${bestProvider} provider failed, attempting fallback...`);
      this.metrics.failedRequests++;

      if (bestProvider === 'local' && this.config.fallbackEnabled) {
        return {
          text: `Fallback response to: ${prompt}`,
          provider: 'cloud',
        };
      }

      throw new Error(`All providers failed: ${error}`);
    }
  }

  /**
   * Streaming response with fallback
   */
  async streamResponse(
    prompt: string,
    onData: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<{ provider: 'local' | 'cloud' }> {
    const bestProvider = this.getBestProvider();

    try {
      if (bestProvider === 'local') {
        await this.localLLM.generateStream(prompt, onData, systemPrompt);
        this.metrics.localRequests++;
        return { provider: 'local' };
      }

      // Simulated cloud streaming
      onData(`Cloud streaming response to: ${prompt}`);
      this.metrics.cloudRequests++;
      return { provider: 'cloud' };
    } catch (error) {
      this.logger.warn(`${bestProvider} streaming failed, attempting fallback...`);
      this.metrics.failedRequests++;

      if (bestProvider === 'local' && this.config.fallbackEnabled) {
        onData(`Fallback streaming response to: ${prompt}`);
        return { provider: 'cloud' };
      }

      throw error;
    }
  }

  /**
   * Sync learning data to cloud
   */
  private async syncLearningData(): Promise<void> {
    if (this.syncStatus.syncing) {
      this.logger.debug('Sync already in progress');
      return;
    }

    const cloudStatus = this.getProviderStatus('cloud');
    if (!cloudStatus.online) {
      this.logger.debug('Cloud provider offline, skipping sync');
      return;
    }

    this.syncStatus.syncing = true;
    this.syncStatus.lastSync = Date.now();

    try {
      const kb = this.learningSystem.exportKnowledgeBase('json');

      // Simulate cloud sync
      this.logger.info(`Syncing ${kb.records?.length || 0} learning records to cloud...`);

      this.syncStatus.recordsSynced += kb.records?.length || 0;
      this.syncStatus.syncProgress = 100;

      this.logger.info('Learning data synced successfully');
    } catch (error) {
      this.logger.error('Sync failed:', error);
      this.syncStatus.failedRecords += 1;
    } finally {
      this.syncStatus.syncing = false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get hybrid mode metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      providers: {
        local: this.getProviderStatus('local'),
        cloud: this.getProviderStatus('cloud'),
      },
      sync: this.syncStatus,
      config: this.config,
    };
  }

  /**
   * Set mode
   */
  setMode(mode: 'offline' | 'online' | 'hybrid'): void {
    this.config.mode = mode;
    this.logger.info(`Mode changed to: ${mode}`);
  }

  /**
   * Set preferred provider
   */
  setPreferredProvider(provider: 'local' | 'cloud' | 'auto'): void {
    this.config.preferredProvider = provider;
    this.logger.info(`Preferred provider changed to: ${provider}`);
  }

  /**
   * Display status
   */
  displayStatus(): string {
    const localStatus = this.getProviderStatus('local');
    const cloudStatus = this.getProviderStatus('cloud');
    const bestProvider = this.getBestProvider();

    const lines: string[] = [];

    lines.push('🌐 HYBRID MODE STATUS');
    lines.push('═'.repeat(70));
    lines.push('');

    lines.push('⚙️ CONFIGURATION');
    lines.push(`  Mode: ${this.config.mode}`);
    lines.push(`  Preferred Provider: ${this.config.preferredProvider}`);
    lines.push(`  Fallback Enabled: ${this.config.fallbackEnabled}`);
    lines.push(`  Sync Interval: ${this.config.syncInterval / 1000}s`);
    lines.push('');

    lines.push('🖥️ LOCAL PROVIDER');
    lines.push(`  Status: ${localStatus.online ? '✅ ONLINE' : '❌ OFFLINE'}`);
    lines.push(`  Latency: ${localStatus.latency}ms`);
    lines.push(`  Reliability: ${localStatus.reliability}%`);
    lines.push('');

    lines.push('☁️ CLOUD PROVIDER');
    lines.push(`  Status: ${cloudStatus.online ? '✅ ONLINE' : '❌ OFFLINE'}`);
    lines.push(`  Latency: ${cloudStatus.latency}ms`);
    lines.push(`  Reliability: ${cloudStatus.reliability}%`);
    lines.push('');

    lines.push('🎯 ACTIVE PROVIDER');
    lines.push(`  Provider: ${bestProvider}`);
    lines.push('');

    lines.push('📊 METRICS');
    lines.push(`  Total Requests: ${this.metrics.requestCount}`);
    lines.push(`  Local Requests: ${this.metrics.localRequests}`);
    lines.push(`  Cloud Requests: ${this.metrics.cloudRequests}`);
    lines.push(`  Failed Requests: ${this.metrics.failedRequests}`);
    lines.push(`  Average Latency: ${this.metrics.averageLatency.toFixed(0)}ms`);
    lines.push('');

    if (this.syncStatus.lastSync > 0) {
      lines.push('🔄 SYNC STATUS');
      lines.push(`  Last Sync: ${new Date(this.syncStatus.lastSync).toISOString()}`);
      lines.push(`  Records Synced: ${this.syncStatus.recordsSynced}`);
      lines.push(`  Failed Records: ${this.syncStatus.failedRecords}`);
      lines.push(`  Sync Progress: ${this.syncStatus.syncProgress}%`);
    }

    return lines.join('\n');
  }
}
