import { Express, Request, Response } from "express";
import { db } from "./db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export function registerRoutes(app: Express) {
  // ------------------------
  // ✅ Health check
  // ------------------------
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "OK", message: "Server is running" });
  });

  // ------------------------
  // ✅ Register user
  // ------------------------
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        return res.status(400).json({ message: "Missing request body" });
      }

      const { name, email, password, address, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const parseResult = insertUserSchema.safeParse({
        name,
        email,
        passwordHash,
        address,
        role: role ?? "user",
      });

      if (!parseResult.success) {
        console.error("Validation errors:", parseResult.error.flatten());
        return res.status(400).json({
          message: "Validation failed",
          errors: parseResult.error.flatten(),
        });
      }

      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(409).json({ message: "User already exists" });
      }

      const [inserted] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          address,
          role: role ?? "user",
        })
        .returning();

      return res.status(201).json({
        message: "Account created successfully",
        user: {
          id: inserted.id,
          name: inserted.name,
          email: inserted.email,
          role: inserted.role,
        },
      });
    } catch (err) {
      console.error("❌ Error in /api/auth/signup:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown server error";
      return res.status(500).json({
        message: "Internal server error",
        error: errorMessage,
      });
    }
  });

  // ------------------------
  // ✅ Sign in user (ADDED)
  // ------------------------
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        return res.status(400).json({ message: "Missing request body" });
      }

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Look up user
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = existing[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Successful login — send back user info
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("❌ Error in /api/auth/login:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown server error";
      return res.status(500).json({
        message: "Internal server error",
        error: errorMessage,
      });
    }
  });

  // ------------------------
  // ✅ Catch-all for undefined API routes
  // ------------------------
  app.use("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ message: "API route not found" });
  });
}

export default registerRoutes;
