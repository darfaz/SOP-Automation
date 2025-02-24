import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  log("[auth] Comparing passwords");
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  log(`[auth] Password comparison result: ${result}`);
  return result;
}

export function setupAuth(app: Express) {
  log("[auth] Setting up authentication");

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        log(`[auth] Attempting login for user: ${username}`);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          log(`[auth] User not found: ${username}`);
          return done(null, false);
        }

        log("[auth] User found, comparing passwords");
        const isValid = await comparePasswords(password, user.password);

        if (!isValid) {
          log(`[auth] Invalid password for user: ${username}`);
          return done(null, false);
        }

        log(`[auth] Login successful for user: ${username}`);
        return done(null, user);
      } catch (err) {
        log(`[auth] Error during authentication: ${err}`);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    log(`[auth] Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      log(`[auth] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      log(`[auth] Error deserializing user: ${err}`);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      log(`[auth] Registration attempt for username: ${req.body.username}`);
      const existingUser = await storage.getUserByUsername(req.body.username);

      if (existingUser) {
        log(`[auth] Username already exists: ${req.body.username}`);
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      log(`[auth] User registered successfully: ${user.id}`);
      req.login(user, (err) => {
        if (err) {
          log(`[auth] Error logging in after registration: ${err}`);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (err) {
      log(`[auth] Error during registration: ${err}`);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    log(`[auth] Login attempt with body:`, {
      username: req.body.username,
      hasPassword: !!req.body.password
    });

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        log(`[auth] Error during login: ${err}`);
        return next(err);
      }
      if (!user) {
        log("[auth] Login failed - invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          log(`[auth] Error establishing session: ${err}`);
          return next(err);
        }
        log(`[auth] Login successful for user: ${user.id}`);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    log("[auth] Logout request");
    req.logout((err) => {
      if (err) {
        log(`[auth] Error during logout: ${err}`);
        return next(err);
      }
      log("[auth] Logout successful");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    log(`[auth] User check - authenticated: ${req.isAuthenticated()}`);
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}