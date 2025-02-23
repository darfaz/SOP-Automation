import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { zapierService } from "../services/zapier";
import { logger } from "../logger";

const router = Router();

// Get automation suggestions for a SOP
router.get("/api/automations/suggest/:sopId", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sopId = req.params.sopId;
    const sop = await storage.getSOP(sopId);
    
    if (!sop) {
      return res.status(404).json({ message: "SOP not found" });
    }

    if (sop.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const suggestions = await zapierService.suggestAutomations(sop);
    res.json(suggestions);
  } catch (error) {
    logger.error(`Error suggesting automations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error);
  }
});

// Create automation from suggestion
router.post("/api/automations", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const automation = await storage.createAutomation({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json(automation);
  } catch (error) {
    logger.error(`Error creating automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error);
  }
});

export default router;
