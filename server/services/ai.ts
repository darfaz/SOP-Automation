import { openai } from "../openai";
import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../logger";

// Configure axios retry logic
axiosRetry(axios, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status >= 500;
  }
});

interface GenerateSOPResponse {
  title: string;
  description: string;
  steps: string[];
}

export async function generateSOP(description: string): Promise<GenerateSOPResponse> {
  try {
    const systemPrompt = `You are an expert at creating detailed Standard Operating Procedures (SOPs) for finance tasks.
    Generate a response in the following JSON format:
    {
      "title": "Clear title for the SOP",
      "description": "Brief overview of the procedure",
      "steps": ["Step 1: Action", "Step 2: Action", ...]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        { 
          role: "user", 
          content: description 
        }
      ]
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(response.choices[0].message.content);

    // Validate response structure
    if (!result.title || !result.description || !Array.isArray(result.steps)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return {
      title: result.title,
      description: result.description,
      steps: result.steps.map((step: string) => step.trim()).filter(Boolean)
    };
  } catch (error) {
    logger.error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}