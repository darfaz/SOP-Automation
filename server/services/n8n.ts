import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../logger";
import { type Automation, type SOP } from "@shared/schema";
import crypto from 'crypto';

// Configure axios retry logic
const n8nAxios = axios.create({
  baseURL: process.env.N8N_API_URL || "http://localhost:5678/api/v1",
  timeout: 10000,
});

axiosRetry(n8nAxios, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); 
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response?.status >= 500) || false;
  }
});

interface AutomationPattern {
  keywords: string[];
  name: string;
  description: string;
  nodes: string[];
  setupComplexity: 'low' | 'medium' | 'high';
}

const AUTOMATION_PATTERNS: AutomationPattern[] = [
  {
    keywords: ['email', 'send', 'notify', 'message'],
    name: 'Email Notification',
    description: 'Automatically send email notifications',
    nodes: ['Email', 'Gmail'],
    setupComplexity: 'low'
  },
  {
    keywords: ['slack', 'chat', 'message', 'notify', 'team'],
    name: 'Slack Integration',
    description: 'Send notifications and updates to Slack channels',
    nodes: ['Slack'],
    setupComplexity: 'low'
  },
  {
    keywords: ['spreadsheet', 'excel', 'data', 'record', 'track'],
    name: 'Spreadsheet Automation',
    description: 'Automatically update and manage spreadsheet data',
    nodes: ['Google Sheets', 'Excel Online'],
    setupComplexity: 'medium'
  },
  {
    keywords: ['calendar', 'schedule', 'meeting', 'appointment'],
    name: 'Calendar Management',
    description: 'Automate calendar events and scheduling',
    nodes: ['Google Calendar', 'Outlook Calendar'],
    setupComplexity: 'medium'
  },
  {
    keywords: ['form', 'survey', 'collect', 'input'],
    name: 'Form Processing',
    description: 'Automate form submission handling and data collection',
    nodes: ['Google Forms', 'TypeForm', 'Webhook'],
    setupComplexity: 'medium'
  }
];

export class N8nService {
  private connected: boolean = false;
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.N8N_API_KEY;
    logger.info("[n8n] Initializing service with API key:", this.apiKey ? "Present" : "Missing");
  }

  private async checkConnection(): Promise<void> {
    if (!this.apiKey) {
      logger.error("[n8n] Error: API Key not configured");
      throw new Error("n8n API Key not configured");
    }

    try {
      logger.info("[n8n] Attempting to connect to API...");
      await n8nAxios.get("/workflows", {
        headers: {
          "X-N8N-API-KEY": this.apiKey,
          "Accept": "application/json"
        }
      });
      this.connected = true;
      logger.info("[n8n] Successfully connected to API");
    } catch (error) {
      this.connected = false;
      if (axios.isAxiosError(error)) {
        logger.error("[n8n] Connection failed:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  private analyzeStep(step: string): AutomationPattern[] {
    const lowerStep = step.toLowerCase();
    return AUTOMATION_PATTERNS.filter(pattern => 
      pattern.keywords.some(keyword => lowerStep.includes(keyword))
    );
  }

  public async suggestAutomations(sop: SOP): Promise<Partial<Automation>[]> {
    if (!this.connected) {
      logger.info("[n8n] No active connection, attempting to connect...");
      await this.checkConnection();
    }

    try {
      logger.info("[n8n] Analyzing SOP for automation suggestions:", sop.id);

      // Analyze each step for automation opportunities
      const stepAnalysis = sop.steps.map((step, index) => ({
        step,
        index,
        patterns: this.analyzeStep(step)
      }));

      // Group suggestions by automation type to avoid duplicates
      const uniqueSuggestions = new Map<string, AutomationPattern>();
      stepAnalysis.forEach(analysis => {
        analysis.patterns.forEach(pattern => {
          if (!uniqueSuggestions.has(pattern.name)) {
            uniqueSuggestions.set(pattern.name, pattern);
          }
        });
      });

      // Convert suggestions to automation objects
      const suggestions = Array.from(uniqueSuggestions.values()).map(pattern => ({
        name: `${sop.title} - ${pattern.name}`,
        description: `${pattern.description} for steps: ${stepAnalysis
          .filter(analysis => analysis.patterns.some(p => p.name === pattern.name))
          .map(analysis => analysis.index + 1)
          .join(', ')}`,
        status: "suggested",
        workflowId: null,
        connectedApps: pattern.nodes,
        sopId: sop.id,
        setupComplexity: pattern.setupComplexity
      }));

      logger.info(`[n8n] Generated ${suggestions.length} automation suggestions for SOP ${sop.id}`);
      return suggestions;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("[n8n] Failed to analyze SOP:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  public async createAutomation(sop: SOP, nodes: string[]): Promise<Automation> {
    if (!this.connected) {
      await this.checkConnection();
    }

    try {
      logger.info("[n8n] Creating automation workflow for SOP:", sop.id);

      // For now, we'll create a simulated workflow
      // In production, this would make actual API calls to n8n
      return {
        id: crypto.randomUUID(),
        name: `${sop.title} Automation`,
        workflowId: crypto.randomUUID(),
        status: "active",
        connectedApps: nodes,
        sopId: sop.id,
        userId: sop.createdBy,
        createdAt: new Date()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("[n8n] Failed to create workflow:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }
}

export const n8nService = new N8nService();