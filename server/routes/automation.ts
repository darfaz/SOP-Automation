import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { n8nService } from "../services/n8n";
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

    const suggestions = await n8nService.suggestAutomations(sop);
    res.json({ 
      suggestions,
      message: `Found ${suggestions.length} potential automation opportunities`
    });
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

    const schema = z.object({
      sopId: z.string(),
      connectedApps: z.array(z.string())
    });

    const validatedData = schema.parse(req.body);
    const sop = await storage.getSOP(validatedData.sopId);

    if (!sop) {
      return res.status(404).json({ message: "SOP not found" });
    }

    if (sop.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const automation = await n8nService.createAutomation(sop, validatedData.connectedApps);

    const storedAutomation = await storage.createAutomation({
      name: automation.name,
      status: automation.status,
      connectedApps: automation.connectedApps,
      sopId: automation.sopId,
      workflowId: automation.workflowId,
      userId: req.user.id
    });

    res.status(201).json(storedAutomation);
  } catch (error) {
    logger.error(`Error creating automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error);
  }
});

export default router;