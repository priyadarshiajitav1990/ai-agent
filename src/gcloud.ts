// src/gcloud.ts
import { Resource } from '@google-cloud/resource-manager';
import { google } from 'googleapis';
import { Logger } from './logger.js';
import { Credentials } from './auth.js';

export interface GCPProject {
  projectId: string;
  projectName: string;
  createTime?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export class GoogleCloudIntegration {
  private logger: Logger;
  private credentials: Credentials | null = null;
  private projects: GCPProject[] = [];

  constructor(logLevel: string = 'info') {
    this.logger = new Logger(logLevel);
  }

  setCredentials(credentials: Credentials): void {
    this.credentials = credentials;
    this.logger.info('Google Cloud credentials set');
  }

  async getProjects(): Promise<GCPProject[]> {
    if (!this.credentials) {
      this.logger.error('No credentials available');
      return [];
    }

    try {
      const cloudresourcemanager = google.cloudresourcemanager({
        version: 'v1',
        auth: this.getAuthClient(),
      });

      this.logger.info('Fetching GCP projects...');

      const response = await cloudresourcemanager.projects.list();
      const projects = response.data.projects || [];

      this.projects = projects.map((project: any) => ({
        projectId: project.projectId,
        projectName: project.name,
        createTime: project.createTime,
      }));

      this.logger.info(`Found ${this.projects.length} projects`);
      return this.projects;
    } catch (error) {
      this.logger.error('Error fetching projects: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return [];
    }
  }

  async getAvailableModels(projectId: string): Promise<AIModel[]> {
    const models: AIModel[] = [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
      },
      {
        id: 'gemini-2.0-pro',
        name: 'Gemini 2.0 Pro',
        provider: 'google',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
      },
      {
        id: 'text-bison-32k',
        name: 'PaLM 2 (Text Bison)',
        provider: 'google',
      },
      {
        id: 'code-bison',
        name: 'PaLM 2 (Code Bison)',
        provider: 'google',
      },
    ];

    this.logger.info(`Available models for project ${projectId}: ${models.length}`);
    return models;
  }

  private getAuthClient(): any {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: this.credentials?.access_token,
      refresh_token: this.credentials?.refresh_token,
      expiry_date: this.credentials?.expiry_date,
    });

    return oauth2Client;
  }

  async enableAPIServices(projectId: string): Promise<boolean> {
    try {
      const servicemanagement = google.servicemanagement({
        version: 'v1',
        auth: this.getAuthClient(),
      });

      const requiredServices = [
        'aiplatform.googleapis.com',
        'compute.googleapis.com',
        'cloudbuild.googleapis.com',
      ];

      this.logger.info(`Enabling services for project ${projectId}`);

      for (const service of requiredServices) {
        this.logger.info(`Enabling service: ${service}`);
        // Service enablement would happen here
      }

      return true;
    } catch (error) {
      this.logger.error('Error enabling services: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  getSelectedProject(): GCPProject | null {
    return this.projects.length > 0 ? this.projects[0] : null;
  }
}
