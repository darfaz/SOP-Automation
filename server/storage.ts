import { IStorage } from "./storage";
import createMemoryStore from "memorystore";
import session from "express-session";
import type { User, Workflow, SOP, InsertUser, InsertWorkflow, InsertSOP } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workflows
  getWorkflowsByUserId(userId: number): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow & { userId: number; status: string }): Promise<Workflow>;
  
  // SOPs
  getSOPsByUserId(userId: number): Promise<SOP[]>;
  createSOP(sop: InsertSOP & { userId: number }): Promise<SOP>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private sops: Map<number, SOP>;
  private nextId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.sops = new Map();
    this.nextId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.userId === userId,
    );
  }

  async createWorkflow(
    workflow: InsertWorkflow & { userId: number; status: string },
  ): Promise<Workflow> {
    const id = this.nextId++;
    const newWorkflow = {
      ...workflow,
      id,
      createdAt: new Date(),
    };
    this.workflows.set(id, newWorkflow);
    return newWorkflow;
  }

  async getSOPsByUserId(userId: number): Promise<SOP[]> {
    return Array.from(this.sops.values()).filter(
      (sop) => sop.userId === userId,
    );
  }

  async createSOP(sop: InsertSOP & { userId: number }): Promise<SOP> {
    const id = this.nextId++;
    const newSOP = {
      ...sop,
      id,
      createdAt: new Date(),
    };
    this.sops.set(id, newSOP);
    return newSOP;
  }
}

export const storage = new MemStorage();
