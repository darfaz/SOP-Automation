import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../logger";
import { type Automation, type SOP } from "@shared/schema";

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
           (error.response && error.response.status >= 500);
  }
});

export class N8nService {
  private connected: boolean = false;
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.N8N_API_KEY;
    console.log("[n8n] Initializing service with API key:", this.apiKey ? "Present" : "Missing");
  }

  private async checkConnection(): Promise<void> {
    if (!this.apiKey) {
      console.log("[n8n] Error: API Key not configured");
      throw new Error("n8n API Key not configured");
    }

    try {
      console.log("[n8n] Attempting to connect to API...");
      await n8nAxios.get("/workflows", {
        headers: {
          "X-N8N-API-KEY": this.apiKey,
          "Accept": "application/json"
        }
      });
      this.connected = true;
      console.log("[n8n] Successfully connected to API");
    } catch (error) {
      this.connected = false;
      if (axios.isAxiosError(error)) {
        console.log("[n8n] Connection failed:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  public async suggestAutomations(sop: SOP): Promise<Partial<Automation>[]> {
    if (!this.connected) {
      console.log("[n8n] No active connection, attempting to connect...");
      await this.checkConnection();
    }

    try {
      console.log("[n8n] Analyzing SOP for automation suggestions:", sop.id);

      // Map SOP steps to potential n8n nodes based on content analysis
      const suggestedNodes = sop.steps.map(step => {
        const lowerStep = step.toLowerCase();
        let nodes = [];
        
        if (lowerStep.includes("email") || lowerStep.includes("send")) {
          nodes.push("Email");
        }
        if (lowerStep.includes("slack") || lowerStep.includes("message")) {
          nodes.push("Slack");
        }
        if (lowerStep.includes("data") || lowerStep.includes("spreadsheet")) {
          nodes.push("Google Sheets");
        }
        
        return nodes;
      }).flat();

      // Create unique suggestions based on identified nodes
      const uniqueNodes = Array.from(new Set(suggestedNodes));
      
      return uniqueNodes.map(node => ({
        name: `${sop.title} - ${node} Integration`,
        workflowId: "", // Will be set when actually created
        status: "suggested",
        connectedApps: [node],
        sopId: sop.id
      }));

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("[n8n] Failed to analyze SOP:", {
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
      // Create a new n8n workflow
      const response = await n8nAxios.post(
        "/workflows",
        {
          name: `${sop.title} Automation`,
          nodes: nodes.map(node => ({
            type: node,
            parameters: {} // Default parameters, to be configured by user in n8n
          })),
          connections: {} // Connections to be configured by user in n8n
        },
        {
          headers: {
            "X-N8N-API-KEY": this.apiKey,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        id: response.data.id,
        name: response.data.name,
        workflowId: response.data.id.toString(),
        status: "active",
        connectedApps: nodes,
        sopId: sop.id,
        userId: sop.createdBy,
        createdAt: new Date()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("[n8n] Failed to create workflow:", {
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
