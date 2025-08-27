import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

console.log("Server starting...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ------------------------
// ✅ Request/Response logger for API routes
// ------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 200) logLine = logLine.slice(0, 199) + "…";
      console.log(logLine);
    }
  });

  next();
});

// ------------------------
// ✅ Register API routes
// ------------------------
registerRoutes(app);

// ------------------------
// ✅ Serve React/Vite frontend
// ------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Match your Vite config outDir
const frontendDist = path.join(__dirname, "../dist/public");

// Serve static frontend files
app.use(express.static(frontendDist));

// Optional: root route if no frontend yet
app.get("/", (_req, res) => {
  res.send("🚀 API server is running. Try /api/health");
});

// Catch-all for frontend routing (React SPA)
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// ------------------------
// ✅ Central error handler
// ------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error handler caught:", err);
  res.status(status).json({ message });
});

// ------------------------
// ✅ Start HTTP server
// ------------------------
const server = http.createServer(app);
const port = parseInt(process.env.PORT || "5000", 10);
const host = process.env.HOST || "127.0.0.1";

server.listen(port, host, () => {
  console.log(`🚀 Server running at http://${host}:${port}`);
});

export default app;
import { db } from "./db";
import { users } from "@shared/schema";

db.select().from(users).limit(1); // test query to verify db connection
import { z } from "zod";          // test query to verify db connection (also tests shared/schema import)
import { relations } from "drizzle-orm";  // test query to verify db connection (also tests shared/schema import)
import bcrypt from "bcrypt";      // test query to verify db connection (also tests routes import)
import { eq } from "drizzle-orm"; // test query to verify db connection (also tests routes import)
import { db } from "./db";        // test query to verify db connection (also tests routes import)
import { users } from "@shared/schema"; // test query to verify db connection (also tests routes import)