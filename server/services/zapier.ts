import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../logger";
import { type Automation, type SOP } from "@shared/schema";

// Configure axios retry logic
const zapierAxios = axios.create({
  baseURL: "https://api.zapier.com/v1/partner",  // Partner API endpoint
  timeout: 10000,
});

axiosRetry(zapierAxios, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); 
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

export class ZapierService {
  private connected: boolean = false;
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.ZAPIER_DEPLOY_KEY;
    console.log("[Zapier] Initializing service with Partner API key:", this.apiKey ? "Present" : "Missing");
  }

  private async checkConnection(): Promise<void> {
    if (!this.apiKey) {
      console.log("[Zapier] Error: Partner API Key not configured");
      throw new Error("Zapier Partner API Key not configured");
    }

    try {
      console.log("[Zapier] Attempting to connect to Partner API...");
      await zapierAxios.get("/exposed", {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json"
        }
      });
      this.connected = true;
      console.log("[Zapier] Successfully connected to Partner API");
    } catch (error) {
      this.connected = false;
      if (axios.isAxiosError(error)) {
        console.log("[Zapier] Connection failed:", {
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
      console.log("[Zapier] No active connection, attempting to connect...");
      await this.checkConnection();
    }

    try {
      console.log("[Zapier] Requesting automation suggestions for SOP:", sop.id);

      // First, analyze the SOP content to identify potential automation triggers and actions
      const analysisResponse = await zapierAxios.post(
        "/suggest",
        {
          context: {
            task_description: sop.title,
            workflow_steps: sop.steps,
            additional_context: sop.description
          }
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const suggestions = analysisResponse.data.suggestions || [];

      // Map the suggestions to our automation format
      return suggestions.map((suggestion: any) => ({
        name: `${sop.title} - ${suggestion.name}`,
        zapId: suggestion.zap_template_id,
        status: "suggested",
        connectedApps: suggestion.apps,
        sopId: sop.id
      }));

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("[Zapier] Failed to get suggestions:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  public async createAutomation(sop: SOP, zapTemplateId: string): Promise<Automation> {
    if (!this.connected) {
      await this.checkConnection();
    }

    try {
      const response = await zapierAxios.post(
        "/zaps/create",
        {
          template_id: zapTemplateId,
          name: `${sop.title} Automation`,
          description: sop.description
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        id: response.data.id,
        name: response.data.title,
        zapId: response.data.zap_id,
        status: response.data.status,
        connectedApps: response.data.connected_apps,
        sopId: sop.id,
        userId: sop.createdBy,
        createdAt: new Date()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("[Zapier] Failed to create automation:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }
}

export const zapierService = new ZapierService();