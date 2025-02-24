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
    // Fix the optional chaining for error.response?.status
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

interface GenerateSOPResponse {
  title: string;
  description: string;
  steps: string[];
}

export async function generateSOP(description: string): Promise<GenerateSOPResponse> {
  try {
    const systemPrompt = `You are an expert at creating detailed Standard Operating Procedures (SOPs).
    Generate a comprehensive SOP with the following format:
    Title: [A clear, concise title for the SOP]
    Description: [A brief overview of what this SOP accomplishes]
    Steps:
    1. [First step]
    2. [Second step]
    etc.`;

    const userPrompt = `Create a detailed SOP for the following task: ${description}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        { 
          role: "user", 
          content: userPrompt
        }
      ],
      temperature: 0.7
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in OpenAI response");
    }

    const content = response.choices[0].message.content;

    // More robust parsing with flexible regex
    const titleMatch = content.match(/Title:\s*(.+?)(?=\n|$)/i);
    const descriptionMatch = content.match(/Description:\s*(.+?)(?=\n|$)/i);
    const stepsContent = content.split(/Steps:/i)[1];

    if (!titleMatch || !descriptionMatch || !stepsContent) {
      logger.error(`Invalid response format from OpenAI: ${content}`);
      throw new Error("Invalid response format from OpenAI");
    }

    const steps = stepsContent
      .split(/\n/)
      .filter(line => line.trim().match(/^\d+\./))
      .map(step => step.replace(/^\d+\.\s*/, '').trim());

    if (steps.length === 0) {
      throw new Error("No steps found in OpenAI response");
    }

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