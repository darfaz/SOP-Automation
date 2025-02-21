import OpenAI from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSOP(task: string): Promise<{
  title: string;
  description: string;
  steps: string[];
}> {
  const prompt = `Generate a detailed Standard Operating Procedure (SOP) for the following finance task: "${task}"

  Please provide the output as a JSON object with the following structure:
  {
    "title": "SOP title",
    "description": "Brief overview of the procedure",
    "steps": ["Step 1", "Step 2", "Step 3", ...]
  }

  Make sure each step is clear, actionable and includes all necessary details.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "");
}