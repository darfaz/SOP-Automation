import { Router } from "express";
import { z } from "zod";
import { insertSOPSchema } from "@shared/schema";
import { generateSOP } from "../services/ai";
import { storage } from "../storage";

const router = Router();

// Input validation schema with zod
const generateSOPRequestSchema = z.object({
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

    const input = insertSOPSchema.parse(req.body);

    // Create SOP in database
    const sop = await storage.createSOP({
      ...input,
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