import { Router } from "express";
import { z } from "zod";
import { insertSOPSchema } from "@shared/schema";
import { openai } from "../openai";
import { storage } from "../storage";

const router = Router();

// Input validation schema with zod
const generateSOPRequestSchema = insertSOPSchema.extend({
  industry: z.string(),
  process: z.string(),
  requirements: z.string().array(),
});

type GenerateSOPRequest = z.infer<typeof generateSOPRequestSchema>;

// Create SOP endpoint
router.post("/api/sops", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const input = generateSOPRequestSchema.parse(req.body);

    // Generate SOP steps using OpenAI
    const prompt = `Create a detailed Standard Operating Procedure (SOP) for ${input.process} in the ${input.industry} industry.
    Requirements: ${input.requirements.join(", ")}

    Generate a detailed step-by-step procedure.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert at creating detailed Standard Operating Procedures (SOPs). Format output as clear, numbered steps." 
        },
        { role: "user", content: prompt }
      ],
    });

    const steps = completion.choices[0].message.content?.split("\n").filter(step => step.trim().length > 0) || [];

    // Create SOP in database
    const sop = await storage.createSOP({
      title: input.title,
      description: input.description,
      steps: steps,
      createdBy: req.user.id,
    });

    res.status(201).json(sop);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: error.errors 
      });
    }
    next(error);
  }
});

// Get user's SOPs
router.get("/api/sops", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sops = await storage.getSOPsByUserId(req.user.id);
    res.json(sops);
  } catch (error) {
    next(error);
  }
});

export default router;