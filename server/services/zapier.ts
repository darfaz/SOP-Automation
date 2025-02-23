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
  }

  private async checkConnection(): Promise<void> {
    if (!this.deployKey) {
      throw new Error("Zapier Deploy Key not configured");
    }

    try {
      await zapierAxios.get("/deploy/status", {
        headers: {
          "X-Deploy-Key": this.deployKey,
          "Content-Type": "application/json"
        }
      });
      this.connected = true;
    } catch (error) {
      this.connected = false;
      logger.error("Failed to connect to Zapier API");
      throw error;
    }
  }

  public async suggestAutomations(sop: SOP): Promise<Partial<Automation>[]> {
    if (!this.connected) {
      await this.checkConnection();
    }

    try {
      // Get relevant Zaps based on SOP steps and context
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

      return response.data.suggestions.map((suggestion: any) => ({
        name: suggestion.title,
        zapId: suggestion.id,
        status: "suggested",
        connectedApps: suggestion.apps,
        sopId: sop.id
      }));
    } catch (error) {
      logger.error(`Failed to get Zapier suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

export const zapierService = new ZapierService();