import { IStorage } from "./storage";
import createMemoryStore from "memorystore";
import session from "express-session";
import type { User, SOP, Automation, InsertUser, InsertSOP, InsertAutomation } from "@shared/schema";
import crypto from 'crypto';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // SOPs
  getSOPsByUserId(userId: string): Promise<SOP[]>;
  createSOP(sop: InsertSOP & { createdBy: string }): Promise<SOP>;

  // Automations
  getAutomationsByUserId(userId: string): Promise<Automation[]>;
  createAutomation(automation: InsertAutomation & { userId: string }): Promise<Automation>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sops: Map<string, SOP>;
  private automations: Map<string, Automation>;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.sops = new Map();
    this.automations = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSOPsByUserId(userId: string): Promise<SOP[]> {
    return Array.from(this.sops.values()).filter(
      (sop) => sop.createdBy === userId,
    );
  }

  async createSOP(sop: InsertSOP & { createdBy: string }): Promise<SOP> {
    const id = crypto.randomUUID();
    const newSOP = {
      ...sop,
      id,
      createdAt: new Date(),
    };
    this.sops.set(id, newSOP);
    return newSOP;
  }

  async getAutomationsByUserId(userId: string): Promise<Automation[]> {
    return Array.from(this.automations.values()).filter(
      (automation) => automation.userId === userId,
    );
  }

  async createAutomation(automation: InsertAutomation & { userId: string }): Promise<Automation> {
    const id = crypto.randomUUID();
    const newAutomation = {
      ...automation,
      id,
      createdAt: new Date(),
    };
    this.automations.set(id, newAutomation);
    return newAutomation;
  }
}

export const storage = new MemStorage();