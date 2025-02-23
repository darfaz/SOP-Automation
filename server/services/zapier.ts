import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../logger";
import { type Automation, type SOP } from "@shared/schema";

// Configure axios retry logic
const zapierAxios = axios.create({
  baseURL: "https://api.zapier.com/v2",
  timeout: 10000,
});

axiosRetry(zapierAxios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response?.status !== undefined && error.response.status >= 500);
  }
});

export class ZapierService {
  private connected: boolean = false;
  private deployKey?: string;

  constructor() {
    this.deployKey = process.env.ZAPIER_DEPLOY_KEY;
    // Add initial connection log
    console.log("[Zapier] Initializing service with deploy key:", this.deployKey ? "Present" : "Missing");
  }

  private async checkConnection(): Promise<void> {
    if (!this.deployKey) {
      console.log("[Zapier] Error: Deploy Key not configured");
      throw new Error("Zapier Deploy Key not configured");
    }

    try {
      console.log("[Zapier] Attempting to connect to API...");
      await zapierAxios.get("/deploy/status", {
        headers: {
          "X-Deploy-Key": this.deployKey,
          "Content-Type": "application/json"
        }
      });
      this.connected = true;
      console.log("[Zapier] Successfully connected to API");
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
      const response = await zapierAxios.post(
        "/suggestions/zaps",
        {
          context: {
            title: sop.title,
            description: sop.description,
            steps: sop.steps
          }
        },
        {
          headers: {
            "X-Deploy-Key": this.deployKey,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("[Zapier] Successfully received suggestions");
      return response.data.suggestions.map((suggestion: any) => ({
        name: suggestion.title,
        zapId: suggestion.id,
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
}

export const zapierService = new ZapierService();