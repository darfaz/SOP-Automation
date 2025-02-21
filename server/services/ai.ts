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
    Format your response to match exactly:
    Title: <title>
    Description: <description>
    Steps:
    1. <step1>
    2. <step2>
    etc.`;

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

    const content = response.choices[0].message.content;

    // Parse the formatted response
    const titleMatch = content.match(/Title: (.+)/);
    const descriptionMatch = content.match(/Description: (.+)/);
    const stepsMatch = content.match(/Steps:\n((?:\d+\. .+\n?)+)/);

    if (!titleMatch || !descriptionMatch || !stepsMatch) {
      throw new Error("Invalid response format from OpenAI");
    }

    const steps = stepsMatch[1]
      .split('\n')
      .filter(step => step.trim())
      .map(step => step.replace(/^\d+\.\s*/, '').trim());

    return {
      title: titleMatch[1].trim(),
      description: descriptionMatch[1].trim(),
      steps: steps
    };
  } catch (error) {
    logger.error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}