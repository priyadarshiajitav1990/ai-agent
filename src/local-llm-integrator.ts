// src/local-llm-integrator.ts
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

export interface LLMConfig {
  modelName: string;
  endpoint: string;
  port: number;
  gpuEnabled: boolean;
  contextSize: number;
  temperature: number;
  topP: number;
  maxTokens: number;
  quantization: 'none' | 'q4_0' | 'q4_1' | 'q5_0' | 'q5_1' | 'q8_0';
}

export interface LLMResponse {
  text: string;
  tokens: number;
  processingTime: number;
  model: string;
  success: boolean;
  error?: string;
}

export interface ModelInfo {
  name: string;
  size: string;
  parameters: string;
  type: 'instruct' | 'chat' | 'code' | 'multilingual';
  licensce: string;
  downloadUrl: string;
  installed: boolean;
  recommended: boolean;
}

export class LocalLLMIntegrator {
  private logger: Logger;
  private config: LLMConfig;
  private isRunning: boolean = false;
  private modelProcess: any = null;
  private modelsDirectory: string;

  // List of best open-source models
  private readonly AVAILABLE_MODELS: ModelInfo[] = [
    {
      name: 'Mistral 7B',
      size: '4GB (q4)',
      parameters: '7 billion',
      type: 'instruct',
      licensce: 'Apache 2.0',
      downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
      installed: false,
      recommended: true,
    },
    {
      name: 'Llama 2 7B Chat',
      size: '3.8GB (q4)',
      parameters: '7 billion',
      type: 'chat',
      licensce: 'Llama 2 Community License',
      downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF',
      installed: false,
      recommended: true,
    },
    {
      name: 'Llama 2 13B Chat',
      size: '7.4GB (q4)',
      parameters: '13 billion',
      type: 'chat',
      licensce: 'Llama 2 Community License',
      downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-13B-Chat-GGUF',
      installed: false,
      recommended: true,
    },
    {
      name: 'Neural Chat 7B',
      size: '3.8GB (q4)',
      parameters: '7 billion',
      type: 'chat',
      licensce: 'Apache 2.0',
      downloadUrl: 'https://huggingface.co/TheBloke/neural-chat-7B-v3-3-GGUF',
      installed: false,
      recommended: false,
    },
    {
      name: 'Orca Mini 7B',
      size: '3.8GB (q4)',
      parameters: '7 billion',
      type: 'instruct',
      licensce: 'Apache 2.0',
      downloadUrl: 'https://huggingface.co/TheBloke/orca-mini-7b-gguf',
      installed: false,
      recommended: false,
    },
    {
      name: 'Phi 2.7B',
      size: '1.6GB (q4)',
      parameters: '2.7 billion',
      type: 'instruct',
      licensce: 'MIT',
      downloadUrl: 'https://huggingface.co/TheBloke/phi-2-GGUF',
      installed: false,
      recommended: true,
    },
  ];

  constructor(
    logLevel: string = 'info',
    modelName: string = 'Mistral 7B',
    modelsDir?: string
  ) {
    this.logger = new Logger(logLevel);
    this.modelsDirectory = modelsDir || path.join(process.cwd(), '.local-models');
    this.ensureModelsDirectory();

    // Default configuration for Mistral 7B
    this.config = {
      modelName,
      endpoint: 'http://localhost',
      port: 11434,
      gpuEnabled: this.detectGPU(),
      contextSize: 4096,
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
      quantization: 'q4_0',
    };

    this.logger.info(`LocalLLMIntegrator initialized with model: ${modelName}`);
  }

  /**
   * Ensure models directory exists
   */
  private ensureModelsDirectory(): void {
    if (!fs.existsSync(this.modelsDirectory)) {
      fs.mkdirSync(this.modelsDirectory, { recursive: true });
      this.logger.info(`Created models directory: ${this.modelsDirectory}`);
    }
  }

  /**
   * Detect if GPU is available
   */
  private detectGPU(): boolean {
    try {
      // Check for NVIDIA CUDA
      const { execSync } = require('child_process');
      const output = execSync('nvidia-smi -L 2>/dev/null || echo "no-gpu"', {
        encoding: 'utf8',
      });
      return !output.includes('no-gpu');
    } catch {
      return false;
    }
  }

