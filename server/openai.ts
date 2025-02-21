import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSOP(task: string): Promise<{
  title: string;
  content: string;
}> {
  const prompt = `Generate a detailed Standard Operating Procedure (SOP) for the following finance task: "${task}"
  
  Please provide the output as a JSON object with the following structure:
  {
    "title": "SOP title",
    "content": "Detailed step-by-step procedure"
  }
  
  Make sure the content is clear, actionable and includes all necessary steps.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
