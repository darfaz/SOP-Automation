import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSOP } from "./openai";
import { setupAuth } from "./auth";
import { insertWorkflowSchema, insertSopSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Workflows
  app.get("/api/workflows", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workflows = await storage.getWorkflowsByUserId(req.user.id);
    res.json(workflows);
  });

  app.post("/api/workflows", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertWorkflowSchema.parse(req.body);
    const workflow = await storage.createWorkflow({
      ...data,
      userId: req.user.id,
      status: "pending",
    });
    res.json(workflow);
  });

  // SOPs
  app.get("/api/sops", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sops = await storage.getSOPsByUserId(req.user.id);
    res.json(sops);
  });

  app.post("/api/sops/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { task } = req.body;
    const generated = await generateSOP(task);
    const sop = await storage.createSOP({
      ...generated,
      userId: req.user.id,
    });
    res.json(sop);
  });

  const httpServer = createServer(app);
  return httpServer;
}