  /**
   * Start local LLM server (Ollama)
   */
  async startLocalServer(): Promise<boolean> {
    try {
      if (this.isRunning) {
        this.logger.warn('Local LLM server already running');
        return true;
      }

      this.logger.info('Starting local LLM server (Ollama)...');

      // Check if Ollama is installed
      const { execSync } = require('child_process');
      try {
        execSync('which ollama', { encoding: 'utf8' });
      } catch {
        this.logger.error('Ollama not found. Please install from: https://ollama.ai');
        return false;
      }

      // Start Ollama server
      this.modelProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      });

      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.isRunning = true;
      this.logger.info(`Local LLM server started on ${this.config.endpoint}:${this.config.port}`);

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to start local LLM server: ${error.message}`);
      return false;
    }
  }

  /**
   * Pull model from registry (requires Ollama)
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      this.logger.info(`Pulling model: ${modelName}...`);

      const { execSync } = require('child_process');
      const output = execSync(`ollama pull ${modelName}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      this.logger.info(`Model pulled successfully: ${modelName}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to pull model: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate response from local model
   */
  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      if (!this.isRunning) {
        const started = await this.startLocalServer();
        if (!started) {
          return {
            text: '',
            tokens: 0,
            processingTime: 0,
            model: this.config.modelName,
            success: false,
            error: 'Local LLM server not running',
          };
        }
      }

      // Build request to Ollama
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const requestBody = {
        model: this.getOllamaModelName(),
        prompt: fullPrompt,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.maxTokens,
        stream: false,
      };

      const response = await fetch(`${this.config.endpoint}:${this.config.port}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        text: data.response || '',
        tokens: data.eval_count || 0,
        processingTime,
        model: this.config.modelName,
        success: true,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Generation failed: ${error.message}`);

      return {
        text: '',
        tokens: 0,
        processingTime,
        model: this.config.modelName,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Ollama model name from config
   */
  private getOllamaModelName(): string {
    const mapping: Record<string, string> = {
      'Mistral 7B': 'mistral',
      'Llama 2 7B Chat': 'llama2',
      'Llama 2 13B Chat': 'llama2:13b',
      'Neural Chat 7B': 'neural-chat',
      'Orca Mini 7B': 'orca-mini',
      'Phi 2.7B': 'phi',
    };

    return mapping[this.config.modelName] || 'mistral';
  }

  /**
   * Stream response from local model
   */
  async generateStream(
    prompt: string,
    onData: (chunk: string) => void,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      if (!this.isRunning) {
        const started = await this.startLocalServer();
        if (!started) {
          return {
            text: '',
            tokens: 0,
            processingTime: 0,
            model: this.config.modelName,
            success: false,
            error: 'Local LLM server not running',
          };
        }
      }

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const requestBody = {
        model: this.getOllamaModelName(),
        prompt: fullPrompt,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.maxTokens,
        stream: true,
      };

      const response = await fetch(`${this.config.endpoint}:${this.config.port}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullText = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line);
            onData(data.response || '');
            fullText += data.response || '';
            totalTokens = data.eval_count || totalTokens;
          }
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        text: fullText,
        tokens: totalTokens,
        processingTime,
        model: this.config.modelName,
        success: true,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Stream generation failed: ${error.message}`);

      return {
        text: '',
        tokens: 0,
        processingTime,
        model: this.config.modelName,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('LLM configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * Get list of available models
   */
  getAvailableModels(): ModelInfo[] {
    return this.AVAILABLE_MODELS.map((model) => ({
      ...model,
      installed: this.isModelInstalled(model.name),
    }));
  }

  /**
   * Check if model is installed
   */
  private isModelInstalled(modelName: string): boolean {
    const modelPath = path.join(this.modelsDirectory, modelName.replace(/\s+/g, '-').toLowerCase());
    return fs.existsSync(modelPath);
  }

  /**
   * Get recommended models
   */
  getRecommendedModels(): ModelInfo[] {
    return this.getAvailableModels().filter((m) => m.recommended);
  }

  /**
   * Check local server status
   */
  async checkServerStatus(): Promise<{ running: boolean; healthy: boolean; latency: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.endpoint}:${this.config.port}/api/tags`, {
        timeout: 5000,
      } as any);

      const latency = Date.now() - startTime;

      return {
        running: response.ok,
        healthy: response.ok,
        latency,
      };
    } catch {
      return {
        running: false,
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Stop local LLM server
   */
  stopServer(): boolean {
    try {
      if (this.modelProcess) {
        this.modelProcess.kill('SIGTERM');
        this.isRunning = false;
        this.logger.info('Local LLM server stopped');
        return true;
      }
      return false;
    } catch (error: any) {
      this.logger.error(`Failed to stop server: ${error.message}`);
      return false;
    }
  }

  /**
   * Get system info for model selection
   */
  getSystemInfo(): {
    gpuAvailable: boolean;
    cpuCores: number;
    totalMemory: string;
    recommendedModel: string;
  } {
    const os = require('os');
    const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
    const cpuCores = os.cpus().length;

    let recommendedModel = 'Phi 2.7B'; // Smallest, works on any machine
    if (totalMemoryGB > 16 && cpuCores >= 8) {
      recommendedModel = 'Llama 2 13B Chat'; // Best quality
    } else if (totalMemoryGB > 8 && cpuCores >= 4) {
      recommendedModel = 'Mistral 7B'; // Good balance
    } else if (totalMemoryGB > 4) {
      recommendedModel = 'Llama 2 7B Chat'; // Standard
    }

    return {
      gpuAvailable: this.config.gpuEnabled,
      cpuCores,
      totalMemory: `${totalMemoryGB.toFixed(2)} GB`,
      recommendedModel,
    };
  }

  /**
   * Display available models
   */
  displayModels(): string {
    const lines: string[] = [];

    lines.push('🤖 AVAILABLE OPEN-SOURCE MODELS');
    lines.push('═'.repeat(80));
    lines.push('');

    const models = this.getAvailableModels();
    for (const model of models) {
      const rec = model.recommended ? '⭐ RECOMMENDED' : '';
      const inst = model.installed ? '✅ INSTALLED' : '📥 Not installed';
      lines.push(`${rec} ${model.name} (${inst})`);
      lines.push(`  Size: ${model.size} | Params: ${model.parameters}`);
      lines.push(`  Type: ${model.type} | License: ${model.licensce}`);
      lines.push(`  Download: ${model.downloadUrl}`);
      lines.push('');
    }

    lines.push('📊 SYSTEM INFO');
    lines.push('═'.repeat(80));
    const sysInfo = this.getSystemInfo();
    lines.push(`GPU Available: ${sysInfo.gpuAvailable ? 'Yes' : 'No'}`);
    lines.push(`CPU Cores: ${sysInfo.cpuCores}`);
    lines.push(`Total Memory: ${sysInfo.totalMemory}`);
    lines.push(`Recommended Model: ${sysInfo.recommendedModel}`);

    return lines.join('\n');
  }
}
