import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSOP } from "./services/ai";
import { setupAuth } from "./auth";
import { insertSOPSchema, insertAutomationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // SOPs
  app.get("/api/sops", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sops = await storage.getSOPsByUserId(req.user.id);
    res.json(sops);
  });

  app.post("/api/sops/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { task } = req.body;
      if (!task || typeof task !== 'string') {
        return res.status(400).json({ message: "Task description is required" });
      }

      const generated = await generateSOP(task);
      const sop = await storage.createSOP({
        ...generated,
        createdBy: req.user.id,
      });
      res.json(sop);
    } catch (error) {
      console.error('Error generating SOP:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate SOP" 
      });
    }
  });

  // Automations
  app.get("/api/automations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const automations = await storage.getAutomationsByUserId(req.user.id);
    res.json(automations);
  });

  app.post("/api/automations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertAutomationSchema.parse(req.body);
    const automation = await storage.createAutomation({
      ...data,
      userId: req.user.id,
    });
    res.json(automation);
  });

  const httpServer = createServer(app);
  return httpServer;
}